import React, { memo, useEffect, useState } from 'react';
import '@designcodeio/threeui/style.css';
import { PredictiveArcCanvas } from '@designcodeio/threeui';

interface CompanionShaderBackdropProps {
  className?: string;
  opacity?: number;
  speed?: number;
  hue?: number;
}

export const CompanionShaderBackdrop: React.FC<CompanionShaderBackdropProps> = memo(({
  className = '',
  opacity = 0.32,
  speed = 0.6,
  hue = 205, // Hitodama Soul Cyan-Blue
}) => {
  const [isReady, setIsReady] = useState(false);

  // Defer opacity reveal by 1 frame so WebGL init never stalls the island expansion tween
  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`companion-shader-backdrop ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Explicit bottom curvature so the shader can NEVER bleed into a sharp outer rectangle
        borderRadius: '0 0 24px 24px',
        clipPath: 'inset(0px round 0px 0px 24px 24px)',
        zIndex: 0,
        opacity: isReady ? opacity : 0,
        transition: 'opacity 0.28s cubic-bezier(0.33, 1, 0.68, 1)',
        contain: 'strict',
      }}
    >
      {/* 
        LOCKED-SIZE WEBGL STAGE (1060x650):
        Keeping this wrapper at a fixed pixel size prevents PredictiveArcCanvas's internal 
        ResizeObserver from reallocating WebGL framebuffers during tab/window transitions.
      */}
      <div
        style={{
          position: 'absolute',
          top: '-24px',
          left: '50%',
          width: '1060px',
          height: '650px',
          transform: 'translate3d(-50%, 0, 0)',
          willChange: 'transform',
        }}
      >
        <PredictiveArcCanvas
          variant="predictive"
          mode="dark"
          speed={speed}
          spacing={18}
          dotSize={1.7}
          archHeight={85}
          thickness={1.3}
          brightness={0.8}
          hue={hue}
          saturation={0.88}
        />
      </div>

      {/* Soft inner vignette that blends cleanly into the #0A0B0E SVG notch fill */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(17, 18, 22, 0.15) 0%, rgba(10, 11, 14, 0.86) 80%, #07080A 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
});

CompanionShaderBackdrop.displayName = 'CompanionShaderBackdrop';