// IMPORTS
const { getRandomStr } = require('../utils/utils');
const { express, app, appSets, db} = require('../utils/common');
const fs = require('fs');
const path = require("path");


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


// useful functions (file wide)
const getPartyData = id => db.prepare('SELECT * FROM parties WHERE id = ?').get(id);

const getLink = (partyid, userid) => db.prepare(
    `SELECT * FROM participants WHERE partyid = ? AND userid = ?`
).get(partyid, userid);

const checkFormData = (url, func1, func2, func3, func4) => {
    const min = Number(url.minparticipants);
    const max = Number(url.maxparticipants);
    const name = url.name;

    if (min > max) {
        func1();
    }

    else if (min <= 1 || max <= 1) {
        func2();
    }

    else if (!name) {
        func3();
    }

    else {
        func4();
    }
}


// * APP ROUTERS ------------------------------------------------------------------
router.get('/', (req, res) => {
    const userid = req.session.userid;

    if (userid) {
        const partiesdata = db.prepare(
            `SELECT parties.* FROM participants ` +
            `LEFT JOIN parties ON participants.partyid = parties.id WHERE userid = ?`
        ).all(userid);
        
        res.render('parties', {
            user: req.session.user,
            parties: partiesdata
        })
    }

    else {
        res.redirect('/login');
    }
});


// CREATE NEW PARTY
router.get('/create', (req, res) => {
    if (req.session.user) {
        res.render('createparty', { user: req.session.user, msg: null })
    }

    else {
        res.redirect('/login');
    }
});


router.post('/create', (req, res) => {
    const sendMessage = msg => res.render('createparty', {user: req.session.user, msg: msg});

    checkFormData(req.body, 
        () => sendMessage("Pls insert valid participants' number"),
        () => sendMessage("The party should have at least 2 participants (including you)!!"),
        () => sendMessage("Pls insert a name"),
        () => {
            let id = '';
        
            do {
                id = getRandomStr(6);
                ok = true;

                const partyids = db.prepare('SELECT id FROM parties').all();
        
                partyids.forEach(partyid => {
                    if (partyid === id) {
                        ok = false;
                        return;
                    }
                });
        
            } while (!ok)
        
        
            if (ok) {
                // CREATES PARTY
                db.prepare(
                    'INSERT INTO parties (id, name, password, maxparticipants, ' +
                    'minparticipants, master) VALUES (?, ?, ?, ?, ?, ?)'
                ).run(
                    id,
                    req.body.name,
                    req.body.password || null,
                    req.body.maxparticipants,
                    req.body.minparticipants,
                    req.session.user.nickname
                );

                // CREATES PARTY FILE
                const party = getPartyData(id);
                const data = `<%- include ("default", { user: ${JSON.stringify(req.session.user)}, party: ${JSON.stringify(party)} }) %>`;

                fs.writeFileSync(
                    path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), data
                );
                

                // CREATES LINK BETWEEN PARTY AND USER
                db.prepare(
                    'INSERT INTO participants (userid, partyid, userrole) ' +
                    'VALUES (?, ?, ?)'
                ).run(req.session.userid, id, 'master');
                
                // FUNCTION'S END
                res.redirect('/parties');
            }
        }
    );
});


// ENTER PARTY
router.get('/:id', (req, res) => {
    const id = req.params.id;

    if (req.session.user) {
        const party = getPartyData(id);

        if (party) {
            if (party.password) {
                res.render(
                    path.join(__dirname, "..", "views", "parties_files", `joinparty.ejs`),
                    { user: req.session.user, party: party }
                );
            }

            else {
                const link = getLink(id, req.session.userid);

                if (link) {
                    res.render(
                        path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                        {
                            party: party,
                            userrole: link.userrole,
                            session: req.session
                        }
                    );
                }
            
                else {
                    if (req.session.user) {
                        const userrole = 'player only';

                        db.prepare(
                            `INSERT INTO participants (userid, partyid, userrole) ` + 
                            `VALUES (?, ?, ?)`
                        ).run(req.session.userid, id, userrole);
                        
                        res.render(
                            path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                            {
                                user: req.session.user,
                                party: party,
                                userrole: userrole
                            }
                        );
                    }
        
                    else {
                        res.render(
                            path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`),
                            { user: null, party: party, userrole: null }
                        );
                    }
                }
            }
        }

        else {
            res.render('error');
        }
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
    const party = getPartyData(id);

    if (party) {
        if (req.session.user) {
            const link = getLink(id, req.session.userid);

            if (link) {
                if (link.userrole === 'master' || link.userrole === 'manager') {
                    res.render('editparty', 
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
                
        else {
            res.redirect('/login');
        }
    }

    else {
        res.render('error');
    }
});

router.post('/:id/edit', (req, res) => {
    const id = req.params.id;
    let query = '';

    const sendMessage = msg => {
        const party = db.prepare(
            `SELECT parties.*, participants.userrole FROM parties LEFT JOIN ` +
            `participants ON parties.id = participants.partyid WHERE parties.id = ?`
        ).get(id);

        res.render('editparty', 
        {
            user: req.session.user,
            party: party,
            msg: msg,
            userrole: party.userrole,
        });
    }

    checkFormData(req.body, 
        () => sendMessage("Pls insert valid participants' number"),
        () => sendMessage("The party should have at least 2 participants (including you)!!"),
        () => sendMessage("Pls insert a name"),
        () => {
            const min = Number(req.body.minparticipants);
            const max = Number(req.body.maxparticipants);
            const name = req.body.name;

            // CREATES QUERY
            if (name) query += `name = '${req.body.name}'`;
            if (max) query += `, maxparticipants = ${max}`;
            if (min) query += `, minparticipants = ${min}`;

            console.log(query)

            // UPDATES TABLE
            db.prepare(`UPDATE parties SET ${query} WHERE id = ?`).run(id);
        
            // UPDATES PARTY'S FILE
            const party = getPartyData(id);
            const data = `<%- include ("default", { user: ${JSON.stringify(req.session.user)}, party: ${JSON.stringify(party)} }) %>`;;

            fs.writeFileSync(
                path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), data
            );

            res.redirect(`/parties/${id}`);
        }
    );
});


// DELETE PARTY
router.get('/:id/delete', (req, res) => {
    const id = req.params.id;
    const party = getPartyData(id);

    if (!party) {
        res.render('error');
    }

    else {
        if (req.session.user) {
            const link = getLink(id, req.session.userid);

            if (link && link.userrole === 'master') {
                db.prepare(`DELETE FROM participants WHERE partyid = ?`).run(id);
                db.prepare(`DELETE FROM parties WHERE id = ?`).run(id);
                res.redirect('/parties');
            }

            else {
                res.redirect(`/parties/${id}`);
            }
        }

        else {
            res.redirect('/login');
        }
    }
});


//ESPORTS
module.exports = router;