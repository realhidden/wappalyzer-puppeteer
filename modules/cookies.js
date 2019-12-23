const Analyzer = require('./analyzer');

class CookieAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'cookies');
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyze(page, foundApps) {
        // grab from puppeteer, than use it
        let cookies = await page.cookies();
        cookies = cookies.map(e => {
            e.key = e.name;
            return e;
        });
        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.cookies;
            Object.keys(patterns).forEach(cookieName => {
                if (typeof patterns[cookieName] !== 'function') {
                    // TODO: move this to preparse
                    const cookieNameLower = cookieName.toLowerCase();

                    patterns[cookieName].forEach(pattern => {
                        const cookie = cookies.find(
                            _cookie => _cookie.name.toLowerCase() === cookieNameLower
                        );

                        if (cookie && pattern.regex.test(cookie.value)) {
                            foundApps = this.addDetected(
                                foundApps,
                                app,
                                pattern,
                                'cookies',
                                cookie.value,
                                cookieName
                            );
                        }
                    });
                }
            });
        });

        return foundApps;
    }
}

module.exports = CookieAnalyzer;
