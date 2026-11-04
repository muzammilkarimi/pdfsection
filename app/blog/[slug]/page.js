import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BLOG_POSTS, getPostBySlug } from '@/lib/blog';
import { LIVE_TOOLS } from '@/lib/tools';
import { buildToolMetadata, buildBlogPostJsonLd, buildBreadcrumbJsonLd } from '@/lib/seoUtils';
import SocialShare from '@/components/SocialShare';
import GuideToolCard from '@/components/GuideToolCard';

const SHORT_ANSWER_HEADING = /^(the short answer|in short)$/i;
const RELATED_COUNT = 3;

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

  return buildToolMetadata({
    title: post.title,
    description: post.description,
    route: `/blog/${slug}`,
    ogType: 'article',
    keywords: [post.category, 'PDF security', 'client side processing', 'PDF section blog'],
  });
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// The tool a guide is about: the first tool page it links to.
function guideTool(content) {
  for (const match of content.matchAll(/\]\((\/[a-z0-9-]+)\)/g)) {
    const tool = LIVE_TOOLS.find((t) => t.route === match[1]);
    if (tool) return tool;
  }
  return null;
}

function relatedPosts(post) {
  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug);
  return [
    ...others.filter((p) => p.category === post.category),
    ...others.filter((p) => p.category !== post.category),
  ].slice(0, RELATED_COUNT);
}

// Inline bold, code and [text](url) link renderer
function renderInline(str) {
  const parts = [];
  const regex = /(\*\*.*?\*\*|`.*?`|\[[^\]]+\]\([^)\s]+\))/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }

    const segment = match[0];
    if (segment.startsWith('**') && segment.endsWith('**')) {
      parts.push(<strong key={match.index}>{segment.slice(2, -2)}</strong>);
    } else if (segment.startsWith('[')) {
      const [, label, href] = segment.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      parts.push(
        href.startsWith('/') ? (
          <Link key={match.index} href={href}>{label}</Link>
        ) : (
          <a key={match.index} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        )
      );
    } else if (segment.startsWith('`') && segment.endsWith('`')) {
      parts.push(<code key={match.index}>{segment.slice(1, -1)}</code>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return parts.length > 0 ? parts : str;
}

/**
 * Turns the post's markdown-like text into sections, one per "### " heading.
 * Each section is { heading, id, blocks } where blocks are JSX elements.
 */
function parseSections(text) {
  const sections = [{ heading: null, id: null, blocks: [] }];
  let list = null; // { type: 'ul' | 'ol', items: [] }
  let paragraph = [];
  const current = () => sections.at(-1);

  const flushParagraph = (key) => {
    if (paragraph.length) {
      current().blocks.push(<p key={`p-${key}`}>{renderInline(paragraph.join(' '))}</p>);
      paragraph = [];
    }
  };

  const flushList = (key) => {
    if (!list) return;
    const ListTag = list.type;
    current().blocks.push(
      <ListTag key={`list-${key}`}>
        {list.items.map((item, i) => {
          const lead = item.match(/^\*\*(.*?)\*\*:(.*)$/);
          return lead ? (
            <li key={i}><strong>{lead[1]}:</strong>{renderInline(lead[2])}</li>
          ) : (
            <li key={i}>{renderInline(item)}</li>
          );
        })}
      </ListTag>
    );
    list = null;
  };

  const lines = (text || '').split('\n');
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line || line === '---') {
      flushParagraph(idx);
      flushList(idx);
      return;
    }
    if (line.startsWith('### ')) {
      flushParagraph(idx);
      flushList(idx);
      const heading = line.slice(4);
      sections.push({ heading, id: slugify(heading), blocks: [] });
      return;
    }
    const ordered = /^\d+\.\s/.test(line);
    if (line.startsWith('* ') || ordered) {
      flushParagraph(idx);
      const type = ordered ? 'ol' : 'ul';
      if (!list || list.type !== type) {
        flushList(idx);
        list = { type, items: [] };
      }
      list.items.push(ordered ? line.replace(/^\d+\.\s/, '') : line.slice(2));
      return;
    }
    flushList(idx);
    paragraph.push(line);
  });
  flushParagraph(lines.length);
  flushList(lines.length);

  return sections.filter((section) => section.heading || section.blocks.length);
}

export default async function BlogArticlePage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    notFound();
  }

  const jsonLd = buildBlogPostJsonLd({
    title: post.title,
    description: post.description,
    slug: post.slug,
    date: post.date,
  });

  const breadcrumbJsonLd = buildBreadcrumbJsonLd({
    name: post.title,
    route: `/blog/${post.slug}`,
    parent: { name: 'Blog', route: '/blog' },
  });

  const sections = parseSections(post.content);
  const tool = guideTool(post.content);
  const related = relatedPosts(post);
  const toc = sections.filter((section) => section.heading);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbJsonLd]) }}
      />
      <main className="main page-scroll guide-page">
        <div className="guide-layout container">
          <article className="guide-article">
            <nav className="tool-breadcrumb" aria-label="Breadcrumb">
              <Link href="/blog">Guides</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{post.category}</span>
            </nav>
            <h1 className="guide-title">{post.title}</h1>
            <div className="guide-meta">
              <span>{post.author}</span>
              <span aria-hidden="true">·</span>
              <span>{post.readTime}</span>
              <span aria-hidden="true">·</span>
              <span>{post.date}</span>
            </div>
            <p className="guide-lead">{post.description}</p>

            {sections.map((section, index) => {
              const isShort = section.heading && SHORT_ANSWER_HEADING.test(section.heading);
              return (
                <section
                  key={section.id || `intro-${index}`}
                  id={section.id || undefined}
                  className={`guide-section${isShort ? ' guide-short' : ''}`}
                >
                  {section.heading && <h2>{isShort ? 'In short' : section.heading}</h2>}
                  {section.blocks}
                </section>
              );
            })}

            {tool && tool.id !== 'translate' && (
              <div className="guide-callout">
                <strong>Private by design.</strong>
                <span>
                  {tool.name} runs in your browser tab. Your file is never sent to a server, so it is safe for contracts and ID documents.
                </span>
              </div>
            )}

            <div className="guide-share">
              <SocialShare title={post.title} url={`https://www.pdfsection.com/blog/${post.slug}`} />
            </div>

            {related.length > 0 && (
              <section className="guide-related" id="related-guides" aria-labelledby="related-guides-title">
                <h2 id="related-guides-title">Related guides</h2>
                <div className="guide-related-grid">
                  {related.map((other) => (
                    <Link key={other.slug} href={`/blog/${other.slug}`}>{other.title}</Link>
                  ))}
                </div>
              </section>
            )}
          </article>

          <aside className="guide-aside">
            {tool ? (
              <GuideToolCard
                tool={{ id: tool.id, name: tool.name, route: tool.route, icon: tool.icon, categoryColor: tool.categoryColor }}
              />
            ) : (
              <div className="guide-tool-card">
                <strong>Every PDF tool, free</strong>
                <span className="guide-tool-text">Merge, compress, sign and more, right in your browser.</span>
                <Link href="/tools" className="btn btn-primary">Browse all tools</Link>
              </div>
            )}

            {toc.length > 1 && (
              <nav className="guide-toc" aria-label="On this page">
                <span>On this page</span>
                {toc.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>
                    {SHORT_ANSWER_HEADING.test(section.heading) ? 'In short' : section.heading}
                  </a>
                ))}
                {related.length > 0 && <a href="#related-guides">Related guides</a>}
              </nav>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
