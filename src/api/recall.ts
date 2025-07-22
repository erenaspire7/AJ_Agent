import axios, { AxiosInstance } from 'axios';
import { config, TOKEN_MAP, DECIMALS, TokenSymbol } from '../config';
import { logger } from '../utils/logger';

export interface TradeRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  reason: string;
}

export interface TradeResponse {
  status: string;
  [key: string]: any;
}

export interface Balance {
  [symbol: string]: number;
}

export class RecallAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.recall.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.recall.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async executeTrade(trade: TradeRequest): Promise<TradeResponse> {
    try {
      logger.info('Executing trade', { trade });
      const response = await this.client.post('/api/trade/execute', trade);
      logger.info('Trade executed successfully', { response: response.data });
      return response.data;
    } catch (error) {
      logger.error('Trade execution failed', { error });
      throw error;
    }
  }

  async getBalance(): Promise<Balance> {
    try {
      logger.info('Fetching portfolio balance');
      const response = await this.client.get('/api/agent/portfolio');
      logger.info('Balance fetched successfully', { balance: response.data });
      // Adapt the return value to match the Balance interface
      // The API returns { success, agentId, totalValue, tokens, ... }
      // We'll map tokens array to { [symbol]: amount }
      if (response.data && Array.isArray(response.data.tokens)) {
        const balances: Balance = {};
        for (const token of response.data.tokens) {
          if (token.symbol && token.amount !== undefined) {
            balances[token.symbol] = token.amount;
          }
        }
        return balances;
      }
      // fallback: return empty object if tokens not present
      return {};
    } catch (error) {
      logger.error('Failed to fetch balance', { error });
      throw error;
    }
  }

  async getPortfolio(): Promise<any> {
    try {
      logger.info('Fetching portfolio details');
      const response = await this.client.get('/api/agent/portfolio');
      logger.info('Portfolio fetched successfully', { portfolio: response.data });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch portfolio', { error });
      throw error;
    }
  }

  // Helper method to convert human readable amounts to base units
  toBaseUnits(amount: number, tokenSymbol: TokenSymbol): string {
    const decimals = DECIMALS[tokenSymbol];
    const multiplier = Math.pow(10, decimals);
    return Math.floor(amount * multiplier).toString();
  }

  // Helper method to convert base units to human readable amounts
  fromBaseUnits(amount: string, tokenSymbol: TokenSymbol): number {
    const decimals = DECIMALS[tokenSymbol];
    const divisor = Math.pow(10, decimals);
    return parseInt(amount) / divisor;
  }

  // Helper method to create a trade between two tokens
  createTradeRequest(
    fromSymbol: TokenSymbol,
    toSymbol: TokenSymbol,
    amount: number,
    reason: string = 'Automated portfolio rebalance'
  ): TradeRequest {
    return {
      fromToken: TOKEN_MAP[fromSymbol],
      toToken: TOKEN_MAP[toSymbol],
      amount: this.toBaseUnits(amount, fromSymbol),
      reason
    };
  }
}
