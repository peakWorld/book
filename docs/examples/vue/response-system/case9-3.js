function patchChild(oldVNode, newVNode, contaier) {
  // ...
  if (Array.isArray(newVNode.children)) {
    if (Array.isArray(oldVNode.children)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      let lastIndex = 0;
      for (let i = 0; i < newChildren.length; i++) {
        const newVNode = newChildren[i];
        let find = false; // 旧的一组子节点中是否存在可复用组件
        for (let j = 0; j < oldChildren.length; j++) {
          const oldVNode = oldChildren[j];
          if (newVNode.key === oldVNode.key) {
            // 一旦找到可复用的节点, 则将变量find的值设为true
            find = true;
            patch(oldVNode, newVNode, contaier);
            if (j < lastIndex) {
              const preVNode = newChildren[i - 1];
              if (!preVNode) {
                const anchor = preVNode.el.nextSibling;
                insert(newVNode.el, contaier, anchor);
              }
            } else {
              lastIndex = j;
            }
            break;
          }
        }

        // newVNode是新增节点、需要挂载; 没有可复用组建
        if (!find) {
          const preVNode = newChildren[i - 1];
          let anchor = null; // 获取锚点元素
          if (preVNode) {
            anchor = preVNode.el.nextSibling; // 前一个vnode节点的下一个兄弟元素
          } else {
            anchor = contaier.firstChild; // 容器的首元素
          }
          patch(null, newVNode, contaier, anchor); // 新元素不需要做比较, 直接挂载就行
        }
      }

      // newChildren完成更新后; 遍历旧的一组子节点, 删除遗留的节点
      for (let i = 0; i < oldChildren.length; i++) {
        const oldVNode = oldChildren[i];
        const has = newChildren.find((v) => v.key === oldVNode.key);
        if (!has) {
          // 在newChildren中没有相同key值的节点, 需要删除该节点
          unmount(oldVNode);
        }
      }
    } else {
      setElementText(contaier, '');
      newVNode.children.forEach((c) => patch(null, c, contaier));
    }
  }
  // ...
}

function patch(oldVNode, newVNode, contaier, anchor) {
  // ...
  // 挂载时传入锚点元素
  mountElement(newVNode, contaier, anchor);
  // ...
}

function mountElement(vnode, contaier, anchor) {
  const el = (vnode.el = createElement(vnode.type));
  // ...
  insert(el, contaier, anchor);
}

// 1. 递增序列, 不需要移动任何节点
// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

// newChildren
[
  { type: 'p', children: 'text 1', key: 1 }, // 可复用节点在旧子节点中索引 0
  { type: 'p', children: 'text 2', key: 2 }, // 可复用节点 1
  { type: 'p', children: 'text 4', key: 4 }, // 没有可复用节点
  { type: 'p', children: 'text 3', key: 3 }, // 可复用节点 2
];
