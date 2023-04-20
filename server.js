const { initSession, destroySession } = require("./utils/functions/common");

const { app, session, express } = require(__dirname + '/utils/functions/common');
const User = require(__dirname + '/utils/classes/User.js');
const Party = require(__dirname + '/utils/classes/Party.js');
const Link = require(__dirname + '/utils/classes/Link.js');

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use('/login', require(__dirname + '/routers/login/login'));
app.use('/signup', require(__dirname + '/routers/login/signup'));


// MIDDLEWARE
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/logout', (req, res) => {
    res.render('index');
});

app.listen('8080', () => console.log('working!'));