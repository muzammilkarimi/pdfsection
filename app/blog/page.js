'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog';

export default function BlogListPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Privacy', 'Security', 'Tech Stack'];

  const filteredPosts = activeCategory === 'All' 
    ? BLOG_POSTS 
    : BLOG_POSTS.filter(post => post.category === activeCategory);

  const featuredPost = BLOG_POSTS[0];
  const remainingPosts = BLOG_POSTS.slice(1);

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at 10% 20%, rgba(94, 106, 210, 0.04), transparent 50%), radial-gradient(circle at 90% 80%, rgba(254, 203, 0, 0.02), transparent 50%)' }}>
      <div className="container" style={{ maxWidth: '960px' }}>
        
        {/* Back Button */}
        <Link href="/" className="btn btn-secondary btn-icon" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px' }}>
          ◀ Back to workspace
        </Link>

        {/* Page Header */}
        <header style={{ marginBottom: 'var(--space-xxl)', textAlign: 'center' }}>
          <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: '700', letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: '12px' }}>RESOURCES & INSIGHTS</span>
          <h1 className="display-sm" style={{ fontWeight: '800', marginTop: 'var(--space-xs)', marginBottom: 'var(--space-md)', fontSize: '40px', letterSpacing: '-1px' }}>
            The Privacy-First Blog
          </h1>
          <p className="body-lg ink-muted" style={{ maxWidth: '640px', margin: '0 auto', lineHeight: '1.6', fontSize: '16px' }}>
            Deep dives into client-side security, local PDF compilation, and how standard cloud-based PDF processors compromise your document privacy.
          </p>
        </header>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-xl)' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                border: '1px solid var(--hairline-strong)',
                backgroundColor: activeCategory === cat ? 'var(--primary)' : 'var(--surface-1)',
                color: activeCategory === cat ? '#ffffff' : 'var(--ink-muted)',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all var(--duration-fast) var(--ease-default)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dynamic Display Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          
          {/* Render Featured Post (only when 'All' is active) */}
          {activeCategory === 'All' && featuredPost && (
            <article 
              className="seo-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                padding: 'var(--space-xl)',
                backgroundColor: 'var(--surface-1)',
                border: '1.5px solid var(--hairline-strong)',
                borderRadius: 'var(--rounded-lg)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.02)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div 
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  height: '4px', 
                  background: 'linear-gradient(90deg, var(--primary), var(--brand-yellow))' 
                }} 
              />
              
              {/* Meta tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: '700', 
                    textTransform: 'uppercase', 
                    color: 'var(--primary)',
                    backgroundColor: 'color-mix(in srgb, var(--primary) 12%, var(--surface-2))',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px'
                  }}
                >
                  FEATURED ARTICLE • {featuredPost.category}
                </span>
                <span className="caption ink-subtle" style={{ fontSize: '12px' }}>{featuredPost.date}</span>
                <span style={{ color: 'var(--hairline-strong)' }}>•</span>
                <span className="caption ink-subtle" style={{ fontSize: '12px' }}>{featuredPost.readTime}</span>
              </div>

              {/* Title & Description */}
              <h2 className="display-sm" style={{ fontWeight: '800', color: 'var(--ink)', fontSize: '26px', lineHeight: '1.3' }}>
                <Link href={`/blog/${featuredPost.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {featuredPost.title}
                </Link>
              </h2>
              
              <p className="body-md ink-muted" style={{ lineHeight: '1.6', fontSize: '15px' }}>
                {featuredPost.description}
              </p>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)', borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-sm)' }}>
                <span className="caption ink-subtle" style={{ fontSize: '12px' }}>
                  Published {featuredPost.date}
                </span>
                
                <Link href={`/blog/${featuredPost.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}>
                  Read Full Article
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </article>
          )}

          {/* Grid Layout for other posts */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
            {(activeCategory === 'All' ? remainingPosts : filteredPosts).map((post) => (
              <article 
                key={post.slug}
                className="seo-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-sm)',
                  padding: 'var(--space-lg)',
                  backgroundColor: 'var(--surface-1)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 'var(--rounded-lg)',
                  transition: 'transform var(--duration-fast) var(--ease-default), border-color var(--duration-fast)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.01)',
                  minHeight: '260px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--hairline-strong)';
                }}
              >
                {/* Meta tags row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flexWrap: 'wrap' }}>
                  <span 
                    style={{ 
                      fontSize: '9px', 
                      fontWeight: '700', 
                      textTransform: 'uppercase', 
                      color: 'var(--primary)',
                      backgroundColor: 'color-mix(in srgb, var(--primary) 10%, var(--surface-2))',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {post.category}
                  </span>
                  <span className="caption ink-subtle" style={{ fontSize: '11px', marginLeft: '4px' }}>{post.date}</span>
                </div>

                {/* Title & Description */}
                <h3 className="body-lg" style={{ fontWeight: '750', color: 'var(--ink)', fontSize: '17px', lineHeight: '1.4', marginTop: '4px' }}>
                  <Link href={`/blog/${post.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {post.title}
                  </Link>
                </h3>
                
                <p className="caption ink-muted" style={{ lineHeight: '1.5', fontSize: '13px', flex: 1 }}>
                  {post.description}
                </p>

                {/* Read CTA */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)', borderTop: '1px solid var(--hairline)', paddingTop: 'var(--space-xs)' }}>
                  <span className="caption ink-subtle" style={{ fontSize: '11px' }}>{post.readTime}</span>
                  
                  <Link href={`/blog/${post.slug}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--primary)', textDecoration: 'none' }}>
                    Read Post
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </section>

        </div>

      </div>
    </main>
  );
}
