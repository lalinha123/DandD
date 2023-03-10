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
    session.currentpass = null
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
        const id = session.userid;

        const partiesdata = db.prepare(
            `SELECT parties.* FROM links ` +
            `LEFT JOIN parties ON links.partyid = parties.id WHERE userid = ?`
        ).all(id);

        res.render('index', {session: session, parties: partiesdata || []});
    }
});


// LOGIN
app.get('/login', (req, res) => session ? res.redirect('/') : res.render('login', {msg: null}));

app.post('/login', (req, res) => {
    const nickname = req.body.nickname;
    const password = req.body.password;

    const render = msg => res.render('login', {msg: msg}); // useful function :)

    if (nickname && password) {
        const user = db.prepare('SELECT * FROM users WHERE nickname = ? AND password = ?').get(nickname, password);

        if (user) {
            startSession(req, user);
            res.redirect('back');
        }
                
        else {
            render('Invalid user or password!');
        }
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
        const user = db.prepare('SELECT nickname FROM users WHERE nickname = ?').get(nickname);

        if (!user) {
            const data = db.prepare('SELECT id FROM users ORDER BY id DESC LIMIT 1').get();
            const idLength = 9;
            const id = data ? createId(Number(data.id) + 1, idLength) : createId(1, idLength);

            db.prepare(
                'INSERT INTO users (id, nickname, password) VALUES ' +
                '(?, ?, ?)'
            ).run(id, nickname, password);
                        
            startSession(req, { id: id, nickname: nickname, password: password });
                                
            res.redirect('/');
        }
            
        else {
            render('This user already exists! :O');
        }
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


// QUERY
app.post('/search', (req, res) => {
    const query = req.body.query;
    const parties = db.prepare(`SELECT * FROM parties WHERE name LIKE '%${query}%' ORDER BY name ASC LIMIT 6`).all();
    res.json({parties: parties});
});


// ROUTER ERROR HANDLING
app.get('*', (req, res) => res.render('error'));


// * SERVER ------------------------------------------------------------------
app.listen(port, () => console.log('Server is running!'));