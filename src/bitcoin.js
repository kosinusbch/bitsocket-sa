require('dotenv').config()
const bitcoin = require('bitcoinjs-lib')

let decode_tx = function (hex) {
    var start = Date.now()
    var inputs = []
    var outputs = []
    //var type = 'normal'
    const rtx = bitcoin.Transaction.fromHex(hex)
    // Add inputs
    if(rtx.ins && rtx.ins[0] && rtx.ins[0].script) {
        for(var i = 0; i < rtx.ins.length; i++) {
            if(rtx.ins && rtx.ins[i] && rtx.ins[i].script && rtx.ins[i].script != '') {
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
    }
    // Add outputs
    for(var i = 0; i < rtx.outs.length; i++) {
        outputs.push({
            i: i,
            value: rtx.outs[i].value,
            original: rtx.outs[i].script,
            string: bitcoin.script.toASM(rtx.outs[i].script),
            hex: rtx.outs[i].script.toString('hex'),
        })
    }
    // Add addresses to outputs
    for(var i = 0; i < outputs.length; i++) {
        try {
            outputs[i].address = bitcoin.address.fromOutputScript(outputs[i].original)
            delete outputs[i].original
        } catch {delete outputs[i].original}
    }
    // Add h/s* to outputs
    for (var i = 0; i < outputs.length; i++) {
        // bad hack to strip op codes from 'string', in future parse better & put opcodes in b*
        var xscript = outputs[i].string.replace(/\bOP\_\S+/ig,"")
        var script = xscript.split(' ')
        /*if(isOpReturn && array_of_services.includes(in.h[0]) {
            type = services[in.h1]
        }*/
        for (var index = 0; index < script.length; index++) {
            if(script[index] !== '') {
                outputs[i]['h' + index] = script[index]
                try {outputs[i]['s' + index] = decodeURIComponent(script[index].replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'))} catch (err) {}
            }
        }
    }
    var stop = Date.now()
    return {
        tx: {
            hash: rtx.getId(),
            size: rtx.byteLength(),
            locktime: rtx.locktime,
            version: rtx.version,
            //category: type
        },
        in: inputs,
        out: outputs,
        dbg: {r: stop, p: (stop - start)}
    }
}

module.exports = {
    decode_tx
}