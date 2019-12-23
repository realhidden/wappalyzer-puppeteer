class Application {
    constructor(name, props, detected) {
        this.confidence = {};
        this.confidenceTotal = 0;
        this.detected = Boolean(detected);
        this.excludes = [];
        this.name = name;
        this.props = props;
        this.version = '';
    }

    /**
     * Calculate confidence total
     */
    getConfidence() {
        let total = 0;

        Object.keys(this.confidence).forEach(id => {
            total += this.confidence[id];
        });

        this.confidenceTotal = Math.min(total, 100);

        return this.confidenceTotal;
    }
}

module.exports = Application;
