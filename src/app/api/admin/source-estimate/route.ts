import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { ADMIN_EMAILS } from '@/lib/admin';
import * as fs from 'fs';
import * as path from 'path';

async function getAdminSession(): Promise<{ email: string } | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user?.email) return null;
    if (!ADMIN_EMAILS.includes(session.user.email.toLowerCase())) return null;
    return { email: session.user.email };
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/source-estimate
 * Writes estimatedPPD + estimatedAt to sources-clean.ts for a given source.
 * Only works in dev mode (filesystem is read-only in production).
 */
export async function POST(request: Request) {
  const clientIp = getClientIp(request);
  const rateCheck = checkRateLimit(`admin-source-estimate:${clientIp}`, { maxRequests: 30 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { sourceId, estimatedPPD } = body;

    if (!sourceId || typeof sourceId !== 'string') {
      return NextResponse.json({ error: 'sourceId is required' }, { status: 400 });
    }
    if (typeof estimatedPPD !== 'number' || estimatedPPD < 0) {
      return NextResponse.json({ error: 'estimatedPPD must be a non-negative number' }, { status: 400 });
    }

    const sourcesPath = path.resolve(process.cwd(), 'src/lib/sources-clean.ts');

    let content: string;
    try {
      content = fs.readFileSync(sourcesPath, 'utf-8');
    } catch {
      return NextResponse.json({ error: 'Cannot read sources file (production mode?)' }, { status: 500 });
    }

    // Find the source block by its id
    const idPattern = `id: '${sourceId}'`;
    const idIdx = content.indexOf(idPattern);
    if (idIdx === -1) {
      return NextResponse.json({ error: `Source ${sourceId} not found in sources-clean.ts` }, { status: 404 });
    }

    // Find the end of this source block
    const blockEnd = content.indexOf('},', idIdx);
    if (blockEnd === -1) {
      return NextResponse.json({ error: 'Could not parse source block' }, { status: 500 });
    }

    let block = content.substring(idIdx, blockEnd);
    const today = new Date().toISOString().split('T')[0];

    // Update or insert estimatedPPD
    const estPpdRegex = /estimatedPPD:\s*[\d.]+/;
    if (estPpdRegex.test(block)) {
      block = block.replace(estPpdRegex, `estimatedPPD: ${estimatedPPD}`);
    } else {
      // Insert after baselineMeasuredAt line, or after baselinePPD line, or before the closing
      const insertAfter = /baselineMeasuredAt:\s*'[^']*',/;
      const insertAfterPpd = /baselinePPD:\s*[\d.]+,/;
      if (insertAfter.test(block)) {
        block = block.replace(insertAfter, (match) => `${match}\n    estimatedPPD: ${estimatedPPD},`);
      } else if (insertAfterPpd.test(block)) {
        block = block.replace(insertAfterPpd, (match) => `${match}\n    estimatedPPD: ${estimatedPPD},`);
      } else {
        // Last resort: insert before the end of the block
        block = block.trimEnd() + `\n    estimatedPPD: ${estimatedPPD},`;
      }
    }

    // Update or insert estimatedAt
    const estAtRegex = /estimatedAt:\s*'[^']*'/;
    if (estAtRegex.test(block)) {
      block = block.replace(estAtRegex, `estimatedAt: '${today}'`);
    } else {
      // Insert after estimatedPPD
      block = block.replace(
        /estimatedPPD:\s*[\d.]+,/,
        (match) => `${match}\n    estimatedAt: '${today}',`
      );
    }

    content = content.substring(0, idIdx) + block + content.substring(blockEnd);

    try {
      fs.writeFileSync(sourcesPath, content, 'utf-8');
    } catch {
      return NextResponse.json({ error: 'Cannot write sources file (production mode?)' }, { status: 500 });
    }

    return NextResponse.json({ success: true, sourceId, estimatedPPD, estimatedAt: today });
  } catch (error) {
    console.error('[Source Estimate API] Error:', error);
    return NextResponse.json({ error: 'Failed to save estimate' }, { status: 500 });
  }
}
