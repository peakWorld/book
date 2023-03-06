# 开发
* 通过Vue.prototype添加属性和方法
```ts
Vue.prototype.$isMobile = isMobile();

const $dialog = payload => store.dispatch('dialog', payload);
Vue.prototype.$dialog = $dialog;
```