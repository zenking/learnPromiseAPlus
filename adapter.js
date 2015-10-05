// 为测试提供的接口

var Promise = require("./promise");

module.exports.resolved = function (value) {
	return new Promise(function (resolve,reject) {
		resolve(value);
	});
};

module.exports.rejected = function (reason) {
	return new Promise(function (resolve,reject) {
		reject(reason);
	});
};

module.exports.deferred = function () {
	var p = new Promise();
	return {
		promise : p,
		resolve : function  (value) {
			p.resolve(value);
		},
		reject : function (reason) {
			p.reject(reason);
		}
	};
}
