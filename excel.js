const XLSX = require('xlsx');
const CONTRACT_KEY_MAPPER = {
    'Номер контракта': 'number',
    'Заказчик': 'customer',
    'Предмет проверки': 'subject',
    'Стоимость объекта проверки': 'cost',
    'Наличие замечаний': 'troubles',
    'Адрес объекта': 'address',
    'Широта': 'latitude',
    'Долгота': 'longitude',
    'Дата завершения контракта': 'expirationDate'
};


const parseContracts = (filePath) => {
    const workbook = XLSX.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    const firstSheetName = sheetNameList[0];
    const contracts = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName]);

    return contracts.map(contract => {
        const newContract = {};

        Object.keys(contract).forEach(key => {
            const newKey = CONTRACT_KEY_MAPPER[key];
            newContract[newKey] = contract[key];
        });

        return newContract;
    });
};

module.exports = {
    parseContracts
};
