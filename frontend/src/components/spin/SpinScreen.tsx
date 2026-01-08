'use client';

import { useState, useCallback } from 'react';
import { useAppStore, useSpinsLeft } from '../../store/useAppStore';
import { backendAPI } from '../../services/backend-api.service';

// Các phần thưởng trên vòng quay
const WHEEL_SEGMENTS = [
  { label: '100 🪙', value: 100, color: '#FF6B6B' },
  { label: '50 🪙', value: 50, color: '#4ECDC4' },
  { label: '200 🪙', value: 200, color: '#FFE66D' },
  { label: '25 🪙', value: 25, color: '#95E1D3' },
  { label: '500 🪙', value: 500, color: '#F38181' },
  { label: '75 🪙', value: 75, color: '#AA96DA' },
  { label: '150 🪙', value: 150, color: '#FCBAD3' },
  { label: '10 🪙', value: 10, color: '#A8D8EA' },
];

export function SpinScreen() {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const spinsLeft = useSpinsLeft();
  const { updateBalance, decrementSpins, user, setUser } = useAppStore();

  const segmentAngle = 360 / WHEEL_SEGMENTS.length; // 45 độ mỗi segment

  const spinWheel = useCallback(() => {
    if (isSpinning || spinsLeft <= 0) return;

    setIsSpinning(true);
    setResult(null);
    setShowResult(false);

    // Chọn segment trúng thưởng trước
    const winningIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
    const prize = WHEEL_SEGMENTS[winningIndex];

    // Mũi tên ở trên (12 giờ)
    // Segment 0 (100 coins) bắt đầu từ góc -90 độ và kết thúc ở -45 độ
    // Giữa segment 0 ở góc -67.5 độ
    // Khi rotation = 0, giữa segment 0 ở -67.5 độ, cần quay thêm 67.5 độ để nó lên top
    // Để segment i nằm ở top (mũi tên chỉ vào giữa segment):
    // Cần quay: 360 - (i * 45) - 22.5 = 337.5 - i * 45
    
    const spins = 5 + Math.random() * 3; // 5-8 vòng
    const baseSpins = Math.floor(spins) * 360;
    
    // Góc để giữa segment winningIndex nằm ở vị trí mũi tên (top)
    // Offset 22.5 để mũi tên chỉ vào giữa segment thay vì ranh giới
    const targetAngle = (360 - winningIndex * segmentAngle - segmentAngle / 2 + 360) % 360;
    
    // Tính góc cần quay thêm từ vị trí hiện tại
    const currentNormalized = rotation % 360;
    let additionalAngle = targetAngle - currentNormalized;
    if (additionalAngle <= 0) additionalAngle += 360;
    
    const totalRotation = baseSpins + additionalAngle;
    
    setRotation(prev => prev + totalRotation);

    // Sau khi quay xong - trả về đúng prize đã chọn
    setTimeout(async () => {
      setResult(prize.value);
      setShowResult(true);
      updateBalance(prize.value, 'token');
      decrementSpins();
      setIsSpinning(false);

      // Sync points with backend
      if (backendAPI.isAuthenticated()) {
        try {
          const updatedUser = await backendAPI.addPoints(prize.value);
          console.log('✅ Points synced with backend:', updatedUser.total_points);
          // Update local user with backend data
          if (user) {
            setUser({ ...user, tokenBalance: Number(updatedUser.total_points) });
          }
        } catch (error) {
          console.error('❌ Failed to sync points with backend:', error);
        }
      }

      // Ẩn kết quả sau 2.5 giây
      setTimeout(() => {
        setShowResult(false);
      }, 2500);
    }, 4000);
  }, [isSpinning, spinsLeft, updateBalance, segmentAngle, rotation]);

  return (
    <div className="flex flex-col h-full items-center" style={{ paddingTop: '80px', backgroundColor: 'transparent' }}>
      {/* Wheel Container */}
      <div className="relative" style={{ marginBottom: '40px' }}>
        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: 0,
            height: 0,
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: '30px solid #FFD700',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />

        {/* Wheel Outer Ring */}
        <div
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
            padding: '10px',
            boxShadow: '0 0 30px rgba(255,215,0,0.4), inset 0 0 20px rgba(255,255,255,0.3)',
          }}
        >
          {/* Wheel */}
          <div 
            className="relative w-full h-full rounded-full overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
            }}
          >
            {/* SVG Wheel */}
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {WHEEL_SEGMENTS.map((seg, i) => {
                const startAngle = i * segmentAngle - 90;
                const endAngle = (i + 1) * segmentAngle - 90;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;
                
                const x1 = 50 + 50 * Math.cos(startRad);
                const y1 = 50 + 50 * Math.sin(startRad);
                const x2 = 50 + 50 * Math.cos(endRad);
                const y2 = 50 + 50 * Math.sin(endRad);
                
                const largeArc = segmentAngle > 180 ? 1 : 0;
                
                const pathD = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
                
                // Text position
                const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;
                const textRadius = 32;
                const textX = 50 + textRadius * Math.cos(midAngle);
                const textY = 50 + textRadius * Math.sin(midAngle);
                const textRotation = (startAngle + endAngle) / 2 + 90;
                
                return (
                  <g key={i}>
                    <path d={pathD} fill={seg.color} stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                    <text
                      x={textX}
                      y={textY}
                      fill="white"
                      fontSize="5"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Center Circle */}
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                width: '70px',
                height: '70px',
                background: 'linear-gradient(135deg, #00BFFF, #1E90FF)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                border: '4px solid rgba(255,255,255,0.8)',
              }}
              onClick={spinWheel}
            >
              <span className="text-white font-bold text-lg">SPIN</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spins Left - Below wheel */}
      <div 
        className="mb-4 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
          border: '2px solid rgba(255,255,255,0.3)',
          padding: '12px 32px',
          boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
        }}
      >
        <span className="text-white font-semibold" style={{ fontSize: '16px' }}>Spins Left: </span>
        <span className="text-white font-bold" style={{ fontSize: '18px' }}>{spinsLeft}</span>
      </div>

      {/* Result - Slide down from top */}
      {showResult && result !== null && (
        <>
          {/* Confetti effect */}
          <div className="fixed inset-0 pointer-events-none z-40">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#FF8E53', '#AA96DA', '#95E1D3', '#FCBAD3', '#00BFFF'][i % 8],
                  borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0' : '2px',
                  width: `${8 + (i % 5) * 3}px`,
                  height: `${8 + (i % 4) * 3}px`,
                }}
              />
            ))}
          </div>
          
          {/* Result notification */}
          <div 
            className="fixed top-0 left-1/2 -translate-x-1/2 px-10 py-4 rounded-b-2xl z-50"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: '3px solid rgba(255,255,255,0.5)',
              borderTop: 'none',
              boxShadow: '0 8px 30px rgba(255,215,0,0.5)',
              animation: 'slideDownFade 2.5s ease-out forwards',
            }}
          >
            <span className="text-3xl font-bold text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              +{result} 🪙
            </span>
          </div>
        </>
      )}

      {/* Get More Spins */}
      {spinsLeft === 0 && (
        <p className="mt-4 text-text-secondary text-sm">
          Complete quests to get more spins!
        </p>
      )}
    </div>
  );
}

export default SpinScreen;
