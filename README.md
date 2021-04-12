# Bitsocket Standalone

Bitsocket Standalone (SA) includes all the features from Bitsocket FH, with 95% less of the bullshit. Bitsocket SA does this by routing around mongodb and parsing transactions from ZeroMQ directly, as well as many other performance improvements.

## What is Bitsocket?

Bitsocket is simple way to stream bitcoin transactions straight from your local BCH node to the world using SSE (Server Sent Events). This is not only more secure, but also offers far greater scalability than you'd get using ZeroMQ directly.

## Changes from Bitsocket FH

* Added `in.o(X)` for op codes. Instead of `“b0": { “op": 106 } }` it will now say `"o0": "OP_RETURN"`
* Added new query language that supports direct matches, $in, $gt and $lt
* Added `tx.lock` (locktime) and `tx.ver` (version)
* Added `tx.size` (transaction size in bytes)
* Added `in.seq` for sequenceNumber
---
* Removed MongoDB (might need to update your queries)
* Removed large-type (l-prefixed) fields


## Installation

### Prerequisites

### Configuring Bitcoin Cash Node

### Setting up Bitsocket SA