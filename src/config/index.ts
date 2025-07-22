import dotenv from 'dotenv';

dotenv.config();

export const config = {
  recall: {
    apiKey: process.env.RECALL_API_KEY!,
    environment: process.env.RECALL_ENVIRONMENT || 'sandbox',
    baseUrl: process.env.RECALL_ENVIRONMENT === 'production' 
      ? 'https://api.competitions.recall.network'
      : 'https://api.sandbox.competitions.recall.network'
  },
  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY,
    baseUrl: 'https://api.coingecko.com/api/v3'
  },
  trading: {
    rebalanceTime: process.env.REBALANCE_TIME || '09:00',
    driftThreshold: parseFloat(process.env.DRIFT_THRESHOLD || '0.02'),
    minTradeAmount: parseFloat(process.env.MIN_TRADE_AMOUNT || '10')
  }
};

// Token mappings from the tutorial
export const TOKEN_MAP = {
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599'
} as const;

export const DECIMALS = {
  USDC: 6,
  WETH: 18,
  WBTC: 8
} as const;

export const COINGECKO_IDS = {
  USDC: 'usd-coin',
  WETH: 'weth',
  WBTC: 'wrapped-bitcoin'
} as const;

export type TokenSymbol = keyof typeof TOKEN_MAP;
