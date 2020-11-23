const axios = require('axios')
const config = require('../config.js')

class SlackNotify {

    constructor() {}

    static async sendUserNumber(userNumber) {
        if (process.env.NODE_ENV === 'production') {
            await axios.default.post(config.slackWebHookUrl, 
                {
                    "attachments": [
                        {
                            "fallback": `Welcome our ${userNumber}th user !!!`,
                            "color": "#36a64f",
                            "author_link": "http://flickr.com/bobby/",
                            "author_icon": "http://flickr.com/icons/bobby.jpg",
                            "title": "Memery User Stat",
                            // "title_link": "https://api.slack.com/",
                            "text": `Welcome our \`${userNumber}th\` user !!!`,
                            // "image_url": "http://my-website.com/path/to/image.jpg",
                            // "thumb_url": "http://example.com/path/to/thumb.png",
                            "footer": "Memery App",
                            // "footer_icon": "https:/p/platform.slack-edge.com/img/default_application_icon.png",
                            "ts": Date.now()
                        }
                    ]
                }
            )
        }
    }


}


module.exports = SlackNotify