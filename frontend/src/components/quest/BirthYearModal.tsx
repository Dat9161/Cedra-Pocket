'use client';

import { useState } from 'react';

interface BirthYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (birthYear: number) => void;
  isLoading?: boolean;
}

export function BirthYearModal({ isOpen, onClose, onSubmit, isLoading = false }: BirthYearModalProps) {
  const [birthYear, setBirthYear] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const year = parseInt(birthYear);
    const currentYear = new Date().getFullYear();

    // Validation
    if (!birthYear || isNaN(year)) {
      setError('Please enter a valid year');
      return;
    }

    if (year < 1900 || year > currentYear - 5) {
      setError(`Please enter a year between 1900 and ${currentYear - 5}`);
      return;
    }

    setError('');
    onSubmit(year);
  };

  const handleClose = () => {
    setBirthYear('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div 
        className="relative mx-4 w-full max-w-sm"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 'clamp(20px, 5vw, 28px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          padding: 'clamp(24px, 6vw, 32px)',
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div 
            style={{ 
              fontSize: 'clamp(48px, 12vw, 64px)',
              marginBottom: 'clamp(12px, 3vw, 16px)'
            }}
          >
            🥚
          </div>
          <h2 
            className="font-bold"
            style={{ 
              fontSize: 'clamp(20px, 5vw, 24px)',
              color: '#1a1a2e',
              marginBottom: 'clamp(8px, 2vw, 12px)'
            }}
          >
            Hatch Your Pet Egg
          </h2>
          <p 
            style={{ 
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: 'rgba(26, 26, 46, 0.7)',
              lineHeight: '1.4'
            }}
          >
            Enter your birth year to determine your pet's zodiac traits and hatch your egg!
          </p>
        </div>

        {/* Input */}
        <div style={{ marginBottom: 'clamp(20px, 5vw, 24px)' }}>
          <label 
            className="block font-semibold"
            style={{ 
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              color: '#1a1a2e',
              marginBottom: 'clamp(8px, 2vw, 12px)'
            }}
          >
            Birth Year
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            placeholder="e.g., 1995"
            min="1900"
            max={new Date().getFullYear() - 5}
            disabled={isLoading}
            className="w-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
            style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '2px solid rgba(26, 26, 46, 0.1)',
              borderRadius: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(12px, 3vw, 16px)',
              fontSize: 'clamp(16px, 4vw, 18px)',
              color: '#1a1a2e',
            }}
          />
          {error && (
            <p 
              style={{ 
                fontSize: 'clamp(12px, 3vw, 14px)',
                color: '#ef4444',
                marginTop: 'clamp(4px, 1vw, 6px)'
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(156, 163, 175, 0.8)',
              color: '#1a1a2e',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(12px, 3vw, 16px)',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !birthYear}
            className="flex-1 font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: isLoading || !birthYear 
                ? 'rgba(156, 163, 175, 0.8)' 
                : 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 'clamp(12px, 3vw, 16px)',
              padding: 'clamp(12px, 3vw, 16px)',
              fontSize: 'clamp(14px, 3.5vw, 16px)',
              boxShadow: isLoading || !birthYear 
                ? 'none' 
                : '0 4px 16px rgba(255, 200, 0, 0.4)',
              opacity: isLoading || !birthYear ? 0.5 : 1,
            }}
          >
            {isLoading ? 'Hatching...' : 'Hatch Egg 🐣'}
          </button>
        </div>
      </div>
    </div>
  );
}