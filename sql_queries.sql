-- SQLite
DELETE FROM parties;
DELETE FROM participants;

DROP TABLE parties;

CREATE TABLE parties (
    id TEXT NOT NULL PRIMARY KEY,
    name TEXT NOT NULL,
    password TEXT,
    maxparticipants INTEGER,
    minparticipants INTEGER,
    master TEXT NOT NULL
);

-------------
CREATE TABLE participants (
    userid TEXT NOT NULL,
    partyid TEXT NOT NULL,
    FOREIGN KEY(userid) REFERENCES users(id),
    FOREIGN KEY(partyid) REFERENCES parties(id)
);