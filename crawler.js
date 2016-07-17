const async = require('async');
const charset = require('superagent-charset');
const superagent = require('superagent');
const cheerio = require('cheerio');
const sprintf = require('sprintf-js').sprintf;
// const url = require('url');

charset(superagent);

const config = {
    CONCURRENCY_LIMIT: 10
};

const UrlGen = (function() {

    var Gen = function(format, prefix) {
        var idx = 0;
        return {
            hasNext: function() {
                return true;
            },
            next: function() {
                if (this.hasNext()) {
                    idx++;
                    return sprintf(format, prefix, idx);
                }
                return null;
            },
            reset: function() {
                idx = 0;
            }
        }
    };

    var prefixes = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T','W','X','Y','Z'];
    var gens = prefixes.map(function(prefix) {
        return Gen('http://chengyu.t086.com/list/%s_%d.html', prefix);
    });

    var idx = 0;

    return {
        hasNext: function() {
            return (idx < gens.length && gens[idx].hasNext());
        },
        next: function() {
            while (this.hasNext()) {
                var ret = gens[idx].next();
                if (!gens[idx].hasNext()) idx++;
                if (ret) return ret;
            }
            return null;
        },
        reset: function(i) {
            idx = i ? i : 0;
            gens.forEach(function(gen) {
                gen.reset();
            });
        },
        gens: function() {
            return gens;
        },
        all: function() {
            var i = idx;
            var ret = [];
            this.reset();
            while(this.hasNext()) {
                ret.push(this.next());
            }
            this.reset(i);
            return ret;
        }
    };
})();

function parseContent(text) {
    /*
    return text.match(/\u3010.*?\u3011/g).map(function(i) {
        return i.replace(/[^\u4e00-\u9fa5]/g, '');
    });
    */
    var ret = [];
    var $ = cheerio.load(text);
    $('.listw > ul > li > a').each(function(index, elem) {
        ret.push($(elem).text().replace(/[^\u4e00-\u9fa5]/g, ''));
    });
    return ret;
}

var MapReducer = function(resolve, reject) {

    function mapper(site, callback) {
        var gen = site.gen;
        var siteUrl = site.url;

        superagent.get(siteUrl)
            .charset('gbk')
            .end(function parseResponse(err, response) {
                if (err) {
                    console.log('Got 404 at: ' + siteUrl);
                    // reject(err);
                    callback(null, undefined);
                    return;
                }
                q.push({gen: gen, url: gen.next()}, done);
                console.log('Loaded ' + siteUrl + ' successfully');
                callback(null, parseContent(response.text));
            });
    };

    function reducer() {
        resolve(q.results.reduce(function(a, b) {
            return a.concat(b);
        }));
    };

    function done(err, results) {
        if (q.results === undefined) {
            q.results = [];
        }
        if (results !== undefined) {
            q.results.push(results);
        }
    };

    var q;

    this.run = function(sites) {
        q = async.queue(mapper, config.CONCURRENCY_LIMIT);
        q.drain = reducer;
        sites.forEach(function(site) {
            q.push(site, done);
        });
    };
};

function run() {

    return new Promise(function(resolve, reject) {

        // var siteUrls = UrlGen.all();
        // console.log('Fetching ' + siteUrls.length + ' URLs');

        UrlGen.reset();
        var siteGens = UrlGen.gens();
        var sites = siteGens.map(function(i) {
            return {
                gen: i,
                url: i.next()
            };
        });

        new MapReducer(resolve, reject).run(sites);

        /*
        async.mapLimit(sites, config.CONCURRENCY_LIMIT,
            function mapper(site, callback) {
                var gen = site.gen;
                var siteUrl = site.url;

                superagent.get(siteUrl)
                    .charset('gbk')
                    .end(function parseResponse(err, response) {
                        if (err) {
                            console.log('Got 404 at: ' + siteUrl);
                            // gen.freeze();
                            // reject(err);
                            return;
                        }
                        sites.push({gen: gen, url: gen.next()});
                        console.log('Loaded ' + siteUrl + ' successfully');
                        callback(null, parseContent(response.text));
                    });
            },
            function reducer(err, results) {
                if (err) {
                    reject(err); return;
                }
                resolve(results.reduce(function(a, b) {
                    return a.concat(b);
                }));
            });
        */
    });
}

exports.run = run;