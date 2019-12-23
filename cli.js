#!/usr/bin/env node

// Modified version of https://github.com/AliasIO/wappalyzer/blob/master/src/drivers/npm/cli.js
const { AppAnalytics, PuppeteerCluster } = require('./index');

const args = process.argv.slice(2);

const url = args.shift() || '';

if (!url) {
    process.stderr.write('No URL specified\n');
    process.exit(1);
}

const options = {};

let arg;

do {
    arg = args.shift();

    const matches = /--([^=]+)=(.+)/.exec(arg);

    if (matches) {
        const key = matches[1].replace(/-\w/g, _matches => _matches[1].toUpperCase());
        const value = matches[2];

        options[key] = value;
    }
} while (arg);

const appAnalytics = new AppAnalytics();
const wappalyzer = new PuppeteerCluster(appAnalytics, options);

appAnalytics
    .loadAppsjson()
    .then(() => wappalyzer.startCluster())
    .then(() => wappalyzer.analyze(url))
    .then(json => {
        process.stdout.write(`${JSON.stringify(json)}\n`);
    })
    .then(() => wappalyzer.closeCluster())
    .catch(error => {
        process.stderr.write(`${error}\n`);

        process.exit(1);
    });
