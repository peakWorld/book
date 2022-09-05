const bucket = new Set()
const data = { text: 'Hello World' }

const obj = new Proxy(data, {
  get(target, key) {     // 读取操作
    bucket.add(effect) // 将副作用函数存储在‘桶中’
    return target[key]   // 返回属性值 
  },
  set(target, key, newVal) {   // 设置操作
    target[key] = newVal       // 设置属性值
    bucket.forEach(fn => fn()) // 从‘桶’中取出副作用函数并执行
    return true                // 设置操作成功(返回值为true)
  }
})

function effect () { // 副作用函数
  document.body.innerText = obj.text
}
effect() // 执行函数, 触发读取操作
setTimeout(() => {
  obj.text = 'Hello Vue3' // 修改属性值, 触发设置操作
}, 1000)