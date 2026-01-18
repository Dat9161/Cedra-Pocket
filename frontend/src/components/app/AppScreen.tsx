'use client';

import { useRef, useState } from 'react';

export function AppScreen() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle mouse wheel scroll for horizontal carousel (like GameScreen)
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      e.preventDefault();
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  // Drag to scroll for carousel (like GameScreen)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };
  return (
    <div 
      className="flex flex-col text-white"
      style={{ 
        backgroundColor: 'transparent',
        padding: '20px 24px 20px'
      }}
    >
      {/* Last Used App - Empty for now */}
      <div 
        className="flex items-center justify-between p-4 mb-6 cursor-pointer transition-all hover:scale-[1.02]"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.3)',
          backdropFilter: 'blur(20px)',
          minHeight: '80px'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(26,26,46,0.1)',
              fontSize: '24px'
            }}
          >
            📱
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a2e' }}>
              Last Used App
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(26,26,46,0.6)' }}>
              Coming soon...
            </div>
          </div>
        </div>
        <div style={{ fontSize: '20px', color: 'rgba(26,26,46,0.6)' }}>→</div>
      </div>

      {/* Suggested for you */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '16px' }}>
          Suggested for you
        </h2>
        
        {/* Featured Apps - Horizontal Scroll */}
        <div 
          ref={scrollContainerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="flex pb-2 hide-scrollbar"
          style={{
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            gap: '16px',
            width: '100%',
            maxWidth: '100vw'
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <div 
              key={index}
              className="relative cursor-pointer transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                minHeight: '160px',
                width: '280px',
                minWidth: '280px',
                flexShrink: 0
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: '28px', fontWeight: '700', color: 'rgba(26,26,46,0.3)', marginBottom: '4px' }}>
                  App {index}
                </h3>
                <p style={{ fontSize: '16px', color: 'rgba(26,26,46,0.5)', marginBottom: '20px' }}>
                  Coming soon...
                </p>
              </div>

              {/* App icon at bottom */}
              <div 
                className="flex items-center gap-3 mt-4"
                style={{ position: 'relative', zIndex: 1 }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(26,26,46,0.1)',
                    fontSize: '24px'
                  }}
                >
                  🚀
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(26,26,46,0.4)' }}>App Name {index}</div>
                  <div style={{ fontSize: '14px', color: 'rgba(26,26,46,0.3)' }}>Description</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '20px', color: 'rgba(26,26,46,0.6)' }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
            Recent
          </h2>
        </div>

        {/* Scrollable Recent Apps Container */}
        <div 
          className="hide-scrollbar"
          style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 480px)',
            paddingBottom: '100px'
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(20px)',
                  minHeight: '80px'
                }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'rgba(26,26,46,0.1)',
                    fontSize: '24px'
                  }}
                >
                  🔧
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'rgba(26,26,46,0.4)', marginBottom: '2px' }}>
                    Recent App {index}
                  </div>
                  <div style={{ fontSize: '14px', color: 'rgba(26,26,46,0.3)' }}>
                    Coming soon...
                  </div>
                </div>
                <div style={{ fontSize: '20px', color: 'rgba(26,26,46,0.4)' }}>›</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .hide-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

export default AppScreen;