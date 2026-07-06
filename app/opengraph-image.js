import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#010102',
          color: '#f7f8f8',
          padding: '72px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            width: 76,
            height: 76,
            borderRadius: 16,
            background: '#5e6ad2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 34,
            fontWeight: 700,
            marginBottom: 40,
          }}
        >
          PDF
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -3 }}>
          PDF Section
        </div>
        <div style={{ fontSize: 34, color: '#d0d6e0', marginTop: 20, maxWidth: 820 }}>
          Free browser-based tools to merge, split, edit, convert, and manage PDFs.
        </div>
      </div>
    ),
    size
  );
}