require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')

let decode_tx = function (hex) {
    var inputs = []
    var outputs = []
    const rtx = bitcoin.Transaction.fromHex(hex)
    for(var i = 0; i < rtx.ins.length; i++) {
        inputs.push({
            i: rtx.ins[i].index,
            e: {h: Buffer.from(rtx.ins[i].hash).reverse().toString('hex'), i: rtx.ins[i].index,},
            str: bitcoin.script.toASM(rtx.ins[i].script),
            hex: rtx.ins[i].script.toString('hex'),
            sequence: rtx.ins[i].sequence
        })
    }
    for(var i = 0; i < rtx.outs.length; i++) {
        outputs.push({
            i: i,
            e: {
                v: rtx.outs[i].value,
                i: i,
            },
            original: rtx.outs[i].script,
            str: bitcoin.script.toASM(rtx.outs[i].script),
            hex: rtx.outs[i].script.toString('hex'),
        })
    }
    for(var i = 0; i < outputs.length; i++) {
        try {
            outputs[i].e.a = bitcoin.address.fromOutputScript(outputs[i].original)
            delete outputs[i].original
        } catch {delete outputs[i].original}
    }
    var tx = {
        tx: {
            txid: rtx.getId(),
            size: rtx.byteLength(),
            fee: 0,
            version: rtx.version,
            locktime: rtx.locktime
        },
        in: inputs,
        out: outputs
    }
    return tx
}

module.exports = {
    decode_tx
}