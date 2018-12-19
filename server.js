const fs = require('fs');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' });
const Mongo = require('./mongo_fs');
const Excel = require('./excel');
const Clustering = require('./clustering');
const Parser = require('./parser');


const PORT = 5000;
app.use(bodyParser());
app.use(express.static(__dirname));

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

app.get('/api/users', (req, res) => {
    const users = Mongo.getUsers();

    res.send(users);
});

app.post('/api/upload', upload.single('excel'), (req, res) => {
    console.log('Start uploading');
    const filePath = req.file.destination + '/' + req.file.filename;
    const contracts = Excel.parseContracts(filePath);

    Mongo.addContracts(contracts);

    const users = Mongo.getUsers();
    const clusteringResult = Clustering.clusterize(contracts);

    const combinations = Clustering.combineUsersAndContracts(users, contracts, clusteringResult);

    console.log(combinations.length);

    Mongo.addCombinations(combinations);

    console.log('Saved combinations');

    res.send(combinations);
});

app.get('/api/contracts', (req, res) => {
    const contracts = Mongo.getContracts();

    res.send(contracts);
});

app.get('/api/users/:userId/contracts', (req, res) => {
    const combinations = Mongo.getCombinations();

    const userCombination = combinations.find(combination => combination.user.id === req.params.userId);

    if (userCombination) {
        const contracts = Mongo.getContracts();

        const notFinishedContracts = [];

        userCombination.contracts.forEach(contract => {
            const maybeFinished = contracts.find(c => c.number === contract.number);

            if (!maybeFinished.isFinished) {
                notFinishedContracts.push(maybeFinished);
            }
        });

        res.send(notFinishedContracts);
    } else {
        res.send([]);
    }
});

app.get('/api/combinations', (req, res) => {
    const combinations = Mongo.getCombinations();
    const contracts = Mongo.getContracts();

    combinations.forEach(combination => {
        combination.contracts.forEach(contract => {
           const maybeFinished = contracts.find(c => c.number === contract.number);

           contract.isFinished = maybeFinished.isFinished;
           contract.status = maybeFinished.isFinished;
        });
    });

    res.send(combinations);
});

app.get('/api/events', (req, res) => {
    const contracts = Mongo.getFinishedContracts();
    res.send(contracts);
});

app.post('/api/contracts/finish', (req, res) => {
    const { contract, status } = req.body.data;

    const contracts = Mongo.getContracts();

    const c = contracts.find(c => c.number === contract.number);

    c.isFinished = true;
    c.status = status;
    c.troubles = status ? 'Да' : 'Нет';
    c.reason = status;

    Mongo.addContracts(contracts);

    res.send();
});

app.get('/api/finishedContracts', (req, res) => {
    const contracts = Mongo.getContracts();

    res.send(contracts.filter(contract => contract.isFinished));
});

app.get('/api/parse/:contractNumber', async (req, res) => {
    const number = req.params.contractNumber;

    const file = await Parser.process(number);

    res.send(file);
});

app.get('/api/heatmap', (req, res) => {
    const data = fs.readFileSync('./heatmap.json');

    res.send(data);
});

app.listen(PORT, function () {
   console.log(`Started on port ${PORT}!`);
});

Mongo.clearOnStartup();
Mongo.fillEmployeesOnStartup();
