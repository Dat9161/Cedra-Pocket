/**
 * Pet Debug Page - Debug pet claim issues
 */

'use client';

import { useState, useEffect } from 'react';

export default function PetDebugPage() {
  const [userId, setUserId] = useState('');
  const [petStatus, setPetStatus] = useState(null);
  const [claimResult, setClaimResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try to get user ID from various sources
    let detectedUserId = '';
    
    if (typeof window !== 'undefined') {
      // From Telegram WebApp
      if ((window as any).Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        detectedUserId = String((window as any).Telegram.WebApp.initDataUnsafe.user.id);
      } else {
        // From localStorage
        const storedUser = localStorage.getItem('tg-mini-app-storage');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.state?.user?.telegramId) {
              detectedUserId = parsed.state.user.telegramId;
            }
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
      }
    }
    
    setUserId(detectedUserId || '123456789'); // Fallback test ID
  }, []);

  const testPetStatus = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-pocket-wybm.vercel.app';
      const response = await fetch(`${apiUrl}/game/pet/status/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPetStatus(data);
        console.log('Pet status:', data);
      } else {
        const errorText = await response.text();
        setError(`Status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testClaimRewards = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-pocket-wybm.vercel.app';
      const response = await fetch(`${apiUrl}/game/pet/claim/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClaimResult(data);
        console.log('Claim result:', data);
      } else {
        const errorText = await response.text();
        setError(`Claim failed - Status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createTestUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://cedra-pocket-wybm.vercel.app';
      
      // Try to create user via auth endpoint
      const response = await fetch(`${apiUrl}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initData: `user={"id":${userId},"username":"testuser","first_name":"Test","last_name":"User"}`,
          telegramId: userId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User created/verified:', data);
        setError('User created successfully! Now try pet status.');
      } else {
        const errorText = await response.text();
        setError(`User creation failed - Status ${response.status}: ${errorText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace',
      backgroundColor: '#1a1a2e',
      color: 'white',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#4CAF50' }}>🐾 Pet Debug Page</h1>
      
      <div style={{ 
        backgroundColor: '#16213e', 
        padding: '20px', 
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h2>User ID</h2>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter Telegram User ID"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#0f0f23',
            color: 'white',
            border: '1px solid #333',
            borderRadius: '4px',
            marginBottom: '10px'
          }}
        />
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={createTestUser}
            disabled={loading || !userId}
            style={{
              backgroundColor: '#FF9800',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Create Test User
          </button>
          
          <button 
            onClick={testPetStatus}
            disabled={loading || !userId}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Get Pet Status
          </button>
          
          <button 
            onClick={testClaimRewards}
            disabled={loading || !userId}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            Test Claim Rewards
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          backgroundColor: '#ff4444', 
          padding: '15px', 
          borderRadius: '4px',
          margin: '20px 0'
        }}>
          <strong>Error:</strong>
          <pre style={{ marginTop: '10px', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {error}
          </pre>
        </div>
      )}

      {petStatus && (
        <div style={{ 
          backgroundColor: '#16213e', 
          padding: '20px', 
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h2>Pet Status</h2>
          <pre style={{ 
            backgroundColor: '#0f0f23', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(petStatus, null, 2)}
          </pre>
        </div>
      )}

      {claimResult && (
        <div style={{ 
          backgroundColor: '#16213e', 
          padding: '20px', 
          borderRadius: '8px',
          margin: '20px 0'
        }}>
          <h2>Claim Result</h2>
          <pre style={{ 
            backgroundColor: '#0f0f23', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(claimResult, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ 
        backgroundColor: '#16213e', 
        padding: '20px', 
        borderRadius: '8px',
        margin: '20px 0'
      }}>
        <h2>Debug Steps</h2>
        <ol style={{ lineHeight: 1.6 }}>
          <li>First click "Create Test User" to ensure user exists in database</li>
          <li>Then click "Get Pet Status" to see current pet state</li>
          <li>Finally click "Test Claim Rewards" to test the claim functionality</li>
          <li>Check console (F12) for detailed logs</li>
        </ol>
      </div>
    </div>
  );
}