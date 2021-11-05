## WeakMap
* 只接受对象作为键名（null除外），不接受其他类型的值作为键名
* WeakMap的键名所指向的对象，不计入垃圾回收机制
```ts
  var a = { x: 1 }
  var b = { y: 2 }
  const map = new Map()
  map.set(a, 1)
  map.set(b, 2)
  // 如果a,b对象不再需要, 要释放a,b占用的内存
    // 1.删除map外部所有a,b的引用
    // 2.由于map对a,b有引用, 则必须手动删除这个引用，否则垃圾回收机制就不会释放a和b占用的内存

  var wa = { x: 1 }
  var wb = { y: 2 }
  const wMap = new WeakMap()
  wMap.set(wa, 1)
  wMap.set(wa, 2)
  // 如果wa,wb对象不再需要, 要释放wa,wb占用的内存
    // 只需要删除wMap外所有wa,wb引用, 不需要手动删除wMap对wa,wb的引用
    // 为啥？
    // WeakMap键名所引用的对象都是弱引用(垃圾回收机制不将该引用考虑在内)
    // 因此，只要所引用的对象的其他引用都被清除，垃圾回收机制就会释放该对象所占用的内存。
    // 即一旦不再需要某个键名对象，WeakMap里面的键名对象和所对应的键值对会自动消失，不用手动删除引用
```
* 专用场合: 键所对应的对象，可能会在将来消失。
* WeakMap结构有助于防止内存泄漏.

## Generator
* 是协程在 ES6 的实现，最大特点就是可以交出函数的执行权（即暂停执行）
```ts
  function gen() {
    let x = yield 1
    console.log('x:', x)
  }
  const tt = gen()
  tt.next() // { done: false, value: 1 }
  tt.next() // x:undefined { done: true, value: undefined } 
  // yield表达式本身没有返回值, 或者说总是返回undefined。
  // next方法可以带一个参数，该参数就会被当作上一个yield表达式的返回值。

  function *g(x) {
    let y = yield (x + 1);
    let z = yield (y / 3);
    return x + y + z
  }
  const it = g(2)
  // 1. 调用函数, 生成迭代器
  it.next(); // { done: false, value: 3 }
  // 2. 第一次调用next方法(忽略任何参数), 执行到第一个yield处并执行yield表示式, 输出(x + 1)的值,而该yield表达式执行完成是没有返回值的
  it.next(6); // { done: false, value: 2 }
  // 3. 第二次调用next方法, 从上次暂停位置开始执行, 同时传入的参数作为上次yield表达式的返回值, 即y赋值为next方法传入的参数6,
  // 执行后续代码到第二个yield处并执行yield表示式, 输出(y / 3)的值2, 但是该yield表达式执行完成是没有返回值的
  it.next(3); // { done: true, value: 11 }
  // 4. 第三次执行next方法, 从上次暂停位置开始执行, 同时传入的参数作为上次yield表达式的返回值, 即z赋值为next方法传入的参数3,
  // 后续无yield, 如遇到return, 返回其后表达式值 11; 没有, 则执行完函数, 返回value: undefined

  // 注:
  // 内外部数据交换: next返回值的 value 属性，是 Generator 函数向外输出数据；next方法还可以接受参数，向 Generator 函数体内输入数据。
```
* 在 Generator 函数内部，调用另一个 Generator 函数
```ts
  function *foo() {
    yield 1
    yield 2
  }
  function *moo() {
    yield 5
    return 6
  }
  function *too() {
    yield 3
    // 不使用yield*, 必须手动遍历; 调用foo()返回一个迭代器, yield* 会自动遍历
    // yield* 实际操作一个迭代器; 任何数据结构只要符合迭代协议，就可以被yield*遍历
    yield* foo() 
    // moo中有返回值, 必须用赋值给个变量, 否则会忽略
    let me = yield* moo();
    yield me
    yield 4
  }
  [...too()] // [3, 1, 2, 5, 6, 4]
```
* 应用-异步操作的同步化表达
```ts
  // 模拟ajax同步请求
  function *getData() {
    const result = yield makeAjax()
    console.log('result', result)
  }

  function makeAjax() {
    ajax(url, (res) => it.next(res))
  }

  const it = getData()
  it.next()
```
* 自动执行器
```ts
  function delay() {
    return new Promise((resolve) => setTimeout(() => resolve(arguments), 500))
  }
  function *gen() {
    try {
      const result = yield delay('a')
      const result2 = yield delay('b')
      console.log('result', result, 'result2', result2)
    } catch (err) {
      console.log('error', err)
    }
  }
  function co (g) { // co核心
    const it = g() // 迭代器
    function next(data) {
      const result = it.next(data) // 返回内部数据
      if (result.done) return result.value
      result.value
        .then((res) => next(res)) // 输入外部数据
        .catch((err) => it.throw(err))
    }
    next()
  }

  co(gen)
```