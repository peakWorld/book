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
    // oldChildren 和 newChildren 都未处理完
    // 构造source数组, 填充-1
    const count = newEnd - j + 1;
    const source = new Array(count).fill(-1);

    // 填充source数组, 节点在oldChildren中的索引
    const oldStart = j;
    const newStart = j;
    // 节点移动
    let moved = false;
    let pos = 0;

    // A1 双重嵌套循环
    // 遍历oldChildren中未处理的节点
    // for (let i = oldStart; i <= oldEnd; i++) {
    //   const oldVNode = oldChildren[i];
    //   // 遍历newChildren中未处理的节点
    //   for (let k = newStart; k <= newEnd; k++) {
    //     const newVNode = newChildren[k];
    //     if (oldVNode.key === newVNode.key) {
    //       patch(oldVNode, newVNode, contaier);
    //       // newStart 不一定从0开始
    //       source[k - newStart] = i;
    //     }
    //   }
    // }

    // A2性能优化
    // 构建索引
    const keyIndex = {};
    for (let i = newStart; i <= newEnd; i++) {
      // 在newChildren中key对应的索引
      keyIndex[newChildren[i].key] = i;
    }
    // 更新过的节点
    let patched = 0;
    for (let i = oldStart; i <= oldEnd; i++) {
      oldVNode = oldChildren[i];
      // newChildren中待更新节点数为count; 更新过的节点数patched小于count才执行下面逻辑
      if (patched <= count) {
        // 通过索引表快速找到新的一组子节点中具有相同key值的节点位置
        const k = keyIndex[oldVNode.key];
        // newChildren中存在该节点
        if (typeof k !== 'undefined') {
          newVNode = newChildren[k];
          patch(oldVNode, newVNode, contaier);
          patched++;
          source[k - newStart] = i;

          // 判断节点是否需要移动
          // 比如oldChildren中p-2节点新索引3,  后一个节点p-3的新索引1,  此时p-2在p-3前;
          // 而在newChildren中, 1 < 3 那么p-3在p-2前面; 所以p-3需要移动
          if (pos < k) {
            moved = true;
          } else {
            pos = k;
          }
        } else {
          unmount(oldVNode);
        }
      } else {
        // 更新数超出count, 直接卸载
        unmount(oldVNode);
      }
    }
  }
}

// oldChildren
[
  { type: 'p', children: '1', key: 1 }, // 0
  { type: 'p', children: '2', key: 2 }, // 1
  { type: 'p', children: '3', key: 3 }, // 2
  { type: 'p', children: '4', key: 4 }, // 3
  { type: 'p', children: '6', key: 6 }, // 4
  { type: 'p', children: '5', key: 5 }, // 5
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

// 经过预处理后,oldChildren和newChildren都有部分节点未处理; 不满足前面两个处理条件。
// 处理思路
// 构造一个数组source, 长度等于newChildren经过预处理后剩余未处理节点的数量, 且初始值都是-1;
// source数组用来存储newChildren中的节点在oldChildren中的位置索引, 后面将会使用它计算出一个最长递增子序列, 并用于辅助完成DOM移动的操作。
// source的值为[2, 3, 1, -1]
// => p-3节点在oldChildren的索引为2
// => p-7节点是新增节点, 索引为-1
