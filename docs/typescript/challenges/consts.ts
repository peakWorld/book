export interface Todo {
  title: string
  description: string
  completed: boolean
}

export type tuple = ['tesla', 'model 3', 'model X', 'model Y']

export type arr1 = ['a', 'b', 'c']

export type tesla = ['tesla', 'model 3', 'model X', 'model Y']

export type ExampleType = Promise<string>

export const foo = (arg1: string, arg2: number): void => {}

export const fn = (v: boolean) => {
  if (v)
    return 1
  else
    return 2
}

export type DeepX = { 
  x: { 
    a: 1
    b: 'hi'
  }
  y: 'hey',
  m: () => void,
  n: [
    '1',
    2,
    () => void,
    {
      k: 2,
      p: string
    }
  ]
}

export type Arr = ['1', '2', '3']

export const promise1 = Promise.resolve(3);
export const promise2 = 42;
export const promise3 = new Promise<string>((resolve, reject) => {
  setTimeout(resolve, 100, 'foo');
});

export interface Cat {
  type: 'cat'
  breeds: 'Abyssinian' | 'Shorthair' | 'Curl' | 'Bengal'
}

export interface Dog {
  type: 'dog'
  breeds: 'Hound' | 'Brittany' | 'Bulldog' | 'Boxer'
  color: 'brown' | 'white' | 'black'
}

export type Fn = (a: number, b: string) => number
