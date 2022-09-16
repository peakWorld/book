import * as CONST from  './consts'

// 1. 实现Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}
type TodoPreview = MyPick<CONST.Todo, 'title' | 'completed'>

// 2. 实现 Readonly
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K]
}
type TodoReadonly = MyReadonly<CONST.Todo>

// 3. 元组转换为对象
type TupleToObject<T extends readonly any[]> = {
  [P in T[number]]: P
}
type TypeObject = TupleToObject<CONST.tuple>

// 4. 第一个元素
type First<T extends any[]> = T['length'] extends 0 ? never : T[0]
type First2<T extends any[]> = T extends [infer F, ...infer _] ? F : never
type THead = First<CONST.arr1>

// 5. 获取元组长度
type Length<T extends any[]> = T['length']
type teslaLen = Length<CONST.tesla>

// 6. Exclude
type MyExclude<T, K> = T extends K ? never : T
type Result = MyExclude<'a' | 'b' | 'c', 'a'>

// 7. Awaited
type MyAwaited<T> = T extends Promise<infer P>
  ? P extends Promise<any> ? MyAwaited<P> : P
  : never
type Result2 = MyAwaited<CONST.ExampleType> 

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
type FunctionParamsType = MyParameters<typeof CONST.foo>

// 14. 获取函数返回类型
type MyReturnType<T> = T extends (...arg: any) => infer K ? K : never
type Result7 = MyReturnType<typeof fn> 

// 15. 实现 Omit => Omit<T, K> 省略K中字段的T对象
type MyOmit<T, K> = MyPick<T, MyExclude<keyof T, K>>
type Result8 = MyOmit<CONST.Todo, 'description' | 'title'>

// 16. Readonly2<T, K>  K指定应设置为Readonly的T的属性集。如果未提供K, 则应使所有属性都变为只读。
// 类型设置默认值
type Readonly2<T, K extends keyof T = keyof T> = {
  readonly [P in K]: T[P]
} & MyOmit<T, K>
type Result9 = Readonly2<CONST.Todo, 'completed'>
const x1: Result9 = { completed: true, title: '1', description: '2' }
// x1.completed = false // error
x1.title = '3'

// 17. 深度 Readonly 将对象的每个参数及其子对象递归地设为只读
// Object包含了Function, 需要先限定Function
type DeepReadonly<T extends Object> = {
  readonly [P in keyof T]:
    T[P] extends Function ? T[P] :
    T[P] extends Object ? DeepReadonly<T[P]> :
    T[P] extends Array<any> ? 
    T[P][number] extends Object ? DeepReadonly<T[P][number]> : T[P][number] : T[P]
}
type Result10 = DeepReadonly<CONST.DeepX>

// 18 元组转合集 返回元组所有值的合集
type TupleToUnion<T extends any[]> = T[number]
type Result11 = TupleToUnion<CONST.Arr>