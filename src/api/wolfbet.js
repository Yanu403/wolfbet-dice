'use strict';

const axios = require('axios');

const BASE_URL = 'https://wolfbet.com/api/v1';

class WolfBetAPI {
  constructor(token) {
    this.token = token;
    this.rateLimitRemaining = null;
    this.rateLimitLimit = null;
    this.rateLimitReset = null;
    this._paused = false;
    this._pauseUntil = 0;
  }

  setToken(token) {
    this.token = token;
  }

  _headers() {
    return {
      Authorization: `Bearer ${this.token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  _updateRateLimit(headers) {
    if (headers['x-ratelimit-limit'] !== undefined) {
      this.rateLimitLimit = parseInt(headers['x-ratelimit-limit'], 10);
    }
    if (headers['x-ratelimit-remaining'] !== undefined) {
      this.rateLimitRemaining = parseInt(headers['x-ratelimit-remaining'], 10);
    }
    if (this.rateLimitRemaining !== null && this.rateLimitRemaining <= 0) {
      this._paused = true;
      this._pauseUntil = Date.now() + 60000;
    }
  }

  isRateLimited() {
    if (this._paused) {
      if (Date.now() >= this._pauseUntil) {
        this._paused = false;
        this.rateLimitRemaining = this.rateLimitLimit;
      } else {
        return true;
      }
    }
    return false;
  }

  getRateLimitWaitMs() {
    if (this._paused && Date.now() < this._pauseUntil) {
      return this._pauseUntil - Date.now();
    }
    return 0;
  }

  async _request(method, endpoint, data) {
    if (!this.token) {
      throw new Error('No API token configured');
    }
    const url = `${BASE_URL}${endpoint}`;
    const response = await axios({
      method,
      url,
      headers: this._headers(),
      data: method !== 'get' ? data : undefined,
      timeout: 15000,
    });
    this._updateRateLimit(response.headers);
    return response.data;
  }

  async placeBet({ currency, amount, rule, multiplier, bet_value }) {
    // Round to 8 decimal places to avoid floating-point precision errors
    // that cause HTTP 422 "Amount scale is too high" from the API.
    // e.g. 0.00000001 * 2 * 2 * 2 may yield 7.999...e-8 instead of 8e-8.
    const roundedAmount = Math.round(amount * 1e8) / 1e8;
    return this._request('post', '/bet/place', {
      currency,
      game: 'dice',
      amount: roundedAmount,
      rule,
      multiplier,
      bet_value,
    });
  }

  async getBalances() {
    return this._request('get', '/user/balances');
  }

  async getBetStats() {
    return this._request('get', '/user/stats/bets');
  }

  async refreshClientSeed(clientSeed) {
    return this._request('post', '/user/seed/refresh', {
      client_seed: clientSeed,
    });
  }

  async refreshServerSeed() {
    return this._request('get', '/game/seed/refresh');
  }

  async getUserInfo() {
    // Try to get user info from balances endpoint
    return this._request('get', '/user/balances');
  }
}

module.exports = WolfBetAPI;
