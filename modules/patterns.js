const fs = require('fs').promises;
const path = require('path');
const Application = require('./application');

/**
 * Enclose string in array (from Wappalyzer)
 */
function asArray(value) {
    return value instanceof Array ? value : [value];
}

/**
 * Load patterns from apps.js
 * @param overrideAppsJs
 * @returns {Promise<any>}
 */
async function loadPatterns(overrideAppsJs) {
    return JSON.parse(
        await fs.readFile(
            overrideAppsJs
                ? overrideAppsJs
                : path.resolve(`${__dirname}/../node_modules/wappalyzer/apps.json`),
            'utf-8'
        )
    );
}

module.exports.loadPatterns = loadPatterns;

/**
 * Parse apps.json patterns (from Wappalyzer)
 */
function parsePatterns(patterns) {
    if (!patterns) {
        return [];
    }

    let parsed = {};

    // Convert string to object containing array containing string
    if (typeof patterns === 'string' || patterns instanceof Array) {
        patterns = {
            main: asArray(patterns)
        };
    }

    Object.keys(patterns).forEach(key => {
        parsed[key] = [];

        asArray(patterns[key]).forEach(pattern => {
            const attrs = {};

            pattern.split('\\;').forEach((attr, i) => {
                if (i) {
                    // Key value pairs
                    attr = attr.split(':');

                    if (attr.length > 1) {
                        attrs[attr.shift()] = attr.join(':');
                    }
                } else {
                    attrs.string = attr;

                    try {
                        attrs.regex = new RegExp(attr.replace('/', '/'), 'i'); // Escape slashes in regular expression
                    } catch (error) {
                        attrs.regex = new RegExp();

                        console.log(`${error.message}: ${attr}`, 'error', 'core');
                    }
                }
            });

            parsed[key].push(attrs);
        });
    });

    // Convert back to array if the original pattern list was an array (or string)
    if ('main' in parsed) {
        parsed = parsed.main;
    }

    return parsed;
}

module.exports.parsePatterns = parsePatterns;

/**
 * Pre-parse all patterns
 * @param appjson
 * @returns {*}
 */
function preParsePatterns(appsRaw) {
    const preparse = ['html', 'script', 'js', 'url', 'meta', 'headers', 'cookies', 'implies'];
    const appNames = Object.keys(appsRaw);
    const allApps = [];

    for (let i = 0; i < appNames.length; i++) {
        let app = appsRaw[appNames[i]];
        preparse.forEach(prop => {
            if (app[prop]) {
                app[prop] = parsePatterns(app[prop]);
            }
        });

        // assign a name
        app.name = appNames[i];
        allApps.push(app);
    }
    return allApps;
}

module.exports.preParsePatterns = preParsePatterns;

/**
 * Resolve excludes (idea from Wappalyzer, heavily modified version)
 * @param apps
 * @param detected
 */
function resolveExcludes(detectedApps, apps) {
    const excludes = [];

    // Exclude app in detected apps only
    Object.keys(detectedApps).forEach(appName => {
        const app = apps.find(e => e.name === appName);
        if (app.excludes) {
            asArray(app.excludes).forEach(excluded => {
                excludes.push(excluded);
            });
        }
    });

    // Remove excluded applications
    Object.keys(detectedApps).forEach(appName => {
        if (excludes.indexOf(appName) > -1) {
            delete detectedApps[appName];
        }
    });

    return detectedApps;
}

module.exports.resolveExcludes = resolveExcludes;

/**
 * Resolve implies structure (idea from Wappalyzer, heavily modified version)
 * @param detectedApps
 * @param apps
 */
function resolveImplies(detectedApps, apps) {
    let checkImplies = true;

    const resolveImplies = appName => {
        const app = apps.find(e => e.name === appName);

        if (app && app.implies) {
            asArray(app.implies).forEach(implied => {
                const impliedApp = apps.find(e => e.name === implied.string);
                if (!impliedApp) {
                    console.log(
                        `Implied application ${implied.string} does not exist`,
                        'core',
                        'warn'
                    );
                    return;
                }

                if (!(implied.string in detectedApps)) {
                    detectedApps[implied.string] = {
                        confidence: [],
                        version: ''
                    };
                    checkImplies = true;
                }

                // Apply app confidence to implied app
                Object.keys(detectedApps[app.name].confidence).forEach(id => {
                    detectedApps[implied.string].confidence[`${id} implied by ${appName}`] =
                        detectedApps[app.name].confidence[id] *
                        (detectedApps[implied.string].confidence.length === 0
                            ? 1
                            : Object.values(detectedApps[implied.string].confidence).reduce(
                                  (a, b) => a + b,
                                  0
                              ) / 100);
                });
            });
        }
    };

    // Implied applications
    // Run several passes as implied apps may imply other apps
    while (checkImplies) {
        checkImplies = false;
        Object.keys(detectedApps).forEach(resolveImplies);
    }

    return detectedApps;
}

module.exports.resolveImplies = resolveImplies;

/**
 * Reformat detected apps to wappalzer format
 * @param detected
 * @param meta
 */
function displayApps(url, detectedApps, apps, allCategories, meta) {
    const applications = [];

    this.meta = meta;

    Object.keys(detectedApps).forEach(appName => {
        const app = apps.find(e => e.name === appName);

        const categories = [];

        Object.keys(allCategories)
            .filter(e => app.cats.includes(parseInt(e)))
            .forEach(id => {
                const category = {};
                category[id] = allCategories[id].name;
                categories.push(category);
            });

        applications.push({
            name: appName,
            confidence: Object.values(detectedApps[appName].confidence).reduce((a, b) => a + b, 0),
            version: detectedApps[appName].version || null,
            icon: app.icon || 'default.svg',
            website: app.website,
            cpe: app.cpe || null,
            categories
        });
    });

    return {
        urls: [url],
        applications,
        meta
    };
}

module.exports.displayApps = displayApps;
