var tx = {"tx":{"h":"9109870b7229abd3c5e363afe14b1ef9084ba7abed6c64f7b2f35258f996e744","size":219,"lock":0,"ver":2},"in":[{"i":0,"seq":0,"b0":"sk1vig65L+GYlMKoUEe25A3bQ3YloftIOhIX7vbPCTZonrjgPLU0UWXQaIcm8Qv0U/S5aEt+obtCU908eOTyhEE=","b1":"AiudiO3/SIMm4vOdyQjicVjuq9G38xs47L+S6LqrpvFi","str":"b24d6f8a0eb92fe19894c2a85047b6e40ddb437625a1fb483a1217eef6cf0936689eb8e03cb5345165d0688726f10bf453f4b9684b7ea1bb4253dd3c78e4f28441 022b9d88edff488326e2f39dc908e27158eeabd1b7f31b38ecbf92e8baaba6f162","e":{"h":"00e4e191c409fc6e8a0f839c4f1bc8d3935fd339821a8910178a53970a5f9e55","i":1,"a":"qrav95p3fmwmt42mh4xj68jxguz7hzwe3un2qqjzfy"}}],"out":[{"i":0,"b2":"GwoAMx3Ir8DGXT7CXFPo0Ob54Y0=","s2":"\u001b\n\u00003\u001dÈ¯ï¿½ï¿½]>ï¿½\\Sï¿½ï¿½ï¿½ï¿½ï¿½","str":"OP_DUP OP_HASH160 1b0a00331dc8afc0c65d3ec25c53e8d0e6f9e18d OP_EQUALVERIFY OP_CHECKSIG","o0":"OP_DUP","o1":"OP_HASH160","o3":"OP_EQUALVERIFY","o4":"OP_CHECKSIG","e":{"v":1475,"i":0,"a":"qqds5qpnrhy2lsxxt5lvyhznargwd70p353e2ag564"}},{"i":1,"b2":"+sLQMU7dtdVbvU0tHkZHBeuJ2Y8=","s2":"ï¿½ï¿½ï¿½1NÝµï¿½[ï¿½M-\u001eFG\u0005ï¿½Ù","str":"OP_DUP OP_HASH160 fac2d0314eddb5d55bbd4d2d1e464705eb89d98f OP_EQUALVERIFY OP_CHECKSIG","o0":"OP_DUP","o1":"OP_HASH160","o3":"OP_EQUALVERIFY","o4":"OP_CHECKSIG","e":{"v":2768059,"i":1,"a":"qrav95p3fmwmt42mh4xj68jxguz7hzwe3un2qqjzfy"}}]}
var query = {
    "v": 4,
    "q": {
        "find": {"tx.h":{"$in": ["9109870b7229abd3c5e363afe14b1ef9084ba7abed6c64f7b2f35258f996e744"]}, "tx.size": {"$lt": 500}}
    }
}

const supported = ['$in', '$gt', '$lt']

let _match = function (term, match) {
    if(term == match) {
        return true
    } else {return false}
}

let _in = function (array, match) {
    if(array.includes(match)) {
        return true
    } else {return false}
}

let _gt = function (number, match) {
    if(number < match) {
        return true
    } else {return false}
}

let _lt = function (number, match) {
    if(number > match) {
        return true
    } else {return false}
}

let is_match = function (tx, query) {
    return new Promise(function(resolve, reject) {
        Object.keys(query.q.find).forEach(async function(key) {
            var match = key.split('.')
            if(match.length == 2) {var term = tx[match[0]][match[1]]} else if(match.length == 3) {var term = tx[match[0]][match[1]][match[2]]}
            if(query.q.find[key] && query.q.find[key]["$in"]) {
                if(!_in(query.q.find[key]["$in"], term)) {
                    reject(false)
                }
            } else if(query.q.find[key] && query.q.find[key]["$gt"]) {
                if(!_gt(query.q.find[key]["$gt"], term)) {
                    reject(false)
                }
            } else if(query.q.find[key] && query.q.find[key]["$lt"]) {
                if(!_lt(query.q.find[key]["$lt"], term)) {
                    reject(false)
                }
            } else {
                if(!_match(query.q.find[key], term)) {
                    reject(false)
                }
            }
        })
        resolve(true)
    })
}

let is_valid = function (query) {
    return new Promise(function(resolve, reject) {
        Object.keys(query.q.find).forEach(async function(key) {
            if(!query.q.find[key]['$in'] && !query.q.find[key]['$gt'] && !query.q.find[key]['$lt']) {
                reject('This app only supports {"$in": ["", ""]} (search by array), {"$gt": number} (greater than) and {"$lt": number} (lower than)')
            }
            if (!query.q || !query.q.find) {
                reject('q or q.find is missing from your query')
            }
        })
        resolve(true)
    })
}

var test = function () {
    var start = Date.now()
    is_valid(query).then(res => {
        is_match(tx, query).then(res => {
            console.log('Took', Date.now() - start, 'ms')
        }).catch(err => {
            console.error(err)
        })
    }).catch(err => {
        console.error(err)
    })
}

test()

/* is_match(tx, query).then(res => {
    console.log(res)
}).catch(err => {
    console.error(err)
}) */

module.exports = {
    is_match: is_match
}