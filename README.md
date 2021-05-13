# Bitsocket Standalone

Bitsocket Standalone (SA) includes most of the features from Bitsocket FH but none of the bloat. Bitsocket SA does this by routing around mongodb and parsing transactions from ZeroMQ directly, as well as many other performance improvements.

## What is Bitsocket?

Bitsocket is simple way to stream bitcoin transactions straight from your local Bitcoin Cash node to the world using SSE (Server Sent Events). 

This is not only more secure, but also offers far better performance and customizability than you'd get from ZeroMQ direcly.

[Click here to learn more](https://bitsocket-sa.bch.sx)

## Changes from Bitsocket FH

* Added `in.o(X)` for op codes. Instead of `“b0": { “op": 106 } }` it will now say `"o0": "OP_RETURN"`
* Added Mingo validation to emulate MongoDB queries
* Added `tx.lock` (locktime) and `tx.ver` (version)
* Added `tx.size` (transaction size in bytes)
* Added `in.seq` for sequenceNumber
---
* Removed large-type (l-prefixed) fields
* Removed MongoDB (might need to update your queries)

## Installation

### Prerequisites

If you haven't already, go through the steps in the following guides to install nodejs and BCHN

* [Installing NodeJS, NPM and PM2](https://github.com/kosinusbch/bitcoin-cash-devs/blob/master/installing-nodejs-npm-and-pm2.md)

* [Installing And Configuring BCHN For Devs](https://github.com/kosinusbch/bitcoin-cash-devs/blob/master/installing-and-configuring-bchn-for-devs.md)

### Setting up Bitsocket SA

First you need to clone the repository

```
git clone https://github.com/kosinusbch/bitsocket-sa && cd bitsocket-sa
```

Install NPM dependencies

```
npm install
```

Start the process

```
node index.js
```

Start the process as a daemon

```
pm2 start index.js --name="bitsocket"
```

### Conclusion

Your Bitsocket server will now be live at `http://127.0.0.1:4000`