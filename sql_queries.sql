-- SQLite
DELETE FROM parties;
DELETE FROM links;
DELETE FROM users;

DROP TABLE parties;
DROP TABLE links;

CREATE TABLE parties (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT,
    maxparticipants INTEGER,
    minparticipants INTEGER,
    master TEXT NOT NULL
);

-------------
# roles: master, manager, player only
CREATE TABLE links (
    linkid TEXT NOT NULL PRIMARY KEY,
    userid TEXT NOT NULL,
    partyid TEXT NOT NULL,
    userrole TEXT NOT NULL,
    FOREIGN KEY(userid) REFERENCES users(id),
    FOREIGN KEY(partyid) REFERENCES parties(id)
);