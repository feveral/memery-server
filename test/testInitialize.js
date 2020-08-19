const app = require('../app.js')

before((done) => {
    app.on('app_started', done())
})