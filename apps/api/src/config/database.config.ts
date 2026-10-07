const username = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASS || '1234';
const name = process.env.DB_NAME || 'expressjs';
const host = process.env.DB_HOST || 'localhost';
const port = (process.env.DB_PORT || 5432) as number;
const url = `postgresql://${username}:${password}@${host}:${port}/${name}`;
const ssl = process.env.DB_USE_SSL ? process.env.DB_USE_SSL.toLowerCase() === 'true' : false;

export default { url, username, password, name, host, port, ssl };
