# Vue入门
React技术栈快速入门Vue。

## 循序渐进
看一遍[官方文档](https://v2.cn.vuejs.org/v2/guide/), 熟悉基础用法。
阅读书籍[《深入理解Vue.js实战》](https://godbasin.github.io/vue-ebook/), 加深对vue理解。
阅读的同时结合[Demo项目](https://github.com/peakWorld/learn-vue2), 用代码解决阅读中的疑惑。

## Vue相关重点

### 创建项目
详细用法参考[Vue Cli文档](https://cli.vuejs.org/zh/guide/css.html)
```js
  npm install -g @vue/cli // 安装脚手架
  vue create learn-vue2 // 脚手架生成 vue 项目，同时会自动安装依赖

  // 添加scss支持
  npm i sass sass-loader -D
  // vue.config.js
  module.exports = defineConfig({
    ...
    css: {
      loaderOptions: {
        scss: {
          additionalData: `@import "~@/scss/variables.scss";` // 前置样式变量
        }
      }
    }
  })
```
### 响应式属性
在实例被创建时就存在于data中的属性才会加入Vue的响应式系统中.
```js
  const vm = new Vue({
    data() {
      return {
        name: 'lyf',
        loaction: {},
        _age: 18 // 以_或$开头为非响应式属性
      }
    }
  })

  // 如果想在实例初始化外添加响应式属性。
  vm.$set(this.$data, 'age', 1) // error 不能在根$data添加响应式属性
  vm.$set(this.loaction, 'city', '武汉') // ok 必须在响应式对象中添加新属性
```
### 计算属性和侦听器
* 计算属性 处理复杂逻辑计算; 结果被缓存, 除非依赖的响应式属性变化; 支持属性读取设置
```js
  const vm = new Vue({
    data() {
      return {
        name: 'lyf',
        age: 18,
        sex: 1
      }
    },
    computed: {
      person() { // 支持复杂逻辑计算
        return `姓名: ${this.name}, 年龄: ${this.age}, 性别: ${this.sex === 1 ? '男' : '女'}` 
      },
      nominaAge: { // 读取设置
        get() {
          return this.age + 1
        },
        set(val) {
          this.age = val - 1
        }
      }
    }
  })
```
* 侦听器 监听数据变化,观察Vue实例中响应式属性或计算属性的变化
```js
  const vm = new Vue({
    data() {
      return {
        searchText: ''
        loading: false,
        books: {
          history: {
            china: {}
          }
        }
      }
    },
    watch() {
      searchText(val, oldVal) { // 输入框值改变,进行模糊查询
        this.loading = true
        this.getInfoBySearchText()
      },
      books: {
        handler() {},
        deep: true, // 嵌套
        immediate: true // 侦听开始后立即调用
      },
      'books.history'() {},
      'books.history.china': 'setChinaHistory', // 调用方法名
    },
    methods: {
      getInfoBySearchText: debounce(async function(params) { // 添加防抖效果
        // TODO
        this.loading = false
      }, 500),
      setChinaHistory() {}
    }
  })
```
### 指令
* 常用指令
```js
  // v-model 指令语法糖
  <input v-model="name" />
  <input :value="name" @change="name=$event.target.value" />

  // .sync 语法糖
  <Dialog :visible.sync="show"/>
  <Dialog :visible="show" @update:visible="show=$event"/>

  Vue.component('Dialog', {
    props: {
      visible: Boolean
    },
    template: `
      <div v-if="visible">
        <div @click="onCancel">取消</div>
      </div>
    `,
    methods: {
      onCancel() {
        this.$emit('update:visible', false)
      }
    }
  })
```
* 自定义指令
```js
<div v-bird:fly.a.b="test"></div>

Vue.directive('bird', {
  bind(el, binding, vnode) {
    // 只调用一次，指令第一次绑定到元素时调用。在这里进行一次性的初始化设置。
    // el 指令所绑定的元素, 用来直接操作 DOM。
    el.innerHTML = binding.value
    // binding 指令属性
      // name 指令名, 不包括 v- 前缀
      // arg 指令参数 例如 v-test:name中的 name
      // modifiers 包含修饰符的对象
      // expression 指令表达式(字符串形式)
      // value 指令的绑定值
    console.log('binding', binding)
    // vnode 虚拟节点
      // vnode.context VueComponent, 直接获取data、methods中的属性和方法
    console.log('vnode', vnode)
    // 除了 el 之外，其它参数都应该是只读的. 
    // 通过 el 在钩子之间共享参数据
  },
  inserted() {
    // 被绑定元素插入父节点时调用(仅保证父节点存在，但不一定已被插入文档中)
  },
  update() {
    // 组件的 VNode 更新时调用(可能发生在其子 VNode 更新之前)
    // 指令的值可能发生了改变，也可能没有
  },
  componentUpdated () {
    // 所在组件的 VNode 及其子 VNode 全部更新后调用
  },
  unbind () {
    // 只调用一次，指令与元素解绑时调用。
  }
})

// 自定义指令实践-元素外部点击
Vue.directive('click-outside', {
  bind(el, binding, vnode) {
    el.event = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        // 点击外部元素触发的事件函数
        if (typeof vnode.context[binding.expression] === 'function') {
          vnode.context[binding.expression](event)
        }
      }
    }
    // 事件代理
    document.body.addEventListener('click', el.event, false)
  },
  unbind(el) {
    document.body.removeEventListener('click', el.event, false)
  }
})
```
### 生命周期
```js
export default {
  beforeCreate() {
    // 初始化实例前，data、methods等不可获取
    console.log('beforeCreate...')
  },
  created () {
    // 实例初始化完成，此时可获取data里数据和methods事件，无法获取 DOM
    console.log('created...')
  },
  beforeMount () {
    // 虚拟 DOM 创建完成，此时未挂载到页面中，vm.$el可获取未挂载模板
    console.log('beforeMount...', this.$el)
  },
  mounted () {
    // 数据绑定完成，真实 DOM 已挂载到页面，vm.$el可获取真实 DOM
    console.log('mounted...', this.$el)

    // mounted 不会承诺所有的子组件也都一起被挂载
    // 如果希望等到整个视图都渲染完毕，可以用 vm.$nextTick
    this.$nextTick(function() {
      // 此处整个视图已渲染完毕
    });
  },
  beforeUpdate () {
    // 数据更新，DOM Diff 得到差异，未更新到页面
    // 适合在更新之前访问现有的 DOM
    console.log('beforeUpdate...')
  },
  updated () {
    // 数据更新，页面也已更新
    // 执行依赖于 DOM 的操作
    console.log('updated...')
  },
  beforeDestroy () {
    // 实例销毁前, 实例仍然完全可用
    console.log('beforeDestroy...')
  },
  destroyed () {
    // 实例销毁完成
    // Vue 实例指示的所有东西都会解绑定，所有的事件监听器会被移除，所有的子实例也会被销毁
    console.log('destroyed...')
  },
}
```

## Vuex
* 基本用法
```js
const store = new Vuex.Store({
  state: {
    age: 18
  },
  getters: { // 对state做处理
    nominaAge(state) {
      return state.age + 1
    }
  },
  mutations: { // 同步函数
    incrementAge(state) {
      state.age++
    },
    incrementAgeByPaylod(state, paylod) {
      state.age += paylod
    }
  },
  actions: { // 异步处理
    incrementAgeAsync(context, paylod) {
      const { commit } = context
      commit('incrementAge')
      setTimeout(() => {
        commit('incrementAgeByPaylod', paylod)
      }, 1000);
    },
    async incrementAgeByStep(context) {
      const { commit, dispatch } = context
      await dispatch('incrementAgeAsync', 3)
      commit('incrementAge')
    }
  }
})
```
* 实现全局弹窗
```js
// Vuex Store
new Vuex.Store({
  modules: {
    dialog: { // 定义为单独的模块
      namespaced: true,
      state: {
        list: []
      },
      mutations: {
        addDialog(state, config) {
          state.list.push(config)
        },
        delDialog(state, index) {
          state.list.splice(index, 1)
        }
      }
    }
  }
})

// App.vue
<template>
  <div id="app">
    <router-view />
    <component
      v-for="(item, index) in list"
      :key="index"
      :is="dialogName"
      :configs="item"
      :index="index"
    />
  </div>
</template>
<script>
import { mapState } from 'vuex'
import Dialog from '@/components/Dialog.vue'
export default {
  name: 'App',
  components: {
    Dialog
  },
  computed: {
    ...mapState('dialog', ['list']),
    dialogName() {
      return Dialog
    }
  }
}
</script>

// components/Dialog.vue
<template>
  <div class="dialog">
    <div class="dialog__bg"></div>
    <div class="dialog__content">
      <div class="dialog__content__header">{{ configs.title }}</div>
      <div class="dialog__content__bottom">
        <div @click="confirm">确定</div>
        <div @click="cancel">取消</div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'dialog-vue',
  props: {
    configs: Object,
    index: Number
  },
  methods: {
    ...mapMutations('dialog', ['delDialog']),
    confirm() {
      if (this.configs.resolve) {
        this.configs.resolve()
        this.delDialog(this.configs.index)
      }
    },
    cancel() {
      if (this.configs.reject) {
        this.configs.reject()
        this.delDialog(this.configs.index)
      }
    }
  }
}
</script>

// 调用方式
function createDialog (configs = {}) {
  return new Promise((resolve, reject) => {
    store.commit('dialog/addDialog', {
      ...configs,
      resolve,
      reject
    })
  })
}

// 调用
createDialog({ title: '测试' })
  .then(() => {
    console.log('确定')
  })
  .catch(() => {
    console.log('取消')
  })
```