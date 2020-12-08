/*

  BB strategy - okibcn 2018-01-03

 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var BB = require('./indicators/BB.js');
var rsi = require('./indicators/RSI.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function () {
  this.name = 'BB';
  this.nsamples = 0;
  this.trend = {
    zone: 'none',  // none, top, high, low, bottom
    duration: 0,
    persisted: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('bb', 'BB', this.settings.bbands);
  this.addIndicator('rsi', 'RSI', this.settings);
}


// for debugging purposes log the last
// calculated parameters.
method.log = function (candle) {
  // var digits = 8;
  // var BB = this.indicators.bb;
  // //BB.lower; BB.upper; BB.middle are your line values 

  // log.debug('______________________________________');
  // log.debug('calculated BB properties for candle ', this.nsamples);

  // if (BB.upper > candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  // if (BB.middle > candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  // if (BB.lower >= candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
  // if (BB.upper <= candle.close) log.debug('\t', 'Upper BB:', BB.upper.toFixed(digits));
  // if (BB.middle <= candle.close) log.debug('\t', 'Mid   BB:', BB.middle.toFixed(digits));
  // if (BB.lower < candle.close) log.debug('\t', 'Lower BB:', BB.lower.toFixed(digits));
  // log.debug('\t', 'Band gap: ', BB.upper.toFixed(digits) - BB.lower.toFixed(digits));

  // var rsi = this.indicators.rsi;

  // log.debug('calculated RSI properties for candle:');
  // log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
  // log.debug('\t', 'price:', candle.close.toFixed(digits));
}

method.check = function (candle) {
  var BB = this.indicators.bb;
  var price = candle.close;
  this.nsamples++;

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  // price Zone detection
  var zone = 'none';
  if (price >= BB.upper) zone = 'top';
  if ((price < BB.upper) && (price >= BB.middle)) zone = 'high';
  if ((price > BB.lower) && (price < BB.middle)) zone = 'low';
  if (price <= BB.lower) zone = 'bottom';
  log.debug('current zone:  ', zone);
  log.debug('current trend duration:  ', this.trend.duration);

  if (this.trend.zone == zone) {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: this.trend.duration+1,
      persisted: true
    }
  }
  else {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: 0,
      persisted: false
    }
  }

  var percentOfPrice = ((BB.middle - BB.lower) / price);
  var lowModifier = percentOfPrice * this.settings.custom.LowMod;
  var highModifier = percentOfPrice * this.settings.custom.HighMod;
  
  log.debug('low modifier: ', lowModifier)
  log.debug('high modifier: ', highModifier)

  var rsiLowThresh = this.settings.thresholds.low - (this.settings.thresholds.low * lowModifier)
  log.debug('RSI low: ', this.settings.thresholds.low, 'modified: ', rsiLowThresh)

  var rsiHighThresh = this.settings.thresholds.high - (this.settings.thresholds.high * highModifier)
  log.debug('RSI high: ', this.settings.thresholds.high, 'modified: ', rsiHighThresh)

  var scaledPercent = percentOfPrice * 1000;
  log.debug('Scaled Percent', scaledPercent);
  
  var persistence = this.settings.thresholds.persistence;
  if(scaledPercent > 4 && scaledPercent < 10)
  {
     persistence = persistence - 1
  }

  if(scaledPercent >= 10 && scaledPercent < 20)
  {
     persistence = persistence - 2
  }

  if(scaledPercent >= 20)
  {
     persistence = persistence - 3
  }

  if (price <= BB.lower && rsiVal <= rsiLowThresh && this.trend.duration >= persistence) {
    log.debug('ADVISING LONG')
    this.advice('long')
  }
  if (price >= BB.middle && rsiVal >= rsiHighThresh) {
    log.debug('ADVISING SHORT')
    this.advice('short')
  }

  // this.trend = {
  //   zone: zone,  // none, top, high, low, bottom
  //   duration: 0,
  //   persisted: false


}

module.exports = method;
