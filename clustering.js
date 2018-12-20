const kmeans = require('ml-kmeans');

const clusterize = (contracts) => {
    const vectors = contracts.map(contract =>
        [
            parseFloat(contract.latitude),
            parseFloat(contract.longitude)
        ]);

    console.log('Contracts length: ' + contracts.length);

    const result = kmeans(vectors, 5);

    console.log('Centroids: ' + result.centroids.length);

    result.centroids.forEach((centroid, idx) => {
        centroid.index = idx;
    });

    return result;
};

const getDistance =
    (first, second) => Math.sqrt(
        (first.latitude - second.latitude) ** 2 +
        (first.longitude - second.longitude) ** 2);

const findClosestCentroidForObject = (object, centroids, usedCentroids) => {
    const iterableCentroids = centroids
        .filter((centroid) => usedCentroids.indexOf(centroid.index) === -1);

    const firstCentroid = {
        latitude: iterableCentroids[0].centroid[0],
        longitude: iterableCentroids[0].centroid[1]
    };

    let minDistance = getDistance(object, firstCentroid);
    let closestCentroid = iterableCentroids[0].index;

    for (let i = 1; i < iterableCentroids.length; i++) {
        const centroid = {
            latitude: iterableCentroids[0].centroid[0],
            longitude: iterableCentroids[0].centroid[1]
        };

        const distance = getDistance(object, centroid);

        if (distance < minDistance) {
            minDistance = distance;
            closestCentroid = iterableCentroids[i].index;
        }
    }

    return closestCentroid;
};

const combineUsersAndContracts = (users, contracts) => {
    const clusteringResult = clusterize(contracts);
    const combination = [];
    const usedCentroids = [];

    users.forEach(user => {

        let closest = findClosestCentroidForObject(user, clusteringResult.centroids, usedCentroids);

        while (usedCentroids.indexOf(closest) !== -1) {
            closest = findClosestCentroidForObject(user, clusteringResult.centroids, usedCentroids);
        }

        usedCentroids.push(closest);

        const clusterContracts = [];
        clusteringResult.clusters.forEach((centroidIdx, idx) => {
            if (centroidIdx === closest) {
                clusterContracts.push(contracts[idx]);
            }
        });

        combination.push({
            userId: user.id,
            contractsId: clusterContracts.map(contract => contract.id)
        });
    });

    return combination;
};

module.exports = { combineUsersAndContracts };
