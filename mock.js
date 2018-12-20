const faker = require('faker');

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
        id: '1',
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

    return users;
};

module.exports = {
    generateUsers
}