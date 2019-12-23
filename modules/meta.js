const Analyzer = require('./analyzer');

class MetaAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'meta');
        this.metaTagRegex = /<meta[^>]+>/gi;
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyzeHtml(html, foundApps) {
        // grab meta tags
        const metaTags = [];
        let matches = true;
        do {
            matches = this.metaTagRegex.exec(html);

            if (!matches) {
                break;
            }

            metaTags.push(matches[0]);
        } while (matches);

        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.meta;
            metaTags.forEach(match => {
                Object.keys(patterns).forEach(meta => {
                    const r = new RegExp(`(?:name|property)=["']${meta}["']`, 'i');

                    if (r.test(match)) {
                        const content = match.match(/content=("|')([^"']+)("|')/i);

                        patterns[meta].forEach(pattern => {
                            if (content && content.length === 4 && pattern.regex.test(content[2])) {
                                foundApps = this.addDetected(
                                    foundApps,
                                    app,
                                    pattern,
                                    'meta',
                                    content[2],
                                    meta
                                );
                            }
                        });
                    }
                });
            });
        });

        return foundApps;
    }
}

module.exports = MetaAnalyzer;
