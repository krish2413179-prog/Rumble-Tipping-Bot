'use client';

import { useEffect, useState } from 'react';

const SEPOLIA_EXPLORER = 'https://sepolia.etherscan.io';
const BACKEND_WALLET = '0x1c1F68b0d4724274359C5B55589E65484D23a49a';

interface Tx {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  usdtAmount: number;
  timestamp: number;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

function formatTime(ts: number) {
  if (!ts) return 'Unknown time';
  return new Date(ts * 1000).toLocaleString();
}

export default function HistoryPage() {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('connectedWallet');
    if (saved) setWalletAddress(saved);

    const url = `/api/history${saved ? `?wallet=${saved}` : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTxs(data.txs);
        } else {
          setError(data.error || 'Failed to load');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#85c742', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Dashboard
          </a>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0 }}>Transaction History</h1>
        </div>
        <a
          href={`${SEPOLIA_EXPLORER}/address/${BACKEND_WALLET}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: '#00BFFF', textDecoration: 'none' }}
        >
          View on Etherscan ↗
        </a>
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Wallet chips */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 0.9rem', backgroundColor: 'rgba(133,199,66,0.1)', border: '1px solid rgba(133,199,66,0.3)', borderRadius: '8px', fontSize: '0.75rem' }}>
            <span style={{ color: '#666' }}>Backend: </span>
            <a href={`${SEPOLIA_EXPLORER}/address/${BACKEND_WALLET}`} target="_blank" rel="noopener noreferrer" style={{ color: '#85c742', fontFamily: 'monospace', textDecoration: 'none' }}>
              {shortAddr(BACKEND_WALLET)}
            </a>
          </div>
          {walletAddress && (
            <div style={{ padding: '0.5rem 0.9rem', backgroundColor: 'rgba(0,191,255,0.1)', border: '1px solid rgba(0,191,255,0.3)', borderRadius: '8px', fontSize: '0.75rem' }}>
              <span style={{ color: '#666' }}>Your wallet: </span>
              <a href={`${SEPOLIA_EXPLORER}/address/${walletAddress}`} target="_blank" rel="noopener noreferrer" style={{ color: '#00BFFF', fontFamily: 'monospace', textDecoration: 'none' }}>
                {shortAddr(walletAddress)}
              </a>
            </div>
          )}
          {!loading && (
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#555', alignSelf: 'center' }}>
              {txs.length} USDT transfers found
            </span>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            Scanning blockchain for transactions...
          </div>
        )}

        {error && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && txs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#555' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📭</div>
            No USDT transactions found in the last ~7 days
          </div>
        )}

        {!loading && txs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '1rem', padding: '0.4rem 1rem', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>Transaction</span>
              <span>From → To</span>
              <span>Amount</span>
              <span></span>
            </div>

            {txs.map(tx => {
              const isFromBackend = tx.from.toLowerCase() === BACKEND_WALLET.toLowerCase();
              const isFromUser = walletAddress && tx.from.toLowerCase() === walletAddress.toLowerCase();
              const direction = isFromBackend || isFromUser ? 'out' : 'in';

              return (
                <div
                  key={`${tx.hash}-${tx.from}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 2fr 1fr auto',
                    gap: '1rem',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                  }}
                >
                  {/* Hash + time */}
                  <div>
                    <a
                      href={`${SEPOLIA_EXPLORER}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#00BFFF', fontFamily: 'monospace', textDecoration: 'none', display: 'block', marginBottom: '3px' }}
                    >
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)} ↗
                    </a>
                    <span style={{ color: '#444' }}>{formatTime(tx.timestamp)}</span>
                  </div>

                  {/* From → To */}
                  <div style={{ lineHeight: 1.6 }}>
                    <div>
                      <span style={{ color: '#444' }}>From </span>
                      <a href={`${SEPOLIA_EXPLORER}/address/${tx.from}`} target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none', fontFamily: 'monospace' }}>
                        {shortAddr(tx.from)}
                      </a>
                    </div>
                    <div>
                      <span style={{ color: '#444' }}>To </span>
                      <a href={`${SEPOLIA_EXPLORER}/address/${tx.to}`} target="_blank" rel="noopener noreferrer" style={{ color: '#888', textDecoration: 'none', fontFamily: 'monospace' }}>
                        {shortAddr(tx.to)}
                      </a>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ fontWeight: 'bold', color: direction === 'out' ? '#f87171' : '#85c742' }}>
                    {direction === 'out' ? '−' : '+'}{tx.usdtAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                  </div>

                  {/* View button */}
                  <a
                    href={`${SEPOLIA_EXPLORER}/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.3rem 0.7rem',
                      backgroundColor: 'rgba(0,191,255,0.1)',
                      border: '1px solid rgba(0,191,255,0.25)',
                      borderRadius: '6px',
                      color: '#00BFFF',
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    View ↗
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
