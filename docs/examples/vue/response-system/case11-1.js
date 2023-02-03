function patchKeyedChildren(oldVNode, newVNode, contaier) {
  const newChildren = newVNode.children;
  const oldChildren = oldVNode.children;
  // 处理相同的前置节点, 索引j指向新旧两组子节点的开头
  let j = 0;
  let oldVNode = oldChildren[j];
  let newVNode = newChildren[j];
  // while 循环向后遍历, 直到拥有不同key值的节点为止
  while (oldVNode.key === newVNode.key) {
    patch(oldVNode, newVNode, contaier); // patch更新
    j++;
    oldVNode = oldChildren[j];
    newVNode = newChildren[j];
  }

  // 更新相同的后置节点
  let oldEnd = oldChildren.length - 1;
  let newEnd = newChildren.length - 1;
  oldVNode = oldChildren[oldEnd];
  newVNode = newChildren[newEnd];
  // while 循环从后向前遍历, 直到拥有不同key值的节点为止
  while (oldVNode.key === newVNode.key) {
    patch(oldVNode, newVNode, contaier); // patch更新
    oldEnd--;
    newEnd--;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
  }

  if (j > oldEnd && j <= newEnd) {
    const anchorIndex = newEnd + 1;
    // 如果newEnd是newChildren中最后一个节点, 那么不需要节点。
    const anchor =
      anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
    // j --> newEnd 之间的节点应该挂载
    while (j <= newEnd) {
      patch(null, newChildren[j++], contaier, anchor);
    }
  } else if (j > newEnd && j <= oldEnd) {
    // j --> oldEnd 之间的节点应该卸载
    while (j <= oldEnd) {
      unmount(oldChildren[j++]);
    }
  }
}

// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];
// newChildren
[
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 3', key: 3 },
  { type: 'p', children: 'text 2', key: 2 },
];

// 具有相同的前置节点p-1, 以及相同的后置节点p-2和p-3; 相同的前后置节点, 在oldChildren和newChildren中的相对位置不变

// 经过两个循环处理相同的前后置节点后, oldChildren已处理完毕, newChildren的p-4未被处理。
// 满足条件以下两个条件 新增
// 条件一 oldEnd < j 成立: 在预处理过程中, oldChildren都处理完毕了。
// 条件二 newEnd >= j 成立: 在预处理过程中, newChildren有未被处理的节点。

// 以newChildren的顺序为准, 来挂载新节点;
// 此时以newEnd指向相同后置节点的前一个节点, 应该满足循环条件的节点为 锚点, 即newEnd+1的节点

// 满足条件以下两个条件 卸载
// 条件一 newEnd < j 成立: 在预处理过程中, newChildren都处理完毕了。
// 条件二 oldEnd >= j 成立: 在预处理过程中, oldChildren有未被处理的节点。
