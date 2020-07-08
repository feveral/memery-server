module.exports = (router) => {


    router.get('/api/test', (ctx)=> ctx.body = {status: true})

}