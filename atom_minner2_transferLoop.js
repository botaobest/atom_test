//
// 1.将第一地址中的atom转入剩余的N-1个地址
// 2.将后面N-1个地址的atom归集到第一个地址中
//


const BigNumber = require('bignumber.js');
const stargate = require("@cosmjs/stargate");

const util = require('./util.js');
const atom_util = require("./atom_util.js");

const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";

var sequence = 0;

// 分散
async function transferToLoop(mnemonic, accountSize, amountMin, amountMax, feeAmount, memo){
    let wallet = await atom_util.getWalletWithAccountSize(mnemonic, accountSize);
    let client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {});
    let accounts = await wallet.getAccounts();

    let beginAccount = Object.values(accounts)[0].address;

    let accountRes = await client.getAccount(beginAccount);
    if(sequence < accountRes.sequence || sequence == 0){
        sequence = accountRes.sequence;
    }

    let bigFeeAmount = BigNumber(feeAmount).times(Math.pow(10, 6)).toFixed();

    // 第一个地址index为0, 用于向其他地址转账
    for(let i = 2664; i < accountSize; i++){
        let signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: sequence,
                chainId: "cosmoshub-4",
        }
        let to = Object.values(accounts)[i].address;

        let amount = 0;
        if(amountMin > amountMax){
            console.log("invalid amountMin, amountMax", amountMin, amountMax);
        }
        if(amountMin < amountMax){
            amount = await util.getRandomWithRange(amountMin, amountMax);
        }else{
            amount = amountMin;
        }

        let bigAmount = BigNumber(amount).times(Math.pow(10, 6)).toFixed(0);
        let balance = await client.getBalance(beginAccount, "uatom");
        if(balance - bigAmount <= feeAmount){
            console.log(beginAccount, "balance is not enough", balance);
            return;
        }

        let txid = await atom_util.transferByPath(rpcEndpoint, mnemonic, 0, to, parseInt(bigAmount), memo, parseInt(bigFeeAmount), signerData);
        sequence++;
        console.log("from:", beginAccount, "to index: ", i, "to: ", to, "amount: ", bigAmount/1000000, "fee", feeAmount, "txid: ", txid);
        await util.sleep(100);
    }
}

// 归集
async function transferBackLoop(mnemonic, accountSize, feeAmount, memo){
    let wallet = await atom_util.getWalletWithAccountSize(mnemonic, accountSize);
    let client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {});
    let accounts = await wallet.getAccounts();
    let to = Object.values(accounts)[0].address;
    let bigFeeAmount = BigNumber(feeAmount).times(Math.pow(10, 6)).toFixed();

    // 第一个地址index为0, 用于接收他地址转账
    for(let i = 0; i < accountSize; i++){
        let from = Object.values(accounts)[i].address;
        let balance = await client.getBalance(from, "uatom");
        if(balance.amount == 0){
            console.log(from, "balance: ", balance.amount);
            continue;
        }
        let amount = balance.amount - parseInt(bigFeeAmount);
        if(amount < feeAmount){
            console.log(from, "balance is not enough", balance/1000000);
            continue;
        }
        let txid = await atom_util.transferByPath(rpcEndpoint, mnemonic, i, to, amount, memo, parseInt(bigFeeAmount), {});
        console.log("address index:", i, "from:", from, "to: ", to, "amount: ", amount/1000000, "fee", feeAmount, "txid: ", txid);
        await util.sleep(100);
    }
}

// 抵押
async function delegateLoop(mnemonic, accountSize, validator, amount, feeAmount, memo){
    let wallet = await atom_util.getWalletWithAccountSize(mnemonic, accountSize);
    let client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {});
    let accounts = await wallet.getAccounts();
    let bigAmount = BigNumber(amount).times(Math.pow(10, 6)).toFixed();
    let bigFeeAmount = BigNumber(feeAmount).times(Math.pow(10, 6)).toFixed();

    console.log("bigAmount: ", bigAmount);
    // 第一个地址index为0, 用于接收他地址转账
    for(let i = 400; i < accountSize; i++){
        let from = Object.values(accounts)[i].address;
        let balance = await client.getBalance(from, "uatom");
        if(balance.amount == 0){
            console.log("address index:", i, from, "balance: ", balance.amount);
            continue;
        }
        if( bigAmount > (balance.amount - parseInt(bigFeeAmount)) ){
            console.log("address index:", i, from, "balance is not enough", balance/1000000);
            continue;
        }

        let txid = await atom_util.delegateByPath(rpcEndpoint, mnemonic, i, validator, bigAmount, parseInt(bigFeeAmount), memo, {});
        console.log("address index:", i, "delegate from:", from, "validator: ", validator, "amount: ", amount, "fee", feeAmount, "txid: ", txid);
        await util.sleep(100);
    }
}

// 赎回抵押
async function unDelegateLoop(mnemonic, accountSize,  validator, amount, feeAmount, memo){
    let wallet = await atom_util.getWalletWithAccountSize(mnemonic, accountSize);
    let client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {});
    let accounts = await wallet.getAccounts();
    let bigAmount = BigNumber(amount).times(Math.pow(10, 6)).toFixed();
    let bigFeeAmount = BigNumber(feeAmount).times(Math.pow(10, 6)).toFixed();

    // 第一个地址index为0, 用于接收他地址转账
    for(let i = 1; i < accountSize; i++){
        let from = Object.values(accounts)[i].address;
        let balance = await client.getBalance(from, "uatom");
        if(balance.amount == 0){
            console.log("address index:", i, from, "balance: ", balance.amount);
            continue;
        }
        if( bigFeeAmount > balance.amount){
            console.log("address index:", i, from, "balance is not enough", balance/1000000);
            continue;
        }
        let txid = await atom_util.unDelegateByPath(rpcEndpoint, mnemonic, i, validator, bigAmount, parseInt(bigFeeAmount), memo, {});
        console.log("address index:", i, "undelegate from:", from, "validator: ", validator, "amount: ", amount, "fee", feeAmount, "txid: ", txid);
        await util.sleep(100);
    }
}

// 赎回抵押
async function withdrawRewardsLoop(mnemonic, accountSize,  validator, feeAmount, memo){
    let wallet = await atom_util.getWalletWithAccountSize(mnemonic, accountSize);
    let client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, {});
    let accounts = await wallet.getAccounts();
    let bigFeeAmount = BigNumber(feeAmount).times(Math.pow(10, 6)).toFixed();

    // 第一个地址index为0, 用于接收他地址转账
    for(let i = 1; i < accountSize; i++){
        let from = Object.values(accounts)[i].address;
        let balance = await client.getBalance(from, "uatom");
        if(balance.amount == 0){
            console.log("address index:", i, from, "balance: ", balance.amount);
            continue;
        }
        if( bigFeeAmount > balance.amount){
            console.log("address index:", i, from, "balance is not enough", balance/1000000);
            continue;
        }

        // 缺少一个查询可领取奖励的接口
        let txid = await atom_util.withdrawRewardsByPath(rpcEndpoint, mnemonic, i, validator, parseInt(bigFeeAmount), memo, {});
        console.log("address index:", i, "withdraw from:", from, "validator: ", validator,  "fee", feeAmount, "txid: ", txid);

        await util.sleep(100);
    }
}



async function transferToTest(mnemonic){
    let accountSize = 3500;
    let amountMin   = 0.001;
    let amountMax   = 0.005;
    let feeAmount = 0.000001;
    let memo = "";

    await transferToLoop(mnemonic, accountSize, amountMin, amountMax, feeAmount, memo);
}

async function transferBackTest(mnemonic){
    let accountSize = 10000;
    let feeAmount = 0.000001;
    let memo = "";

    await transferBackLoop(mnemonic, accountSize, feeAmount, memo);
}

async function delegateTest(mnemonic){
    let accountSize = 3200;
    let amount = 0.001
    let feeAmount = 0.000001;
    let memo = "";
    let validator = "cosmosvaloper1ec3p6a75mqwkv33zt543n6cnxqwun37rr5xlqv";

    await delegateLoop(mnemonic, accountSize, validator, amount, feeAmount, memo);
}

async function unDelegateTest(mnemonic){
    let accountSize = 2000;
    let amount = 0.001
    let feeAmount = 0.000001;
    let memo = "";
    let validator = "cosmosvaloper1ec3p6a75mqwkv33zt543n6cnxqwun37rr5xlqv";


    await unDelegateLoop(mnemonic, accountSize, validator, amount, feeAmount, memo);
}

async function withdrawRewardsTest(mnemonic){
    let accountSize = 2000;
    let feeAmount = 0.000001;
    let memo = "";
    let validator = "cosmosvaloper1ec3p6a75mqwkv33zt543n6cnxqwun37rr5xlqv";


    await withdrawRewardsLoop(mnemonic, accountSize, validator,feeAmount, memo);
}
async function main(){
    let mnemonic = "";
    //await transferToTest(mnemonic);
    //await transferBackTest(mnemonic);
    await delegateTest(mnemonic);
    //await withdrawRewardsTest(mnemonic);
    //await unDelegateTest(mnemonic);
}
main();
