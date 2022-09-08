// 1. 嵌套effect
// 2. 无限递归循环

const bucket = new WeakMap()
let activeEffect 
const effectStack = []

const data = { foo: 0 }

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
  if (!activeEffect) return // 顶层effect调用后, activeEffect为空; effect外部的所用读取设置都直接返回
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

  // const effectsToRun = new Set(effects)
  // effectsToRun.forEach(effectFn => effectFn())

  const effectsToRun = new Set()
  effects && effects.forEach(effectFn => {
    // trigger触发执行的副作用函数与当前正在执行的副作用函数相同, 则不触发
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn)
    }
  })
  effectsToRun.forEach(effectFn => effectFn())
}

function effect(fn) {
  const effectFn = () => {
    cleanup(effectFn)
    activeEffect = effectFn 
    effectStack.push(effectFn) // 在副作用函数执行前将当前副作用函数压入栈中
    fn()
    effectStack.pop() // 在副作用函数执行后, 将当前副作用函数弹出栈
    activeEffect = effectStack[effectStack.length - 1] // 还原activeEffect为之前的值; 顶层effect执行后, activeEffect为空
  }
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

// effect嵌套
// let temp1, temp2
// effect(function effectFn1() {
//   console.log('effectFn1 执行')
//   effect(function effectFn2() {
//     console.log('effectFn2 执行')
//     temp2 = obj.bar
//   })
//   temp1 = obj.foo
// })
// obj.foo = false

// 无限递归循环
// effect(() => {
//   obj.foo++
// })

window.obj = data