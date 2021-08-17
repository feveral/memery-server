const app = require('../dist/app.js')

before((done) => {
    app.on('app_started', done())
})