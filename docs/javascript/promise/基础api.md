# promise
* 有三种状态：pending（进行中）、fulfilled（已成功）和rejected（已失败）
* 一旦状态改变，就不会再变，任何时候都可以得到这个结果
* 优点
  * 解决了回调地狱的问题
  * 提供统一的接口，控制异步操作更加容易
* 缺点
  * 无法取消, 一旦新建就会立即执行，无法中途取消
  * 错误需要通过回调函数捕获
  * 处于pending状态时，无法得知目前进展到哪一个阶段
* 一个异步操作的结果是返回另一个异步操作
```ts
  // 异步操作p2的结果 是 异步操作p1
  // p1的状态就会传递给p2，即p1的状态决定了p2的状态。
  // 如果p1的状态是pending，那么p2的回调函数就会等待p1的状态改变；如果p1的状态已经是resolved或者rejected，那么p2的回调函数将会立刻执行。
  const p1 = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('fail')), 3000)
  })

  const p2 = new Promise((resolve, reject) => {
    setTimeout(() => resolve(p1), 1000)
  })

  p2.then(result => console.log(result))
    .catch(error => console.log(error))
  // Error: fail
```
* 调用resolve或reject并不会终结Promise回调函数的执行
```ts
  new Promise((resolve) => {
    resolve(1)
    console.log(2)
  }).then((res) => console.log(res)) // 2 => 1
  
  // 推荐
  new Promise((resolve) => {
    return resolve(1)
    console.log(2)
  }).then((res) => console.log(res)) // 1
```
## Promise.prototype.then
  * 实例添加状态改变时的回调函数
  * 返回的是一个新的Promise实例(不是原来那个Promise实例)
```ts
  let p1 = Promise.resolve(2)
  let p2 = p1.then(() => 3)

  p1 instanceof Promise // true
  p2 instanceof Promise // true
  p1 === p2 // false


  const p1 = new Promise(() => {})
  const p2 = new Promise(() => {}).then(() => p1)
  const p3 = Promise.resolve(p1)
  p1 === p2 // false
  p1 === p3 // true
```
## Promise.prototype.catch
```ts
  try {
    new Promise((resolve, reject) => {
      throw new Error('ha') // 同步 throw eror, 会被catch捕获
    }).catch((err) => console.log('err', err))
  } catch (e) {
    console.log('e', e)
  }
  // err Error: ha

  try {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        // throw new Error('ha') 
        // 异步操作中直接throw error, 得到 Uncaught Error: ha
        // 此时的promise已执行完成(如果无下一句reject代码)
        reject(new Error('ha')) // 异步操作中, 必须reject error
      }, 500)
    }).catch((err) => console.log('err', err))
  } catch (e) {
    console.log('e', e)
  }
  // err Error: ha

  try {
    new Promise((resolve, reject) => {
      resolve()
    }).then(() => {
      throw new Error('h')
    })
    .catch((err) => console.log('err2', err))
  } catch (e) {
    console.log('e2', e)
  }
  // err2 Error: h
  // then方法中抛出的错误，也会被catch()方法捕获
```
  * promise内部的错误未调用catch捕获(Uncaught), 不会影响到promise外部的代码
```ts
  new Promise((resolve) => resolve(x + 2))
  console.log('a', 1)

  // a 1
  // Script snippet %232:1 Uncaught (in promise) ReferenceError: x is not defined
```
  * promise对象的错误具有“冒泡”性质，会一直向后传递，直到被捕获为止
```ts
  new Promise((resolve) => {
    resolve(x + 2)
  }).catch((err) => {
    console.log('err', err)
  }).then(() => {
    console.log('ha')
    y + 1
  }).catch((err) => {
    console.log('err2', err)
  })
  // err ReferenceError: x is not defined
  // ha
  // err2 ReferenceError: y is not defined
```

## Promise.all
```ts
  const p = Promise.all([p1, p2])
  // p1、p2 都是Promise实例; 如果不是，就会先调用Promise.resolve方法，将参数转为Promise实例
    // 参数可以不是数组，但必须具有Iterator接口，且返回的每个成员都是Promise实例
  // 只有p1、p2的状态都变成fulfilled，p的状态才会变成fulfilled; 此时p1、p2的返回值组成一个数组，传递给p的回调函数
  // 只要p1、p2之中有一个被rejected，p的状态就变成rejected，此时第一个被reject的实例的返回值，会传递给p的回调函数。
    // 不管另外的promise实例是否改变状态
  var obj = {
    [Symbol.iterator]() {
      return this
    },
    i: 0,
    next() {
      if (this.i < 3) {
        return { done: false, value: Promise.resolve(this.i++) }
      } else {
        return { done: true }
      }
    }
  }
  Promise.all(obj).then((res) => console.log(res)) // [0, 1, 2]
```
  * 作为参数的Promise实例, 自己定义了catch方法，那么它一旦被rejected，不会触发Promise.all()的catch方法
```ts
  const p1 = new Promise((resolve) => resolve('ha'))
    .then(result => result)
    .catch(e => e)
  // p1是调用then后返回的promise实例, 此时已resolved

  const p2 = new Promise((resolve) => throw new Error('报错了'))
    .then(result => result)
    .catch(e => e)
  // p2是调用catch后返回的promise实例, 此时已rejected

  Promise.all([p1, p2]).then(result => console.log('result', result)).catch(e => console.log('e', e))
  // 触发的then回调
  // result ['ha', Error: 报错了]
```

## Promise.race
```ts
  const p = Promise.race([p1, p2]);
  // 只要p1、p2之中有一个实例率先改变状态，p的状态就跟着改变。
  // 率先改变的Promise实例的返回值，就传递给p的回调函数

  const p = Promise.race([
    mockAjax(),
    new Promise(function (resolve, reject) {
      setTimeout(() => reject(new Error('request timeout')), 5000)
    })
  ])
  // 请求设置超时
```

## Promise.allSettled
* 等到一组异步操作都结束了，不管每一个操作是成功还是失败，再进行下一步操作(确定一组异步操作是否都结束了（不管成功或失败）)
```ts
  var p1 = new Promise((resolve) => setTimeout(resolve, 1000)).then(() => 1)
  var p2 = new Promise((resolve, reject) => setTimeout(() => reject('ha'), 2000))
  var p3 = new Promise((resolve) => setTimeout(resolve, 3000)).then(() => 2)

  // 只有等到参数数组中所有Promise对象都发生状态变更（不管是fulfilled还是rejected）,返回的Promise对象才会发生状态变更。
  // 一旦发生状态变更，状态总是fulfilled，不会变成rejected
  const p = Promise.allSettled([p1, p2, p3])
  p.then((res) => console.log(res))
  // 返回值的格式如下固定
  // [{status: 'fulfilled', value: 1}, {status: 'rejected', reason: 'ha'}, {status: 'fulfilled', value: 2}]
```

## Promise.any
```ts
  const p = Promise.any([p1, p2, p3])
  p.then((res) => console.log(res)).catch((err) => console.error(err))
  // 只要参数实例有一个变成fulfilled状态，包装实例就会变成fulfilled状态.
  // 如果所有参数实例都变成rejected状态，包装实例就会变成rejected状态.
```

## Promise.resolve
* 将现有对象转为 Promise 对象
```ts
  // 1. 参数是一个 Promise 实例, 将不做任何修改、原封不动地返回这个实例。
  let p1 = new Promise(() => {})
  let p2 = Promise.resolve(p1)
  p1 === p2 // true

  // 2. 参数是一个thenable对象(包含then方法的对象)
  let thenable = {
    then: function(resolve, reject) {
      resolve(42);
      // setTimeout(() => resolve(42), 2000)
    }
  };
  let p = Promise.resolve(thenable) // 将这个对象转为Promise对象，然后就立即执行thenable对象的then()方法; 此处对象p的状态就变为resolved
  p.then((res) => console.log(res)) // 执行then方法, 输出 42

  // 3. 参数不是具有then()方法的对象，或根本就不是对象
  let p = Promise.resolve('hello') // 返回一个新的Promise对象，状态为resolved
  p.then((res) => console.log(res)) // 'hello'
  // 等价于
  new Promise(resolve => resolve('hello'))

  // 4. 不带有任何参数
  let p = Promise.resolve() // 直接返回一个resolved状态的Promise对象
```

## Promise.reject
* 返回一个新的Promise实例，该实例的状态为rejected
```ts
  Promise.resolve('ha')
    .catch((err) => 'abc')
    .then((res) => console.log('resolve', res)) // ha

  Promise.reject('ha')
    .catch((err) => 'abc')
    .then((res) => console.log('reject', res)) // abc
```