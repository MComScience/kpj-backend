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

// สร้างรายการ nhso token
const createSchema = {
  body: {
    type: "object",
    properties: {
      token_cid: { type: "string" },
      token_key: { type: "string" }
    },
    required: ["token_cid", "token_key"]
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
  deleteSchema,
  createSchema
}
