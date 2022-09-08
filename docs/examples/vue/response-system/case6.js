// lazy
// computed

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
    const res = fn()  // 执行真正的副作用函数
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  effectFn.options = options
  effectFn.deps = []
  if (!options.lazy) { // 只有非lazy的时候才执行
    effectFn()
  }
  return effectFn // 返回副作用函数
}

function cleanup (effectFn) {
  for (let i = 0, len = effectFn.deps.length; i < len; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

function computed(getter) {
  let value
  let dirty = true // 是否为脏数据, 脏数据需要重新执行获取数据

  const effectFn = effect(
    getter,
    {
      lazy: true,
      scheduler() { // 赋值(响应式数据设置操作)才会执行该调度, dirty重新设置为true; 此处不必执行副作用函数
        if (!dirty) {
          dirty = true
          trigger(obj, 'value') // 手动触发 obj-value 的副作用函数
        }
      }
    }
  )
  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, 'value') // 手动追踪 obj-value 的副作用函数
      return value
    }
  }
  return obj
}

const sum = computed(() => obj.foo + obj.bar)

// 嵌套effect
effect(() => {
  console.log(sum.value)
})

obj.foo++

window.obj = data