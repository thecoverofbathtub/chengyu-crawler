let fs = require('fs');
let pinyin = require('pinyin');

function toPinyin(text) {
    return pinyin(text, {
        style: pinyin.STYLE_TONE2,
        heteronym: false
    }).join(' ');
}

function toHanziPinyin(text) {
    return text + '    ' + toPinyin(text);
}

exports.serialize = function(filePath, chengyus) {
    chengyus.sort((a, b) => {
        let pinyinA = toPinyin(a);
        let pinyinB = toPinyin(b);
        return pinyinA.localeCompare(pinyinB);
    });
    fs.writeFileSync(filePath, chengyus.map(toHanziPinyin).join('\n'));
    console.log('Cheng-yu saved successfully with pinyin');
};