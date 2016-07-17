let fs = require('fs');
let pinyin = require('pinyin');

const dumpPath = './chengyu.pinyin.dump';

function toPinyin(text) {
    return pinyin(text, {
        style: pinyin.STYLE_TONE2,
        heteronym: false
    }).join(' ');
}

function toHanziPinyin(text) {
    return text + '    ' + toPinyin(text);
}

function dump(chengyus) {
    chengyus.sort((a, b) => {
        let pinyinA = toPinyin(a);
        let pinyinB = toPinyin(b);
        return pinyinA.localeCompare(pinyinB);
    });
    fs.writeFileSync(dumpPath, chengyus.map(toHanziPinyin).join('\n'));
    console.log('Cheng-yu saved successfully');
}

exports.serialize = dump;