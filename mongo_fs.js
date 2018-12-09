const fs = require('fs');

const faker = require('faker');
const CONSTANTS = require('./constants');

const generateUsers = () => {
    const users = [];

    for (let i = 0; i < 4; i++) {
        users.push({
            id: faker.random.uuid(),
            firstName: faker.name.firstName(),
            lastName: faker.name.lastName(),
            patronymic: faker.name.lastName(),
            avatar: faker.image.avatar(),
            latitude: faker.random.number({
                min: 54,
                max: 56
            }),
            longitude: faker.random.number({
                min: 37,
                max: 38
            })
        });
    }

    users.push({
        id: '123qwe',
        firstName: 'Владислав',
        lastName: 'Курочкин',
        patronymic: 'Михайлович',
        avatar: faker.image.avatar(),
        latitude: faker.random.number({
            min: 54,
            max: 56
        }),
        longitude: faker.random.number({
            min: 37,
            max: 38
        })
    });

    console.log(users);
    return users;
};

const addCollection = (collectionName, collection) => {
    let newCollection = [];
    if (fs.existsSync(collectionName)) {
        const savedCollection = JSON.parse(fs.readFileSync(collectionName));
        newCollection = newCollection.join(savedCollection);
    }

    newCollection = newCollection.join(collection);
    console.log(newCollection)
    fs.writeFileSync(collectionName, JSON.stringify(newCollection), 'utf8')
};

const getCollection = collectionName => {
    if (fs.existsSync(collectionName)) {
        return JSON.parse(fs.readFileSync(collectionName));
    }

    return [];
};

const deleteCollection = (collectionName) => {
    if (fs.existsSync(collectionName)) {
        fs.unlinkSync(collectionName);
    }
};

const fillEmployeesOnStartup = async () => {
    const users = generateUsers();
    addCollection(CONSTANTS.USERS_COLLECTION, users);

    console.log(getUsers().length);
    console.log('Inserted users: ' + users.length)
};

const getUsers =
    () => getCollection(CONSTANTS.USERS_COLLECTION);

const addContracts = async (contracts) => {
    deleteCollection(CONSTANTS.CONTRACTS_COLLECTION);
    addCollection(CONSTANTS.CONTRACTS_COLLECTION, contracts);
};

const addFinishedContracts = async (contracts) => {
    addCollection(CONSTANTS.FINISHED_CONTRACTS_COLLECTION, contracts);
};

const getContracts =
    () => getCollection(CONSTANTS.CONTRACTS_COLLECTION);

const getFinishedContracts =
    () => getCollection(CONSTANTS.FINISHED_CONTRACTS_COLLECTION);

const clearOnStartup = async () => {
    deleteCollection(CONSTANTS.CONTRACTS_COLLECTION);
    deleteCollection(CONSTANTS.COMBINATIONS_COLLECTION);
    deleteCollection(CONSTANTS.USERS_COLLECTION);
    deleteCollection(CONSTANTS.FINISHED_CONTRACTS_COLLECTION);
};

const addCombinations = (combinations) => {
    deleteCollection(CONSTANTS.COMBINATIONS_COLLECTION);
    addCollection(CONSTANTS.COMBINATIONS_COLLECTION, combinations);
};

const getCombinations = () => getCollection(CONSTANTS.COMBINATIONS_COLLECTION);

module.exports = {
    fillEmployeesOnStartup,
    getUsers,
    addContracts,
    addCombinations,
    getCombinations,
    getContracts,
    clearOnStartup,
    addFinishedContracts,
    getFinishedContracts
};
