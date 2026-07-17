import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog';

// Pre-render blog slug routes statically
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

// Generate SEO metadata dynamically for search engines
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  // Inline code and bold text renderer
  const renderParagraphText = (str) => {
    let parts = [];
    let regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const segment = match[0];
      if (segment.startsWith('**') && segment.endsWith('**')) {
        parts.push(<strong key={match.index} style={{ color: 'var(--ink)', fontWeight: '600' }}>{segment.slice(2, -2)}</strong>);
      } else if (segment.startsWith('`') && segment.endsWith('`')) {
        parts.push(
          <code 
            key={match.index} 
            style={{ 
              fontFamily: 'var(--font-jetbrains)', 
              backgroundColor: 'var(--surface-2)', 
              padding: '2px 6px', 
              borderRadius: '4px',
              fontSize: '13.5px',
              color: 'var(--primary)',
              border: '1px solid var(--hairline-strong)'
            }}
          >
            {segment.slice(1, -1)}
          </code>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    return parts.length > 0 ? parts : str;
  };

  // Parse markdown-like content blocks into JSX elements safely using a robust line-by-line compiler
  const parseContent = (text) => {
    if (!text) return [];

    const lines = text.split('\n');
    const elements = [];
    
    let currentList = null; // { type: 'ul' | 'ol', items: [] }
    let currentParagraph = [];

    const flushParagraph = (key) => {
      if (currentParagraph.length > 0) {
        const textContent = currentParagraph.join(' ');
        elements.push(
          <p key={`p-${key}`} style={{ lineHeight: '1.8', fontSize: '16px', color: 'var(--ink-muted)', marginBottom: 'var(--space-md)' }}>
            {renderParagraphText(textContent)}
          </p>
        );
        currentParagraph = [];
      }
    };

    const flushList = (key) => {
      if (currentList) {
        const ListTag = currentList.type;
        const listStyle = currentList.type === 'ul' ? 'disc' : 'decimal';
        elements.push(
          <ListTag 
            key={`list-${key}`} 
            style={{ 
              margin: '0 0 var(--space-md) var(--space-md)', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '8px', 
              listStyleType: listStyle, 
              color: 'var(--ink-muted)',
              paddingLeft: '20px'
            }}
          >
            {currentList.items.map((itemText, i) => {
              const boldMatch = itemText.match(/^\*\*(.*?)\*\*:(.*)$/);
              if (boldMatch) {
                return (
                  <li key={i} style={{ lineHeight: '1.7', fontSize: '15.5px' }}>
                    <strong style={{ color: 'var(--ink)', fontWeight: '600' }}>{boldMatch[1]}:</strong>{renderParagraphText(boldMatch[2])}
                  </li>
                );
              }
              return (
                <li key={i} style={{ lineHeight: '1.7', fontSize: '15.5px' }}>
                  {renderParagraphText(itemText)}
                </li>
              );
            })}
          </ListTag>
        );
        currentList = null;
      }
    };

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx].trim();
      
      // Empty line
      if (!line) {
        flushParagraph(idx);
        flushList(idx);
        continue;
      }

      // Horizontal rule
      if (line === '---') {
        flushParagraph(idx);
        flushList(idx);
        elements.push(<hr key={`hr-${idx}`} style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 'var(--space-xl) 0' }} />);
        continue;
      }

      // Heading 3 / H2
      if (line.startsWith('### ')) {
        flushParagraph(idx);
        flushList(idx);
        elements.push(
          <h2 key={`h2-${idx}`} style={{ fontWeight: '800', color: 'var(--ink)', marginTop: 'var(--space-xl)', marginBottom: 'var(--space-md)', fontSize: '22px', letterSpacing: '-0.4px', lineHeight: '1.3' }}>
            {line.replace('### ', '')}
          </h2>
        );
        continue;
      }

      // Unordered list item
      if (line.startsWith('* ')) {
        flushParagraph(idx);
        if (!currentList || currentList.type !== 'ul') {
          flushList(idx);
          currentList = { type: 'ul', items: [] };
        }
        currentList.items.push(line.replace('* ', ''));
        continue;
      }

      // Ordered list item
      if (/^\d+\.\s/.test(line)) {
        flushParagraph(idx);
        if (!currentList || currentList.type !== 'ol') {
          flushList(idx);
          currentList = { type: 'ol', items: [] };
        }
        currentList.items.push(line.replace(/^\d+\.\s/, ''));
        continue;
      }

      // Standard paragraph text
      if (currentList) {
        flushList(idx);
      }
      currentParagraph.push(line);
    }

    // Flush remaining
    flushParagraph(lines.length);
    flushList(lines.length);

    return elements;
  };

  return (
    <main className="main page-scroll" style={{ minHeight: '100vh', padding: 'calc(var(--nav-height) + var(--space-xl)) 0 var(--space-xxl)', background: 'radial-gradient(circle at top right, rgba(94, 106, 210, 0.02), transparent 45%)' }}>
      <div className="container" style={{ maxWidth: '700px' }}>
        
        {/* Back Button */}
        <Link href="/blog" className="btn btn-secondary" style={{ display: 'inline-flex', padding: '8px 16px', gap: '8px', marginBottom: 'var(--space-xl)', fontSize: '13px', width: 'fit-content' }}>
          ◀ Back to articles
        </Link>

        {/* Article Container */}
        <article style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--hairline-strong)', borderRadius: 'var(--rounded-lg)', padding: 'var(--space-xl)', boxShadow: '0 4px 24px rgba(0,0,0,0.01)' }}>
          {/* Article Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap', marginBottom: 'var(--space-sm)' }}>
            <span 
              style={{ 
                fontSize: '10px', 
                fontWeight: '700', 
                textTransform: 'uppercase', 
                color: 'var(--primary)',
                backgroundColor: 'color-mix(in srgb, var(--primary) 12%, var(--surface-2))',
                padding: '2px 8px',
                borderRadius: '4px',
                letterSpacing: '0.5px'
              }}
            >
              {post.category}
            </span>
            <span className="caption ink-subtle" style={{ fontSize: '12px' }}>{post.date}</span>
            <span style={{ color: 'var(--hairline-strong)' }}>•</span>
            <span className="caption ink-subtle" style={{ fontSize: '12px' }}>{post.readTime}</span>
          </div>

          {/* Title */}
          <h1 className="display-sm" style={{ fontWeight: '800', marginBottom: 'var(--space-md)', fontSize: '30px', lineHeight: '1.3', letterSpacing: '-0.6px', color: 'var(--ink)' }}>
            {post.title}
          </h1>

          {/* Horizontal Divider separating header and content */}
          <hr style={{ border: 'none', borderTop: '1px solid var(--hairline-strong)', margin: 'var(--space-md) 0 var(--space-lg)' }} />

          {/* Content body */}
          <div className="prose" style={{ fontFamily: 'inherit', color: 'var(--ink-muted)' }}>
            {parseContent(post.content)}
          </div>
        </article>

        {/* CTA box */}
        <section 
          className="card" 
          style={{ 
            textAlign: 'center', 
            padding: 'var(--space-xl)', 
            border: '1px solid var(--primary)', 
            borderRadius: 'var(--rounded-xl)',
            backgroundColor: 'color-mix(in srgb, var(--primary) 3%, var(--surface-1))',
            marginTop: 'var(--space-xxl)',
            boxShadow: '0 8px 30px rgba(94, 106, 210, 0.03)'
          }}
        >
          <h3 className="body-lg" style={{ fontWeight: '800', color: 'var(--ink)' }}>Need to work with PDF documents?</h3>
          <p className="body-sm ink-muted" style={{ margin: 'var(--space-xs) 0 var(--space-md)', fontSize: '14px' }}>
            Experience 100% private local compiling with zero file uploads.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: 'inline-flex', padding: '10px 24px', textDecoration: 'none', fontWeight: '600' }}>
            Browse tools workspace
          </Link>
        </section>

      </div>
    </main>
  );
}
