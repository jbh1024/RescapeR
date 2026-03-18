const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '111111',
  database: process.env.DB_NAME || 'rescaper',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 테이블 초기화
async function initDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS rankings (
        rank_id INT AUTO_INCREMENT PRIMARY KEY,
        player_name VARCHAR(50) NOT NULL,
        clear_time DOUBLE NOT NULL,
        total_overtime_pay INT NOT NULL,
        checksum VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_rankings_sort (clear_time ASC, total_overtime_pay DESC)
      )
    `);
    console.log('Connected to MySQL database.');
  } catch (err) {
    console.error('Database initialization error:', err.message);
    process.exit(1);
  }
}

initDatabase();

module.exports = pool;
