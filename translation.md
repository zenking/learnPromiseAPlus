# PromiseA+ 部分译文

本翻译为意译，没有与原文对应，原文看此链接 [PromiseAPlus](http://promisesaplus.com)

每一点最后标上原文的位置


# 定义 _1_

- `promise` 是具有 `then` 方法的一个对象，这个方法复合本规范；_1.1_

- `thenable` 是具有 `then` 方法的对象；_1.2_

- `value` 可以是任何js的值，包括 `undefined` 和 `promise` 和  `thenable`；_1.3_

- `exception` 是指使用 `throw` 语句抛出的值；_1.4_

- `reason` 是指出一个 `promise` 为什么被转化为 `rejected` 的值；_1.5_


# 关于Promise _2_

- 一个 `promise` 必定处于如下三种状态之一: `pending` 、 `resolved`， `rejected`；_2.1_

- 当处于 `pending` 时，`promise` 可以转化为 `resolved` 或 `rejected` 状态；_2.1.1_ 

- 当处于 `resolved` 时，`promise` 不能转化到其他状态，并且有一个不能改变的确定的 `value`；_2.1.2_ 

- 当处于 `rejected` 时，`promise` 不能转化到其他状态，并且有一个不能改变的确定的 `reason`；_2.1.3_ 

这里的不能改变是指能使用 `===` 进行判断，而不需要更深入的进行判断内部是否变化。例如 对对象的引用，即使对象内部变化了，只要引用仍指向这个对象也是可以的； _2.1_


# 关于 `then` 方法 _2.2_

`then` 方法包含两个参数，`promise.then(onResolved， onRejected);`

- `then` 的两个参数都是可选的， 如果传入的参数不为函数则忽略；_2.2.1_ 

- `onResolved` 会在 `promise` 将状态改变为 `resolved` 后调用，`promise` 的 `value` 即为这个函数的第一个参数，这个函数只能被运行一次；_2.2.2_

- `onRejected` 会在 `promise` 将状态改变为  `rejected` 后调用， `promise` 的 `reason` 即为这个函数的第一个参数，这个函数只能被运行一次；_2.2.3_

- `onResolved` 和 `onRejected` 必须要在当前作用域所在的所有语句执行完成后才能执行； _2.2.4_

- `onResolved` 和 `onRejected` 必须作为函数进行执行，而不能作为对象的方法，即函数中的this的值应该为 `undefined` (严格模式)或者为全局对象(非严格模式，例如浏览器端的 `window` ) ；_2.2.5_

- `then` 可以在同一个 `promise` 上执行多次，如果 `promise` 转化为 `resolved`，那所有 `onResolved` 按照注册的顺序执行，同理  `Rejected` 也是这样；_2.2.6_

- `then` 方法返回一个`promise`，即 `nextPromise = promise.then(onResolved， onRejected);`，且可以允许 `nextPromise === promise`，不同的实现需要自己在文档中进行说明其实现的方式；_2.2.7_
 
	- 如果 `onResolved` 或 `onRejected` 返回一个值 `x`，对 `nextPromise` 和 `x` 进行这个操作 ： `[[Resolve]](nextPromise,x)`，具体操作过程查看下面；_2.2.7.1_
 
	- 如果onResolved或onRejected抛出一个 `exception`， `nextPromise` 会将这个异常作为 `reason` 转化为 `rejected`；_2.2.7.2_
 
	- 如果 `onResolved` 不是函数，并且 `promise` 状态为 `resolved`，nextPromise 将以相同的 `value` 被Resolved，_2.2.7.3_
 
	- 如果 `onRejected` 不是函数，并且 `promise` 状态为 `rejected`，nextPromise 将以相同的 `reason` 被Rejected；_2.2.7.4_


# 过程 `[[Resolve]](nextPromise,x)`  _2.3_

- 如果 `nextPromise` 和 `x` 指向同一个对象 (即 `===` )，则抛出一个 `TypeError` 的异常 作为 `reason`，将 `nextPromise` 转化为  `Rejected`； _2.3.1_

- 如果 `x` 是一个 `promise`，则使 `nextPromise` 接受 `x` 的状态 ，即如果 `x` 为 `pending`， 那么 `nextPromise` 也为  `pending`， 如果x转化为  `resolved`，`nextPromise` 将以相同的 `value` 转化为  `resolved`，如果x转化为 `rejected`， `nextPromise` 将以相同的 `reason` 转化为 `rejected`；_2.3.2_

- 如果 `x` 是一个对象：_2.3.3_

	- 将 `x.then` 赋值给 `nextPromise.then`  _2.3.3.1_

	- 如果取 `x.then` 的值时抛出错误 `e`，将 `e` 作为 `reason` 将 `nextPromise` 转化为  `rejected`；_2.3.3.2_

	- 如果 `x.then` 是函数 ，则将 `x` 作为上下文(`this`)执行这个函数，传入两个函数作为参数，第一个为 `resolvePromise`，第二个为 `rejectPromise`。 _2.3.3.3_

		- 如果执行 `resolvePromise(y)`，则执行过程 `[[Resolve]](nextPromise,y)`；_2.3.3.3.1_
 
		- 如果执行 `rejectPromise(r)`，则将 `r` 作为 `reason` 将 `nextPromise` 转化为 `Rejected`；_2.3.3.3.2_
 
		- 如果 `resolvePromise` 和 `rejectPromise` 都被调用，或者被同一参数调用多次，则采用第一次调用并忽略后面的调用；_2.3.3.3.3_
 
		- 如果执行 `then` 时抛出异常 `e`，如果 `resolvePromise` 或者 `rejectPromise` 已经被调用则忽略异常， 如果未被调用则将e作为 `reason` 将 `nextPromise` 转化为 `Rejected`；_2.3.3.3.4_

	- 如果 `nextPromise.then` 不是函数，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`；_2.3.3.4_

- 如果 `x` 不是对象，使用 `x` 作为 `value` 将 `nextPromise` 转化为 `Resolved`。_2.3.4_












