const { createId } = require('../utils/utils');
const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


// * -------------------------------------------------------------------
// DATABASE
const sqlite = require('sqlite3');
const db = new sqlite.Database('database.db3');


// * -------------------------------------------------------------------
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
        const idLength = 5;
        const id = iddata ? createId(Number(iddata.id) + 1, idLength) : createId(1, idLength);

        db.serialize(() => {
            db.run('INSERT INTO parties (id, name, password, maxparticipants, minparticipants, masterid) VALUES ($id, $name, $password, $maxparticipants, $minparticipants, $masterid)',
            {
                $id: id,
                $name: req.body.name,
                $password: req.body.password || null,
                $maxparticipants: req.body.maxparticipants,
                $minparticipants: req.body.minparticipants,
                $masterid: req.session.userid
            }).get('SELECT parties FROM users WHERE id = $id', {$id: req.session.userid}, (err, data) => {
                const parties = JSON.stringify(data.parties) !== 'null' ? data.parties + `,${id}` : id;
                console.log(parties);

                db.run('UPDATE users SET parties = $parties WHERE id = $id', {$parties: parties, $id: req.session.userid}, () => {
                    console.log(parties);
                });
            });
        });
    });
});

module.exports = router;