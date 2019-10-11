"use strict"

const fp = require("fastify-plugin")
const moment = require("moment")
moment.locale("th")
const fileLogger = require("pino")(
  {
    timestamp: () => {
      return `,"time":"${moment().format("YYYY-MM-DD HH:mm:ss")}"`
    }
  },
  "./logs/query.log"
)
const rfs = require("rotating-file-stream")
const stream = rfs("./logs/query.log", {
  size: "50M", // rotate every 10 MegaBytes written
  interval: "1M", // rotate daily
  compress: true // compress rotated files
})
stream.on("rotated", function(filename) {
  // rotation job completed with success producing given filename
  console.log("rotated", filename)
})

async function decorateFastifyInstance(fastify, opts, next) {
  const pool = require("knex")({
    client: opts.client,
    connection: opts.connection,
    pool: { min: 0, max: 10 },
    asyncStackTraces: true,
    log: {
      error(message) {
        console.log(message)
      },
      debug(message) {
        console.log(message)
      }
    },
    useNullAsDefault: true
  })

  pool.on("query", async function(query) {
    if (query.bindings) {
      for (let bind of query.bindings) {
        if (!fastify.isEmpty(bind)) {
          bind = `'${bind}'`
        }
        query.sql = query.sql.replace("?", bind)
      }
    }
    // save log file
    fileLogger.info(`[Raw] ${query.sql.replace(/\\/g, "")}`)
  })

  fastify.decorate(opts.decorate || "db", pool)
}

module.exports = fp(decorateFastifyInstance)
