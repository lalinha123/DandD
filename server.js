// IMPORTS
const { createId, getRandomStr } = require(__dirname + '/utils/utils');
const { app, appSets, db } = require(__dirname + '/utils/common');


// VARIABLES
const sessions = require('express-session');
const cookieParser = require('cookie-parser');
const port = 8080;
let session = ''; 


// APP SETTINGS
appSets(app);
app.use(cookieParser());


// INITIALIZE SESSION
app.use(sessions ({
    secret: getRandomStr(20),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 },
    resave: false,
}));

const startSession = (req, data) => {
    session = null;
    session = req.session;
    session.userid = data.id;
    session.user = data;
}


// * APP ROUTERS ------------------------------------------------------------------
const routes = ['parties'];
routes.forEach(route => app.use(`/${route}`, require(`${__dirname}/routers/${route}_router.js`)));


// INDEX
app.get('/', (req, res) => {
    if (!session) {
        res.render('index', {session: null, parties: null});
    }

    else {
        db.serialize(() => {
            const id = session.userid;
            db.all(`SELECT parties.* FROM participants ` +
            `LEFT JOIN parties ON participants.partyid = parties.id WHERE userid = '${id}'`,
            (err, partiesdata) => {
                res.render('index', {session: session, parties: partiesdata || []});
            });
        });
    }
});


// LOGIN
app.get('/login', (req, res) => session ? res.redirect('/') : res.render('login', {msg: null}));

app.post('/login', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;
    const render = msg => res.render('login', {msg: msg}); // useful function :)

    if (nickname && password) {
        db.get('SELECT * FROM users WHERE nickname = $nickname AND password = $password', 
            {
                $nickname: nickname,
                $password: password
            },
            (err, user) => {
                if (user) {
                    startSession(req, user);
                    res.redirect('/');
                }
                
                else {
                    render('Invalid user or password!');
                }
            });
    }
    
    else {
        render('Pls fill all the blank areas');
    }
});


// SIGN UP
app.get('/signup', (req, res) => session ? res.redirect('/') : res.render('signup', {msg: null}));

app.post('/signup', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;
    const render = msg => res.render('signup', {msg: msg}); // another useful function :)

    if (nickname && password) {
        db.get('SELECT nickname FROM users WHERE nickname = $nickname',
        { $nickname: nickname }, (err, user) => {
            if (!user) {
                db.get('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, data) => {
                    const idLength = 9;
                    const id = data ? createId(Number(data.id) + 1, idLength) : createId(1, idLength);

                    db.run(
                        'INSERT INTO users (id, nickname, password) VALUES ' +
                        '($id, $nickname, $password)',
                        {
                            $id: id,
                            $nickname: nickname,
                            $password: password
                        },
                        (err) => {
                            if (!err) {
                                startSession(req,
                                    {
                                        id: id,
                                        nickname: nickname,
                                        password: password
                                    });
                                
                                res.redirect('/');
                            }
                        });
                });
            }
            
            else {
                render('This user already exists! :O');
            }
        });
    }
    
    else {
        render('Pls fill all the blank areas');
    }
});


//LOG OUT
app.all('/logout', (req, res) => {
    req.session.destroy(() => {
        req.session = null;
        session = null;
        res.redirect('/');
    });
});


// ROUTER ERROR HANDLING
app.get('*', (req, res) => res.render('error'));


// SERVER
app.listen(port, () => console.log('Server is running!'));