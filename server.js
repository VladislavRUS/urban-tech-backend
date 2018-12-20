const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const Mongo = require('./mongo');
const Excel = require('./excel');
const Clustering = require('./clustering');
const Parser = require('./parser');
const cors = require('cors');
const PORT = 5002;

app.use(express.static(__dirname));
app.use(cors());
app.use(bodyParser());

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

app.post('/api/contracts/:contractId/attachFile', upload.single('attach'), async (req, res) => {
    const { contractId } = req.params;

    const pathToFile = req.file.destination + req.file.filename;
    const newPathToFile = pathToFile + '.' + req.file.mimetype.split('/')[1];

    await Mongo.addAttach({ contractId, type: 'image', data: newPathToFile });

    fs.rename(pathToFile, newPathToFile, err => {
        res.send(newPathToFile);
    });
});

app.delete('/api/contracts/:contractId/attachFile/:attachId', async (req, res) => {
    await Mongo.removeAttach({ id: req.params.attachId });
    res.send();
});

app.get('/api/parse/:contractNumber', async (req, res) => {
    const { contractNumber } = req.params;
    const result = await Parser.process(contractNumber);

    console.log(result);

    res.send(result)
});

app.listen(PORT, function () {
    console.log(`Started on port ${PORT}!`);
});

Mongo.onStartup();
