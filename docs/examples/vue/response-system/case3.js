// 1. 分支切换

const bucket = new WeakMap()
let activeEffect  // 全局变量存储被注册的副作用函数

const data = { text: 'Hello World' }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    trigger(target, key)
  }
})

function track (target, key) {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, deps = new Set())
  }
  deps.add(activeEffect)
  activeEffect.deps.push(deps) // 将deps添加到activeEffect.deps数组中
}

function trigger (target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsToRun = new Set(effects) // 避免无限循环
  effectsToRun.forEach(effectFn => effectFn())
}

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn) // 清除工作
    activeEffect = effectFn // 设置副作用函数
    fn()
  }
  effectFn.deps = [] // 用来存储所有与该副作用函数相关联的依赖集合
  effectFn()
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i] // deps是依赖集合
    deps.delete(effectFn)         // 将effectFn从依赖集合中删除
  }
  effectFn.deps.length = 0        // 重置effectFn.deps数组
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