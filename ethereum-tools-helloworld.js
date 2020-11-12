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

function getTransaction(txid) {
    return  new Promise((resolve,reject) =>
          web3.eth.getTransaction(txid, callbackForPromise(resolve,reject)))
    }

function getMinedTransaction(txid) {
    return getTransaction(txid).then(function (tx) {
        if (tx.blockNumber) {
            return tx;
        } else {
            let p1 = new Promise(function(resolve){
              setTimeout(resolve,1000);
            });
            return p1.then(function () {
                return getMinedTransaction(txid);
            });
        }
    });
}

function readPath(basePath, path) {
    var fullPath = basePath + (path ? '/' + path : '');

    return new Promise((resolve, reject) =>
       fs.stat(fullPath,callbackForPromise(resolve,reject)))
        .then(function (stats) {
        if (stats.isFile()) {
            return new Promise((resolve,reject) =>
                fs.readFile(fullPath, 'utf-8', callbackForPromise(resolve,reject)))
                  .then(function (contents) {
                return [{
                    key : path ? path : basePath ? basePath : '',
                    value: contents
                }];
            });
        } else if (stats.isDirectory()) {
            return new Promise((resolve,reject) =>
                fs.readDir(fullPath, callbackForPromise(resolve,reject)))
                  .then(function (files) {
                var promises = files.filter(function (file) {
                    return !file.startsWith('.');
                }).map(function (file) {
                    return readPath(basePath, path ? path + '/' + file : file);
                });
                return Promise.all(promises).then(function (results) {
                    return [].concat.apply([], results);
                });
            });
        }
    });
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
    input.sources[sources[0].key] = {};
    input.sources[sources[0].key]['content']=sources[0].value;
    input.settings['outputSelection']={}
    input.settings['outputSelection']['*'] = {};
    input.settings['outputSelection']['*']['*'] = {};
    input.settings['outputSelection']['*']['*'] = ['*'];
    contr = JSON.parse(solc.compile(JSON.stringify(input)));
    return contr.contracts;
}

function compileContracts(path) {
    return readPath(path).then(solcCompile);
}

function deployer(web3, from) {
    return function deploy(compiledContract, gas) {
      console.log(JSON.stringify(compiledContract.evm.bytecode));
        var contract = new web3.eth.Contract(compiledContract.abi); //,"0x96005c03f23dea07410a2c0a9ce7a61be9129213");
        let p1 = new Promise(function(resolve,reject)
        	{
            contract.deploy({data: '0x' + compiledContract.evm.bytecode.object  }).send({ from: from, gas: gas})
            .then(function(deployedContract)
            {
                 if (deployedContract.options.address) {
                     resolve(deployedContract);
                 } else {
                     resolve(deployedContract);
                 }

            })

        .catch(function (error) {
            reject(error);
        });
      });
      return p1;
    }
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

var Web3 = require('web3');
var net =  require('net');


var web3 = new Web3("\\\\.\\pipe\\geth.ipc",net);
var from = "0xf68ca8afa54a47de377fa96515568e6ae708a1bb";
var deploy = deployer(web3, from);
console.log('Compiling...');
compileContracts('HelloWorld.sol')
  .then(function (contracts) {
        console.log('Deploying...');
        return deploy(contracts['HelloWorld.sol']['HelloWorld'], 2000000);
   })
      .then(function (contract) {
        function printEvent(err, evt) {
          if (err)
          {
            console.log('Error', err);
          }
          else {


          console.log('Event', evt.returnValues);
        }
        }
        console.log('HelloWorld contract at', contract.options.address);
        contract.events.Print(printEvent);
        let p1 = new Promise(function(resolve,reject){
          contract.methods.SayHello().send({from: from, gas: 2000000},function(err,data){
            if (err)
              reject(err);
            else {
              resolve(data);
            }
          });
        });

        return p1;
    })
    .then(function (tx) {
        console.log(JSON.stringify(tx));
        getMinedTransaction(tx).then(function(tx)
      {
        console.log(tx);
      })
    })

    .catch(function (err) {
        console.error(err);
        process.exit(1);
    });
