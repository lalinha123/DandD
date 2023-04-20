const path = require('path');
const { app, session, express } = require(path.join(__dirname, '..', '..', '/utils/functions/common'));
const User = require(path.join(__dirname, '..', '..', '/utils/classes/User.js'));
const Party = require(path.join(__dirname, '..', '..', '/utils/classes/Party.js'));
const Link = require(path.join(__dirname, '..', '..', '/utils/classes/Link.js'));

const router = express.Router();

router.get('/', (req, res) => {
    if (req.session && req.session.user) res.redirect('/');
    else res.render('login', {msg: ""});
});

router.post('/', (req, res) => {
    const nick = req.body.nick;
    const passw = req.body.pass;

    const user = User.getFromNickname(nick);
    const userPassword = user ? user.password : null;

    if (!nick || !passw) res.send({msg: 'Please, fill all the blank areas.'});
    else if (passw !== userPassword) res.send({msg: 'Incorrect nickname or password.'});
    else {
        req.session.user = user;
        res.redirect('/');
    }
});

module.exports = router;