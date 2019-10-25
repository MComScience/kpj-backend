"use strict"

const fp = require("fastify-plugin")
const moment = require("moment")
moment.locale("th")

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(function(fastify, opts, next) {
  fastify
    .decorate("someSupport", function() {
      return "hugs"
    })
    .decorate("isEmpty", function(value, trim) {
      return (
        value === null ||
        value === undefined ||
        value.length === 0 ||
        (trim && value === "")
      )
    })
    .decorate("timestamp", function() {
      return Math.floor(moment().format("YYYY-MM-DD HH:mm:ss") / 1000)
    })
    .decorate("getDateNow", function() {
      return moment().format("YYYY-MM-DD HH:mm:ss")
    })
  next()
})

// If you prefer async/await, use the following
//
// module.exports = fp(async function (fastify, opts) {
//   fastify.decorate('someSupport', function () {
//     return 'hugs'
//   })
// })
