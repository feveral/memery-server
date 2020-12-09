const config = require('../config.js')
const analytics = require('../libs/analytics.js')

module.exports = {

    async slackMemeTrending (ctx) {
        const {token} = ctx.request.body
        if (token !== config.slackAnalyticsToken) {
            ctx.response.status = 401
            ctx.body = {message: 'slack token is not valid'}
            return
        }
        ctx.body = {
            "attachments": [
                {
                    "fallback": `Memery Analytics`,
                    "color": "#36a64f",
                    "author_link": "http://flickr.com/bobby/",
                    "author_icon": "http://flickr.com/icons/bobby.jpg",
                    "title": "Memery Analytics",
                    "text": `Trending api in 24hours: \`${analytics.trendingCounter}\``,
                    "footer": "Memery App",
                    "ts": Date.now()
                }
            ]
        }
    }

}