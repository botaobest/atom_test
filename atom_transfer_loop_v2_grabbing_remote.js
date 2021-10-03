const encoding_1 = require("@cosmjs/encoding");
const signing = require('@cosmjs/proto-signing');
const stargate = require("@cosmjs/stargate");
const launchpad = require("@cosmjs/launchpad");
const tx_5 = require("cosmjs-types/cosmos/tx/v1beta1/tx");
const BigNumber = require('bignumber.js');
const util = require('./util.js');
const prompt = require('prompt');

// config
const rpcEndpoint = "https://rpc.cosmos-hub.app.beta.starport.cloud/";
const feeGas = 100000;          //180000;       // gas数量 用不完不退回
//const feeAmount = 100;          // uatom数量
const feeGasPrice = 0.0025       //uatom 0.025
const gasLimit = 200000;
const denomUATOM = "uatom";

async function sendAtomLoopWithBeginSequence(mnemonic, to, fAmount, gasPriceTimes, feeAmount){
    let recipient = to;
    let memo = "" 

    let wallet = await signing.DirectSecp256k1HdWallet.fromMnemonic(mnemonic);
    const [firstAccount] = await wallet.getAccounts();
    console.log("address: ", firstAccount.address);
    const gasPrice = launchpad.GasPrice.fromString((feeGasPrice*gasPriceTimes).toString() + denomUATOM);
    const gasLimits = {
        send: gasLimit,
    };
    const options = { gasPrice: gasPrice, gasLimits: gasLimits };
    let bigAmount = 0;
    console.log("fAmount: ", fAmount);
    if(fAmount > 0){
        bigAmount = BigNumber(fAmount).times(Math.pow(10, 6)).toFixed();
    }else{
        res = await client.getBalance(firstAccount.address, 'uatom');
        console.log("balance: ", res.amount);
        bigAmount = (res.amount - feeAmount).toString();
    }

    console.log("big amount: ", bigAmount);

    let fee = {
        amount: [
            {
                denom: denomUATOM,
                amount: feeAmount.toString(),
            },
        ],
        gas: feeGas.toString(), 
    };

    let amount = {
        from_address: firstAccount.address,
        to_address: recipient,
        denom: denomUATOM,
        amount: bigAmount,  // 精度: 6
    };



    let sendMsg = {
        typeUrl: "/cosmos.bank.v1beta1.MsgSend",
        value: {
            fromAddress: firstAccount.address,
            toAddress: recipient,
            amount: [...[amount]],
        },
    };

    console.log("from: ", firstAccount.address);
    for(;;){
        // 预定未来loopAmount个sequenceid
        let loopAmount = 100;
        let signerData = {}
        let i = 0;
        const client = await stargate.SigningStargateClient.connectWithSigner(rpcEndpoint, wallet, options);

        let accountRes = await client.getAccount(firstAccount.address);
        //console.log("account: ", accountRes);

        signerData = {
            accountNumber: accountRes.accountNumber, 
            sequence: accountRes.sequence,
            chainId: "cosmoshub-4",
        }

        for(; i < loopAmount; i++){
            try {
                console.log("i: ", i);
                signWithSequence(i, client, firstAccount.address, [sendMsg], fee, memo, signerData);
                await util.sleep(100);
                i++;
                signerData.sequence++;
            } catch (error) {
                console.log(error)
            }
        }
    }
}

async function signWithSequence(index, client, signerAddress, messages, fee, memo, signerData){
    let txRaw = await client.sign(signerAddress, messages, fee, memo, signerData);
    let txBytes = tx_5.TxRaw.encode(txRaw).finish();
    for(let i = 0; i < 1000; i++){
        try {
            let broadcasted = await client.forceGetTmClient().broadcastTxSync({tx: txBytes});
            console.log("broadcast index:", index);
            if (broadcasted.code) {
                console.log("braodcast code: ", broadcasted.code);
                console.log("broadcast codespace: ", broadcasted.codeSpace);
                console.log("broad.log: ", broadcasted.log);
            }
            const transactionId = encoding_1.toHex(broadcasted.hash).toUpperCase();
            console.log("transaction id: ", transactionId);
            let log = broadcasted.log;
            console.log("log: ", log);
            if( log.indexOf("account sequence mismatch, expected") != -1 ){
                console.log("account sequence mismatch, expected")
            }else if (log.indexOf("insufficient funds") != -1){
                console.log("insufficient funds")
            }else if(log.indexOf("tx already exists in cache") != -1){
               break;
            }

            await util.sleep(100);
        } catch (error) {
            console.log(error)
        }
    }
}

async function grabing(mnemonic){
    let to = "cosmos1e8qwl0ymjcz3sh8mammd8eu022276s6mpe63y0";   // 收款人

    let feeAmount = 20000;
    let amount =  0.11; //0.000001;                // atom数量
    let gasPriceTimes = 1;          // gasPrice放大倍数
    await sendAtomLoopWithBeginSequence(mnemonic, to, amount, gasPriceTimes, feeAmount);
}

//var mnemonic
async function timerToGrab(){
     var schema = {
            properties: {
                mnemonic: {
                    hidden: true
                }
            }
        };
    let res = await prompt.get(schema);

    let mnemonic = res.mnemonic;
    if(mnemonic == ""){
        console.error("mnemonic is null");
        return;
    }

    let now = Date.now();

    //let beginTime = await util.toUtcTimestamp("2021-10-05 12:47:08+08:00");
    //let endTime   = await util.toUtcTimestamp("2021-10-05 12:51:56+08:00");

    let beginTime = await util.toUtcTimestamp("2021-10-03 15:59:30+08:00");
    let endTime   = await util.toUtcTimestamp("2021-10-03 16:05:40+08:00");


    // 开始抢
    util.Timer(beginTime - now, grabing, [mnemonic]);
    // 结束程序
    util.Timer(endTime - now, function(){console.log("Time is up, atom grabing is over"); process.exit()}, [])

    for(;;){
        console.log(new Date().toLocaleString(), "server is running");
        await util.sleep(1000);
    }
}

timerToGrab();
