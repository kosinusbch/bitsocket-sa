# Bitsocket Standalone

Stream (raw and parsed) transactions and blockchain data from your cryptocurrency node to the world using Server Side Events (SSE). No annoying dependencies or pre-requisites.

While it has Bitsocket in it's name, the formatting is slightly different. Make sure to check out the docs before switching.

## Supported Coins

While this software should work with any ZeroMQ endpoint compatible with Bitcoin Core, these are the nodes that have been verified to work:

* BCH - Bitcoin Cash Node

## New Content from Bitsocket FH

* Added `tx.size` (the size of the transaction in bytes)
* Added `tx.fee` (the transaction fee in satoshis)
* Added `tx.version`, `in.sequence` and `tx.locktime`