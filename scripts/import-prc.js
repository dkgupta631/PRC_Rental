const fs = require('fs');
const path = require('path');
const ExcelJS = require('../backend/node_modules/exceljs');
const mssql = require('../backend/node_modules/mssql');
require('../backend/node_modules/dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });

const workbookPath = process.argv[2];
const buildings = new Set(['A', 'B', 'C', 'D', 'E', 'G', 'H', 'Z']);
const allRooms = [
  ['A', 1001, 1036], ['A', 2001, 2036], ['A', 3001, 3036],
  ['B', 101, 128], ['B', 201, 230], ['B', 301, 330],
  ['C', 1001, 1018], ['C', 2001, 2018], ['C', 3001, 3018],
  ['D', 1001, 1024], ['D', 2001, 2024], ['D', 3001, 3024],
  ['E', 1001, 1024], ['E', 2001, 2024], ['G', 1001, 1020], ['G', 2001, 2020],
  ['H', 1001, 1020], ['H', 2001, 2020], ['H', 3001, 3020],
  ['Z', 1001, 1018], ['Z', 2001, 2019], ['Z', 3001, 3019], ['Z', 4001, 4019], ['Z', 5001, 5019],
].flatMap(([building, start, end]) => Array.from({ length: end - start + 1 }, (_, index) => `${building}${start + index}`));

function text(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim();
}

function floorFor(room) {
  return Number(room.slice(1, room[0] === 'B' ? 2 : 1));
}

async function main() {
  if (!workbookPath || !fs.existsSync(workbookPath)) {
    throw new Error('Provide the path to the PRC workbook. Example: npm run import:prc -- "C:\\path\\to\\file.xlsx"');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const sheet = workbook.getWorksheet('PRC');
  if (!sheet) throw new Error('The workbook does not contain a worksheet named "PRC".');

  const imported = new Map();
  sheet.eachRow((row) => {
    const room = text(row.getCell(2).value).toUpperCase();
    const match = room.match(/^([A-Z])(\d+)$/);
    if (!match || !buildings.has(match[1])) return;
    const note = text(row.getCell(4).value);
    imported.set(room, {
      building: match[1],
      floor: floorFor(room),
      room_number: room,
      company: text(row.getCell(3).value) || null,
      note: note || null,
      move_in_date: /^\d{4}-\d{2}-\d{2}$/.test(note) ? note : null,
    });
  });

  allRooms.forEach((room) => {
    if (!imported.has(room)) {
      imported.set(room, { building: room[0], floor: floorFor(room), room_number: room, company: null, note: null, move_in_date: null });
    }
  });

  const records = [...imported.values()].sort((a, b) => allRooms.indexOf(a.room_number) - allRooms.indexOf(b.room_number)).map((record, index) => ({
    ...record,
    sequence: index + 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  if (records.length !== allRooms.length) throw new Error('Import validation failed: room list is incomplete.');

  const connectionString = process.env.DB_CONNECTION_STRING || `Server=${process.env.DB_SERVER || 'localhost'}${process.env.DB_INSTANCE ? `\\${process.env.DB_INSTANCE}` : ''},${process.env.DB_PORT || '1433'};Database=${process.env.DB_NAME || 'prc_rental_db'};User Id=${process.env.DB_USER || ''};Password=${process.env.DB_PASSWORD || ''};Encrypt=${process.env.DB_ENCRYPT === 'true'};TrustServerCertificate=${process.env.DB_TRUST_SERVER_CERTIFICATE === 'true'};`;
  const pool = await mssql.connect(connectionString);
  const transaction = new mssql.Transaction(pool);
  await transaction.begin();
  try {
    await new mssql.Request(transaction).query('DELETE FROM dbo.prc_rental_table');
    for (const record of records) {
      await new mssql.Request(transaction)
        .input('sequence', mssql.Int, record.sequence)
        .input('building', mssql.VarChar(5), record.building)
        .input('floor', mssql.Int, record.floor)
        .input('room_number', mssql.VarChar(20), record.room_number)
        .input('company', mssql.NVarChar(255), record.company)
        .input('note', mssql.NVarChar(255), record.note)
        .input('move_in_date', mssql.Date, record.move_in_date)
        .query('INSERT INTO dbo.prc_rental_table (sequence, building, floor, room_number, company, note, move_in_date) VALUES (@sequence, @building, @floor, @room_number, @company, @note, @move_in_date)');
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await pool.close();
  }

  const storePath = path.join(__dirname, '..', 'backend', 'data', 'store.json');
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  store.records = records;
  fs.writeFileSync(storePath, JSON.stringify(store, null, 2));
  console.log(`Imported ${records.length} rooms into dbo.prc_rental_table and backend/data/store.json.`);
}

main().catch((error) => {
  console.error(`Import failed: ${error.message}`);
  process.exit(1);
});
