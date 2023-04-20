const { db } = require('../functions/common');

module.exports = class User {
    constructor (id, nickname, password, pass) {
        this.id = id;
        this.nickname = nickname;
        this.password = password;
        this.pass = pass;
    }

    static getFromId (id) {
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        return user ? new User(id, user.nickname, user.password, user.pass) : '';
    }

    static getFromNickname (nickname) {
        const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
        return user ? new User(user.id, nickname, user.password, user.pass) : '';
    }

    static create (nickname, password) {
        const user = db.prepare('SELECT id FROM users ORDER BY id DESC LIMIT 1').get();
        const id = !user ? 1 : Number(user.id) + 1;   

        db.prepare('INSERT INTO users (id, nickname, password) VALUES (?, ?, ?)').run(id, nickname, password);
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