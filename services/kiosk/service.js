"use strict"

class kioskService {
  constructor(db) {
    this.db = db
  }

  async insertKiosk(values) {
    const result = await this.db("tbl_kiosk").insert(values)
    return result
  }

  async updateKiosk(values) {
    const result = await this.db("tbl_kiosk")
      .where("kiosk_id", values.kiosk_id)
      .update(values)
    return result
  }

  async findOne(id) {
    const row = await this.db
      .select("tbl_kiosk.*")
      .from("tbl_kiosk")
      .where("kiosk_id", id)
      .limit(1)
    return row[0]
  }

  async findAll() {
    const kiosk = await this.db
      .select(
        "tbl_kiosk.*"
      )
      .from("tbl_kiosk")
      .where("tbl_kiosk.kiosk_status", 1)
    return kiosk
  }

  async findAllKiosk() {
    const kiosk = await this.db
      .select(
        "tbl_kiosk.*"
      )
      .from("tbl_kiosk")
    return kiosk
  }

  async deleteKiosk(id) {
    const result = await this.db("tbl_kiosk")
      .where("kiosk_id", id)
      .del()
    return result
  }
}

module.exports = kioskService
