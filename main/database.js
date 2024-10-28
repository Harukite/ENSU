/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const { app } = require("electron");

let db;

async function initDatabase() {
  if (db) return db;

  const dbPath = path.join(app.getPath("userData"), "database.sqlite");

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS configs (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  return db;
}

async function getConfig(key) {
  const db = await initDatabase();
  const result = await db.get("SELECT value FROM configs WHERE key = ?", key);
  return result ? result.value : null;
}

async function setConfig(key, value) {
  const db = await initDatabase();
  await db.run(
    "INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)",
    key,
    value
  );
}

async function batchSetConfig(configs) {
  const db = await initDatabase();
  await db.run("BEGIN TRANSACTION");
  try {
    for (const [key, value] of Object.entries(configs)) {
      await db.run(
        "INSERT OR REPLACE INTO configs (key, value) VALUES (?, ?)",
        key,
        value
      );
    }
    await db.run("COMMIT");
  } catch (error) {
    await db.run("ROLLBACK");
    throw error;
  }
}

// 新增：批量读取配置
async function batchGetConfig(keys) {
  const db = await initDatabase();
  const placeholders = keys.map(() => "?").join(",");
  const query = `SELECT key, value FROM configs WHERE key IN (${placeholders})`;
  const results = await db.all(query, keys);

  // 将结果转换为对象格式
  const configObject = {};
  results.forEach((row) => {
    configObject[row.key] = row.value;
  });

  // 对于未找到的键，设置为 null
  keys.forEach((key) => {
    if (!(key in configObject)) {
      configObject[key] = null;
    }
  });

  return configObject;
}

module.exports = {
  initDatabase,
  getConfig,
  setConfig,
  batchSetConfig,
  batchGetConfig, // 添加新函数到导出
};
