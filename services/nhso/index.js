"use strict"

const Joi = require("@hapi/joi")
const schemas = require("./schemas")

module.exports = async function(fastify, opts) {
  fastify.route({
    method: "GET",
    url: "/index",
    schema: schemas.indexSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: indexHandler
  })

  // สร้าง token
  fastify.route({
    method: "PUT",
    url: "/create",
    schema: schemas.createSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: createHandler
  })

  fastify.route({
    method: "DELETE",
    url: "/delete/:id",
    schema: schemas.deleteSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: deleteHandler
  })
}

module.exports[Symbol.for("plugin-meta")] = {
  decorators: {
    fastify: ["authPreHandler", "nhsoService", "httpErrors", "timestamp"]
  }
}

async function indexHandler(req, reply) {
  const { httpErrors } = this
  try {
    const rows = await this.nhsoService.findAll()
    if (!rows) {
      reply.send([])
    } else {
      reply.send(rows)
    }
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

async function deleteHandler(req, reply) {
  const { httpErrors } = this
  try {
    await this.nhsoService.deleteNhso(req.params.id)
    reply.send({ message: "ลบรายการแล้ว!" })
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

async function createHandler(req, reply) {
  const { httpErrors } = this
  const { token_cid, token_key } = req.body
  const user = req.user.data

  const schema = Joi.object({
    token_cid: Joi.string().required(),
    token_key: Joi.string().required()
  })
  try {
    let params = await schema.validateAsync({
      token_cid: token_cid,
      token_key: token_key
    })
    params = await Object.assign(params, {
      created_at: this.getDateNow(),
      updated_at: this.getDateNow(),
      created_by: user.id,
      updated_by: user.id
    })
    await this.nhsoService.insertNhso(params)
    reply.code(201).send({ message: "บันทึกรายการสำเร็จ" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

module.exports.autoPrefix = "/v1/nhso"
