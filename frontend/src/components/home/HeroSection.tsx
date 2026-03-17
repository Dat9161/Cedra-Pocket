'use client';

import React from 'react';

export interface HeroSectionProps {
  mascotImageUrl?: string;
  showAnimation?: boolean;
  children?: React.ReactNode;
}

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

      {/* Mascot (dolphin) with breathing animation */}
      <div
        className={`relative z-10 flex items-center justify-center ${showAnimation ? 'animate-breathing' : ''}`}
      >
        <div className="relative w-[50vw] h-[50vw] max-w-[200px] max-h-[200px]">
          <div className="w-full h-full flex items-center justify-center overflow-visible">
            {mascotImageUrl ? (
              <img
                src={mascotImageUrl}
                alt="Game Mascot"
                className="w-[140%] h-[140%] object-contain absolute -top-[35%]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🎮</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children slot */}
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
