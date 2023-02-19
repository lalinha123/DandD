-- SQLite
DELETE FROM parties;
DELETE FROM link;

DROP TABLE parties;
DROP TABLE link;

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
CREATE TABLE link (
    linkid TEXT NOT NULL PRIMARY KEY,
    userid TEXT NOT NULL,
    partyid TEXT NOT NULL,
    userrole TEXT NOT NULL,
    FOREIGN KEY(userid) REFERENCES users(id),
    FOREIGN KEY(partyid) REFERENCES parties(id)
);