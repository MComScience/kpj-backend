"use strict"

const registerSchema = {
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      username: { type: "string" },
      email: { type: "string" },
      password: { type: "string" }
    },
    required: ["name", "username", "email", "password"]
  },
  response: {
    200: {
      type: "object",
      required: [],
      properties: {
        message: { type: "string" },
        user: { type: "object" }
      },
      additionalProperties: false
    }
  }
}

const signInSchema = {
  body: {
    type: "object",
    properties: {
      username: { type: "string" },
      password: { type: "string" }
    },
    required: ["username", "password"]
  },
  response: {
    200: {
      type: "object",
      required: [],
      properties: {
        token: { type: "string" },
        user: { type: "object" }
      },
      additionalProperties: false
    }
  }
}

// บล็อค
const blockUserSchema = {
  params: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
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

// ลบผู้ใช้งาน
const deleteUserSchema = {
  params: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
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

// ข้อมูลส่วนตัว
const getProfileSchema = {
  params: {
    type: "object",
    required: ["userId"],
    properties: {
      userId: {
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

// สร้างรายการ nhso token
const nhsoSchema = {
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

// ลบรายการ nhso token
const deleteNhsoSchema = {
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


// ข้อมูลบัญชี
const updateUserAccountSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'integer'
      }
    }
  },
  body: {
    type: 'object',
    required: ['email', 'username', 'role', 'id'],
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      username: { type: 'string' },
      password: { type: 'string' },
      role: { type: 'string' }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string' }
      },
      additionalProperties: false
    }
  }
}

// การตั้งค่าโปรไฟล์
const updateProfileSchema = {
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: {
        type: 'integer'
      }
    }
  },
  body: {
    type: 'object',
    required: ['user_id'],
    properties: {
      user_id: {
        type: 'number'
      },
      name: {
        type: 'string'
      },
      public_email: {
        type: 'string'
      },
      gravatar_email: {
        type: 'string'
      },
      gravatar_id: {
        type: 'string'
      },
      location: {
        type: 'string'
      },
      website: {
        type: 'string'
      },
      bio: {
        type: 'string'
      },
      timezone: {
        type: 'string'
      }
    },
    additionalProperties: false
  },
  response: {
    200: {
      type: 'object',
      required: [],
      properties: {},
      additionalProperties: false
    }
  }
}

module.exports = {
  registerSchema,
  signInSchema,
  blockUserSchema,
  deleteUserSchema,
  getProfileSchema,
  nhsoSchema,
  deleteNhsoSchema,
  updateUserAccountSchema,
  updateProfileSchema
}
