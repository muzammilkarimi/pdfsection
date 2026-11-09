import Link from 'next/link';
import Image from 'next/image';
import { ToolIcon } from '@/components/Icons';
import { buildToolMetadata, buildOrganizationJsonLd, buildBreadcrumbJsonLd } from '@/lib/seoUtils';

export const metadata = buildToolMetadata({
  title: 'About PDF Section — Private PDF Tools That Run in Your Browser',
  description:
    'Learn about PDF Section and founder Muzammil Ahmad Karimi. Built at IIT Patna to eliminate file privacy risks and offer free local browser PDF tools.',
  route: '/about',
  keywords: ['About PDF Section', 'Muzammil Ahmad Karimi', 'private PDF tools', 'IIT Patna PDF section'],
});

export default function AboutPage() {
  const jsonLd = [
    buildOrganizationJsonLd(),
    buildBreadcrumbJsonLd({ name: 'About Us', route: '/about' }),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="main page-scroll">
        <div className="about-page container">
          <nav className="tool-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">About</span>
          </nav>

          <section className="about-hero">
            <div className="about-photo-column">
              <div className="about-photo">
                <Image
                  src="/founder.png"
                  alt="Muzammil A Karimi — Founder of PDF Section"
                  fill
                  priority
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className="about-social">
                <a href="https://github.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="about-social-link" title="GitHub">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                </a>
                <a href="https://www.linkedin.com/in/makarimi01/" target="_blank" rel="noopener noreferrer" className="about-social-link" title="LinkedIn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></svg>
                </a>
                <a href="https://x.com/muzammilkarimi" target="_blank" rel="noopener noreferrer" className="about-social-link" title="Twitter / X">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                </a>
                <a href="https://www.instagram.com/muzammilkarimiiiii/" target="_blank" rel="noopener noreferrer" className="about-social-link" title="Instagram">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                </a>
              </div>
            </div>

            <div className="about-intro">
              <span className="about-eyebrow">Meet the founder</span>
              <h1>Muzammil Ahmad Karimi</h1>
              <p>
                As an <strong>IIT Patna alumnus</strong>, I am building <strong>PDF Section</strong> from a simple frustration: handling PDF documents shouldn&apos;t require uploading sensitive files to remote servers, navigating ad-filled platforms, or paying for expensive software.
              </p>
              <p>
                PDF Section exists so people can manage their documents locally, securely, and completely free—right inside their browser.
              </p>
            </div>
          </section>

          <section className="about-cards" aria-label="What PDF Section stands for">
            <div className="about-card">
              <span className="about-card-icon"><ToolIcon name="lock" size={20} /></span>
              <h2>Everyday Security</h2>
              <p>Sensitive documents move fast. Uploading them to remote servers creates unnecessary security risks. We process files locally.</p>
            </div>
            <div className="about-card">
              <span className="about-card-icon"><ToolIcon name="zap" size={20} /></span>
              <h2>Local Performance</h2>
              <p>Runs 100% inside your local browser memory. Files are loaded, compiled, and edited instantly without server wait times.</p>
            </div>
            <div className="about-card">
              <span className="about-card-icon"><ToolIcon name="check" size={20} /></span>
              <h2>Productivity Focused</h2>
              <p>Tailored for students, founders, developers, creators, and anyone who works with documents daily. Zero friction.</p>
            </div>
          </section>

          <section className="about-story">
            <h2>Why We Built PDF Section</h2>
            <p>
              The modern web is full of friction. When you need to quickly sign a contract, merge invoices, or compress a file, you are forced to upload your sensitive files to remote servers, deal with pop-up ads, or pay for expensive subscription services. For people who handle documents rapidly, this is a bottleneck.
            </p>
            <p>
              We built PDF Section to bridge that gap. By combining local PDF compiling engines with local browser execution, PDF Section allows you to process documents instantly—directly in your browser window. Your files are never sent to our servers; anything kept for later stays in your own browser, and you can delete it any time.
            </p>
          </section>

          <section className="about-philosophy">
            <h2>Our Design Philosophy</h2>
            <div className="about-tiles">
              <div className="home-promise">
                <strong>Privacy Conscious</strong>
                <span>Your data belongs to you. Files are processed entirely inside your browser and never leave your device.</span>
              </div>
              <div className="home-promise">
                <strong>Frictionless Integration</strong>
                <span>No account registrations, no payment prompts, and no daily limits. PDF Section is built to get the job done instantly.</span>
              </div>
              <div className="home-promise">
                <strong>For Fast Thinkers</strong>
                <span>We design specifically for people who value speed, efficiency, and a clean workspace free from visual clutter or intrusive ads.</span>
              </div>
            </div>
          </section>

          <section className="about-cta">
            <div>
              <h2>Start Managing Documents Securely</h2>
              <p>Experience local, secure, and instant PDF processing with zero compromises.</p>
            </div>
            <Link href="/tools" className="btn btn-primary">Browse all tools</Link>
          </section>
        </div>
      </main>
    </>
  );
}
