'use client';

const CedraAppCard = ({ onClick, isHorizontal = false }: { onClick: () => void; isHorizontal?: boolean }) => {
  if (isHorizontal) {
    return (
      <div
        className="flex-shrink-0 transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden cursor-pointer"
        onClick={onClick}
        style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.8), rgba(147, 197, 253, 0.6))',
          backdropFilter: 'blur(20px)',
          borderRadius: 'clamp(16px, 4vw, 20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          width: 'clamp(280px, 70vw, 350px)',
          height: 'clamp(160px, 40vw, 200px)',
          position: 'relative',
        }}
      >
        {/* Background Pattern/Wave */}
        <div 
          style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: '60%',
            height: '60%',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)',
          }}
        />
        
        {/* App Icon - Bottom Left */}
        <div 
          className="absolute"
          style={{
            bottom: 'clamp(16px, 4vw, 20px)',
            left: 'clamp(16px, 4vw, 20px)',
            width: 'clamp(40px, 10vw, 50px)',
            height: 'clamp(40px, 10vw, 50px)',
            borderRadius: 'clamp(8px, 2vw, 12px)',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.5)',
            overflow: 'hidden'
          }}
        >
          <img 
            src="/icons/cedra.jpg" 
            alt="Cedra Network" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
            }} 
          />
        </div>

        {/* App Title - Center */}
        <div 
          className="absolute"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h3 
            className="font-bold"
            style={{ 
              fontSize: 'clamp(24px, 6vw, 32px)', 
              lineHeight: '1.2',
            }}
          >
            Cedra Network
          </h3>
        </div>

        {/* Open Button - Bottom Right */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="absolute font-bold transition-all hover:scale-105 active:scale-95"
          style={{
            bottom: 'clamp(16px, 4vw, 20px)',
            right: 'clamp(16px, 4vw, 20px)',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            backdropFilter: 'blur(10px)',
            color: '#1a1a2e',
            fontSize: 'clamp(14px, 3.5vw, 18px)',
            boxShadow: '0 4px 16px rgba(255, 200, 0, 0.4)',
            padding: 'clamp(10px, 2.5vw, 14px) clamp(20px, 5vw, 28px)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            cursor: 'pointer',
            fontWeight: '700',
          }}
        >
          OPEN
        </button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-3 p-4 cursor-pointer transition-all hover:scale-[1.01]"
      onClick={onClick}
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
          overflow: 'hidden'
        }}
      >
        <img 
          src="/icons/cedra.jpg" 
          alt="Cedra Network" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderRadius: 'clamp(10px, 2.5vw, 16px)'
          }} 
        />
      </div>
      <div className="flex-1">
        <div style={{ fontSize: 'var(--fs-md)', fontWeight: '600', color: 'rgba(26,26,46,0.7)', marginBottom: '2px' }}>
          Cedra Network
        </div>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'rgba(26,26,46,0.5)' }}>
          Official Website
        </div>
      </div>
      <div style={{ fontSize: 'clamp(24px, 6vw, 32px)', color: 'rgba(26,26,46,0.4)' }}>›</div>
    </div>
  );
};

export function AppScreen() {
  const handleCedraClick = () => {
    window.open('https://cedra.network/', '_blank');
  };

  return (
    <div 
      className="flex flex-col text-white app-screen-container"
      style={{ 
        backgroundColor: 'transparent',
        padding: 'clamp(16px, 4vw, 24px) clamp(20px, 5vw, 32px) clamp(200px, 50vw, 250px) clamp(20px, 5vw, 32px)',
      }}
    >
      {/* Suggested for you */}
      <div style={{ marginBottom: 'clamp(32px, 8vw, 48px)' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: '700', color: '#fff', marginBottom: 'clamp(12px, 3vw, 20px)' }}>
          Suggested for you
        </h2>
        
        {/* Horizontal Scroll Container */}
        <div 
          className="flex hide-scrollbar"
          style={{ 
            overflowX: 'auto', 
            overflowY: 'hidden',
            paddingBottom: 'clamp(8px, 2vw, 12px)',
            WebkitOverflowScrolling: 'touch',
            gap: 'clamp(12px, 3vw, 16px)',
            scrollBehavior: 'smooth',
            cursor: 'grab',
          }}
          onMouseDown={(e) => {
            const container = e.currentTarget;
            container.style.cursor = 'grabbing';
            let isDown = true;
            let startX = e.pageX - container.offsetLeft;
            let scrollLeft = container.scrollLeft;

            const handleMouseMove = (e: MouseEvent) => {
              if (!isDown) return;
              e.preventDefault();
              const x = e.pageX - container.offsetLeft;
              const walk = (x - startX) * 2;
              container.scrollLeft = scrollLeft - walk;
            };

            const handleMouseUp = () => {
              isDown = false;
              container.style.cursor = 'grab';
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          onWheel={(e) => {
            e.preventDefault();
            const container = e.currentTarget;
            container.scrollLeft += e.deltaY;
          }}
        >
          <CedraAppCard onClick={handleCedraClick} isHorizontal={true} />
          {/* Add more apps here if needed */}
        </div>
      </div>

      {/* Recent */}
      <div style={{ marginBottom: 'clamp(24px, 6vw, 40px)' }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontWeight: '700', color: '#fff', marginBottom: 'clamp(12px, 3vw, 20px)' }}>
          Recent
        </h2>
        
        <div className="grid grid-cols-1 gap-4">
          <CedraAppCard onClick={handleCedraClick} isHorizontal={false} />
        </div>
      </div>

      <style jsx>{`
        .app-screen-container::-webkit-scrollbar {
          display: none;
        }
        
        .app-screen-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overflow-y: visible;
        }

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