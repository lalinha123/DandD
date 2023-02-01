// IMPORTS
const { createId } = require('../utils/utils');
const { express, app, appSets, db } = require('../utils/common');


// VARIABLES
const router = express.Router();


// APP SETTINGS
appSets(app);


// * APP ROUTERS ---------------
router.get('/', (req, res) => {
    res.render('parties', {user: req.session.user});
});


// CREATE
router.get('/create', (req, res) => res.render('createparty', {user: req.session.user}));

router.post('/create', (req, res) => {
    db.serialize(() => {
        db.get('SELECT id FROM parties ORDER BY id DESC LIMIT 1', (err, iddata) => {
            const idLength = 5;
            const id = iddata ? createId(Number(iddata.id) + 1, idLength) : createId(1, idLength);

            db.run(
                'INSERT INTO parties ' + 
                '(id, name, password, maxparticipants, minparticipants, masterid) VALUES ' +
                '($id, $name, $password, $maxparticipants, $minparticipants, $masterid)', 
                {
                    $id: id,
                    $name: req.body.name,
                    $password: req.body.password || null,
                    $maxparticipants: req.body.maxparticipants,
                    $minparticipants: req.body.minparticipants,
                    $masterid: req.session.userid
                })

            .get('SELECT parties FROM users WHERE id = $id', { $id: req.session.userid },
                (err, data) => {
                    let parties;
                    parties = JSON.stringify(data.parties) !== 'null' ? data.parties + `,${id}` : id;

                    db.run('UPDATE users SET parties = $parties WHERE id = $id',
                        {
                            $parties: parties,
                            $id: req.session.userid
                        }, () => res.redirect('/'));
                })
        });
    });
});


module.exports = router;