import { Claw } from '@panda-ai/claw-sdk';
import OpenAI from 'openai';

interface RumbleStats {
  watching: string | null;
  views: string | null;
  comments: string | null;
  likes: string | null;
}

interface TipTrigger {
  type: 'watching_threshold' | 'likes_milestone' | 'comments_milestone' | 'views_milestone' | 'watch_time' | 'viewer_surge';
  threshold?: number;
  amount: number;
  asset: 'USDT' | 'XAUT' | 'ETH';
  triggered: boolean;
  lastValue: number;
  // Watch time specific
  intervalMinutes?: number;
  lastTipTime?: number;
  totalTipped?: number;
  maxTips?: number;
  // Viewer surge specific
  surgePercentage?: number;
  baselineViewers?: number;
}

// Extended parsed instruction from NLP
export interface ParsedInstruction {
  type: 'watch-time' | 'engagement' | 'manual' | 'viewer-surge' | 'community-pool' | 'smart-split' | 'event-trigger' | 'delayed-manual';
  amount: number;
  asset: 'USDT' | 'ETH';
  intervalMinutes?: number | null;
  threshold?: number | null;
  surgePercentage?: number | null;
  // Community pool
  poolName?: string | null;
  poolContributors?: number | null;
  // Smart split
  splits?: Array<{ label: string; percentage: number }> | null;
  // Event trigger
  eventKeyword?: string | null;
  eventType?: 'comment_keyword' | 'milestone' | 'reaction' | 'livestream_moment' | null;
  // Delayed manual
  delayMinutes?: number | null;
  description?: string;
}

export class OpenClawAgent {
  private claw: Claw | null = null;
  private openai: OpenAI;
  private triggers: TipTrigger[] = [];
  private lastStats: RumbleStats | null = null;

  constructor() {
    const gatewayToken = process.env.CLAW_GATEWAY_TOKEN;

    if (gatewayToken && gatewayToken.length > 0) {
      this.claw = new Claw({
        gatewayUrl: 'https://api.openclaw.ai',
        token: gatewayToken,
        runtime: 'nanoclaw',
        defaultModel: 'gpt-3.5-turbo',
      });
      console.log('[OpenClaw SDK] Initialized with @panda-ai/claw-sdk (NanoClaw gateway)');
    } else {
      console.log('[OpenClaw SDK] No gateway token found. Using NVIDIA NIM (Gemma-2-2B).');
    }

    // NVIDIA NIM endpoint — OpenAI-compatible, uses Gemma-2-2B-IT
    this.openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || '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',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  /**
   * Analyzes Rumble stats and determines if tips should be triggered
   */
  async analyzeEngagement(stats: RumbleStats): Promise<{
    shouldTip: boolean;
    reason: string;
    amount: number;
    asset: string;
  }> {
    this.lastStats = stats;

    // Parse numeric values from stats
    const parseValue = (val: string | null): number => {
      if (!val) return 0;
      const cleaned = val.replace(/,/g, '');
      if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1000;
      if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1000000;
      return parseFloat(cleaned) || 0;
    };

    const watching = parseValue(stats.watching);
    const likes = parseValue(stats.likes);
    const comments = parseValue(stats.comments);
    const views = parseValue(stats.views);
    const now = Date.now();

    console.log('[OpenClaw] Analyzing engagement:', { watching, likes, comments, views });

    // Check triggers
    for (const trigger of this.triggers) {
      // Watch time trigger (time-based)
      if (trigger.type === 'watch_time') {
        const intervalMs = (trigger.intervalMinutes || 5) * 60 * 1000;
        const timeSinceLastTip = now - (trigger.lastTipTime || 0);
        
        if (timeSinceLastTip >= intervalMs) {
          // Check if max tips reached
          if (trigger.maxTips && (trigger.totalTipped || 0) >= trigger.maxTips) {
            continue;
          }
          
          trigger.lastTipTime = now;
          trigger.totalTipped = (trigger.totalTipped || 0) + 1;
          
          return {
            shouldTip: true,
            reason: `Watch time milestone: ${trigger.intervalMinutes} minutes elapsed`,
            amount: trigger.amount,
            asset: trigger.asset
          };
        }
        continue;
      }

      // Viewer surge detection
      if (trigger.type === 'viewer_surge') {
        if (!trigger.baselineViewers) {
          trigger.baselineViewers = watching;
          continue;
        }
        
        const surgeThreshold = trigger.surgePercentage || 50;
        const increasePercent = ((watching - trigger.baselineViewers) / trigger.baselineViewers) * 100;
        
        if (increasePercent >= surgeThreshold && !trigger.triggered) {
          trigger.triggered = true;
          trigger.baselineViewers = watching; // Reset baseline
          
          return {
            shouldTip: true,
            reason: `Viewer surge detected: ${increasePercent.toFixed(0)}% increase (${trigger.baselineViewers} → ${watching})`,
            amount: trigger.amount,
            asset: trigger.asset
          };
        }
        
        // Reset if viewers drop
        if (watching < trigger.baselineViewers * 0.9) {
          trigger.triggered = false;
          trigger.baselineViewers = watching;
        }
        continue;
      }

      // Threshold-based triggers
      let currentValue = 0;
      
      switch (trigger.type) {
        case 'watching_threshold':
          currentValue = watching;
          break;
        case 'likes_milestone':
          currentValue = likes;
          break;
        case 'comments_milestone':
          currentValue = comments;
          break;
        case 'views_milestone':
          currentValue = views;
          break;
      }

      // Trigger if threshold crossed and not already triggered
      if (trigger.threshold && currentValue >= trigger.threshold && !trigger.triggered) {
        trigger.triggered = true;
        trigger.lastValue = currentValue;
        
        return {
          shouldTip: true,
          reason: `${trigger.type.replace('_', ' ')} reached: ${currentValue.toLocaleString()} >= ${trigger.threshold.toLocaleString()}`,
          amount: trigger.amount,
          asset: trigger.asset
        };
      }

      // Reset trigger if value drops below threshold — DISABLED for threshold triggers
      // (threshold triggers are one-shot: fire once, stay fired)
      // Only viewer_surge resets on drop
      if (trigger.type === 'viewer_surge' && trigger.threshold && currentValue < trigger.threshold && trigger.triggered) {
        trigger.triggered = false;
      }
    }

    return { shouldTip: false, reason: 'No triggers met', amount: 0, asset: 'USDT' };
  }

  /**
   * Adds a new trigger condition
   */
  addTrigger(trigger: TipTrigger) {
    this.triggers.push(trigger);
    console.log('[OpenClaw] Added trigger:', trigger);
  }

  /**
   * Removes all triggers
   */
  clearTriggers() {
    this.triggers = [];
    console.log('[OpenClaw] Cleared all triggers');
  }

  /**
   * Gets current triggers
   */
  getTriggers(): TipTrigger[] {
    return this.triggers;
  }

  /**
   * Evaluates natural language instructions to configure a tipping skill.
   * Uses NVIDIA NIM (Gemma-2-2B-IT) via OpenAI-compatible API.
   */
  async configureTippingSkillFromPrompt(prompt: string): Promise<ParsedInstruction> {
    console.log(`[OpenClaw] Parsing prompt via Gemma-2-2B: "${prompt}"`);

    const systemPrompt = `You are an AI orchestration agent for a crypto tipping bot on Rumble (a video platform).
Parse the user's natural language instruction into a JSON object. Return ONLY valid JSON, no explanation.

Output schema:
{
  "type": "watch-time" | "engagement" | "manual" | "viewer-surge" | "community-pool" | "smart-split" | "event-trigger" | "delayed-manual",
  "amount": number,
  "asset": "USDT" | "ETH",
  "intervalMinutes": number | null,
  "threshold": number | null,
  "surgePercentage": number | null,
  "poolName": string | null,
  "poolContributors": number | null,
  "splits": [{"label": string, "percentage": number}] | null,
  "eventKeyword": string | null,
  "eventType": "comment_keyword" | "milestone" | "reaction" | "livestream_moment" | null,
  "delayMinutes": number | null,
  "description": string
}

Type rules:
- "watch-time": mentions "every N minutes", "per minute", recurring time intervals
- "delayed-manual": mentions "after N minutes", "in N minutes", "wait N minutes" — ONE-TIME delayed tip
- "engagement": mentions likes/comments/views/viewers with a SPECIFIC NUMBER threshold — e.g. "on 880 views", "when 1000 watching", "at 500 viewers", "hits 850"
- "viewer-surge": mentions relative increase words like "surge", "spike", "jump", "double", "triple", "100% increase" — NOT a fixed number threshold
- "community-pool": mentions "pool", "community", "collective", "everyone chips in", "split among fans"
- "smart-split": mentions "split between", "share with", "collaborators", "causes", "divide", "percentage"
- "event-trigger": mentions specific moments like "when someone says X", "on milestone", "reaction", "livestream moment", "chat keyword"
- "manual": immediate one-time tip with no delay or condition

Asset rules:
- Default to "USDT" for all stablecoins (USDT, USDC, USD, stablecoin)
- Only use "ETH" if user explicitly says "ETH" or "ethereum"

Defaults: amount=1, asset="USDT", all others null.

Examples:
"Tip 2 USDT every 5 minutes" → {"type":"watch-time","amount":2,"asset":"USDT","intervalMinutes":5,"description":"Auto-tip 2 USDT every 5 minutes of watch time"}
"Tip 2 USDC after 2 minutes" → {"type":"delayed-manual","amount":2,"asset":"USDT","delayMinutes":2,"description":"Tip 2 USDT after 2 minute delay"}
"Tip 10 USDT when likes hit 50K" → {"type":"engagement","amount":10,"asset":"USDT","threshold":50000,"description":"Tip 10 USDT at 50K likes milestone"}
"Tip 100 USDT on 870 viewers" → {"type":"engagement","amount":100,"asset":"USDT","threshold":870,"description":"Tip 100 USDT when viewers reach 870"}
"Tip 50 USDT when 1000 watching" → {"type":"engagement","amount":50,"asset":"USDT","threshold":1000,"description":"Tip 50 USDT when viewers reach 1000"}
"Tip 15 USDT on 100% viewer spike" → {"type":"viewer-surge","amount":15,"asset":"USDT","surgePercentage":100,"description":"Tip 15 USDT when viewers double"}
"Create a community pool of 5 USDT with 10 contributors" → {"type":"community-pool","amount":5,"asset":"USDT","poolContributors":10,"poolName":"Community Pool","description":"Community pool: 10 contributors, 5 USDT each"}
"Split 20 USDT: 60% creator, 30% editor, 10% charity" → {"type":"smart-split","amount":20,"asset":"USDT","splits":[{"label":"creator","percentage":60},{"label":"editor","percentage":30},{"label":"charity","percentage":10}],"description":"Smart split: 20 USDT across creator/editor/charity"}
"Tip 3 USDT whenever someone says amazing in chat" → {"type":"event-trigger","amount":3,"asset":"USDT","eventKeyword":"amazing","eventType":"comment_keyword","description":"Tip 3 USDT on chat keyword: amazing"}
"Tip 5 USDT at every livestream milestone" → {"type":"event-trigger","amount":5,"asset":"USDT","eventType":"milestone","description":"Tip 5 USDT at livestream milestones"}`;

    try {
      // Try claw-sdk gateway first
      if (this.claw) {
        const agent = this.claw.agent({ name: 'tipping-orchestrator', systemPrompt });
        const rawResponse = await agent.run(prompt);
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          console.log('[OpenClaw SDK] Gateway Response:', result);
          agent.reset();
          return result;
        }
        throw new Error('No JSON in claw-sdk response');
      }

      // NVIDIA NIM — Gemma-2-2B-IT (streaming, collect full response)
      const stream = await this.openai.chat.completions.create({
        model: 'google/gemma-2-2b-it',
        messages: [
          { role: 'user', content: `${systemPrompt}\n\nUser instruction: ${prompt}\n\nJSON:` },
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 512,
        stream: true,
      });

      let fullText = '';
      for await (const chunk of stream) {
        fullText += chunk.choices[0]?.delta?.content || '';
      }

      console.log('[OpenClaw] Gemma raw output:', fullText);

      // Extract JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Force normalize USDC → USDT (Sepolia only has USDT)
        if (result.asset && result.asset.toUpperCase() === 'USDC') {
          result.asset = 'USDT';
        }
        console.log('[OpenClaw] Gemma parsed result:', result);
        return result;
      }

      throw new Error('No JSON found in Gemma response');
    } catch (e: any) {
      console.error('[OpenClaw] Parsing error:', e.message);
      // Graceful fallback — regex-based intent extraction
      const lower = prompt.toLowerCase();
      const amountMatch = prompt.match(/(\d+(?:\.\d+)?)\s*(?:usdt|usdc|eth|usd)?/i);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 1;
      // Normalize: USDC → USDT (Sepolia only has USDT)
      const asset = lower.includes('eth') ? 'ETH' : 'USDT';

      // Check for delayed manual (after/in N minutes) vs recurring (every N minutes)
      if (lower.includes('after') || lower.includes('in ')) {
        const minMatch = prompt.match(/(?:after|in)\s+(\d+)\s*min/i);
        const delayMinutes = minMatch ? parseInt(minMatch[1]) : 1;
        return { type: 'delayed-manual', amount, asset, delayMinutes, description: `Tip ${amount} ${asset} after ${delayMinutes} min delay` };
      }
      if (lower.includes('every') || lower.includes('per min') || (lower.includes('watch time') && lower.includes('minute'))) {
        const minMatch = prompt.match(/(\d+)\s*min/i);
        return { type: 'watch-time', amount, asset, intervalMinutes: minMatch ? parseInt(minMatch[1]) : 5, description: `Watch-time tip: ${amount} ${asset}` };
      }
      if (lower.includes('pool') || lower.includes('community')) {
        return { type: 'community-pool', amount, asset, poolName: 'Community Pool', description: `Community pool: ${amount} ${asset}` };
      }
      if (lower.includes('split') || lower.includes('collaborat')) {
        return { type: 'smart-split', amount, asset, splits: [{ label: 'creator', percentage: 70 }, { label: 'collaborator', percentage: 30 }], description: `Smart split: ${amount} ${asset}` };
      }
      // Specific viewer/view threshold (e.g. "on 870 viewers", "when 1000 watching") — must come BEFORE surge check
      if (lower.includes('likes') || lower.includes('views') || lower.includes('comments') || lower.includes('milestone') || lower.includes('watching') || lower.includes('viewers')) {
        const threshKMatch = prompt.match(/(\d+(?:\.\d+)?)\s*[kK]/);
        const threshRawMatch = prompt.match(/(?:on|at|when|hits?|reaches?)\s+(\d+)/i)
          || prompt.match(/(\d{3,})\s*(?:view|viewer|watching|like|comment)/i);
        const threshold = threshKMatch
          ? parseFloat(threshKMatch[1]) * 1000
          : threshRawMatch
          ? parseInt(threshRawMatch[1])
          : 10000;
        const isViewerTrigger = lower.includes('view') || lower.includes('watching');
        return { type: 'engagement', amount, asset, threshold, description: `Tip ${amount} ${asset} when ${isViewerTrigger ? 'viewers reach' : 'likes hit'} ${threshold}` };
      }
      if (lower.includes('surge') || lower.includes('spike') || lower.includes('double') || lower.includes('triple')) {
        return { type: 'viewer-surge', amount, asset, surgePercentage: 50, description: `Viewer surge tip: ${amount} ${asset}` };
      }
      if (lower.includes('says') || lower.includes('keyword') || lower.includes('chat') || lower.includes('when someone')) {
        const kwMatch = prompt.match(/says?\s+["']?(\w+)["']?/i);
        return { type: 'event-trigger', amount, asset, eventKeyword: kwMatch?.[1] || null, eventType: 'comment_keyword', description: `Event trigger: ${amount} ${asset}` };
      }
      // Default: immediate manual tip
      return { type: 'manual', amount, asset, description: `Tip ${amount} ${asset} now` };
    }
  }

  /**
   * Executes a registered skill and logs it
   */
  async executeSkill(skillName: string, payload: any) {
    console.log(`[OpenClaw] Skill executed: ${skillName}`, payload);
    return { success: true, timestamp: new Date().toISOString() };
  }
}
