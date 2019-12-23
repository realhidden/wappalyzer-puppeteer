const Analyzer = require('./analyzer');

class HtmlAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'html');
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyzeHtml(html, foundApps) {
        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.html;
            patterns.forEach(pattern => {
                if (pattern.regex.test(html)) {
                    foundApps = this.addDetected(foundApps, app, pattern, 'html', html);
                }
            });
        });

        return foundApps;
    }
}

module.exports = HtmlAnalyzer;
