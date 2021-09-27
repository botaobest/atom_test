const fs = require('fs');

async function sleep(time) {
    await new Promise((resolve) => setTimeout(resolve, time));
}
exports.sleep = sleep;

async function readKeyFromFile(path){
        let keyLine = fs.readFileSync(path).toString();
        if (keyLine.charAt(keyLine.length-1) == '\n'){
            return keyLine.slice(0,keyLine.length-1);
        }

        return keyLine;
}

exports.readKeyFromFile = readKeyFromFile;

// 有参数时argvArray是参数数组,如[a, b, c] --> func(a,b,c)
async function Timer(timestampTarget, func, argvArray){
    if( argvArray && argvArray.length > 0 ){
        setTimeout(func, timestampTarget, ...argvArray);
    }else{
        setTimeout(func, timestampTarget);
    }
}

exports.Timer = Timer;

// 北京时间格式: let str = "2021-09-23 20:15:00+08:00 --> utc time:  2021-09-23T12:15:00.000Z
// utc时间格式: let str = "2021-09-23 12:15:00 --> utc time:  2021-09-23T12:15:00.000Z
// return millisecond
async function toUtcTimestamp(str){
    let t = new Date(str)
    return t.getTime();
}

exports.toUtcTimestamp = toUtcTimestamp
