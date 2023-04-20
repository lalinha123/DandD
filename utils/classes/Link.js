const { db } = require('../functions/common');
const { genid } = require('../functions/misc');

module.exports = class Link {
    constructor (id, userid, linkid) {
        this.id = id;
        this.userid = userid;
        this.partyid = partyid;
    }

    static get (userid, partyid) {
        const link = db.prepare('SELECT * FROM parties WHERE userid = ? AND partyid = ?').get(userid, partyid);
        return link ? new Link(link.id, userid, partyid) : '';
    }

    static create (userid, partyid) {
        const id = genid(30);
        db.prepare('INSERT INTO links (id, userid, partyid) VALUES (?, ?, ?)').run(id, userid, partyid);
    }
}