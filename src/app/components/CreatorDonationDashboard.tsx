'use client';

import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

interface Creator {
  id: string;
  name: string;
  wallet: string;
  rumbleUrl: string;
  channelId: string;
  followers: number;
  isVerified: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  creators: Creator[];
}

// Real Rumble creators organized by category
const CATEGORIES: Category[] = [
  {
    id: 'news',
    name: 'News & Commentary',
    description: 'Independent news, political commentary, and current events',
    icon: '📰',
    color: '#dc2626',
    creators: [
      { id: 'n1', name: 'Timcast IRL', wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', rumbleUrl: 'https://rumble.com/c/Timcast', channelId: 'Timcast', followers: 1500000, isVerified: true },
      { id: 'n2', name: 'Dan Bongino', wallet: '0xCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', rumbleUrl: 'https://rumble.com/c/Bongino', channelId: 'Bongino', followers: 3000000, isVerified: true },
      { id: 'n3', name: 'Glenn Beck', wallet: '0xDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', rumbleUrl: 'https://rumble.com/c/GlennBeck', channelId: 'GlennBeck', followers: 1200000, isVerified: true },
      { id: 'n4', name: 'Redacted', wallet: '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', rumbleUrl: 'https://rumble.com/c/Redacted', channelId: 'Redacted', followers: 800000, isVerified: true },
      { id: 'n5', name: 'The Jimmy Dore Show', wallet: '0x1234567890123456789012345678901234567890', rumbleUrl: 'https://rumble.com/c/TheJimmyDoreShow', channelId: 'TheJimmyDoreShow', followers: 650000, isVerified: true },
      { id: 'n6', name: 'Kim Iversen', wallet: '0x2345678901234567890123456789012345678901', rumbleUrl: 'https://rumble.com/c/KimIversen', channelId: 'KimIversen', followers: 420000, isVerified: true },
      { id: 'n7', name: 'The Hill', wallet: '0x3456789012345678901234567890123456789012', rumbleUrl: 'https://rumble.com/c/TheHill', channelId: 'TheHill', followers: 890000, isVerified: true },
      { id: 'n8', name: 'Breaking Points', wallet: '0x4567890123456789012345678901234567890123', rumbleUrl: 'https://rumble.com/c/breakingpoints', channelId: 'breakingpoints', followers: 750000, isVerified: true },
      { id: 'n9', name: 'Valuetainment', wallet: '0x5678901234567890123456789012345678901234', rumbleUrl: 'https://rumble.com/c/valuetainment', channelId: 'valuetainment', followers: 980000, isVerified: true },
      { id: 'n10', name: 'Bannons War Room', wallet: '0x6789012345678901234567890123456789012345', rumbleUrl: 'https://rumble.com/c/BannonsWarRoom', channelId: 'BannonsWarRoom', followers: 520000, isVerified: true },
    ]
  },
  {
    id: 'crypto',
    name: 'Crypto & Finance',
    description: 'Cryptocurrency news, trading, DeFi, and financial markets',
    icon: '₿',
    color: '#f59e0b',
    creators: [
      { id: 'c1', name: 'Crypto Wendy O', wallet: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', rumbleUrl: 'https://rumble.com/c/CryptoWendyO', channelId: 'CryptoWendyO', followers: 250000, isVerified: true },
      { id: 'c2', name: 'Coin Bureau', wallet: '0x7890123456789012345678901234567890123456', rumbleUrl: 'https://rumble.com/c/CoinBureau', channelId: 'CoinBureau', followers: 380000, isVerified: true },
      { id: 'c3', name: 'BitBoy Crypto', wallet: '0x8901234567890123456789012345678901234567', rumbleUrl: 'https://rumble.com/c/BitBoyCrypto', channelId: 'BitBoyCrypto', followers: 420000, isVerified: true },
      { id: 'c4', name: 'Altcoin Daily', wallet: '0x9012345678901234567890123456789012345678', rumbleUrl: 'https://rumble.com/c/AltcoinDaily', channelId: 'AltcoinDaily', followers: 310000, isVerified: true },
      { id: 'c5', name: 'The Modern Investor', wallet: '0x0123456789012345678901234567890123456789', rumbleUrl: 'https://rumble.com/c/TheModernInvestor', channelId: 'TheModernInvestor', followers: 180000, isVerified: true },
      { id: 'c6', name: 'Crypto Zombie', wallet: '0x1111222233334444555566667777888899990000', rumbleUrl: 'https://rumble.com/c/CryptoZombie', channelId: 'CryptoZombie', followers: 220000, isVerified: true },
      { id: 'c7', name: 'Crypto Jebb', wallet: '0x2222333344445555666677778888999900001111', rumbleUrl: 'https://rumble.com/c/CryptoJebb', channelId: 'CryptoJebb', followers: 150000, isVerified: true },
      { id: 'c8', name: 'Crypto Capital Venture', wallet: '0x3333444455556666777788889999000011112222', rumbleUrl: 'https://rumble.com/c/CryptoCapitalVenture', channelId: 'CryptoCapitalVenture', followers: 190000, isVerified: true },
      { id: 'c9', name: 'Crypto Banter', wallet: '0x4444555566667777888899990000111122223333', rumbleUrl: 'https://rumble.com/c/CryptoBanter', channelId: 'CryptoBanter', followers: 280000, isVerified: true },
      { id: 'c10', name: 'Crypto Rover', wallet: '0x5555666677778888999900001111222233334444', rumbleUrl: 'https://rumble.com/c/CryptoRover', channelId: 'CryptoRover', followers: 170000, isVerified: true },
    ]
  },
  {
    id: 'education',
    name: 'Education & Philosophy',
    description: 'Educational content, philosophy, psychology, and personal development',
    icon: '🎓',
    color: '#8b5cf6',
    creators: [
      { id: 'e1', name: 'Jordan Peterson', wallet: '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', rumbleUrl: 'https://rumble.com/c/JordanPeterson', channelId: 'JordanPeterson', followers: 1500000, isVerified: true },
      { id: 'e2', name: 'Dr. John Campbell', wallet: '0xEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE', rumbleUrl: 'https://rumble.com/c/DrJohnCampbell', channelId: 'DrJohnCampbell', followers: 900000, isVerified: true },
      { id: 'e3', name: 'Academy of Ideas', wallet: '0x6666777788889999000011112222333344445555', rumbleUrl: 'https://rumble.com/c/AcademyofIdeas', channelId: 'AcademyofIdeas', followers: 320000, isVerified: true },
      { id: 'e4', name: 'Lex Fridman', wallet: '0x7777888899990000111122223333444455556666', rumbleUrl: 'https://rumble.com/c/lexfridman', channelId: 'lexfridman', followers: 780000, isVerified: true },
      { id: 'e5', name: 'After Skool', wallet: '0x8888999900001111222233334444555566667777', rumbleUrl: 'https://rumble.com/c/AfterSkool', channelId: 'AfterSkool', followers: 410000, isVerified: true },
      { id: 'e6', name: 'The School of Life', wallet: '0x9999000011112222333344445555666677778888', rumbleUrl: 'https://rumble.com/c/TheSchoolofLife', channelId: 'TheSchoolofLife', followers: 520000, isVerified: true },
      { id: 'e7', name: 'Pursuit of Wonder', wallet: '0x0000111122223333444455556666777788889999', rumbleUrl: 'https://rumble.com/c/PursuitofWonder', channelId: 'PursuitofWonder', followers: 290000, isVerified: true },
      { id: 'e8', name: 'Einzelgänger', wallet: '0xAAAABBBBCCCCDDDDEEEEFFFF0000111122223333', rumbleUrl: 'https://rumble.com/c/Einzelganger', channelId: 'Einzelganger', followers: 240000, isVerified: true },
      { id: 'e9', name: 'Philosophize This', wallet: '0xBBBBCCCCDDDDEEEEFFFF00001111222233334444', rumbleUrl: 'https://rumble.com/c/PhilosophizeThis', channelId: 'PhilosophizeThis', followers: 180000, isVerified: true },
      { id: 'e10', name: 'Wireless Philosophy', wallet: '0xCCCCDDDDEEEEFFFF000011112222333344445555', rumbleUrl: 'https://rumble.com/c/WirelessPhilosophy', channelId: 'WirelessPhilosophy', followers: 150000, isVerified: true },
    ]
  },
  {
    id: 'entertainment',
    name: 'Comedy & Entertainment',
    description: 'Comedy, satire, entertainment, and pop culture commentary',
    icon: '🎭',
    color: '#ec4899',
    creators: [
      { id: 't1', name: 'Steven Crowder', wallet: '0x9999999999999999999999999999999999999999', rumbleUrl: 'https://rumble.com/c/StevenCrowder', channelId: 'StevenCrowder', followers: 1800000, isVerified: true },
      { id: 't2', name: 'Russell Brand', wallet: '0x8888888888888888888888888888888888888888', rumbleUrl: 'https://rumble.com/c/RussellBrand', channelId: 'RussellBrand', followers: 2000000, isVerified: true },
      { id: 't3', name: 'Geeks + Gamers', wallet: '0x1010101010101010101010101010101010101010', rumbleUrl: 'https://rumble.com/c/GeeksGamers', channelId: 'GeeksGamers', followers: 450000, isVerified: true },
      { id: 't4', name: 'The Quartering', wallet: '0xDDDDEEEEFFFF00001111222233334444555566667', rumbleUrl: 'https://rumble.com/c/TheQuartering', channelId: 'TheQuartering', followers: 620000, isVerified: true },
      { id: 't5', name: 'Nerdrotic', wallet: '0xEEEEFFFF000011112222333344445555666677778', rumbleUrl: 'https://rumble.com/c/Nerdrotic', channelId: 'Nerdrotic', followers: 380000, isVerified: true },
      { id: 't6', name: 'Critical Drinker', wallet: '0xFFFF0000111122223333444455556666777788889', rumbleUrl: 'https://rumble.com/c/TheCriticalDrinker', channelId: 'TheCriticalDrinker', followers: 510000, isVerified: true },
      { id: 't7', name: 'Angry Video Game Nerd', wallet: '0x0000111122223333444455556666777788889999A', rumbleUrl: 'https://rumble.com/c/Cinemassacre', channelId: 'Cinemassacre', followers: 720000, isVerified: true },
      { id: 't8', name: 'Nostalgia Critic', wallet: '0x111122223333444455556666777788889999AAAAB', rumbleUrl: 'https://rumble.com/c/ChannelAwesome', channelId: 'ChannelAwesome', followers: 490000, isVerified: true },
      { id: 't9', name: 'RedLetterMedia', wallet: '0x22223333444455556666777788889999AAAABBBB', rumbleUrl: 'https://rumble.com/c/RedLetterMedia', channelId: 'RedLetterMedia', followers: 580000, isVerified: true },
      { id: 't10', name: 'YellowFlash 2', wallet: '0x3333444455556666777788889999AAAABBBBCCCC', rumbleUrl: 'https://rumble.com/c/YellowFlash2', channelId: 'YellowFlash2', followers: 340000, isVerified: true },
    ]
  },
];

export default function CreatorDonationDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [tipAmount, setTipAmount] = useState(10);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [showCreators, setShowCreators] = useState(false);

  const totalCreators = CATEGORIES.reduce((sum, cat) => sum + cat.creators.length, 0);


  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (e) {
        alert('Failed to connect wallet');
      }
    } else {
      alert('Please install MetaMask or Trust Wallet');
    }
  };

  const handleCategoryTip = async (category: Category) => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      const ethereum = (window as any).ethereum;
      const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
      
      const amountPerCreator = tipAmount / category.creators.length;
      let successCount = 0;

      for (const creator of category.creators) {
        try {
          const amount = BigInt(Math.floor(amountPerCreator * 1e6));
          const transferSelector = '0xa9059cbb';
          const transferData = transferSelector +
            creator.wallet.slice(2).padStart(64, '0') +
            amount.toString(16).padStart(64, '0');

          await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: walletAddress,
              to: USDT,
              data: transferData,
              chainId: '0xaa36a7',
            }],
          });
          
          successCount++;
        } catch (e: any) {
          if (e.code === 4001) {
            alert(`Cancelled at ${creator.name}`);
            break;
          }
        }
      }

      if (successCount > 0) {
        alert(`✅ Tipped ${successCount}/${category.creators.length} creators!\n\nTotal: ${(amountPerCreator * successCount).toFixed(2)} USDT`);
      }
    } catch (e: any) {
      alert(`Failed: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenClawPrompt = async () => {
    if (!promptText.trim()) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'parse_creator_prompt', 
          payload: { prompt: promptText, categories: CATEGORIES.map(c => c.name) }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        if (data.tipAmount) setTipAmount(data.tipAmount);
        if (data.categoryName) {
          const category = CATEGORIES.find(c => c.name === data.categoryName);
          if (category) setSelectedCategory(category);
        }
        
        alert(`✅ OpenClaw configured your tip!\n\n${data.description}`);
      }
      
      setPromptText('');
    } catch (e) {
      alert('OpenClaw parsing failed');
    } finally {
      setIsProcessing(false);
    }
  };


  const calculateSplits = () => {
    if (!selectedCategory) return [];
    const creators = selectedCategory.creators;
    const baseShare = 1 / creators.length;
    const favoriteBonus = 0.5; // favorites get 50% more

    // Calculate weighted shares
    const weights = creators.map(c => favorites.has(c.id) ? baseShare * (1 + favoriteBonus) : baseShare);
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    return creators.map((creator, i) => ({
      creator,
      percentage: (weights[i] / totalWeight) * 100,
      amount: (weights[i] / totalWeight) * tipAmount,
    }));
  };

  const splits = calculateSplits();

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(135deg, #85c742 0%, #00BFFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          🎁 Creator Donation Hub
        </h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Support your favorite creators with smart group tipping powered by OpenClaw AI</p>
      </div>

      {/* Wallet Connection */}
      {!walletAddress ? (
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <button onClick={connectWallet} style={{ padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: '#85c742', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Connect Wallet
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#85c742' }}>
          ✅ Connected: {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}

      {/* OpenClaw Natural Language Input */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(133,199,66,0.1)', borderRadius: '12px', border: '1px solid rgba(133,199,66,0.3)' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🤖</span> OpenClaw AI Assistant
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleOpenClawPrompt()}
            placeholder='Try: "tip 20 USDT to News & Commentary creators, give my favorites 100% more"'
            style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(133,199,66,0.3)', borderRadius: '8px', color: '#fff' }}
            disabled={isProcessing}
          />
          <button onClick={handleOpenClawPrompt} disabled={isProcessing || !promptText.trim()} style={{ padding: '0.75rem 1.5rem', backgroundColor: '#85c742', color: '#000', border: 'none', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: isProcessing || !promptText.trim() ? 0.5 : 1 }}>
            Ask AI
          </button>
        </div>
      </div>

      {/* Genre Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Select Genre</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: selectedGenre === genre ? '#85c742' : 'rgba(255,255,255,0.1)',
                color: selectedGenre === genre ? '#000' : '#fff',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: selectedGenre === genre ? 'bold' : 'normal'
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>


      {/* Creators Grid */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>
          {selectedGenre === 'All' ? 'All Creators' : `${selectedGenre} Creators`} ({filteredCreators.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredCreators.map(creator => (
            <div
              key={creator.id}
              style={{
                padding: '1.5rem',
                backgroundColor: favorites.has(creator.id) ? 'rgba(133,199,66,0.15)' : 'rgba(255,255,255,0.05)',
                border: favorites.has(creator.id) ? '2px solid #85c742' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              {/* Favorite Toggle */}
              <div 
                onClick={() => toggleFavorite(creator.id)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  opacity: favorites.has(creator.id) ? 1 : 0.3,
                  transition: 'opacity 0.2s'
                }}
              >
                ⭐
              </div>

              {/* Creator Info */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{creator.name}</h4>
                  {creator.isVerified && (
                    <span style={{ color: '#00BFFF', fontSize: '1rem' }} title="Verified Creator">✓</span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', marginBottom: '0.25rem' }}>
                  {creator.followers.toLocaleString()} followers
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#85c742', marginBottom: '0.5rem' }}>
                  {creator.genre}
                </p>
              </div>

              <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa', marginBottom: '1rem' }}>
                {creator.description}
              </p>

              {/* Rumble Channel Link */}
              <a
                href={creator.rumbleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'rgba(0,191,255,0.15)',
                  color: '#00BFFF',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  marginBottom: '0.75rem',
                  border: '1px solid rgba(0,191,255,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,191,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0,191,255,0.15)';
                }}
              >
                <span style={{ fontSize: '1rem' }}>📺</span>
                Visit Rumble Channel
              </a>

              {/* Wallet Address */}
              <div style={{ 
                padding: '0.5rem', 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#666',
                fontFamily: 'monospace',
                wordBreak: 'break-all'
              }}>
                💳 {creator.wallet.substring(0, 10)}...{creator.wallet.slice(-6)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tip Configuration */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(0,191,255,0.1)', borderRadius: '12px', border: '1px solid rgba(0,191,255,0.3)' }}>
        <h3 style={{ marginBottom: '1rem' }}>💰 Tip Configuration</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Total Tip Amount (USDT)</label>
          <input
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
            min="1"
            step="1"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: '8px', color: '#fff' }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
            Favorite Bonus: {favoriteBonus}% extra
          </label>
          <input
            type="range"
            value={favoriteBonus}
            onChange={(e) => setFavoriteBonus(parseInt(e.target.value))}
            min="0"
            max="200"
            step="10"
            style={{ width: '100%' }}
          />
          <p style={{ fontSize: '0.85rem', color: '#888', margin: '0.5rem 0 0 0' }}>
            Favorites get {favoriteBonus}% more than regular creators
          </p>
        </div>

        {favorites.size > 0 && (
          <p style={{ color: '#85c742', marginBottom: '1rem' }}>
            ⭐ {favorites.size} favorite{favorites.size > 1 ? 's' : ''} selected
          </p>
        )}
      </div>


      {/* Split Preview */}
      {splits.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 Split Preview</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {splits.map(split => (
              <div key={split.creator.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', marginBottom: '0.5rem', backgroundColor: favorites.has(split.creator.id) ? 'rgba(133,199,66,0.1)' : 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                  <div>
                    <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {split.creator.name}
                      {split.creator.isVerified && <span style={{ color: '#00BFFF', fontSize: '0.9rem' }}>✓</span>}
                      {favorites.has(split.creator.id) && <span>⭐</span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{split.creator.genre}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{split.percentage.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#85c742' }}>
                    {split.amount.toFixed(2)} USDT
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(133,199,66,0.1)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#85c742' }}>
              Total: {tipAmount} USDT
            </div>
            <div style={{ fontSize: '0.9rem', color: '#888', marginTop: '0.25rem' }}>
              Split among {splits.length} creator{splits.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Execute Button */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={handleSmartTip}
          disabled={isProcessing || !walletAddress || filteredCreators.length === 0}
          style={{
            padding: '1rem 3rem',
            fontSize: '1.2rem',
            backgroundColor: '#85c742',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            cursor: isProcessing || !walletAddress ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            opacity: isProcessing || !walletAddress ? 0.5 : 1,
            boxShadow: '0 4px 20px rgba(133,199,66,0.3)'
          }}
        >
          {isProcessing ? '⏳ Processing...' : `🚀 Tip ${filteredCreators.length} Creator${filteredCreators.length > 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Info */}
      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(0,191,255,0.1)', borderRadius: '8px', fontSize: '0.9rem', color: '#888', textAlign: 'center' }}>
        💡 Click creators to mark as favorites • Use OpenClaw AI for smart suggestions • All tips are split fairly based on your preferences
      </div>
    </div>
  );
}
