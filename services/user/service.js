"use strict"

const bcrypt = require("bcryptjs")
const randomstring = require("randomstring")
const _ = require("lodash")

class UserService {
  constructor(db) {
    this.db = db
  }

  async findByUsernameOrEmail(params) {
    const user = await this.db
      .select("user.*", "profile.*")
      .from("user")
      .innerJoin("profile", "profile.user_id", "user.id")
      .where("user.username", params.username)
      .orWhere("user.email", params.email)
    return user[0]
  }

  async insertUser(params) {
    const _this = this
    const passwordHash = await bcrypt.hashSync(params.password, 12)
    const authKey = randomstring.generate()
    const user = {
      id: null,
      username: params.username,
      email: params.email,
      password_hash: passwordHash,
      auth_key: authKey,
      confirmed_at: params.timestamp,
      unconfirmed_email: null,
      blocked_at: null,
      registration_ip: params.ip,
      created_at: params.timestamp,
      updated_at: params.timestamp,
      flags: 0,
      last_login_at: null,
      access_token_expired_at: null,
      avatar: null,
      role: params.role ? params.role : 10 // default role user
    }
    const profile = {
      user_id: null,
      name: params.name,
      public_email: null,
      gravatar_email: null,
      gravatar_id: null,
      location: null,
      website: null,
      bio: null,
      timezone: "Asia/Bangkok"
    }
    return new Promise((resolve, reject) => {
      _this.db
        .transaction(async function(trx) {
          try {
            const userId = await trx.insert(user).into("user")
            const updatedProfile = await Object.assign(profile, {
              user_id: userId
            })
            await trx.insert(updatedProfile).into("profile")
            return userId
          } catch (error) {
            trx.rollback()
            reject(error)
          }
        })
        .then(userId => {
          resolve(userId)
        })
        .catch(error => reject(error))
    })
  }

  async findById(id) {
    const profile = await this.db
      .select(
        "user.id",
        "user.username",
        "user.email",
        "user.registration_ip",
        "user.flags",
        "user.avatar",
        "user.role",
        "user.created_at",
        "user.updated_at",
        "profile.user_id",
        "profile.name",
        "profile.public_email",
        "profile.gravatar_email",
        "profile.gravatar_id",
        "profile.location",
        "profile.website",
        "profile.bio",
        "profile.timezone"
      )
      .from("user")
      .innerJoin("profile", "profile.user_id", "user.id")
      .where("user.id", id)
    return profile[0]
  }

  async updateLastLogin(userId, timestamp) {
    await this.db("user")
      .where("id", userId)
      .update({ last_login_at: timestamp })
  }

  async blockUser(userId, timestamp) {
    const user = await this.db
      .select("user.*")
      .from("user")
      .where("user.id", userId)

    if (this.getIsBlocked(user[0])) {
      await this.db("user")
        .where("id", userId)
        .update({
          blocked_at: null
        })
      return false
    } else {
      await this.db("user")
        .where("id", userId)
        .update({
          blocked_at: timestamp
        })
      return true
    }
  }

  async deleteUser(userId) {
    const result = await this.db("user")
      .where("id", userId)
      .del()
    await this.db("profile")
      .where("user_id", userId)
      .del()
    return result
  }

  async findNhsoToken() {
    const row = await this.db
      .select("tbl_nhso_token.*")
      .from("tbl_nhso_token")
      .orderBy("tbl_nhso_token.created_at", "desc")
      .limit(1)
    return row[0]
  }

  async insertNhso(params) {
    const result = await this.db("tbl_nhso_token").insert(params)
    return result
  }

  async deleteNhso(id) {
    const result = await this.db("tbl_nhso_token")
      .where("id", id)
      .del()
    return result
  }

  async findAll() {
    const profile = await this.db
      .select(
        "user.id",
        "user.username",
        "user.email",
        "user.registration_ip",
        "user.flags",
        "user.avatar",
        "user.role",
        "user.created_at",
        "user.updated_at",
        "profile.user_id",
        "profile.name",
        "profile.public_email",
        "profile.gravatar_email",
        "profile.gravatar_id",
        "profile.location",
        "profile.website",
        "profile.bio",
        "profile.timezone"
      )
      .from("user")
      .innerJoin("profile", "profile.user_id", "user.id")
    return profile
  }

  async updateUserAccount(params, isNewPassword, timestamp) {
    if (isNewPassword) {
      const passwordHash = await bcrypt.hashSync(params.password, 12)
      const updated = await this.db('user')
        .where('id', params.id)
        .update({
          updated_at: timestamp,
          email: params.email,
          username: params.username,
          password_hash: passwordHash,
          role: params.role
        })
      return updated
    } else {
      const updated = await this.db('user')
        .where('id', params.id)
        .update({
          updated_at: timestamp,
          email: params.email,
          username: params.username,
          role: params.role
        })
      return updated
    }
  }

  async updateProfile(params) {
    const result = await this.db('profile')
      .where('user_id', params.user_id)
      .update(params)
    return result
  }

  getIsBlocked(user) {
    return user.blocked_at !== null
  }

  async comparePassword(password, hash) {
    const isMatch = await new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, function(err, res) {
        if (err && !res) reject(err || res)
        resolve(res)
      })
    })
    return isMatch
  }

  fields(user) {
    return _.pick(user, [
      "id",
      "username",
      "email",
      "registration_ip",
      "avatar",
      "role",
      "name",
      "public_email",
      "gravatar_email",
      "gravatar_id",
      "location",
      "website",
      "bio",
      "timezone"
    ])
  }
}

module.exports = UserService
