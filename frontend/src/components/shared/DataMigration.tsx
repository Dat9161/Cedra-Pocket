/**
 * Data Migration Component
 * Handles syncing local data to backend when backend becomes available
 */

'use client';

import { useState, useEffect } from 'react';
import { DataSyncService } from '../../services/data-sync.service';

interface DataMigrationProps {
  onComplete?: () => void;
}

export function DataMigration({ onComplete }: DataMigrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    checkIfMigrationNeeded();
  }, []);

  const checkIfMigrationNeeded = async () => {
    try {
      const syncService = new DataSyncService();
      const needsSync = await syncService.isSyncNeeded();
      
      if (needsSync) {
        setIsVisible(true);
        setStatus('Local data detected. Sync with backend?');
      } else {
        // Check if we have local data that hasn't been marked as synced
        const storedData = localStorage.getItem('tg-mini-app-storage');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          if (!parsed.state?.dataSynced && parsed.state?.pet?.level > 1) {
            setIsVisible(true);
            setStatus('Pet data found. Would you like to sync with backend?');
          }
        }
      }
    } catch (error) {
      console.error('Migration check failed:', error);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError('');
    setStatus('Syncing data to backend...');

    try {
      const syncService = new DataSyncService();
      const success = await syncService.syncLocalDataToBackend();

      if (success) {
        setStatus('✅ Data synced successfully!');
        syncService.clearLocalData();
        
        setTimeout(() => {
          setIsVisible(false);
          onComplete?.();
        }, 2000);
      } else {
        setError('❌ Sync failed. You can continue with fresh data or try again.');
      }
    } catch (error) {
      setError(`❌ Sync error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setStatus('Skipping sync. Starting fresh with backend data.');
    
    // Mark as synced to avoid showing again
    try {
      const storedData = localStorage.getItem('tg-mini-app-storage');
      if (storedData) {
        const parsed = JSON.parse(storedData);
        parsed.state.dataSynced = true;
        parsed.state.syncSkipped = true;
        localStorage.setItem('tg-mini-app-storage', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error('Failed to mark sync as skipped:', e);
    }

    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1000);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a2e',
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        border: '1px solid #333'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>
          🔄
        </div>

        <h2 style={{
          color: '#fff',
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '16px'
        }}>
          Data Migration
        </h2>

        <p style={{
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '16px',
          lineHeight: 1.5,
          marginBottom: '24px'
        }}>
          {status}
        </p>

        {error && (
          <div style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              onClick={handleSync}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
            >
              Sync Data
            </button>

            <button
              onClick={handleSkip}
              style={{
                backgroundColor: 'transparent',
                color: 'rgba(255, 255, 255, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
              }}
            >
              Start Fresh
            </button>
          </div>
        )}

        {isLoading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderTop: '2px solid #4CAF50',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Syncing...
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}