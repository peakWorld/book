import { Todo, tuple } from './consts'

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
