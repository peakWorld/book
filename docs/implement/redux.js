function createStore (reducer, preloadState, enhancer) {

  if (typeof preloadState === 'function' && !enhancer) {
    enhancer = preloadState
    preloadState = undefined
  }
  // 中间件处理器, 
  if (enhancer && typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadState)
  }

  let currentState = preloadState
  let listeners = []

  function getState () {
    return currentState
  }

  function subscribe (listener) {
    listeners.push(listener)
    return function unsubscribe () {
      const index = listeners.indexOf(listener)
      listeners.splice(index, 1)
    }
  }
  
  function dispatch (action) {
    currentState = reducer(currentState, action)
    listeners.forEach(listener => listener())
    return action
  }

  // 初始化数据
  dispatch({ type: '__INIT' })

  return {
    getState,
    subscribe,
    dispatch
  }
}

// 合并reducers
function combineReducers (reducers) {
  const finalReduers = Object.keys(reducers).reduce((res, key) => {
    if (reducers[key]) {
      res[key] = reducers[key]
    }
    return res
  }, {})

  return (state, action) => {
    const nextState = {}
    const keys = Object.keys(finalReduers)
    let hasChanged = false
    for (let i = 0, len = keys.length; i < len; i++) {
      const key = keys[i]
      const reducer = finalReduers[key]
      const preStateForKey = state[key]
      const nextStateForKey = reducer(preStateForKey, action)
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || preStateForKey !== nextStateForKey
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length
    return hasChanged ? nextState : state
  }
}

// 使用插件
function applyMiddleware (...mws) {
  return (createStore) => (reducer, preState) => {
    const store = createStore(reducer, preState)
    const api = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    }
    const chain = mws.map(mw => mw(api))
    dispatch = compose(...chain)(store.dispatch)
    return { ...store, dispatch }
  }
}

function compose (...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg
  }
  if (funcs.length === 1) {
    return funcs[0]
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

// redux-thunk
const ReduxThunk = ({ getState, dispatch }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState, extraArgument)
  }
  return next(action)
}

const ReduxThunk = ({ getState, dispatch }) => next => {
  const currentDispatch = action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument)
    }
    return next(action)
  }
  return currentDispatch
}

// bindActionCreator
function bindActionCreator (creater, dispatch) {
  return (...args) => dispatch(creater.apply(this, args))
}

// react-redux