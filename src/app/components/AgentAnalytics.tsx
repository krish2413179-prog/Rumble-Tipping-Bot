'use client';

import React, { useState, useEffect } from 'react';

interface AnalyticsData {
  totalTipped: number;
  tipsByType: {
    watchTime: number;
    engagement: number;
    events: number;
    manual: number;
  };
  topCreators: Array<{ address: string; amount: number }>;
  recentTips: Array<{
    timestamp: number;
    amount: number;
    type: string;
    recipient: string;
  }>;
}

export default function AgentAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTipped: 0,
    tipsByType: {
      watchTime: 0,
      engagement: 0,
      events: 0,
      manual: 0
    },
    topCreators: [],
    recentTips: []
  });

  useEffect(() => {
    // TODO: Fetch analytics from API
    // Mock data for now
    setAnalytics({
      totalTipped: 125.50,
      tipsByType: {
        watchTime: 45.00,
        engagement: 50.00,
        events: 20.50,
        manual: 10.00
      },
      topCreators: [
        { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', amount: 75.00 },
        { address: '0x1234567890123456789012345678901234567890', amount: 50.50 }
      ],
      recentTips: [
        { timestamp: Date.now() - 300000, amount: 5, type: 'Watch Time', recipient: '0x742d...' },
        { timestamp: Date.now() - 600000, amount: 10, type: 'Engagement', recipient: '0x742d...' }
      ]
    });
  }, []);

  return (
    <div className="analytics-dashboard">
      <h2>Agent Analytics</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Total Tipped</h3>
          <p className="analytics-value">{analytics.totalTipped.toFixed(2)} USDT</p>
        </div>

        <div className="analytics-card">
          <h3>Tips by Category</h3>
          <div className="tip-breakdown">
            <div className="tip-category">
              <span>Watch Time</span>
              <span>{analytics.tipsByType.watchTime.toFixed(2)} USDT</span>
            </div>
            <div className="tip-category">
              <span>Engagement</span>
              <span>{analytics.tipsByType.engagement.toFixed(2)} USDT</span>
            </div>
            <div className="tip-category">
              <span>Events</span>
              <span>{analytics.tipsByType.events.toFixed(2)} USDT</span>
            </div>
            <div className="tip-category">
              <span>Manual</span>
              <span>{analytics.tipsByType.manual.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Top Creators</h3>
          {analytics.topCreators.map((creator, i) => (
            <div key={i} className="creator-row">
              <span>{creator.address.substring(0, 10)}...</span>
              <span>{creator.amount.toFixed(2)} USDT</span>
            </div>
          ))}
        </div>

        <div className="analytics-card">
          <h3>Recent Tips</h3>
          {analytics.recentTips.map((tip, i) => (
            <div key={i} className="tip-row">
              <span>{tip.type}</span>
              <span>{tip.amount} USDT</span>
              <span>{new Date(tip.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
