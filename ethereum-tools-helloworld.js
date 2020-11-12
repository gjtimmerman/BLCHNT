var fs = require('fs');

var solc = require('solc');

function callbackForPromise(resolve,reject) {
    return function (error, result) {
        if (error) {
            reject(error);
        } else {
            resolve(result);
        }
    };
}

async function delay(delayInMs)
{
  return new Promise(resolve => setTimeout(resolve,delayInMs));
}

async function getTransaction(txid) {
    return  new Promise((resolve,reject) =>
          web3.eth.getTransaction(txid, callbackForPromise(resolve,reject)))
    }

async function getMinedTransaction(txid) {
    let tx = await getTransaction(txid);

    if (tx.blockNumber) {
            return tx;
    } else {
      await delay(1000);
      return getMinedTransaction(txid);
    }
}


async function readPath(basePath, path) {
    let fullPath = basePath + (path ? '/' + path : '');
    let stats = await new Promise((resolve, reject) =>
      fs.stat(fullPath,callbackForPromise(resolve,reject)));
    if (stats.isFile()) {
            let contents = await new Promise((resolve,reject) =>
              fs.readFile(fullPath, 'utf-8', callbackForPromise(resolve,reject)))
            return [{
                    key : path ? path : basePath ? basePath : '',
                    value: contents
                }];

        } else if (stats.isDirectory()) {
            let files = await new Promise((resolve,reject) =>
              fs.readdir(fullPath, callbackForPromise(resolve,reject)))
            let promises = files.filter(function (file) {
                    return !file.startsWith('.');
                }).map(function (file) {
                    return readPath(basePath, path ? path + '/' + file : file);
                  });
            let results = await Promise.all(promises);
            return [].concat.apply([], results);
        }
}

function kv2object(kv) {
    var obj = {};
    kv.forEach(function (item) {
        obj[item.key] = item.value;
    });
    return obj;
}

function solcCompile(sources) {
    input = { language: 'Solidity', sources: {},settings: {}};
    sources.map( source => {
      input.sources[source.key] = {};
      input.sources[source.key]['content']=source.value;
      input.settings['outputSelection']={}
      input.settings['outputSelection']['*'] = {};
      input.settings['outputSelection']['*']['*'] = {};
      input.settings['outputSelection']['*']['*'] = ['*'];
    });
    contr = JSON.parse(solc.compile(JSON.stringify(input)));
    return contr.contracts;
}

async function compileContracts(path) {
    let sources = await readPath(path);
    return solcCompile(sources);
}

async function deploy(compiledContract, gas) {
//      console.log(JSON.stringify(compiledContract.evm.bytecode));
        let contract = new web3.eth.Contract(compiledContract.abi); //,"0x96005c03f23dea07410a2c0a9ce7a61be9129213");
        let deployedContract = await contract.deploy({data: '0x' + compiledContract.evm.bytecode.object  }).send({ from: from, gas: gas});

        return deployedContract;
}


function bytes32tostring(bytes32) {
    if (bytes32.substring(0, 2) != '0x') {
        throw 'input is not bytes32';
    } else if (bytes32.length % 2 != 0) {
        throw 'input is not bytes32';
    } else {
        return bytes32.match(/.{2}/g).filter(function (hex) {
            return hex != '0x' && hex != '00';
        }).map(function (hex) {
            return String.fromCharCode(parseInt(hex, 16));
        }).join('');
    }
}

function printEvent(err, evt) {
  if (err)
  {
    console.log('Error', err);
  }
  else
    console.log('Event', evt.returnValues);
}


async function compileAndDeployContracts(name)
{
  console.log('Compiling...');
  let contracts = await compileContracts(name);
  console.log('Deploying...');
  let contract = await deploy(contracts[name]['HelloWorld'], 2000000);
  console.log('HelloWorld contract at', contract.options.address);
  contract.events.Print(printEvent);
  let p1 = new Promise((resolve,reject) =>
    contract.methods.SayHello().send({from: from, gas: 2000000},callbackForPromise(resolve,reject)));
  let tx = await p1;
  console.log(JSON.stringify(tx));
  let mtx = await getMinedTransaction(tx);
  console.log(mtx);

}

let Web3 = require('web3');
let net =  require('net');


let web3 = new Web3("\\\\.\\pipe\\geth.ipc",net);
let from = "0xf68ca8afa54a47de377fa96515568e6ae708a1bb";
let prom = compileAndDeployContracts('HelloWorld.sol');
prom.then(() => process.exit(0)).catch(() => process.exit(1));
