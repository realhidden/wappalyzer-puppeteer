const Analyzer = require('./analyzer');

function puppeteerJsEvalFunction(jsKeys) {
    Array.prototype.reduceWappalyzer ||
        Object.defineProperty(Array.prototype, 'reduceWappalyzer', {
            value(r) {
                if (this === null) throw new TypeError();
                if (typeof r !== 'function') throw new TypeError();
                let e,
                    t = Object(this),
                    o = t.length >>> 0,
                    i = 0;
                if (arguments.length >= 2) e = arguments[1];
                else {
                    for (; i < o && !(i in t); ) i++;
                    if (i >= o) throw new TypeError();
                    e = t[i++];
                }
                for (; i < o; ) i in t && (e = r(e, t[i], i, t)), i++;
                return e;
            }
        });

    let res = {};
    jsKeys.forEach(key => {
        let value = key
            .split('.')
            .reduceWappalyzer(
                (parent, property) => (parent && parent[property] ? parent[property] : null),
                window
            );

        value = typeof value === 'string' || typeof value === 'number' ? value : !!value;
        if (value) {
            res[key] = value;
        }
    });

    return res;
}

class JsAnalyzer extends Analyzer {
    constructor(apps) {
        super(apps, 'js');
        this.jsKeys = this.apps.map(e => Object.keys(e.js)).reduce((e, i) => e.concat(i), []);
    }

    /**
     * Main analytical function for processing
     * @param page
     * @param foundApps
     * @returns {Promise<*>}
     */
    async analyze(page, foundApps) {
        // grab all the keys from the dom
        let windowValues = {};
        try {
            windowValues = await page.evaluate(puppeteerJsEvalFunction, this.jsKeys);
        } catch (err) {
            console.log(err);
        }

        // do the magic with the dataset
        this.apps.forEach(app => {
            const patterns = app.js;
            Object.keys(patterns).forEach(key => {
                if (key in windowValues) {
                    const value = windowValues[key];
                    patterns[key].forEach(pattern => {
                        if (pattern && pattern.regex.test(value)) {
                            foundApps = this.addDetected(foundApps, app, pattern, 'js', value, key);
                        }
                    });
                }
            });
        });

        return foundApps;
    }
}

module.exports = JsAnalyzer;
