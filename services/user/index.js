"use strict"

const Joi = require("@hapi/joi")
const schemas = require("./schemas")
const { isEmpty } = require("../../utils/index")

module.exports = async function(fastify, opts) {
  // routes
  // ข้อมูลส่วนตัว
  fastify.route({
    method: "GET",
    url: "/index",
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: indexHandler
  })
  // ลงทะเบียน
  fastify.route({
    method: "POST",
    url: "/register",
    schema: schemas.registerSchema,
    handler: registerHandler
  })
  // เข้าสู่ระบบ
  fastify.route({
    method: "POST",
    url: "/sign-in",
    schema: schemas.signInSchema,
    handler: signinHandler
  })
  // ข้อมูลส่วนตัว
  fastify.route({
    method: "GET",
    url: "/me",
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: meHandler
  })
  // สร้าง token
  fastify.route({
    method: "PUT",
    url: "/create-nhso-token",
    schema: schemas.nhsoSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: createNhsoHandler
  })
  // ตรวจสอบสิทธิ
  fastify.route({
    method: "GET",
    url: "/right/:cid",
    preHandler: fastify.auth([
      // fastify.authPreHandler,
      fastify.authRightPreHandler
    ]),
    handler: rightHandler
  })
  // บล็อคผู้ใช้งาน
  fastify.route({
    method: "PUT",
    url: "/block/:userId",
    schema: schemas.blockUserSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: blockHandler
  })
  // ลบผู้ใช้งาน
  fastify.route({
    method: "DELETE",
    url: "/delete/:userId",
    schema: schemas.deleteUserSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: deleteHandler
  })
  // ลบ token
  fastify.route({
    method: "DELETE",
    url: "/delete-nhso-token/:id",
    schema: schemas.deleteNhsoSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: deleteNhsoHandler
  })
  // update account
  fastify.route({
    method: "POST",
    url: "/update-account/:userId",
    schema: schemas.updateUserAccountSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: updateUserAccountHandler
  })
  // แก้ไขข้อมูลส่วนตัว
  fastify.route({
    method: "POST",
    url: "/update-profile/:userId",
    schema: schemas.updateProfileSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: updateProfileHandler
  })
  //
  fastify.route({
    method: "GET",
    url: "/:userId",
    schema: schemas.getProfileSchema,
    preHandler: fastify.auth([fastify.authPreHandler]),
    handler: userHandler
  })
}

// Fastify checks the existance of those decorations before registring.
module.exports[Symbol.for("plugin-meta")] = {
  decorators: {
    fastify: [
      "authPreHandler",
      "userService",
      "jwt",
      "httpErrors",
      "timestamp",
      "soapClient"
    ]
  }
}

// ลงทะเบียน
async function registerHandler(req, reply) {
  const { httpErrors } = this
  const { name, email, username, password } = req.body
  const schema = Joi.object({
    name: Joi.string().required(),
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required(),
    password: Joi.string()
      .min(6)
      .pattern(/^[a-zA-Z0-9]{3,30}$/)
      .required(),
    email: Joi.string()
      .email()
      .required()
  })
  try {
    const params = await schema.validateAsync({
      email: email,
      username: username,
      password: password,
      name: name
    })
    const user = await this.userService.findByUsernameOrEmail(params)
    if (!this.isEmpty(user))
      return httpErrors.badRequest("ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว.")
    const userId = await this.userService.insertUser(
      Object.assign(
        {
          ip: req.ip,
          timestamp: this.timestamp()
        },
        params
      )
    )
    const profile = await this.userService.findById(userId)
    reply.send({ message: "ลงทะเบียนผู้ใช้งานสำเร็จ!", user: profile })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function signinHandler(req, reply) {
  const { httpErrors, redis, jwt } = this
  const { username, password } = req.body
  const TOKEN_KEY = "token_key"

  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string()
      .min(6)
      .required()
  })
  try {
    const params = await schema.validateAsync({
      username: username,
      password: password
    })
    const user = await this.userService.findByUsernameOrEmail({
      username: params.username,
      email: params.username
    })
    if (this.isEmpty(user))
      return httpErrors.badRequest("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง.")
    if (this.userService.getIsBlocked(user))
      return httpErrors.badRequest("บัญชีของคุณถูกบล็อค.")
    const isMatch = await this.userService.comparePassword(
      password,
      user.password_hash
    )
    if (!isMatch)
      return httpErrors.badRequest("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง.")

    // sign data
    const payload = {
      data: this.userService.fields(user),
      jti: user.id
    }
    // get token in redis
    const userToken = await redis.get(`${TOKEN_KEY}_${user.id}`)
    let expired = false
    if (userToken) {
      const dataToken = JSON.parse(userToken)
      await jwt.verify(dataToken.token, (err, decoded) => {
        if (err) expired = true
      })
      if (!expired) {
        await this.userService.updateLastLogin(user.id, this.timestamp())
        return reply.send({
          token: dataToken.token,
          user: this.userService.fields(user)
        })
      }
    }
    const token = await jwt.sign(payload)
    await this.userService.updateLastLogin(user.id, this.timestamp())
    redis.set(
      `${TOKEN_KEY}_${user.id}`,
      JSON.stringify({ userId: user.id, token: token })
    )
    reply.send({ token: token, user: this.userService.fields(user) })
  } catch (error) {
    return httpErrors.badRequest(error)
  }
}

async function meHandler(req, reply) {
  const { httpErrors } = this
  const userId = req.user.data.id
  try {
    const profile = await this.userService.findById(userId)
    reply.send(profile)
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function blockHandler(req, reply) {
  const { httpErrors } = this
  const userId = req.params.userId
  const user = req.user.data
  try {
    if (user.role !== 20)
      return httpErrors.badRequest("คุณไม่ได้รับอนุญาตให้ดำเนินการนี้")
    if (user.id === userId)
      return httpErrors.badRequest("คุณไม่สามารถบล๊อคบัญชีตัวเองได้")
    const isBlock = await this.userService.blockUser(userId, this.timestamp())
    if (!isBlock) {
      reply.send({ message: "ยกเลิกการบล็อคเข้าใช้งานเรียบร้อยแล้ว" })
    } else {
      reply.send({ message: "บล็อคไม่ให้เข้าใช้งานเรียบร้อยแล้ว" })
    }
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function deleteHandler(req, reply) {
  const { httpErrors } = this
  const userId = req.params.userId
  const user = req.user.data
  try {
    if (user.role !== 20)
      return httpErrors.badRequest("คุณไม่ได้รับอนุญาตให้ดำเนินการนี้")
    if (user.id === userId)
      return httpErrors.badRequest("คุณไม่สามารถยกเลิกบัญชีตัวเองได้")
    await this.userService.deleteUser(userId)
    reply.send({ message: "ผู้ใช้ถูกลบแล้ว" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function userHandler(req, reply) {
  const { httpErrors } = this
  const userId = req.params.userId
  try {
    const user = await this.userService.findById(userId)
    if (user) {
      reply.send(user)
    } else {
      return httpErrors.notFound("ไม่พบข้อมูลผู้ใช้งาน")
    }
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function rightHandler(req, reply) {
  const { httpErrors, soapClient } = this
  let args = {
    user_person_id: "",
    smctoken: "",
    person_id: req.params.cid // รหัส ปชช ผู้ป่วย
  }
  try {
    const nhsoToken = await this.userService.findNhsoToken()
    if (this.isEmpty(nhsoToken)) return httpErrors.notFound("Token not found.")

    // map data
    args = Object.assign(args, {
      user_person_id: nhsoToken.token_cid,
      smctoken: nhsoToken.token_key
    })
    // request api
    const res = await soapClient.searchCurrentByPIDAsync(args)
    if (!res.length) return httpErrors.notFound("Response failed..")

    const data = res[0].return // right data
    // console.log(data)
    let error = "" // error message
    if (data.ws_status === "NHSO-00003") {
      error = data.ws_status_desc ? data.ws_status_desc : "Token expire."
    } else if (this.isEmpty(data.fname)) {
      error = "Not found in NHSO."
    } else if (
      this.isEmpty(data.maininscl) ||
      this.isEmpty(data.maininscl_name)
    ) {
      error = "ไม่พบข้อมูลสิทธิการรักษา"
    }
    // check error
    if (!this.isEmpty(error)) return httpErrors.notFound(error)
    // success
    reply.send(data)
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function createNhsoHandler(req, reply) {
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
    await this.userService.insertNhso(params)
    reply.code(201).send({ message: "บันทึกรายการสำเร็จ" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function deleteNhsoHandler(req, reply) {
  const { httpErrors } = this
  try {
    await this.userService.deleteNhso(req.params.id)
    reply.send({ message: "ลบรายการสำเร็จ" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function indexHandler(req, reply) {
  const { httpErrors } = this
  try {
    const users = await this.userService.findAll()
    reply.send(users)
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function updateUserAccountHandler(req, reply) {
  const { httpErrors } = this
  const params = req.body
  const isNewPassword = !this.isEmpty(params.password)
  try {
    if (isNewPassword) {
      const user = await this.userService.findByUsernameOrEmail({
        username: params.username,
        email: params.username
      })
      if (!this.isEmpty(user))
        return httpErrors.badRequest("ชื่อผู้ใช้หรืออีเมล์นี้มีอยู่ในระบบแล้ว.")
    }
    const timestamp = this.timestamp()
    await this.userService.updateUserAccount(params, isNewPassword, timestamp)
    reply.code(200).send({ message: "การตั้งค่าบัญชีถูกบันทึกแล้ว" })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

async function updateProfileHandler(req, reply) {
  const { httpErrors } = this
  const params = req.body
  try {
    const schema = Joi.object({
      user_id: Joi.number().required()
    })
    const newParams = await schema.validateAsync({
      user_id: params.user_id
    })
    await this.userService.updateProfile(Object.assign(newParams, params))
    // success
    reply.code(200).send({ message: 'การตั้งค่าโปรไฟล์ถูกบันทึกเรียบร้อย' })
  } catch (error) {
    return httpErrors.internalServerError(error)
  }
}

module.exports.autoPrefix = "/v1/user"
