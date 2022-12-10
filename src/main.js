/**
 * @file Taint tracking for Ethereum.
 * @module ethtaint
 */

'use strict'

// Imports
const Tracker = require('./tracker/tracker');
const DB = require('./db/db');

// Expose
exports.Tracker = Tracker
exports.DB = DB
