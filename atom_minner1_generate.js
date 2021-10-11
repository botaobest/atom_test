//
// 生成随机助记词并打印前N个地址
//

const atom_util = require("./atom_util.js");

async function main(){
    let mnemonic = await atom_util.walletGenerate();
    console.log("mnemonic: ", mnemonic);

    let accounts = await atom_util.getAccounts(mnemonic, 10);
    let size = Object.values(accounts).length;
    for(let i = 0; i < size; i++){
        console.log("accounts: ", Object.values(accounts)[i].address);
    }
}

main();

