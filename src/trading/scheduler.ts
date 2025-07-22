import * as schedule from 'node-schedule';
import { PortfolioManager } from '../portfolio/manager';
import { config } from '../config';
import { logger } from '../utils/logger';
import { CoinDeskClient } from '../services/coindesk-client';

export class TradingScheduler {
  private portfolioManager: PortfolioManager;
  private scheduledJobs: Map<string, schedule.Job> = new Map();
  private coinDeskClient: CoinDeskClient;

  constructor(portfolioManager: PortfolioManager, coinDeskClient: CoinDeskClient) {
    this.portfolioManager = portfolioManager;
    this.coinDeskClient = coinDeskClient;
  }

  scheduleRebalancing(): void {
    logger.info('Scheduling daily portfolio rebalancing', { 
      time: config.trading.rebalanceTime 
    });

    const [hour, minute] = config.trading.rebalanceTime.split(':').map(Number);
    
    const job = schedule.scheduleJob(
      `rebalance-${Date.now()}`,
      { hour, minute },
      async () => {
        logger.info('Executing scheduled portfolio rebalance');
        try {
          await this.portfolioManager.executeRebalance();
          logger.info('Scheduled rebalance completed successfully');
        } catch (error) {
          logger.error('Scheduled rebalance failed', { error });
        }
      }
    );

    if (job) {
      this.scheduledJobs.set('daily-rebalance', job);
      logger.info('Daily rebalancing scheduled successfully');
    } else {
      logger.error('Failed to schedule daily rebalancing');
    }
  }

  schedulePortfolioReporting(): void {
    logger.info('Scheduling hourly portfolio reporting');

    // Report portfolio status every hour
    const job = schedule.scheduleJob(
      'portfolio-report',
      '0 * * * *', // Every hour at minute 0
      async () => {
        try {
          const summary = await this.portfolioManager.getPortfolioSummary();
          logger.info('Portfolio status report', { summary });
        } catch (error) {
          logger.error('Portfolio reporting failed', { error });
        }
      }
    );

    if (job) {
      this.scheduledJobs.set('hourly-report', job);
      logger.info('Hourly portfolio reporting scheduled successfully');
    }
  }

  // Manual trigger for immediate rebalancing
  async triggerRebalance(): Promise<void> {
    logger.info('Manual rebalance triggered');
    try {
      await this.portfolioManager.executeRebalance();
      logger.info('Manual rebalance completed successfully');
    } catch (error) {
      logger.error('Manual rebalance failed', { error });
      throw error;
    }
  }

  // Get portfolio status without rebalancing
  async getPortfolioStatus(): Promise<any> {
    try {
      return await this.portfolioManager.getPortfolioSummary();
    } catch (error) {
      logger.error('Failed to get portfolio status', { error });
      throw error;
    }
  }

  stopAllSchedules(): void {
    logger.info('Stopping all scheduled jobs');
    this.scheduledJobs.forEach((job, name) => {
      job.cancel();
      logger.info(`Stopped scheduled job: ${name}`);
    });
    this.scheduledJobs.clear();
  }

  getActiveSchedules(): string[] {
    return Array.from(this.scheduledJobs.keys());
  }
}
