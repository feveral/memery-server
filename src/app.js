require('dotenv').config()

const fs = require('fs')
const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const koaStatic = require('koa-static')
const cors = require('@koa/cors')
const koaLogger = require('koa-logger')
const koaHistory = require('koa2-history-api-fallback')
const config = require('./config.js')
const app = new Koa()
const router = new Router()

require('./routes.js')(router)

app.use(cors())
app.use(koaLogger())
app.use(koaBody({parsedMethods:['POST', 'PUT', 'GET', 'DELETE']})) 
app.use(router.routes())
app.use(router.allowedMethods())
app.use(koaHistory())

app.use((ctx) => {
    ctx.type = 'html'
    ctx.body = fs.createReadStream('src/public/index.html')
})

app.listen(config.port, () => {
    console.log(`Server is listening on port ${config.port}.`)
    app.emit("app_started")
})

module.exports = app