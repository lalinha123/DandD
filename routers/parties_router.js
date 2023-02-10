// IMPORTS
const { getRandomStr } = require('../utils/utils');
const { express, app, appSets, db } = require('../utils/common');
const fs = require('fs');
const path = require("path");


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


//----------
const getData = (user, party) => `<%- include ("default", {user: ${user}, party: ${party}}) %>`;


// * APP ROUTERS ------------------------------------------------------------------
router.get('/', (req, res) => {
    const id = req.session.userid;

    db.all(`SELECT parties.* FROM participants ` +
    `LEFT JOIN parties ON participants.partyid = parties.id WHERE userid = '${id}'`,
    (err, partiesdata) => res.render('parties', {user: req.session.user, parties: partiesdata}));
});


// CREATE NEW PARTY
router.get('/create', (req, res) => res.render('createparty', {user: req.session.user}));

router.post('/create', (req, res) => {
    db.all('SELECT id FROM parties', (err, partyids) => {
        let id;

        // this do-while below here verifies if there's any party id that matches the new one :)
        do {
            id = getRandomStr(6);
            ok = true;

            partyids.forEach(partyid => {
                if (partyid === id) {
                    ok = false;
                    return;
                }
            });

        } while (!ok)

        // if below here creates new party if there's no id repeating
        if (ok) {
            db
            .run(
                'INSERT INTO parties ' + 
                '(id, name, password, maxparticipants, minparticipants, master) VALUES ' +
                '($id, $name, $password, $maxparticipants, $minparticipants, $master)', 
                {
                    $id: id,
                    $name: req.body.name,
                    $password: req.body.password || null,
                    $maxparticipants: req.body.maxparticipants,
                    $minparticipants: req.body.minparticipants,
                    $master: req.session.user.nickname
                }, () => {
                    const party = {
                        id: id,
                        name: req.body.name,
                        password: req.body.password || null,
                        maxparticipants: req.body.maxparticipants,
                        minparticipants: req.body.minparticipants,
                        master: req.session.user.nickname
                    };
                    const data = getData(JSON.stringify(req.session.user), JSON.stringify(party));
                    fs.writeFileSync(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), data);
                }
            )
            .run('INSERT INTO participants (userid, partyid) VALUES ($userid, $partyid)',
                {
                    $userid: req.session.userid,
                    $partyid: id
                }, () => res.redirect('/parties')
            );
        }
    });
});


// ENTER PARTY
router.get('/:id', (req, res) => {
    const id = req.params.id;

    db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
        if (party) {
            res.render(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), {user: req.session.user, party: party});
        }
    });
});


// EDIT PARTY
router.get('/:id/edit', (req, res) => {
    const id = req.params.id;

    db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
        res.render('editparty', {user: req.session.user, party: party});
    });
});

router.post('/:id/edit', (req, res) => {
    const id = req.params.id;
    let query = '';

    if (req.body.name) query += `name = '${req.body.name}'`;
    if (req.body.maxparticipants) query += `, maxparticipants = ${req.body.maxparticipants}`;
    if (req.body.minparticipants) query += `, minparticipants = ${req.body.minparticipants}`;

    db.run(`UPDATE parties SET ${query} WHERE id = '${id}'`, (err) => {
        if (!err) {
            db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
                const data = getData(JSON.stringify(req.session.user), JSON.stringify(party));
                fs.writeFileSync(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), data);
                res.redirect(`/parties/${id}`);
            });
        } 

        else {
            res.render('error');
        }
    })
});


// DELETE PARTY
router.get('/:id/delete', (req, res) => {
    const id = req.params.id;

    db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, data) => {
        if (!data) {
            res.render('error');
        }

        else {
            db
            .run(`DELETE FROM parties WHERE id = '${id}'`, () => {
                fs.unlinkSync(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`));
            })
            // ! don't EVER delete this stuff below here you >>MF<<
            .run(`DELETE FROM participants WHERE partyid = '${id}'`, () => {
                    res.redirect('/parties');
            });
        }
    });
});

module.exports = router;