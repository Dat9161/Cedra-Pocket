'use client';

export function LoadingScreen() {
  return (
    <>
      <style>{`
        #loading-screen {
          background-color: #A8DADC;
        }
        .dark #loading-screen {
          background-color: #212d3b;
        }
        #loading-screen .loading-title {
          color: #1e3a5f;
          text-shadow: 0 2px 10px rgba(255,255,255,0.5);
        }
        .dark #loading-screen .loading-title {
          color: #ffffff;
          text-shadow: none;
        }
        #loading-screen .loading-text {
          color: #1e3a5f;
        }
        .dark #loading-screen .loading-text {
          color: #ffffff;
        }
      `}</style>
      <div
        id="loading-screen"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
        }}
      >
        <div
          className="relative mb-8 animate-bounce"
          style={{ animationDuration: '2s' }}
        >
          <img
            src="/logo.png"
            alt="Cedra Pocket Logo"
            style={{
              width: 'clamp(120px, 35vw, 180px)',
              height: 'auto',
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))',
            }}
          />
        </div>

        <h1
          className="loading-title font-extrabold text-center mb-6"
          style={{ fontSize: 'clamp(28px, 8vw, 40px)' }}
        >
          Cedra Pocket
        </h1>

        <div
          className="relative animate-spin"
          style={{ width: 'clamp(50px, 14vw, 70px)', height: 'clamp(50px, 14vw, 70px)' }}
        >
          <div className="absolute inset-0 rounded-full" style={{ border: '4px solid rgba(255,255,255,0.3)' }} />
          <div className="absolute inset-0 rounded-full" style={{ border: '4px solid transparent', borderTopColor: '#FFD700', borderRightColor: '#FFA500' }} />
        </div>

        <p
          className="loading-text mt-6 font-semibold"
          style={{ fontSize: 'var(--fs-sm)', opacity: 0.8 }}
        >
          Loading
        </p>
      </div>
    </>
  );
}

export default LoadingScreen;
