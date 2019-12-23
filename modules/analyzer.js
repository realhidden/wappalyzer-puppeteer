const Application = require('./application');

class Analyzer {
    constructor(apps, usedKey) {
        // only keep apps with specific keys
        this.apps = apps.filter(e => e[usedKey]);
    }

    addDetected(foundApps, app, pattern, type, value, key) {
        if (!foundApps[app.name]) {
            foundApps[app.name] = {
                confidence: [],
                version: ''
            };
        }

        // Set confidence level
        foundApps[app.name].confidence[`${type} ${key ? `${key} ` : ''}${pattern.regex}`] =
            pattern.confidence === undefined ? 100 : parseInt(pattern.confidence, 10);

        // Detect version number
        if (pattern.version) {
            const versions = [];
            const matches = pattern.regex.exec(value);

            let { version } = pattern;

            if (matches) {
                matches.forEach((match, i) => {
                    // Parse ternary operator
                    const ternary = new RegExp(`\\\\${i}\\?([^:]+):(.*)$`).exec(version);

                    if (ternary && ternary.length === 3) {
                        version = version.replace(ternary[0], match ? ternary[1] : ternary[2]);
                    }

                    // Replace back references
                    version = version.trim().replace(new RegExp(`\\\\${i}`, 'g'), match || '');
                });

                if (version && versions.indexOf(version) === -1) {
                    versions.push(version);
                }

                if (versions.length) {
                    // Use the longest detected version number
                    foundApps[app.name].version = versions.reduce((a, b) =>
                        a.length > b.length ? a : b
                    );
                }
            }
        }
        return foundApps;
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyze(page, foundApps) {
        return foundApps;
    }
}

module.exports = Analyzer;
