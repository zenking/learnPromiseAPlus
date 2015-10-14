# learnPromiseAPlus

从理解到实现 promsieA+ 规范

## 先理解

### [原文档](https://github.com/promises-aplus/promises-spec)

### [规范的简单的意译](translation.md)

### [我的博客](http://www.xjp.in/?p=157)

### 关于PromiseA的
    
推荐一篇[剖析源码理解Promises/A规范](http://www.cnblogs.com/fsjohnhuang/p/4135149.html)

PromisesA的说明[http://wiki.commonjs.org/wiki/Promises/A](http://wiki.commonjs.org/wiki/Promises/A)

官方实现[https://www.promisejs.org](https://www.promisejs.org)

### 感受回调之力

来自某互联网公司产品官网的某js文件

![感受回调之力](http://www.xjp.in/wp-content/uploads/2015/10/14192467-6AD8-400D-B09D-D04440982FDD.jpg)

### PromiseA+ 好处都有啥

假设有三个异步的分别获取数据数据的函数，想要依次按顺序执行，原js回调写法

``` javascript

//模拟异步获取数据
function first (cb) {
    setTimeout(function () {
        if (cb) cb("data 1111");
    },1000);
}
function second (cb) {
    setTimeout(function () {
        if (cb) cb("data 22222");
    },1000);
}
function third (cb) {
    setTimeout(function () {
        if (cb) cb("data 33333");
    },1000);
}

// 按顺序获取并处理数据
first(function (data) {
    log(data);
    second(function (data) {
        log(data);
        third(function (data) {
            log(data);
        });
    });
});

```

符合PromiseA+规范的写法。当然，符合规范的改法千千万万种，这里只随性写了一个样例。

``` javascript

// 对函数稍作处理
function first () {
    var promise = new Promise();
    setTimeout(function () {
        promise.resolve("data 1111");
    },1000);
    return promise;
}
function second () {
    var promise = new Promise();
    setTimeout(function () {
        promise.resolve("data 22222");
    },1000);
    return promise;
}
function third () {
    var promise = new Promise();
    setTimeout(function () {
        promise.resolve("data 33333");
    },1000);
    return promise;
}
 
 // 依次获取并处理数据
first().then(function (data) {
    log(data);
    return second();
}).then(function (data) {
    log(data);
    return third();
}).then(function (data) {
    log(data);
});


```

promsieA+极大的增强了代码的可读性，减少了后期代码的维护的难度，这真是极好的。

## 实现

之前查到的其它的实现[guilipan/swift-promise](https://github.com/guilipan/swift-promise)还有[chemdemo/promiseA](https://github.com/chemdemo/promiseA)，我在写的时候参考了一些，但是还是看了好久，因为这俩基本都是实现好的，代码也做过优化，看的有些吃力啊。于是就自己按照规范实现了一下，好像参考了后面那个比较多啊。虽然写的时候开始时参考后面那个比较多  但是越写越改越来越像后面那个了。貌似这两个都没有通过最新的测试。

这个有个PromiseA+的测试[promises-aplus/promises-tests](https://github.com/promises-aplus/promises-tests)，[原文档](https://github.com/promises-aplus/promises-spec)里也有好多实现好了的例子  在修复2.3.3.3.1的一个问题是参考了一点，瞬间觉得文档好坑。。。。。。

反正经过很久的调试终于，实现了这个Promise，并且通过了全部的测试用例，真是感人，然而并没有做其它几个Promise静态方法。代码也没有优化，到这里话基本就结束了