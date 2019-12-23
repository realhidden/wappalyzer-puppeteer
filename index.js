const { Cluster } = require('puppeteer-cluster');
const AppAnalytics = require('./appanalytics');
const PuppeteerCluster = require('./puppeteercluster');

/*
(async () => {
    const appAnalytics = new AppAnalytics();
    await appAnalytics.loadAppsjson();

    const cluster = new PuppeteerCluster(appAnalytics,{
        waitDuration:0,
        puppeteerClusterOptions:{
            concurrency: Cluster.CONCURRENCY_CONTEXT,
            maxConcurrency: 2,
            puppeteerOptions: {
                headless: true,
                ignoreHTTPSErrors: true
            }
        }
    });

    await cluster.startCluster();
    const result = await cluster.analyze('https://thisisdone.com');
    console.log(result);
    await cluster.closeCluster();
})();*/

module.exports = {
    AppAnalytics,
    PuppeteerCluster,
    Cluster
};
