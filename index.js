// Modified version of https://github.com/AliasIO/wappalyzer/blob/master/src/drivers/npm/index.js
const Driver = require('./driver');
const ZombieBrowser = require('wappalyzer/browsers/zombie');

class Wappalyzer {
    constructor(pageUrl, options) {
        this.browser = ZombieBrowser;

        return new Driver(this.browser, pageUrl, options);
    }
}

Wappalyzer.browsers = {
    zombie: ZombieBrowser
};

module.exports = Wappalyzer;
