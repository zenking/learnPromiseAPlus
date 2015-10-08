/*
 *	封装根据测试为代码打补丁，未通过 2.2.6、2.2.7、2.3.3、2.3.4
 *
 */

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

		if(self._status === null){	// 如果当前的Promise处于pending状态，将参数分别加入队列，如果不是函数就忽略
			if(isFn(onResolve)) self._resolves.push(onResolve);
			if(isFn(onReject)) self._rejects.push(onReject);
		}else if(self._status){    // 如果当前的Promise已经处于resolved状态,比如先进行resolve操作,再进行then操作
			if(isFn(onResolve)) {
				setTimeout(function () {	//test 2.2.4  
					try{
			        	var x = onResolve(self._value);	// 直接调用onResolve,并获取返回值
			        	resolveX(self._next,x);	// 如果有返回值，进行这个操作[[Resolve]](nextPromise,x)为了方便理解,将规范中的promsie2改成了nextPromsie
		        	}catch(e){		// 如果抛出异常则以e作为reason,reject下一个promsie
						console.log(e)
						self._next.reject(e);
					}
				},0);
	        }else{		// 如果onResolve不为函数,并且promise状态为resolved，nextPromise将以相同的value被resolve
	        	self._next.resolve(self._value);
	        }
		}else if(!self._status){  // 同上一个 if
			if(isFn(onReject)) {
				setTimeout(function () { //test 2.2.4执行队列     
					try{
						var x = onReject(self._reason);
		        		resolveX(self._next,x);
					}catch(e){
						self._next.reject(e)
					}
		        },0);
			}else{
				self._next.reject(self._reason);
			}
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

		//加入队列  测试 2.2.2.2
		setTimeout(function () {
			while(self._resolves.length){	// 以value作为参数执行队列中的函数
				try{	
					var x = self._resolves.shift()(self._value);
					resolveX(self._next,x);	// 如果有返回值进行这个操作[[Resolve]](nextPromise,x)
				}catch(e){
					self._next.reject(e);
				}
			}
		},0)
		
	}

	/*  rejected
		@param reason 将promise以reason为原因转化为rejected状态
	*/
	Promise.prototype.reject = function (reason) {
		var self = this;
		if(self._status !== null) return;

		self._status = false;	// 将状态转化为rejected
		self._reason = reason;	// 设置当前promise的reason
		
		//加入队列  测试 2.2.2.2
		setTimeout(function () {
			while(self._rejects.length){	// 以reason作为参数执行队列中的函数
				try{	// test 2.2.6.1
					var x = (self._rejects.shift())(self._reason);
					resolveX(self._next,x);	// 如果有返回值进行这个操作[[Resolve]](nextPromise,x)
				}catch(e){
					self._next.reject(e);
				}
			}
		},0);
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
		}else if(isFn(x.then) ){
			nextPromise.then = x.then;
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
		}else{
			// 这里我把两个条件合并到一起了
			// 如果 `nextPromise.then` 不是函数，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`；
			// 如果 `x` 不是对象，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`。
			nextPromise.resolve(x)
		}
	}

	return Promise;

});