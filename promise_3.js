;(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {// CommonJS
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {// AMD / RequireJS
        define(factory);
    } else {
        root.Promise = factory.call(root);
    }
})(this, function () {
    'use strict';

    // 判断是否为函数的函数,因为频繁用到就直接写了过函数进行判断
	function isFn (fn) {
		return typeof fn == "function";
	}

	// 处理规范 2.2.4
	function asyn (fn) {
		setTimeout(fn,0);
	}

	function Promise (fn) {
		// 为了防止直接调用Promise()函数,必须使用 new 进行构造对象
		if( !this instanceof Promise) throw new Error("this can't called as funciton");

		this._status = null;// [pending,resolved,rejected] 分别用[null,true,false]表示,这个表示的方法之后用起来太方便了
		this._value ;		// 如果resolved的value值
		this._reason ;		// 如果rejected的reason值
		this._resolves = [];// 同一个promise会调用多次then,因此可能promise被resolved后会调用很多函数,把这些函数存入一个队列
		this._rejects = []; // 同上
		this._next ;		// 调用then之后返回的Promise,即下一个Promise

		// 这个费了好多脑啊理解起来,属于PromsieA的规范里的
		// Promise的构造函数可以传入一个函数作为参数,以提供下面这个用法 例1
		if(isFn(fn)) fn(this.resolve.bind(this),this.reject.bind(this));
		return this;
	}

	/*  then 方法 
		@param onResolve 当promise转化为resolved后调用,参数为其value值
		@param onReject  当promise转化为rejected后调用,参数为其reason
		@return Promise  返回一个新的Promsie
	*/
	Promise.prototype.then = function (onResolve,onReject) {
		var self = this;
		self._next = self._next || new Promise(); // 生成一个Promise

		if(isFn(onResolve)){
			self._resolves.push(onResolve);
		}else if(self._status){ 
			self._next.resolve(self._value);
		}
		if(isFn(onReject)){
			self._rejects.push(onReject);
		}else if(!self._status){ 
			self._next.reject(self._reason);
		}

		if( self._status !== null){
			invokeCall(self);
		}
		
		return self._next;
	};

	/*  resolve方法
		@param value 将promise以value为值转化为resolved状态
	*/
	Promise.prototype.resolve = function (value) {
		var self = this;
		if(self._status !== null) return; //如果多次调用则忽略

		self._status = true;	// 将状态转化为resolved
		self._value = value;	// 设置当前promise的value

		invokeCall(self);
	}


	/*  rejected
		@param reason 将promise以reason为原因转化为rejected状态
	*/
	Promise.prototype.reject = function (reason) {
		var self = this;
		if(self._status !== null) return;

		self._status = false;	// 将状态转化为rejected
		self._reason = reason;	// 设置当前promise的reason
		
		invokeCall(self);
	}
	
	/* invokeCall 将then的两个回调函数的执行全都整理到一起
	 * @param promise 
	*/
	function invokeCall (promise) {
			var callBks = promise._status ? promise._resolves : promise._rejects;
			var arg = promise._status ? promise._value : promise._reason;

			asyn(function () {	//加入队列  测试 2.2.2.2
				while(callBks.length){	// 以reason作为参数执行队列中的函数
					try{	// test 2.2.6.1
						var x = (callBks.shift())(arg);
						resolveX(promise._next,x);	// 如果有返回值进行这个操作[[Resolve]](nextPromise,x)
					}catch(e){
						promise._next.reject(e);
					}
				}
			});
	}


	/*	resolveX			重点来了,这个函数就是原规范2.3 里面那个[[Resolve]](promise,x), 即隔壁文档里面说的  [[Resolve]](nextPromise, x)
		@param nextPromise 	下一个Promise, 即then函数返回值,为了更直观, 把参数改成了 nextPromise
		@param x 			then两个参数函数返回的值, 无法确定是由哪个参数返回的, 反正没有关系, 已经和上一个promise没有关系了
	*/
	function resolveX (nextPromise,x) {
		if( nextPromise === x) throw new TypeError("nextPromise === x"); 	// 如果两个指向同一个对象则抛出异常
		
		// 如果x是Promise的实例,则使 nextPromise 接受 x 的状态,这里原文里面写的很不好理解,翻译也超级混乱,看了好久才明白
		if( x instanceof Promise ){	
			if(x._status === null){	
				// 这里这个实现非常巧妙啊 2333333
				// 如果x转化为 `resolved`，`nextPromise` 将以相同的 `value` 转化为  `resolved`，
				// 如果x转化为 `rejected`，`nextPromise` 将以相同的 `reason` 转化为 `rejected`
				// 之前想了好久不知道怎么办，发现了这样一个写法，嘿嘿真牛逼。好吧，我承认我是从别处抄来的
				x.then(nextPromise.resolve.bind(nextPromise),nextPromise.reject.bind(nextPromise));
			}else if(x._status){
				// 如果x是`resolved`，`nextPromise` 将以相同的 `value` 转化为  `resolved`，
				nextPromise.resolve(x._value);
			}else if(!x._status){
				// 如果x是 `rejected`， `nextPromise` 将以相同的 `reason` 转化为 `rejected`
				nextPromise.reject(x._reason);
			}
		}else if(typeof x == "object" ){
			nextPromise.then = x.then;
			if(isFn(x.then)){
				var called = false;	// 保证只被调用一次
				function  resolvePromise (y) { 	// 如果执行 `resolvePromise(y)`，则执行过程 `[[Resolve]](nextPromise， y)`；
					if(called) return; called = true;
					resolveX(nextPromise,y)
				}
				function rejectPromise (r) {	// 如果执行 `rejectPromise(r)`，则将 `r` 作为 `reason` 将 `nextPromise` 转化为 `Rejected`；
					if(called) return; called = true;
					nextPromise.reject(r);
				}
				try{
					// 如果 `x.then` 是函数 ，则将 `x` 作为上下文(`this`)执行这个函数，传入两个函数作为参数，第一个为 `resolvePromise`，第二个为 `rejectPromise
					x.then.call(x, resolvePromise,rejectPromise);
				}catch(e){
					// 如果执行 `then` 时抛出异常 `e`，
					//如果 `resolvePromise` 或者 `rejectPromise` 已经被调用则忽略异常， 
					//如果未被调用则将e作为 `reason` 将 `nextPromise` 转化为 `Rejected`；
					if(!called) nextPromise.reject(e);
				}
			}
		}else{
			// 这里我把两个条件合并到一起了
			// 如果 `nextPromise.then` 不是函数，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`；
			// 如果 `x` 不是对象，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`。
			nextPromise.resolve(x)
		}
	}

	return Promise;

});