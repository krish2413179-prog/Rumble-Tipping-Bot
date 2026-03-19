'use client';

import React, { useState } from 'react';

interface Recipient {
  address: string;
  percentage: number;
}

export default function SplitManager() {
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', percentage: 100 }
  ]);

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', percentage: 0 }]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  const updateRecipient = (index: number, field: 'address' | 'percentage', value: string | number) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
  };

  const totalPercentage = recipients.reduce((sum, r) => sum + r.percentage, 0);

  const handleCreateSplit = async () => {
    if (totalPercentage !== 100) {
      alert('Percentages must sum to 100%');
      return;
    }
    // TODO: Integrate with smart contract
    console.log('Creating split:', recipients);
  };

  return (
    <div className="split-manager">
      <h2>Smart Split Configuration</h2>
      
      <div className="split-builder">
        {recipients.map((recipient, index) => (
          <div key={index} className="recipient-row">
            <input
              type="text"
              placeholder="Recipient Address (0x...)"
              value={recipient.address}
              onChange={e => updateRecipient(index, 'address', e.target.value)}
              style={{ flex: 2 }}
            />
            <input
              type="number"
              placeholder="%"
              value={recipient.percentage}
              onChange={e => updateRecipient(index, 'percentage', parseFloat(e.target.value) || 0)}
              style={{ flex: 1 }}
            />
            {recipients.length > 1 && (
              <button onClick={() => removeRecipient(index)} className="btn-danger">
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="split-actions">
        <button onClick={addRecipient} className="btn-outline">
          Add Recipient
        </button>
        <div className="split-total">
          Total: {totalPercentage}%
          {totalPercentage !== 100 && <span style={{ color: 'red' }}> (must be 100%)</span>}
        </div>
      </div>

      <div className="split-presets">
        <h3>Presets</h3>
        <button 
          onClick={() => setRecipients([
            { address: '', percentage: 80 },
            { address: '', percentage: 20 }
          ])}
          className="btn-outline"
        >
          Creator + Charity (80/20)
        </button>
        <button 
          onClick={() => setRecipients([
            { address: '', percentage: 50 },
            { address: '', percentage: 50 }
          ])}
          className="btn-outline"
        >
          Collaboration (50/50)
        </button>
        <button 
          onClick={() => setRecipients([
            { address: '', percentage: 33.33 },
            { address: '', percentage: 33.33 },
            { address: '', percentage: 33.34 }
          ])}
          className="btn-outline"
        >
          Team Split (3-way)
        </button>
      </div>

      <button 
        onClick={handleCreateSplit}
        className="btn-primary"
        disabled={totalPercentage !== 100}
      >
        Create Split Configuration
      </button>
    </div>
  );
}
