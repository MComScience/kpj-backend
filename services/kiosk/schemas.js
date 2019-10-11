"use strict"

const indexSchema = {
  response: {
    200: {
      type: "object",
      required: [],
      properties: {},
      additionalProperties: false
    }
  }
}

// สร้างรายการ
const createSchema = {
  body: {
    type: "object",
    properties: {
      kiosk_name: { type: "string" },
      kiosk_status: { type: "string" }
    },
    required: ["kiosk_name", "kiosk_status"]
  },
  response: {
    200: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      },
      additionalProperties: false
    }
  }
}

// แก้ไขรายการ
const updateSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "integer"
      }
    },
    additionalProperties: false
  },
  body: {
    type: "object",
    properties: {
      kiosk_name: { type: "string" },
      kiosk_status: { type: "string" }
    },
    required: ["kiosk_name", "kiosk_status"]
  },
  response: {
    200: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      },
      additionalProperties: false
    }
  }
}

const getKioskSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "integer"
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      properties: {},
      additionalProperties: false
    }
  }
}


const deleteSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "integer"
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: "object",
      required: ["message"],
      properties: {
        message: { type: "string" }
      },
      additionalProperties: false
    }
  }
}

module.exports = {
  indexSchema,
  createSchema,
  updateSchema,
  getKioskSchema,
  deleteSchema
}
