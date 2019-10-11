"use strict"

class nhsoService {
  constructor(db) {
    this.db = db
  }

  async findAll() {
    return await this.db.select("tbl_nhso_token.*").from("tbl_nhso_token").orderBy('updated_at', 'desc')
  }

  async deleteNhso(id) {
    const result = await this.db("tbl_nhso_token")
      .where("id", id)
      .del()
    return result
  }

  async insertNhso(params) {
    const result = await this.db("tbl_nhso_token").insert(params)
    return result
  }
}

module.exports = nhsoService
