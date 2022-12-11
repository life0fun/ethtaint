/**
 * @file sqlite3 db.
 * @module db/db
 */

'use strict'

// Imports
const fs = require('fs')
const mkdirp = require('mkdirp')
const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const db_dir = "db/";
const db_name = "taint.db";
const db_path = db_dir + db_name;
const schema_path = "src/db/schema.sql";
const traverse_sql_path = "src/db/traverse.sql";

// Resources
var undef

/**
 * Private members store.
 * @private
 */
const privs = new WeakMap()

async function loadSql (sql_file) {
  return new Promise((resolve, reject) => {
    fs.readFile(sql_file, 'utf8', (err, data) => {
      if (err) { reject(err); }
      else { resolve(data); }
    })
  });
}

async function openDB (dbPath) {
  const schema_sql = await loadSql(schema_path);
  const db = await sqlite.open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await db.exec(schema_sql);
  return db;
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

class DB extends EventEmitter {
  /**
   * No parameters.
   */
  constructor () {
    super()
    //this.db = new sqlite3.Database(db_path);
    const priv = {}
    privs.set(this, priv)
    priv.canceling = false
  }

  async initializeDB () {
    await createDirectory(db_dir);
    this.db = await openDB(db_path);
  }

  async storeTransaction (txn) {
    const src_addr = {
      "id": txn.from.hex,
      "wei": txn.amount.wei,
      "block": txn.block.number
    };
    const dst_addr = {
      "id": txn.to.hex,
      "wei": txn.amount.wei,
      "block": txn.block.number
    };
    const transactions = {
      "hash": txn.hash,
      "src": txn.from.hex,
      "dst": txn.to.hex,
      "wei": txn.amount.wei,
      "block": txn.block.number
    };
    await this.db.run("INSERT OR IGNORE INTO addresses VALUES(json(?))", 
      JSON.stringify(src_addr));
    await this.db.run("INSERT OR IGNORE INTO addresses VALUES(json(?))", 
      JSON.stringify(dst_addr));
    await this.db.run("INSERT OR IGNORE INTO transactions VALUES(?, ?, json(?))", 
      src_addr.id, dst_addr.id, JSON.stringify(transactions));
  }

  async traverse(addr) {
    const traverse_sql = await loadSql(traverse_sql_path);
    var records = await this.db.each(traverse_sql, [addr], 
      (err, row) => {
        if (err) { throw err; }
        console.log("one row -> ", row);
      });
    console.log(" Done", records);
  }
}

// Expose
module.exports = DB

// Circular imports
const arg = require('../util/arg');const { throws } = require('assert');

