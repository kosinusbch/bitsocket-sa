require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const sse = require('./src/sse')
const zmq = require('zeromq')
const { v4: uuid } = require('uuid')
const NodeCache = require('node-cache')
const bitcoin = require('./src/bitcoin')
app.use(sse)

const connections = {
    pool: []
}

const mempool = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65})
const host = (process.env.zmq_host ? process.env.zmq_host : '127.0.0.1')
const port = (process.env.zmq_port ? process.env.zmq_port : '28332')

let node_listen = async function () {
    const sock = new zmq.Subscriber
    sock.connect("tcp://"+host+":"+port)
    sock.subscribe("rawtx")
    sock.subscribe("rawblock")
    console.log('[INFO]', 'Connected to ZMQ at '+host+':'+port)

    for await (const [topic, message] of sock) {
        if (topic.toString() === 'rawtx') {
            var doc = bitcoin.decode_tx(message.toString('hex'))
            mempool.set(doc.hash, doc);
        } else if (topic.toString() == 'rawblock') {
            var raw = message.toString('hex')
            var rblock = bitcoin.Block.fromHex(raw)
            var txs = []
            for(var i = 0; i < rblock.transactions.length; i++) {
                txs.push(rblock.transactions[i].getId())
            }
            var block = {hash: rblock.getId(), size: rblock.byteLength(), version: rblock.version, timestamp: rblock.timestamp, bits: rblock.bits, nonce: rblock.nonce, transactions: txs}
        }
    }
}

app.get('/stream', function(req, res) {
    const fingerprint = uuid()
    res.$fingerprint = fingerprint
    res.sseSetup()
    res.sseSend({ type: "open", data: [] })
    connections.pool[fingerprint] = res
    //console.log('🥳 [SSE_JOIN]', fingerprint, '(now '+Object.keys(connections.pool).length+' users)')
    req.on("close", function() {
        delete connections.pool[res.$fingerprint]
        //console.log('🚪 [SSE_LEAVE]', res.$fingerprint, '(now '+Object.keys(connections.pool).length+' users)')
    })
})

// Listen for new additions to "mempool" cache, send to users
mempool.on("set", function(key, value){
    Object.keys(connections.pool).forEach(async function(key) {
        connections.pool[key].sseSend({ type: "mempool", data: value })
    })
})

// Send a heartbeat every 15 seconds to keep the connection alive
setInterval(function() {
    Object.keys(connections.pool).forEach(async function(key) {
        connections.pool[key].sseHeartbeat()
    })
}, 15000);

app.listen(process.env.app_port, () => {
    console.log('[INFO]', process.env.app_name + ' listening on localhost:'+process.env.app_port)
    node_listen()
})