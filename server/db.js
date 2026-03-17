const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'ranking.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to SQLite database.');
  }
});

// 테이블 초기화
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS rankings (
      rank_id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_name TEXT NOT NULL,
      clear_time REAL NOT NULL,
      total_overtime_pay INTEGER NOT NULL,
      checksum TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 빠른 조회를 위한 인덱스 생성
  db.run(`CREATE INDEX IF NOT EXISTS idx_rankings_sort ON rankings (clear_time ASC, total_overtime_pay DESC)`);
});

module.exports = db;
