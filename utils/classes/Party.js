const { db } = require("../functions/common");

module.exports = class Party {
    constructor (id, name, password, max, min, master) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.maxmembers = max;
        this.minmembers = min;
        this.master = master;
    }

    static get (id) {
        const party = db.prepare("SELECT * FROM parties WHERE id = ?").get(id);
        return new Party(id, party.name, party.password, party.maxmembers, party.minmembers, party.master);
    }

    static create (id, name, password = null, max = null, min = null, master) {
        db.prepare(
            "INSERT INTO parties (id, name, password, maxmembers, minmembers, master)" +
            "VALUES (?, ?, ?, ?, ?, ?);"
        ).run(id, name, password, max, min, master);
    }

    static pop (id) {
        db.prepare('DELETE FROM parties WHERE id = ?').run(id);
    }

    getMembersQtd () {
        return db.prepare('SELECT COUNT(*) AS qtd FROM links WHERE partyid = ?').get(this.id).qtd;
    }
}