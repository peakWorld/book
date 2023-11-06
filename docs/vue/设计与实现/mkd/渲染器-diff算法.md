

[[toc]]
# Diff 算法
比较新旧两组子节点, 以最小的性能开销完成更新操作。旧的一组子节点是当前DOM元素的结构, 新的一组子节点是完成更新后DOM元素的结构。

## 1. 简单Diff算法
### 1.1 节点类型相同

``` 
// oldChildren
[{ type: 'p', children: '1' },{ type: 'p', children: '1' },];
// newChildren
[{ type: 'p', children: '3' },{ type: 'p', children: '4' },{ type: 'p', children: '5' },];
```
新旧两组子节点的类型都是一样的, 只是每组子节点的数量不一致。

``` 
function patchChild(oldVNode, newVNode, contaier) {
  // ...
  if (Array.isArray(newVNode.children)) {
    if (Array.isArray(oldVNode.children)) {
      const oldChildren = oldVNode.children;
      const newChildren = newVNode.children;
      const oldLen = oldChildren.length;
      const newLen = newChildren.length;
      const commonLen = Math.min(oldLen, newLen);
	  // 更新子节点
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
```
### 1.2 节点类型不同

``` 
// oldChildren
[{ type: 'p' }, { type: 'div' }, { type: 'span' }];
// newChildren
[{ type: 'span' }, { type: 'p' }, { type: 'div' }];
```
如果按上述方法进行Diff比较, 每进行一轮比较都要卸载旧节点、挂载新节点(patch方法中的实现逻辑); 但实际上新旧两组子节点只是顺序不同, 能通过DOM的移动来完成子节点的更新, 这样性能更优。

如何确定newChildren中的第一个节点和oldChildren中的最后一个节点是相同的尼？新增key属性。

使用相同类型的两组节点, 方便理解。

``` 
[ // oldChildren
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

[ // newChildren
  { type: 'p', children: '3', key: 3 },
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: 'text 2', key: 2 },
];
```
此处新旧两组节点都添加了key属性。
注: key值相同复用了节点, 为啥还要用patch函数来更新节点。可以观察p-2节点, 节点虽然复用了但其展示内容发生了变化。

``` 
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
          if (newVNode.key === oldVNode.key) { // 具有相同key值的两个节点, 可以复用
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
}
```
此时只是只完成了对DOM元素的更新, 真实的DOM顺序依然保持oldChildren的顺序。

### 1.3 移动元素
![]('./xrdf_1.jpeg')

上图完整展示了两组节点的更新过程。
- p-3是newChildren中的第一个节点, 在oldChildren中是最后一个节点
- 在newChildren中p-1在p-3之后, 但在oldChildren中p-1在p-3前; 以newChildren的顺序为标准, 需要将p-1对应的Dom元素移动到p-3对应的Dom元素之后。
- 在newChildren中p-2也在p-3之后, 但在oldChildren中p-2在p-3前; 将p-2对应的Dom元素移动到p-3对应的Dom元素之后, 但完成上一步后p-1已在p-3之后, 移动p-2到p-1后面。

注: 回顾下DOM API [insertBefore](https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore)

``` 
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
		let find = false; // oldChildren中是否存在key值相同的复用节点
        for (let j = 0; j < oldChildren.length; j++) {
          const oldVNode = oldChildren[j];
          if (newVNode.key === oldVNode.key) {
			find = true;
            patch(oldVNode, newVNode, contaier);
            if (j < lastIndex) {
              // newVNode节点对应的真实DOM需要移动;
              // 获取newVNode的前一个vnode, 即preVNode; 该节点已做过处理, 处于正确位置
              // 如果preVNode不存在, 则newVNode是第一个节点, 不需要移动
              const preVNode = newChildren[i - 1];
              if (preVNode) {
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
    }
  }
  // ...
}
```
在循环过程中寻找可复用节点(具有相同key), 缓存遇到的最大索引值lastIndex(该索引是 可复用节点在oldChildren中的位置); 后续循环中如果存在索引小于lastIndex的节点, 则表示该节点需要移动。

### 1.4 添加新元素、移除遗留的元素
在多数情况下oldChildren和newChildren节点数不相同; 如果newChildren节点数多, 要添加新元素, 如果oldChildren节点多, 要移除遗留元素。

``` 
function patchChild(oldVNode, newVNode, contaier) {
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
              if (preVNode) {
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
    }
  }
}
```

## 2. 双端Diff算法
简单Diff算法对DOM的移动并不是最优的。

``` 
[ // oldChildren
  { type: 'p', children: '1', key: 1 },
  { type: 'p', children: '2', key: 2 },
  { type: 'p', children: '3', key: 3 },
];

[// newChildren
  { type: 'p', children: 'text 3', key: 3 },
  { type: 'p', children: 'text 1', key: 1 },
  { type: 'p', children: 'text 2', key: 2 },
];
```
如上节点, 使用diff算法, 需要将节点p-1、p-2移动到p-3之后, 要移动两次DOM;  其实只要将p-3移动到p-1前也满足要求, 且只移动了一次。

双端diff算法是一种同时对新旧两组子节点的两个端点进行比较的算法。

### 2.1 理想的处理方式
![]('./xrdf_2.jpeg')

比较分为四步
- 第一步: oldChildren中oldStartIdx指向节点p-1与newChildren的newStartIdx指向节点p-4比较; key不同不可复用, 不做处理。
- 第二步: oldChildren的oldEndIdx指向节点p-4与newChildren的newEndIdx指向节点p-3比较; key不同不可复用, 不做处理。
- 第三步: oldChildren的oldStartIdx指向节点p-1与newChildren的newEndIdx指向节点p-3比较; key不同不可复用, 不做处理。
- 第四步: oldChildren的oldEndIdx指向节点p-4与newChildren的newStartIdx指向节点p-4比较; key值相同, 复用DOM。

满足第四步 
- 节点p-4在oldChildren是最后一个节点, 但在newChildren变为第一个节点; 需要将p-4的真实Dom移动到p-1的真实Dom前，即将oldEndIdx指向的虚拟节点所对应的真实DOM移动到索引oldStartIdx指向的虚拟节点所对应的真实DOM前面。
- newStartIdx++ / oldEndIdx--

满足第二步
- 都位于最后位置; 无需移动
-  oldEndIdx-- / newEndIdx--

满足第三步
![]('./xrdf_3.jpeg')
- 节点p-1在oldChildren是第一个节点, 但在newChildren变为最后一个节点; 需要将p-1的真实Dom移动到p-2的真实Dom后，即将oldStartIdx指向的虚拟节点所对应的真实DOM移动到索引oldEndIdx指向的虚拟节点所对应的真实DOM后面。
- oldStartIdx++ / newEndIdx--

满足第一步 
- 都位于开始位置; 无需移动
- oldStartIdx++/newStartIdx++

比较结束
![]('./xrdf_4.jpeg')

``` 
  function patchKeyedChildren(oldVNode, newVNode, contaier) {
    const oldChildren = oldVNode.children;
    const newChildren = newVNode.children;

    // 四个索引
    let oldStartIdx = 0;
    let oldEndIdx = oldChildren.length - 1;
    let newStartIdx = 0;
    let newEndIdx = newChildren.length - 1;

    // 四个索引指向的vnode节点
    let oldStartVNode = oldChildren[oldStartIdx];
    let oldEndVNode = oldChildren[oldEndIdx];
    let newStartVNode = newChildren[newStartIdx];
    let newEndVNode = newChildren[newEndIdx];

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (oldStartVNode.key === newStartVNode.key) {
        // 第一步 第一个节点比较
        // 节点在新的顺序任然处于首位, 不需要移动
        patch(oldEndVNode, newEndVNode, contaier);
        // 更新索引
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[++newStartIdx];
      } else if (oldEndVNode.key === newEndVNode.key) {
        // 第二步 最后一个节点比较
        // 节点在新的顺序任然处于尾部, 不需要移动
        patch(oldEndVNode, newEndVNode, contaier);
        // 更新索引
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldStartVNode.key === newEndVNode.key) {
        // 第三步 旧一 和 新最后比较
        patch(oldStartVNode, newEndVNode, contaier);
        // 移动DOM操作 oldStartVNode.el移动到oldEndVNode.el后面去
        insert(oldStartVNode.el, contaier, oldEndVNode.el.nextSibling);
        // 更新索引
        oldEndVNode = oldChildren[++oldStartIdx];
        newStartVNode = newChildren[--newEndIdx];
      } else if (oldEndVNode.key === newStartVNode.key) {
        // 第四步 旧最后 和 新一比较
        // 打补丁
        patch(oldEndVNode, newStartVNode, contaier);
        // 移动DOM操作 oldEndVNode.el移动到oldStartVNode.el前面去
        insert(oldEndVNode.el, contaier, oldStartVNode.el);
        // 更新索引
        oldEndVNode = oldChildren[--oldEndIdx];
        newStartVNode = newChildren[++newStartIdx];
      }
    }
  }
```

在理想状态中, 这四个步骤在每次循环中都有命中。

### 2.2 非理想的处理方式
![]('./xrdf_5.jpeg')
如图, 在一轮比较执行四个步骤后, 没有找到可复用节点; 此时两个头部和两个尾部的四个节点都不可复用, 寻找非头部、尾部的节点是否可复用。

用newChildren的newStartIdx节点在oldChildren中寻找, 存在就将该节点对应的Dom移动到头部; 同时将oldChildren中该节点置为undefined, 表示已经被操作了。
![]('./xrdf_6.jpeg')
``` 
  function patchKeyedChildren(oldVNode, newVNode, contaier) {
	// ...
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      // 如果四个步骤都没有命中, 会执行兜底逻辑; 此时oldChildren已处理的节点会设置为undefined
      // 需要加两个判断, 头尾部节点为undefined, 只做索引处理
      if (!oldStartVNode) {
        oldStartVNode = oldChildren[++oldStartIdx];
      } else if (!oldEndVNode) {
        oldEndVNode = oldChildren[--oldEndIdx];
      } else if (oldStartVNode.key === newStartVNode.key) { // 第一步 第一个节点比较
      } else if (oldEndVNode.key === newEndVNode.key) { // 第二步 最后一个节点比较
      } else if (oldStartVNode.key === newEndVNode.key) { // 第三步 旧一 和 新最后比较
      } else if (oldEndVNode.key === newStartVNode.key) { // 第四步 旧最后 和 新一比较
      } else {
        // 兜底 四个步骤都没有命中
        // 在oldChildren中寻找与newStartVNode拥有相同key值的节点
        // idInOld是newStartVNode在oldChildren中的索引
        const idInOld = oldChildren.findIndex(
          (node) => node.key === newStartVNode.key
        );

        // 存在可复用节点, 将真实DOM移动到头部
        if (idInOld > 0) {
          const vnodeToMove = oldChildren[idInOld];
          patch(vnodeToMove, newStartVNode, contaier);
          insert(vnodeToMove.el, contaier, newStartVNode.el);
          // 由于idInOld节点对应的真实DOM已经移动, 将其设置为undefined
          oldChildren[idInOld] = undefined;
		  newStartVNode = newChildren[++newStartIdx];
        }
      }
    }
  }
```

### 2.3 添加新元素
![]('./xrdf_8.jpeg')
不符合四个步骤的条件, 进入了兜底逻辑; 但是p-4在oldChildren中没有相同的key不可复用, 将视为新节点。

``` 
function patchKeyedChildren(oldVNode, newVNode, contaier) {
	// ...
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      // 四个步骤 
	  {
        const idInOld = oldChildren.findIndex(
          (node) => node.key === newStartVNode.key
        );
        if (idInOld > 0) {
          const vnodeToMove = oldChildren[idInOld];
          patch(vnodeToMove, newStartVNode, contaier);
          insert(vnodeToMove.el, contaier, newStartVNode.el);
          oldChildren[idInOld] = undefined;
        } else {
          // 将newStartVNode作为新节点挂载到头部
          patch(null, newStartVNode, contaier, oldStartVNode.el);
        }
		newStartVNode = newChildren[++newStartIdx];
      }
    }
  }
```

![]('./xrdf_7.jpegxrdf)
每一轮都满足了四个步骤中的第二步, 没有进入兜底逻辑, 最后只有p-4节点剩余, 而此时oldChildren已处理完, newChildren还有未处理节点。

``` 
function patchKeyedChildren(oldVNode, newVNode, contaier) {
	// 循环处理四个步骤及兜底逻辑
    // 新增-无待删除(未走兜底逻辑)
    // 此时除了新增节点, 其他节点对应的DOM排序已经正确了;newChildren此时的尾节点其实是真是DOM结构的首节点
    if (oldEndIdx < oldStartIdx && newStartIdx <= newEndIdx) {
      for (let i = newStartIdx; i <= newEndIdx; i++) {
        const anchor = newChildren[newEndIdx + 1]
          ? newChildren[newEndIdx + 1].el
          : null;
        patch(null, newChildren[i], contaier, anchor);
      }
    }
  }
```

### 2.4 移除遗留的元素
![]('./xrdf_9.jpeg')
经过循环逻辑处理后, newChildren已处理完成, 而oldChildren还有遗留的节点。
``` 
function patchKeyedChildren(oldVNode, newVNode, contaier) {
	// 循环处理四个步骤及兜底逻辑
    // 新增-无待删除(未走兜底逻辑)
    // 删除-无待新增
    if (newEndIdx < newStartIdx && oldStartIdx <= oldEndIdx) {
      for (let i = oldStartIdx; i <= oldEndIdx; i++) {
        unmount(oldChildren[i]);
      }
    }
  }
```

## 3. 快速Diff算法
### 3.1 前置元素和后置元素
借鉴文本Diff的预处理思路, 先处理新旧两组子节点中相同的前后置节点。

``` 
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
}
```
新旧两组子节点的前后置节点已处理完成, 且其中某一组子节点被处理完毕。

![]('./xrdf_10.jpeg')
如图, 旧节点处理完, 新节点还有p-4未处理。

``` 
functiofunction patchKeyedChildren(oldVNode, newVNode, contaier) {
  // 前后置节点处理
  if (j > oldEnd && j <= newEnd) {
    const anchorIndex = newEnd + 1;
    // 如果newEnd是newChildren中最后一个节点, 那么不需要节点。
    const anchor =
      anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
    // j --> newEnd 之间的节点应该挂载
    while (j <= newEnd) {
      patch(null, newChildren[j++], contaier, anchor);
    }
  }
}
```
![]('./xrdf_11.jpeg)
如图,  新节点处理完毕,  旧节点还有p-2未处理。

``` 
functiofunction patchKeyedChildren(oldVNode, newVNode, contaier) {
  // 前后置节点处理
  if (j > oldEnd && j <= newEnd) {
  } else if (j > newEnd && j <= oldEnd) {
    // j --> oldEnd 之间的节点应该卸载
    while (j <= oldEnd) {
      unmount(oldChildren[j++]);
    }
  }
}
```

### 3.2 节点是否需要移动
在多数情况下, 处理完前后置节点, 新旧两组子节点都有剩余节点。无法通过简单地挂载新节点或卸载已经不存在的节点来完成更新, 则需要根据节点的索引关系构造一个最长递增子序列(最长递增子序列所指向的节点即为不需要移动的节点)。

![]('./xrdf_12.jpeg')

构建一个数组source, 长度等于newChildren经过预处理后剩余的节点数, 且初始值都是-1；source数组用来存储newChildren中的节点在oldChildren中的位置索引(用于计算一个最长递增子序列, 辅助完成DOM移动操作)

``` 
functiofunction patchKeyedChildren(oldVNode, newVNode, contaier) {
  if (j > oldEnd && j <= newEnd) {
  } else if (j > newEnd && j <= oldEnd) {
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
```

### 3.3 移动元素
在确定有元素需要移动后, 根据source来算出最长子序列seq; seq中的值是souce数组中的索引值。
![]('./xrdf_14.jpeg')

重新编号, 让子序列seq与新索引产生对应关系。
同时新建两个索引: 索引i指向 新的一组子节点中最后一个节点, 索引s指向 最长递增子序列的最后一个元素。

经过预处理的节点, 它对应的DOM已按正确顺序移动了, 可以让他们为锚点来操作未处理的节点。

``` 
functiofunction patchKeyedChildren(oldVNode, newVNode, contaier) {
  	 // ...
    // moved为真, 则需要进行DOM移动
    if (moved) {
      // 计算最长递增子序列 TODO
      const seq = list(source); // [0, 1]
      // s 最长递增子序列的最后一个元素
      let s = seq.length - 1;
      // i 新的一组子节点(排除预处理节点后的新子节点组)中最后一个节点
      let i = count - 1;
      // 从后往前处理新的一组子节点
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
          // 此时i后续的节点已正确排序, 以i+1的节点为锚点
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
```