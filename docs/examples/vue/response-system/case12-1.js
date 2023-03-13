// MyDemoComponent 是一个组件, 它的值就是一个选项对象
const MyDemoComponent = {
  name: 'MyDemoComponent',
  data() {
    return { foo: 1 };
  },
};

// 用vnode来描述组件, type属性存储组件的选项对象
const vnode = {
  type: MyDemoComponent,
};

// 区分处理不同的节点类型
function patch(oldVNode, newVNode, contaier, anchor) {
  if (oldVNode && oldVNode.type !== newVNode.type) {
    unmount(oldVNode);
    oldVNode = null;
  }
  const { type } = newVNode;
  if (typeof type === 'string') {
    /* 标签类型 普通元素 */
  } else if (type === Text) {
    /* 文本类型 文本节点 */
  } else if (type === Fragment) {
    /* Fragment类型 片段 */
  } else if (typeof type === 'object') {
    // 作为组件处理 => 渲染器有能力处理组件
    if (!oldVNode) {
      mountComponent(newVNode, contaier, anchor);
    } else {
      patchComponent(oldVNode, newVNode, anchor);
    }
  }
}

function mountComponent(vnode, contaier, anchor) {
  // 通过 vnode 获取组件的选项对象, 即 vnode.type
  const componentOptions = vnode.type;
  // 获取组件的渲染函数
  const { render } = componentOptions;
  // 执行渲染函数, 获取组件要渲染的内容
  const subTree = render();
  // 调用patch函数挂载组件所描述的内容
  patch(null, subTree, contaier, anchor);
}

// 组件的编写
const MyComponent = {
  name: 'MyComponent',
  render() {
    // render函数返回的内容是 MyComponent中的模板经过编译后的内容
    return {
      type: 'div',
      children: '文本内容',
    };
  },
};

// 描述组件的vnode对象
const ComVNode = {
  type: MyComponent,
};
