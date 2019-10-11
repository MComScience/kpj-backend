"use strict"

const Joi = require("@hapi/joi")
const schemas = require("./schemas")
const jwt = require("jsonwebtoken")
const moment = require("moment")
moment.locale("th")

module.exports = async function(fastify, opts) {
  fastify.route({
    method: "GET",
    url: "/list",
    schema: schemas.indexSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: listHandler
  })

  fastify.route({
    method: "GET",
    url: "/index",
    schema: schemas.indexSchema,
    // preHandler: fastify.auth([fastify.authPreHandler]),
    handler: indexHandler
  })

  fastify.route({
    method: "PUT",
    url: "/create",
    schema: schemas.createSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: createHandler
  })

  fastify.route({
    method: "POST",
    url: "/update/:id",
    schema: schemas.updateSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: updateHandler
  })

  fastify.route({
    method: "DELETE",
    url: "/delete/:id",
    schema: schemas.deleteSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: deleteHandler
  })

  fastify.route({
    method: "GET",
    url: "/:id",
    schema: schemas.getKioskSchema,
    // preHandler: fastify.auth([fastify.authPreHandler]),
    handler: getKioskHandler
  })
}

module.exports[Symbol.for("plugin-meta")] = {
  decorators: {
    fastify: [
      "authPreHandler",
      "kioskService",
      "jwt",
      "httpErrors",
      "timestamp",
      "redis"
    ]
  }
}

async function indexHandler(req, reply) {
  const { httpErrors } = this
  try {
    const kiosks = await this.kioskService.findAll()
    if (!kiosks) {
      reply.send([])
    } else {
      reply.send(kiosks)
    }
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

async function createHandler(req, reply) {
  const { httpErrors } = this
  const { kiosk_name, kiosk_status } = req.body
  const user = req.user.data
  const schema = Joi.object({
    kiosk_name: Joi.string().required(),
    kiosk_status: Joi.string().required()
  })
  try {
    let values = await schema.validateAsync({
      kiosk_name: kiosk_name,
      kiosk_status: kiosk_status
    })
    values = await Object.assign(values, {
      created_at: this.getDateNow(),
      updated_at: this.getDateNow(),
      created_by: user.id,
      updated_by: user.id
    })
    await this.kioskService.insertKiosk(values)
    reply.code(201).send({ message: "บันทึกรายการสำเร็จ" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function updateHandler(req, reply) {
  const { httpErrors } = this
  const { kiosk_name, kiosk_status } = req.body
  const user = req.user.data
  const schema = Joi.object({
    kiosk_name: Joi.string().required(),
    kiosk_status: Joi.string().required(),
    kiosk_id: Joi.number().required()
  })
  try {
    let values = await schema.validateAsync({
      kiosk_name: kiosk_name,
      kiosk_status: kiosk_status,
      kiosk_id: req.params.id
    })
    values = await Object.assign(values, {
      kiosk_id: req.params.id,
      updated_at: this.getDateNow(),
      updated_by: user.id
    })
    await this.kioskService.updateKiosk(values)
    reply.code(200).send({ message: "บันทึกรายการสำเร็จ" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function getKioskHandler(req, reply) {
  const { httpErrors, redis } = this
  const SECRET = "secret-kiosk"
  try {
    const kiosk = await this.kioskService.findOne(req.params.id)

    if (!kiosk) {
      return httpErrors.notFound("ไม่พบข้อมูล")
    }
    // get token in redis
    const kioskToken = await redis.get(`KIOSK_${kiosk.kiosk_id}`)
    let expired = false
    if (kioskToken) {
      const jsonToken = JSON.parse(kioskToken)
      await jwt.verify(jsonToken.token, SECRET, (err, decoded) => {
        if (err) expired = true
      })
      if (!expired) {
        return reply.send(Object.assign(kiosk, { token: jsonToken.token }))
      }
    }
    const date1 = new Date(moment().format("DD/MM/YYYY HH:mm:ss")) // current time
    const date2 = new Date(moment().format("DD/MM/YYYY 23:59:59")) // end time of the day
    const hours = Math.abs(date1 - date2) / 36e5
    const expiresIn = Math.floor(Date.now() / 1000) + 60 * 60 * hours //
    const signData = {
      exp: expiresIn,
      data: kiosk
    }
    const token = await jwt.sign(signData, SECRET)
    redis.set(`KIOSK_${kiosk.kiosk_id}`, JSON.stringify({ token: token }))
    reply.send(Object.assign(kiosk, { token: token }))
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function listHandler(req, reply) {
  const { httpErrors } = this
  try {
    const kiosks = await this.kioskService.findAllKiosk()
    if (!kiosks) {
      reply.send([])
    } else {
      reply.send(kiosks)
    }
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

async function deleteHandler(req, reply) {
  const { httpErrors } = this
  try {
    await this.kioskService.deleteKiosk(req.params.id)
    reply.send({ message: "ลบรายการแล้ว!" })
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

module.exports.autoPrefix = "/v1/kiosk"
