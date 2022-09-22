import { setProxy, effect } from './core.js'

// --- 代理函数
const fn = (name) => {
  console.log('我是', name)
}
const pFn = new Proxy(fn, {
  apply(target, thisArg, argArray) {
    // target   被代理的函数
    // thisArg  函数的this指向
    // argArray 传递给函数的参数
    // console.log(target, thisArg, argArray)
    target.call(thisArg, ...argArray)
  }
})
pFn('hcy')
pFn.call({ x: 1}, 'hcy2')

// --- Reflect基本用法
const obj = { x: 1 }
obj.x
Reflect.get(obj, 'x')

const obj2 = {
  foo: 1,
  get bar() {
    return this.foo
  }
}
// console.log(obj2.bar) // 1
// console.log(Reflect.get(obj2, 'foo', { foo: 2 })) // 1
// console.log(Reflect.get(obj2, 'bar', { foo: 2 })) // 2

// --- 为什么用Reflect?
const proxy = setProxy(obj2)
effect(() => {
  // 在obj2对象中, bar属性只有getter访问器
  // 在getter函数中通过this.foo读取foo属性, foo与副作用函数产生联系; foo值改变, 副作用函数重新执行。
  // 但实际上没有。

  // 在proxy的get拦截器中, 我们是用target[key]的方式来读取‘bar’值, target是原始值obj2。
  // 那么getter函数中的this.foo的this指向的是obj2, 而不是代理对象proxy。
  // 未通过代理对象获取属性, 不会和副作用函数产生联系。
  // 所以foo值改变, 副作用函数不会重新执行。
  proxy.bar
})

new Proxy(obj2, {
  get(target, key, receiver) {
    // target 原始对象
    // key 键名
    // receiver proxy1代理对象

    // 这样修改
    // this.foo的this指向的是receiver代理对象
    return Reflect.get(target, key, receiver)
  }
})

// --- 拦截Get操作
const p3 = new Proxy({ x: 1 }, {
  has(target, key) { // 拦截 ‘key in obj’
    return Reflect.has(target, key)
  }
})
// console.log('x' in p3)

let ITERATE_KEY = Symbol()
const p4 = new Proxy({ x: 1, y: 2 }, {
  ownKeys(target) { // 拦截for...in
    console.log('target', target)
    // track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  }
})

for (let k in p4) {}
// Reflect.ownKeys(p4)
