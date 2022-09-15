export interface Todo {
  title: string
  description: string
  completed: boolean
}

export const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const

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