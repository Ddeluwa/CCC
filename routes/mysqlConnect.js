const mysql = require('mysql');
const vals = require('./constant.js');

const pool = mysql.createPool({
    host: vals.DBHost, 
    port: vals.DBPort,
    user: vals.DBUser,
    password: vals.DBPass,
    database: DBname
});

connection.connect();

connection.query('SELECT * from user', function(error, rows, fields){
    if (error) throw error;
    console.log(rows);
    console.log('MYSQL Connection Complete!')
});

module.exports = mysqlConnect;