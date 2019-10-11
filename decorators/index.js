"use strict"

const UserService = require("../services/user/service")
const KioskService = require("../services/kiosk/service")
const NhsoService = require("../services/nhso/service")
const jwt = require("jsonwebtoken")

function verifyJWTandLevel(request, reply) {
  const jwt = this.jwt
  const level = this.level

  if (request.body && request.body.failureWithReply) {
    reply.code(401).send({ error: "Unauthorized" })
    return Promise.reject(new Error())
  }

  if (!request.req.headers.auth) {
    return Promise.reject(new Error("Missing token header"))
  }

  return new Promise(function(resolve, reject) {
    jwt.verify(request.req.headers.auth, function(err, decoded) {
      if (err) {
        return reject(err)
      }
      resolve(decoded)
    })
  })
    .then(function(decoded) {
      return level.get(decoded.user).then(function(password) {
        if (!password || password !== decoded.password) {
          throw new Error("Token not valid")
        }
      })
    })
    .catch(function(error) {
      request.log.error(error)
      throw new Error("Token not valid")
    })
}

function verifyJWT(request, reply) {
  if (request.body && request.body.failureWithReply) {
    reply.code(401).send({ error: "Unauthorized" })
    return Promise.reject(new Error())
  }
  if (!request.req.headers["x-token-header"]) {
    return Promise.reject(new Error("Unauthorized"))
  }
  return new Promise(function(resolve, reject) {
    jwt.verify(request.req.headers["x-token-header"], "secret-kiosk", function(
      err,
      decoded
    ) {
      if (err) {
        return reject(err)
      }
      resolve(decoded)
    })
  })
    .then(function(decoded) {
      return decoded
    })
    .catch(function(error) {
      request.log.error(error)
      throw new Error("Token not valid")
    })
  // try {
  //   await jwt.verify(request.req.headers['x-token-header'], 'secret-kiosk');
  // } catch(err) {
  //   reply.send(err)
  // }
}

function verifyUserAndPassword(request, reply, done) {
  const level = this.level

  level.get(request.body.user, onUser)

  function onUser(err, password) {
    if (err) {
      if (err.notFound) {
        return done(new Error("Password not valid"))
      }
      return done(err)
    }

    if (!password || password !== request.body.password) {
      return done(new Error("Password not valid"))
    }

    done()
  }
}

async function decorateFastifyInstance(fastify, opts, next) {
  const db = fastify.db
  const userService = new UserService(db)
  fastify.decorate("userService", userService)

  const kioskService = new KioskService(db)
  fastify.decorate("kioskService", kioskService)

  const nhsoService = new NhsoService(db)
  fastify.decorate("nhsoService", nhsoService)

  fastify.decorate("authPreHandler", async function auth(request, reply) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.send(err)
    }
  })
  fastify.decorate("verifyJWTandLevel", verifyJWTandLevel)
  fastify.decorate("verifyUserAndPassword", verifyUserAndPassword)
  fastify.decorate("authRightPreHandler", verifyJWT)
}

module.exports = decorateFastifyInstance
