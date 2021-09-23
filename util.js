const fs = require('fs');

async function sleep(time) {
    await new Promise((resolve) => setTimeout(resolve, time));
}
exports.sleep = sleep;

function readKeyFromFile(path){
        let keyLine = fs.readFileSync(path).toString();
        if (keyLine.charAt(keyLine.length-1) == '\n'){
            return keyLine.slice(0,keyLine.length-1);
        }

        return keyLine;
}

exports.readKeyFromFile = readKeyFromFile;

