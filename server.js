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
    secret: getRandomStr(),
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


// * APP ROUTERS ---------------
const routes = ['parties'];
routes.forEach(route => {
    app.use(`/${route}`, require(__dirname + `/routers/${route}_router.js`));
});

// INDEX
app.get('/', (req, res) => res.render('index', {session: session}));


// LOGIN
app.get('/login', (req, res) => res.render('login', {msg: null}));
app.post('/login', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;

    if (nickname && password) {
        db.get('SELECT * FROM users WHERE nickname = $nickname AND password = $password', 
        {$nickname: nickname, $password: password}, (err, userdata) => {
            if (userdata) {
                startSession(req, userdata);
                res.redirect('/');
            } else {
                res.render('login', {msg: 'Invalid user or password!'});
            }
        });
    } else {
        res.render('login', {msg: 'Pls fill all the blank areas'});
    }
});


// SIGN UP
app.get('/signup', (req, res) => res.render('signup', {msg: null}));
app.post('/signup', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;

    if (nickname && password) {
        db.get('SELECT nickname FROM users WHERE nickname = $nickname', 
        {$nickname: nickname}, (err, data) => {
            if (!data) {
                db.get('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, iddata) => {
                    const idLength = 9;
                    const id = iddata ? createId(Number(iddata.id) + 1, idLength) : createId(1, idLength);
                    console.log(id);

                    db.run('INSERT INTO users (id, nickname, password) VALUES ($id, $nickname, $password)',
                    {$id: id, $nickname: nickname, $password: password}, (err) => {
                        if (!err) {
                            startSession(req, {
                                id: id,
                                nickname: nickname,
                                password: password
                            });
                            
                            res.redirect('/');
                        }
                    });
                });
            } else {
                res.render('signup', {msg: 'This user already exists! :O'});
            }
        });
    } else {
        res.render('signup', {msg: 'Pls fill all the blank areas'});
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

// SERVER
app.listen(port, () => console.log('Server is running!'));