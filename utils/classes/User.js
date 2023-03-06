const { db } = require("../functions/common");

module.exports = class User {
    constructor (id, nickname, password, pass) {
        this.id = id;
        this.nickname = nickname;
        this.password = password;
        this.pass = pass;
    }

    static init (id) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        return user ? new User(id, user.nickname, user.password, user.pass) : '';
    }

    setPass (pass) {
        db.prepare(`UPDATE users SET pass = '${pass}' WHERE id = ?`).run(this.id);
        this.pass = pass;
    }

    removePass () {
        db.prepare('UPDATE users SET pass = NULL WHERE id = ?').run(this.id);
        this.pass = null;
    }
}