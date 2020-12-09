
class Analytics {
    constructor() {
        this.trendingCounter = 0
    }

    increaseTrending() {
        this.trendingCounter += 1
    }
}

module.exports = new Analytics()