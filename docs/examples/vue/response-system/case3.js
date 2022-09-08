// 1. 分支切换、遗留副作用函数

const bucket = new WeakMap()
let activeEffect  // 全局变量存储被注册的副作用函数

const data = { ok: true, text: 'Hello World' }

const obj = new Proxy(data, {
  get(target, key) {
    track(target, key)
    return target[key]
  },
  set(target, key, newVal) {
    target[key] = newVal
    trigger(target, key)
    return true
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
  activeEffect.deps.push(deps) // 将deps添加到activeEffect.deps数组中, 该deps和此时activeEffect存在依赖
}

function trigger (target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  // effects && effects.forEach(fn => fn()) // 导致无限循环

  const effectsToRun = new Set(effects) // 避免无限循环
  effectsToRun.forEach(effectFn => effectFn())
}

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn) // 清除工作, 在每次执行副作用函数前将它从所有与之关联的依赖结合中删除。
    activeEffect = effectFn 
    fn()  // 副作用函数执行完成, 重新建立联系, 不会包含遗留的副作用函数。
  }
  effectFn.deps = [] // 用来存储所有与该副作用函数相关联的依赖集合
  effectFn() // 此处调用, 才会执行真正的副作用函数, 从而执行读取拦截操作
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i] // deps是依赖集合
    deps.delete(effectFn)         // 将effectFn从依赖集合中删除
  }
  effectFn.deps.length = 0        // 重置effectFn.deps数组
}

effect(() => {
  document.body.innerText = obj.ok ? obj.text : 'not'
})

setTimeout(() => {
  obj.text = 'Hello Vue3'
}, 1000)

setTimeout(() => {
  obj.msg = 'Hello Vue3...'
}, 1000)


// trigger函数中的 effects && effects.forEach(fn => fn()) 为什么导致无限循环？
// 执行副作用函数
  // 调用cleanup, 清除依赖关系
  // 执行fn函数, 进行读取操作, 重新设置依赖
  // 此时forEach循环未结束, 而effects又有值了, 继续执行forEach循环