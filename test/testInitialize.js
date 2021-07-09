const app = require('../src/app.js')

before((done) => {
    app.on('app_started', done())
})