## 为什么 [1, 2, 3].map(parseInt) 返回 [1,NaN,NaN]? 
```js
// map的cb函数接受三个值(value, i arr)
// parseInt函数的第二个参数表示要解析的数字的基数。该值介于 2 ~ 36 之间。
// 如果省略该参数或其值为 0，则数字将以 10 为基础来解析。如果它以 “0x” 或 “0X” 开头，将以 16 为基数。
// 如果该参数小于 2 或者大于 36，则 parseInt() 将返回 NaN。
```

## 将平铺数据转成树形结构
```js
const arr = [
  { id: 1, text: 'a1', pid: 0 }, { id: 2, text: 'a1', pid: 3 }, { id: 3, text: 'a1', pid: 2 },
  { id: 4, text: 'a1', pid: 4 }, { id: 5, text: 'a1', pid: 0 }, { id: 6, text: 'a1', pid: 1 },
  { id: 7, text: 'a1', pid: 2 }, { id: 8, text: 'a1', pid: 4 }, { id: 9, text: 'a1', pid: 5 },
]
// => 
// {
//   children: [
//     {
//       { id: 1, text: 'a1', pid: 0, children: [{ id: 6, text: 'a1', pid: 1 }] },
//       { id: 9, text: 'a1', pid: 0 },
//     }
//   ]
// }

```

## 手写call、apply、bind函数
* 使用方式
```js
function myFunc() {
  console.log(this, arguments);
}
const abc = { x: 1 }
// call调用
myFunc.call(null, 'a')    // window, 'a'
myFunc.call(abc, 'a')     // { x: 1 }, 'a'
// apply调用
myFunc.apply(null, ['a']) // window, 'a'
myFunc.apply(abc, ['a'])  // { x: 1 }, 'a'
// bind生成新函数
newFunc = myFunc.bind(null, 'a',)
newFunc2 = newFunc.bind(null, 'b')
newFunc('c')  // window, 'a', 'c'
newFunc2('d') // window, 'a', 'b', 'd'
```
* 实现
```js
// call实现
Function.prototype.ICall = function() {
  if (typeof this !== 'function') {
    throw new Error('error')
  }
  const [_context, ...args] = arguments
  const context = _context || window
  const _rand = Math.random()
  context[_rand] = this
  const result = context[_rand](...args)
  delete context[_rand]
  return result
}
const abc = { x: 1 } 
function test12 () {
  console.log(this, arguments)
}
test12.ICall(null, 'a') // window, 'a'

// bind实现
Function.prototype.IBind = function () {
  if (typeof this !== 'function') {
    throw new Error('error')
  }
  const [_context, ...args] = arguments
  const context = _context || window
  const _this = this
  return function F () {
    if (this instanceof F) { // 构建实例对象
      return new _this(...args, ...arguments)
    }
    return _this.apply(context, [...args, ...arguments]) // 调用函数
  }
}
```

## 实现instanceof
```js
function myInstanceof (left, right) {
  const prototype = right.prototype
  while (left) {
    if (left.__proto__ === prototype) {
      return true
    }
    left = left.__proto__
  }
  return false
}
```

## Ajax请求
```js
function ctreateAjax (options) {
  const { method, url, async = true, data = '' } = options
  const xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open(method, url, async)
  xhr.send(data)
  return new Promise((resolve, reject) => {
    xhr.onreadystatechange = () => {
      if (xhr.readyState == 4) { // 请求完成
        if (xhr.status == 200 || xhr.status == 304){
          // todo success
          resolve(xhr.responseText)
        } else {
          // todo err
          reject('')
        }
      }
    }
  })
}
```