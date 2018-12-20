// const contractNumber = '2772776315017000267';
//const contractNumber = '2772027068417000036';
const request = require('request');
const parse = require('node-html-parser');
var fs = require('fs');
var HereMapsAPI = require('here-maps-node').default;
var json2xls = require('json2xls');

var config = {
    app_id: 'ioA1jk9QNHGe1eEI2tPL',
    app_code: 'puAMpfv7Eeq-ybyLRvTGog'
};

const process = (contractNumber) => {
    var url = 'http://zakupki.gov.ru/epz/contract/quicksearch/search_eis.html?pageNumber=1&sortDirection=false&recordsPerPage=_10&sortBy=PO_DATE_PUBLIKACII&fz44=on&contractPriceFrom=0&contractPriceTo=200000000000&rightPriceRurFrom=0&rightPriceRurTo=200000000000&contractStageList_0=on&contractStageList_1=on&contractStageList_2=on&contractStageList_3=on&contractStageList=0%2C1%2C2%2C3&regionDeleted=false'
    url += '&searchString=' + contractNumber;

    return new Promise((resolve => {
        request(url, {json: true}, (err, res, body) => {
            if (err) {
                return console.log(err);
            }

            const document = parse.parse(body);

            const attributes = document.querySelector('input.entityId').rawAttrs;

            const value = attributes.slice(attributes.indexOf('value')).match(/"(.*?)"/)[1];
            const budgetCode = attributes.slice(attributes.indexOf('budgetCode')).match(/"(.*?)"/)[1];

            let url_2 = "http://zakupki.gov.ru/epz/contract/printForm/contractsBulkPrintForm.html?"
            url_2 += 'bid=' + budgetCode;

            url_2 += '&cids=' + value;

            request(url_2, {json: true}, (err, res, bodyWithtable) => {
                if (err) {
                    return console.log(err);
                }

                var documentWithTable = parse.parse(bodyWithtable);

                let table = documentWithTable.querySelectorAll('.contractsTableSub tr');

                var contract = {};
                contract['number'] = contractNumber;
                contract['customer'] = documentWithTable.querySelectorAll('.contractsTable tr')[3].childNodes[7].childNodes[0].rawText;
                contract['cost'] = table[0].childNodes[7].childNodes[0].rawText.trim();
                contract['subject'] = table[0].childNodes[1].childNodes[0].rawText.trim();
                contract['address'] = documentWithTable.querySelectorAll('.contractsTableSub')[1].querySelectorAll('tr')[0].childNodes[3]
                    .childNodes[0].rawText.trim();
                contract['expirationDate'] = documentWithTable.querySelectorAll('.contractsTable tr')[3].childNodes[5].childNodes[0].rawText.trim();

                var hmAPI = new HereMapsAPI(config);

                var geocodingParams = {
                    "searchtext": contract['address']
                };

                hmAPI.geocode(geocodingParams, function (err, result) {
                    if (err) {
                        console.log(err);
                    }

                    if (!err) {
                        contract['address'] = result.Response.View[0].Result[0].Location.Address.Label;
                        contract['latitude'] = result.Response.View[0].Result[0].Location.DisplayPosition.Latitude;
                        contract['longitude'] = result.Response.View[0].Result[0].Location.DisplayPosition.Longitude;
                    }

                    var newContract = {};

                    contract['troubles'] = 'Нет';

                    newContract['Номер контракта'] = contract['number'];
                    newContract['Заказчик'] = contract['customer'];
                    newContract['Предмет проверки'] = contract['subject'];
                    newContract['Стоимость объекта проверки'] = contract['cost'];
                    newContract['Наличие замечаний'] = contract['troubles'];
                    newContract['Адрес объекта'] = contract['address'];
                    newContract['Широта'] = contract['latitude'];
                    newContract['Долгота'] = contract['longitude'];
                    newContract['Дата завершения контракта'] = contract['expirationDate'];

                    console.log(newContract);
                    var xls = json2xls(newContract);

                    fs.writeFileSync('./uploads/data.xlsx', xls, 'binary');
                    resolve({path: '/uploads/data.xlsx'});
                });
            });
        })
    }));
};

module.exports = {process};
