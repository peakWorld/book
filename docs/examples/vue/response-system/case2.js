// 1. 副作用函数硬编码
// 2. 副作用函数与操作字段未建立联系

const bucket = new WeakMap()
let activeEffect  // 全局变量存储被注册的副作用函数

const data = { text: 'Hello World' }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key) // 将副作用函数activeEffect添加到‘桶’中
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal // 更新原值, 执行副作用函数响应式数据都获取最新的值
    trigger(target, key) // 将副作用函数从‘桶’中取出并执行
    return true
  }
})

function track (target, key) {
  if (!activeEffect) return // activeEffect为空, 直接return
  let depsMap = bucket.get(target) // 根据target从‘桶’中获取desMap(map类型: key --> effects)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key) // 根据key从depsMap中取得deps(set类型: effects)
  if (!deps) {
    depsMap.set(key, deps = new Set())
  }
  deps.add(activeEffect) // 将副作用函数添加到‘桶’中
}

function trigger (target, key) {
  const depsMap = bucket.get(target) // 根据target从‘桶’中取得depsMap
  if (!depsMap) return
  const effects = depsMap.get(key) // 根据key取得所有副作用函数 effects
  effects && effects.forEach(fn => fn()) // 执行副作用函数
}

function effect(fn) { // 注册副作用函数
  activeEffect = fn   // 调用effect函数时, 将副作用函数fn赋值给activeEffect
  fn()
}

effect(() => {
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'Hello Vue3'
}, 1000)

setTimeout(() => {
  obj.msg = 'Hello Vue3...'
}, 1000)

window.bucket = bucket