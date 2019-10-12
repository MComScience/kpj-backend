"use strict"

const path = require("path")
const AutoLoad = require("fastify-autoload")
const fp = require("fastify-plugin")
const fastifyCors = require("fastify-cors")
const fastifyHelmet = require("fastify-helmet")
const fastifyAccepts = require("fastify-accepts")
const fastifyFormbody = require("fastify-formbody")
const fastifyMultipart = require("fastify-multipart")
const fastifySensible = require("fastify-sensible")
const fastifyRatelimit = require("fastify-rate-limit")
const fastifyRedis = require("fastify-redis")
const fastifyJwt = require("fastify-jwt")
const fastifyLeveldb = require("fastify-leveldb")
const fastifyAuth = require("fastify-auth")
const fastifySession = require("fastify-session")
const fastifyCookie = require("fastify-cookie")
const fastifyHttpProxy = require("fastify-http-proxy")
const fastifyStatic = require("fastify-static")

const config = require("./config")
const decorateFastifyInstance = require("./decorators/index")
const host = `${process.env.HOST}:${process.env.PORT}`
const jwtSign = Object.assign(config.jwt.sign, {
  audience: host,
  issuer: host
})
const jwtVerify = Object.assign(config.jwt.verify, {
  audience: host,
  issuer: host
})
const jwtConfig = Object.assign(config.jwt, {
  sign: jwtSign,
  verify: jwtVerify
})

async function connectToDatabases(fastify) {
  fastify
    // `mysql` makes this connection and store the database instance into `fastify.mysql`
    // See https://github.com/mysqljs/mysql
    .register(require("./decorators/db"), {
      client: "mysql",
      connection: {
        // connectionLimit: 100,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
      },
      decorate: "db"
    })
}

module.exports = function(fastify, opts, next) {
  // Place here your custom code!

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application

  fastify.register(fastifyStatic, {
    root: path.join(__dirname, "public")
    // prefix: '/public/', // optional: default '/'
  })

  fastify.register(fastifyCors, config.cors)
  fastify.register(fastifyHelmet)
  fastify
    .register(fastifyJwt, jwtConfig)
    .register(fastifyLeveldb, config.authdb)
    .register(fastifyAuth)
  fastify.register(fastifyHttpProxy, config.httpProxy)
  fastify.register(fastifyAccepts)
  fastify.register(fastifyFormbody)
  fastify.register(fastifyMultipart)
  fastify.register(fastifySensible)
  fastify.register(fastifyRatelimit, config.RateLimit)
  fastify.register(fastifyRedis, config.redis)
  fastify.register(fastifyCookie)
  fastify.register(fastifySession, {
    secret: process.env.SESSION_SECRET
  })
  fastify.register(fp(connectToDatabases))
  fastify.register(fp(decorateFastifyInstance))
  // .after(routes)

  // This loads all plugins defined in services
  // define your routes in one of these
  // fastify.register(require('./services/example'), { prefix: '/v1' })
  fastify.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    options: Object.assign({}, opts)
  })
  fastify
    .register(AutoLoad, {
      dir: path.join(__dirname, "services"),
      options: Object.assign({}, opts)
    })
    .addHook("preSerialization", function(_request, reply, payload, next) {
      if (!reply.res.payload) Object.assign(reply.res, { payload })
      next()
    })
    .addHook("onSend", (_request, reply, payload, next) => {
      if (payload && payload.filename) {
        next()
      } else if (payload) {
        payload = typeof payload === "string" ? JSON.parse(payload) : payload
        Object.assign(reply.res, { payload })
        next()
      } else {
        next()
      }
      // console.log(typeof payload)
    })
    .setReplySerializer(function(payload, statusCode) {
      // serialize the payload with a sync function
      if (statusCode >= 200 && statusCode <= 299) {
        return JSON.stringify({
          success: true,
          statusCode: statusCode,
          data: payload
        })
      }
      return JSON.stringify(payload)
    })

  // Make sure to call next when done
  next()
}
