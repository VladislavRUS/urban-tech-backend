const faker = require('faker');
const CONSTANTS = require('./constants');
const MongoClient = require('mongodb').MongoClient;
const mongoClient = new MongoClient(CONSTANTS.MONGO_DB_URL, { useNewUrlParser: true });

const generateEmployees = () => {
    const employees = [];

    for (let i = 0; i < 4; i++) {
        employees.push({
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

    employees.push({
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

    return employees;
};

const tryDelete = async (database, collectionName) => {
    try {
        await database.collection(collectionName).drop();
    } catch (e) {
        // collection does not exists
    }
};

const fillEmployeesOnStartup = async () => {
    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    await tryDelete(gkuDatabase, CONSTANTS.USERS_COLLECTION);

    const res = await gkuDatabase.collection(CONSTANTS.USERS_COLLECTION).insertMany(generateEmployees());

    console.log('Inserted: ' + res.insertedCount);

    await dbo.close();
};

const getCollection = async collectionName => {
    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    const collection = await gkuDatabase.collection(collectionName).find({});

    const array = await collection.toArray();

    await dbo.close();

    return array;
};

const getUsers = async () => {
    return await getCollection(CONSTANTS.USERS_COLLECTION);
};

const addContracts = async (contracts) => {
    if (contracts.length === 0) {
        return;
    }

    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    await tryDelete(gkuDatabase, CONSTANTS.CONTRACTS_COLLECTION);

    const res = await gkuDatabase.collection(CONSTANTS.CONTRACTS_COLLECTION).insertMany(contracts);

    console.log('Inserted: ' + res.insertedCount);

    await dbo.close();
};

const addFinishedContracts = async (contracts) => {
    if (contracts.length === 0) {
        return;
    }

    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    const res = await gkuDatabase.collection(CONSTANTS.FINISHED_CONTRACTS_COLLECTION).insertMany(contracts);

    console.log('Inserted: ' + res.insertedCount);

    await dbo.close();
};

const getContracts = async () => {
    return await getCollection(CONSTANTS.CONTRACTS_COLLECTION);
};

const getFinishedContracts = async () => {
    return await getCollection(CONSTANTS.FINISHED_CONTRACTS_COLLECTION);
};

const clearOnStartup = async () => {
    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    await tryDelete(gkuDatabase, CONSTANTS.CONTRACTS_COLLECTION);
    await tryDelete(gkuDatabase, CONSTANTS.COMBINATIONS_COLLECTION);
    await tryDelete(gkuDatabase, CONSTANTS.USERS_COLLECTION);
    await tryDelete(gkuDatabase, CONSTANTS.FINISHED_CONTRACTS_COLLECTION);

    await dbo.close();
};

const saveCombinations = async (combinations) => {
    if (combinations.length === 0) {
        return;
    }

    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    await tryDelete(gkuDatabase, CONSTANTS.COMBINATIONS_COLLECTION);

    const res = await gkuDatabase.collection(CONSTANTS.COMBINATIONS_COLLECTION).insertMany(combinations);

    console.log('Inserted: ' + res.insertedCount);

    await dbo.close();
};

const getCombinations = async () => {
    return await getCollection(CONSTANTS.COMBINATIONS_COLLECTION);
};

const addEvent = async (event) => {
    const dbo = await mongoClient.connect();
    const gkuDatabase = dbo.db(CONSTANTS.GKU_DATABASE);

    const res = await gkuDatabase.collection(CONSTANTS.EVENTS_COLLECTION).insertOne(event);

    console.log('Inserted: ' + res.insertedCount);

    await dbo.close();
};

const getEvents = async () => {
    return await getCollection(CONSTANTS.EVENTS_COLLECTION);
};


module.exports = {
    fillEmployeesOnStartup,
    getUsers,
    addContracts,
    saveCombinations,
    getCombinations,
    getContracts,
    clearOnStartup,
    getEvents,
    addEvent,
    addFinishedContracts,
    getFinishedContracts
};
