import { Todo, tuple, arr1, tesla, ExampleType, foo, fn } from './consts'

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

// 6. Exclude
type MyExclude<T, K> = T extends K ? never : T
type Result = MyExclude<'a' | 'b' | 'c', 'a'>

// 7. Awaited
type MyAwaited<T> = T extends Promise<infer P>
  ? P extends Promise<any> ? MyAwaited<P> : P
  : never
type Result2 = MyAwaited<ExampleType> 

// 8. if
type If<T extends Boolean, K, U> = T extends true ? K : U
type A = If<true, 'a', 'b'>

// 9. concat
type Concat<T extends any[], K extends any[]> = [...T, ...K]
type Result3 = Concat<[1], [2]>

// 10. Includes
type Includes<T extends any[], K> = K extends T[number] ? true : false
type Result4 = Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Wamuu'>

// 11. Push
type Push<T extends any[], K> = [...T, K] 
type Result5 = Push<[1, 2], '3'>

// 12. Unshift
type Unshift<T extends any[], K> = [K, ...T] 
type Result6 = Unshift<[1, 2], 0>

// 13. Parameters
type MyParameters<T> = T extends (...arg: infer K) => any ? K : never
type FunctionParamsType = MyParameters<typeof foo>

// 14. 获取函数返回类型
type MyReturnType<T> = T extends (...arg: any) => infer K ? K : never
type Result7 = MyReturnType<typeof fn> 

// 15. 实现 Omit => Omit<T, K> 省略K中字段的T对象
type MyOmit<T, K> = MyPick<T, MyExclude<keyof T, K>>
type Result8 = MyOmit<Todo, 'description' | 'title'>

// 16. Readonly2<T, K>  K指定应设置为Readonly的T的属性集。如果未提供K, 则应使所有属性都变为只读。