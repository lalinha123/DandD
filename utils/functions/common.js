const { genid } = require(__dirname + '/misc');

// ------ OTHERS
const path = require('path');


// ------ SQLITE
const sqlite = require('better-sqlite3');
const db = sqlite(path.join(__dirname, '..', '..', 'dnd.db'));

db.pragma('journal_mode = WAL');


// ------ EXPRESS
const express = require('express');
const app = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true}));


// ------ SESSION
const session = require('express-session');

app.set('trust proxy', 1);
app.use(session({
    id: genid(30),
    secret: 'sarnas mustache',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}))


module.exports = { db, express, app, session };