const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const Mongo = require('./mongo');
const Excel = require('./excel');
const Clustering = require('./clustering');
const PORT = 5000;

app.use(bodyParser());

app.use((req, res, next) => {
    res.header('Content-Type', 'application/json');
    res.header('Accept', 'application/json');
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/api/users', async (req, res) => {
    const users = await Mongo.getUsers();

    res.send(users);
});

app.post('/api/upload', upload.single('excel'), async (req, res) => {
    await Mongo.dropCombinations();
    await Mongo.dropContracts();
    await Mongo.dropFinishedContracts();

    const filePath = req.file.destination + '/' + req.file.filename;
    const contracts = Excel.parseContracts(filePath);

    await Mongo.addContracts(contracts);
    const users = await Mongo.getUsers();

    const combinations = Clustering.combineUsersAndContracts(users, contracts);

    await Mongo.addCombinations(combinations);

    res.sendStatus(200);
});

app.get('/api/combinations', async (req, res) => {
    const combinations = await Mongo.getCombinations();

    const result = [];

    const allUsers = await Mongo.getUsers();
    const allContracts = await Mongo.getContracts();

    for (let i = 0; i < combinations.length; i++) {
        const combination = combinations[i];
        const user = allUsers.find(user => user.id === combination.userId);
        const contracts = allContracts.filter(contract => combination.contractsId.indexOf(contract.id) !== -1);

        result.push({
            user,
            contracts
        });
    }

    res.send(result);
});

app.get('/api/contracts', async (req, res) => {
    const contracts = await Mongo.getContracts();
    res.send(contracts);
});

app.post('/api/contracts/:contractId/finish', async (req, res) => {
    const { contractId } = req.params;
    const { userId, status } = req.body;

    console.log(req.body);

    await Mongo.finishContract({ contractId, userId, status, timestamp: new Date().getTime() });

    res.send();
});

app.get('/api/events', async (req, res) => {
    const events = [];

    const finishedContracts = await Mongo.getFinishedContracts();

    const userIds = finishedContracts.map(result => result.userId);
    const users = await Mongo.getUsers({ id: { $in: userIds}});

    const contractIds = finishedContracts.map(result => result.contractId);
    const contracts = await Mongo.getContracts({ id: { $in: contractIds}});

    finishedContracts.forEach(result => {
        const user = users.find(user => result.userId === user.id);
        const contract = contracts.find(contract => result.contractId === contract.id);
        const { status, timestamp } = result;

        events.push({
            user,
            contract,
            status,
            timestamp
        });
    });

    res.send(events);
});

app.post('/api/attach', async (req, res) => {
    const { contractId, type, data } = req.body;

    const attach = await Mongo.getAttach({ contractId, type });

    if (attach && type === 'comment') {
        const filter = { id: attach.id };
        const update = { $set: { data } };
        await Mongo.updateAttach(filter, update);
    } else {
        await Mongo.addAttach({ contractId, type, data });
    }

    res.sendStatus(201);
});

app.listen(PORT, function () {
    console.log(`Started on port ${PORT}!`);
});

Mongo.onStartup();
