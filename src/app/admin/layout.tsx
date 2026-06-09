import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';

// Server-side gate for all /admin routes. Runs on the Node runtime so it can
// validate the session against the database. Edge middleware can only check
// for cookie presence. A forged or expired session
// cookie is rejected here before any admin UI is rendered.
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!isAdminEmail(session?.user?.email)) {
    redirect('/');
  }

  return <>{children}</>;
}
