import GG from 'xx/GG'

GG.age
GG.name

const gg: GG.Person = { name: 'aa', age: 12 }

let a = { x: 1, y: 2 }

type  xx = keyof typeof a

type xx2 = Pick<T, K>

class A {
  say(){}
}
class B {
  say(){}
}

class C extends A, B {}

type ZZZ = 'x'
type ZZy = 'x' | 'y'

interface AA {
  content: string;
  width: number;
  height: number;
}

const AAA2 = () => [1]

type NewA = Pick<AA, Exclude<keyof AA, 'width'>>

type ReturnType<T extends () => any> = T extends () => infer K ? K : never

type RT = ReturnType<typeof AAA2>

type DeepReadOnly<T> = {
  readonly [K in keyof T]: T[K] extends string | number ? T[K] : DeepReadOnly<T[K]>
} 

type xxx3 = DeepReadOnly<{ x: 1, y : '2', z: { a: 1, b: '2' }}>