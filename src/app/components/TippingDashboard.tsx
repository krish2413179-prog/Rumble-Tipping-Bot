'use client';

import React, { useState, useEffect, useRef } from 'react';
import { BrowserProvider, ContractFactory } from 'ethers';

export default function TippingDashboard({ children, videoUrl }: { children: React.ReactNode, videoUrl?: string }) {
  const [activeTab, setActiveTab] = useState('agent');
  const [stats, setStats] = useState<{ watching: string | null, isLive?: boolean } | null>(null);
  const [liveComments, setLiveComments] = useState<Array<{ author: string; text: string; timestamp: string; type: string }>>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [watchTimeTip, setWatchTimeTip] = useState(1.5);
  const [watchInterval, setWatchInterval] = useState(5);
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [engagementEnabled, setEngagementEnabled] = useState(true);
  const [promptText, setPromptText] = useState('');
  
  // Recurring payment state
  const [recurringSchedules, setRecurringSchedules] = useState<Array<{ scheduleId: number; userAddress: string; interval: number }>>([]);
  const [autoTriggerEnabled, setAutoTriggerEnabled] = useState(true); // Re-enabled
  const [isExecutingPayment, setIsExecutingPayment] = useState(false);
  const executionLockRef = useRef(false);
  
  // Core state from API
  const [ethBalance, setEthBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [xautBalance, setXautBalance] = useState(0);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [backendWalletAddress, setBackendWalletAddress] = useState<string | null>(null);
  const [recipientAddress] = useState('0x000000000000000000000000000000000000dEaD');
  const [fundAmount, setFundAmount] = useState(0.001);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // ── EIP-2612 Recurring Payment State ─────────────────────────────────────
  const [recurringAmount, setRecurringAmount] = useState(1);        // USDT per tip
  const [recurringInterval, setRecurringInterval] = useState(5);    // minutes
  const [recurringBudget, setRecurringBudget] = useState(20);       // max USDT (permit value)
  const [recurringDeadlineHours, setRecurringDeadlineHours] = useState(24); // permit lifetime
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [isPermitSigning, setIsPermitSigning] = useState(false);
  const [recurringTimerId, setRecurringTimerId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [recurringSpent, setRecurringSpent] = useState(0);
  const [permitParams, setPermitParams] = useState<{
    owner: string; value: number; deadline: number; v: number; r: string; s: string;
  } | null>(null);

  // Initial load - don't auto-connect, wait for user action
  useEffect(() => {
    // Check if wallet was previously connected
    const savedAddress = localStorage.getItem('connectedWallet');
    if (savedAddress) {
      setWalletAddress(savedAddress);
      // Fetch balance for saved wallet
      fetchWalletBalance();
    }
    
    // Auto-fetch backend wallet address on load for funding
    fetchBackendAddress();
  }, []);

  // Auto-trigger recurring payments (backend execution - no wallet popups)
  useEffect(() => {
    if (!autoTriggerEnabled || recurringSchedules.length === 0 || !walletAddress) return;

    const checkAndTrigger = async () => {
      // Prevent multiple simultaneous executions
      if (executionLockRef.current) {
        console.log('[Auto-Trigger] Already executing, skipping...');
        return;
      }
      
      executionLockRef.current = true;
      
      try {
        for (const schedule of recurringSchedules) {
          try {
            console.log(`[Auto-Trigger] Checking schedule ${schedule.scheduleId}...`);
            
            // Call backend to execute (backend pays gas)
            const res = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'execute_recurring_payment',
                payload: {
                  scheduleId: schedule.scheduleId,
                  userAddress: schedule.userAddress
                }
              })
            });

            const data = await res.json();
            
            if (data.success && data.txHash) {
              console.log(`[Auto-Trigger] Payment executed for schedule ${schedule.scheduleId}!`);
              
              setActivities(prev => [{
                id: Date.now(),
                type: 'tx',
                message: `✅ Auto-executed recurring payment`,
                detail: `Schedule ${schedule.scheduleId} | TxID: ${data.txHash.substring(0, 14)}...`,
                time: 'Just now',
                icon: 'send',
                colorClass: 'lime'
              }, ...prev]);

              // Refresh balance after transaction confirms
              setTimeout(() => fetchWalletBalance(), 8000);
            } else if (data.error && !data.error.includes('Too soon')) {
              console.log(`[Auto-Trigger] Error:`, data.error);
            } else {
              console.log(`[Auto-Trigger] Schedule ${schedule.scheduleId} not due yet`);
            }
            
            // Wait between schedules
            await new Promise(resolve => setTimeout(resolve, 2000));
            
          } catch (e: any) {
            console.error(`[Auto-Trigger] Error for schedule ${schedule.scheduleId}:`, e.message);
          }
        }
      } finally {
        executionLockRef.current = false;
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkAndTrigger, 60000);
    
    // Initial check after 15 seconds
    const initialTimeout = setTimeout(checkAndTrigger, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, [recurringSchedules, autoTriggerEnabled, walletAddress]);

  const fetchBackendAddress = async () => {
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_balance' })
      });
      const data = await res.json();
      if (data.success) {
        if (data.address) setBackendWalletAddress(data.address);
        // Always update balance on load
        setEthBalance(data.balance?.ETH || 0);
        setUsdtBalance(data.balance?.USDT || 0);
        setXautBalance(data.balance?.XAUT || 0);
      }
    } catch (err) {
      console.error('Failed to fetch backend address:', err);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      // If user has a browser wallet connected, read balances on-chain
      if (typeof window !== 'undefined' && (window as any).ethereum && walletAddress && walletAddress.startsWith('0x') && walletAddress.length === 42) {
        const ethereum = (window as any).ethereum;
        const USDT_CONTRACT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
        const paddedAddress = walletAddress.slice(2).padStart(64, '0');

        const [usdtRaw, ethRaw] = await Promise.all([
          ethereum.request({ method: 'eth_call', params: [{ to: USDT_CONTRACT, data: '0x70a08231' + paddedAddress }, 'latest'] }).catch(() => '0x0'),
          ethereum.request({ method: 'eth_getBalance', params: [walletAddress, 'latest'] }).catch(() => '0x0'),
        ]);

        setUsdtBalance(parseInt(usdtRaw, 16) / 1e6);
        setEthBalance(parseInt(ethRaw, 16) / 1e18);
        return;
      }

      // Fallback: read backend agent wallet balance
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_balance' })
      });
      const data = await res.json();
      if (data.success) {
        setEthBalance(data.balance.ETH || 0);
        setUsdtBalance(data.balance.USDT || 0);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const handleDeployMockUSDT = async () => {
    if (!walletAddress) { alert('Connect browser wallet first.'); return; }
    if (!(window as any).ethereum) { alert('Browser wallet required.'); return; }
    
    setIsProcessing(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      setActivities(prev => [{
        id: Date.now(), type: 'tx', message: 'Deploying Mock USDT...',
        detail: 'Please confirm the contract deployment in your wallet',
        time: 'Just now', icon: 'settings', colorClass: 'cyan'
      }, ...prev]);

      const res = await fetch('/MockUSDT.json');
      const artifact = await res.json();
      
      const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);
      const contract = await factory.deploy();
      
      setActivities(prev => [{
        id: Date.now(), type: 'tx', message: 'Mock USDT Deploying',
        detail: `Tx: ${contract.deploymentTransaction()?.hash?.substring(0, 14)}... Waiting for confirmation`,
        time: 'Just now', icon: 'pending', colorClass: 'yellow'
      }, ...prev]);

      await contract.waitForDeployment();
      const deployedAddress = await contract.getAddress();
      
      // Update backend to track the new token
      await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_mock_usdt', payload: { address: deployedAddress } })
      });

      alert(`Mock USDT deployed to: ${deployedAddress}\nBackend updated!`);
      
      setActivities(prev => [{
        id: Date.now(), type: 'tx', message: '✅ Mock USDT Deployed!',
        detail: `Address: ${deployedAddress} | EIP-2612 enabled`,
        time: 'Just now', icon: 'check_circle', colorClass: 'lime'
      }, ...prev]);
      
    } catch (err: any) {
      console.error('Deploy error:', err);
      alert('Deployment failed: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConnectWdk = async () => {
    setIsConnecting(true);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        // No browser wallet — fall back to backend agent wallet
        await connectBackendWallet();
        return;
      }

      const ethereum = (window as any).ethereum;

      // 1. Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts returned');
      const connectedAddress = accounts[0];

      // 2. Force switch to Sepolia — add it if not present
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        try {
          await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchErr: any) {
          // Chain not added yet — add it
          if (switchErr.code === 4902 || switchErr.code === -32603) {
            await ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              }],
            });
          } else {
            throw switchErr;
          }
        }
      }

      // 3. Fetch USDT balance on-chain using eth_call
      const USDT_CONTRACT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
      // balanceOf(address) selector = 0x70a08231
      const paddedAddress = connectedAddress.slice(2).padStart(64, '0');
      const balanceOfData = '0x70a08231' + paddedAddress;

      let usdtRaw = '0x0';
      try {
        usdtRaw = await ethereum.request({
          method: 'eth_call',
          params: [{ to: USDT_CONTRACT, data: balanceOfData }, 'latest'],
        });
      } catch {}

      const usdtVal = parseInt(usdtRaw, 16) / 1e6; // USDT has 6 decimals

      // 4. Fetch ETH balance
      let ethRaw = '0x0';
      try {
        ethRaw = await ethereum.request({
          method: 'eth_getBalance',
          params: [connectedAddress, 'latest'],
        });
      } catch {}
      const ethVal = parseInt(ethRaw, 16) / 1e18;

      setWalletAddress(connectedAddress);
      setUsdtBalance(usdtVal);
      setEthBalance(ethVal);
      localStorage.setItem('connectedWallet', connectedAddress);

      setActivities(prev => [{
        id: Date.now(),
        type: 'agent',
        message: 'Wallet Connected (Sepolia)',
        detail: `${connectedAddress.substring(0, 10)}...${connectedAddress.slice(-4)} | ${usdtVal.toFixed(2)} USDT`,
        time: 'Just now',
        icon: 'account_balance_wallet',
        colorClass: 'cyan'
      }, ...prev]);

    } catch (err: any) {
      console.error('Connect error:', err);
      if (err.code === 4001) {
        alert('Connection rejected. Please approve in your wallet.');
      } else {
        // Fallback to backend wallet
        await connectBackendWallet();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const connectBackendWallet = async () => {
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_balance' })
      });
      const data = await res.json();
      if (data.success) {
        setEthBalance(data.balance.ETH || 0);
        setUsdtBalance(data.balance.USDT || 0);
        setWalletAddress(data.address);
        localStorage.setItem('connectedWallet', data.address);
        setActivities(prev => [{
          id: Date.now(),
          type: 'agent',
          message: 'Agent Wallet Connected',
          detail: `${data.address.substring(0, 10)}...${data.address.slice(-4)}`,
          time: 'Just now',
          icon: 'account_balance_wallet',
          colorClass: 'cyan'
        }, ...prev]);
      }
    } catch (e) {
      console.error('Backend wallet fallback failed:', e);
      alert('Could not connect any wallet. Check console for details.');
    }
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
    setEthBalance(0);
    setUsdtBalance(0);
    setXautBalance(0);
    localStorage.removeItem('connectedWallet');
    // Also cancel any active recurring plan on disconnect
    if (recurringTimerId) {
      clearInterval(recurringTimerId);
      setRecurringTimerId(null);
      setRecurringEnabled(false);
      setPermitParams(null);
    }
    setActivities(prev => [{
        id: Date.now(),
        type: 'agent',
        message: 'Wallet Disconnected',
        detail: 'Successfully disconnected from wallet',
        time: 'Just now',
        icon: 'logout',
        colorClass: 'cyan'
    }, ...prev]);
  };

  // ── EIP-2612: Sign permit + start recurring timer (Browser Wallet Flow) ────────
  const handleEnableRecurring = async () => {
    if (!walletAddress) { alert('Please connect your browser wallet first.'); return; }
    if (!(window as any).ethereum) { alert('Browser wallet (e.g., Tether WDK) required.'); return; }
    if (recurringAmount <= 0) { alert('Amount must be greater than 0.'); return; }
    if (recurringBudget < recurringAmount) { alert('Budget must be ≥ tip amount.'); return; }

    setIsPermitSigning(true);
    try {
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const USDT_CONTRACT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';

      // 1. Fetch the backend agent wallet (spender)
      const agentRes = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_address_only' }),
      });
      const agentData = await agentRes.json();
      if (!agentData.success) throw new Error('Could not get agent address');
      const spender: string = agentData.address;

      // 2. Simulated nonce and deadline
      //    (Sepolia USDT proxy lacks nonces() method, so we uniquely identify off-chain)
      const nonce = Math.floor(Date.now() / 1000);
      const deadline = nonce + recurringDeadlineHours * 3600;

      // 3. Permit value
      const permitValue = BigInt(Math.floor(recurringBudget * 1e6));

      // 4. EIP-712 Domain and Types
      const domain = {
        name: 'Tether USD',
        version: '1',
        chainId: 11155111,          // Sepolia 
        verifyingContract: USDT_CONTRACT,
      };

      const types = {
        Permit: [
          { name: 'owner',    type: 'address' },
          { name: 'spender',  type: 'address' },
          { name: 'value',    type: 'uint256' },
          { name: 'nonce',    type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
        ],
      };

      const message = {
        owner:    walletAddress,
        spender,
        value:    permitValue.toString(),
        nonce:    nonce.toString(),
        deadline: deadline.toString(),
      };

      // 5. Ask user to sign via ethers (prevents JsonRpcEngine payload formatting errors)
      const signature = await signer.signTypedData(domain, types, message);

      // 6. Split the signature into v, r, s
      const sig = signature.slice(2);
      const r = '0x' + sig.slice(0, 64);
      const s = '0x' + sig.slice(64, 128);
      const v = parseInt(sig.slice(128, 130), 16);

      // 7. Store permit params in state
      const stored = { owner: walletAddress, value: recurringBudget, deadline, v, r, s };
      setPermitParams(stored);
      setRecurringSpent(0);
      setRecurringEnabled(true);

      setActivities(prev => [{
        id: Date.now(),
        type: 'agent',
        message: '✅ Recurring Payment Enabled (EIP-2612)',
        detail: `${recurringAmount} USDT every ${recurringInterval} min · Budget: ${recurringBudget} USDT · Permit signed`,
        time: 'Just now',
        icon: 'autorenew',
        colorClass: 'lime',
      }, ...prev]);

      // 8. Start recurring interval
      const executeRecurringTip = async (params: typeof stored, spent: number) => {
        if (spent + recurringAmount > params.value) {
          // Budget exhausted — cancel
          setRecurringEnabled(false);
          setRecurringTimerId(null);
          setActivities(prev => [{
            id: Date.now(),
            type: 'agent',
            message: '⛔ Recurring budget exhausted',
            detail: `All ${params.value} USDT budget has been tipped`,
            time: 'Just now', icon: 'block', colorClass: 'cyan',
          }, ...prev]);
          return;
        }

        try {
          const res = await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'execute_permit_tip',
              payload: {
                owner: params.owner,
                recipient: recipientAddress,
                amount: recurringAmount,
                value: params.value,
                deadline: params.deadline,
                v: params.v,
                r: params.r,
                s: params.s,
              },
            }),
          });
          const data = await res.json();

          if (data.success) {
            const newSpent = spent + recurringAmount;
            setRecurringSpent(newSpent);
            setActivities(prev => [{
              id: Date.now(),
              type: 'tx',
              message: `🔄 Auto-tip: ${recurringAmount} USDT (permit)`,
              detail: `TxID: ${data.transferTxHash?.substring(0, 14)}... · Spent: ${newSpent.toFixed(2)}/${params.value} USDT`,
              time: 'Just now', icon: 'autorenew', colorClass: 'lime',
            }, ...prev]);
            setTimeout(() => fetchWalletBalance(), 5000);
          } else {
            console.error('[Recurring] Tip failed:', data.error);
            setActivities(prev => [{
              id: Date.now(),
              type: 'agent',
              message: '⚠️ Recurring tip failed',
              detail: data.error?.substring(0, 80) || 'Unknown error',
              time: 'Just now', icon: 'warning', colorClass: 'cyan',
            }, ...prev]);
          }
        } catch (e: any) {
          console.error('[Recurring] Network error:', e);
        }
      };

      // Run first tip immediately, then on interval
      let spentSoFar = 0;
      await executeRecurringTip(stored, spentSoFar);
      spentSoFar += recurringAmount;

      const timerId = setInterval(async () => {
        await executeRecurringTip(stored, spentSoFar);
        spentSoFar += recurringAmount;
      }, recurringInterval * 60 * 1000);

      setRecurringTimerId(timerId);

    } catch (err: any) {
      console.error('[Permit] Setup error:', err);
      alert(`Failed to enable recurring payments: ${err.message}`);
    } finally {
      setIsPermitSigning(false);
    }
  };

  const handleCancelRecurring = () => {
    if (recurringTimerId) {
      clearInterval(recurringTimerId);
      setRecurringTimerId(null);
    }
    setRecurringEnabled(false);
    setPermitParams(null);
    setActivities(prev => [{
      id: Date.now(),
      type: 'agent',
      message: '🛑 Recurring Payments Cancelled',
      detail: `Stopped after ${recurringSpent.toFixed(2)} USDT tipped`,
      time: 'Just now', icon: 'stop_circle', colorClass: 'cyan',
    }, ...prev]);
  };

  // One-time USDT approval for backend wallet to spend on user's behalf
  const ensureBackendApproval = async (amount: number, recurring = false) => {
    if (!walletAddress || !(window as any).ethereum) return false;
    try {
      const ethereum = (window as any).ethereum;
      const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_address_only' }),
      });
      const data = await res.json();
      if (!data.success) return false;
      const backendWallet = data.address;

      const paddedOwner = walletAddress.slice(2).padStart(64, '0');
      const paddedSpender = backendWallet.slice(2).padStart(64, '0');
      const allowanceRaw = await ethereum.request({
        method: 'eth_call',
        params: [{ to: USDT, data: '0xdd62ed3e' + paddedOwner + paddedSpender }, 'latest'],
      });
      const currentAllowance = parseInt(allowanceRaw, 16) / 1e6;

      if (currentAllowance >= amount) {
        console.log(`[Approval] Already approved: ${currentAllowance} USDT`);
        return true;
      }

      // Recurring: approve 10x so it can fire multiple times. Event-driven: exact amount.
      const approveUsdt = recurring ? amount * 10 : amount;
      const label = recurring
        ? `${amount} USDT per tip × 10 payments = ${approveUsdt} USDT total`
        : `${amount} USDT (one-time trigger)`;

      const confirmed = window.confirm(
        `To auto-tip when the trigger fires, approve the agent to spend:\n\n${label}\n\nClick OK to approve in your wallet.`
      );
      if (!confirmed) return false;

      const approveAmount = BigInt(Math.floor(approveUsdt * 1e6));
      const approveData = '0x095ea7b3'
        + backendWallet.slice(2).padStart(64, '0')
        + approveAmount.toString(16).padStart(64, '0');

      await ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: walletAddress, to: USDT, data: approveData, chainId: '0xaa36a7' }],
      });

      console.log(`[Approval] Approved ${approveUsdt} USDT for backend wallet`);
      return true;
    } catch (e: any) {
      if (e.code === 4001) alert('Approval rejected. Trigger will not execute automatically.');
      return false;
    }
  };

  const handleFundAgent = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    if (!backendWalletAddress) {
      alert('Agent wallet not initialized');
      return;
    }

    setIsProcessing(true);
    try {
      // Check for Ethereum provider
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        
        // Convert USDT to smallest unit (6 decimals)
        const usdtAmount = Math.floor(fundAmount * 1e6);
        const hexValue = '0x' + usdtAmount.toString(16);
        
        // For USDT, we need to call the token contract
        // For simplicity, we'll send ETH here and let backend handle USDT
        const weiAmount = BigInt(Math.floor(fundAmount * 1e18));
        const hexWei = '0x' + weiAmount.toString(16);
        
        // Send ETH transaction
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: backendWalletAddress,
            value: hexWei,
          }],
        });
        
        setActivities(prev => [{
          id: Date.now(),
          type: 'tx',
          message: `Funded Agent Wallet: ${fundAmount} ETH`,
          detail: `TxID: ${txHash.substring(0, 10)}... | Agent can now tip autonomously`,
          time: 'Just now',
          icon: 'account_balance_wallet',
          colorClass: 'lime'
        }, ...prev]);
        
        alert(`✅ Agent funded successfully!\n\nTransaction: ${txHash}\n\nThe agent can now tip automatically based on your triggers.`);
        
        // Refresh balance after a delay
        setTimeout(() => fetchWalletBalance(), 5000);
      } else {
        alert('⚠️ Ethereum wallet not detected\n\nPlease install MetaMask or Trust Wallet.');
      }
    } catch (err: any) {
      console.error('Fund error:', err);
      if (err.code === 4001 || err.message?.includes('reject')) {
        alert('Transaction rejected by user');
      } else {
        alert(`Failed to fund agent: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualTrigger = async () => {
    if (recurringSchedules.length === 0) {
      alert('No recurring schedules found');
      return;
    }

    setIsProcessing(true);
    try {
      for (const schedule of recurringSchedules) {
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute_recurring_payment',
            payload: {
              scheduleId: schedule.scheduleId,
              userAddress: schedule.userAddress
            }
          })
        });

        const data = await res.json();
        
        if (data.success && data.txHash) {
          setActivities(prev => [{
            id: Date.now(),
            type: 'tx',
            message: `✅ Manually executed payment`,
            detail: `TxID: ${data.txHash.substring(0, 14)}...`,
            time: 'Just now',
            icon: 'send',
            colorClass: 'lime'
          }, ...prev]);
          
          alert(`✅ Payment executed!\nTx: ${data.txHash}`);
          setTimeout(() => fetchWalletBalance(), 5000);
        } else {
          alert(`❌ ${data.error || 'Failed'}`);
        }
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFundBackendWallet = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        
        // Get backend wallet address
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_address_only' })
        });
        const data = await res.json();
        
        if (!data.success) {
          alert('Could not get backend wallet address');
          return;
        }
        
        const backendAddr = data.address;
        
        // Send 0.02 ETH for gas fees
        const weiAmount = BigInt(Math.floor(0.02 * 1e18));
        const hexWei = '0x' + weiAmount.toString(16);
        
        const txHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: walletAddress,
            to: backendAddr,
            value: hexWei,
            chainId: '0xaa36a7',
          }],
        });
        
        setActivities(prev => [{
          id: Date.now(),
          type: 'tx',
          message: `Funded Backend Wallet: 0.02 ETH`,
          detail: `TxID: ${txHash.substring(0, 14)}... | Backend can now execute recurring payments`,
          time: 'Just now',
          icon: 'local_gas_station',
          colorClass: 'lime'
        }, ...prev]);
        
        alert(`✅ Backend wallet funded!\n\nSent 0.02 ETH to ${backendAddr}\n\nRecurring payments will now execute automatically.`);
        
        setTimeout(() => fetchWalletBalance(), 5000);
      } else {
        alert('Browser wallet required');
      }
    } catch (err: any) {
      console.error('Fund backend error:', err);
      if (err.code === 4001) {
        alert('Transaction rejected by user');
      } else {
        alert(`Failed to fund backend: ${err.message}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMintTestBTC = async () => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      // Call backend to mint test BTC
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'mint_test_btc', 
          payload: { 
            address: walletAddress,
            amount: 0.001 
          }
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setActivities(prev => [{
          id: Date.now(),
          type: 'tx',
          message: 'Minted 0.001 BTC (Test)',
          detail: `TxID: ${data.txHash.substring(0, 10)}... | Use this to fund the agent`,
          time: 'Just now',
          icon: 'toll',
          colorClass: 'lime'
        }, ...prev]);
        
        alert(`✅ Test BTC minted!\n\n0.001 BTC sent to your wallet\n\nTransaction: ${data.txHash}\n\nNow you can fund the agent!`);
        
        // Refresh balance
        setTimeout(() => fetchWalletBalance(), 3000);
      } else {
        alert(`Failed to mint: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Mint error:', err);
      alert(`Failed to mint test BTC: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromptSubmit = async () => {
    if (!promptText.trim()) return;
    setIsProcessing(true);
    
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse_prompt', payload: { prompt: promptText } })
      });
      const data = await res.json();
      
      if (data.success) {
        const inst = data.instructions;
        console.log('[Dashboard] Parsed instruction:', inst);
        let triggerPayload: any = null;
        let activityDetail = inst.description || `Configured: ${inst.type}`;

        if (inst.type === 'watch-time') {
          // Recurring payment using RecurringPayment contract
          setPromptText('');
          setIsProcessing(true);

          try {
            if (typeof window !== 'undefined' && (window as any).ethereum && walletAddress) {
              const ethereum = (window as any).ethereum;
              const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5'; // Mock USDT
              const RECURRING_CONTRACT = '0x0492b80B68221b84E00cd2dbB6bA14a4E5b1a3Bf'; // NEW CONTRACT
              const amount = BigInt(Math.floor(inst.amount * 1e6));
              const interval = (inst.intervalMinutes || 5) * 60; // seconds
              const maxPayments = 0; // unlimited

              console.log('[Recurring] inst.amount:', inst.amount, '→ units:', amount.toString());

              // Clear any previous schedules so old amounts don't keep firing
              setRecurringSchedules([]);

              // Step 1: Approve RecurringPayment contract to spend USDT
              console.log('[Recurring] Step 1: Approving USDT...');
              const approveSelector = '0x095ea7b3';
              const approveAmount = amount * BigInt(10); // approve 10 payments
              const approveData = approveSelector +
                RECURRING_CONTRACT.slice(2).padStart(64, '0') +
                approveAmount.toString(16).padStart(64, '0');

              const approveTx = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: walletAddress,
                  to: USDT,
                  data: approveData,
                  chainId: '0xaa36a7',
                }],
              });

              console.log('[Recurring] Approval tx:', approveTx);

              setActivities(prev => [{
                id: Date.now(),
                type: 'agent',
                message: `Approved recurring payments: ${inst.amount} USDT every ${inst.intervalMinutes} min`,
                detail: 'Waiting for approval confirmation...',
                time: 'Just now',
                icon: 'verified',
                colorClass: 'cyan'
              }, ...prev]);

              // Wait for approval to confirm (increased delay to avoid nonce conflicts)
              console.log('[Recurring] Waiting 10 seconds for approval to confirm...');
              await new Promise(resolve => setTimeout(resolve, 10000));

              // Step 2: Create schedule
              console.log('[Recurring] Step 2: Creating schedule... amount units:', amount.toString(), 'hex:', amount.toString(16));
              const createScheduleSelector = '0x13bcdac6'; // createSchedule(address,address,uint256,uint256,uint256)
              const scheduleData = createScheduleSelector +
                USDT.slice(2).padStart(64, '0') +
                recipientAddress.slice(2).padStart(64, '0') +
                amount.toString(16).padStart(64, '0') +
                interval.toString(16).padStart(64, '0') +
                maxPayments.toString(16).padStart(64, '0');

              const scheduleTxHash = await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                  from: walletAddress,
                  to: RECURRING_CONTRACT,
                  data: scheduleData,
                  chainId: '0xaa36a7',
                }],
              });

              console.log('[Recurring] Schedule transaction sent:', scheduleTxHash);
              
              setActivities(prev => [{
                id: Date.now(),
                type: 'agent',
                message: `Creating recurring schedule...`,
                detail: `Waiting for confirmation | TxID: ${scheduleTxHash.substring(0, 14)}...`,
                time: 'Just now',
                icon: 'pending',
                colorClass: 'yellow'
              }, ...prev]);

              // Wait for transaction to be mined
              let confirmed = false;
              for (let i = 0; i < 15; i++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                try {
                  const receipt = await ethereum.request({
                    method: 'eth_getTransactionReceipt',
                    params: [scheduleTxHash]
                  });
                  if (receipt && receipt.status === '0x1') {
                    confirmed = true;
                    console.log('[Recurring] Transaction confirmed!', receipt);
                    break;
                  } else if (receipt && receipt.status === '0x0') {
                    throw new Error('Transaction failed on-chain');
                  }
                } catch (e) {
                  console.log('[Recurring] Waiting for confirmation...', i + 1);
                }
              }

              if (!confirmed) {
                throw new Error('Transaction confirmation timeout - check Etherscan');
              }

              // Read the actual scheduleId from the contract's nextScheduleId counter
              // nextScheduleId was incremented after createSchedule, so actual ID = nextScheduleId - 1
              let scheduleId = 0;
              try {
                // Call nextScheduleId() on the contract — selector: keccak256("nextScheduleId()")[0:4]
                const nextIdRaw = await ethereum.request({
                  method: 'eth_call',
                  params: [{ to: RECURRING_CONTRACT, data: '0x0f038d41' }, 'latest'],
                });
                const nextId = parseInt(nextIdRaw, 16);
                scheduleId = nextId > 0 ? nextId - 1 : 0;
                console.log('[Recurring] Contract nextScheduleId:', nextId, '→ scheduleId:', scheduleId);
              } catch (e) {
                console.warn('[Recurring] Could not read nextScheduleId, defaulting to 0');
              }
              
              setRecurringSchedules(prev => [...prev, {
                scheduleId,
                userAddress: walletAddress,
                interval: interval
              }]);

              setActivities(prev => [{
                id: Date.now(),
                type: 'agent',
                message: `✅ Recurring payment active: ${inst.amount} USDT every ${inst.intervalMinutes} min`,
                detail: `Schedule ${scheduleId} created | Auto-trigger enabled (checks every 60s)`,
                time: 'Just now',
                icon: 'schedule',
                colorClass: 'lime'
              }, ...prev]);

              setWatchTimeTip(inst.amount);
              if (inst.intervalMinutes) setWatchInterval(inst.intervalMinutes);
              setAgentEnabled(true);

            } else {
              alert('Browser wallet required for recurring payments.');
            }
          } catch (e: any) {
            console.error('[Recurring] Error:', e);
            if (e.code === 4001) {
              alert('Transaction rejected by user.');
            } else {
              alert(`Failed to set up recurring payment: ${e.message}`);
            }
          } finally {
            setIsProcessing(false);
          }
          return;
        } else if (inst.type === 'engagement') {
          const lower = inst.description?.toLowerCase() || '';
          const isViewerTrigger = lower.includes('viewer') || lower.includes('watching') || lower.includes('watch');
          triggerPayload = {
            type: isViewerTrigger ? 'watching_threshold' : 'likes_milestone',
            threshold: inst.threshold || 10000,
            amount: inst.amount,
            asset: inst.asset,
            triggered: false, lastValue: 0
          };
          // Event-driven: approve exact amount (one-shot trigger)
          await ensureBackendApproval(inst.amount, false);
          setEngagementEnabled(true);
          setAgentEnabled(true);

        } else if (inst.type === 'viewer-surge') {
          triggerPayload = {
            type: 'viewer_surge',
            surgePercentage: inst.surgePercentage || 50,
            amount: inst.amount,
            asset: inst.asset,
            triggered: false, lastValue: 0, baselineViewers: 0
          };
          // Event-driven: approve exact amount
          await ensureBackendApproval(inst.amount, false);
          setAgentEnabled(true);

        } else if (inst.type === 'community-pool') {
          // Community pool — tip split among contributors
          activityDetail = `Community pool "${inst.poolName || 'Pool'}" — ${inst.poolContributors || '?'} contributors × ${inst.amount} ${inst.asset}`;

        } else if (inst.type === 'smart-split') {
          // Smart split — show breakdown
          const splitDesc = (inst.splits || []).map((s: any) => `${s.label} ${s.percentage}%`).join(', ');
          activityDetail = `Smart split: ${inst.amount} ${inst.asset} → ${splitDesc}`;

        } else if (inst.type === 'event-trigger') {
          // Event-based trigger — keyword or milestone
          if (inst.eventType === 'comment_keyword' && inst.eventKeyword) {
            triggerPayload = {
              type: 'comments_milestone',
              threshold: 1,
              amount: inst.amount,
              asset: inst.asset,
              triggered: false, lastValue: 0
            };
            activityDetail = `Event trigger: tip ${inst.amount} ${inst.asset} when chat contains "${inst.eventKeyword}"`;
          } else {
            triggerPayload = {
              type: 'watching_threshold',
              threshold: inst.threshold || 1000,
              amount: inst.amount,
              asset: inst.asset,
              triggered: false, lastValue: 0
            };
          }
          setAgentEnabled(true);

        } else if (inst.type === 'manual') {
          // Execute immediately — debit wallet now
          setPromptText('');
          setIsProcessing(false);
          await executeTip(inst.amount, inst.asset as 'USDT' | 'ETH');
          return;

        } else if (inst.type === 'delayed-manual') {
          // Delayed tip: Get approval NOW, execute transfer LATER
          const delayMs = (inst.delayMinutes || 1) * 60 * 1000;
          activityDetail = `Approved: will tip ${inst.amount} ${inst.asset} after ${inst.delayMinutes} minute delay`;
          
          setPromptText('');
          setIsProcessing(true);

          try {
            if (typeof window !== 'undefined' && (window as any).ethereum && walletAddress) {
              const ethereum = (window as any).ethereum;
              const asset = inst.asset as 'USDT' | 'ETH';

              if (asset === 'USDT') {
                // Simplified: approve recipient directly, then user sends via transfer
                const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
                const amount = BigInt(Math.floor(inst.amount * 1e6));
                
                console.log('[Delayed Tip] Amount:', inst.amount, 'USDT =', amount.toString(), 'units');
                console.log('[Delayed Tip] Recipient:', recipientAddress);
                
                // Step 1: Just execute the transfer immediately with user approval
                // (Simpler than approve + transferFrom pattern)
                const transferSelector = '0xa9059cbb'; // transfer(address,uint256)
                const transferData = transferSelector +
                  recipientAddress.slice(2).padStart(64, '0') +
                  amount.toString(16).padStart(64, '0');

                console.log('[Delayed Tip] Transfer data:', transferData);

                // Request approval NOW, but don't send yet
                setActivities(prev => [{
                  id: Date.now(),
                  type: 'agent',
                  message: `Scheduled: ${inst.amount} ${inst.asset} tip in ${inst.delayMinutes} min`,
                  detail: 'Will request wallet approval after delay',
                  time: 'Just now',
                  icon: 'schedule',
                  colorClass: 'cyan'
                }, ...prev]);

                // After delay, request wallet signature and send
                setTimeout(async () => {
                  try {
                    const txHash = await ethereum.request({
                      method: 'eth_sendTransaction',
                      params: [{
                        from: walletAddress,
                        to: USDT,
                        data: transferData,
                        chainId: '0xaa36a7',
                      }],
                    });

                    setActivities(prev => [{
                      id: Date.now(),
                      type: 'tx',
                      message: `Delayed tip executed: ${inst.amount} ${inst.asset}`,
                      detail: `TxID: ${txHash.substring(0, 14)}...`,
                      time: 'Just now',
                      icon: 'send',
                      colorClass: 'lime'
                    }, ...prev]);

                    setTimeout(() => fetchWalletBalance(), 5000);
                  } catch (e: any) {
                    if (e.code === 4001) {
                      alert('Transaction rejected by user.');
                    } else {
                      alert(`Failed to execute delayed transfer: ${e.message}`);
                    }
                  }
                }, delayMs);

              } else {
                // ETH: just execute immediately (no approval needed)
                alert('Delayed ETH tips not yet supported. Use USDT or execute immediately.');
                setIsProcessing(false);
                return;
              }
            } else {
              alert('Browser wallet required for delayed tips.');
              setIsProcessing(false);
              return;
            }
          } catch (e: any) {
            if (e.code === 4001) {
              alert('Approval rejected by user.');
            } else {
              alert(`Failed to approve: ${e.message}`);
            }
          } finally {
            setIsProcessing(false);
          }
          return;
        }

        // Register trigger with backend if applicable
        if (triggerPayload) {
          await fetch('/api/agent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'add_trigger', payload: { trigger: triggerPayload } })
          });
        }

        setActivities(prev => [{
          id: Date.now(),
          type: 'agent',
          message: `Agent configured: "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`,
          detail: activityDetail,
          time: 'Just now',
          icon: 'smart_toy',
          colorClass: 'cyan'
        }, ...prev]);
        setPromptText('');
      } else {
        alert(`Parse error: ${data.error}`);
      }
    } catch (err) {
      console.error('Prompt submit error:', err);
      alert(`Error: ${err}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const executeTip = async (amount: number, asset: 'ETH'|'USDT'|'XAUT') => {
    // Prefer browser wallet for direct on-chain transfer
    const hasBrowserWallet = typeof window !== 'undefined' && !!(window as any).ethereum && walletAddress;

    setIsProcessing(true);
    try {
      let txHash: string | null = null;

      if (hasBrowserWallet) {
        // ── Direct from user's browser wallet ──────────────────────────────
        const ethereum = (window as any).ethereum;

        if (asset === 'ETH') {
          // Native ETH transfer
          const weiHex = '0x' + BigInt(Math.floor(amount * 1e18)).toString(16);
          txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: walletAddress,
              to: recipientAddress,
              value: weiHex,
              chainId: '0xaa36a7', // Sepolia
            }],
          });

        } else if (asset === 'USDT') {
          // ERC-20 transfer(address,uint256) on Tether Sepolia
          const USDT_CONTRACT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
          // transfer selector: 0xa9059cbb
          const paddedRecipient = recipientAddress.slice(2).padStart(64, '0');
          const amountUnits = BigInt(Math.floor(amount * 1e6)); // USDT = 6 decimals
          const paddedAmount = amountUnits.toString(16).padStart(64, '0');
          const data = '0xa9059cbb' + paddedRecipient + paddedAmount;

          txHash = await ethereum.request({
            method: 'eth_sendTransaction',
            params: [{
              from: walletAddress,
              to: USDT_CONTRACT,
              data,
              chainId: '0xaa36a7',
            }],
          });

        } else {
          // XAUT or unknown — fall back to backend
          throw new Error('XAUT direct transfer not yet supported, use backend wallet');
        }

        // Refresh on-chain balances after a few seconds
        setTimeout(() => fetchWalletBalance(), 5000);

      } else {
        // ── Fallback: backend executes transferFrom using user's approved USDT ──
        const res = await fetch('/api/agent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'execute_transfer_from',
            payload: { from: walletAddress, to: recipientAddress, amount, asset }
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Backend tip failed');
        txHash = data.txHash;
      }

      setActivities(prev => [{
        id: Date.now(),
        type: 'tx',
        message: `Sent ${amount} ${asset} to Creator`,
        detail: `To: ${recipientAddress.substring(0, 10)}... | TxID: ${txHash ? txHash.substring(0, 14) + '...' : 'pending'}`,
        time: 'Just now',
        icon: 'send',
        colorClass: 'lime'
      }, ...prev]);

    } catch (err: any) {
      console.error('Tip error:', err);
      if (err.code === 4001 || err.message?.includes('reject')) {
        alert('Transaction rejected by user.');
      } else {
        alert(`Transaction failed: ${err.message || err}`);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Real-time feed simulation
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'watch',
      message: 'Agent auto-tipped 1.00 USDT to @RumbleCreator',
      detail: 'Criteria: 5min watch-time milestone reached',
      time: 'Just now',
      icon: 'auto_awesome',
      colorClass: 'lime'
    },
    {
      id: 2,
      type: 'engagement',
      message: 'Agent auto-tipped 0.50 USDT for positive engagement',
      detail: 'Keyword detected: "amazing breakdown"',
      time: '2 mins ago',
      icon: 'chat_bubble',
      colorClass: 'cyan'
    }
  ]);

  // Fetch Rumble stats and check for auto-tip triggers
  useEffect(() => {
    if (!videoUrl) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/rumble/stats?url=${encodeURIComponent(videoUrl)}`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          
          // Check if agent should trigger a tip based on stats
          if (agentEnabled || engagementEnabled) {
            const analysisRes = await fetch('/api/agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'analyze_engagement', payload: { stats: data } })
            });
            
            const analysisData = await analysisRes.json();
            if (analysisData.success && analysisData.analysis.shouldTip) {
              console.log('[Agent] Trigger detected:', analysisData.analysis.reason);

              if (!walletAddress) {
                console.warn('[Agent] No wallet connected, skipping auto-tip');
                return;
              }
              
              // Execute via backend transferFrom — backend pays gas, user's USDT is spent
              const tipRes = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'execute_transfer_from',
                  payload: {
                    from: walletAddress,
                    to: recipientAddress,
                    amount: analysisData.analysis.amount,
                    asset: analysisData.analysis.asset,
                  }
                })
              });
              const tipData = await tipRes.json();
              console.log('[Agent] transferFrom result:', tipData);

              setActivities(prev => [{
                id: Date.now(),
                type: 'agent',
                message: tipData.success
                  ? `🤖 Agent auto-tipped ${analysisData.analysis.amount} ${analysisData.analysis.asset}`
                  : `⚠️ Auto-tip failed: ${analysisData.analysis.amount} ${analysisData.analysis.asset}`,
                detail: analysisData.analysis.reason + (tipData.success
                  ? ` | Tx: ${tipData.txHash?.substring(0, 14)}...`
                  : ` | ${tipData.error?.includes('allowance') ? 'No approval — re-run your trigger command to approve' : tipData.error?.substring(0, 60)}`),
                time: 'Just now',
                icon: tipData.success ? 'auto_awesome' : 'warning',
                colorClass: tipData.success ? 'lime' : 'cyan'
              }, ...prev]);

              if (tipData.success) setTimeout(() => fetchWalletBalance(), 6000);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [videoUrl, agentEnabled, engagementEnabled, walletAddress]);

  // Fetch live comments
  useEffect(() => {
    if (!videoUrl) return;

    const fetchComments = async () => {
      setCommentsLoading(true);
      try {
        const res = await fetch(`/api/rumble/comments?url=${encodeURIComponent(videoUrl)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.comments && data.comments.length > 0) {
            setLiveComments(data.comments.slice(0, 15)); // keep last 15
          }
        }
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
    const interval = setInterval(fetchComments, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [videoUrl]);

  return (
    <div className="layout-container">
      {/* Top Navigation */}
      <header className="header">
        <div className="header-left">
          <div className="brand">
            <div className="brand-icon">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <h2>OpenClaw Agent</h2>
          </div>
          <nav className="nav-links">
            <a href="/" style={{ color: 'var(--primary)' }}>Dashboard</a>
            <a href="/creators">Creator Donations</a>
            <a href="/history">History</a>
            <a href="/whitepaper" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.7rem', backgroundColor: 'rgba(133,199,66,0.1)', border: '1px solid rgba(133,199,66,0.35)', borderRadius: '6px', color: '#85c742', fontSize: '0.75rem', fontWeight: 'bold', textDecoration: 'none' }}>
              📄 Whitepaper
            </a>
          </nav>
        </div>
        <div className="header-right">
          {walletAddress ? (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button 
                className="btn-primary" 
                style={{ cursor: 'default' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  check_circle
                </span>
                <span>
                  {walletAddress.substring(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </button>
              <button 
                className="btn-primary" 
                onClick={handleDisconnectWallet}
                style={{ 
                  backgroundColor: 'transparent', 
                  border: '1px solid var(--border-color)',
                  padding: '0.5rem'
                }}
                title="Disconnect Wallet"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  logout
                </span>
              </button>
            </div>
          ) : (
            <button 
              className="btn-primary" 
              onClick={handleConnectWdk}
              disabled={isConnecting}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {isConnecting ? 'hourglass_empty' : 'account_balance_wallet'}
              </span>
              <span>
                {isConnecting ? 'Connecting...' : 'Connect WDK'}
              </span>
            </button>
          )}
        </div>
      </header>

      <main className="main-content">
        {/* Left Column: Video & Activity */}
        <div className="left-column">
          
          {/* Rumble Video Embed Overlay */}
          <div className="video-player-container">
            <div className="live-badge">
              <span className="live-dot"></span> LIVE
              {stats?.watching && (                <span style={{ marginLeft: '8px', opacity: 0.9 }}>
                   • {stats.watching} watching
                </span>
              )}
            </div>
            {children}
          </div>

          {/* Stats bar — watching count only */}
          <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem',
              borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626', display: 'inline-block', boxShadow: '0 0 6px #dc2626' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live</span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--white)', marginLeft: '4px' }}>
                {stats?.watching ?? '--'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>watching</span>
            </div>

          {/* Notifications Hub */}
          <div className="activity-hub">
            <div className="activity-header">
              <div className="activity-title">
                <span className="material-symbols-outlined text-accent-cyan">hub</span>
                <span>Activity & Notifications</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Real-time Feed</span>
              </div>
            </div>
            <div className="activity-feed">
              {activities.map(act => (
                <div key={act.id} className="feed-item">
                  <div className={`feed-icon ${act.colorClass}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{act.icon}</span>
                  </div>
                  <div className="feed-content">
                    <p>{act.message}</p>
                    <small>{act.detail}</small>
                  </div>
                  <div className="feed-time">{act.time}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Chat */}
          {videoUrl && (
            <div style={{
              marginTop: '1rem',
              backgroundColor: '#0d0d0d',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {/* Chat header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.65rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                backgroundColor: '#111',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>Live Chat</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {commentsLoading && (
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }}>refresh</span>
                  )}
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>30s</span>
                </div>
              </div>

              {/* Messages */}
              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                padding: '0.5rem 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}>
                {liveComments.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {commentsLoading ? 'Loading chat...' : 'No messages yet'}
                  </div>
                ) : (
                  liveComments.map((comment, idx) => {
                    // Generate a consistent color per author
                    const colors = ['#85c742', '#00d4ff', '#ff6b6b', '#ffd700', '#c084fc', '#fb923c', '#34d399'];
                    const colorIdx = comment.author.charCodeAt(0) % colors.length;
                    const avatarColor = colors[colorIdx];
                    const initial = comment.author.charAt(0).toUpperCase();

                    return (
                      <div key={idx} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                        padding: '0.4rem 0.75rem',
                        transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* Avatar circle */}
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          backgroundColor: avatarColor,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          fontSize: '13px', fontWeight: 'bold', color: '#000',
                        }}>
                          {initial}
                        </div>

                        {/* Message body */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: avatarColor, fontWeight: 'bold', fontSize: '13px', marginRight: '6px' }}>
                            {comment.author}
                          </span>
                          {comment.type === 'rant' && (
                            <span style={{ fontSize: '10px', color: '#dc2626', marginRight: '6px' }}>💰 RANT</span>
                          )}
                          <span style={{ color: '#e5e5e5', fontSize: '13px', wordBreak: 'break-word' }}>
                            {comment.text}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input bar removed — read-only chat */}
            </div>
          )}
        </div>

        {/* Right Sidebar: Agent Configuration */}
        <aside className="right-sidebar">
          
          {/* Universal Wallet Card */}
          <div className="tether-card">
            {/* Header row */}
            <div className="tether-header">
              <div>
                <p className="tether-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--primary)' }}>account_balance_wallet</span>
                  Universal Tip Wallet
                </p>
                <h2 className="tether-total">{usdtBalance.toFixed(2)} USDT</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="tether-icon">
                  <span className="material-symbols-outlined">toll</span>
                </div>
                <p style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Sepolia</p>
              </div>
            </div>

            {/* Address row */}
            <div style={{ margin: '0.5rem 0', padding: '0.5rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {walletAddress ? `${walletAddress.substring(0, 14)}...${walletAddress.slice(-6)}` : 'No wallet connected'}
              </span>
              {walletAddress && (
                <button
                  onClick={() => { navigator.clipboard.writeText(walletAddress); }}
                  title="Copy address"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, flexShrink: 0 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span>
                </button>
              )}
            </div>

            {/* Balances */}
            <div className="balances-grid">
              <div className="balance-box">
                <p className="lbl">USDT</p>
                <p className="val-usdt">{usdtBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="balance-box">
                <p className="lbl">ETH (gas)</p>
                <p className="val-xaut">{ethBalance.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              {/* Mint USDT — calls faucet(10000 * 1e6) on Mock USDT */}
              <button
                onClick={async () => {
                  if (!walletAddress) { alert('Connect your wallet first.'); return; }
                  if (!(window as any).ethereum) { alert('No browser wallet detected.'); return; }
                  setIsProcessing(true);
                  try {
                    const ethereum = (window as any).ethereum;
                    const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
                    // faucet(uint256) selector = 0x57915897
                    const amount = BigInt(10000 * 1e6); // 10,000 USDT (6 decimals)
                    const paddedAmount = amount.toString(16).padStart(64, '0');
                    const data = '0x57915897' + paddedAmount;
                    const txHash = await ethereum.request({
                      method: 'eth_sendTransaction',
                      params: [{ from: walletAddress, to: USDT, data, chainId: '0xaa36a7' }],
                    });
                    setActivities(prev => [{
                      id: Date.now(), type: 'tx',
                      message: 'Minted 10,000 USDT (testnet)',
                      detail: `TxID: ${txHash.substring(0, 14)}...`,
                      time: 'Just now', icon: 'toll', colorClass: 'lime'
                    }, ...prev]);
                    setTimeout(() => fetchWalletBalance(), 6000);
                  } catch (e: any) {
                    if (e.code !== 4001) alert(`Mint failed: ${e.message}`);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing || !walletAddress}
                style={{
                  flex: 1, padding: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold',
                  backgroundColor: 'rgba(133,199,66,0.15)', color: '#85c742',
                  border: '1px solid rgba(133,199,66,0.4)', borderRadius: '6px',
                  cursor: isProcessing || !walletAddress ? 'not-allowed' : 'pointer',
                  opacity: isProcessing || !walletAddress ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add_circle</span>
                Mint 1K
              </button>

              {/* Refresh balance */}
              <button
                onClick={fetchWalletBalance}
                disabled={!walletAddress}
                title="Refresh balance"
                style={{
                  padding: '0.5rem 0.6rem', fontSize: '0.7rem',
                  backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)', borderRadius: '6px',
                  cursor: !walletAddress ? 'not-allowed' : 'pointer',
                  opacity: !walletAddress ? 0.4 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>refresh</span>
              </button>
            </div>

            {/* Fund Backend Wallet Button */}
            <button
              onClick={handleFundBackendWallet}
              disabled={isProcessing || !walletAddress}
              title="Send 0.02 ETH to backend wallet for gas fees"
              style={{
                width: '100%', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 'bold',
                backgroundColor: 'rgba(255,152,0,0.15)', color: '#FF9800',
                border: '1px solid rgba(255,152,0,0.4)', borderRadius: '6px',
                cursor: isProcessing || !walletAddress ? 'not-allowed' : 'pointer',
                opacity: isProcessing || !walletAddress ? 0.5 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                marginTop: '0.5rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>local_gas_station</span>
              Fund Backend Wallet (0.02 ETH for gas)
            </button>

            {/* Revoke Approval */}
            <button
              onClick={async () => {
                if (!walletAddress || !(window as any).ethereum) { alert('Connect wallet first.'); return; }
                try {
                  const agentRes = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'get_address_only' }) });
                  const agentData = await agentRes.json();
                  if (!agentData.success) { alert('Could not get agent address'); return; }
                  const USDT = '0x959Aa5cE0f6A29b00e1C178Fd1e98F2199D444c5';
                  // approve(spender, 0) — revoke all allowance
                  const data = '0x095ea7b3' + agentData.address.slice(2).padStart(64, '0') + '0'.padStart(64, '0');
                  await (window as any).ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [{ from: walletAddress, to: USDT, data, chainId: '0xaa36a7' }],
                  });
                  setActivities(prev => [{ id: Date.now(), type: 'agent', message: '🔒 Approval revoked', detail: 'Agent can no longer spend your USDT automatically', time: 'Just now', icon: 'lock', colorClass: 'cyan' }, ...prev]);
                } catch (e: any) {
                  if (e.code !== 4001) alert('Revoke failed: ' + e.message);
                }
              }}
              disabled={!walletAddress}
              title="Revoke agent's USDT spending approval"
              style={{
                width: '100%', padding: '0.6rem', fontSize: '0.75rem', fontWeight: 'bold',
                backgroundColor: 'rgba(220,38,38,0.1)', color: '#dc2626',
                border: '1px solid rgba(220,38,38,0.3)', borderRadius: '6px',
                cursor: !walletAddress ? 'not-allowed' : 'pointer',
                opacity: !walletAddress ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                marginTop: '0.5rem'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
              Revoke Agent Approval
            </button>

            {/* Recurring Payment Controls */}
            {recurringSchedules.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleManualTrigger}
                  disabled={isProcessing}
                  title="Execute payment now"
                  style={{
                    flex: 1, padding: '0.6rem', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: 'rgba(133,199,66,0.15)', color: '#85c742',
                    border: '1px solid rgba(133,199,66,0.4)', borderRadius: '6px',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>play_arrow</span>
                  Execute Now
                </button>
                
                <button
                  onClick={() => {
                    setAutoTriggerEnabled(!autoTriggerEnabled);
                    setActivities(prev => [{
                      id: Date.now(),
                      type: 'agent',
                      message: autoTriggerEnabled ? '⏸️ Auto-execution stopped' : '▶️ Auto-execution started',
                      detail: autoTriggerEnabled ? 'No more automatic payments' : 'Payments will execute every 60s',
                      time: 'Just now',
                      icon: autoTriggerEnabled ? 'pause' : 'play_arrow',
                      colorClass: 'cyan'
                    }, ...prev]);
                  }}
                  title={autoTriggerEnabled ? 'Stop auto-execution' : 'Start auto-execution'}
                  style={{
                    flex: 1, padding: '0.6rem', fontSize: '0.75rem', fontWeight: 'bold',
                    backgroundColor: autoTriggerEnabled ? 'rgba(220,38,38,0.15)' : 'rgba(133,199,66,0.15)',
                    color: autoTriggerEnabled ? '#dc2626' : '#85c742',
                    border: autoTriggerEnabled ? '1px solid rgba(220,38,38,0.4)' : '1px solid rgba(133,199,66,0.4)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                    {autoTriggerEnabled ? 'stop' : 'play_arrow'}
                  </span>
                  {autoTriggerEnabled ? 'Stop' : 'Start'}
                </button>
              </div>
            )}

            {/* Sepolia ETH faucet link */}
            {walletAddress && ethBalance < 0.001 && (
              <p style={{ fontSize: '0.6rem', color: '#FF9800', marginTop: '0.5rem', marginBottom: 0 }}>
                ⚠️ Low ETH for gas —{' '}
                <a href="https://sepoliafaucet.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#FF9800' }}>
                  get Sepolia ETH
                </a>
              </p>
            )}
          </div>
          
          {/* Agent Config Panel */}
          <div className="glass-panel">
            <div className="settings-header" style={{ marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>Agent Configuration</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI-Powered Rumble Assistant</p>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={agentEnabled} 
                  onChange={(e) => setAgentEnabled(e.target.checked)} 
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-section">
              <div className="settings-title">
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '18px' }}>chat_spark</span>
                Natural Language Command
              </div>
              <textarea 
                className="input-prompt" 
                placeholder="e.g., Tip 2 USDT every 5 minutes... or Split 20 USDT 60% creator 40% editor... or Tip 5 USDT when chat says 'amazing'... or Create a community pool of 10 USDT..."
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
              />
              <button 
                onClick={handlePromptSubmit}
                disabled={isProcessing}
                style={{
                  marginTop: '0.75rem',
                  width: '100%',
                  padding: '0.5rem',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}
              >
                {isProcessing ? 'PROCESSING...' : 'APPLY COMMAND'}
              </button>
            </div>

            {/* Manual Tip */}
            <div className="settings-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Manual Tip</h4>
              <div className="manual-tip-grid">
                <button className="btn-outline" onClick={() => executeTip(1, 'USDT')} disabled={isProcessing}>1 USDT</button>
                <button className="btn-outline" onClick={() => executeTip(5, 'USDT')} disabled={isProcessing}>5 USDT</button>
                <button className="btn-outline" onClick={() => executeTip(10, 'USDT')} disabled={isProcessing}>10 USDT</button>
              </div>
              <button className="btn-send" onClick={() => executeTip(5, 'USDT')} disabled={isProcessing}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>send</span>
                SEND 5 USDT NOW
              </button>
            </div>

          </div>
        </aside>
      </main>
    </div>
  );
}
