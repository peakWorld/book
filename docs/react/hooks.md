# Hooks
为了更好的进行函数式开发。

## 数组解构
数组按顺序解构; 对象必须按健名解构, 多次使用必须使用别名

## hook解决了那些问题
* 无需修改组件结构的情况下复用状态逻辑
* 复杂组件无需按生命周期拆分逻辑, 只需将关联部分拆分成更小函数

* 频繁生成函数

## useEffect 和 useEffectLayout
* 都是用于处理副作用, useEffectLayout优先于useEffect执行
* useEffect 在渲染过程中被异步调用, 用于绝大多数场景; 在屏幕像素改变之后执行。
* useEffectLayout 在dom变更后同步调用, 用于处理 DOM 操作、调整样式、避免页面闪烁等问题, 需要避免做计算量大的耗时任务。在屏幕像素改变之前执行。

## useState
```js
const hook: Hook = {
  memoizedState: null,
  baseState: null, // useState初始化state
  queue: null,
  baseUpdate: null,
  next: null,  // 依次保存hook对象
};

hook.quene = {
  last: null, // 指向update循环链表的最后一个
  dispatch: null, // dispatchAction.bind(null, currentlyRenderingFiber, queue)
  lastRenderedReducer: basicStateReducer,
  lastRenderedState: initialState,
}

firstWorkInProgressHook // 指向第一个hook对象
workInProgressHook // hook对象链表
nextCurrentHook // current !== null ? current.memoizedState : null
currentHook // 当前hook对象
nextCurrentHook // 下一个hook对象

const update = { // 更新操作, 循环链表
  expirationTime,
  action,
  eagerReducer: null,
  eagerState: null,
  next: null, 
};


// render阶段setState
didScheduleRenderPhaseUpdate = true;
renderPhaseUpdates.set(queue, update); // quene: hook.quene
const update = {
  expirationTime: renderExpirationTime,
  action,
  eagerReducer: null,
  eagerState: null,
  next: null,
};
```

每个hook生成一个对象, 用链表按顺序保存。hook对象中有个quene属性保存更新相关数据。
useState
初始化中由于current Fiber不存在, dispatcher赋值为mount, useState返回[初始state, dispatch]. 
调用dispatch, 将多次更新抽象为对象, 用循环链表保存在, quene中有指针指向链表最后一位。调用函数开始react渲染流程。
再次进入函数, 有current Fiber, dispatcher赋值为 update, 循环处理 更新链表, 返回[最新state, dispatch]

* 如果在函数初始化时, 在函数顶层调用setState
dispatch时, 将一个标志位设置为true, 将所有的更新保存在一个map对象中<hook.quene, 每个setState的更新用链表存储。>
在函数调用完成后, 因为标志为true, 循环重新调用函数, 在每次调用中, 依照map中的数据更新每个useState的值, 循环25次后抛错。

## useEffect
```js
const hook = {
  memoizedState: null, // effect循环链表
  baseState: null, 
  queue: null,
  baseUpdate: null,
  next: null,  // 依次保存hook对象
};

const effect = {
  tag,
  create,
  destroy,
  deps,
  next: (null: any), // 循环链表
};

effect => fiberEffectTag{UpdateEffect | PassiveEffect}; hookEffectTag{UnmountPassive | MountPassive}
effectLayout => fiberEffectTag{UpdateEffect}; hookEffectTag{UnmountMutation | MountLayout}

// componentUpdateQueue.lastEffect = effect 指向本次渲染的effect链表最后一位

fiber.memoizedState = firstWorkInProgressHook // 保存hook链表的首位
fiber.updateQueue = componentUpdateQueue // effect循环链表的末尾
```