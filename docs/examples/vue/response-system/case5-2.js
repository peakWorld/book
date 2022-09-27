const bucket = new WeakMap()
const effectStack = []
let activeEffect 
let ITERATE_KEY = Symbol()

const obj = { x: 1, y: 1 }

const proxy = new Proxy(obj, {
  get(target, key, receiver) { // 拦截obj.x
    track(target, key)
    return Reflect.get(target, key, receiver)
  },
  has(target, key) { // 拦截 k in obj
    track(target, key)
    return Reflect.has(target, key)
  },
  ownKeys(target) { // 拦截for..in
    // 只有target, 无法具体到属性值; 构建唯一key, 副作用函数与该key建立联系
    track(target, ITERATE_KEY)
    return Reflect.ownKeys(target)
  },
  set(target, key, newVal, receiver) {
    // 属性不存在, 则为新增属性; 否则属性存在
    // 解决问题Q2
    const type = Object.prototype.hasOwnProperty(target, key) ? 'SET' : 'ADD'
    const res = Reflect.set(target, key, newVal, receiver)
    trigger(target, key, type)
    return res
  },
  deleteProperty(target, key) {
    const hadKey = Object.prototype.hasOwnProperty(target, key)
    const res = Reflect.deleteProperty(target, key)
    // 只有被删除对象是自身属性切删除成功时, 才触发更新
    if (hadKey && res) {
      trigger(target, key, 'DELETE')
    }
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

function trigger (target, key, type) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })

  // 'ADD' 或 'DELETE'操作类型, 改变了对象的属性数量
  // 触发ITERATE_KEY相关副作用函数重新执行
  if (['ADD', 'DELETE'].includes(type)) {
    // 解决问题Q1
    const iterateEffects = depsMap.get(ITERATE_KEY)
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }
  

  effectsToRun.forEach(effectFn => {
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

export function effect(fn, options = {}) {
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

effect(function effectFn1() {
  'x' in proxy // 修改'x'的值, effectFn1副作用函数重新执行
})

effect(function effectFn2() {
  for (let k in proxy) { // proxys属性
    console.log('k', k)
  }
})

// Q1: 新增属性z, 触发set拦截方法, 但effectFn2未重新执行?
// 因为for...in循环副作用函数是与ITERATE_KEY建立联系; 而此处新增bar属性,即使执行也是执行bar属性关联的副作用函。
// proxy.z = 2

// Q2: 改变属性值, 不该触发effectFn2重新执行, 因为 未改变for...in执行的循环次数。
// 只有 改变对象的属性数量才重新执行effectFn2函数。
