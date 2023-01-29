const express = require('express');
const app = express();
const router = express.Router();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

router.get('/', (req, res) => {
    res.render('parties');
});

router.get('/create', (req, res) => {
    res.render('createparty');
});

module.exports = router;