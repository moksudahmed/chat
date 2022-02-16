const Pool = require('pg');
export const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'api_test',
  password: 'root',
  port: 5432,
})

