// VARIABLES
const express = require('express');
const app = express();


// APP SETTINGS
const appSets = app => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(__dirname + '/public'));
    app.set('view engine', 'ejs');
}


// DATABASE
const db = require('better-sqlite3')('database.db3');
db.pragma('journal_mode = WAL');


// EXPORTS
module.exports = {
    express,
    app,
    appSets,
    db
}