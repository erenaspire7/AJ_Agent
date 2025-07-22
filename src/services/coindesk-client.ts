// src/services/coindesk-client.ts
// Simple CoinDesk API client for BTC/USD price

export class CoinDeskClient {
  private readonly API_URL = 'https://api.coindesk.com/v1/bpi/currentprice.json';

  async getBTCUSDPrice(): Promise<number> {
    const response = await fetch(this.API_URL);
    if (!response.ok) {
      throw new Error(`CoinDesk API error: ${response.status}`);
    }
    const data = await response.json();
    return parseFloat(data.bpi.USD.rate.replace(/,/g, ''));
  }
}
