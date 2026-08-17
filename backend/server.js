const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const mssql = require('mssql');
const ExcelJS = require('exceljs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const LOCAL_FRONTEND_ORIGINS = new Set([
  FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
]);
const DB_CONNECTION = process.env.DB_CONNECTION || 'mssql';
const DB_SERVER = process.env.DB_SERVER || 'localhost';
const DB_INSTANCE = process.env.DB_INSTANCE || '';
const DB_PORT = process.env.DB_PORT || '1433';
const DB_USER = process.env.DB_USER || '';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'prc_rental_db';
const DB_ENCRYPT = process.env.DB_ENCRYPT === 'true';
const DB_TRUST_SERVER_CERTIFICATE = process.env.DB_TRUST_SERVER_CERTIFICATE === 'true';
const ALLOW_CUSTOM_ROOMS = process.env.ALLOW_CUSTOM_ROOMS === 'true';
const dataDir = path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'store.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const BUILDING_FLOORS = [
  {
    building: 'A',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1036 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2036 }] },
      { floor: 3, ranges: [{ start: 3001, end: 3036 }] },
    ],
  },
  {
    building: 'B',
    floors: [
      { floor: 1, ranges: [{ start: 101, end: 128 }] },
      { floor: 2, ranges: [{ start: 201, end: 230 }] },
      { floor: 3, ranges: [{ start: 301, end: 330 }] },
    ],
  },
  {
    building: 'C',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1018 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2018 }] },
      { floor: 3, ranges: [{ start: 3001, end: 3018 }] },
    ],
  },
  {
    building: 'D',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1024 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2024 }] },
      { floor: 3, ranges: [{ start: 3001, end: 3024 }] },
    ],
  },
  {
    building: 'E',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1024 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2024 }] },
    ],
  },
  {
    building: 'G',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1020 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2020 }] },
    ],
  },
  {
    building: 'H',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1020 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2020 }] },
      { floor: 3, ranges: [{ start: 3001, end: 3020 }] },
    ],
  },
  {
    building: 'Z',
    floors: [
      { floor: 1, ranges: [{ start: 1001, end: 1018 }] },
      { floor: 2, ranges: [{ start: 2001, end: 2019 }] },
      { floor: 3, ranges: [{ start: 3001, end: 3019 }] },
      { floor: 4, ranges: [{ start: 4001, end: 4019 }] },
      { floor: 5, ranges: [{ start: 5001, end: 5019 }] },
    ],
  },
];

const INITIAL_RECORDS = [
  { sequence: 1, building: 'A', floor: 1, room_number: 'A1001', company: 'UFA 747', note: '2024-01-01', move_in_date: '2024-01-01' },
  { sequence: 2, building: 'A', floor: 1, room_number: 'A1002', company: '', note: 'Vacant', move_in_date: null },
  { sequence: 3, building: 'B', floor: 1, room_number: 'B101', company: 'Globe Tech', note: '2024-02-01', move_in_date: '2024-02-01' },
  { sequence: 4, building: 'C', floor: 2, room_number: 'C2001', company: 'Nexa Labs', note: '2024-03-15', move_in_date: '2024-03-15' },
  { sequence: 5, building: 'Z', floor: 1, room_number: 'Z1001', company: '', note: 'Available', move_in_date: null },
];

let store = null;
let sqlPool = null;

function createDefaultStore() {
  return {
    users: [
      {
        id: 1,
        mobile: '0812345678',
        password_hash: bcrypt.hashSync('password123', 10),
        name: 'Admin User',
        created_at: new Date().toISOString(),
      },
    ],
    records: INITIAL_RECORDS.map((record) => ({
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  };
}

function loadStore() {
  if (!fs.existsSync(dataFile)) {
    store = createDefaultStore();
    fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
    return store;
  }

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  if (!data.users || !Array.isArray(data.users)) {
    data.users = [];
  }
  if (!data.records || !Array.isArray(data.records)) {
    data.records = [];
  }
  if (!data.users.length) {
    data.users = createDefaultStore().users;
  }
  if (!data.records.length) {
    data.records = createDefaultStore().records;
  }
  store = data;
  return store;
}

function saveStore() {
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function buildRoomNumber(building, floor, roomNumber) {
  const normalizedBuilding = String(building).toUpperCase();
  const roomSuffix = normalizedBuilding === 'B'
    ? String(Math.abs(roomNumber) % 100).padStart(2, '0')
    : String(Math.abs(roomNumber) % 1000).padStart(3, '0');
  return `${normalizedBuilding}${floor}${roomSuffix}`;
}

function getBuildingConfig(building) {
  return BUILDING_FLOORS.find((entry) => entry.building === building);
}

// Room numbers encode their floor (e.g. "A3037" = building A, floor 3, room 37).
// Derive the floor from the room number itself so it can't drift from a stale
// floor dropdown when a custom/free-typed room number is submitted.
function deriveFloorFromRoomNumber(building, roomNumber) {
  const normalizedBuilding = String(building).toUpperCase();
  const normalizedRoom = String(roomNumber).toUpperCase();
  if (!normalizedRoom.startsWith(normalizedBuilding)) return null;

  const rest = normalizedRoom.slice(normalizedBuilding.length);
  const suffixLength = normalizedBuilding === 'B' ? 2 : 3;
  const match = rest.match(new RegExp(`^(\\d)(\\d{${suffixLength}})$`));
  if (!match) return null;

  const floor = Number(match[1]);
  const buildingConfig = getBuildingConfig(normalizedBuilding);
  const isValidFloor = buildingConfig?.floors.some((entry) => entry.floor === floor);
  return isValidFloor ? floor : null;
}

function listRoomsFor(building, floor) {
  const config = getBuildingConfig(building);
  const floorConfig = config?.floors.find((entry) => entry.floor === Number(floor));
  if (!floorConfig) {
    return [];
  }

  const rooms = [];
  floorConfig.ranges.forEach((range) => {
    for (let roomNumber = range.start; roomNumber <= range.end; roomNumber += 1) {
      rooms.push(buildRoomNumber(building, floor, roomNumber));
    }
  });
  return rooms;
}

function normalizeRecord(data) {
  const company = typeof data.company === 'string' ? data.company.trim() : '';
  const note = typeof data.note === 'string' && data.note.trim() ? data.note.trim() : null;
  const moveInDate = data.move_in_date ? data.move_in_date : null;
  return {
    ...data,
    building: String(data.building).toUpperCase(),
    room_number: String(data.room_number).toUpperCase(),
    company: company || null,
    note,
    move_in_date: moveInDate,
  };
}

function getOccupiedRoomNumbers() {
  return new Set(
    store.records
      .filter((record) => record.company && record.company.trim())
      .map((record) => record.room_number.toUpperCase())
  );
}

function getAvailableRooms(building, floor) {
  const allRooms = listRoomsFor(building, floor);
  const occupied = getOccupiedRoomNumbers();
  return allRooms.filter((room) => !occupied.has(room));
}

function buildDashboardSummary() {
  const buildingSummaries = BUILDING_FLOORS.map((entry) => {
    const totalRooms = entry.floors.reduce((sum, floor) => sum + floor.ranges.reduce((innerSum, range) => innerSum + (range.end - range.start + 1), 0), 0);
    const occupiedRooms = store.records.filter((record) => record.building === entry.building && record.company && record.company.trim()).length;
    const vacantRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    return {
      building: entry.building,
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
    };
  });

  const occupiedRooms = store.records.filter((record) => record.company && record.company.trim()).length;
  const vacantRooms = buildingSummaries.reduce((sum, building) => sum + building.vacantRooms, 0);
  const totalRooms = buildingSummaries.reduce((sum, building) => sum + building.totalRooms, 0);
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return {
    buildings: buildingSummaries,
    metrics: {
      totalRooms,
      occupiedRooms,
      vacantRooms,
      occupancyRate,
      zones: BUILDING_FLOORS.length,
    },
  };
}

function buildFloorStructure() {
  return BUILDING_FLOORS.map((entry) => ({
    building: entry.building,
    floors: entry.floors.map((floor) => {
      const rooms = floor.ranges.flatMap((range) => {
        const items = [];
        for (let roomNumber = range.start; roomNumber <= range.end; roomNumber += 1) {
          items.push(buildRoomNumber(entry.building, floor.floor, roomNumber));
        }
        return items;
      });
      const totalRooms = rooms.length;
      return {
        floor: floor.floor,
        roomRange: `${rooms[0]}-${rooms[rooms.length - 1]}`,
        totalRooms,
      };
    }),
    totalRooms: entry.floors.reduce((sum, floor) => sum + floor.ranges.reduce((innerSum, range) => innerSum + (range.end - range.start + 1), 0), 0),
  }));
}

function buildVacantDetail() {
  return BUILDING_FLOORS.map((entry) => {
    const occupied = new Set(
      store.records
        .filter((record) => record.building === entry.building && record.company && record.company.trim())
        .map((record) => record.room_number.toUpperCase())
    );
    const allRooms = entry.floors.flatMap((floor) => listRoomsFor(entry.building, floor.floor));
    const vacantRooms = allRooms.filter((room) => !occupied.has(room));
    return {
      building: entry.building,
      vacantRooms,
    };
  }).filter((entry) => entry.vacantRooms.length);
}

function buildBuildingRoomRows(building) {
  const config = getBuildingConfig(building);
  if (!config) return [];

  const recordsByRoom = new Map(
    store.records
      .filter((record) => record.building === building)
      .map((record) => [record.room_number.toUpperCase(), record])
  );

  const rows = [];
  config.floors.forEach((floorEntry) => {
    listRoomsFor(building, floorEntry.floor).forEach((roomNumber) => {
      const record = recordsByRoom.get(roomNumber);
      const occupied = Boolean(record && record.company && record.company.trim());
      rows.push({
        roomNumber,
        floor: floorEntry.floor,
        occupied,
        company: occupied ? record.company : '',
        note: record?.note || '',
        moveInDate: record?.move_in_date || '',
      });
    });
  });
  return rows;
}

function buildTopTenants() {
  const totals = store.records.reduce((acc, record) => {
    if (!record.company || !record.company.trim()) return acc;
    const name = record.company.trim();
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([company, count]) => ({ company, roomsOccupied: count }));
}

function authenticate(req, res, next) {
  const header = req.get('Authorization');
  const tokenFromHeader = header && header.startsWith('Bearer ') ? header.slice(7) : null;
  const tokenFromCookie = req.cookies?.token;
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

function buildDbConnectionString() {
  const server = DB_INSTANCE ? `${DB_SERVER}\\${DB_INSTANCE}` : DB_SERVER;
  const encrypt = DB_ENCRYPT ? 'true' : 'false';
  const trust = DB_TRUST_SERVER_CERTIFICATE ? 'true' : 'false';

  return `Server=${server},${DB_PORT};Database=${DB_NAME};User Id=${DB_USER};Password=${DB_PASSWORD};Encrypt=${encrypt};TrustServerCertificate=${trust};`;
}

async function connectToSql() {
  const connectionString = process.env.DB_CONNECTION_STRING || buildDbConnectionString();
  if (!connectionString) {
    return null;
  }

  try {
    sqlPool = await mssql.connect(connectionString);
    // Load and run the schema SQL file to create required tables (if not present)
    try {
      const schemaPath = path.join(__dirname, 'db', 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        // Split by GO batches if present and execute each chunk
        const batches = schemaSql.split(/\bGO\b/i).map((s) => s.trim()).filter(Boolean);
        for (const batch of batches) {
          if (batch) await sqlPool.query(batch);
        }
      }
      // If users table is empty, seed a default admin user
      try {
        const countRes = await sqlPool.request().query('SELECT COUNT(*) AS cnt FROM dbo.users');
        const cnt = countRes.recordset && countRes.recordset[0] ? countRes.recordset[0].cnt : 0;
        if (!cnt) {
          const defaultMobile = '0812345678';
          const defaultPasswordHash = bcrypt.hashSync('password123', 10);
          const defaultName = 'Admin User';
          await sqlPool.request()
            .input('mobile', mssql.VarChar(20), defaultMobile)
            .input('password_hash', mssql.VarChar(255), defaultPasswordHash)
            .input('name', mssql.NVarChar(100), defaultName)
            .query('INSERT INTO dbo.users (mobile, password_hash, name) VALUES (@mobile, @password_hash, @name)');
          console.log('Seeded default admin user into dbo.users');
        }
      } catch (seedErr) {
        console.warn('Failed to seed default users:', seedErr.message);
      }
    } catch (schemaErr) {
      console.warn('Failed to apply DB schema file:', schemaErr.message);
    }
    return sqlPool;
  } catch (error) {
    console.warn('SQL Server not available, falling back to the JSON store.', error.message);
    return null;
  }
}

async function refreshStoreFromSql() {
  if (!sqlPool) return;
  const result = await sqlPool.request().query(`
    SELECT id, sequence, building, floor, room_number, company, note, move_in_date, created_at, updated_at
    FROM dbo.prc_rental_table
    ORDER BY sequence ASC
  `);
  if (!result.recordset.length) return;

  store.records = result.recordset.map((record) => ({
    ...record,
    move_in_date: record.move_in_date ? new Date(record.move_in_date).toISOString().slice(0, 10) : null,
    created_at: new Date(record.created_at).toISOString(),
    updated_at: new Date(record.updated_at).toISOString(),
  }));
  saveStore();
}

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || LOCAL_FRONTEND_ORIGINS.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { mobile, password } = req.body || {};
  if (!mobile || !password) {
    return res.status(400).json({ error: 'Mobile and password are required.' });
  }

  const user = store.users.find((entry) => entry.mobile === mobile);
  if (!user) {
    return res.status(401).json({ error: 'Invalid mobile or password.' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid mobile or password.' });
  }

  const token = jwt.sign({ id: user.id, mobile: user.mobile, name: user.name }, JWT_SECRET, { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 });
  return res.json({ token, user: { id: user.id, mobile: user.mobile, name: user.name } });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.json({ ok: true });
});

app.get('/api/dashboard/summary', authenticate, (req, res) => {
  return res.json(buildDashboardSummary());
});

app.get('/api/dashboard/floors', authenticate, (req, res) => {
  return res.json(buildFloorStructure());
});

app.get('/api/dashboard/vacant', authenticate, (req, res) => {
  return res.json(buildVacantDetail());
});

app.get('/api/dashboard/top-tenants', authenticate, (req, res) => {
  return res.json(buildTopTenants());
});

app.get('/api/rentals', authenticate, (req, res) => {
  const { building, status, q } = req.query;
  let records = [...store.records].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (building) {
    records = records.filter((record) => record.building === building);
  }
  if (status === 'occupied') {
    records = records.filter((record) => record.company && record.company.trim());
  } else if (status === 'vacant') {
    records = records.filter((record) => !record.company || !record.company.trim());
  }
  if (q) {
    const term = String(q).toLowerCase();
    records = records.filter((record) => `${record.room_number} ${record.company || ''} ${record.note || ''}`.toLowerCase().includes(term));
  }

  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 10);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return res.json({
    records: records.slice(start, end),
    total: records.length,
    page,
    pageSize,
  });
});

app.get('/api/rentals/rooms', authenticate, (req, res) => {
  const { building, floor } = req.query;
  if (!building || !floor) {
    return res.status(400).json({ error: 'Building and floor are required.' });
  }
  return res.json(getAvailableRooms(String(building).toUpperCase(), Number(floor)));
});

app.post('/api/rentals', authenticate, async (req, res) => {
  const payload = normalizeRecord(req.body || {});
  if (!payload.building || !payload.floor || !payload.room_number) {
    return res.status(400).json({ error: 'Building, floor and room number are required.' });
  }

  const buildingConfig = getBuildingConfig(payload.building.toUpperCase());
  if (!buildingConfig) {
    return res.status(400).json({ error: 'Unsupported building.' });
  }

  const derivedFloor = deriveFloorFromRoomNumber(payload.building.toUpperCase(), payload.room_number.toUpperCase());
  if (derivedFloor !== null) {
    payload.floor = derivedFloor;
  }

  if (!buildingConfig.floors.some((entry) => entry.floor === Number(payload.floor))) {
    return res.status(400).json({ error: 'The selected floor is not valid for this building.' });
  }

  const roomNumbers = listRoomsFor(payload.building.toUpperCase(), Number(payload.floor));
  if (!roomNumbers.includes(payload.room_number.toUpperCase())) {
    if (!ALLOW_CUSTOM_ROOMS) {
      return res.status(400).json({ error: 'The room number does not match the selected building and floor.' });
    }
    // when custom rooms allowed, accept and continue
  }

  const occupiedRoomNumbers = getOccupiedRoomNumbers();
  if (occupiedRoomNumbers.has(payload.room_number.toUpperCase())) {
    return res.status(409).json({ error: 'This room is already occupied.' });
  }

  const existingRecord = store.records.find((entry) => entry.room_number.toUpperCase() === payload.room_number.toUpperCase());
  if (existingRecord) {
    const updatedRecord = {
      ...existingRecord,
      building: payload.building.toUpperCase(),
      floor: Number(payload.floor),
      company: payload.company || null,
      note: payload.note || null,
      move_in_date: payload.move_in_date || null,
      updated_at: new Date().toISOString(),
    };

    if (sqlPool) {
      try {
        const result = await sqlPool.request()
          .input('id', mssql.Int, existingRecord.id)
          .input('building', mssql.VarChar(5), updatedRecord.building)
          .input('floor', mssql.Int, updatedRecord.floor)
          .input('company', mssql.NVarChar(255), updatedRecord.company)
          .input('note', mssql.NVarChar(255), updatedRecord.note)
          .input('move_in_date', mssql.Date, updatedRecord.move_in_date)
          .query(`
            UPDATE dbo.prc_rental_table
            SET building = @building, floor = @floor, company = @company, note = @note,
                move_in_date = @move_in_date, updated_at = GETDATE()
            OUTPUT INSERTED.updated_at
            WHERE id = @id
          `);
        updatedRecord.updated_at = new Date(result.recordset[0].updated_at).toISOString();
      } catch (_error) {
        return res.status(500).json({ error: 'Unable to update the rental record.' });
      }
    }

    Object.assign(existingRecord, updatedRecord);
    saveStore();
    return res.status(200).json({ record: existingRecord });
  }

  const nextSequence = Math.max(0, ...store.records.map((record) => Number(record.sequence || 0))) + 1;
  const record = {
    id: Date.now(),
    sequence: nextSequence,
    building: payload.building.toUpperCase(),
    floor: Number(payload.floor),
    room_number: payload.room_number.toUpperCase(),
    company: payload.company || null,
    note: payload.note || null,
    move_in_date: payload.move_in_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (sqlPool) {
    try {
      const result = await sqlPool.request()
        .input('sequence', mssql.Int, record.sequence)
        .input('building', mssql.VarChar(5), record.building)
        .input('floor', mssql.Int, record.floor)
        .input('room_number', mssql.VarChar(20), record.room_number)
        .input('company', mssql.NVarChar(255), record.company)
        .input('note', mssql.NVarChar(255), record.note)
        .input('move_in_date', mssql.Date, record.move_in_date)
        .query(`
          INSERT INTO dbo.prc_rental_table (sequence, building, floor, room_number, company, note, move_in_date)
          OUTPUT INSERTED.id, INSERTED.created_at, INSERTED.updated_at
          VALUES (@sequence, @building, @floor, @room_number, @company, @note, @move_in_date)
        `);
      Object.assign(record, result.recordset[0], {
        created_at: new Date(result.recordset[0].created_at).toISOString(),
        updated_at: new Date(result.recordset[0].updated_at).toISOString(),
      });
    } catch (error) {
      if (error.number === 2627 || error.number === 2601) {
        return res.status(409).json({ error: 'This room already exists.' });
      }
      return res.status(500).json({ error: 'Unable to save the rental record.' });
    }
  }

  store.records.push(record);
  saveStore();
  return res.status(201).json({ record });
});

// Registered before the /api/rentals/:id route below — otherwise Express
// would match "export" as an :id and shadow this route with a 404.
const EXPORT_COLORS = {
  headerFill: 'FF5B2D8E',
  headerText: 'FFFFFFFF',
  titleFill: 'FFF5F0FA',
  titleText: 'FF5B2D8E',
  totalFill: 'FFE6D9F5',
  totalText: 'FF5B2D8E',
  good: 'FF0CA30C',
  warning: 'FFD98A00',
  critical: 'FFD03B3B',
  occupiedFill: 'FFEAF7EA',
  vacantFill: 'FFFCEEEE',
  border: 'FFE1D9EE',
};

function occupancyStatusArgb(rate) {
  if (rate >= 85) return EXPORT_COLORS.good;
  if (rate >= 50) return EXPORT_COLORS.warning;
  return EXPORT_COLORS.critical;
}

function styleTitleBar(worksheet, row, span, text) {
  worksheet.mergeCells(row, 1, row, span);
  const cell = worksheet.getCell(row, 1);
  cell.value = text;
  cell.font = { bold: true, size: 13, color: { argb: EXPORT_COLORS.titleText } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPORT_COLORS.titleFill } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(row).height = 24;
}

function styleHeaderRow(worksheet, row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: EXPORT_COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPORT_COLORS.headerFill } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  row.height = 20;
}

function styleTotalBar(worksheet, row, span, text) {
  worksheet.mergeCells(row, 1, row, span);
  const cell = worksheet.getCell(row, 1);
  cell.value = text;
  cell.font = { bold: true, color: { argb: EXPORT_COLORS.totalText } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXPORT_COLORS.totalFill } };
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(row).height = 22;
}

app.get('/api/rentals/export', authenticate, async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const summary = buildDashboardSummary();

  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { key: 'building', width: 14 },
    { key: 'totalRooms', width: 14 },
    { key: 'occupiedRooms', width: 16 },
    { key: 'vacantRooms', width: 14 },
    { key: 'occupancyRate', width: 16 },
  ];
  styleTitleBar(summarySheet, 1, 5, 'PRC Rental — Occupancy Summary');
  summarySheet.addRow(['Building', 'Total Rooms', 'Occupied Rooms', 'Vacant Rooms', 'Occupancy %']);
  styleHeaderRow(summarySheet, summarySheet.getRow(2));
  summary.buildings.forEach((entry) => {
    const row = summarySheet.addRow([entry.building, entry.totalRooms, entry.occupiedRooms, entry.vacantRooms, `${entry.occupancyRate}%`]);
    row.getCell(5).font = { bold: true, color: { argb: occupancyStatusArgb(entry.occupancyRate) } };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(1).alignment = { horizontal: 'center' };
  });
  styleTotalBar(
    summarySheet,
    summarySheet.lastRow.number + 1,
    5,
    `Total ${summary.metrics.totalRooms} rooms · ${summary.metrics.occupiedRooms} occupied · ${summary.metrics.vacantRooms} vacant · ${summary.metrics.occupancyRate}% occupancy`
  );
  summarySheet.views = [{ state: 'frozen', ySplit: 2 }];

  BUILDING_FLOORS.forEach((entry) => {
    const rows = buildBuildingRoomRows(entry.building);
    const occupiedCount = rows.filter((room) => room.occupied).length;
    const totalCount = rows.length;
    const occupancyRate = totalCount ? Math.round((occupiedCount / totalCount) * 100) : 0;

    const sheet = workbook.addWorksheet(`Building ${entry.building}`);
    sheet.columns = [
      { key: 'no', width: 6 },
      { key: 'roomNumber', width: 16 },
      { key: 'floor', width: 8 },
      { key: 'status', width: 12 },
      { key: 'company', width: 28 },
      { key: 'note', width: 30 },
      { key: 'moveInDate', width: 16 },
    ];

    styleTitleBar(sheet, 1, 7, `Building ${entry.building} — Rooms`);
    sheet.addRow(['No.', 'Room Number', 'Floor', 'Status', 'Company / Tenant', 'Note', 'Move-in Date']);
    styleHeaderRow(sheet, sheet.getRow(2));

    rows.forEach((room, index) => {
      const row = sheet.addRow([
        index + 1,
        room.roomNumber,
        room.floor,
        room.occupied ? 'Occupied' : 'Vacant',
        room.company,
        room.note,
        room.moveInDate,
      ]);
      const statusCell = row.getCell(4);
      statusCell.font = { bold: true, color: { argb: room.occupied ? EXPORT_COLORS.good : EXPORT_COLORS.critical } };
      statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: room.occupied ? EXPORT_COLORS.occupiedFill : EXPORT_COLORS.vacantFill } };
      statusCell.alignment = { horizontal: 'center' };
      row.getCell(1).alignment = { horizontal: 'center' };
      row.getCell(3).alignment = { horizontal: 'center' };
    });

    styleTotalBar(
      sheet,
      sheet.lastRow.number + 1,
      7,
      `Total ${totalCount} rooms · ${occupiedCount} occupied · ${totalCount - occupiedCount} vacant · ${occupancyRate}% occupancy`
    );
    sheet.views = [{ state: 'frozen', ySplit: 2 }];
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=prc_rental_records.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

app.get('/api/rentals/:id', authenticate, (req, res) => {
  const record = store.records.find((entry) => String(entry.id) === String(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'Rental record not found.' });
  }
  return res.json({ record });
});

app.put('/api/rentals/:id', authenticate, async (req, res) => {
  const record = store.records.find((entry) => String(entry.id) === String(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'Rental record not found.' });
  }

  const payload = normalizeRecord({ ...record, ...req.body, building: record.building, room_number: record.room_number });
  const updatedRecord = {
    ...record,
    company: payload.company || null,
    note: payload.note || null,
    move_in_date: payload.move_in_date || null,
    updated_at: new Date().toISOString(),
  };

  if (sqlPool) {
    try {
      const result = await sqlPool.request()
        .input('id', mssql.Int, record.id)
        .input('company', mssql.NVarChar(255), updatedRecord.company)
        .input('note', mssql.NVarChar(255), updatedRecord.note)
        .input('move_in_date', mssql.Date, updatedRecord.move_in_date)
        .query(`
          UPDATE dbo.prc_rental_table
          SET company = @company, note = @note, move_in_date = @move_in_date, updated_at = GETDATE()
          OUTPUT INSERTED.updated_at
          WHERE id = @id
        `);
      if (result.recordset[0]) {
        updatedRecord.updated_at = new Date(result.recordset[0].updated_at).toISOString();
      }
    } catch (_error) {
      return res.status(500).json({ error: 'Unable to update the rental record.' });
    }
  }

  Object.assign(record, updatedRecord);
  saveStore();
  return res.status(200).json({ record });
});

app.delete('/api/rentals/:id', authenticate, async (req, res) => {
  const index = store.records.findIndex((entry) => String(entry.id) === String(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Rental record not found.' });
  }

  if (sqlPool) {
    try {
      await sqlPool.request()
        .input('id', mssql.Int, store.records[index].id)
        .query('DELETE FROM dbo.prc_rental_table WHERE id = @id');
    } catch (_error) {
      return res.status(500).json({ error: 'Unable to delete the rental record.' });
    }
  }

  store.records.splice(index, 1);
  saveStore();
  return res.status(204).send();
});

loadStore();

async function startServer() {
  await connectToSql();
  await refreshStoreFromSql();
  app.listen(PORT, () => {
    console.log(`PRC Rental API running on http://localhost:${PORT}`);
  });
}

startServer();
module.exports = app;
