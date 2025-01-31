/**
 * @file Argument validation procedures.
 * @module util/arg
 */

'use strict'

// Imports
const ethereumAddress = require('ethereum-address')

// Type imports
const type = {
  BigNumber: require('bignumber.js'),
  Address: require('../primitives/address'),
  Amount: require('../primitives/amount'),
  Block: require('../primitives/block'),
  Taint: require('../primitives/taint'),
  Transaction: require('../primitives/transaction')
}

/**
 * Confirm argument is string literal.
 * @param {string|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a string literal.
 */
exports.string = function string (arg) {
  if (!(typeof arg === 'string')) {
    throw new Error('Argument must be string literal')
  }
}

/**
 * Confirm argument is number literal.
 * @param {number|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a number literal.
 */
exports.number = function number (arg) {
  if (!(typeof arg === 'number')) {
    throw new Error('Argument must be number literal')
  }
  if (Number.isNaN(arg)) {
    throw new Error('Argument must not be NaN')
  }
  if (!Number.isFinite(arg)) {
    throw new Error('Argument must be finite')
  }
}

/**
 * Confirm argument is integer literal.
 * @param {number|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not an integer literal.
 */
exports.integer = function integer (arg) {
  if (!Number.isInteger(arg)) {
    throw new Error('Argument must be integer literal')
  }
}

/**
 * Confirm argument is address hex.
 * @param {string|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not an address hex.
 */
exports.addressHex = function addressHex (arg) {
  if (!ethereumAddress.isAddress(arg)) {
    console.log("Error: Not a valid Eth Addr", arg);
    throw new Error('Argument must be an Ethereum address', arg);
  }
}

/**
 * Confirm argument is transaction hash.
 * @todo Validate transaction hash format.
 * @param {string|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a string literal.
 */
exports.transactionHash = function transactionHash (arg) {
  exports.string(arg)
}

/**
 * Confirm argument is BigNumber.
 * @param {BigNumber|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a BigNumber.
 */
exports.BigNumber = function BigNumber (arg) {
  if (!(arg instanceof type.BigNumber)) {
    throw new Error('Argument must be BigNumber')
  }
}

/**
 * Confirm argument is Address.
 * @param {module:primitives/address.Address|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not an Address.
 */
exports.Address = function Address (arg) {
  if (!(arg instanceof type.Address)) {
    throw new Error('Argument must be Address')
  }
}

/**
 * Confirm argument is Amount.
 * @param {module:primitives/amount.Amount|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not an Amount.
 */
exports.Amount = function Amount (arg) {
  if (!(arg instanceof type.Amount)) {
    throw new Error('Argument must be Amount')
  }
}

/**
 * Confirm argument is Block.
 * @param {module:primitives/block.Block|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a Block.
 */
exports.Block = function Block (arg) {
  if (!(arg instanceof type.Block)) {
    throw new Error('Argument must be Block')
  }
}

/**
 * Confirm argument is Taint.
 * @param {module:primitives/taint.Taint|*} arg - Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a Taint.
 */
exports.Taint = function Taint (arg) {
  if (!(arg instanceof type.Taint)) {
    throw new Error('Argument must be Taint')
  }
}

/**
 * Confirm argument is Transaction.
 * @param {module:primitives/transaction.Transaction|*} arg
 *     Argument.
 * @return {undefined}
 * @throws {Error} If arg is not a Transaction.
 */
exports.Transaction = function Transaction (arg) {
  if (!(arg instanceof type.Transaction)) {
    throw new Error('Argument must be Transaction')
  }
}
