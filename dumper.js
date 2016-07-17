const fs = require('fs');
const pinyin = require('pinyin');

var path = './chengyu.dump';
var isPinyinOnly = false;

function toPinyin(text) {
    return pinyin(text, {
        style: pinyin.STYLE_TONE2,
        heteronym: false
    }).join(' ');
}

function toHanziPinyin(text) {
    return text + '    ' + toPinyin(text);
}

function dump(arr) {
    fs.writeFile(path,
        arr.map(isPinyinOnly ? toPinyin : toHanziPinyin).join('\n'),
        function(err) {
            if(err) {
                throw new Error(err.message);
            }
            console.log("Chengyu saved successfully");
        }
    );
};

exports.dump = function(_path, _isPinyinOnly) {
    if (_path !== undefined) {
        path = _path;
    }
    if (_isPinyinOnly !== undefined) {
        isPinyinOnly = _isPinyinOnly;
    }
    return dump;
};