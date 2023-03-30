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
  } else if (typeof type === 'object' && type.__isTeleport) {
    // 组件选项中有__isTeleport标识符
    // 调用Teleport组件选项中的process函数交出控制权
    type.process(oldVNode, newVNode, contaier, anchor, {
      patch,
      patchChildren,
      unmount,
      move(vnode, contaier, anchor) {
        insert(
          vnode.component
            ? vnode.component.subTree.el // 移动一个组件
            : vnode.el, // 移动普通元素
          contaier,
          anchor
        );
      },
    });
  } else if (typeof type === 'object' || typeof type === 'function') {
    // 状态组件、函数组件
  }
}

// Teleport
const Teleport = {
  __isTeleport: true,
  process(oldVNode, newVNode, contaier, anchor, internals) {
    const { patch } = internals;
    if (!oldVNode) {
      // 挂载
      // 获取容器节点
      const target =
        typeof newVNode.props.to === 'string'
          ? document.querySelector(newVNode.props.to)
          : newVNode.props.to;
      // 将newVNode.children渲染到指定挂载点即可
      newVNode.children.forEach((c) => patch(null, c, target, anchor));
    } else {
      // 更新
      patchChildren(oldVNode, newVNode, contaier);

      // 更新操作 由Teleport组件的to属性变化引起
      if (newVNode.props.to !== oldVNode.props.to) {
        const target =
          typeof newVNode.props.to === 'string'
            ? document.querySelector(newVNode.props.to)
            : newVNode.props.to;
        // 移动到新的容器
        newVNode.children.forEach((c) => move(c, target));
      }
    }
  },
};
