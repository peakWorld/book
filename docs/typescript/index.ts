const A = 1
let B: { readonly x: number } = { x: 1 } 
B.x = 2

enum xx {
  a,
  b
}

let a: null | undefined | number | string
let b = { x: 1, y: { z: 1, m: undefined } }

let c1: { x: 1, y: 2 } | { x: 1, z: 3 } = { x: 1, y: 2 }
let c2: { x: 1, y: 2 } & { x: 1, z: 3 } = { x: 1, y: 2, z: 3 }
c1.x
c2.y

let d = a!
let d2 = b?.y?.z
let d3 = b?.y?.m

interface Func {
  (a: number, b: string): void
}

const func: Func = (a: number, b: string, c: any) => {}
const func1: Func = (a: number) => {}

// declare function name(attr: number): void
// interface Name {
//   (attr: number): void
// }
// let name: Name
type name = (attr: number) => void

namespace GG {
  export interface Person { // 暴露类型
    name: string
    age: number
  }
  const name = 'gg'
  const age = 12
  export const gg: Person = { name, age } // 暴露属性
  export function add (a: number, b: number) { // 暴露函数
    return a + b
  }
}
let pp: GG.Person = GG.gg

declare module 'xx/GG' {
  interface Person { // 暴露类型
    name: string
    age: number
  }
  const name = 'gg' // const变量只读, 可以看成一种类型声明

  global {
    const func2: (a: number) => void
  }
}
