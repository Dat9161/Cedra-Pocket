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
      // Only prevent default and handle horizontal scroll if we're over the carousel
      // and there's content to scroll horizontally
      const container = scrollContainerRef.current;
      const canScrollHorizontally = container.scrollWidth > container.clientWidth;
      
      if (canScrollHorizontally) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
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
      className="flex flex-col text-white app-screen-container"
      style={{ 
        backgroundColor: 'transparent',
        padding: 'clamp(16px, 4vw, 24px) clamp(20px, 5vw, 32px) clamp(200px, 50vw, 250px) clamp(20px, 5vw, 32px)',
        // Bỏ minHeight để cho phép scroll tự nhiên
      }}
    >
      {/* Suggested for you */}
      <div style={{ marginBottom: 'clamp(24px, 6vw, 40px)' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: '700', color: '#fff', marginBottom: 'clamp(12px, 3vw, 20px)' }}>
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
            gap: 'clamp(12px, 3vw, 20px)',
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
                borderRadius: 'clamp(16px, 4vw, 24px)',
                padding: 'clamp(18px, 4.5vw, 28px)',
                border: '1px solid rgba(255,255,255,0.3)',
                backdropFilter: 'blur(20px)',
                overflow: 'hidden',
                minHeight: 'clamp(140px, 35vw, 180px)',
                width: 'clamp(240px, 65vw, 320px)',
                minWidth: 'clamp(240px, 65vw, 320px)',
                flexShrink: 0
              }}
            >
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: '700', color: 'rgba(26,26,46,0.3)', marginBottom: 'clamp(2px, 0.5vw, 6px)' }}>
                  App {index}
                </h3>
                <p style={{ fontSize: 'var(--fs-md)', color: 'rgba(26,26,46,0.5)', marginBottom: 'clamp(16px, 4vw, 24px)' }}>
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
                    width: 'clamp(40px, 10vw, 56px)',
                    height: 'clamp(40px, 10vw, 56px)',
                    borderRadius: 'clamp(10px, 2.5vw, 16px)',
                    background: 'rgba(26,26,46,0.1)',
                    fontSize: 'clamp(20px, 5vw, 28px)'
                  }}
                >
                  🚀
                </div>
                <div>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: '600', color: 'rgba(26,26,46,0.4)' }}>App Name {index}</div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(26,26,46,0.3)' }}>Description</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 'clamp(24px, 6vw, 32px)', color: 'rgba(26,26,46,0.6)' }}>›</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: '700', color: '#fff' }}>
            Recent
          </h2>
        </div>

        {/* Recent Apps Container */}
        <div 
          style={{
            paddingBottom: 'clamp(16px, 4vw, 24px)'
          }}
        >
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  borderRadius: 'clamp(12px, 3vw, 20px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(20px)',
                  minHeight: 'clamp(70px, 18vw, 90px)',
                  padding: 'clamp(12px, 3vw, 18px)'
                }}
              >
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: 'clamp(40px, 10vw, 56px)',
                    height: 'clamp(40px, 10vw, 56px)',
                    borderRadius: 'clamp(10px, 2.5vw, 16px)',
                    background: 'rgba(26,26,46,0.1)',
                    fontSize: 'clamp(20px, 5vw, 28px)'
                  }}
                >
                  🔧
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: '600', color: 'rgba(26,26,46,0.4)', marginBottom: '2px' }}>
                    Recent App {index}
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(26,26,46,0.3)' }}>
                    Coming soon...
                  </div>
                </div>
                <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', color: 'rgba(26,26,46,0.4)' }}>›</div>
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
        
        /* Ẩn scroll bar cho toàn bộ container nhưng vẫn cho phép scroll */
        .app-screen-container::-webkit-scrollbar {
          display: none;
        }
        
        .app-screen-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
          /* Đảm bảo có thể scroll */
          overflow-y: visible;
        }
      `}</style>
    </div>
  );
}

export default AppScreen;