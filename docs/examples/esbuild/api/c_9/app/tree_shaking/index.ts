// 即使通过*的方式全部导入, 但未使用的函数还是会被shaking掉
import * as lib from './lib.js'
lib.one()

function say() { }