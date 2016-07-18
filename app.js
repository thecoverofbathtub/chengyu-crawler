let ChengyuFetcher = require('./chengyu-fetcher');
let ChengyuSerializer = require('./chengyu-serializer');

const dumpPath = './chengyu.pinyin.dump';

ChengyuFetcher.run(false)
    .then(chengyus => {
        ChengyuSerializer.serialize(dumpPath, chengyus);
    })
    .catch(err => {
        console.error(err);
    });