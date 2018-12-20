const faker = require('faker');
const COLLECTIONS = require('./collections');
const mocks = require('./mock');
const MongoClient = require('mongodb').MongoClient;
const dbName = 'gku';
const url = 'mongodb://localhost:27017';

let client;

// COMMON
const getClient = async () => await MongoClient.connect(url, {
    useNewUrlParser: true
});

const insertManyIntoCollection = async (collectionName, items) => {
    //const client = await getClient();
    const db = client.db(dbName);

    const collection = await db.collection(collectionName);

    const result = await collection.insertMany(items);
    console.log('Inserted: ' + result.insertedCount);
};

const insertOneIntoCollection = async (collectionName, item) => {
    //const client = await getClient();
    const db = client.db(dbName);

    const collection = await db.collection(collectionName);

    if (!item.id) {
        item.id = faker.random.uuid();
    }

    const result = await collection.insertOne(item);
    console.log('Inserted: ' + result.insertedCount);
};

const getCollection = async (collectionName, query = {}) => {
    //const client = await getClient();
    const db = client.db(dbName);

    console.log('Query: ' + JSON.stringify(query));

    const items = await db.collection(collectionName).find(query).toArray();

    //await client.close();
    return items;
};

updateOneInCollection = async (collectionName, filter = {}, update = {}) => {
    //const client = await getClient();
    const db = client.db(dbName);

    console.log('Filter: ' + JSON.stringify(filter));
    console.log('Update: ' + JSON.stringify(update));

    await db.collection(collectionName).updateOne(filter, update);

    //await client.close();
};

const findOne = async (collectionName, query) => {
    //const client = await getClient();
    const db = client.db(dbName);

    console.log('Query: ' + JSON.stringify(query));

    const item = await db.collection(collectionName).findOne(query);

    //await client.close();
    return item;
};

const dropCollection = async (collectionName) => {
    //const client = await getClient();
    const db = client.db(dbName);

    try {
        await db.collection(collectionName).drop();
        console.log('Deleted succesfully: ' + collectionName);

    } catch(e) {
        console.log('Collection does not exists: ' + collectionName);
    }

    //await client.close();
};

// USRES
const addUsers = async (users) => insertManyIntoCollection(COLLECTIONS.USERS, users);
const getUsers = async (query) => getCollection(COLLECTIONS.USERS, query);
const getUserById = async (id) => findOne(COLLECTIONS.USERS, { id });

// CONTRACTS
const addContracts = async (contracts) => insertManyIntoCollection(COLLECTIONS.CONTRACTS, contracts);
const getContracts = async (query) => {
    const contracts = await getCollection(COLLECTIONS.CONTRACTS, query);
    const finishedContracts = await getFinishedContracts();
    const attaches = await getAttaches();

    contracts.forEach(contract => {
        contract.isFinished = !!finishedContracts.find(({ contractId }) => contractId === contract.id);
        contract.attaches = attaches.filter(attach => attach.contractId === contract.id);
    });

    return contracts;
};
const dropContracts = async () => dropCollection(COLLECTIONS.CONTRACTS);

const finishContract = async (result) => insertOneIntoCollection(COLLECTIONS.FINISHED_CONTRACTS, result);
const getFinishedContracts = async () => getCollection(COLLECTIONS.FINISHED_CONTRACTS);
const dropFinishedContracts = async () => dropCollection(COLLECTIONS.FINISHED_CONTRACTS);

// COMBINATIONS
const addCombinations = async (combinations) => insertManyIntoCollection(COLLECTIONS.COMBINATIONS, combinations);
const getCombinations = async () => getCollection(COLLECTIONS.COMBINATIONS);
const dropCombinations = async () => dropCollection(COLLECTIONS.COMBINATIONS);

// ATTACHES
const addAttach = async (attach) => insertOneIntoCollection(COLLECTIONS.ATTACHES, attach);
const getAttaches = async (query) => getCollection(COLLECTIONS.ATTACHES, query);
const getAttach = async (query) => findOne(COLLECTIONS.ATTACHES, query);
const updateAttach = async (filter, update) => updateOneInCollection(COLLECTIONS.ATTACHES, filter, update);

// ON STARTUP
const onStartup = async () => {
    client = await getClient();
    await dropCollection(COLLECTIONS.CONTRACTS);
    await dropCollection(COLLECTIONS.USERS);
    await dropCollection(COLLECTIONS.COMBINATIONS);
    await dropCollection(COLLECTIONS.FINISHED_CONTRACTS);
    await dropCollection(COLLECTIONS.ATTACHES);

    await addUsers(mocks.generateUsers());
};

module.exports = {
    onStartup,
    dropCombinations,
    dropContracts,
    dropCollection,
    addUsers,
    getUsers,
    getUserById,
    addContracts,
    getContracts,
    finishContract,
    getFinishedContracts,
    dropFinishedContracts,
    addCombinations,
    getCombinations,
    addAttach,
    getAttaches,
    getAttach,
    updateAttach
};
