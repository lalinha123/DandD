// CREATE ID FUNCTION
const createId = (id, numChar) => {
    id = id.toString();

    while (id.length < numChar) {
        id = '0' + id;
    }

    return id;
}


// GET RANDOM STRING FUNCTION
const getRandomStr = length => {
    let str = '';

    do {
        str += Math.random().toString(36).slice(2, 7);
    } while (str.length <= length);

    return str;
}


//EXPORTS
module.exports = { createId, getRandomStr };