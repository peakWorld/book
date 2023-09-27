import { write } from './home'

// 函数调用前、告知esbuild可对该函数调用进行tree-shake
/* @__PURE__ */ write()


// 模块中的sideEffects控制esbuild的tree-shake逻辑
import 'mside'
import { help } from 'mside/utils2'
import 'mside/polyfills2'


// 即使将mside/utils2设置为无副作用的, 但是导出的help函数被使用了
// 那么就不会tree-shake
help()
