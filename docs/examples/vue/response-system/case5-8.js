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

function readonly(obj) { // 深只读
  return createReactive(obj, false, true)
}

function shallowReadonly(obj) { // 浅只读
  return createReactive(obj, true, true)
}

function createReactive(obj, isShallow = false, isReadonly = false) {
  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      if (key === 'raw') {
        return target
      }

      if (!isReadonly && typeof key !== 'symbol') {
        track(target, key)
      }

      const res = Reflect.get(target, key, receiver)

      if (isShallow) {
        return res
      }

      // Q1问题
      if (typeof res === 'object' && res !== null) {
        return isReadonly ? readonly(res) : reactive(res)
      }

      return res
    },
    has(target, key) {
      track(target, key)
      return Reflect.has(target, key)
    },
    ownKeys(target) {
      track(target, Array.isArray(target) ? 'length' : ITERATE_KEY)
      return Reflect.ownKeys(target)
    },
    set(target, key, newVal, receiver) {
      if (isReadonly) {
        console.warn(`属性${key}只读。`)
        return
      }
      const oldVal = target[key]
      const type = Array.isArray(target)
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

function track(target, key) {
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

function trigger(target, key, type, newVal) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)

  const effectsToRun = new Set()
  effects && effects.forEach(effectFn => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })

  if (['ADD', 'DELETE'].includes(type)) {
    const iterateEffects = depsMap.get(ITERATE_KEY)
    iterateEffects && iterateEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  if (Array.isArray(target) && type === 'ADD') {
    const lengthEffects = depsMap.get('length')
    lengthEffects && lengthEffects.forEach(effectFn => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  }

  if (Array.isArray(target) && key === 'length') {
    depsMap.forEach((effects, key) => {
      if (key >= newVal) {
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

function cleanup(effectFn) {
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

const obj = {}
const arr = reactive([obj])
console.log(arr.includes(arr[0])) // false Q1为什么？
// 通过代理对象来访问元素值时,如果值仍然是可以被代理的, 那么得到的值就是新的代理对象而非原始对象。
  // arr[0] 得到一个代理对象
  // includes内部也会通过arr访问数组元素,也会得到一个代理对象