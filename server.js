// VARIABLES
const express = require('express');
const sessions = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 8080;
let session = '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));


// -------------------------------------------------------------------
// DATABASE
const sqlite = require('sqlite3');
const db = new sqlite.Database('database.db3');


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


// -------------------------------------------------------------------
// APP ROUTERS
app.get('/', (req, res) => {
    if (session) {
        res.render('index', {user: session.user, session: session});
    } else {
        res.render('index', {user: null, session: null});
    }
});


// LOG IN
app.get('/login', (req, res) => {
    if (session) {
        res.redirect('/');
    } else {
        res.render('login', {msg: ''});
    }
});

app.post('/login', (req, res) => {
    const username_in = req.body.username;
    const password_in = req.body.password;

    const render = (msg) => {
        res.render('login', {msg: msg});
    }

    db.get('SELECT * FROM users WHERE username = $username', 
    {$username: username_in}, (err, userdata) => {

        if (!username_in || !password_in) {
            render('Please, fill all the blank areas.');
        } else if (!userdata) {
            render('This user does not exist.');

        } else if (userdata.password === password_in) {
            session = req.session;
            session.userid = userdata.id;
            session.user = userdata;
            res.redirect('/');

        } else if (userdata.password !== password_in) {
            render('Invalid password');

        } else {
            render('Some error occured!');
        }
    });
});


// REGISTER
app.get('/register', (req, res) => {
    if (session) {
        res.redirect('/');
    } else {
        res.render('register', {msg: ''});
    }
});

app.post('/register', (req, res) => {
    const username_in = req.body.username;
    const password_in = req.body.password;

    db.get('SELECT id FROM users ORDER BY id DESC LIMIT 1', (err, row) => {
        const id = row ? Number(row.id) + 1 : 1;

        if (!username_in || !password_in) {
            res.render('register', {msg: 'Please, fill all the blank areas.'});
        } else {
            db.get('SELECT username FROM users WHERE username = $username', 
            { $username: username_in }, (err, row_name) => {
                if (!row_name) {
                    db.run('INSERT INTO users (id, username, password) VALUES ($id, $username, $password)',
                    {
                        $id: id,
                        $username: username_in,
                        $password: password_in
                    }, () => {
                        db.get('SELECT * FROM users WHERE username = $username',
                        {$username: username_in}, (err, userdata) => {
                            if  (!err) {
                                session = req.session;
                                session.userid = userdata.id;
                                session.user = userdata;
                                res.redirect('/');
                            }
                        });
                    });
                } else {
                    res.render('register', {msg: 'This username has been already used.'});
                }
            });

        }
    });
});


//LOG OUT
app.get('/logout', (req, res) => {
    req.session.destroy(function(err){
        session = null;
        res.redirect('/');
    });
});


// -------------------------------------------------------------------
app.listen(port, () => {
    console.log('Server is running!');
});