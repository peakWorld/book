interface Todo {
  title: string
  description: string
  completed: boolean
}

// 1. 实现Pick
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P]
}

type TodoPreview = MyPick<Todo, 'title' | 'completed'>