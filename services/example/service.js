"use strict"

class UserService {
  constructor(db) {
    this.db = db
  }

  async getFloors() {
    const rows = await this.db
      .select('tbl_floor.*')
      .from('tbl_floor')
    return rows
  }
}

module.exports = UserService
