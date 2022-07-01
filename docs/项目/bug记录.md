* 禁止img的src取值为空。延迟加载的图片也要增加默认的src;src取值为空，会导致部分浏览器重新加载一次当前页面
* 图片添加 width/height, 以避免页面抖动
* 有下载需求的图片采用img标签实现，无下载需求的图片采用CSS背景图实现

* 使用 new Function 执行动态代码, 通过 new Function 生成的函数作用域是全局使用域，不会影响当前的本地作用域
```js
  let x = 1
  function test() {
    let x = 2
    const func = new Function('console.log(x)')
    return func
  }

  test()() // 1
```
