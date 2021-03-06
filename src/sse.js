module.exports = function (req, res, next) {
    res.sseSetup = function() {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        })
    }

    res.sseSend = function(data) {
        res.write("data: " + JSON.stringify(data) + "\n\n");
    }

    res.sseHeartbeat = function() {
        res.write(":heartbeat" + "\n\n")
    }

    next()
}