const createId = id => {
    id = id.toString();
    const numChar = 9;

    while (id.length < numChar) {
        id = '0' + id;
    }

    return id;
}

const getRandomStr = () => {
    let str = '';

    do {
        str += Math.random().toString(36).slice(2, 7);
    } while (str.length <= 20);

    return str;
}

module.exports = { createId, getRandomStr };