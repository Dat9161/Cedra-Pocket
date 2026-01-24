'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore, useEnergy } from '../../src/store/useAppStore';

// Game constants
const GAME_CONFIG = {
  CANVAS_WIDTH: 320,
  CANVAS_HEIGHT: 480,
  BIRD_SIZE: 20,
  BIRD_X: 80,
  GRAVITY: 0.6,
  JUMP_FORCE: -6, // Reduced from -8 to -6 for less sensitivity
  PIPE_WIDTH: 60,
  PIPE_GAP: 120,
  PIPE_SPEED: 2,
  PIPE_SPAWN_RATE: 90, // frames
};

// Game types
interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface GameState {
  bird: Bird;
  pipes: Pipe[];
  score: number;
  frameCount: number;
  isGameOver: boolean;
  isStarted: boolean;
}

// Screen types
type Screen = 'menu' | 'playing' | 'gameOver';

interface PocketFlyGameProps {
  onGameEnd?: (score: number, points: number) => void;
  onBackToMenu?: () => void;
}

export function PocketFlyGame({ onGameEnd, onBackToMenu }: PocketFlyGameProps) {
  const { consumeEnergy, regenerateEnergy } = useAppStore();
  const energyStore = useEnergy();
  
  // UI State
  const [screen, setScreen] = useState<Screen>('menu');
  const [totalPoints, setTotalPoints] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastPoints, setLastPoints] = useState(0);

  // Use energy from store - with fallback values
  const energy = energyStore?.currentEnergy ?? 10;
  const maxEnergy = energyStore?.maxEnergy ?? 10;

  // Debug logging and reset energy if needed
  useEffect(() => {
    console.log('🔋 Energy values:', { energy, maxEnergy, energyStore });
    
    // Reset energy if it's showing wrong values (100/100)
    if (maxEnergy === 100 || energy > 10) {
      console.log('🔄 Resetting energy to correct values');
      const { setEnergy } = useAppStore.getState();
      setEnergy({
        currentEnergy: 10,
        maxEnergy: 10,
        lastUpdate: Date.now(),
      });
    }
  }, [energy, maxEnergy, energyStore]);

  // Game refs (không dùng useState để tránh re-render trong game loop)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    bird: { x: GAME_CONFIG.BIRD_X, y: 240, velocity: 0, rotation: 0 },
    pipes: [],
    score: 0,
    frameCount: 0,
    isGameOver: false,
    isStarted: false,
  });
  const animationRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());

  // Regenerate energy on component mount and periodically
  useEffect(() => {
    regenerateEnergy(); // Check on mount
    
    const interval = setInterval(() => {
      regenerateEnergy(); // Check every minute
    }, 60000);

    return () => clearInterval(interval);
  }, [regenerateEnergy]);

  // Initialize game state
  const initGame = useCallback(() => {
    gameStateRef.current = {
      bird: { 
        x: GAME_CONFIG.BIRD_X, 
        y: GAME_CONFIG.CANVAS_HEIGHT / 2, 
        velocity: 0, 
        rotation: 0 
      },
      pipes: [],
      score: 0,
      frameCount: 0,
      isGameOver: false,
      isStarted: false,
    };
  }, []);

  // Create new pipe
  const createPipe = useCallback((): Pipe => {
    const minHeight = 50;
    const maxHeight = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    return {
      x: GAME_CONFIG.CANVAS_WIDTH,
      topHeight,
      bottomY: topHeight + GAME_CONFIG.PIPE_GAP,
      passed: false,
    };
  }, []);

  // Collision detection
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    // Ground collision
    if (bird.y + GAME_CONFIG.BIRD_SIZE / 2 >= GAME_CONFIG.CANVAS_HEIGHT - 20) {
      return true;
    }
    
    // Ceiling collision
    if (bird.y - GAME_CONFIG.BIRD_SIZE / 2 <= 0) {
      return true;
    }

    // Pipe collision
    for (const pipe of pipes) {
      if (
        bird.x + GAME_CONFIG.BIRD_SIZE / 2 > pipe.x &&
        bird.x - GAME_CONFIG.BIRD_SIZE / 2 < pipe.x + GAME_CONFIG.PIPE_WIDTH
      ) {
        if (
          bird.y - GAME_CONFIG.BIRD_SIZE / 2 < pipe.topHeight ||
          bird.y + GAME_CONFIG.BIRD_SIZE / 2 > pipe.bottomY
        ) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Draw bird
  const drawBird = useCallback((ctx: CanvasRenderingContext2D, bird: Bird) => {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    // Bird body (yellow circle)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, GAME_CONFIG.BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    // Bird outline
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(5, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlight
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(6, -4, 1, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(16, -2);
    ctx.lineTo(16, 2);
    ctx.closePath();
    ctx.fill();

    // Wing
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-3, 2, 8, 4, Math.sin(Date.now() * 0.01) * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, []);

  // Draw pipe
  const drawPipe = useCallback((ctx: CanvasRenderingContext2D, pipe: Pipe) => {
    // Pipe gradient
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + GAME_CONFIG.PIPE_WIDTH, 0);
    gradient.addColorStop(0, '#4CAF50');
    gradient.addColorStop(0.5, '#45a049');
    gradient.addColorStop(1, '#3d8b40');

    // Top pipe
    ctx.fillStyle = gradient;
    ctx.fillRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.topHeight);
    
    // Top pipe cap
    ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, GAME_CONFIG.PIPE_WIDTH + 10, 20);

    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.bottomY, GAME_CONFIG.PIPE_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - pipe.bottomY);
    
    // Bottom pipe cap
    ctx.fillRect(pipe.x - 5, pipe.bottomY, GAME_CONFIG.PIPE_WIDTH + 10, 20);

    // Pipe outline
    ctx.strokeStyle = '#2E7D32';
    ctx.lineWidth = 2;
    ctx.strokeRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.topHeight);
    ctx.strokeRect(pipe.x, pipe.bottomY, GAME_CONFIG.PIPE_WIDTH, GAME_CONFIG.CANVAS_HEIGHT - pipe.bottomY);
  }, []);

  // Draw background
  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    // Sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 3; i++) {
      const x = (i * 120 + 50 + gameStateRef.current.frameCount * 0.2) % (GAME_CONFIG.CANVAS_WIDTH + 60);
      const y = 50 + i * 30;
      
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.arc(x + 15, y, 20, 0, Math.PI * 2);
      ctx.arc(x + 30, y, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - 20, GAME_CONFIG.CANVAS_WIDTH, 20);
    
    // Grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, GAME_CONFIG.CANVAS_HEIGHT - 25, GAME_CONFIG.CANVAS_WIDTH, 5);
  }, []);

  // Draw score
  const drawScore = useCallback((ctx: CanvasRenderingContext2D, score: number) => {
    ctx.fillStyle = '#FFF';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    
    const text = score.toString();
    ctx.strokeText(text, GAME_CONFIG.CANVAS_WIDTH / 2, 60);
    ctx.fillText(text, GAME_CONFIG.CANVAS_WIDTH / 2, 60);
  }, []);

  // Game loop
  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameState = gameStateRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);

    // Draw background
    drawBackground(ctx);

    if (!gameState.isStarted) {
      // Draw bird in idle position
      drawBird(ctx, gameState.bird);
      
      // Draw "Tap to start" message
      ctx.fillStyle = '#FFF';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText('Tap to Start!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50);
      ctx.fillText('Tap to Start!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2 + 50);
      
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    if (gameState.isGameOver) {
      // Draw final state
      drawBird(ctx, gameState.bird);
      gameState.pipes.forEach(pipe => drawPipe(ctx, pipe));
      drawScore(ctx, gameState.score);
      
      // Draw game over message
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT);
      
      ctx.fillStyle = '#FFF';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.strokeText('Game Over!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
      ctx.fillText('Game Over!', GAME_CONFIG.CANVAS_WIDTH / 2, GAME_CONFIG.CANVAS_HEIGHT / 2);
      
      return;
    }

    // Update bird physics
    gameState.bird.velocity += GAME_CONFIG.GRAVITY;
    gameState.bird.y += gameState.bird.velocity;
    
    // Bird rotation based on velocity
    gameState.bird.rotation = Math.min(Math.max(gameState.bird.velocity * 0.05, -0.5), 0.5);

    // Handle jump input
    if (keysRef.current.has('jump')) {
      gameState.bird.velocity = GAME_CONFIG.JUMP_FORCE;
      keysRef.current.delete('jump');
    }

    // Update pipes
    gameState.pipes.forEach(pipe => {
      pipe.x -= GAME_CONFIG.PIPE_SPEED;
      
      // Check if bird passed pipe
      if (!pipe.passed && pipe.x + GAME_CONFIG.PIPE_WIDTH < gameState.bird.x) {
        pipe.passed = true;
        gameState.score++;
      }
    });

    // Remove off-screen pipes
    gameState.pipes = gameState.pipes.filter(pipe => pipe.x > -GAME_CONFIG.PIPE_WIDTH);

    // Spawn new pipes
    if (gameState.frameCount % GAME_CONFIG.PIPE_SPAWN_RATE === 0) {
      gameState.pipes.push(createPipe());
    }

    // Check collisions
    if (checkCollision(gameState.bird, gameState.pipes)) {
      gameState.isGameOver = true;
      
      // Calculate points (score = pipes, 1:1 ratio)
      const points = gameState.score;
      setLastScore(gameState.score);
      setLastPoints(points);
      setTotalPoints(prev => prev + points);
      
      // Call parent callback
      onGameEnd?.(gameState.score, points);
      
      // Switch to game over screen after a delay
      setTimeout(() => {
        setScreen('gameOver');
      }, 1500);
      
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    // Draw everything
    gameState.pipes.forEach(pipe => drawPipe(ctx, pipe));
    drawBird(ctx, gameState.bird);
    drawScore(ctx, gameState.score);

    gameState.frameCount++;
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [drawBackground, drawBird, drawPipe, drawScore, createPipe, checkCollision, onGameEnd]);

  // Handle input
  const handleJump = useCallback(() => {
    const gameState = gameStateRef.current;
    
    if (!gameState.isStarted) {
      gameState.isStarted = true;
    }
    
    if (!gameState.isGameOver) {
      keysRef.current.add('jump');
    }
  }, []);

  // Start game
  const startGame = useCallback(() => {
    if (energy <= 0) {
      alert('Not enough energy! Need at least 1 energy to play.');
      return;
    }
    
    const success = consumeEnergy(1); // Consume 1 energy via store
    if (!success) {
      alert('Failed to consume energy!');
      return;
    }
    
    initGame();
    setScreen('playing');
    
    // Start game loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    gameLoop();
  }, [energy, initGame, gameLoop, consumeEnergy]);

  // Setup canvas and event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = GAME_CONFIG.CANVAS_WIDTH;
    canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

    // Touch/click handlers
    const handleTouch = (e: TouchEvent | MouseEvent) => {
      e.preventDefault();
      if (screen === 'playing') {
        handleJump();
      }
    };

    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('mousedown', handleTouch);

    // Keyboard handler
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && screen === 'playing') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('mousedown', handleTouch);
      window.removeEventListener('keydown', handleKeyDown);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [screen, handleJump]);

  // Start game loop when playing
  useEffect(() => {
    if (screen === 'playing') {
      gameLoop();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [screen, gameLoop]);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center touch-none select-none overflow-hidden relative">
      {/* Back button - Always visible */}
      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          className="absolute top-4 left-4 z-50 transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px',
            padding: '12px 20px',
            color: 'white',
            fontSize: 'var(--fs-md)',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          ← Exit
        </button>
      )}

      {/* Menu Screen */}
      {screen === 'menu' && (
        <div className="flex flex-col items-center justify-center w-full max-w-sm px-8">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-yellow-300 drop-shadow-lg mb-4">Pocket Fly</h1>
            <p className="text-xl opacity-90 font-medium text-white">Flappy Bird Mini Game</p>
          </div>
          
          {/* Stats Card */}
          <div 
            className="w-full mb-16"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-semibold text-white">Energy:</span>
              <span className="text-3xl font-bold text-yellow-300">{energy}/{maxEnergy}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-white">Total Score:</span>
              <span className="text-3xl font-bold text-green-300">{totalPoints}</span>
            </div>
          </div>

          {/* Start Button - Separate and Smaller */}
          <div className="flex justify-center mb-8">
            <button
              onClick={startGame}
              disabled={energy <= 0}
              className="transition-all hover:scale-105 active:scale-95"
              style={{
                background: energy > 0 
                  ? 'linear-gradient(135deg, #ffd700, #f5a623)' 
                  : 'rgba(100, 100, 100, 0.3)',
                borderRadius: '16px',
                border: 'none',
                padding: '16px 32px',
                color: energy > 0 ? '#1a1a1f' : 'rgba(255, 255, 255, 0.4)',
                fontSize: 'var(--fs-lg)',
                fontWeight: '700',
                cursor: energy > 0 ? 'pointer' : 'not-allowed',
                boxShadow: energy > 0 ? '0 6px 20px rgba(255, 215, 0, 0.4)' : 'none',
                minWidth: '200px',
              }}
            >
              {energy > 0 ? 'Start Game' : 'No Energy'}
            </button>
          </div>

          {/* Info Text */}
          <div className="text-center text-white opacity-80 space-y-2">
            <p className="text-base">Each game costs 1 energy</p>
            <p className="text-base">Energy regenerates 1 per hour (when below 5)</p>
            <p className="text-base">Score = Pipes</p>
          </div>
        </div>
      )}

      {/* Playing Screen */}
      {screen === 'playing' && (
        <div className="flex flex-col items-center justify-center w-full px-6">
          {/* Game Canvas */}
          <canvas
            ref={canvasRef}
            className="mb-8"
            style={{
              maxWidth: '90vw',
              maxHeight: '70vh',
              imageRendering: 'pixelated',
              borderRadius: '20px',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              backgroundColor: '#87CEEB',
            }}
          />
          
          {/* Instructions */}
          <div 
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '16px 24px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <p className="text-lg font-semibold text-white text-center mb-2">👆 Tap to fly up</p>
            <p className="text-sm text-white opacity-75 text-center">Avoid the green pipes!</p>
          </div>
        </div>
      )}

      {/* Game Over Screen */}
      {screen === 'gameOver' && (
        <div className="flex flex-col items-center justify-center w-full max-w-sm px-8">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-red-300 drop-shadow-lg mb-4">Game Over!</h2>
            <p className="text-xl text-white opacity-90">You flew through {lastScore} pipes</p>
          </div>
          
          {/* Stats Card */}
          <div 
            className="w-full mb-12"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-semibold text-white">Last Score:</span>
              <span className="text-3xl font-bold text-yellow-300">{lastScore}</span>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-semibold text-white">Reward Earned:</span>
              <span className="text-3xl font-bold text-green-300">+{lastPoints}</span>
            </div>
            
            <div 
              style={{ 
                height: '1px', 
                background: 'rgba(255, 255, 255, 0.2)', 
                margin: '16px 0' 
              }} 
            />
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-semibold text-white">Energy Left:</span>
              <span className="text-3xl font-bold text-blue-300">{energy}/{maxEnergy}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-white">Total Score:</span>
              <span className="text-3xl font-bold text-purple-300">{totalPoints}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-4">
            <button
              onClick={startGame}
              disabled={energy <= 0}
              className="w-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: energy > 0 
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                  : 'rgba(100, 100, 100, 0.3)',
                borderRadius: '16px',
                border: 'none',
                padding: '16px 24px',
                color: energy > 0 ? 'white' : 'rgba(255, 255, 255, 0.4)',
                fontSize: 'var(--fs-lg)',
                fontWeight: '700',
                cursor: energy > 0 ? 'pointer' : 'not-allowed',
                boxShadow: energy > 0 ? '0 6px 20px rgba(34, 197, 94, 0.4)' : 'none',
              }}
            >
              {energy > 0 ? 'Play Again' : 'No Energy'}
            </button>
            
            <button
              onClick={onBackToMenu}
              className="w-full transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #6b7280, #4b5563)',
                borderRadius: '16px',
                border: 'none',
                padding: '16px 24px',
                color: 'white',
                fontSize: 'var(--fs-lg)',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(107, 114, 128, 0.4)',
              }}
            >
              Exit Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PocketFlyGame;