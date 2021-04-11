require('dotenv').config()
const express = require('express')
const app = express()
const tna = require('./src/tna_bch')
const sse = require('./src/sse')
const txs = require('./src/tx')
const zmq = require('zeromq')
const { v4: uuid } = require('uuid')
const NodeCache = require('node-cache')
app.use(sse)

const connections = {
  raw: { pool: [] },
  parsed: { pool: [] }
}

const parsed_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const raw_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const host = (process.env.zmq_host ? process.env.zmq_host : '127.0.0.1')
const port = (process.env.zmq_port ? process.env.zmq_port : '28332')

let node_listen = async function () {
  try {
      const sock = new zmq.Subscriber
      sock.connect("tcp://"+host+":"+port)
      sock.subscribe("rawtx")
      //sock.subscribe("rawblock")
      console.log('[INFO]', 'Connected to ZMQ at '+host+':'+port)
  
      for await (const [topic, message] of sock) {
          if (topic.toString() === 'rawtx') {
            raw_cache.set(uuid(), (message.toString('hex')))
            var doc = await txs.parse_tx(message.toString('hex'))
            console.log(doc)
            parsed_cache.set(doc.tx.h, doc);
          }/*  else if (topic.toString() == 'rawblock') {
              var raw = message.toString('hex')
              var rblock = bitcoin.Block.fromHex(raw)
              var trans = []
              for(var i = 0; i < rblock.transactions.length; i++) {
                trans.push(rblock.transactions[i].getId())
              }
              var block = {hash: rblock.getId(), size: rblock.byteLength(), version: rblock.version, timestamp: rblock.timestamp, bits: rblock.bits, nonce: rblock.nonce, transactions: trans}
          } */
      }
  } catch (err) {
      console.error(err)
      node_listen()
  }
}

app.get('/stream/raw', function(req, res) {
  const fingerprint = uuid()
  res.$fingerprint = fingerprint
  res.sseSetup()
  res.sseSend({ type: "open", data: {} })
  connections.raw.pool[fingerprint] = res
  console.log('[RAW]', '🥳 [SSE_JOIN]', fingerprint, '(now '+(Object.keys(connections.raw.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  req.on("close", function() {
      delete connections.raw.pool[res.$fingerprint]
      console.log('[RAW]', '🚪 [SSE_LEAVE]', res.$fingerprint, '(now '+(Object.keys(connections.raw.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  })
})

app.get('/stream', function(req, res) {
  const fingerprint = uuid()
  res.$fingerprint = fingerprint
  res.sseSetup()
  res.sseSend({ type: "open", data: {} })
  connections.parsed.pool[fingerprint] = res
  console.log('[PARSED]', '🥳 [SSE_JOIN]', fingerprint, '(now '+(Object.keys(connections.parsed.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  req.on("close", function() {
      delete connections.parsed.pool[res.$fingerprint]
      console.log('[PARSED]', '🚪 [SSE_LEAVE]', res.$fingerprint, '(now '+(Object.keys(connections.parsed.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  })
})

// Listen for new additions to "parsed_cache", send to users
parsed_cache.on("set", function(key, value) {
  Object.keys(connections.parsed.pool).forEach(async function(key) {
      //console.log(value)
      connections.parsed.pool[key].sseSend({type: "mempool", data: [value]})
  })
})

// Listen for new additions to "raw_cache", send to users
raw_cache.on("set", function(key, value) {
  Object.keys(connections.raw.pool).forEach(async function(key) {
    connections.raw.pool[key].sseSend({type: "mempool", data: [value]})
  })
})

// Send a heartbeat every 15 seconds to keep the connection alive
setInterval(function() {
  Object.keys(connections.parsed.pool).forEach(async function(key) {
    connections.parsed.pool[key].sseHeartbeat()
  })
  Object.keys(connections.raw.pool).forEach(async function(key) {
    connections.raw.pool[key].sseHeartbeat()
  })
}, 15000);

app.listen(process.env.app_port, () => {
  console.log('[INFO]', process.env.app_name + ' listening on localhost:'+process.env.app_port)
  node_listen()
})