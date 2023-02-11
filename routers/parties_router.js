// IMPORTS
const { getRandomStr } = require('../utils/utils');
const { express, app, appSets, db } = require('../utils/common');
const fs = require('fs');
const path = require("path");


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


// useful function (globaly wide)
const getData = (user, party) => `<%- include ("default", {user: ${user}, party: ${party}}) %>`;


// * APP ROUTERS ------------------------------------------------------------------
router.get('/', (req, res) => {
    const id = req.session.userid;

    if (id) {
        db.all(
            `SELECT parties.* FROM participants ` +
            `LEFT JOIN parties ON participants.partyid = parties.id WHERE userid = '${id}'`,
            (err, partiesdata) => res.render('parties', {user: req.session.user, parties: partiesdata})
        );
    }

    else {
        res.redirect('/login');
    }
});


// CREATE NEW PARTY
router.get('/create', (req, res) => res.render('createparty', {user: req.session.user}));

router.post('/create', (req, res) => {
    db.all('SELECT id FROM parties', (err, partyids) => {
        let id = '';

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

                    const data = getData(
                        JSON.stringify(req.session.user), 
                        JSON.stringify(party)
                    );

                    fs.writeFileSync(
                        path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                        data
                    );
                }
            )
            .run(
                'INSERT INTO participants (userid, partyid, userrole) ' +
                'VALUES ($userid, $partyid, $userrole)',
                {
                    $userid: req.session.userid,
                    $partyid: id,
                    $userrole: 'master',
                }, () => res.redirect('/parties')
            );
        }
    });
});


// ENTER PARTY
router.get('/:id', (req, res) => {
    const id = req.params.id;

    const checkUser = (ok, party) => {
        if (ok) {
            db.get(
                `SELECT userrole FROM participants WHERE partyid = '${party.id}' ` + 
                `AND userid = '${req.session.userid}'`, (err, data) => {
                    if (data) {
                        res.render(
                            path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                            {user: req.session.user, party: party, userrole: data.userrole}
                        );
                    }
    
                    else {
                        if (req.session.user) {
                            const userrole = 'player only';

                            db.run(
                                `INSERT INTO participants (userid, partyid, userrole) ` + 
                                `VALUES ($userid, $partyid, $userrole)`,
                                {
                                    $userid: req.session.userid,
                                    $partyid: id,
                                    $userrole: userrole
                                }, () => {
                                    res.render(
                                        path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                                        {user: req.session.user, party: party, userrole: userrole}
                                    );
                                }
                            );
                        }

                        else {
                            res.render(
                                path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                                {user: null, party: party, userrole: null}
                            );
                        }
                    }
                }
            );
        }
    }

    if (req.session.user) {
        db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
            if (party) {
                if (party.password) {
                    res.render(
                        path.join(__dirname, "..", "views", "parties_files", `joinparty.ejs`),
                        {user: req.session.user, party: party}
                    );
                }

                else {
                    checkUser(true, party);
                }
            }

            else {
                res.render('error');
            }
        });
    }

    else {
        res.redirect('/login');
    }
});


// JOIN PARTY
/* TODO:
    - add GET handling (with password) for:
        - when user has already entered the party
        - when user hasn't entered the party already
    Obs: 'joinparty' -> first file path; 'parties' -> following file path
*/


// EDIT PARTY
router.get('/:id/edit', (req, res) => {
    const id = req.params.id;

    db.get(
        `SELECT * FROM parties WHERE id = '${id}'`,
        (err, party) => {
            if (party) {
                if (req.session.user) {
                    db.get(
                        `SELECT userrole FROM participants WHERE partyid = '${id}' ` +
                        `AND userid = '${req.session.userid}'`, (err, link) => {
                            if (link) {
                                if (link.uerrole === 'master' || link.userrole === 'manager') {
                                    res.render(
                                        'editparty', 
                                        {
                                            user: req.session.user,
                                            party: party, msg: '',
                                            userrole: link.userrole
                                        }
                                    );
                                }

                                else {
                                    res.redirect(`/parties/${id}`)
                                }
                            }

                            else {
                                res.redirect(`/parties/${id}`);
                            }
                        }
                    );
                }
                
                else {
                    res.redirect('/login');
                }
            }

            else {
                res.render('error');
            }
        }
    );
});

router.post('/:id/edit', (req, res) => {
    const id = req.params.id;
    let query = '';
    let msg = '';

    const max = req.body.maxparticipants;
    const min = req.body.minparticipants;

    const render = msg => res.render(
        'editparty', {
            user: req.session.user,
            party: party, msg: msg
        }
    );

    const sendMessage = msg => {
        db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
            res.render('editparty', 
            {
                user: req.session.user,
                party: party,
                msg: msg
            });
        });
    }

    if (min > max) {
        sendMessage("Pls insert valid data at participants' field(s)");
    }

    else if (max <= 1) {
        sendMessage("The party should have at least 2 participants (including you)!!");
    }

    else {
        if (req.body.name) query += `name = '${req.body.name}'`;
        if (max) query += `, maxparticipants = ${max}`;
        if (min) query += `, minparticipants = ${min}`;
    
        db.run(`UPDATE parties SET ${query} WHERE id = '${id}'`, (err) => {
            if (!err) {
                db.get(`SELECT * FROM parties WHERE id = '${id}'`, (err, party) => {
                    const data = getData(
                        JSON.stringify(req.session.user), JSON.stringify(party)
                    );

                    fs.writeFileSync(
                        path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                        data
                    );

                    res.redirect(`/parties/${id}`);
                });
            } 
    
            else {
                res.render('error');
            }
        });    
    }
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
                fs.unlinkSync(
                    path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`)
                );
            })
            .run(`DELETE FROM participants WHERE partyid = '${id}'`, () => {
                    res.redirect('/parties');
            });
        }
    });
});


//ESPORTS
module.exports = router;