const { createId } = require('../utils/utils');
const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


// -------------------------------------------------------------------
// DATABASE
const sqlite = require('sqlite3');
const db = new sqlite.Database('database.db3');


// -------------------------------------------------------------------
// APP ROUTERS
router.get('/', (req, res) => {
    res.render('parties', {user: req.session.user});
});

// CREATE
router.get('/create', (req, res) => {
    res.render('createparty', {user: req.session.user});
});

router.post('/create', (req, res) => {
    db.get('SELECT id FROM parties ORDER BY id DESC LIMIT 1', (err, iddata) => {
        const id = iddata ? createId(idddata.id++) : createId(1);
        
        console.log(req.session);
    });
});

module.exports = router;