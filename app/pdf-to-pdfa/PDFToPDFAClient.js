'use client';

import Link from 'next/link';
import ToolPageLayout from '@/components/ToolPageLayout';

// PDF/A conversion is paused. The previous version only changed the title and
// producer metadata, so its output was not a valid PDF/A file. Bring the tool
// back only once its output passes a PDF/A validator such as veraPDF.
export default function PDFToPDFAClient() {
  return (
    <ToolPageLayout
      title="PDF to PDF/A"
      description="PDF/A conversion is paused while we rebuild it."
      icon="check"
      iconColor="var(--tool-convert-from)"
    >
      <div
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--hairline-strong)',
          borderRadius: 'var(--rounded-lg)',
          padding: 'var(--space-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
          color: 'var(--ink-muted)',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--ink)', margin: 0 }}>
          This tool is paused
        </h2>
        <p style={{ margin: 0 }}>
          A real PDF/A file needs embedded fonts, a color profile and PDF/A metadata, and it should pass a
          PDF/A validator. This tool didn&apos;t do that yet, so we&apos;ve switched it off rather than give you a
          file that an archive or filing system might reject.
        </p>
        <p style={{ margin: 0 }}>
          If you need PDF/A now, use software that converts to PDF/A, then check the result with a validator
          such as veraPDF.
        </p>
        <p style={{ margin: 0 }}>
          <Link href="/tools" style={{ color: 'var(--primary)', fontWeight: '600' }}>
            Browse the other tools
          </Link>
        </p>
      </div>
    </ToolPageLayout>
  );
}
