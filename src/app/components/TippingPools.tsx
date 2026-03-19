'use client';

import React, { useState, useEffect } from 'react';

interface Pool {
  id: number;
  name: string;
  beneficiary: string;
  goal: number;
  totalRaised: number;
  deadline: number;
  distributed: boolean;
  contributorCount: number;
}

export default function TippingPools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPool, setNewPool] = useState({
    name: '',
    beneficiary: '',
    goal: 100,
    durationDays: 30
  });

  const handleCreatePool = async () => {
    // TODO: Integrate with smart contract
    console.log('Creating pool:', newPool);
    setShowCreateModal(false);
  };

  const handleContribute = async (poolId: number, amount: number) => {
    // TODO: Integrate with smart contract
    console.log('Contributing to pool:', poolId, amount);
  };

  return (
    <div className="pools-container">
      <div className="pools-header">
        <h2>Community Tipping Pools</h2>
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          Create Pool
        </button>
      </div>

      <div className="pools-grid">
        {pools.map(pool => (
          <div key={pool.id} className="pool-card">
            <h3>{pool.name}</h3>
            <div className="pool-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(pool.totalRaised / pool.goal) * 100}%` }}
                />
              </div>
              <p>{pool.totalRaised} / {pool.goal} USDT</p>
            </div>
            <p className="pool-contributors">{pool.contributorCount} contributors</p>
            <button 
              onClick={() => handleContribute(pool.id, 10)}
              className="btn-outline"
            >
              Contribute 10 USDT
            </button>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create Tipping Pool</h3>
            <input
              type="text"
              placeholder="Pool Name"
              value={newPool.name}
              onChange={e => setNewPool({...newPool, name: e.target.value})}
            />
            <input
              type="text"
              placeholder="Beneficiary Address (0x...)"
              value={newPool.beneficiary}
              onChange={e => setNewPool({...newPool, beneficiary: e.target.value})}
            />
            <input
              type="number"
              placeholder="Goal (USDT)"
              value={newPool.goal}
              onChange={e => setNewPool({...newPool, goal: parseFloat(e.target.value)})}
            />
            <input
              type="number"
              placeholder="Duration (days)"
              value={newPool.durationDays}
              onChange={e => setNewPool({...newPool, durationDays: parseInt(e.target.value)})}
            />
            <div className="modal-actions">
              <button onClick={handleCreatePool} className="btn-primary">Create</button>
              <button onClick={() => setShowCreateModal(false)} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
