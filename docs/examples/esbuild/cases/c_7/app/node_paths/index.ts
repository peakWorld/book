// 自定义全局模块
// 本地模块, 但是未在package.json中注册
import pkg2 from 'pkg2'

// 隐式文件扩展
import { abc } from './a'

console.log('pkg2', pkg2, abc)

import 'mbar'