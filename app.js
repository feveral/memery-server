const Koa = require('koa')
const Router = require('koa-router')
const koaBody = require('koa-body')
const koaStatic = require('koa-static')
const cors = require('@koa/cors');
const history = require('koa2-history-api-fallback')
const config = require('./config.js')

const app = new Koa()
const router = new Router()

require('./routes.js')(router)

app.use(cors())
app.use(koaBody())
app.use(router.routes())
app.use(router.allowedMethods())
app.use(history())

app.listen(config.port, () => console.log(`Server is listening on port ${config.port}.`))