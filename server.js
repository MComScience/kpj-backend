"use strict"

// Read the .env file.
require("dotenv").config()

// Require the framework
const Fastify = require("fastify")

const moment = require("moment")
moment.locale("th")

// rotating
const rfs = require("rotating-file-stream")
const stream = rfs("./logs/app.log", {
  size: "50M", // rotate every 10 MegaBytes written
  interval: "1M", // rotate daily
  compress: true // compress rotated files
})
stream.on("rotated", function(filename) {
  // rotation job completed with success producing given filename
  console.log("rotated", filename)
})

// config
const fastifyConfig = {
  logger: {
    level: "info",
    file: "./logs/app.log",
    serializers: {
      res(res) {
        // the default
        return {
          statusCode: res.statusCode,
          payload: res.payload
        }
      },
      req(req) {
        return {
          method: req.method,
          url: req.url,
          path: req.path,
          parameters: req.parameters,
          body: req.body,
          headers: req.headers
        }
      }
    },
    timestamp: () => {
      return `,"time":"${moment().format("YYYY-MM-DD HH:mm:ss")}"`
    }
  },
  pluginTimeout: 10000
}

// Instantiate Fastify with some config
const app = Fastify(fastifyConfig)
const io = require("socket.io")(app.server)

// socket io
const EVENTS = {
  CARD_INSERTED: "CARD_INSERTED",
  READING_START: "READING_START",
  READING_COMPLETE: "READING_COMPLETE",
  READING_FAIL: "READING_FAIL",
  CARD_REMOVED: "CARD_REMOVED",
  DEVICE_DISCONNECTED: "DEVICE_DISCONNECTED"
}
io.on("connection", function(socket) {
  // console.log("user connected")
  socket.on("message", res => {
    console.log(res)
    socket.broadcast.emit("message", res.data)
  })
  // เสียบบัตร
  socket.on(EVENTS.CARD_INSERTED, res => {
    socket.broadcast.emit(EVENTS.CARD_INSERTED, res)
  })
  // เริมอ่านบัตร
  socket.on(EVENTS.READING_START, res => {
    socket.broadcast.emit(EVENTS.READING_START, res)
  })
  // อ่านบัตรสำเร็จ
  socket.on(EVENTS.READING_COMPLETE, res => {
    socket.broadcast.emit(EVENTS.READING_COMPLETE, res)
  })
  // เกิดข้อผิดพลาดในการอ่านบัตร
  socket.on(EVENTS.READING_FAIL, res => {
    socket.broadcast.emit(EVENTS.READING_FAIL, res)
  })
  // ถอดบัตร
  socket.on(EVENTS.CARD_REMOVED, res => {
    socket.broadcast.emit(EVENTS.CARD_REMOVED, res)
  })
  socket.on("disconnect", () => {
    // console.log("disconnect")
  })
})

// Register your application as a normal plugin.
app.register(require("./app.js"))

// Start listening.
app.listen(
  { port: process.env.PORT || 3000, host: process.env.HOST },
  err => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    console.log(
      `Server listenting at http://${process.env.HOST}:${
        app.server.address().port
      }`
    )
  }
)
