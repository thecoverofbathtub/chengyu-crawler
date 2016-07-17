let ChengyuFetcher = require('./chengyu-fetcher');
let ChengyuSerializer = require('./chengyu-serializer');

ChengyuFetcher.run(false)
    .then(chengyus => {
        ChengyuSerializer.serialize(chengyus);
    })
    .catch(err => {
        console.error(err);
    });