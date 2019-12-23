const Analyzer = require('./analyzer');

class HeadersAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'headers');
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyzeHeaders(headers, foundApps) {
        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.headers;
            Object.keys(patterns).forEach(headerName => {
                if (typeof patterns[headerName] !== 'function') {
                    patterns[headerName].forEach(pattern => {
                        // TODO: move this to preparse
                        const headerNameLower = headerName.toLowerCase();

                        if (headerNameLower in headers) {
                            headers[headerNameLower].forEach(headerValue => {
                                if (pattern.regex.test(headerValue)) {
                                    foundApps = this.addDetected(
                                        foundApps,
                                        app,
                                        pattern,
                                        'headers',
                                        headerValue,
                                        headerName
                                    );
                                }
                            });
                        }
                    });
                }
            });
        });

        return foundApps;
    }
}

module.exports = HeadersAnalyzer;
