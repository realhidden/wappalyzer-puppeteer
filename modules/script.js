const Analyzer = require('./analyzer');

class ScriptAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'script');
    }

    /**
     * Main analytical function for processing
     * @param scripts
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyzeScripts(scripts, foundApps) {
        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.script;
            patterns.forEach(pattern => {
                scripts.forEach(uri => {
                    if (pattern.regex.test(uri)) {
                        foundApps = this.addDetected(foundApps, app, pattern, 'script', uri);
                    }
                });
            });
        });

        return foundApps;
    }
}

module.exports = ScriptAnalyzer;
