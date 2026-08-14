'use client';

import React from 'react';

/**
 * Authentic 3-band Indian National Flag SVG (Tiranga) with central 24-spoke Ashoka Chakra.
 * Renders crisply across all operating systems without relying on OS emoji fonts.
 */
export function IndianFlagIcon({ width = 20, height = 13.5, style = {}, className = '' }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      viewBox="0 0 30 20"
      width={width}
      height={height}
      className={`indian-flag-svg ${className}`}
      style={{
        borderRadius: '2px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.08)',
        ...style,
      }}
      aria-label="Flag of India"
      role="img"
    >
      {/* Saffron Stripe (Top) */}
      <rect width="30" height="6.67" y="0" fill="#FF671F" />
      {/* White Stripe (Middle) */}
      <rect width="30" height="6.67" y="6.67" fill="#FFFFFF" />
      {/* Green Stripe (Bottom) */}
      <rect width="30" height="6.67" y="13.33" fill="#046A38" />
      
      {/* Ashoka Chakra (Center) */}
      <circle cx="15" cy="10" r="2.85" stroke="#000080" strokeWidth="0.45" fill="none" />
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="15"
          y1="10"
          x2="15"
          y2="7.25"
          stroke="#000080"
          strokeWidth="0.25"
          transform={`rotate(${deg} 15 10)`}
        />
      ))}
      <circle cx="15" cy="10" r="0.75" fill="#000080" />
      <circle cx="15" cy="10" r="0.25" fill="#ffffff" />
    </svg>
  );
}

/**
 * High precision 24-spoke standalone Ashoka Chakra SVG component.
 */
export function AshokaChakraIcon({ size = 18, className = '', style = {}, spin = false }) {
  const spokes = Array.from({ length: 24 }, (_, i) => i * 15);

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`ashoka-chakra-svg ${spin ? 'ashoka-spin' : ''} ${className}`}
      style={{
        color: '#000080',
        flexShrink: 0,
        display: 'inline-block',
        verticalAlign: 'middle',
        ...style,
      }}
      aria-label="Ashoka Chakra"
      role="img"
    >
      {/* Outer Ring */}
      <circle cx="12" cy="12" r="9.6" stroke="currentColor" strokeWidth="1.2" fill="none" />
      
      {/* 24 Radial Spokes */}
      {spokes.map((deg) => (
        <line
          key={deg}
          x1="12"
          y1="12"
          x2="12"
          y2="2.6"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
      
      {/* Central Hub & Inner Ring */}
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
      <circle cx="12" cy="12" r="0.75" fill="#ffffff" />
    </svg>
  );
}

/**
 * Triggers a canvas-based Tricolor confetti shower.
 */
export function triggerIndependenceConfetti() {
  if (typeof window === 'undefined') return;

  let canvas = document.getElementById('festive-confetti-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'festive-confetti-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99999';
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const colors = [
    '#FF9933', // Deep Saffron
    '#FF671F', // Bright Saffron
    '#FFFFFF', // White
    '#E2E8F0', // Soft Silver White
    '#138808', // India Green
    '#046A38', // Deep Green
    '#000080', // Navy Blue
    '#FFD700', // Festive Gold
  ];

  const particleCount = 120;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const originX = width * (0.15 + Math.random() * 0.7);
    const originY = Math.random() * 80;

    particles.push({
      x: originX,
      y: originY,
      size: Math.random() * 9 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -7 - 2,
      gravity: 0.22 + Math.random() * 0.12,
      drag: 0.985,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      tilt: Math.random() * 10,
      tiltSpeed: Math.random() * 0.12 + 0.06,
      opacity: 1,
      shape: Math.random() > 0.3 ? 'rect' : 'circle',
    });
  }

  let animationFrameId;
  const startTime = performance.now();
  const maxDuration = 3200; // 3.2 seconds

  function render(time) {
    const elapsed = time - startTime;
    ctx.clearRect(0, 0, width, height);

    let activeParticles = 0;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= p.drag;
      p.rotation += p.rotationSpeed;
      p.tilt += p.tiltSpeed;

      if (elapsed > 1800) {
        p.opacity = Math.max(0, 1 - (elapsed - 1800) / 1400);
      }

      if (p.opacity > 0 && p.y < height + 40) {
        activeParticles++;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        const tiltWidth = Math.sin(p.tilt) * p.size;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.abs(tiltWidth) / 2, p.size / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-tiltWidth / 2, -p.size / 2, tiltWidth, p.size);
        }

        ctx.restore();
      }
    });

    if (activeParticles > 0 && elapsed < maxDuration) {
      animationFrameId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      if (canvas && canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
  }

  animationFrameId = requestAnimationFrame(render);
}
