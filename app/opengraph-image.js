import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'PDF Section — Private Local PDF Tools';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 10% 20%, #171626, #0e0d15 90%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        {/* Brand Kicker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(94, 106, 210, 0.15)',
            border: '1px solid rgba(94, 106, 210, 0.3)',
            borderRadius: '20px',
            padding: '6px 16px',
            fontSize: '14px',
            color: '#a5b4fc',
            marginBottom: '20px',
          }}
        >
          🛡️ 100% PRIVATE CLIENT-SIDE PROCESSING
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '64px',
            fontWeight: '800',
            letterSpacing: '-2px',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          PDF <span style={{ color: '#fbbf24' }}>Section</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '780px',
            lineHeight: '1.4',
          }}
        >
          Merge, Split, Compress, Edit, Sign & Convert PDFs without uploading files to remote servers.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}