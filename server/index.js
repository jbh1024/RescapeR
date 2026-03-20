require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const CryptoJS = require('crypto-js');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.RANKING_SECRET_KEY;

if (!SECRET_KEY) {
  console.error('[FATAL] RANKING_SECRET_KEY 환경변수가 설정되지 않았습니다. 서버를 시작할 수 없습니다.');
  process.exit(1);
}

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8000', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting
const submitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const queryLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: '너무 많은 요청입니다. 잠시 후 다시 시도하세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 랭킹 조회 (Top 10)
app.get('/rescaper-api/rankings', queryLimiter, async (req, res) => {
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
app.post('/rescaper-api/rankings', submitLimiter, async (req, res) => {
  const { player_name, clear_time, total_overtime_pay } = req.body;

  // 1. 필수 값 검증
  if (!player_name || clear_time === undefined || total_overtime_pay === undefined) {
    return res.status(400).json({ error: '필수 데이터가 누락되었습니다.' });
  }

  // 2. player_name 검증 (XSS 방지 + 길이 제한)
  if (typeof player_name !== 'string' || player_name.length === 0 || player_name.length > 10) {
    return res.status(400).json({ error: '사원명은 1~10자여야 합니다.' });
  }
  if (/<[^>]*>/.test(player_name)) {
    return res.status(400).json({ error: '사원명에 HTML 태그를 사용할 수 없습니다.' });
  }

  // 3. clear_time 타입/범위 검증
  const parsedTime = parseFloat(clear_time);
  if (!Number.isFinite(parsedTime) || parsedTime < 30 || parsedTime > 86400) {
    return res.status(400).json({ error: '비정상적인 기록입니다.' });
  }

  // 4. total_overtime_pay 타입/범위 검증
  const parsedPay = parseInt(total_overtime_pay, 10);
  if (!Number.isInteger(parsedPay) || parsedPay < 0 || parsedPay > 999999) {
    return res.status(400).json({ error: '야근수당이 유효하지 않습니다.' });
  }

  // 5. 서버에서 체크섬 생성 (데이터 무결성 서명)
  const timeStr = parsedTime.toFixed(2);
  const payStr = parsedPay.toString();
  const dataString = `${player_name}:${timeStr}:${payStr}`;

  const checksum = CryptoJS.HmacSHA256(
    CryptoJS.enc.Utf8.parse(dataString),
    CryptoJS.enc.Utf8.parse(SECRET_KEY)
  ).toString(CryptoJS.enc.Hex);

  // 6. 데이터 저장 (파싱된 값 사용)
  try {
    const [result] = await db.execute(
      'INSERT INTO rankings (player_name, clear_time, total_overtime_pay, checksum) VALUES (?, ?, ?, ?)',
      [player_name, parsedTime, parsedPay, checksum]
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
