import axios, { AxiosInstance } from 'axios';
import { config, COINGECKO_IDS, TokenSymbol } from '../config';
import { logger } from '../utils/logger';

export interface TokenPrice {
  [symbol: string]: number;
}

export interface CoinGeckoPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

export class CoinGeckoAPI {
  private client: AxiosInstance;

  constructor() {
    const headers: any = {
      'Accept': 'application/json'
    };


    this.client = axios.create({
      baseURL: config.coingecko.baseUrl,
      headers
    });
  }

  async getTokenPrices(symbols: TokenSymbol[]): Promise<TokenPrice> {
    try {
      logger.info('Fetching token prices', { symbols });
      
      const coinIds = symbols.map(symbol => COINGECKO_IDS[symbol]).join(',');
      const response = await this.client.get<CoinGeckoPriceResponse>(
        '/simple/price',
        {
          params: {
            ids: coinIds,
            vs_currencies: 'usd'
          }
        }
      );

      const prices: TokenPrice = {};
      symbols.forEach(symbol => {
        const coinId = COINGECKO_IDS[symbol];
        if (response.data[coinId]) {
          prices[symbol] = response.data[coinId].usd;
        }
      });

      logger.info('Token prices fetched successfully', { prices });
      return prices;
    } catch (error) {
      logger.error('Failed to fetch token prices', { error });
      throw error;
    }
  }

  async getAllSupportedTokenPrices(): Promise<TokenPrice> {
    const allSymbols = Object.keys(COINGECKO_IDS) as TokenSymbol[];
    return this.getTokenPrices(allSymbols);
  }

  // Helper method to get price for a single token
  async getTokenPrice(symbol: TokenSymbol): Promise<number> {
    const prices = await this.getTokenPrices([symbol]);
    return prices[symbol];
  }
}
