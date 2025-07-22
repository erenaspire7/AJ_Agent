import { RecallAPI, Balance } from '../api/recall';
import { CoinGeckoAPI, TokenPrice } from '../api/coingecko';
import { config, TokenSymbol } from '../config';
import { logger } from '../utils/logger';

export interface PortfolioConfig {
  [symbol: string]: number; // Target weight (0-1)
}

export interface PortfolioPosition {
  symbol: TokenSymbol;
  balance: number;
  price: number;
  value: number;
  targetWeight: number;
  currentWeight: number;
  drift: number; // Percentage drift from target
}

export interface TradeOrder {
  symbol: TokenSymbol;
  side: 'buy' | 'sell';
  amount: number;
  reason: string;
}

export class PortfolioManager {
  private recallAPI: RecallAPI;
  private coinGeckoAPI: CoinGeckoAPI;
  private portfolioConfig: PortfolioConfig;

  constructor(portfolioConfig: PortfolioConfig) {
    this.recallAPI = new RecallAPI();
    this.coinGeckoAPI = new CoinGeckoAPI();
    this.portfolioConfig = portfolioConfig;
    
    // Validate portfolio config weights sum to 1
    const totalWeight = Object.values(portfolioConfig).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(`Portfolio weights must sum to 1.0, got ${totalWeight}`);
    }
  }

  async getCurrentPortfolio(): Promise<PortfolioPosition[]> {
    logger.info('Analyzing current portfolio');
    
    const [balances, prices] = await Promise.all([
      this.recallAPI.getBalance(),
      this.coinGeckoAPI.getAllSupportedTokenPrices()
    ]);

    const positions: PortfolioPosition[] = [];
    let totalValue = 0;

    // Calculate total portfolio value first
    for (const [symbol, balance] of Object.entries(balances)) {
      if (symbol in prices && balance > 0) {
        totalValue += balance * prices[symbol];
      }
    }

    // Create position objects
    for (const [symbol, targetWeight] of Object.entries(this.portfolioConfig)) {
      const balance = balances[symbol] || 0;
      const price = prices[symbol] || 0;
      const value = balance * price;
      const currentWeight = totalValue > 0 ? value / totalValue : 0;
      const drift = currentWeight - targetWeight;

      positions.push({
        symbol: symbol as TokenSymbol,
        balance,
        price,
        value,
        targetWeight,
        currentWeight,
        drift
      });
    }

    logger.info('Portfolio analysis complete', { 
      totalValue, 
      positions: positions.map(p => ({
        symbol: p.symbol,
        value: p.value,
        currentWeight: p.currentWeight,
        targetWeight: p.targetWeight,
        drift: p.drift
      }))
    });

    return positions;
  }

  async calculateRebalanceOrders(): Promise<TradeOrder[]> {
    logger.info('Calculating rebalance orders');
    
    const positions = await this.getCurrentPortfolio();
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    const orders: TradeOrder[] = [];

    if (totalValue === 0) {
      logger.warn('Portfolio has zero value, cannot rebalance');
      return orders;
    }

    // Find positions that need rebalancing
    const positionsNeedingRebalance = positions.filter(
      pos => Math.abs(pos.drift) > config.trading.driftThreshold
    );

    if (positionsNeedingRebalance.length === 0) {
      logger.info('Portfolio is within drift threshold, no rebalancing needed');
      return orders;
    }

    // Separate overweight and underweight positions
    const overweightPositions = positionsNeedingRebalance.filter(pos => pos.drift > 0);
    const underweightPositions = positionsNeedingRebalance.filter(pos => pos.drift < 0);

    logger.info('Positions needing rebalancing', {
      overweight: overweightPositions.map(p => ({ symbol: p.symbol, drift: p.drift })),
      underweight: underweightPositions.map(p => ({ symbol: p.symbol, drift: p.drift }))
    });

    // Create sell orders for overweight positions
    for (const position of overweightPositions) {
      const excessValue = position.drift * totalValue;
      const sellAmount = excessValue / position.price;
      
      if (sellAmount * position.price >= config.trading.minTradeAmount) {
        orders.push({
          symbol: position.symbol,
          side: 'sell',
          amount: sellAmount,
          reason: `Rebalance: reducing ${position.symbol} allocation`
        });
      }
    }

    // Create buy orders for underweight positions using USDC as base
    for (const position of underweightPositions) {
      const deficitValue = Math.abs(position.drift) * totalValue;
      const buyAmount = deficitValue / position.price;
      
      if (buyAmount * position.price >= config.trading.minTradeAmount) {
        orders.push({
          symbol: position.symbol,
          side: 'buy',
          amount: buyAmount,
          reason: `Rebalance: increasing ${position.symbol} allocation`
        });
      }
    }

    logger.info('Rebalance orders calculated', { 
      orderCount: orders.length,
      orders: orders.map(o => ({
        symbol: o.symbol,
        side: o.side,
        amount: o.amount,
        value: o.amount * (positions.find(p => p.symbol === o.symbol)?.price ?? 0)
      }))
    });

    return orders;
  }

  async executeRebalance(): Promise<void> {
    logger.info('Starting portfolio rebalance');
    
    try {
      const orders = await this.calculateRebalanceOrders();
      
      if (orders.length === 0) {
        logger.info('No rebalancing needed');
        return;
      }

      // Execute sell orders first to generate liquidity
      const sellOrders = orders.filter(order => order.side === 'sell');
      const buyOrders = orders.filter(order => order.side === 'buy');

      // Execute sell orders
      for (const order of sellOrders) {
        await this.executeSellOrder(order);
        // Add small delay between trades
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Execute buy orders
      for (const order of buyOrders) {
        await this.executeBuyOrder(order);
        // Add small delay between trades
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      logger.info('Portfolio rebalance completed successfully');
      
    } catch (error) {
      logger.error('Portfolio rebalance failed', { error });
      throw error;
    }
  }

  private async executeSellOrder(order: TradeOrder): Promise<void> {
    const tradeRequest = this.recallAPI.createTradeRequest(
      order.symbol,
      'USDC', // Sell to USDC for liquidity
      order.amount,
      order.reason
    );
    
    await this.recallAPI.executeTrade(tradeRequest);
  }

  private async executeBuyOrder(order: TradeOrder): Promise<void> {
    // Calculate USDC amount needed for the buy order
    const positions = await this.getCurrentPortfolio();
    const tokenPosition = positions.find(p => p.symbol === order.symbol);
    
    if (!tokenPosition) {
      throw new Error(`Token position not found for ${order.symbol}`);
    }
    
    const usdcAmount = order.amount * tokenPosition.price;
    
    const tradeRequest = this.recallAPI.createTradeRequest(
      'USDC', // Buy from USDC
      order.symbol,
      usdcAmount, // Use USDC amount instead of token amount
      order.reason
    );
    
    await this.recallAPI.executeTrade(tradeRequest);
  }

  async getPortfolioSummary(): Promise<any> {
    const positions = await this.getCurrentPortfolio();
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
    
    return {
      totalValue,
      positions: positions.map(pos => ({
        symbol: pos.symbol,
        balance: pos.balance,
        value: pos.value,
        weight: pos.currentWeight,
        targetWeight: pos.targetWeight,
        drift: pos.drift,
        needsRebalancing: Math.abs(pos.drift) > config.trading.driftThreshold
      })),
      rebalanceNeeded: positions.some(pos => Math.abs(pos.drift) > config.trading.driftThreshold)
    };
  }
}
