import { PortfolioManager } from './portfolio/manager';
import { TradingScheduler } from './trading/scheduler';
import { logger } from './utils/logger';
import portfolioConfig from './config/portfolio.json';
import { CoinDeskClient } from './services/coindesk-client';

async function main() {
  logger.info('Starting Recall Network Trading Bot');
  
  try {
    // Initialize portfolio manager with configuration
    const portfolioManager = new PortfolioManager(portfolioConfig);
    const coinDeskClient = new CoinDeskClient();
    const scheduler = new TradingScheduler(portfolioManager, coinDeskClient);

    // Get initial portfolio status
    logger.info('Getting initial portfolio status...');
    const initialStatus = await scheduler.getPortfolioStatus();
    logger.info('Initial portfolio status', { status: initialStatus });

    // Schedule automatic rebalancing and reporting
    scheduler.scheduleRebalancing();
    scheduler.schedulePortfolioReporting();

    logger.info('Trading bot started successfully');
    logger.info('Active schedules:', { schedules: scheduler.getActiveSchedules() });

    // Graceful shutdown handling
    process.on('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      scheduler.stopAllSchedules();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      scheduler.stopAllSchedules();
      process.exit(0);
    });

    // Keep the process running
    process.stdin.resume();

  } catch (error) {
    logger.error('Failed to start trading bot', { error });
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

if (require.main === module) {
  main();
}

export { PortfolioManager, TradingScheduler };
