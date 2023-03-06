const { app, session } = require(__dirname + '/utils/functions/common');
const User = require(__dirname + '/utils/classes/User.js');
const Party = require(__dirname + '/utils/classes/Party.js');
const Link = require(__dirname + '/utils/classes/Link.js');

app.get('/', (req, res) => {
    const user = User.init('1');
    res.send('aaaaa');
});

// const party2 = Party.init('2');
// const party = Party.init('1');

app.listen('8080', () => {
    console.log('working!');
});