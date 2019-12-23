# Wappalyzer-puppeteer

Wappalyzer-puppeteer is a simple library built on top of [Wappalyzer](https://www.wappalyzer.com/) dataset that uncovers the
technologies used on websites.

Wappalyzer uses [zombie](https://www.npmjs.com/package/zombie) which can handle most websites, but fails on complex / large / js heavy sites.

Since [puppeteer](https://www.npmjs.com/package/puppeteer) is stable and available for many years now, let's use the best of both words, a **real** browser and Wappalyzer's dataset.

The internal logic is rewritten from scratch, since the original Wappalyzer code has a **lot** of Promises, on-the-fly regex parsing.

## Installation

```shell
$ npm i -g wappalyzer-puppeteer      # Globally
$ npm i wappalyzer-puppeteer --save  # As a dependency
```

There are three main peer dependencies needed by this project:

-   [Wappalyzer](https://www.npmjs.com/package/wappalyzer)
-   [puppeteer-cluster](https://www.npmjs.com/package/puppeteer-cluster)
-   [puppeteer](https://www.npmjs.com/package/puppeteer)

If you are doing a global install, please install them as well

```shell
$ npm i -g wappalyzer@5.x puppeteer-cluster@0.18 puppeteer@2.x
```

## Run from the command line

```
wappalyzer [url] [options]
```

### Options

```
--max-wait=ms        Wait no more than ms milliseconds for page resources to load.
--user-agent=str     Set the user agent string.
```

## Run from a script

```javascript
const { AppAnalytics, PuppeteerCluster, Cluster } = require('wappalyzer-puppeteer');

const url = 'https://www.wappalyzer.com';

const options = {
    maxWait: 5000,
    userAgent: 'Wappalyzer',
    // puppeteerClusterOptions is passed to puppeteer-cluster
    // More options here: https://github.com/thomasdondorf/puppeteer-cluster
    puppeteerClusterOptions: {
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
        puppeteerOptions: {
            headless: true,
            ignoreHTTPSErrors: true
        }
    }
};

const appAnalytics = new AppAnalytics();
const wappalyzer = new PuppeteerCluster(appAnalytics, options);

// Load apps.json (you can provide your own json file as well)
appAnalytics
    .loadAppsjson()
    // start the puppeteer cluster
    .then(() => wappalyzer.startCluster())
    // queue an url and wait for the result
    .then(() => wappalyzer.analyze(url))
    // do whatever you want with the result
    .then(json => {
        process.stdout.write(`${JSON.stringify(json)}\n`);
    })
    // close the cluster
    .then(() => wappalyzer.closeCluster())
    .catch(error => {
        process.stderr.write(`${error}\n`);
        process.exit(1);
    });
```
