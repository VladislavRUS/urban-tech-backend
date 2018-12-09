const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer  = require('multer')
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

app.post('/api/mobile/:objectId/attaches', upload.single('attach'), (req, res) => {
    console.log(req.file);

    const pathToFile = req.file.destination + '/' + req.file.filename;
    const newPathToFile = pathToFile + '.' + req.file.mimetype.split('/')[1];

    fs.rename(pathToFile, newPathToFile, err => {
        res.send();
    });
});

app.get('/api/users', async (req, res) => {
    const users = await Mongo.getUsers();

    res.send(users);
});

app.post('/api/upload', upload.single('excel'), async (req, res) => {
    console.log('Start uploading');
    const filePath = req.file.destination + '/' + req.file.filename;
    const contracts = Excel.parseContracts(filePath);
    await Mongo.addContracts(contracts);

    const users = await Mongo.getUsers();
    const clusteringResult = await Clustering.clusterize(contracts);

    const combinations = Clustering.combineUsersAndContracts(users, contracts, clusteringResult);

    console.log(combinations.length);

    await Mongo.saveCombinations(combinations);

    console.log('Saved combinations');

    res.send(combinations);
});

app.get('/api/contracts', async (req, res) => {
    const contracts = await Mongo.getContracts();

    res.send(contracts);
});

app.get('/api/users/:userId/contracts', async (req, res) => {
    const combinations = await Mongo.getCombinations();

    const userCombination = combinations.find(combination => combination.user.id === req.params.userId);

    if (userCombination) {
        const finishedContracts = await Mongo.getFinishedContracts();

        const notFinishedContracts = userCombination.contracts.filter(contract => {
            const isFinished = finishedContracts.find(finished => finished.number === contract.number);
            return !isFinished;
        });

        res.send(notFinishedContracts);
    } else {
        res.send([]);
    }
});

app.get('/api/combinations', async (req, res) => {
    const combinations = await Mongo.getCombinations();
    res.send(combinations);
});

app.get('/api/events', async (req, res) => {
    const contracts = await Mongo.getFinishedContracts();
    res.send(contracts);
});

app.post('/api/contracts/finish', async (req, res) => {
    const { contract, status } = req.body.data;

    contract.status = status;

    await Mongo.addFinishedContracts([ contract ]);

    res.send();
});

app.listen(PORT, function () {
  console.log(`Started on port ${PORT}!`);
});

Mongo.clearOnStartup();
Mongo.fillEmployeesOnStartup();
