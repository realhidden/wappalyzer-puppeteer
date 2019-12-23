const { Cluster } = require('puppeteer-cluster');

class PuppeteerCluster {
    constructor(appAnalytics, options) {
        this.cluster = null;
        this.options = Object.assign(
            {},
            {
                userAgent: 'wappalyzer-puppeteer',
                waitDuration: 1000 * 15,
                puppeteerClusterOptions: {
                    concurrency: Cluster.CONCURRENCY_CONTEXT,
                    maxConcurrency: 4,
                    puppeteerOptions: {
                        headless: true,
                        ignoreHTTPSErrors: true
                    }
                }
            },
            options
        );
        this.appAnalytics = appAnalytics;
    }

    async startCluster() {
        if (this.cluster !== null) {
            return;
        }

        this.cluster = await Cluster.launch(this.options.puppeteerClusterOptions);
        await this.cluster.task(async ({ page, data: { url, myContext } }) =>
            myContext.visitInternal(page, url)
        );
    }

    async closeCluster() {
        if (this.cluster === null) {
            return;
        }

        await this.cluster.idle();
        await this.cluster.close();
        this.cluster = null;
    }

    async visitInternal(page, url) {
        try {
            let headers = [];
            let scripts = [];
            let links = [];
            let statusCode = null;
            let contentType = null;
            let resources = [];

            await page.setRequestInterception(true);

            page.on('request', req => {
                req.continue();
            });

            page.on('response', res => {
                if (res.status() === 301 || res.status() === 302) {
                    return;
                }
                const resHeaders = res.headers();

                if (resources.length === 0) {
                    statusCode = res.status();
                    contentType = resHeaders['content-type'];
                    Object.keys(resHeaders).forEach(key => {
                        if (Array.isArray(resHeaders[key])) {
                            headers[key] = resHeaders[key];
                        } else {
                            headers[key] = [resHeaders[key]];
                        }
                    });
                }

                resources.push(res.url());

                if (
                    resHeaders['content-type'] &&
                    (resHeaders['content-type'].indexOf('javascript') !== -1 ||
                        resHeaders['content-type'].indexOf('application/') !== -1)
                ) {
                    scripts.push(res.url());
                }
            });

            // navigate
            await page.setUserAgent(this.options.userAgent);
            //console.time('pageload');
            try {
                if (this.options.waitDuration) {
                    await Promise.race([
                        page.goto(url, {
                            timeout: this.options.waitDuration,
                            waitUntil: 'networkidle2'
                        }),
                        new Promise(x => setTimeout(x, this.options.waitDuration))
                    ]);
                } else {
                    await page.goto(url, {
                        waitUntil: 'networkidle2'
                    });
                }
            } catch (err) {
                console.log(err.toString(), 'puppeteer', 'error');
            }
            //console.timeEnd('pageload');

            // get links
            const list = await page.evaluateHandle(() =>
                Array.from(document.getElementsByTagName('a')).map(a => ({
                    href: a.href,
                    hostname: a.hostname,
                    pathname: a.pathname,
                    hash: a.hash,
                    protocol: a.protocol
                }))
            );
            links = await list.jsonValue();

            // get cookies
            let cookies = await page.cookies();
            cookies = cookies.map(e => {
                e.key = e.name;
                return e;
            });

            // get html
            const html = await page.content();

            // do analytics
            const result = await this.appAnalytics.runAnalytics(
                page,
                html,
                scripts,
                cookies,
                headers
            );

            // close the page to free up memory
            await page.close();

            return result;
        } catch (err) {
            throw err;
        }
    }

    async analyze(visiturl) {
        if (this.cluster === null) {
            return Promise.reject(new Error('You should start the cluster before analyze'));
        }
        return await this.cluster.execute({ url: visiturl, myContext: this });
    }
}

module.exports = PuppeteerCluster;
