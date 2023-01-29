// VARIABLES
const express = require('express');
const sessions = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;
let session = '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.set('view engine', 'ejs');


// -------------------------------------------------------------------
// DATABASE
const sqlite = require('sqlite3');
const db = new sqlite.Database('database.db3');

const createId = id => {
    id = id.toString();
    const numChar = 9;

    while (id.length < numChar) {
        id = '0' + id;
    }

    return id;
}


// -------------------------------------------------------------------
// INITIALIZE SESSION
const getRandomStr = () => {
    let str = '';

    do {
        str += Math.random().toString(36).slice(2, 7);
    } while (str.length <= 20);

    return str;
}

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


// -------------------------------------------------------------------
// APP ROUTERS
const routes = ['parties'];
routes.forEach(route => {
    app.use(`/${route}`, require(__dirname + `/routers/${route}_router.js`));
});

app.get('/', (req, res) => {
    if (session) {
        res.render('index', {session: session});
    } else {
        res.render('index', {session: null});
    }
});

// LOGIN
app.get('/login', (req, res) => {
    res.render('login', {msg: null});
});

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
app.get('/signup', (req, res) => {
    res.render('signup', {msg: null});
});

app.post('/signup', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;

    if (nickname && password) {
        db.get('SELECT nickname FROM users WHERE nickname = $nickname', 
        {$nickname: nickname}, (err, data) => {
            if (!data) {
                db.get('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, iddata) => {
                    const id = iddata ? createId(iddata.id++) : createId(1);
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
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        session = null;
        res.redirect('/');
    });
});

// -------------------------------------------------------------------
app.listen(port, () => {
    console.log('Server is running!');
});