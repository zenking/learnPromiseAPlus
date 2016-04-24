/*
 *  完成！！！！
 *  修复2.3.3.3.1  我承认这一个修复方案是抄的别人的
 *  
 */

;(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(factory);
    } else {
        root.Promise = factory.call(root);
    }
})(this, function () {
    'use strict';

    function isFn (fn) {
        return typeof fn == "function";
    }

    function asyn (fn) {
        setTimeout(fn,0);
    }

    function Promise (fn) {
        if( !this instanceof Promise) throw new Error("this can't called as funciton");

        this._status = null;
        this._value ;       
        this._reason ;      
        this._resolves = [];
        this._rejects = []; 
        this._nexts = [];   

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
        var _next = new Promise(); 

        self._nexts.push(_next);
        self._resolves.push(onResolve);
        self._rejects.push(onReject);

        if( self._status !== null){
            invokeCall(self);
        }
        
        return _next;
    };

    /*  resolve方法
        @param value 将promise以value为值转化为resolved状态
    */
    Promise.prototype.resolve = function (value) {
        var self = this;
        if(self._status !== null) return; 

        self._status = true;    
        self._value = value;    

        invokeCall(self);
    }


    /*  rejected
        @param reason 将promise以reason为原因转化为rejected状态
    */
    Promise.prototype.reject = function (reason) {
        var self = this;
        if(self._status !== null) return;

        self._status = false;   
        self._reason = reason;  
        
        invokeCall(self);
    }
    
    /* invokeCall将then的两个回调函数的执行全都整理到一起
     * @param promise 
    */
    function invokeCall (promise) {
            var callBks = promise._status ? promise._resolves : promise._rejects;
            var arg = promise._status ? promise._value : promise._reason;
            var nexts = promise._nexts; 

            asyn(function () {  
                while(callBks.length){  
                    var next = nexts.shift();
                    var func = callBks.shift();
                    try{
                        if(isFn(func)){
                            var x = func(arg);
                            resolveX(next,x);  
                        }else{          
                            if(promise._status) {   
                                next.resolve(promise._value);
                            }else{
                                next.reject(promise._reason);
                            }
                        }
                    }catch(e){
                        next.reject(e);
                    }
                }
            });
    }


    /*  resolveX            重点来了,这个函数就是原规范2.3 里面那个[[Resolve]](promise,x), 即隔壁文档里面说的  [[Resolve]](nextPromise, x)
        @param nextPromise  下一个Promise, 即then函数返回值,为了更直观, 把参数改成了 nextPromise
        @param x            then两个参数函数返回的值, 无法确定是由哪个参数返回的, 反正没有关系, 已经和上一个promise没有关系了
    */
    function resolveX (nextPromise,x) {
        if( nextPromise === x) throw new TypeError("nextPromise === x");    
        
        
        if( x instanceof Promise ){ 
            if(x._status === null){ 
                x.then(function (value) {
                    resolveX(nextPromise,value);    // 2.3.3.3.1   尼玛  这个啊  resolve下一个promise 不能直接调用其函数  要递归当前这个函数 
                },nextPromise.reject.bind(nextPromise));
            }else if(x._status){
                    resolveX(nextPromise,x._value);  // 还有这里
            }else if(!x._status){
                nextPromise.reject(x._reason);
            }
        }else if(x && (isFn(x) || typeof x === "object")){ 
            var called = false; 
            try{       
                var then = x.then;  
                 if(isFn(then)){
                    function  resolvePromise (y) {  
                        if(called) return; 
                        resolveX(nextPromise,y)
                        called = true;
                    }
                    function rejectPromise (r) {    
                        if(called) return; 
                        nextPromise.reject(r);
                        called = true;
                    }
                    then.call(x, resolvePromise,rejectPromise);
                }else{
                    nextPromise.resolve(x)
                }
            }catch(e){
                if(!called) nextPromise.reject(e); 
            }
           
        }else{
            nextPromise.resolve(x)
        }
    }

    return Promise;

});
