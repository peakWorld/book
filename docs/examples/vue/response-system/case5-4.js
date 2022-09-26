Proxy.prototype // undefined
Proxy.__proto__ === Function.prototype // true

const obj = {}
const proto = { bar: 1 }

// 默认操作
const p1 = new Proxy(obj, {})
const p2 = new Proxy(proto, {})
p1.__proto__ === Object.prototype // true
Object.setPrototypeOf(p1, p2)
p1.__proto__ === p2 // true

// -------------------------

// 拦截设置原型操作
const p12 = new Proxy(obj, {
  setPrototypeOf(target, proto) {
    // console.log(target, proto)
    return true
  }
})
const p22 = new Proxy(proto, {})
// 对代理对象p1设置原型对象操作, 这个操作会调用代理对象的内部方法[[SetPrototypeOf]]
// 而内部方法[[SetPrototypeOf]]被setPrototypeOf拦截函数所拦截, 进而做自定义操作

Object.setPrototypeOf(p12, p22)
p12.__proto__ === p22 // false
p12.__proto__ === Object.prototype // true

// -------------------------

// 解释原型链问题
const p13 = new Proxy(obj, {})
const p23 = new Proxy(proto, {})

Object.setPrototypeOf(p13, p23) // ecma10.5.2

// ecma10.5.2第6条, 如果setPrototypeOf拦截函数为null, 则 setPrototypeOf(obj, p23)
// 将 obj的原型对象设置为 p23
obj.__proto__ === p23 // true

// ecma10.5.1第6条, 如果getPrototypeOf拦截函数为null, 则 getPrototypeOf(obj)
// 所以 p13.__proto__的值为obj.__proto__对象, 即p23
p13.__proto__ === p23 // true

// 可以这样认为, 给代理对象p13设置原型对象p23, 
// 最终 代理对象p13 和 被代理对象obj 的原型对象都是 p23。

// -------------------------

// 解释取值、设值问题
const p14 = new Proxy(obj, {
  get(target, key, receiver) {
    if (key === 'bar') {
      console.log('p14 get =======')
      console.log(key, target, receiver)
    }
    return Reflect.get(target, key, receiver)
  },
  set (target, key, newVal, receiver) {
    if (key === 'bar') {
      console.log('p14 set =======')
      console.log(key, target, receiver)
    }
    Reflect.set(target, key, newVal, receiver)
    return true
  }
})
const p24 = new Proxy(proto, {
  get(target, key, receiver) {
    if (key === 'bar') {
      console.log('p24 get =======')
      console.log(key, target)
      console.log(p14 === receiver) // key 为 'bar'时, p14 === receiver 为 true 
    }
    return Reflect.get(target, key, receiver)
  },
  set (target, key, newVal, receiver) {
    if (key === 'bar') {
      console.log('p24 set =======')
      console.log(key, target)
      console.log(p14 === receiver) // key 为 'bar'时, p14 === receiver 为 true 
    }
    Reflect.set(target, key, newVal, receiver)
    return true
  }
})

Object.setPrototypeOf(p14, p24)

// 如果在副作用函数effect中执行
p14.bar
// 1. 执行 p14代理对象的get拦截函数, track 建立 对象obj、键bar 与 副作用函数联系 [一次]
// 2. 调用 Reflect.get => 28.1.5, 发现最终调用target.key => obj.bar
// 3. obj对象中没有属性‘bar’, 通过原型链查找 => 10.1.8.1
  // 执行 p24.bar => 实际执行p24.[[Get]]('bar', p14) => 10.5.8; p24是代理对象
// 4. 执行p24的get拦截函数
  // receiver 其实是p14代理对象, 而非p24代理对象
  // track 建立 对象proto、键bar 与 副作用函数联系 [两次]

// 修改p14.bar的值
p14.bar = 2
// 1. 执行 p14 代理对象的set拦截函数 [执行一次]
// 2. 内部执行 Reflect.set(obj, 'bar', 2, p14) => 28.1.12
  // 实际调用 obj.[[Set]]('bar', 2, p14) => 10.1.9
// 3. obj 不存在属性 'bar' => 10.1.9.2
  // 通过原型链查找 p24.[[Set]]('bar', 2, p14)
  // 执行 p24 代理对象的set拦截函数 [执行两次]
    // receiver 为p14代理对象, 而非p24代理对象

// 可知 如果‘bar’不存在与‘obj’
// p14.bar 导致track两次
  // 会执行自身的Get拦截函数 => target obj, receiver p14
  // 也会执行 原型链对象p24的Get拦截函数 => target proto, receiver p14
// p14.bar = 2 导致trigger两次
  // 会执行自身的Set拦截函数 => target obj, receiver p14
  // 也会执行 原型链对象p24的Set拦截函数 => target proto, receiver p14

// 在自身的拦截函数中, receiver是target的代理对象
// 在原型对象的拦截函数中, receiver不是target的代理对象