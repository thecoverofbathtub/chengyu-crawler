let Q = require('q');
let async = require('async');
let cheerio = require('cheerio');
let fs = require('fs');
let iconv = require('iconv-lite');
let request = require('request');

const sourceUrlTemplate = 'http://chengyu.t086.com/list/${firstChar}_${index}.html';
const concurrencyLimit = 50;
const dumpPath = './chengyu.dump';

function getChengyuFromPage(pageHtml) {
    let chengyus = [];
    var $ = cheerio.load(pageHtml);
    $('.listw > ul > li > a').each(function(index, elem) {
        chengyus.push($(elem).text().replace(/[^\u4e00-\u9fa5]/g, ''));
    });
    return chengyus;
}

function getChengyuFromUrl(urlGen) {
    let deferred = Q.defer();
    let siteUrl = urlGen.next();
    request({
        url: siteUrl,
        encoding: null
    }, (err, response, body) => {
        if (err || response.statusCode !== 200) {
            deferred.reject('Failed at: ' + siteUrl);
            return;
        }
        let chengyus = getChengyuFromPage(iconv.decode(body, 'gbk').toString('binary'));
        chengyus.urlGen = urlGen;
        chengyus.siteUrl = siteUrl;
        deferred.resolve(chengyus);
    });
    return deferred.promise;
}

let UrlGen = function(template) {
    let index = 1;
    return {
        peek: function() {
            return template.replace('${index}', index);
        },
        next: function() {
            let ret = this.peek();
            index++;
            return ret;
        }
    };
};

function serializeChengyu(filePath, chengyus) {
    fs.writeFileSync(filePath, JSON.stringify(chengyus, null, 4));
    console.log('Cheng-yu dumped successfully');
}

function deserializeChengyu(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch(ex) {
        return undefined;
    }
}

let ChengyuFetcher = function() {
    this.chengyus = [];
    this.jobs = async.queue((urlGen, callback) => {
        getChengyuFromUrl(urlGen)
            .then(chengyus => {
                callback(null, chengyus);
            })
            .catch(err => {
                callback(err, undefined);
            })
    }, concurrencyLimit);
};

ChengyuFetcher.prototype.run = function(forceReload) {
    if (!forceReload) {
        let chengyus = deserializeChengyu(dumpPath);
        if (chengyus) {
            return Q.resolve(chengyus);
        }
    }
    const { jobs } = this;
    let deferred = Q.defer();
    let alphabet = 'ABCDEFGHJKLMNOPQRSTWXYZ'.split('');
    let urlGens = alphabet.map(ch => new UrlGen(sourceUrlTemplate.replace('${firstChar}', ch)));
    jobs.drain = () => {
        serializeChengyu(dumpPath, this.chengyus);
        deferred.resolve(this.chengyus);
    };
    urlGens.forEach(urlGen => {
        jobs.push(urlGen, this.collectChengyusFromAsyncResult.bind(this));
    });
    return deferred.promise;
};

ChengyuFetcher.prototype.collectChengyusFromAsyncResult = function(err, result) {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Fetched cheng-yu successfully from ' + result.siteUrl);
    result.forEach(chengyu => this.chengyus.push(chengyu));
    this.jobs.push(result.urlGen, this.collectChengyusFromAsyncResult.bind(this));
};

let instance = new ChengyuFetcher();
Object.freeze(instance);
module.exports = instance;