const mysql = require('mysql');
const config = require('./config');

const db = mysql.createConnection({
    host     : config.db.host,
    user     : config.db.username,
    password : config.db.password,
    database : config.db.database}
    );
console.log(config.db);
module.exports = db;

