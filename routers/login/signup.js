const path = require('path');
const { session, express } = require(path.join(__dirname, '..', '..', '/utils/functions/common'));
const User = require(path.join(__dirname, '..', '..', '/utils/classes/User.js'));

const router = express.Router();

router.get('/', (req, res) => {
    if (req.session && req.session.user) res.redirect('/');
    else res.render('signup', {msg: ""});
});

router.post('/', (req, res) => {
    const nick = req.body.nickname;
    const passw = req.body.password;

    if (!nick) res.render('signup', {msg: 'Please, insert a nickname.'});
    else if (!passw) res.render('signup', {msg: "Please, insert a password."});
    else {
        const user = User.getFromNickname(nick);

        if (!user) {
            User.create(nick, passw);
            const user = User.getFromNickname(nick);
            req.session.user = user;

            res.redirect('/');
        } else res.render('signup', {msg: "This nickname has been already picked!"});
    }
});

module.exports = router;