const amino_1 = require("@cosmjs/amino");
const BigNumber = require('bignumber.js');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_2 = require("cosmjs-types/cosmos/distribution/v1beta1/tx");
const tx_4 = require("cosmjs-types/cosmos/staking/v1beta1/tx");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");


const encoding_1 = require("@cosmjs/encoding");
const signing = require("@cosmjs/proto-signing");

const util = require('./util.js');


const feeGas = 210000;          //180000;       // gas数量 用不完不退回
const feeGasPrice = 0.0000000025       //uatom 0.025
const gasLimit = 200000;
const denomUATOM = "uatom";



// 生成随机助记词
async function walletGenerate(){
    let wallet = await launchpad.Secp256k1HdWallet.generate(12);
    return wallet.secret.data;
}
exports.walletGenerate = walletGenerate;


// 钱包加密生成json
async function walletToJson(wallet){
    let walletStr = await wallet.serialize("123456");
    console.log("wallet string: ", walletStr);
}
exports.walletToJson = walletToJson;


// 获取指定数量的地址
async function getWalletWithAccountSize(mnemonic, accountSize){
    let ops = {
        bip39Password: "",
        hdPaths:[],
        prefix: "cosmos",
    }

    for(let i = 0; i < accountSize; i++){
        ops.hdPaths.push(amino_1.makeCosmoshubPath(i));
    }

    let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, ops);
    return wallet;
}
exports.getWalletWithAccountSize = getWalletWithAccountSize;




// 获取指定数量的地址
async function getAccounts(mnemonic, accountSize){
    let wallet = await getWalletWithAccountSize(mnemonic, accountSize);
    let accounts = await wallet.getAccounts();
    return accounts;
}
exports.getAccounts = getAccounts;

// 指定地址所在钱包路径index, 进行对应地址的签名
// 默认为0, 即钱包默认地址为index为0的地址
// 使用外部传入的账户sequence, 转账数量, 可用于高频转账
async function transferByPath(rpc, mnemonic, pathIndex, recipient, amount, memo, feeAmount, signerData){
    try {
        if(!pathIndex){
            pathIndex = 0;
        }
        let walletOptions = {bip39Password: "", hdPaths: [amino_1.makeCosmoshubPath(pathIndex)], prefix: "cosmos"};
        let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);

        let [account] = await wallet.getAccounts();
        let client = await stargate.SigningStargateClient.connectWithSigner(rpc, wallet, {});

        // 判断signerData
        // {}时需要自动构建
        if(Object.keys(signerData).length == 0){
            let accountRes = await client.getAccount(account.address);
            signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: accountRes.sequence,
                chainId: "cosmoshub-4",
            }
        }

        let fee = {
            amount: [{
                    denom: denomUATOM,
                    amount: feeAmount.toString(),
                },],
            gas: feeGas.toString(),
        };
        let amountObj = {
            from_address: account.address,
            to_address: recipient,
            denom: denomUATOM,
            amount: amount.toString(),  // 精度: 6
        };
        let sendMsg = {
            typeUrl: "/cosmos.bank.v1beta1.MsgSend",
            value: {
                fromAddress: account.address,
                toAddress: recipient,
                amount: [...[amountObj]],
            },
        };

        let txid = await signWithSequence(client, account.address, [sendMsg], fee, memo, signerData);
        return txid;
    } catch (e) {
        console.log(e);
        return;
    }
}
exports.transferByPath = transferByPath;

// 抵押
// 指定地址所在钱包路径index, 进行对应地址的签名
// 默认为0, 即钱包默认地址为index为0的地址
// 使用外部传入的账户sequence, 转账数量, 可用于高频转账
async function delegateByPath(rpc, mnemonic, pathIndex, validator, deleAmount, feeAmount, memo, signerData){
    try {
        if(!pathIndex){
            pathIndex = 0;
        }
        let walletOptions = {bip39Password: "", hdPaths: [amino_1.makeCosmoshubPath(pathIndex)], prefix: "cosmos"};
        let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);

        let [account] = await wallet.getAccounts();
        let client = await stargate.SigningStargateClient.connectWithSigner(rpc, wallet, {});

        // 判断signerData
        // {}时需要自动构建
        if(Object.keys(signerData).length == 0){
            let accountRes = await client.getAccount(account.address);
            signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: accountRes.sequence,
                chainId: "cosmoshub-4",
            }
        }

        let fee = {
            amount: [{
                    denom: denomUATOM,
                    amount: feeAmount.toString(),
                },],
            gas: feeGas.toString(),
        };

        delegateMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgDelegate",
            value: tx_4.MsgDelegate.fromPartial({
                delegatorAddress: account.address,
                validatorAddress: validator,
                amount: {
                    denom: denomUATOM,
                    amount: deleAmount.toString(),
                },
            }),
        };

        console.log("delegate msg: ", delegateMsg);

        let txid = await signWithSequence(client, account.address, [delegateMsg], fee, memo, signerData);
        return txid;
    } catch (e) {
        console.log(e);
        return;
    }
}

exports.delegateByPath = delegateByPath;

// 赎回抵押
// 指定地址所在钱包路径index, 进行对应地址的签名
// 默认为0, 即钱包默认地址为index为0的地址
// 使用外部传入的账户sequence, 转账数量, 可用于高频转账
async function unDelegateByPath(rpc, mnemonic, pathIndex, validator, amount, feeAmount, memo, signerData){
    try {
        if(!pathIndex){
            pathIndex = 0;
        }
        let walletOptions = {bip39Password: "", hdPaths: [amino_1.makeCosmoshubPath(pathIndex)], prefix: "cosmos"};
        let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);

        let [account] = await wallet.getAccounts();
        let client = await stargate.SigningStargateClient.connectWithSigner(rpc, wallet, {});

        // 判断signerData
        // {}时需要自动构建
        if(Object.keys(signerData).length == 0){
            let accountRes = await client.getAccount(account.address);
            signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: accountRes.sequence,
                chainId: "cosmoshub-4",
            }
        }

        let fee = {
            amount: [{
                    denom: denomUATOM,
                    amount: feeAmount.toString(),
                },],
            gas: feeGas.toString(),
        };

        let undelegateMsg = {
            typeUrl: "/cosmos.staking.v1beta1.MsgUndelegate",
            value: tx_4.MsgUndelegate.fromPartial({
                delegatorAddress: account.address,
                validatorAddress: validator,
                amount: {
                    denom: denomUATOM,
                    amount: amount.toString(),
                },
            }),
        };

        let txid = await signWithSequence(client, account.address, [undelegateMsg], fee, memo, signerData);
        return txid;
    } catch (e) {
        console.log(e);
        return;
    }
}
exports.unDelegateByPath = unDelegateByPath;


// 领取抵押奖励
// 指定地址所在钱包路径index, 进行对应地址的签名
// 默认为0, 即钱包默认地址为index为0的地址
// 使用外部传入的账户sequence, 转账数量, 可用于高频转账
async function withdrawRewardsByPath(rpc, mnemonic, pathIndex, validator, feeAmount, memo, signerData){
    try {
        if(!pathIndex){
            pathIndex = 0;
        }
        let walletOptions = {bip39Password: "", hdPaths: [amino_1.makeCosmoshubPath(pathIndex)], prefix: "cosmos"};
        let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);

        let [account] = await wallet.getAccounts();
        let client = await stargate.SigningStargateClient.connectWithSigner(rpc, wallet, {});

        // 判断signerData
        // {}时需要自动构建
        if(Object.keys(signerData).length == 0){
            let accountRes = await client.getAccount(account.address);
            signerData = {
                accountNumber: accountRes.accountNumber,
                sequence: accountRes.sequence,
                chainId: "cosmoshub-4",
            }
        }

        let fee = {
            amount: [{
                    denom: denomUATOM,
                    amount: feeAmount.toString(),
                },],
            gas: feeGas.toString(),
        };

        let withdrawMsg = {
            typeUrl: "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward",
            value: tx_2.MsgWithdrawDelegatorReward.fromPartial({
                delegatorAddress: account.address,
                validatorAddress: validator,
            }),
        };

        console.log(withdrawMsg);
        let txid = await signWithSequence(client, account.address, [withdrawMsg], fee, memo, signerData);
        return txid;
    } catch (e) {
        console.log(e);
        return;
    }
}
exports.withdrawRewardsByPath = withdrawRewardsByPath;


async function signWithSequence(client, signerAddress, messages, fee, memo, signerData){
    try {
        let txRaw = await client.sign(signerAddress, messages, fee, memo, signerData);
        let txBytes = tx_5.TxRaw.encode(txRaw).finish();
        let broadcasted = await client.forceGetTmClient().broadcastTxSync({tx: txBytes});
        if (broadcasted.code) {
            console.log(`Broadcasting transaction failed with code ${broadcasted.code} codespace: ${broadcasted.codeSpace}, Log: ${broadcasted.log}`);
        }
        let transactionId = encoding_1.toHex(broadcasted.hash).toUpperCase();
        //console.log("transaction id: ", transactionId);
        return transactionId;
    } catch (e) {
        console.error(e);
        return;
    }
}

