const axios = require('axios')
const chai = require('../libs/chaiInitialize.js')
const config = require('../../dist/config.js')
const fs = require('fs')
const expect = chai.expect
const FormData = require('form-data')
const User = require('../../dist/models/user.js')
const { ObjectID } = require('mongodb')


describe('Model: User', () => {

    before(async () => {

    })

    // TODO: not finished yet
    describe('User.expandUserInfo()', () => {

        it('should success - case1', async () => {
            const objs = [{user_id: new ObjectID()}, {user_id: new ObjectID()}]
            const users = [
                new User("customid0", "username0", "ava_url0", "regular", "email0", "google"),
                new User("customid1", "username1", "ava_url1", "regular", "email1", "google"),
                new User("customid2", "username2", "ava_url2", "regular", "email2", "google")
            ]
            users[0]._id = objs[0].user_id
            users[1]._id = objs[1].user_id
            users[2]._id = new ObjectID()
    
            const newobjs = User.expandUserInfo(objs, users)
            expect(newobjs[0].user_name).to.equal("username0")
            expect(newobjs[1].user_name).to.equal("username1")
            expect(newobjs[0].user_custom_id).to.equal("customid0")
            expect(newobjs[1].user_custom_id).to.equal("customid1")
            expect(newobjs[0].user_avatar_url).to.equal("ava_url0")
            expect(newobjs[1].user_avatar_url).to.equal("ava_url1")
        })

        it('should success - case2', async () => {
            const objs = [{user_id: new ObjectID()}, {user_id: new ObjectID()}]
            const users = [
                new User("customid1", "username1", "ava_url1", "regular", "email1", "google"),
                new User("customid0", "username0", "ava_url0", "regular", "email0", "google"),
                new User("customid2", "username2", "ava_url2", "regular", "email2", "google"),
            ]
            users[0]._id = objs[1].user_id
            users[1]._id = new ObjectID()
            users[2]._id = objs[0].user_id
    
            const newobjs = User.expandUserInfo(objs, users)
            expect(newobjs[0].user_name).to.equal("username2")
            expect(newobjs[1].user_name).to.equal("username1")
            expect(newobjs[0].user_custom_id).to.equal("customid2")
            expect(newobjs[1].user_custom_id).to.equal("customid1")
            expect(newobjs[0].user_avatar_url).to.equal("ava_url2")
            expect(newobjs[1].user_avatar_url).to.equal("ava_url1")
        })
    })
})
