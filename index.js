require('dotenv').config()
const express = require('express')
const app = express()
const sse = require('./src/sse')
const txs = require('./src/tx')
const zmq = require('zeromq')
const mingo = require('mingo')
const { v4: uuid } = require('uuid')
const NodeCache = require('node-cache')
app.use(sse)
app.set('view engine', 'ejs')
app.use(express.static('public'))

const connections = {
  raw: { pool: [] },
  parsed: { pool: [] }
}

const obj_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const raw_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const rblock_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const oblock_cache = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const host = (process.env.node_zmq_host ? process.env.node_zmq_host : '127.0.0.1')
const port = (process.env.node_zmq_port ? process.env.node_zmq_port : '28332')

let node_listen = async function () {
  try {
    const sock = new zmq.Subscriber
    sock.connect("tcp://"+host+":"+port)
    sock.subscribe("rawtx")
    //sock.subscribe("rawblock")
    console.log('[INFO]', 'Connected to ZMQ at '+host+':'+port)
  
    for await (const [topic, message] of sock) {
      if (topic.toString() === 'rawtx') {
        var doc = await txs.parse_tx(message.toString('hex'))
        raw_cache.set(uuid(), (message.toString('hex')))
        obj_cache.set(doc.tx.h, doc);
      } else if (topic.toString() == 'rawblock') {
        var raw = message.toString('hex')
        var rblock = bitcoin.Block.fromHex(raw)
        var trans = []
        for(var i = 0; i < rblock.transactions.length; i++) {
          trans.push(rblock.transactions[i].getId())
        }
        var block = {hash: rblock.getId(), size: rblock.byteLength(), version: rblock.version, timestamp: rblock.timestamp, bits: rblock.bits, nonce: rblock.nonce, transactions: trans}
      }
    }
  } catch (err) {
    console.error(err)
    node_listen()
  }
}

app.get(/^\/channel\/(.+)/, function(req, res) {
  let encoded = req.params[0]
  let decoded = Buffer.from(encoded, 'base64').toString()
  res.render('channel', {
    bitserve_url: '/stream/',
    code: decoded
  })
});

app.get('/channel', function (req, res) {
  res.render('channel', {
    bitserve_url: '/stream/',
    code: JSON.stringify({
      "v": 3,
      "q": { "find": {} }
    }, null, 2)
  })
});

app.get('/', function(req, res) {
  res.redirect('/channel')
});

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

app.get(/^\/stream\/(.+)/, function(req, res) {
  let encoded = req.params[0]
  let decoded = Buffer.from(encoded, 'base64').toString()
  const fingerprint = uuid()
  res.$query = decoded
  res.$fingerprint = fingerprint
  res.sseSetup()
  res.sseSend({ type: "open", data: {} })
  connections.parsed.pool[fingerprint] = res
  console.log('[QUERY]', '🥳 [SSE_JOIN]', fingerprint, '(now '+(Object.keys(connections.parsed.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  req.on("close", function() {
      delete connections.parsed.pool[res.$fingerprint]
      console.log('[QUERY]', '🚪 [SSE_LEAVE]', res.$fingerprint, '(now '+(Object.keys(connections.parsed.pool).length + Object.keys(connections.raw.pool).length)+' users)')
  })
})

let send_to = async function (format, type, data) {
  Object.keys(connections[format].pool).forEach(async function(key) {
    if(format == 'parsed' && connections[format].pool[key].$query) {
      var xquery = JSON.parse(connections[format].pool[key].$query)
      let mquery = new mingo.Query(xquery.q.find);
      if(mquery.test(data)) {
        connections[format].pool[key].sseSend({type: type, data: [data]})
      }
    } else {
      connections[format].pool[key].sseSend({type: type, data: [data]})
    }
  })
}

// Listen for new additions to "obj_cache", send to users
obj_cache.on("set", function(key, value) {
  send_to('parsed', 'mempool', value)
})

// Listen for new additions to "raw_cache", send to users
raw_cache.on("set", function(key, value) {
  send_to('raw', 'mempool', value)
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