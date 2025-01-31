/**
 * @file Ethereum taint tracker.
 * @module tracker/tracker
 */

'use strict'

// Imports
const fs = require('fs')
const mkdirp = require('mkdirp')
const EventEmitter = require('events')
const Cache = require('../cache/cache')
const ChainAgent = require('../chain/etherscan')
const Address = require('../primitives/address')
const Taint = require('../primitives/taint')
const DB = require('../db/db');

// Resources
var undef

/**
 * Private members store.
 * @private
 */
const privs = new WeakMap()

/**
 * Get any tainted untraced address.
 * @private
 * @param {Set<Address>} tainted - Tainted addresses.
 * @param {Set<Address>} traced - Traced addresses.
 * @return {Address|null} A tainted untraced address.
 */
function getTaintedUntraced (tainted, traced) {
  var address
  for (address of tainted) {
    if (!traced.has(address)) {
      return address
    }
  }
  return null
}

/**
 * Check whether save exists.
 * @param {string} sourceHex - Hex representation of taint source address.
 * @param {number} startBlock - Start block of tainting.
 * @return {boolean} Whether save exists.
 */
async function checkTraceDirExists (sourceHex, startBlock) {
  return new Promise((resolve, reject) => {
    const dirPath = 'trace/' + sourceHex + '-' + startBlock
    fs.access(dirPath, err => {
      if (err) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

/**
 * Create directory and all parent directories.
 * @param {string} dirPath - Path to directory.
 * @return {undefined}
 */
async function createDirectory (dirPath) {
  return new Promise((resolve, reject) => {
    mkdirp(dirPath, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Initialize file.
 * @param {string} filePath - Path to file.
 * @param {string} data - Initial data.
 * @return {undefined}
 */
async function initializeFile (filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Open file.
 * @param {string} filePath - Path to file.
 * @param {string} mode - File mode.
 * @return File descriptor.
 */
async function openFile (filePath, mode) {
  return new Promise((resolve, reject) => {
    fs.open(filePath, mode, (err, fd) => {
      if (err) {
        reject(err)
      } else {
        resolve(fd)
      }
    })
  })
}

/**
 * Close file.
 * @param fd - File descriptor.
 * @return {undefined}
 */
async function closeFile (fd) {
  return new Promise((resolve, reject) => {
    fs.close(fd, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Create empty file.
 * @param {string} filePath - Path to file.
 * @return {undefined}
 */
async function createEmptyFile (filePath) {
  const fd = await openFile(filePath, 'wx')
  await closeFile(fd)
}

/**
 * Read file.
 * @param {string} filePath - Path to file.
 * @return {string} File data.
 */
async function readFile (filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Write file.
 * @param {string} filePath - Path to file.
 * @param {string} data - File data.
 * @return {undefined}
 */
async function writeFile (filePath, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Delete all matching lines from file.
 * @todo Improve efficiency of this procedure.
 * @param {string} filePath - Path to file.
 * @param {string} deleteLine - Line text to delete.
 * @return {undefined}
 */
async function deleteFileLine (filePath, deleteLine) {
  const fileData = await readFile(filePath)
  const fileLines = fileData.split('\n')
  const newLines = []
  for (let i = 0, line; i < fileLines.length; i++) {
    line = fileLines[i]
    if (line !== deleteLine) {
      newLines.push(line)
    }
  }
  const newData = newLines.join('\n')
  await writeFile(filePath, newData)
}

/**
 * Initialize save.
 * @param {string} sourceHex - Hex representation of taint source address.
 * @param {number} startBlock - Start block of tainting.
 * @return {undefined}
 */
async function initializeTraceDir (sourceHex, startBlock) {
  const dirPath = 'trace/' + sourceHex + '-' + startBlock
  await createDirectory(dirPath)
  const taintedFilePath = dirPath + '/tainted'
  const taintedFileData = sourceHex + '|' + startBlock + '\n'
  await initializeFile(taintedFilePath, taintedFileData)
  const tracedFilePath = dirPath + '/traced'
  await createEmptyFile(tracedFilePath)
}

/**
 * Record address tainted.
 * @param {string} sourceHex - Hex representation of source address.
 * @param {number} sourceStartBlock - Start block of source tainting.
 * @param {string} addressHex - Hex representation of tainted address.
 * @param {number} startBlock - Start block of tainting.
 * @return {undefined}
 */
async function appendAddrToTainted (sourceHex, sourceStartBlock, addressHex, startBlock) {
  await new Promise((resolve, reject) => {
    const filePath = 'trace/' + sourceHex + '-' + sourceStartBlock + '/tainted'
    const data = addressHex + '|' + startBlock + '\n'
    fs.appendFile(filePath, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * Record address traced.
 * @param {string} sourceHex - Hex representation of source address.
 * @param {number} startBlock - Start block of tainting.
 * @param {string} addressHex - Hex representation of traced address.
 * @return {undefined}
 */
async function appendAddrToTraced (sourceHex, startBlock, addressHex) {
  await new Promise((resolve, reject) => {
    const filePath = 'trace/' + sourceHex + '-' + startBlock + '/traced'
    const data = addressHex + '\n'
    fs.appendFile(filePath, data, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

/**
 * @param {string} srcHex - Hex representation of source address.
 * @param {number} startBlock - Start block of tainting.
 * @param {cache} cache - global cache
 * @return {taint} taint - populate the global taint object of the srcAddr
 * @return {taintedAddrSet} - populate all the tainted addr to the set
 * @return {tracedAddrSet} - populate all the traced addr to the set
 * @return {taintedSinceBlockMap} - populate the addr, startblock mapping
 */
async function loadTaintedAndTraced(tracker, srcHex, startBlock, cache, 
  taint, taintedAddrSet,tracedAddrSet, taintedSinceBlockMap) {
  const dirPath = 'trace/' + srcHex + '-' + startBlock
  const taintedFilePath = dirPath + '/tainted'
  const taintedFileData = await readFile(taintedFilePath)
  const taintedFileLines = taintedFileData.split('\n')
  // Read in each addr in the trace/srcHex/tainted, populate taint and block map
  for (
    let i = 1, line, fields,
      addressHex, address,
      fromBlockString, fromBlock;
    i < taintedFileLines.length;
    i++
  ) {
    line = taintedFileLines[i]
    if (!line) continue
    fields = line.split('|')
    addressHex = fields[0]
    address = await cache.address.get(addressHex)
    if (address === undef) {
      try {
        address = new Address(addressHex)
      } catch (e) {
        continue;
      }
      await cache.address.set(addressHex, address)
    }
    address.addTaint(taint)
    taint.addRecipient(address)

    taintedAddrSet.add(address)
    fromBlockString = fields[1]
    fromBlock = Number.parseInt(fromBlockString)
    taintedSinceBlockMap.set(address, fromBlock)
    tracker.emit('taint', address, taint)
  }
  // populate traced addr set
  const tracedFilePath = dirPath + '/traced'
  const tracedFileData = await readFile(tracedFilePath)
  const tracedFileLines = tracedFileData.split('\n')
  for (
    let i = 0, line,
      addressHex, address;
    i < tracedFileLines.length;
    i++
  ) {
    line = tracedFileLines[i]
    if (!line) continue
    addressHex = line
    address = await cache.address.get(addressHex)
    if (address === undef) {
      address = new Address(addressHex)
      await cache.address.set(addressHex, address)
    }

    tracedAddrSet.add(address)
    tracker.emit('tracedAddress', address)
  }
}

/**
 * Delete address traced.
 * @param {string} sourceHex - Hex representation of source address.
 * @param {number} startBlock - Start block of tainting.
 * @param {string} addressHex - Hex representation of address needing new tracing.
 * @return {undefined}
 */
async function deleteAddrFromTraced (sourceHex, startBlock, addressHex) {
  const filePath = 'trace/' + sourceHex + '-' + startBlock + '/traced'
  const line = addressHex
  await deleteFileLine(filePath, line)
}

/**
 * Delete address tainted.
 * @param {string} sourceHex - Hex representation of source address.
 * @param {number} startBlock - Start block of tainting.
 * @param {string} addressHex - Hex representation of address to delete.
 * @param {number} fromBlock - Start block of address to delete.
 * @return {undefined}
 */
async function deleteAddrFromTainted (sourceHex, startBlock, addressHex, fromBlock) {
  const filePath = 'trace/' + sourceHex + '-' + startBlock + '/tainted'
  const line = addressHex + '|' + fromBlock
  await deleteFileLine(filePath, line)
}

/**
 * Visit a transaction, populate the global tainted Set, fix refs in each object
 * (taint <-> txn)
 * the tx is a transaction listed from current address(not source).
 * populate taint fields, make mutual refs(taint <-> txn)
 * added tx.to addr to the global tainted set.
 */
async function processTransaction (
  tracker,
  taint,
  source,
  sourceStartBlock,
  address,  /* this txn involved this address, either in to, or from*/
  tx,
  tainted,  /* global set of tainted addr populated from tx.to */
  taintedSinceBlock,  /* Map of addr and the earliest block of taint */
  traced /* Set of traced Addr */
) {
  // No target
  if (tx.to === null) {
    return
  }

  // txn Input is current address, we only care outgoing txn, i.e, address reachable from current addr.
  // if (tx.to === address) {
  //   return
  // }

  // No value
  if (tx.amount.wei.equals(0)) {
    return
  }

  // Already propagated
  if (tx.hasTaint(taint)) {
    return
  }

  // Record propagated
  tx.addTaint(taint)

  // Add to tainted list
  var traceAddr;
  if (tx.to === address) {
    tainted.add(tx.from);   // track the source
    traceAddr = tx.from;
  } else {
    tainted.add(tx.to)
    traceAddr = tx.to;
  }

  // Already tainted
  // if (tx.to.hasTaint(taint)) {
  //   const fromBlock = taintedFrom.get(tx.to)
  //   if (fromBlock > tx.block.number) {
  //     taintedFrom.set(tx.to, tx.block.number)
  //     await deleteTainted(source.hex, sourceStartBlock, tx.to.hex, fromBlock)
  //     await recordTainted(source.hex, sourceStartBlock, tx.to.hex, tx.block.number)
  //     traced.delete(tx.to)
  //     await deleteTraced(source.hex, sourceStartBlock, tx.to.hex)
  //     tracker.emit('reopenTrace', tx.to, taint)
  //   }
  //   return
  // }
  if (traceAddr.hasTaint(taint)) {
    const fromBlock = taintedSinceBlock.get(traceAddr)
    // the addr tainted since fromBlock which is later than this txn block, adjust
    if (fromBlock > tx.block.number) {
      taintedSinceBlock.set(traceAddr, tx.block.number)
      await deleteAddrFromTainted(source.hex, sourceStartBlock, traceAddr, fromBlock)
      await appendAddrToTainted(source.hex, sourceStartBlock, traceAddr, tx.block.number)
      traced.delete(traceAddr)
      await deleteAddrFromTraced(source.hex, sourceStartBlock, traceAddr.hex)
      tracker.emit('reopenTrace', traceAddr, taint)
    }
    return
  }

  // Record tainted
  taint.addRecipient(traceAddr)
  traceAddr.addTaint(taint)
  taintedSinceBlock.set(traceAddr, tx.block.number)
  await appendAddrToTainted(source.hex, sourceStartBlock, traceAddr.hex, tx.block.number)

  // Emit tainted
  tracker.emit('taint', traceAddr, taint)
}

/**
 * New address tainted.
 * @event Tracker#taint
 * @type {Array}
 * @prop {module:primitives/address.Address} 0
 *     Tainted address.
 * @prop {module:primitives/taint.Taint} 1
 *     Propagated taint.
 */

/**
 * Acquiring page of transactions for tainted address.
 * @event Tracker#page
 * @type {Array}
 * @prop {module:primitives/address.Address} 0
 *     Tainted address.
 * @prop {number} 1
 *     Page number.
 */

/**
 * Processed transaction for tainted address.
 * @event Tracker#processedTransaction
 * @type {Array}
 * @prop {module:primitives/address.Address} 0
 *     Tainted address.
 * @prop {module:primitives/transaction.Transaction} 1
 *     Processed transaction.
 */

/**
 * Traced tainted address.
 * @event Tracker#tracedAddress
 * @type {Array}
 * @prop {module:primitives/address.Address} 0
 *     Tainted address.
 */

/**
 * Ethereum taint tracker.
 * @static
 * @emits Tracker#taint
 */
class Tracker extends EventEmitter {
  /**
   * No parameters.
   */
  constructor () {
    super();
    this.db = new DB();
    const priv = {}
    privs.set(this, priv)
    priv.cache = {
      block: new Cache(),
      address: new Cache(),
      tx: new Cache()
    }
    priv.chain = new ChainAgent(priv.cache)
    priv.pageSize = 50
    priv.tracing = false
    priv.canceling = false
  }

  /**
   * Request cancelation of a trace.
   * @return {undefined}
   */
  async cancelTrace () {
    const priv = privs.get(this)
    let res
    const prom = new Promise(resolve => { res = resolve })
    priv.canceling = res
    return prom
  }

  /**
   * Trace addresses tainted by specified source.
   * Starts asynchronous acquisition of all descendant tainting.
   * Each newly tainted address fires {@link event:Tracker#taint}.
   * Runs until extant chain data is exhausted.
   * Returned promise resolves when finished.
   * @todo Detect and use extant taint with same source.
   * @param {string} sourceHex
   *     Source address of taint. As an address hex.
   * @param {number} [startBlock=0]
   *     Start block of taint.
   * @return {undefined}
   */
  async traceAddresses (sourceHex, startBlock = 0) {
    // Validate arguments
    arg.addressHex(sourceHex)

    // Process arguments
    sourceHex = sourceHex.toLowerCase()

    // Private members
    const priv = privs.get(this)
    const cache = priv.cache
    const chain = priv.chain
    const pageSize = priv.pageSize
    if (priv.tracing) {
      throw new Error('Already tracing')
    }
    priv.tracing = true

    // Watch for trace failure
    try {
      // get Addr object from addrHex
      let srcAddr = await cache.address.get(sourceHex)
      if (srcAddr === undef) {
        srcAddr = new Address(sourceHex)
        await cache.address.set(sourceHex, srcAddr)
      }

      // One start srcAddr has one taint stores a set of txns and recipient addrs.
      const taint = new Taint(srcAddr)
      srcAddr.addTaint(taint)

      // a set of tainted addr populated from the txns of the current traced addr.
      // list all txns of the current traced addr, for the to/from addrs of each txn, add to tainted set. 
      const taintedAddrSet = new Set();
      taintedAddrSet.add(srcAddr);
      const taintedSinceBlockMap = new Map()
      taintedSinceBlockMap.set(srcAddr, startBlock)
      const tracedAddrSet = new Set()

      // Each starting addr has trace/add/{tainted, traced} to store intermediate result. 
      if (await checkTraceDirExists(sourceHex, startBlock)) {
        loadTaintedAndTraced(this, sourceHex, startBlock, cache, 
          taint, taintedAddrSet, tracedAddrSet, taintedSinceBlockMap);
      } else {
        await initializeTraceDir(sourceHex, startBlock)
      }

      // take a tainted address that is not in traced.
      // tainted added when processing txn from the current addr.
      for (
        let addr = getTaintedUntraced(taintedAddrSet, tracedAddrSet),
          fromBlockNumber;
        addr !== null;
        tracedAddrSet.add(addr),
        addr = getTaintedUntraced(taintedAddrSet, tracedAddrSet)
      ) {
        // Get address transactions
        let txs, numTxs, tx
        let page = 1
        do {
          // Detect canceling
          if (priv.canceling) {
            priv.tracing = false
            priv.canceling()
            priv.canceling = false
            return
          }

          // Get tainted from block number
          fromBlockNumber = taintedSinceBlockMap.get(addr)

          // Get next page of transactions
          this.emit(
            'page',
            addr,
            page
          )
          txs = await chain
            .listAccountTransactions(addr.hex, {
              startBlock: fromBlockNumber,
              page,
              pageSize
            })
          if (txs === undefined) {
            numTxs = 0;
          } else {
            numTxs = txs.length;
          }

          // Process transactions
          for (var i = 0; i < numTxs; i++) {
            // Detect canceling
            if (priv.canceling) {
              priv.tracing = false
              priv.canceling()
              priv.canceling = false
              return
            }

            tx = txs[i]
            await processTransaction(
              this,
              taint,
              srcAddr,
              startBlock,
              addr,
              tx,
              taintedAddrSet,
              taintedSinceBlockMap,
              tracedAddrSet
            );
            await this.db.storeTransaction(tx);
            this.emit(
              'processedTransaction',
              addr,
              tx
            );
            // console.log("Visit txn of addr ", addr.hex, 
            // " txn: ", tx.from.hex, " -> ", tx.to.hex);
          }

          // Increment page number
          page++
        } while (numTxs === pageSize && page == 1);

        // Emit one traced addr.
        this.emit('tracedAddress', addr);

        // Record traced address from source, startblock
        console.log("traced : ", sourceHex, addr.hex, " block: ", startBlock);
        await appendAddrToTraced(sourceHex, startBlock, addr.hex)
      }

      // End tracing
      priv.tracing = false
      priv.canceling = false
    } catch (e) {
      priv.tracing = false
      throw e
    }
  }
}

// Expose
module.exports = Tracker

// Circular imports
const arg = require('../util/arg')
