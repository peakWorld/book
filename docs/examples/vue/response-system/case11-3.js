function patchKeyedChildren(oldVNode, newVNode, contaier) {
  const newChildren = newVNode.children;
  const oldChildren = oldVNode.children;
  // 处理相同的前置节点, 索引j指向新旧两组子节点的开头
  let j = 0;
  let oldVNode = oldChildren[j];
  let newVNode = newChildren[j];
  while (oldVNode.key === newVNode.key) {
    patch(oldVNode, newVNode, contaier);
    j++;
    oldVNode = oldChildren[j];
    newVNode = newChildren[j];
  }

  // 更新相同的后置节点
  let oldEnd = oldChildren.length - 1;
  let newEnd = newChildren.length - 1;
  oldVNode = oldChildren[oldEnd];
  newVNode = newChildren[newEnd];
  while (oldVNode.key === newVNode.key) {
    patch(oldVNode, newVNode, contaier);
    oldEnd--;
    newEnd--;
    oldVNode = oldChildren[oldEnd];
    newVNode = newChildren[newEnd];
  }

  if (j > oldEnd && j <= newEnd) {
    // j > oldEnd 表示oldChildren已处理完
    const anchorIndex = newEnd + 1;
    const anchor =
      anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
    while (j <= newEnd) {
      patch(null, newChildren[j++], contaier, anchor);
    }
  } else if (j > newEnd && j <= oldEnd) {
    // j > newEnd 表示newChildren已处理完
    while (j <= oldEnd) {
      unmount(oldChildren[j++]);
    }
  } else {
    const count = newEnd - j + 1;
    const source = new Array(count).fill(-1);
    const oldStart = j;
    const newStart = j;
    let moved = false;
    let pos = 0;
    const keyIndex = {};
    for (let i = newStart; i <= newEnd; i++) {
      keyIndex[newChildren[i].key] = i;
    }
    let patched = 0;
    for (let i = oldStart; i <= oldEnd; i++) {
      oldVNode = oldChildren[i];
      if (patched <= count) {
        const k = keyIndex[oldVNode.key];
        if (typeof k !== 'undefined') {
          newVNode = newChildren[k];
          patch(oldVNode, newVNode, contaier);
          patched++;
          source[k - newStart] = i;
          if (pos < k) {
            moved = true;
          } else {
            pos = k;
          }
        } else {
          unmount(oldVNode);
        }
      } else {
        unmount(oldVNode);
      }
    }

    // moved为真, 则需要进行DOM移动
    if (moved) {
      // 计算最长递增子序列 TODO
      const seq = list(source);
    }
  }
}

// oldChildren
[
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
  { type: 'p', children: '4', key: 4 },
  { type: 'p', children: '6', key: 6 },
  { type: 'p', children: '5', key: 5 },
];
// newChildren
[
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 3', key: 3 },
  { type: 'p', children: 'text 4', key: 4 },
  { type: 'p', children: 'text 2', key: 2 },
  { type: 'p', children: 'text 7', key: 7 },
  { type: 'p', children: 'text 5', key: 5 },
];

// 经过预处理后,oldChildren和newChildren都有部分节点未处理
