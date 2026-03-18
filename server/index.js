require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const CryptoJS = require('crypto-js');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
// 기본 비밀키를 클라이언트와 동일하게 설정 (환경 변수 누락 대비)
const SECRET_KEY = process.env.RANKING_SECRET_KEY || 'rescaper_secret_token_2024';

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 랭킹 조회 (Top 10)
app.get('/rescaper-api/rankings', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT player_name, clear_time, total_overtime_pay, created_at
      FROM rankings
      ORDER BY clear_time ASC, total_overtime_pay DESC
      LIMIT 10
    `);
    res.json({ top10: rows });
  } catch (err) {
    console.error('[DB Error]', err.message);
    return res.status(500).json({ error: '데이터베이스 조회 중 오류가 발생했습니다.' });
  }
});

// 랭킹 등록
app.post('/rescaper-api/rankings', async (req, res) => {
  const { player_name, clear_time, total_overtime_pay, checksum } = req.body;
  console.log('[API] Received ranking submission:', { player_name, clear_time, total_overtime_pay, checksum });

  // 1. 필수 값 검증
  if (!player_name || clear_time === undefined || total_overtime_pay === undefined || !checksum) {
    console.warn('[API] Missing required fields');
    return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
  }

  // 2. 물리적 불가능 기록 필터링 (최소 30초 이상)
  if (clear_time < 30) {
    console.warn('[API] Clear time too short:', clear_time);
    return res.status(400).json({ error: '비정상적인 기록입니다.' });
  }

  // 3. 체크섬 검증 (HMAC SHA256)
  // 부동 소수점 오차 방지를 위해 문자열 포맷 통일
  const timeStr = parseFloat(clear_time).toFixed(2);
  const dataString = `${player_name}:${timeStr}:${total_overtime_pay}`;

  // 클라이언트의 Web Crypto API (UTF-8)와 일치시키기 위해 명시적 파싱
  const expectedChecksum = CryptoJS.HmacSHA256(
    CryptoJS.enc.Utf8.parse(dataString),
    CryptoJS.enc.Utf8.parse(SECRET_KEY)
  ).toString(CryptoJS.enc.Hex);

  if (checksum !== expectedChecksum) {
    console.warn(`[Security Warning] Checksum mismatch for ${player_name}`);
    console.warn(` - Received: ${checksum}`);
    console.warn(` - Expected: ${expectedChecksum}`);
    console.warn(` - Data String used: "${dataString}"`);
    console.warn(` - Key used: "${SECRET_KEY}"`);
    return res.status(403).json({
      error: '데이터 무결성 검증에 실패했습니다.',
      debug: process.env.NODE_ENV === 'development' ? { expected: expectedChecksum, usedString: dataString } : undefined
    });
  }

  // 4. 데이터 저장
  try {
    const [result] = await db.execute(
      'INSERT INTO rankings (player_name, clear_time, total_overtime_pay, checksum) VALUES (?, ?, ?, ?)',
      [player_name, clear_time, total_overtime_pay, checksum]
    );
    res.json({ success: true, rank_id: result.insertId });
  } catch (err) {
    console.error('[DB Error]', err.message);
    return res.status(500).json({ error: '기록 저장 중 오류가 발생했습니다.' });
  }
});

app.listen(PORT, () => {
  console.log(`Ranking server is running on http://localhost:${PORT}`);
});
