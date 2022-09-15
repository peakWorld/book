// 调度执行

const bucket = new WeakMap()
const effectStack = []
const data = { foo: 0 }
let activeEffect 

const jobQuene = new Set()  // 任务队列, set结构保证副作用函数不会重复
const p = Promise.resolve() // promise实例, 将任务添加到微任务队列
let isFlushing = false

function flushJob() {
  if (isFlushing) return 
  isFlushing = true
  p.then(() => { // 微任务队列, 在宏任务后执行
    jobQuene.forEach(job => job())
  }).finally(() => { // 当前宏任务期间, isFlushing始终为true; 
    isFlushing = false
  })
}

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
    if (effectFn.options.scheduler) { // 副作用函数存在调度器, 则调用该调度器
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
    fn()
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
  }
  effectFn.options = options
  effectFn.deps = []
  effectFn()
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

effect(
  () => {
    console.log('foo', obj.foo)
  },
  {
    scheduler(fn) { // 调度函数
      // setTimeout(fn) // 副作用函数放到宏任务队列中

      jobQuene.add(fn)
      flushJob()
    }
  }
)

// 多次变更值
obj.foo++
obj.foo++

window.obj = data