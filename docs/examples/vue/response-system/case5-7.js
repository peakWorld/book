const bucket = new WeakMap()
const effectStack = []
let activeEffect 
let ITERATE_KEY = Symbol()

function reactive(obj) { // 深响应
  return createReactive(obj)
}

function shallowReactive(obj) { // 浅响应
  return createReactive(obj, true)
}

function readonly (obj) { // 深只读
  return createReactive(obj, false, true)
}

function shallowReadonly (obj) { // 浅只读
  return createReactive(obj, true, true)
}

// 原始数据 浅响应 是否只读
function createReactive(obj, isShallow = false, isReadonly = false) {
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target
      }

      if (!isReadonly) { // 非只读时才需要建立联系
        track(target, key)
      }

      const res = Reflect.get(target, key, receiver) // 得到原始值结果

      if (isShallow) { // 浅响应
        return res
      }

      if (typeof res === 'object' && res !== null) { // 深响应
        // 将原始值封装成响应式数据返回
        // 只读时, 用readonly包装返回只读代理对象
        return isReadonly ? readonly(res) : reactive(res) 
      }

      return res
    },
    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target) {
      track(target, ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    set(target, key, newVal, receiver) {
      if (isReadonly) {
        console.warn(`属性${key}只读。`)
        return
      }
      const oldVal = target[key]
      const type = Array.isArray(target) 
        // 代理目标是数组, 则检测被设置的索引值是否小于数组长度; 是则为'SET', 否则为'ADD'
        ? Number(key) < target.length ? 'SET' : 'ADD'
        : Object.prototype.hasOwnProperty.call(target, key) ? 'SET' : 'ADD'
      const res = Reflect.set(target, key, newVal, receiver)
      if (target === receiver.raw) {
        if ((oldVal !== newVal) && (oldVal === oldVal || newVal === newVal)) {
          trigger(target, key, type, newVal)
        }
      }
      return res
    },
    deleteProperty(target, key) {
      if (isReadonly) {
        console.warn(`属性${key}只读。`)
        return
      }

      const hadKey = Object.prototype.hasOwnProperty(target, key)
      const res = Reflect.deleteProperty(target, key)
      if (hadKey && res) {
        trigger(target, key, 'DELETE')
      }
    }
  })
  return proxy
}

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
  const effects = depsMap.get(key) // 当前属性关联的副作用函数

  const effectsToRun = new Set() // 待执行的副作用函数集合[属性关联、迭代相关、数组相关]
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
 
  if (['ADD', 'DELETE'].includes(type)) { // 与当前对象迭代操作相关的副作用函数
    const iterateEffects = depsMap.get(ITERATE_KEY)
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  if (type === 'ADD' && Array.isArray(target)) { // 数组, 且类型为ADD; 执行length相关的副作用函数
    const lengthEffects = depsMap.get('length')
    lengthEffects && lengthEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  if (Array.isArray(target) && key === 'length') { // 数组, 且修改了length
    // 把所有相关联的副作用函数取出并添加到待执行集合中
    depsMap.forEach((effects, key) => {
      if (key >= newVal) { // 索引大于或等于新length值的元素
        effects.forEach(effectFn => {
          if (effectFn !== activeEffect) {
            effectsToRun.add(effectFn)
          }
        })
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

const arr = shallowReactive([1, 2, 3])
arr.length = 1

window.bucket = bucket