require('dotenv').config()
const bitcore = require('bitcore-lib-cash')
const tna = require('../src/tna_bch')


let parse_tx = async function (rawtx) {
    var tx = await tna.fromGene(rawtx)
    return tx
}


module.exports = {
    parse_tx
}