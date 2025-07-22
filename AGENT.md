# Agent Instructions - Recall Network Trading Bot

## Commands
- Build: `npm run build` / `tsc`
- Test: `npm test` / `jest` 
- Single test: `npm test -- --testNamePattern="test_name"`
- Lint: `npm run lint` / `eslint src/`
- Format: `npm run format` / `prettier --write .`
- Start: `npm start` / `npm run dev`

## Architecture
- Main: `src/index.ts` - Entry point and bot orchestration
- API: `src/api/` - Recall API and CoinGecko clients
- Trading: `src/trading/` - Trading strategies and execution logic
- Portfolio: `src/portfolio/` - Portfolio management and rebalancing
- Config: `src/config/` - Environment variables, token mappings
- Utils: `src/utils/` - Helpers, logging, error handling

## Dependencies
- axios - HTTP client for APIs
- dotenv - Environment variable management
- node-schedule - Automated trading schedules
- winston - Logging

## Code Style
- TypeScript strict mode enabled
- Use camelCase for variables/functions, PascalCase for classes/interfaces
- 2-space indentation
- Always handle Promise rejections with try/catch
- Store API keys in .env (never commit)
- Use proper TypeScript types for all API responses
- Log all trading actions and portfolio changes

## API Configuration
- Sandbox: `https://api.sandbox.competitions.recall.network`
- Production: `https://api.competitions.recall.network`
- Supports EVM (Ethereum, Polygon, Base) and SVM (Solana) chains
