
class Analytics {
    constructor() {
        this.trendingCounter = 0
        this.dateString = new Date().toLocaleDateString('zh-TW', {timeZone: 'Asia/Taipei'})
    }

    increaseTrending() {
        const newDateString = new Date().toLocaleDateString('zh-TW', {timeZone: 'Asia/Taipei'})
        if (this.dateString !== newDateString) {
            this.dateString = newDateString
            this.trendingCounter = 0
        }
        this.trendingCounter += 1
    }
}

module.exports = new Analytics()