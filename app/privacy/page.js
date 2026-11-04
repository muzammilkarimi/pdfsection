import Link from 'next/link';
import { buildToolMetadata } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'Privacy Policy — 100% Client-Side PDF Processing',
  description: 'PDF Section guarantees complete document privacy. All PDF operations run locally in your browser with zero file uploads or server storage.',
  route: '/privacy',
  keywords: ['PDF Section privacy policy', 'client side PDF security', 'private PDF editor policy'],
});

export default function PrivacyPolicyPage() {
  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at top right, rgba(94, 106, 210, 0.02), transparent 40%)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Back Button */}
        <Link href="/" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px', width: 'fit-content' }}>
          ◀ Back to workspace
        </Link>

        {/* Header */}
        <header style={{ marginBottom: 'var(--space-xl)' }}>
          <h1 className="display-sm" style={{ fontWeight: '800', marginBottom: 'var(--space-xs)' }}>
            Privacy Policy
          </h1>
          <p className="caption ink-subtle">Last updated: November 3, 2026</p>
        </header>

        {/* Content */}
        <article className="body-sm ink-muted" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', lineHeight: '1.6', fontSize: '14.5px' }}>
          
          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>1. Our Commitment to Your Privacy</h2>
            <p>
              At <strong>PDF Section</strong>, we prioritize document privacy above everything else. Unlike traditional online PDF tools that require uploading your private files to remote cloud servers, PDF Section utilizes a <strong>100% client-side architecture</strong>. This means your files never leave your device, with one exception: the <strong>Translate PDF</strong> tool (see below).
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>2. How We Handle Your Files</h2>
            <p>
              All document operations—including merging, splitting, compressing, organizing, signing, and converting—are computed locally inside your web browser using HTML5, WebAssembly, and local JavaScript libraries (such as pdf-lib and PDF.js). 
            </p>
            <ul style={{ margin: 'var(--space-xs) 0 0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>❌ <strong>No Uploads</strong>: Your documents are never transmitted over the internet to our servers.</li>
              <li>❌ <strong>No Logs</strong>: We do not capture, cache, inspect, or save any text content, passwords, metadata, or images from your files.</li>
              <li>❌ <strong>No Server Storage</strong>: Your documents are never stored on our servers. Your browser keeps only the most recent finished file, on your own device, so the download page still works after a refresh (see section 4).</li>
            </ul>
            <p style={{ marginTop: 'var(--space-xs)' }}>
              <strong>Exception — Translate PDF:</strong> this tool extracts text from your PDF in your browser and sends that text, in short chunks, to the third-party MyMemory translation API (api.mymemory.translated.net) to obtain the translation. The PDF file itself is not uploaded, but its text is. Do not use this tool for confidential documents. All other tools stay fully local.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>3. Information We Collect</h2>
            <p>
              We do not collect personal information. We do not require account registration, email addresses, or phone numbers to use PDF Section.
            </p>
            <p style={{ marginTop: 'var(--space-xs)' }}>
              To monitor application reliability and design quality, we use standard, anonymous analytics providers (such as Vercel Analytics, and Google Analytics / Google Tag Manager when enabled). These platforms only track non-personally identifiable information, such as page views, button clicks, performance speed, and browser user-agents.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>4. Storage in Your Browser</h2>
            <p>
              Everything below is saved on your own device, inside your browser. None of it is sent to us.
            </p>
            <ul style={{ margin: 'var(--space-xs) 0 0 var(--space-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>
                <strong>Your most recent result</strong>: when a tool finishes, the output file is saved in your browser&apos;s IndexedDB so the download page keeps working if you refresh it. Only one file is kept; it is replaced by your next result and is no longer offered after one hour. It stays in your browser until it is replaced, you choose to start over from the download page, or you clear this site&apos;s data in your browser settings.
              </li>
              <li>
                <strong>Your files</strong>: unless you turn it off in <Link href="/settings">Settings</Link>, finished files are also saved in your browser&apos;s IndexedDB so you can find them again on the <Link href="/files">Your files</Link> page. They are deleted after the period you choose (7 days unless you change it, and never more than the 50 newest files). You can delete them at any time from either page. Anyone using the same browser profile can see them.
              </li>
              <li>
                <strong>Your signature</strong>: if you tick &quot;Remember this signature&quot; in Sign PDF, the signature (and initials) image is kept in Local Storage so you don&apos;t have to make it again. Remove it any time with &quot;Forget saved signature&quot; in <Link href="/settings">Settings</Link>.
              </li>
              <li>
                <strong>Preferences</strong>: Local Storage holds your theme choice, your Settings choices, and whether you have dismissed a seasonal banner.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>5. Third-Party Links</h2>
            <p>
              Our website may contain links to external sites (such as GitHub, LinkedIn, or Twitter). We are not responsible for the privacy practices of external web platforms.
            </p>
          </section>

          <section>
            <h2 className="body-md" style={{ fontWeight: '700', color: 'var(--ink)', marginBottom: 'var(--space-xs)' }}>6. Changes to this Policy</h2>
            <p>
              We reserve the right to update this Privacy Policy at any time. Any changes will be posted directly on this page with an updated timestamp.
            </p>
          </section>

          <section style={{ borderTop: '1px solid var(--hairline-strong)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            <p>
              If you have any questions about this privacy statement, please feel free to reach out to the founder on Twitter / X: 
              {' '}
              <a href="https://x.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="link-primary" style={{ fontWeight: '500' }}>
                @muzammilkarimi
              </a>.
            </p>
          </section>

        </article>

      </div>
    </main>
  );
}
