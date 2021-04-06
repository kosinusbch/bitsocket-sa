require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')
const bcode = require('./src/bcode')
const zmq = require('zeromq')
const NodeCache = require( "node-cache" );
bitcoin.script.classifyOutput = require('./node_modules/bitcoinjs-lib/src/classify').output;
const mempool = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65});
const blocks = new NodeCache({deleteOnExpire: true, stdTTL: 60, checkperiod: 65});

function decode_tx(hex) {
    const tx = bitcoin.Transaction.fromHex(hex)
    var doc = {
        tx: {
            h: tx.getId(),
            s: tx.byteLength()
        },
        in: tx.ins.map(input => ({
            i: input.index,
            e: {
                h: Buffer.from(input.hash).reverse().toString('hex'),
                i: input.index,
            },
            str: bitcoin.script.toASM(input.script),
            //hex: input.script.toString('hex'),
            //sequence: input.sequence,
        })),
        out: tx.outs.map((output, i) => ({
            i: i,
            e: {
                value: output.value,
                i: i,
            },
            original: output.script,
            str: bitcoin.script.toASM(output.script),
            //hex: output.script.toString('hex'),
        })),
        version: tx.version,
        locktime: tx.locktime,
    }

    for(var i = 0; i < doc.out.length; i++) {
        try {
            doc.out[i].e.a = bitcoin.address.fromOutputScript(doc.out[i].original)
            delete doc.out[i].original
        } catch (err) {
            delete doc.out[i].original
            console.log(err)
        }
    }
    console.log(doc)
    return doc
}

let network = (process.env.network ? process.env.network : 'bch')
let host = (process.env.zmq_host ? process.env.zmq_host : '127.0.0.1')
let port = (process.env.zmq_port ? process.env.zmq_port : '28332')

let run = async function () {
    const sock = new zmq.Subscriber
 
    sock.connect("tcp://"+host+":"+port)
    sock.subscribe("rawtx")
    sock.subscribe("rawblock")
    console.log('Connected to ZMQ at '+host+':'+port)
   
    for await (const [topic, message] of sock) {
        if (topic.toString() === 'rawtx') {
            var tx = decode_tx(message.toString('hex'))
            //console.log(tx)
        } else if (topic.toString() == 'rawblock') {
            var raw = message.toString('hex')
            var rblock = bitcoin.Block.fromHex(raw)
            var txs = []
            for(var i = 0; i < rblock.transactions.length; i++) {
                txs.push(rblock.transactions[i].getId())
            }
            var block = {
                hash: rblock.getId(),
                size: rblock.byteLength(),
                version: rblock.version,
                timestamp: rblock.timestamp,
                bits: rblock.bits,
                nonce: rblock.nonce,
                transactions: txs
            }

        }
    }
}

run()
