'use client';

import { shapePath, textCss } from '@/lib/designModel';

/** Box of an element on the page. Text height comes from its content. */
export function elementBoxStyle(el) {
  return {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.type === 'text' ? 'auto' : el.h,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity,
  };
}

export function ElementBody({ el, hidden = false }) {
  if (el.type === 'text') {
    return <div style={{ ...textCss(el), visibility: hidden ? 'hidden' : undefined }}>{el.text || '​'}</div>;
  }
  if (el.type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element -- a user's local image held as a data URL
    return <img src={el.src} alt="" draggable={false} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />;
  }
  return (
    <svg width={el.w} height={el.h} style={{ display: 'block', overflow: 'visible' }} aria-hidden="true">
      <path d={shapePath(el)} fill={el.fill || 'none'} stroke={el.stroke && el.strokeWidth > 0 ? el.stroke : 'none'} strokeWidth={el.strokeWidth} />
    </svg>
  );
}

/** A page drawn at a fixed scale with no editing controls: thumbnails and the preview. */
export function PageView({ design, page, scale }) {
  return (
    <div className="ds-pageview" style={{ width: design.width * scale, height: design.height * scale }}>
      <div
        style={{
          position: 'relative',
          width: design.width,
          height: design.height,
          background: page.background,
          overflow: 'hidden',
          transform: `scale(${scale})`,
          transformOrigin: '0 0',
        }}
      >
        {page.elements.map((el) => (
          <div key={el.id} style={elementBoxStyle(el)}>
            <ElementBody el={el} />
          </div>
        ))}
      </div>
    </div>
  );
}
