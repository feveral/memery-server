require('dotenv').config()
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

chai.Assertion.addMethod('ISOString', function () {
    const date = new Date(this.__flags.object)
    if (! (date instanceof Date && !isNaN(date.getTime())) ) {
        throw Error(`ISO string ${this.__flags.object} is invalid`)
    }
});

module.exports = chai