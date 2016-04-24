var path = require("path");
var process = require("process");
var promisesAplusTests = require("promises-aplus-tests");

var Promise = require(process.argv[2] ?
                 path.join(process.cwd(), process.argv[2]) :
                 path.join(__dirname, "..", "lib/promise_6.js"));


if(!Promise){
    console.error("there is no Promise");
    process.exit(0);
}


// https://github.com/promises-aplus/promises-tests#adapters
var adapter = {
    resolved: function (value) {
        return new Promise(function (resolve,reject) {
            resolve(value);
        });
    },
    rejected: function (reason) {
        return new Promise(function (resolve,reject) {
            reject(reason);
        });
    },
    deferred: function () {
        var p = new Promise();
        return {
            promise : p,
            resolve : function  (value) {
                p.resolve(value);
            },
            reject : function (reason) {
                p.reject(reason);
            }
        }
    }
};

promisesAplusTests(adapter, function (err) {
    console.log(err);
});
