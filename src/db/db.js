/**
 * @file sqlite3 db.
 * @module db/db
 */

'use strict'

// Imports
const fs = require('fs')
const mkdirp = require('mkdirp')
const EventEmitter = require('events')

const sqlite3 = require('sqlite3').verbose();
const db_dir = "db/";
const db_name = "taint.db";
const db_path = db_dir + db_name;
const schema_path = "src/db/schema.sql";

// Resources
var undef

/**
 * Private members store.
 * @private
 */
const privs = new WeakMap()


// async function prepare() {
//   await db.query(sql`
//     CREATE TABLE IF NOT EXISTS app_data (
//       id VARCHAR NOT NULL PRIMARY KEY,
//       value VARCHAR NOT NULL
//     );
//   `);
// }
// const prepared = prepare();

// async function set(id, value) {
//   await prepared;
//   await db.query(sql`
//     INSERT INTO app_data (id, value)
//       VALUES (${id}, ${value})
//     ON CONFLICT (id) DO UPDATE
//       SET value=excluded.value;
//   `);
// }

// async function get(id) {
//   await prepared;
//   const results = await db.query(sql`
//     SELECT value FROM app_data WHERE id=${id};
//   `);
//   if (results.length) {
//     return results[0].value;
//   } else {
//     return undefined;
//   }
// }

// async function remove(id) {
//   await prepared;
//   await db.query(sql`
//     DELETE FROM app_data WHERE id=${id};
//   `);
// }

// async function run() {
//   const runCount = JSON.parse((await get('run_count')) || '0');
//   console.log('run count =', runCount);
//   await set('run_count', JSON.stringify(runCount + 1));
//   console.log(await get('name'));
//   await set('name', 'Forbes');
//   console.log(await get('name'));
//   await set('name', 'Forbes Lindesay');
//   console.log(await get('name'));
//   remove('name');
// }
// run().catch((ex) => {
//   console.error(ex.stack);
//   process.exit(1);
// });

async function loadSchema () {
  return new Promise((resolve, reject) => {
    fs.readFile(schema_path, 'utf8', (err, data) => {
      if (err) { reject(err); }
      else { resolve(data); }
    })
  });
}

async function openDB (db, dbPath) {
  var schema_sql = await loadSchema();
  return new Promise((resolve, reject) => {
    // var db = new sqlite3.Database(dbPath);
    db.serialize(() => {
      db.exec(schema_sql);
      console.log("Database Created ", dbPath);
    });
    resolve(db);
  });
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
    this.db = new sqlite3.Database(db_path);
    const priv = {}
    privs.set(this, priv)
    priv.canceling = false
  }

  async initializeDB () {
    await createDirectory(db_dir);
    return openDB(this.db, db_path);
  }

  async storeTransaction (txn) {
    storeTransactionToDb(txn);
  }

  async traverse(addr) {

  }
}

// Expose
module.exports = DB

// Circular imports
const arg = require('../util/arg')
