#!/usr/bin/env node

import { PortfolioManager } from './portfolio/manager';
import { TradingScheduler } from './trading/scheduler';
import { RecallAPI } from './api/recall';
import { CoinGeckoAPI } from './api/coingecko';
import { logger } from './utils/logger';
import portfolioConfig from './config/portfolio.json';

const commands = {
  async status() {
    const portfolioManager = new PortfolioManager(portfolioConfig);
    const status = await portfolioManager.getPortfolioSummary();
    console.log('\n=== Portfolio Status ===');
    console.log(`Total Value: $${status.totalValue.toFixed(2)}`);
    console.log(`Rebalance Needed: ${status.rebalanceNeeded ? 'YES' : 'NO'}\n`);
    
    console.log('Positions:');
    status.positions.forEach((pos: any) => {
      console.log(`${pos.symbol.padEnd(6)} | Balance: ${pos.balance.toFixed(6)} | Value: $${pos.value.toFixed(2)} | Weight: ${(pos.weight * 100).toFixed(1)}% (Target: ${(pos.targetWeight * 100).toFixed(1)}%) | Drift: ${(pos.drift * 100).toFixed(1)}%`);
    });
  },

  async rebalance() {
    const portfolioManager = new PortfolioManager(portfolioConfig);
    const scheduler = new TradingScheduler(portfolioManager);
    
    console.log('Triggering manual rebalance...');
    await scheduler.triggerRebalance();
    console.log('Rebalance completed!');
  },

  async balance() {
    const recallAPI = new RecallAPI();
    const balance = await recallAPI.getBalance();
    
    console.log('\n=== Current Balances ===');
    Object.entries(balance).forEach(([symbol, amount]) => {
      console.log(`${symbol.padEnd(6)}: ${amount}`);
    });
  },

  async prices() {
    const coinGeckoAPI = new CoinGeckoAPI();
    const prices = await coinGeckoAPI.getAllSupportedTokenPrices();
    
    console.log('\n=== Current Prices (USD) ===');
    Object.entries(prices).forEach(([symbol, price]) => {
      console.log(`${symbol.padEnd(6)}: $${price.toFixed(2)}`);
    });
  },

  async portfolio() {
    const recallAPI = new RecallAPI();
    const portfolio = await recallAPI.getPortfolio();
    console.log('\n=== Portfolio Details ===');
    console.log(JSON.stringify(portfolio, null, 2));
  },

  help() {
    console.log('\n=== Recall Trading Bot CLI ===');
    console.log('Available commands:');
    console.log('  status     - Show portfolio status and allocation');
    console.log('  rebalance  - Trigger manual portfolio rebalance');
    console.log('  balance    - Show current token balances');
    console.log('  prices     - Show current token prices');
    console.log('  portfolio  - Show detailed portfolio information');
    console.log('  help       - Show this help message');
    console.log('\nUsage: npm run cli <command>');
    console.log('Example: npm run cli status\n');
  }
};

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    commands.help();
    return;
  }

  if (!(command in commands)) {
    console.error(`Unknown command: ${command}`);
    commands.help();
    process.exit(1);
  }

  try {
    await (commands as any)[command]();
  } catch (error) {
    logger.error(`CLI command '${command}' failed`, { error });
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
