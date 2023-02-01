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
const sqlite = require('sqlite3');
const db = new sqlite.Database('database.db3');

// EXPORTS
module.exports = {
    express,
    app,
    appSets,
    db
}