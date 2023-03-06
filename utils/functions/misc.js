const crypto = require('crypto');

// ------ GENERATE ID
const genid = (length) => {
    return crypto.randomBytes(length / 2).toString('hex');
}   


module.exports = { genid };