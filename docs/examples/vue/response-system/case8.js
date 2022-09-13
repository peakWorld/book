// 竞态-过期函数

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
    getter = () => traverse(source)
  }

  let cleanup // 用于存储用户注册的过期函数

  function onInvalidate(fn) {
    cleanup = fn // 存储用户注册的过期函数
  }

  const job = () => {
    newValue = effectFn()
    if (cleanup) { // 在调用回调函数前, 先调用过期回调
      cleanup()
    }
    cb(newValue, oldValue, onInvalidate)
    oldValue = newValue
  }

  const effectFn = effect(
    () => getter(),
    {
      lazy: true,
      scheduler() {
        if (options.flush === 'post') {
          const p = Promise.resolve()
          p.then(job)
        } else {
          job()
        }
      }
    }
  )
  if (options.immediate) {
    job()
  } else {
    oldValue = effectFn()
  }
}

let finalData = res
watch(
  obj,
  async (newVal, oldValue, onInvalidate) => {
    // 定义一个标志, 代表当前副作用函数是否过期; 默认false, 代表未过期
    let expired = false
    onInvalidate(() => {
      expired = true
    })
    const res = await get()
    if (!expired) {
      finalData = res
    }
  }
)

let i = 0
function get() {
  return new Promise((resolve) => setTimeout(() => resolve(i++), 1000))
}

obj.foo++
setTimeout(() => {
  obj.foo++
}, 500)

console.log('finalData', finalData)