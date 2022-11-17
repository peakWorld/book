const ts = {
  x: 1,
  get name() {
    console.log('name', this);
  },
};
const pt = new Proxy(ts, {
  get(target, key) {
    return Reflect.get(target, key);
  },
});
const pt2 = new Proxy(ts, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver); // 比pt的实现多了参数receiver;receiver就是代理对象
  },
});
pt.name; // this 指向原始数据 ts
pt2.name; // this 指向代理对象 pt2

const s = new Set([1, 2, 3]);

// 1. Set元素差异
// 在Set对象中, size是属性, 一个访问器属性
// 在Set对象中, delete是一个方法
const p1 = new Proxy(s, {
  get(target, key) {
    console.log('key', key, typeof target[key], target[key]);
  },
});
p1.size; // key size number 3
p1.delete(1); // key delete function ƒ delete() { [native code] }

// 2. 调用报错
const p2 = new Proxy(s, {
  get(target, key, receiver) {
    return Reflect.get(target, key, receiver);
  },
});
// console.log(p2.size); // Method get Set.prototype.size called on incompatible receiver
// p2.delete(1); // Method Set.prototype.delete called on incompatible receiver

// p2.size / p2.delete()
// size是访问器属性(函数)、delete是方法(函数);
// 此处this都绑定到receiver对象, 而ecma规范中要check this中是否存在内部插槽[[setData]]
// 而这个插槽只在原始对象(Set)中有, 代理对象p2不存在该插槽; 所以报错

// 3. 修正方法
// 访问p3.size时，访问器属性的getter函数会立即执行。
// 访问p3.delete时,delete方法并没有执行(返回一个绑定了this指向的函数), 执行语句`p.delete()`才会真正调用函数。
// 在代理中修改默认逻辑
const p3 = new Proxy(s, {
  get(target, key, receiver) {
    if (key === 'size') {
      return Reflect.get(target, key, target); // 将size访问器getter函数this绑定到target原始数据, targe存在内部插槽[[setData]]
    }
    return target[key].bind(target); // 将delete函数this绑定到target原始数据, targe存在内部插槽[[setData]]
  },
});
