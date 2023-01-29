// 1. 新旧子节点同一序号的类型相同
// oldChildren
[
  { type: 'p', children: '1' },
  { type: 'p', children: '1' },
];

// newChildren
[
  { type: 'p', children: '3' },
  { type: 'p', children: '4' },
  { type: 'p', children: '5' },
];

function patchChild(oldVNode, newVNode, contaier) {
  // ...
  if (Array.isArray(newVNode.children)) {
    if (Array.isArray(oldVNode.children)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      // 1. 新旧子节点数相同
      // 复用节点, 更新展示内容
      // for (let i = 0; i < newChildren.length; i++) {
      //   patch(oldChildren[i], newChildren[i], contaier);
      // }
      // 2. 新旧子节点数不相同
      const oldLen = oldChildren.length;
      const newLen = newChildren.length;
      const commonLen = Math.min(oldLen, newLen);
      for (let i = 0; i < commonLen; i++) {
        patch(oldChildren[i], newChildren[i], contaier);
      }
      // 有新子节点需要挂载
      if (newLen > commonLen) {
        for (let i = commonLen; i < newLen; i++) {
          patch(null, newChildren[i], contaier);
        }
        // 有旧子节点需要卸载
      } else if (oldLen > commonLen) {
        for (let i = commonLen; i < oldLen; i++) {
          unmount(oldChildren[i]);
        }
      }
    } else {
      setElementText(contaier, '');
      newVNode.children.forEach((c) => patch(null, c, contaier));
    }
  }
  // ...
}

// 2. 新旧子节点同一序号的类型不相同
// oldChildren
[{ type: 'p' }, { type: 'div' }, { type: 'span' }];

// newChildren
[{ type: 'span' }, { type: 'p' }, { type: 'div' }];

// 如上更新方法, 必须删除旧节点, 再挂载新节点
// 但是这两组子节点只是顺序不同, 通过DOM的移动来完成子节点的更新性能更优

// ？如何确定新的一组子节点第一个节点{ type: 'span' }与旧的一组子节点中第3个子节点相同？？？

// 3. 新增key属性; 只要两个虚拟节点的type属性值和key属性值都相同, 则认为他们是相同的。
// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

// newChildren
[
  { type: 'p', children: '3', key: 3 },
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
];

// 注: DOM可复用并不意味着不需要更新 => 即使key和type相同, 文本内容还是发生了改变。
ol = { type: 'p', children: '1', key: 1 };
ne = { type: 'p', children: '2', key: 1 };

function patchChild(oldVNode, newVNode, contaier) {
  // ...
  if (Array.isArray(newVNode.children)) {
    if (Array.isArray(oldVNode.children)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      for (let i = 0; i < newChildren.length; i++) {
        const newVNode = newChildren[i];
        for (let j = 0; j < oldChildren.length; j++) {
          const oldVNode = oldChildren[j];
          // 具有相同key值的两个节点, 可以复用
          if (newVNode.key === oldVNode.key) {
            patch(oldVNode, newVNode, contaier);
            break;
          }
        }
      }
    } else {
      setElementText(contaier, '');
      newVNode.children.forEach((c) => patch(null, c, contaier));
    }
  }
  // ...
}

// 此时只是更新了DOM元素的内容; 真实DOM的顺序任然保持旧的一组子节点的顺序
