# Document相关

## document.readyState
```ts
  // document.readyState 当前文档的准备状态(只读)
  document.readyState === 'loading' // 文档正在加载中
  document.readyState === 'interactive' // 文档已完成加载，文档已被解析，但图像、样式表和框架等子资源仍在加载
  document.readyState === 'complete' // 表示文档和所有子资源已完成加载

  console.log('document.readyState', document.readyState)
  window.addEventListener('load', () => {
    console.log('loaded')
  });
  document.addEventListener('readystatechange', () => {
    console.log('document.readyState', document.readyState)
  });
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded')
  });

  // reload页面
  // document.readyState loading
  // document.readyState interactive
  // DOMContentLoaded
  // document.readyState complete
  // loaded

  // DOMContentLoaded事件必须在文档状态为loading时候绑定才有效。
  setTimeout(() => {
    console.log('setTimeout document.readyState', document.readyState) // setTimeout document.readyState interactive
    document.addEventListener('DOMContentLoaded', () => {
      console.log('setTimeout DOMContentLoaded') // 未执行
    });
  }, 0)
```