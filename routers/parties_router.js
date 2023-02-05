// IMPORTS
const { getRandomStr } = require('../utils/utils');
const { express, app, appSets, db } = require('../utils/common');
const fs = require('fs');
const path = require("path");


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


// * APP ROUTERS ------------------------------------------------------------------
router.get('/', (req, res) => res.render('parties', {user: req.session.user}));


// CREATE NEW PARTY
router.get('/create', (req, res) => res.render('createparty', {user: req.session.user}));

router.post('/create', (req, res) => {
    db.serialize(() => {
        const id = getRandomStr(10);

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
                const data = `<%- include ("default", {session: ${JSON.stringify(req.session)}, party: ${JSON.stringify(party)}}) %>`
                fs.writeFileSync(path.join(__dirname, "..", "views", "parties_files", `${id}.ejs`), data);
            })
        .run('INSERT INTO participants (userid, partyid) VALUES ($userid, $partyid)',
            {
                $userid: req.session.userid,
                $partyid: id
            }, () => res.redirect('/'));
    });
});


// PARTIES LINKS
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM parties WHERE id = $id',
    {$id: req.params.id}, (err, data) => {
        if (!data) {
            res.render('error');
        }

        else {
            res.render(path.join(__dirname, "..", "views", "parties_files", `${req.params.id}.ejs`));
        }
    });
});

module.exports = router;