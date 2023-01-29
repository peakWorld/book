function patchChild(oldVNode, newVNode, contaier) {
  // ...
  if (Array.isArray(newVNode.children)) {
    if (Array.isArray(oldVNode.children)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      // 缓存遇到的最大索引值
      let lastIndex = 0;
      for (let i = 0; i < newChildren.length; i++) {
        const newVNode = newChildren[i];
        for (let j = 0; j < oldChildren.length; j++) {
          const oldVNode = oldChildren[j];
          // 具有相同key值的两个节点, 可以复用
          if (newVNode.key === oldVNode.key) {
            // 此处中会调用patchElement, 实现DOM元素的复用
            // 新旧节点都将持有对真实DOM的引用
            patch(oldVNode, newVNode, contaier);
            if (j < lastIndex) {
              // newVNode节点对应的真实DOM需要移动;
              // 获取newVNode的前一个vnode, 即preVNode; 该节点已做过处理, 处于正确位置
              const preVNode = newChildren[i - 1];
              // 如果preVNode不存在, 则newVNode是第一个节点, 不需要移动
              if (!preVNode) {
                // 将newVNode对应的真实DOM移动到preVNode所对应真实DOM后面
                // 获取preVNode对应真实DOM的下一个兄弟节点, 并作为锚点
                const anchor = preVNode.el.nextSibling;
                insert(newVNode.el, contaier, anchor);
              }
            } else {
              lastIndex = j;
            }
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
  { type: 'p', children: 'text 3', key: 3 }, // 可复用节点 1
];

// 2. 非递增序列
// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

// newChildren
[
  { type: 'p', children: 'text 3', key: 3 }, // 可复用节点在旧子节点中索引 2
  { type: 'p', children: 'text 1', key: 1 }, // 可复用节点 0
  { type: 'p', children: 'text 2', key: 2 }, // 可复用节点 1
];

// 1. newChildren中第一个节点p-3存在可复用节点在oldChildren中的索引为2.
// 2. newChildren中第二个节点p-1存在可复用节点在oldChildren中的索引为0.
// => 2.1 节点p-1在oldChildren中排在节点p-3前，但在newChildren中,它排在节点p-3后面
// => 2.2 节点p-1对应的真实DOM需要移动
// => 2.3 把节点p-1所对应的真实DOM移动到节点p-3所对应的真实DOM后面。
// 3. newChildren中第二个节点p-2存在可复用节点在oldChildren中的索引为1.
// => 3.1 节点p-2在oldChildren中排在节点p-3前，但在newChildren中,它排在节点p-3后面
// => 3.2 节点p-2对应的真实DOM需要移动
// => 3.3 把节点p-2所对应的真实DOM移动到节点p-1所对应的真实DOM后面。
