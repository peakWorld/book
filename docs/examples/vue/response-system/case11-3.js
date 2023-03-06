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
      const seq = list(source); // [0, 1]
      // s 最长递增子序列的最后一个元素
      let s = seq.length - 1;
      // i 新的一组子节点(排除预处理节点后的新子节点组)中最后一个节点
      let i = count - 1;
      // 从后往前处理新的一组子节点
      // 此时i后续的节点已正确排序, 以i+1节点为锚点
      for (i; i >= 0; i--) {
        if (source[i] === -1) {
          // 说明索引为i的节点是全新的节点, 将其挂载
          // pos 表示节点在newChildren中的真实索引位置; i是重新编号后的索引
          const pos = i + newStart;
          const newVNode = newChildren[pos];
          const nextPos = pos + 1;
          const anchor =
            nextPos < newChildren.length ? newChildren[nextPos] : null;
          patch(null, newVNode, contaier, anchor);
        } else if (i !== seq[s]) {
          // 如果节点的索引i不等于seq[s]的值, 说明该节点需要移动
          const pos = i + newStart;
          const newVNode = newChildren[pos];
          const nextPos = pos + 1;
          const anchor =
            nextPos < newChildren.length ? newChildren[nextPos].el : null;
          insert(newVNode.el, contaier, anchor);
        } else {
          // 当i等于seq[s]时, 说明该位置的节点不需要移动; 只需要让s指向下一个位置
          s--;
        }
      }
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
// source的值为[2, 3, 1, -1], 那么最长递增子序列seq是索引值[0, 1] => [2, 3]
// => seq含义: 在新的一组子节点中(排除经过预处理的节点), 重新编号后索引值为0和1的这两个节点在更新前后顺序没有发生变化, 即不需要移动。

// 重新编号让子序列seq与新索引值产生对应关系

// 移动 新建索引 i 和 s
// 索引i指向 新的一组子节点中最后一个节点
// 索引s指向 最长递增子序列的最后一个元素

// p-7 source的值为-1, p-7作为全新的节点进行挂载; i 前移一位
// p-2 source的值为1, 不为-1且不等于seq[s], 此时s = 1, 该节点需要移动; i 前移一位
// p-4 source的值为3, 等于seq[s], 则s-1, 此时s = 0; i 前移一位
// p-3 source的值为2, 等于seq[0]
// 更新完成

// 递增子序列求法
