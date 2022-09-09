import { Todo, tuple, arr1, tesla } from './consts'

// 1. 实现Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}
type TodoPreview = MyPick<Todo, 'title' | 'completed'>

// 2. 实现 Readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}
type TodoReadonly = MyReadonly<Todo>

// 3. 元组转换为对象
type TupleToObject<T extends readonly any[]> = {
  [P in T[number]]: P
}
type TypeObject = TupleToObject<typeof tuple>

// 4. 第一个元素
type First<T extends any[]> = T['length'] extends 0 ? never : T[0]
type First2<T extends any[]> = T extends [infer F, ...infer _] ? F : never
type THead = First<arr1>

// 5. 获取元组长度
type Length<T extends any[]> = T['length']
type teslaLen = Length<tesla>