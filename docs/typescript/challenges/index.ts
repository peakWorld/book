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

// 13. Parameters
type MyParameters<T> = T extends (...arg: infer K) => any ? K : never
type FunctionParamsType = MyParameters<typeof CONST.foo>

// 14. 获取函数返回类型
type MyReturnType<T> = T extends (...arg: any) => infer K ? K : never
type Result7 = MyReturnType<typeof CONST.fn> 

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

// 19 可串联构造器 
type Chainable<T = {}> = {
  option<K extends string, V>(k: K, v: V): Chainable<
    {
      [P in (keyof T | K)]: P extends K ? V : P extends keyof T ? T[P] : never
    }
  >
  get(): T
}
// 要想使用, 必须先声明(初始化)
declare const Result12: Chainable
const result = Result12
  .option('a', 1)
  .option('b', '1')
  .option('c', { x: 1 })
  .get()

// 20 最后一个元素
type Last<T extends any[]> = T extends [...any[], infer T] ? T : never
type tail1 = Last<['a', 'b', 'c']>

// 21 出栈、
type Pop<T extends any[]> = T extends [...infer T, any] ? T : never
type Push<T extends any[], K> = [...T, K] 
type Shift<T extends any[]> = T extends [any, ...infer T] ? T : never
type Unshift<T extends any[], K> = [K, ...T] 
type re1 = Pop<['a', 'b', 'c', 'd']>

// 22 Promise.all
declare function MyPromiseAll <T extends unknown[]>(arg: readonly [...T]): {
  [P in keyof T]: T[P] extends Promise<any> ? MyAwaited<T[P]> : T[P] 
}
// 调用函数, 必须先声明函数
const p = MyPromiseAll([CONST.promise1, CONST.promise2, CONST.promise3] as const)

// 为什么返回值定义时为{},最终得到[]?
type B1 = { x: 1, y: 2 }
type B2 = [1, 3, 5]
type AA<T> = { [P in keyof T]: T[P] }
type A11 = AA<B1>
type A21 = AA<B2>

// 23 Lookup 在联合类型中搜索公共字段来获取相应的类型。
type Lookup<T, K extends string> = T extends { type: K } ? T : never
type Result13 = Lookup<CONST.Cat | CONST.Dog, 'dog'>

// 24 Trim Left 删除原字符串开头的空白字符串
// extends 在泛型中, 约束范围; 
// extends 在判断(假设)语句中, 用infer推断类型 => [A extends B,则B的属性A都可访问,可认为A拥有B的所有属性(如果符合某个类型,则推断出某些类型)]
type TrimLeft<T extends string> = T extends `${' ' | "\n" | "\t"}${infer S}` ? TrimLeft<S> : T
type Readonly14 = TrimLeft<'  Hello World  '>

// 25 Trim 删除原字符串两端的空白符
type Trim<T extends string> = T extends `${' ' | "\n" | "\t"}${infer SL}` ? Trim<SL> : T extends `${infer SR}${' ' | "\n" | "\t"}` ? Trim<SR> : T
type Readonly15 = Trim<'  Hello World  '>

// 26 Capitalize 字符串的第一个字母转换为大写，其余字母保持原样
type Capitalize<T extends string> = T extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : T
type capitalized = Capitalize<'hello world'>

// 27 Replace<S, From, To> 将字符串 S 中的第一个子字符串 From 替换为 To
type Replace<S extends string, From extends string, To extends string> = S extends `${infer L}${From}${infer R}` ? `${L}${To}${R}` : S
type Readonly16 = Replace<'types are fun!', 'fun', 'awesome'>

// 28 ReplaceAll<S, From, To> 将一个字符串 S 中的所有子字符串 From 替换为 To
type ReplaceAll<S extends string, From extends string, To extends string> = S extends `${infer L}${From}${infer R}` ? ReplaceAll<`${L}${To}${R}`, From, To> : S
type replaced = ReplaceAll<'t y p e s', ' ', ''>

// 29 AppendArgument<Fn, A> 给定的函数类型 Fn，以及一个任意类型 A，返回一个新的函数 G。G 拥有 Fn 的所有参数并在末尾追加类型为 A 的参数
type AppendArgument<F extends any, T extends any> = F extends (...args: infer K) => any ? [...K, T] : never
type Result18 = AppendArgument<CONST.Fn, boolean>

// 30 实现联合类型的全排列，将联合类型转换成所有可能的全排列数组的联合类型。
type Permutation<T, U = T> = [T] extends [never] ? [] : U extends T ? [U, ...Permutation<Exclude<T, U>>] : []
type perm = Permutation<'A' | 'B' | 'C'>

type A1 = 'A' | 'B' | 'C' 
type A2<T> = T extends any ? [T] : never     // 抽取联合类型; 联合类型, 返回类型的最小公共集合
type A3<T> = [T] extends [any] ? [T] : never // 暂存输入的T
type A4 = A2<A1> 
type A5 = A3<A1>

// 31 

