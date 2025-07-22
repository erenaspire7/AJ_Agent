# Recall Network Trading Bot

A TypeScript trading bot for the Recall Network competition that automatically manages and rebalances cryptocurrency portfolios across EVM (Ethereum, Polygon, Base) and SVM (Solana) chains.

## Features

- **Automated Portfolio Rebalancing**: Maintains target allocation percentages with configurable drift thresholds
- **Multi-Chain Support**: Works with EVM and SVM chains through Recall Network API
- **Real-time Price Data**: Fetches live prices from CoinGecko API
- **Scheduled Trading**: Daily rebalancing with configurable timing
- **Portfolio Monitoring**: Hourly portfolio status reporting
- **CLI Interface**: Manual operations and status checking
- **Comprehensive Logging**: All trading actions and errors are logged

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Configure portfolio allocation** (edit `src/config/portfolio.json`):
   ```json
   {
     "USDC": 0.25,
     "WETH": 0.50,
     "WBTC": 0.25
   }
   ```

4. **Run the bot**:
   ```bash
   npm run dev
   ```

## CLI Commands

- `npm run cli status` - Show portfolio status and allocation
- `npm run cli rebalance` - Trigger manual rebalance
- `npm run cli balance` - Show current token balances
- `npm run cli prices` - Show current token prices
- `npm run cli portfolio` - Show detailed portfolio information

## Configuration

### Environment Variables (.env)

```bash
# Recall Network API
RECALL_API_KEY=your_recall_api_key_here
RECALL_ENVIRONMENT=sandbox  # or production

# CoinGecko API (optional)
COINGECKO_API_KEY=your_coingecko_api_key_here

# Trading Configuration
REBALANCE_TIME=09:00  # Daily rebalance time (HH:MM)
DRIFT_THRESHOLD=0.02  # 2% drift threshold
MIN_TRADE_AMOUNT=10   # Minimum trade amount in USD
```

### Portfolio Configuration

Edit `src/config/portfolio.json` to set your target allocation:

```json
{
  "USDC": 0.25,  // 25% allocation
  "WETH": 0.50,  // 50% allocation
  "WBTC": 0.25   // 25% allocation
}
```

## Architecture

- **`src/api/`** - API clients for Recall Network and CoinGecko
- **`src/portfolio/`** - Portfolio management and rebalancing logic
- **`src/trading/`** - Trading scheduler and execution
- **`src/config/`** - Configuration and token mappings
- **`src/utils/`** - Logging and helper utilities

## Development

```bash
# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## Logging

Logs are written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output during development

## API Documentation

- [Recall Network API](https://docs.recall.network/quickstart/your-first-trade)
- [Portfolio Management Guide](https://docs.recall.network/competitions/guides/portfolio-manager-tutorial)
- [Competition Info](https://recall.encode.club/hacker-pack)
