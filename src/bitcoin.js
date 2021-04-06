require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')

let decode_script = function (script) {
    var scripts = []
    var script = script.split(' ')
    for (var i = 0; i < script.length; i++) {
        if(script[i].substring(0,3) == "OP_") {
        } else {
            scripts["h" + i] = script[i]
            try {
                scripts["s" + i] = decodeURIComponent(script[i].replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))
            } catch {}
        }
    }
    return scripts
}

let decode_tx = function (hex) {
    var inputs = []
    var outputs = []
    const rtx = bitcoin.Transaction.fromHex(hex)
    for(var i = 0; i < rtx.ins.length; i++) {
        if(rtx.ins && rtx.ins[i] && rtx.ins[i].script) {
            inputs.push({
                i: rtx.ins[i].index,
                script: [],
                hash: Buffer.from(rtx.ins[i].hash).reverse().toString('hex'),
                string: bitcoin.script.toASM(rtx.ins[i].script),
                script: rtx.ins[i].script.toString('hex'),
                sequence: rtx.ins[i].sequence
            })
        }
    }
    for(var i = 0; i < rtx.outs.length; i++) {
        outputs.push({
            i: i,
            value: rtx.outs[i].value,
            original: rtx.outs[i].script,
            string: bitcoin.script.toASM(rtx.outs[i].script),
            hex: rtx.outs[i].script.toString('hex'),
        })
    }
    for(var i = 0; i < outputs.length; i++) {
        try {
            outputs[i].address = bitcoin.address.fromOutputScript(outputs[i].original)
            delete outputs[i].original
        } catch {delete outputs[i].original}
    }
    for (var i = 0; i < outputs.length; i++) {
        var xscript = outputs[i].string.replace(/\bOP\_\S+/ig,"")
        var script = xscript.split(' ')
        for (var index = 0; index < script.length; index++) {
            if(script[index] !== '') {
                outputs[i]['h' + index] = script[index]
                try {
                    outputs[i]['s' + index] = decodeURIComponent(script[index].replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))
                } catch (err) {}
            }
        }
    }
    var tx = {
        hash: rtx.getId(),
        version: rtx.version,
        in: inputs,
        out: outputs,
        version: rtx.version,
        locktime: rtx.locktime
    }
    console.log(tx)
    return tx
}

module.exports = {
    decode_tx, decode_script
}