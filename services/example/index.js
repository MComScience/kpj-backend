"use strict"

module.exports = async function(fastify, opts) {
  fastify.get('/app', function (req, reply) {
    reply.sendFile('index.html') // serving path.join(__dirname, 'public', 'myHtml.html') directly
  })

  fastify.get("/example", {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            msg: { type: 'string' },
            floors: { type: 'object' }
          }
        }
      }
    }
  }, exampleHandler)

  fastify.route({
    method: "POST",
    url: "/register",
    schema: {
      body: {
        type: "object",
        properties: {
          user: { type: "string" },
          password: { type: "string" }
        },
        required: ["user", "password"]
      }
    },
    handler: (req, reply) => {
      req.log.info("Creating new user")
      fastify.level.put(req.body.user, req.body.password, onPut)

      function onPut(err) {
        if (err) return reply.send(err)
        fastify.jwt.sign(req.body, onToken)
      }

      function onToken(err, token) {
        if (err) return reply.send(err)
        req.log.info("User created")
        reply.send({ token })
      }
    }
  })

  fastify.route({
    method: "GET",
    url: "/no-auth",
    handler: (req, reply) => {
      req.log.info("Auth free route")
      reply.send({ hello: "world" })
    }
  })

  fastify.route({
    method: "GET",
    url: "/auth",
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: (req, reply) => {
      req.log.info("Auth route")
      reply.send({ hello: "world" })
    }
  })

  fastify.route({
    method: "POST",
    url: "/auth-multiple",
    preHandler: fastify.auth([
      fastify.verifyJWTandLevel,
      fastify.verifyUserAndPassword
    ]),
    handler: (req, reply) => {
      req.log.info("Auth route")
      reply.send({ hello: "world" })
    }
  })
}

// Fastify checks the existance of those decorations before registring `example.js`
module.exports[Symbol.for("plugin-meta")] = {
  decorators: {
    fastify: ["authPreHandler", "userService", "jwt", "httpErrors"]
  }
}

async function exampleHandler(req, reply) {
  const { userService, httpErrors } = this
  try {
    const floors = await userService.getFloors()
    reply.send({ msg: "this is an example", floors: floors })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

// module.exports.autoPrefix = "/v1"

// If you prefer async/await, use the following
//
// module.exports = async function (fastify, opts) {
//   fastify.get('/example', async function (request, reply) {
//     return 'this is an example'
//   })
// }
