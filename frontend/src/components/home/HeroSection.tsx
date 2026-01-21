'use client';

import React from 'react';

export interface HeroSectionProps {
  mascotImageUrl?: string;
  showAnimation?: boolean;
  children?: React.ReactNode;
}

/**
 * HeroSection component
 * Requirements: 1.1, 1.6
 * - 1.1: Display a hero image with the Mascot centered on the screen
 * - 1.6: Apply subtle idle animation effects (glow, breathing)
 */
export function HeroSection({
  mascotImageUrl = '/mascot.png',
  showAnimation = true,
  children,
}: HeroSectionProps) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* Bubbles floating up */}
      {showAnimation && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-30" aria-hidden="true">
          <div className="bubble" style={{ left: '10%', animationDuration: '6s', animationDelay: '0s' }} />
          <div className="bubble" style={{ left: '25%', animationDuration: '8s', animationDelay: '1s' }} />
          <div className="bubble" style={{ left: '40%', animationDuration: '7s', animationDelay: '2s' }} />
          <div className="bubble" style={{ left: '55%', animationDuration: '9s', animationDelay: '0.5s' }} />
          <div className="bubble" style={{ left: '70%', animationDuration: '6.5s', animationDelay: '3s' }} />
          <div className="bubble" style={{ left: '85%', animationDuration: '7.5s', animationDelay: '1.5s' }} />
        </div>
      )}

      {/* Glow effect behind mascot */}
      {showAnimation && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          aria-hidden="true"
        >
          <div className="w-80 h-80 rounded-full bg-accent-cyan/30 blur-3xl animate-pulse" />
        </div>
      )}

      {/* Con ca 1 - swim left to right */}
      <div className="absolute z-5 animate-fish-swim-right" style={{ top: '-15%', width: '25%' }}>
        <img
          src="/conca1.png"
          alt="Con Ca 1"
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
            opacity: 0.9
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Con ca 2 - swim right to left */}
      <div className="absolute z-5 animate-fish-swim-left" style={{ top: '-10%', width: '22%' }}>
        <img
          src="/conca2.png"
          alt="Con Ca 2"
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
            opacity: 0.85
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Con ca 3 - swim right to left */}
      <div className="absolute z-5 animate-fish-swim-left-slow" style={{ top: '-5%', width: '20%' }}>
        <img
          src="/conca3.png"
          alt="Con Ca 3"
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
            opacity: 0.8
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Con ca 4 - swim left to right (lower) */}
      <div className="absolute z-5 animate-fish-swim-right-slow" style={{ top: '5%', width: '18%' }}>
        <img
          src="/conca1.png"
          alt="Con Ca 4"
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
            opacity: 0.75
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Con ca 5 - swim right to left (higher) */}
      <div className="absolute z-5 animate-fish-swim-left-fast" style={{ top: '-20%', width: '16%' }}>
        <img
          src="/conca2.png"
          alt="Con Ca 5"
          className="w-full h-auto object-contain"
          style={{
            filter: 'drop-shadow(0 3px 3px rgba(0,0,0,0.3))',
            opacity: 0.7
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>

      {/* Mascot container with breathing animation */}
      <div
        className={`
          relative z-10 flex items-center justify-center
          ${showAnimation ? 'animate-breathing' : ''}
        `}
      >
        {/* Mascot and Cua container */}
        <div className="relative w-[50vw] h-[50vw] max-w-[200px] max-h-[200px]">
          {/* Cua image - left side with walking animation */}
          <div className="absolute z-20 animate-crab-walk" style={{ left: '-10%', bottom: '-15%', width: '20%' }}>
            <img
              src="/cua.PNG"
              alt="Cua"
              className="w-full h-auto object-contain"
              style={{
                filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.4))'
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>

          {/* Mascot image without glass circle */}
          <div className="w-full h-full flex items-center justify-center overflow-visible">
            {mascotImageUrl ? (
              <img
                src={mascotImageUrl}
                alt="Game Mascot"
                className="w-[140%] h-[140%] object-contain absolute -top-[35%]"
                onError={(e) => {
                  // Hide broken image and show fallback
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            {/* Fallback icon when no image */}
            {!mascotImageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🎮</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating elements overlay - children slot for action buttons */}
      {children && (
        <div className="absolute inset-0 z-20 pointer-events-none">
          <div className="relative w-full h-full pointer-events-auto">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSection;
