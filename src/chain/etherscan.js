/**
 * @file Chain agent interfacing with Etherscan.
 * @module chain/etherscan
 */

'use strict'

/**
 * Private members store.
 * @private
 */
const privs = new WeakMap()

/**
 * Chain agent interfacing with Etherscan.
 * @static
 */
class ChainAgent {
  /**
   * No parameters.
   */
  constructor () {
    const priv = {}
    privs.set(this, priv)
  }
}

// Expose
module.exports = ChainAgent
