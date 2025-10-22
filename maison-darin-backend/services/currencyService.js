const axios = require('axios');

class CurrencyService {
  constructor() {
    // Free API for currency conversion
    this.exchangeRateAPI = 'https://api.exchangerate-api.com/v4/latest/SAR';
    this.fallbackRates = {
      'SAR': 1,
      'USD': 0.27, // تقريبي: 1 ريال = 0.27 دولار
      'EUR': 0.24,
      'GBP': 0.21
    };
  }

  /**
   * Get current exchange rates for SAR
   */
  async getExchangeRates() {
    try {
      console.log('🔄 Fetching current exchange rates...');
      
      const response = await axios.get(this.exchangeRateAPI, {
        timeout: 5000 // 5 seconds timeout
      });

      if (response.data && response.data.rates) {
        console.log('✅ Exchange rates fetched successfully');
        console.log('📊 Current rates:', {
          'SAR to USD': response.data.rates.USD,
          'SAR to EUR': response.data.rates.EUR,
          'SAR to GBP': response.data.rates.GBP
        });
        
        return {
          success: true,
          rates: response.data.rates,
          lastUpdated: response.data.date
        };
      }

      throw new Error('Invalid response format');

    } catch (error) {
      console.warn('⚠️ Failed to fetch live exchange rates:', error.message);
      console.log('🔄 Using fallback rates...');
      
      return {
        success: false,
        rates: this.fallbackRates,
        lastUpdated: new Date().toISOString().split('T')[0],
        usingFallback: true
      };
    }
  }

  /**
   * Convert amount from SAR to target currency
   */
  async convertFromSAR(amount, targetCurrency = 'USD') {
    try {
      if (targetCurrency === 'SAR') {
        return {
          originalAmount: amount,
          convertedAmount: amount,
          originalCurrency: 'SAR',
          targetCurrency: 'SAR',
          exchangeRate: 1,
          converted: false
        };
      }

      const ratesData = await this.getExchangeRates();
      const rate = ratesData.rates[targetCurrency];

      if (!rate) {
        throw new Error(`Exchange rate not found for ${targetCurrency}`);
      }

      const convertedAmount = parseFloat((amount * rate).toFixed(2));

      console.log('💱 Currency Conversion:');
      console.log(`   ${amount} SAR → ${convertedAmount} ${targetCurrency}`);
      console.log(`   Exchange Rate: 1 SAR = ${rate} ${targetCurrency}`);
      console.log(`   Using ${ratesData.usingFallback ? 'fallback' : 'live'} rates`);

      return {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        originalCurrency: 'SAR',
        targetCurrency: targetCurrency,
        exchangeRate: rate,
        converted: true,
        usingFallback: ratesData.usingFallback,
        lastUpdated: ratesData.lastUpdated
      };

    } catch (error) {
      console.error('❌ Currency conversion failed:', error.message);
      
      // Use fallback rate
      const fallbackRate = this.fallbackRates[targetCurrency] || 0.27;
      const convertedAmount = parseFloat((amount * fallbackRate).toFixed(2));

      console.log('🔄 Using emergency fallback conversion:');
      console.log(`   ${amount} SAR → ${convertedAmount} ${targetCurrency} (rate: ${fallbackRate})`);

      return {
        originalAmount: amount,
        convertedAmount: convertedAmount,
        originalCurrency: 'SAR',
        targetCurrency: targetCurrency,
        exchangeRate: fallbackRate,
        converted: true,
        usingFallback: true,
        error: error.message
      };
    }
  }

  /**
   * Convert amount to PayPal-compatible currency
   */
  async convertForPayPal(amount, sourceCurrency = 'SAR') {
    try {
      // PayPal primarily uses USD, but supports multiple currencies
      const paypalCurrency = 'USD';

      if (sourceCurrency === paypalCurrency) {
        return {
          amount: amount,
          currency: paypalCurrency,
          converted: false
        };
      }

      if (sourceCurrency === 'SAR') {
        const conversion = await this.convertFromSAR(amount, paypalCurrency);
        
        return {
          amount: conversion.convertedAmount,
          currency: paypalCurrency,
          converted: true,
          originalAmount: conversion.originalAmount,
          originalCurrency: conversion.originalCurrency,
          exchangeRate: conversion.exchangeRate,
          conversionDetails: conversion
        };
      }

      throw new Error(`Conversion from ${sourceCurrency} not supported yet`);

    } catch (error) {
      console.error('❌ PayPal currency conversion failed:', error.message);
      throw error;
    }
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies() {
    return [
      { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' }
    ];
  }

  /**
   * Validate currency code
   */
  isValidCurrency(currencyCode) {
    const supportedCurrencies = this.getSupportedCurrencies();
    return supportedCurrencies.some(currency => currency.code === currencyCode);
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount, currencyCode) {
    const currencies = this.getSupportedCurrencies();
    const currency = currencies.find(c => c.code === currencyCode);
    
    if (!currency) {
      return `${amount} ${currencyCode}`;
    }

    // Format based on currency
    switch (currencyCode) {
      case 'SAR':
        return `${amount} ${currency.symbol}`;
      case 'USD':
      case 'EUR':
      case 'GBP':
        return `${currency.symbol}${amount}`;
      default:
        return `${amount} ${currency.symbol}`;
    }
  }
}

module.exports = new CurrencyService();
