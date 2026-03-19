'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Creator {
  id: string;
  name: string;
  wallet: string;
  rumbleUrl: string;
  followers: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  creators: Creator[];
}

const CATEGORIES: Category[] = [
  {
    id: 'news',
    name: 'News & Commentary',
    description: 'Independent news, political commentary, and current events',
    icon: '📰',
    color: '#dc2626',
    creators: [
      { id: 'n1', name: 'Timcast IRL', wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', rumbleUrl: 'https://rumble.com/c/Timcast', followers: 1500000 },
      { id: 'n2', name: 'Dan Bongino', wallet: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', rumbleUrl: 'https://rumble.com/c/Bongino', followers: 3000000 },
      { id: 'n3', name: 'Glenn Beck', wallet: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', rumbleUrl: 'https://rumble.com/c/GlennBeck', followers: 1200000 },
      { id: 'n4', name: 'Redacted', wallet: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', rumbleUrl: 'https://rumble.com/c/Redacted', followers: 800000 },
      { id: 'n5', name: 'The Jimmy Dore Show', wallet: '0x1234567890123456789012345678901234567890', rumbleUrl: 'https://rumble.com/c/TheJimmyDoreShow', followers: 650000 },
      { id: 'n6', name: 'Kim Iversen', wallet: '0x2345678901234567890123456789012345678901', rumbleUrl: 'https://rumble.com/c/KimIversen', followers: 420000 },
      { id: 'n7', name: 'The Hill', wallet: '0x3456789012345678901234567890123456789012', rumbleUrl: 'https://rumble.com/c/TheHill', followers: 890000 },
      { id: 'n8', name: 'Breaking Points', wallet: '0x4567890123456789012345678901234567890123', rumbleUrl: 'https://rumble.com/c/breakingpoints', followers: 750000 },
      { id: 'n9', name: 'Valuetainment', wallet: '0x5678901234567890123456789012345678901234', rumbleUrl: 'https://rumble.com/c/valuetainment', followers: 980000 },
      { id: 'n10', name: 'Bannons War Room', wallet: '0x6789012345678901234567890123456789012345', rumbleUrl: 'https://rumble.com/c/BannonsWarRoom', followers: 520000 },
    ]
  },
  {
    id: 'crypto',
    name: 'Crypto & Finance',
    description: 'Cryptocurrency news, trading, DeFi, and financial markets',
    icon: '₿',
    color: '#f59e0b',
    creators: [
      { id: 'c1', name: 'Crypto Wendy O', wallet: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', rumbleUrl: 'https://rumble.com/c/CryptoWendyO', followers: 250000 },
      { id: 'c2', name: 'Coin Bureau', wallet: '0x7890123456789012345678901234567890123456', rumbleUrl: 'https://rumble.com/c/CoinBureau', followers: 380000 },
      { id: 'c3', name: 'BitBoy Crypto', wallet: '0x8901234567890123456789012345678901234567', rumbleUrl: 'https://rumble.com/c/BitBoyCrypto', followers: 420000 },
      { id: 'c4', name: 'Altcoin Daily', wallet: '0x9012345678901234567890123456789012345678', rumbleUrl: 'https://rumble.com/c/AltcoinDaily', followers: 310000 },
      { id: 'c5', name: 'The Modern Investor', wallet: '0x0123456789012345678901234567890123456789', rumbleUrl: 'https://rumble.com/c/TheModernInvestor', followers: 180000 },
      { id: 'c6', name: 'Crypto Zombie', wallet: '0x1111222233334444555566667777888899990000', rumbleUrl: 'https://rumble.com/c/CryptoZombie', followers: 220000 },
      { id: 'c7', name: 'Crypto Jebb', wallet: '0x2222333344445555666677778888999900001111', rumbleUrl: 'https://rumble.com/c/CryptoJebb', followers: 150000 },
      { id: 'c8', name: 'Crypto Capital Venture', wallet: '0x3333444455556666777788889999000011112222', rumbleUrl: 'https://rumble.com/c/CryptoCapitalVenture', followers: 190000 },
      { id: 'c9', name: 'Crypto Banter', wallet: '0x4444555566667777888899990000111122223333', rumbleUrl: 'https://rumble.com/c/CryptoBanter', followers: 280000 },
      { id: 'c10', name: 'Crypto Rover', wallet: '0x5555666677778888999900001111222233334444', rumbleUrl: 'https://rumble.com/c/CryptoRover', followers: 170000 },
    ]
  },
  {
    id: 'education',
    name: 'Education & Philosophy',
    description: 'Educational content, philosophy, psychology, and personal development',
    icon: '🎓',
    color: '#8b5cf6',
    creators: [
      { id: 'e1', name: 'Jordan Peterson', wallet: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', rumbleUrl: 'https://rumble.com/c/JordanPeterson', followers: 1500000 },
      { id: 'e2', name: 'Dr. John Campbell', wallet: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', rumbleUrl: 'https://rumble.com/c/DrJohnCampbell', followers: 900000 },
      { id: 'e3', name: 'Academy of Ideas', wallet: '0x6666777788889999000011112222333344445555', rumbleUrl: 'https://rumble.com/c/AcademyofIdeas', followers: 320000 },
      { id: 'e4', name: 'Lex Fridman', wallet: '0x7777888899990000111122223333444455556666', rumbleUrl: 'https://rumble.com/c/lexfridman', followers: 780000 },
      { id: 'e5', name: 'After Skool', wallet: '0x8888999900001111222233334444555566667777', rumbleUrl: 'https://rumble.com/c/AfterSkool', followers: 410000 },
      { id: 'e6', name: 'The School of Life', wallet: '0x9999000011112222333344445555666677778888', rumbleUrl: 'https://rumble.com/c/TheSchoolofLife', followers: 520000 },
      { id: 'e7', name: 'Pursuit of Wonder', wallet: '0x0000111122223333444455556666777788889999', rumbleUrl: 'https://rumble.com/c/PursuitofWonder', followers: 290000 },
      { id: 'e8', name: 'Einzelgänger', wallet: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333', rumbleUrl: 'https://rumble.com/c/Einzelganger', followers: 240000 },
      { id: 'e9', name: 'Philosophize This', wallet: '0xBBBBCCCCDDDDEEEEFFFF00001111222233334444', rumbleUrl: 'https://rumble.com/c/PhilosophizeThis', followers: 180000 },
      { id: 'e10', name: 'Wireless Philosophy', wallet: '0xCCCCDDDDEEEEFFFF000011112222333344445555', rumbleUrl: 'https://rumble.com/c/WirelessPhilosophy', followers: 150000 },
    ]
  },
  {
    id: 'entertainment',
    name: 'Comedy & Entertainment',
    description: 'Comedy, satire, entertainment, and pop culture commentary',
    icon: '🎭',
    color: '#ec4899',
    creators: [
      { id: 't1', name: 'Steven Crowder', wallet: '0x9999999999999999999999999999999999999999', rumbleUrl: 'https://rumble.com/c/StevenCrowder', followers: 1800000 },
      { id: 't2', name: 'Russell Brand', wallet: '0x8888888888888888888888888888888888888888', rumbleUrl: 'https://rumble.com/c/RussellBrand', followers: 2000000 },
      { id: 't3', name: 'Geeks + Gamers', wallet: '0x1010101010101010101010101010101010101010', rumbleUrl: 'https://rumble.com/c/GeeksGamers', followers: 450000 },
      { id: 't4', name: 'The Quartering', wallet: '0xDDDDEEEEFFFF00001111222233334444555566667', rumbleUrl: 'https://rumble.com/c/TheQuartering', followers: 620000 },
      { id: 't5', name: 'Nerdrotic', wallet: '0xEEEEFFFF000011112222333344445555666677778', rumbleUrl: 'https://rumble.com/c/Nerdrotic', followers: 380000 },
      { id: 't6', name: 'Critical Drinker', wallet: '0xFFFF0000111122223333444455556666777788889', rumbleUrl: 'https://rumble.com/c/TheCriticalDrinker', followers: 510000 },
      { id: 't7', name: 'Angry Video Game Nerd', wallet: '0x0000111122223333444455556666777788889999A', rumbleUrl: 'https://rumble.com/c/Cinemassacre', followers: 720000 },
      { id: 't8', name: 'Nostalgia Critic', wallet: '0x111122223333444455556666777788889999AAAAB', rumbleUrl: 'https://rumble.com/c/ChannelAwesome', followers: 490000 },
      { id: 't9', name: 'RedLetterMedia', wallet: '0x22223333444455556666777788889999AAAABBBB', rumbleUrl: 'https://rumble.com/c/RedLetterMedia', followers: 580000 },
      { id: 't10', name: 'YellowFlash 2', wallet: '0x3333444455556666777788889999AAAABBBBCCCC', rumbleUrl: 'https://rumble.com/c/YellowFlash2', followers: 340000 },
    ]
  },
];

export default function CreatorDonationDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tipAmount, setTipAmount] = useState(10);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Recurring payment state
  const [recurringSchedules, setRecurringSchedules] = useState<Array<{ 
    scheduleId: number; 
    categoryId: string; 
    amount: number; 
    interval: number;
    userAddress: string;
  }>>([]);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [selectedCategoryForRecurring, setSelectedCategoryForRecurring] = useState<Category | null>(null);
  const [recurringInterval, setRecurringInterval] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true);
  const executionLockRef = useRef(false);

  // Load wallet from localStorage on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      setWalletAddress(savedWallet);
    }
  }, []);

  // Auto-trigger recurring payments (backend execution)
  useEffect(() => {
    if (!autoTriggerEnabled || recurringSchedules.length === 0 || !walletAddress) return;

    const checkAndTrigger = async () => {
      if (executionLockRef.current) {
        console.log('[Auto-Trigger] Already executing, skipping...');
        return;
      }
      
      executionLockRef.current = true;
      
      try {
        for (const schedule of recurringSchedules) {
          try {
            console.log(`[Auto-Trigger] Checking schedule ${schedule.scheduleId}...`);
            
            // Find the category to get creator wallets
            const category = CATEGORIES.find(c => c.id === schedule.categoryId);
            if (!category) continue;

            const res = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'execute_category_recurring',
                payload: {
                  scheduleId: schedule.scheduleId,
                  userAddress: schedule.userAddress,
                  creators: category.creators.map(c => c.wallet),
                  totalAmount: schedule.amount,
                }
              })
            });

            const data = await res.json();
            
            if (data.success && data.execTxHash) {
              console.log(`[Auto-Trigger] Payment executed for ${category.name}!`);
              alert(`✅ Auto-payment executed!\n${category.name}\n${schedule.amount} USDT split among ${category.creators.length} creators`);
            } else if (data.error && !data.error.includes('Too soon')) {
              console.log(`[Auto-Trigger] Error:`, data.error);
            } else {
              console.log(`[Auto-Trigger] Schedule ${schedule.scheduleId} not due yet`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (e: any) {
            console.error(`[Auto-Trigger] Error for schedule ${schedule.scheduleId}:`, e.message);
          }
        }
      } finally {
        executionLockRef.current = false;
      }
    };

    const interval = setInterval(checkAndTrigger, 60000);
    const initialTimeout = setTimeout(checkAndTrigger, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [recurringSchedules, autoTriggerEnabled, walletAddress]);

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        
        // Request accounts
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const connectedAddress = accounts[0];
        
        // Switch to Sepolia
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchErr: any) {
            if (switchErr.code === 4902 || switchErr.code === -32603) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://rpc.sepolia.org'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io'],
                }],
              });
            }
          }
        }
        
        setWalletAddress(connectedAddress);
        localStorage.setItem('connectedWallet', connectedAddress);
      } catch (e) {
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask');
    }
  };

  const handleTipCategory = async (category: Category) => {
    if (!walletAddress) {
      alert('Connect wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      const ethereum = (window as any).ethereum;
      const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
      const amountPerCreator = tipAmount / category.creators.length;

      for (const creator of category.creators) {
        const amount = BigInt(Math.floor(amountPerCreator * 1e6));
        const data = '0xa9059cbb' + creator.wallet.slice(2).padStart(64, '0') + amount.toString(16).padStart(64, '0');

        await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ from: walletAddress, to: USDT, data, chainId: '0xaa36a7' }],
        });
      }

      alert(`✅ Tipped ${category.creators.length} creators!\nTotal: ${tipAmount} USDT`);
    } catch (e: any) {
      if (e.code !== 4001) alert(`Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetupRecurring = async (category: Category) => {
    if (!walletAddress) { alert('Connect wallet first'); return; }

    setIsProcessing(true);
    try {
      const ethereum = (window as any).ethereum;
      const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
      const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf';

      const intervalSeconds =
        recurringInterval === 'daily' ? 86400 :
        recurringInterval === 'weekly' ? 604800 : 2592000;

      const totalAmountUnits = BigInt(Math.floor(tipAmount * 1e6));

      // ── Step 1: ONE approval for 100 payments ──────────────────────────
      const approveAmount = totalAmountUnits * BigInt(100);
      const approveData = '0x095ea7b3'
        + RECURRING_CONTRACT.slice(2).padStart(64, '0')
        + approveAmount.toString(16).padStart(64, '0');

      const approveTx = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: walletAddress, to: USDT, data: approveData, chainId: '0xaa36a7' }],
      });
      console.log('[Recurring] Approval tx:', approveTx);

      // Wait for approval to confirm
      await new Promise(resolve => setTimeout(resolve, 8000));

      // ── Step 2: ONE schedule — backend wallet as recipient ─────────────
      // Backend will split among creators when executing
      const backendRes = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_address_only' }),
      });
      const backendData = await backendRes.json();
      const backendWallet = backendData.address;

      const createScheduleData = '0x13bcdac6'
        + USDT.slice(2).padStart(64, '0')
        + backendWallet.slice(2).padStart(64, '0')
        + totalAmountUnits.toString(16).padStart(64, '0')
        + intervalSeconds.toString(16).padStart(64, '0')
        + '0'.padStart(64, '0'); // unlimited

      const scheduleTx = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: walletAddress, to: RECURRING_CONTRACT, data: createScheduleData, chainId: '0xaa36a7' }],
      });
      console.log('[Recurring] Schedule tx:', scheduleTx);

      // Wait for schedule tx to confirm
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Store single schedule in state
      const scheduleId = recurringSchedules.length;
      setRecurringSchedules(prev => [...prev, {
        scheduleId,
        categoryId: category.id,
        amount: tipAmount,
        interval: intervalSeconds,
        userAddress: walletAddress,
      }]);

      setShowRecurringModal(false);
      alert(`✅ Auto-pay set up!\n\n${tipAmount} USDT ${recurringInterval} → ${category.name}\nSplit equally among ${category.creators.length} creators\n\nOnly 2 transactions needed!`);

    } catch (e: any) {
      console.error('[Recurring] Error:', e);
      if (e.code === 4001) alert('Cancelled by user');
      else alert(`Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalFollowers = (category: Category) => 
    category.creators.reduce((sum, c) => sum + c.followers, 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#fff', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
      {/* Back Button */}
      <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#85c742', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
        ← Back to Dashboard
      </a>
      {/* Header */}
      <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #85c742 0%, #00BFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎁 Creator Donation Hub
        </h1>
        <p style={{ color: '#888', fontSize: '1.2rem', marginBottom: '1rem' }}>
          Support Rumble creators by category - Tip entire groups at once
        </p>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          {CATEGORIES.reduce((sum, cat) => sum + cat.creators.length, 0)} verified creators across {CATEGORIES.length} categories
        </p>
      </div>

      {/* Wallet */}
      {!walletAddress ? (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <button onClick={connectWallet} style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#85c742', color: '#000', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 20px rgba(133,199,66,0.3)' }}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(133,199,66,0.1)', borderRadius: '12px', border: '1px solid rgba(133,199,66,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <span style={{ color: '#85c742', fontWeight: 'bold' }}>✅ {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}</span>
            <button 
              onClick={() => {
                setWalletAddress(null);
                localStorage.removeItem('connectedWallet');
              }}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', backgroundColor: 'rgba(220,38,38,0.2)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.4)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Disconnect
            </button>
          </div>

          {/* Recurring Payments Status Banner */}
          {recurringSchedules.length > 0 && (
            <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(167,139,250,0.1)', border: '2px solid rgba(167,139,250,0.3)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#a78bfa', marginBottom: '0.5rem' }}>
                    🔄 Active Auto-Payments
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#888' }}>
                    {recurringSchedules.length} schedule{recurringSchedules.length > 1 ? 's' : ''} running • Checks every 60 seconds
                  </p>
                </div>
                <button
                  onClick={() => setAutoTriggerEnabled(!autoTriggerEnabled)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    backgroundColor: autoTriggerEnabled ? 'rgba(220,38,38,0.2)' : 'rgba(133,199,66,0.2)',
                    color: autoTriggerEnabled ? '#dc2626' : '#85c742',
                    border: autoTriggerEnabled ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(133,199,66,0.4)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {autoTriggerEnabled ? '⏸️ Pause All' : '▶️ Resume All'}
                </button>
              </div>
              
              {/* Schedule List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {CATEGORIES.map(cat => {
                  const schedules = recurringSchedules.filter(s => s.categoryId === cat.id);
                  if (schedules.length === 0) return null;
                  return (
                    <div key={cat.id} style={{ padding: '0.75rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: `1px solid ${cat.color}40` }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{cat.icon}</div>
                      <div style={{ fontSize: '0.8rem', color: cat.color, fontWeight: 'bold', marginBottom: '0.25rem' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>
                        {schedules.length} schedule{schedules.length > 1 ? 's' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Tip Amount */}
      <div style={{ marginBottom: '3rem', maxWidth: '400px', margin: '0 auto 3rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
          Total Tip Amount (USDT)
        </label>
        <input
          type="number"
          value={tipAmount}
          onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
          min="1"
          step="1"
          style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid rgba(133,199,66,0.3)', borderRadius: '12px', color: '#fff', textAlign: 'center', fontWeight: 'bold' }}
        />
        <p style={{ fontSize: '0.85rem', color: '#888', marginTop: '0.5rem', textAlign: 'center' }}>
          Will be split equally among all creators in the category
        </p>
      </div>

      {/* Category Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '2rem', 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        <style>{`
          @media (max-width: 768px) {
            div[style*="gridTemplateColumns: 'repeat(2, 1fr)'"] {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
        {CATEGORIES.map(category => (
          <div
            key={category.id}
            style={{
              padding: '2rem',
              backgroundColor: 'rgba(255,255,255,0.05)',
              border: `2px solid ${category.color}40`,
              borderRadius: '16px',
              transition: 'all 0.3s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = `0 8px 30px ${category.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Category Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>{category.icon}</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: category.color }}>{category.name}</h2>
              <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1rem' }}>{category.description}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', fontSize: '0.85rem', color: '#666' }}>
                <span>👥 {category.creators.length} creators</span>
                <span>📊 {(totalFollowers(category) / 1000000).toFixed(1)}M followers</span>
              </div>
            </div>

            {/* Creators List */}
            <div style={{ marginBottom: '1.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem' }}>
              {category.creators.map((creator, idx) => (
                <div key={creator.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', fontSize: '0.85rem', color: '#aaa', borderBottom: idx < category.creators.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span>{creator.name}</span>
                  <span>{(creator.followers / 1000).toFixed(0)}K</span>
                </div>
              ))}
            </div>

            {/* Tip Info */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>Each creator receives</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: category.color }}>
                {(tipAmount / category.creators.length).toFixed(2)} USDT
              </div>
            </div>

            {/* Tip Button */}
            <button
              onClick={() => handleTipCategory(category)}
              disabled={isProcessing || !walletAddress}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                backgroundColor: category.color,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: isProcessing || !walletAddress ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !walletAddress ? 0.5 : 1,
                transition: 'all 0.2s',
                marginBottom: '0.5rem'
              }}
            >
              {isProcessing ? '⏳ Processing...' : `🚀 Tip ${category.creators.length} Creators Now`}
            </button>

            {/* Recurring Payment Button */}
            <button
              onClick={() => {
                setSelectedCategoryForRecurring(category);
                setShowRecurringModal(true);
              }}
              disabled={isProcessing || !walletAddress}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: 'bold',
                backgroundColor: 'rgba(167,139,250,0.2)',
                color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.4)',
                borderRadius: '12px',
                cursor: isProcessing || !walletAddress ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !walletAddress ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              🔄 Set Up Auto-Pay
            </button>

            {/* Show active schedules for this category */}
            {recurringSchedules.filter(s => s.categoryId === category.id).length > 0 && (
              <div style={{ marginTop: '0.75rem', padding: '0.5rem', backgroundColor: 'rgba(134,239,172,0.1)', border: '1px solid rgba(134,239,172,0.3)', borderRadius: '8px', fontSize: '0.75rem', color: '#86efac', textAlign: 'center' }}>
                ✅ Auto-pay active ({recurringSchedules.filter(s => s.categoryId === category.id).length} schedules)
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recurring Payment Modal */}
      {showRecurringModal && selectedCategoryForRecurring && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '2rem', borderRadius: '16px', maxWidth: '500px', width: '90%', border: '2px solid rgba(167,139,250,0.4)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#a78bfa' }}>
              🔄 Set Up Auto-Pay
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#888', marginBottom: '1.5rem' }}>
              Automatically tip {selectedCategoryForRecurring.name} creators on a schedule
            </p>

            {/* Amount */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>
                Total Amount per Payment (USDT)
              </label>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                min="1"
                step="1"
                style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '2px solid rgba(167,139,250,0.3)', borderRadius: '8px', color: '#fff' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                Each creator receives: {(tipAmount / selectedCategoryForRecurring.creators.length).toFixed(2)} USDT
              </p>
            </div>

            {/* Interval */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#aaa' }}>
                Payment Frequency
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                {(['daily', 'weekly', 'monthly'] as const).map(interval => (
                  <button
                    key={interval}
                    onClick={() => setRecurringInterval(interval)}
                    style={{
                      padding: '0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      backgroundColor: recurringInterval === interval ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)',
                      color: recurringInterval === interval ? '#a78bfa' : '#888',
                      border: recurringInterval === interval ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {interval.charAt(0).toUpperCase() + interval.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '1rem', backgroundColor: 'rgba(167,139,250,0.1)', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '0.5rem' }}>Summary — only 2 wallet approvals:</p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>① Approve {tipAmount} USDT × 100 payments</p>
              <p style={{ fontSize: '0.9rem', color: '#fff' }}>② Create 1 schedule → auto-split to {selectedCategoryForRecurring.creators.length} creators</p>
              <p style={{ fontSize: '0.85rem', color: '#86efac', marginTop: '0.5rem' }}>
                Each creator gets {(tipAmount / selectedCategoryForRecurring.creators.length).toFixed(2)} USDT every {recurringInterval === 'daily' ? 'day' : recurringInterval === 'weekly' ? 'week' : 'month'}
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowRecurringModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#888',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSetupRecurring(selectedCategoryForRecurring)}
                disabled={isProcessing}
                style={{
                  flex: 2,
                  padding: '0.75rem',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  backgroundColor: isProcessing ? 'rgba(167,139,250,0.2)' : '#a78bfa',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.5 : 1
                }}
              >
                {isProcessing ? '⏳ Setting up...' : '✅ Confirm Auto-Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
