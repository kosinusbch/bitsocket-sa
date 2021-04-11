require('dotenv').config()
const bitcore = require('bitcore-lib-cash')
const tna = require('../src/tna_bch')


let parse_tx = async function (rawtx) {
    var rtx = new bitcore.Transaction(Buffer.from(rawtx, 'hex'))
    var tx = await tna.fromGene(rtx)

   return tx
}


module.exports = {
    parse_tx
}