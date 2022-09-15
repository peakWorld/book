const bucket = new WeakMap()
const effectStack = []
const data = { foo: 0, bar: 1 }
let activeEffect 

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
  activeEffect.deps.push(deps)
}

function trigger (target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
  effectsToRun.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

function effect(fn, options = {}) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn 
    effectStack.push(effectFn)
    const res = fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.options = options
  effectFn.deps = []
  if (!options.lazy) {
    effectFn()
  }
  return effectFn
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function traverse(value, seen = new Set()) {
  if (typeof value !== 'object' || !value || seen.has(value)) return
  // 已遍历过的数据添加到seen中, 避免循环引用导致的死循环
  seen.add(value)
  for (let k in value) {
    traverse(value[k], seen)
  }
  return value
}

function watch(source, cb, options) {
  let getter, oldValue, newValue
  if (typeof source === 'function') {
    getter = source
  } else {
    getter = () => traverse(source) // 递归读取属性
  }

  const job = () => {
    newValue = effectFn()
    cb(newValue, oldValue)
    oldValue = newValue
  }

  const effectFn = effect(
    () => getter(), // 建立响应式数据和副作用函数的关系
    {
      lazy: true,
      // scheduler: job // 响应式数据发生改变, 才会触发调度函数
      scheduler() {
        if (options.flush === 'post') { // 微任务队列执行
          const p = Promise.resolve()
          p.then(job)
        } else { // 同步执行
          job()
        }
      }
    }
  )
  if (options.immediate) { // 立即执行, 此时oldValue为undefined
    job()
  } else {
    oldValue = effectFn() // 首次执行副作用函数, 绑定关系, 返回初始值
  }
}

watch(
  obj,
  () => {
    console.log('数据发生了改变', obj)
  },
  {
    immediate: true,
    flush: 'post' // post 微任务队列中执行, sync 同步执行
  }
)

obj.foo++

window.obj = data