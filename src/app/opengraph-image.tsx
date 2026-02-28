import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'News Pulse - News before it\'s news';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            display: 'flex',
          }}
        />

        {/* Accent glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
          }}
        >
          <span style={{ color: 'white', fontSize: '40px', fontWeight: 700 }}>P</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-1px',
            display: 'flex',
          }}
        >
          News Pulse
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#3b82f6',
            marginTop: '8px',
            fontWeight: 500,
            display: 'flex',
          }}
        >
          News before it&apos;s news
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '48px',
            padding: '16px 40px',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#3b82f6', fontSize: '28px', fontWeight: 700 }}>600+</span>
            <span style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Sources</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#10b981', fontSize: '28px', fontWeight: 700 }}>6</span>
            <span style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Regions</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 700 }}>24/7</span>
            <span style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Monitoring</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#ef4444', fontSize: '28px', fontWeight: 700 }}>AI</span>
            <span style={{ color: '#9ca3af', fontSize: '14px', marginTop: '4px' }}>Briefings</span>
          </div>
        </div>

        {/* Bottom tag */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            color: '#6b7280',
            fontSize: '14px',
            display: 'flex',
          }}
        >
          Real-time global intelligence dashboard
        </div>
      </div>
    ),
    { ...size }
  );
}
