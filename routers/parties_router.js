/*
    TODO:
    [x] Add join link
    [ ] Add AJAX on EJS
    [x] Fix link after logging in (link to the previous page)
    [ ] Check if currentpass is the party's one

*/

// IMPORTS
const { getRandomStr, createId } = require('../utils/utils');
const { express, app, appSets, db} = require('../utils/common');
const fs = require('fs');
const path = require("path");


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


// useful functions (file wide)
const getPartyData = id => db.prepare('SELECT * FROM parties WHERE id = ?').get(id);

const getLinkData = (partyid, userid) => db.prepare(
    `SELECT * FROM links WHERE partyid = ? AND userid = ?`
).get(partyid, userid);

const checkFormData = (url, func1, func2, func3, func4) => {
    const min = Number(url.minparticipants);
    const max = Number(url.maxparticipants);
    const name = url.name;

    if (min > max) func1();
    else if (min <= 1 || max <= 1) func2();
    else if (!name) func3();
    else func4();
};

const checkLoginData = (req, res, party, func1, func2) => {
    if (req.session.user) {
        func1();
        party ? func2() : res.render('error');
    }

    else res.redirect('/login');
};


// * APP ROUTERS ------------------------------------------------------------------
router.get('/', (req, res) => {
    const userid = req.session.userid;

    if (userid) {
        const partiesdata = db.prepare(
            `SELECT parties.* FROM links ` +
            `LEFT JOIN parties ON links.partyid = parties.id WHERE userid = ?`
        ).all(userid);
        
        res.render('parties', {
            user: req.session.user,
            parties: partiesdata
        })
    }

    else res.redirect('/login');
});


// CREATE NEW PARTY
router.get('/create', (req, res) => {
    if (req.session.user) res.render('createparty', { user: req.session.user, msg: null });
    else res.redirect('/login');
});


router.post('/create', (req, res) => {
    const sendMessage = msg => res.render('createparty', {user: req.session.user, msg: msg});

    checkFormData(req.body, 
        () => sendMessage("Pls insert valid participants' number"),
        () => sendMessage("The party should have at least 2 participants (including you)!!"),
        () => sendMessage("Pls insert a name"),
        () => {
            let id = getRandomStr(6);
            let ok = false;
    
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
                const linkid_ = db.prepare('SELECT linkid FROM links ORDER BY linkid DESC LIMIT 1').get();
                const id_ = linkid_ ? Number(linkid_.linkid) + 1 : 1;
                const linkid = createId(id_, 9);

                db.prepare(
                    'INSERT INTO links (linkid, userid, partyid, userrole) ' +
                    'VALUES (?, ?, ?, ?)'
                ).run(linkid, req.session.userid, id, 'master');
                
                // FUNCTION'S END
                res.redirect('/parties');
            }
        }
    );
});


// ENTER PARTY
router.get('/:id/enter', (req, res) => {
    const id = req.params.id;
    const party = getPartyData(id);
    const link = getLinkData(id, req.session.userid);


    // FUNCTIONS
    const renderJoinPage = (member) =>  res.render(
        path.join(__dirname, "..", "views", "parties_files", `joinparty.ejs`),
        { user: req.session.user, party: party, member: member, msg: null }
    );


    // VERIFIES IF THERE'S ANY CURRENT SESSION PASS
    checkLoginData(req, res, party,
        () => {},
        () => {
            if (req.session.currentpass === id) res.redirect(`/parties/${id}`);

            else {
                if (link && link.userrole === 'master') {
                    req.session.currentpass = id;
                    res.redirect(`/parties/${id}`);
                }

                else if (link) renderJoinPage(true);
                else renderJoinPage(false);
            }
        }
    );
});


// JOIN PARTY
router.post('/:id/enter', (req, res) => {
    const id = req.params.id;
    const party = getPartyData(id);
    const link = getLinkData(id, req.session.userid);

    const redirect = () => res.redirect(`/parties/${id}`);

    const createLinkid = () => {
        const linkid_ = db.prepare('SELECT linkid FROM links ORDER BY linkid DESC LIMIT 1').get();
        const id_ = linkid_ ? Number(linkid_.linkid) + 1 : 1;
        return createId(id_, 9);
    }

    const renderJoinPage = (member, msg) =>  res.render(
        path.join(__dirname, "..", "views", "parties_files", `joinparty.ejs`),
        { user: req.session.user, party: party, member: member, msg: msg }
    );

    const verifyLink = () => {
        if (link) {
            redirect();
        }

        else {
            db.prepare(
                `INSERT INTO links (linkid, userid, partyid, userrole) ` + 
                `VALUES (?, ?, ?, ?)`
            ).run(createLinkid(), req.session.userid, id, 'player only');
                   
            redirect();
        }
    }

    checkLoginData(req, res, party,
        () => {},
        () => {
            if (req.session.currentpass === id) redirect();

            else {
                if (party.password) {
                    if (party.password === req.body.password) {
                        req.session.currentpass = id;
                        verifyLink();
                    }
    
                    else if (party.password === '') {
                        const member = link ? true : false;
                        renderJoinPage(member, 'Pls insert a password!');
                    }
    
                    else {
                        const member = link ? true : false;
                        renderJoinPage(member, 'Wrong password');
                    }
                }

                else {
                    req.session.currentpass = id;
                    verifyLink();
                }
            }
        }
    );
    
});


// REDIRECT PAGE
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const party = getPartyData(id);
    const link = getLinkData(id, req.session.userid);

    checkLoginData(req, res, party,
        () => {},
        () => {
            if (req.session.currentpass === id) {
                res.render(`parties_files/${id}`,
                    {
                        user: req.session.user,
                        userrole: link.userrole,
                        party: party
                    }
                );
            }

            else {
                res.redirect(`/parties/${id}/enter`);
            }
        }
    );
});


// EDIT PARTY
router.get('/:id/edit', (req, res) => {
    const id = req.params.id;
    const party = getPartyData(id);

    checkLoginData(req, res, party,
        () => {},
        () => {
            const link = getLinkData(id, req.session.userid);

            if (link) {
                if (link.userrole === 'master' || link.userrole === 'manager') {
                    res.render('editparty', 
                        {
                            user: req.session.user,
                            party: party,
                            msg: '',
                            userrole: link.userrole
                        }
                    );
                }

                else res.redirect(`/parties/${id}`);
            }

            else res.redirect(`/parties/${id}`);
        }
    );
});

router.post('/:id/edit', (req, res) => {
    const id = req.params.id;
    let query = '';

    const sendMessage = msg => {
        const party = db.prepare(
            `SELECT parties.*, links.userrole FROM parties LEFT JOIN ` +
            `links ON parties.id = links.partyid WHERE parties.id = ?`
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

            // UPDATES TABLE
            db.prepare(`UPDATE parties SET ${query} WHERE id = ?`).run(id);
        
            // UPDATES PARTY'S FILE
            const party = getPartyData(id);
            const data = `<%- include ("default", { user: ${JSON.stringify(req.session.user)}, party: ${JSON.stringify(party)} }) %>`;

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

    checkLoginData(req, res, party,
        () => {},
        () => {
            const link = getLinkData(id, req.session.userid);

            if (link && link.userrole === 'master') {
                db.prepare(`DELETE FROM links WHERE partyid = ?`).run(id);
                db.prepare(`DELETE FROM parties WHERE id = ?`).run(id);

                fs.unlink(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), () => {});

                res.redirect('/parties');
            }
        }
    );
});


//ESPORTS
module.exports = router;