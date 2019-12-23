const {
    loadPatterns,
    resolveExcludes,
    resolveImplies,
    parsePatterns,
    displayApps,
    preParsePatterns
} = require('./modules/patterns');

const CookieAnalyzer = require('./modules/cookies');
const MetaAnalyzer = require('./modules/meta');
const HtmlAnalyzer = require('./modules/html');
const HeadersAnalyzer = require('./modules/headers');
const ScriptAnalyzer = require('./modules/script');
const JsAnalyzer = require('./modules/js');

class AppAnalytics {
    async loadAppsjson(appjson) {
        //console.time('load');
        const patternRaw = await loadPatterns(appjson);
        this.categories = patternRaw.categories;
        this.apps = preParsePatterns(patternRaw.apps);

        this.cookieAnalyzer = new CookieAnalyzer(this.apps);
        this.metaAnalyzer = new MetaAnalyzer(this.apps);
        this.htmlAnalyzer = new HtmlAnalyzer(this.apps);
        this.headersAnalyzer = new HeadersAnalyzer(this.apps);
        this.scriptAnalyzer = new ScriptAnalyzer(this.apps);
        this.jsAnalyzer = new JsAnalyzer(this.apps);

        this.langMetaRegex = new RegExp('<html[^>]*[: ]lang="([a-z]{2}((-|_)[A-Z]{2})?)"', 'i');
        //console.timeEnd('load');
    }

    async runAnalytics(page, html, scripts, cookies, headers) {
        let foundApps = {};
        //console.time('processing');
        /**
         * Original wappalyzer flow
         * - html, meta, scripts, cookies, headers, js
         * - excludes,implies
         * - displayapps
         */
        foundApps = await this.htmlAnalyzer.analyzeHtml(html, foundApps);
        foundApps = await this.metaAnalyzer.analyzeHtml(html, foundApps);
        foundApps = await this.scriptAnalyzer.analyzeScripts(scripts, foundApps);
        foundApps = await this.cookieAnalyzer.analyze(page, foundApps);
        foundApps = await this.headersAnalyzer.analyzeHeaders(headers, foundApps);
        foundApps = await this.jsAnalyzer.analyze(page, foundApps);

        foundApps = await resolveExcludes(foundApps, this.apps);
        foundApps = await resolveImplies(foundApps, this.apps);

        // some meta
        const meta = {};
        let matches = html.match(this.langMetaRegex);
        meta.language = matches && matches.length ? matches[1] : null;

        const result = displayApps('url', foundApps, this.apps, this.categories, meta);
        //console.timeEnd('processing');
        return result;
    }
}

module.exports = AppAnalytics;
