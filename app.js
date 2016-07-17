const express = require('express');

const crawler = require('./crawler');
const dumper = require('./dumper');

crawler.run().then(function(data) {
    dumper.dump()(data);
    // dumper.dump('./chengyu-pinyin.dump', true)(data);
}, function(err) {
    console.error(err.message);
});

/*
const app = express();
app.set('port', 5000);
app.get('/', function(req, res, next) {
    crawler.run(function(results) {
        res.send(results);
    });
});
const server = app.listen(app.get('port'), function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Started listening at .. http://%s:%s', host, port);
});
*/