// 循环遍历-先序
function preTra(root) {
  const res = []
  const stack = []
  while (stack.length || root) {
    while (root) {
      stack.push(root)
      res.push(root.val)
      root = root.left
    }
    root = stack.pop()
    root = root.right
  }
  return res
}

// 循环遍历-中序
function midTra(root) {
  const res = []
  const stack = []
  while (stack.length || root) {
    while (root) {
      stack.push(root)
      root = root.left
    }
    root = stack.pop()
    res.push(root.val)
    root = root.right
  }
  return res
}

// 循环遍历-后序
function preTra(root) {
  const res = []
  const stack = []
  let pre
  while (stack.length || root) {
    while (root) {
      stack.push(root)
      root = root.left
    }
    root = stack.pop()
    if (!root.right || root.right === pre) { // 无右子树 或 已访问右子树
      res.push(root.val)
      pre = root
      root = null
    } else {
      stack.push(root)
      root = root.right
    }
  }
  return res
}

// 判断相同的树
function isSameTree (p, q) {
  if (!p && !q) return true
  if (!p || !q || p.val !== q.val) return false
  return isSameTree(p.left, q.left) && isSameTree(p.right, q.right)
}

// 对称二叉树
function isSym (root) {
  // 1. 左右子树是两颗树, 判断两颗树对称(参考判断相同的树)
  // 2. 栈
  const stack = [root.left, root.right]
  while (stack.length) {
    const left = stack.shift()
    const right = stack.shift()
    if (!left && !right) continue;
    if (!left || !right || left.val !== right.val) return false
    stack.push(left.left)
    stack.push(right.right)
    stack.push(left.right)
    stack.push(right.left)
  }
  return true
}

// 最大深度
function maxDep (root) {
  // if (!root) return 0
  // return Math.max(maxDep(root.left), maxDep(root.right)) + 1

  // 广度优先
  if (!root) return 0
  const stack = [root]
  let dep = 0
  while (stack.length) {
    let i = stack.length - 1
    while (i >= 0) {
      const node = stack.shift()
      if (node.left) stack.push(node.left)
      if (node.right) stack.push(node.right)
      i--
    }
    dep++
  }
  return dep
}

// 将有序数组转换为二叉搜索树
function arrToBST (nums) {
  function helper (left, right) {
    if (left > right) return null
    const mid = (left + right) >> 1
    const node = new TreeNode(nums[mid])
    node.left = helper(left, mid - 1)
    node.right = helper(mid + 1, right)
    return node
  }
  return helper(0, nums.length - 1)
}

// 判断是否为平衡二叉树
function isBalance (root) {
  // if (!node) return true
  // return Math.abs(maxDep(root.left) - maxDep(root.right)) < 2 && isBalance(root.left) && isBalance(root.right)

  // 最大深度的变种
  function loop (node) {
    if (!node) return 0
    const left = loop(node.left)
    const right = loop(node.right)
    if (left === -1 || right === -1 || Math.abs(left - right) > 1) {
      return -1
    } else {
      return Math.max(left, right) + 1
    }
  }
  return loop(root) > 0
}

// 二叉树的最小深度
function minDep (root) {
  // if (!root) return 0
  // const lmin = minDep(root.left)
  // const rmin = minDep(root.right)
  // return root.left || root.right ? Math.max(lmin, rmin) + 1 : Math.min(lmin, rmin) + 1

  // 广度优先
  let dep = 0
  const stack = [root]
  while (stack.length) {
    let i = stack.length - 1
    while (i >= 0) {
      const node = stack.shift()
      if (!node.left && !node.right) {
        return dep + 1
      }
      if (node.left) stack.push(node.left)
      if (node.right) stack.push(node.right)
      i--
    }
    dep++
  }
}

// 路径总和
// 二叉树的根节点 root 和一个表示目标和的整数 targetSum 。判断该树中是否存在 根节点到叶子节点 的路径，这条路径上所有节点值相加等于目标和 targetSum
function hasPathSum (root, target) {
  if (!root) return false
  const tp = target - root.val
  if (!root.left && !root.right) { // 必须是叶子节点
    return tp === 0
  }
  return hasPathSum(root.left, tp) || hasPathSum(root.right, tp)
}

// 验证二叉搜索树
// 二叉搜索树的中序遍历是一个升序数组
function isValidBST (root) {
  let pre = Number.MIN_SAFE_INTEGER
  const stack = []
  while (stack.length || root) {
    while (root) {
      stack.push(root)
      root = root.left
    }
    root = stack.pop()
    if (pre >= root.val) {
      return false
    }
    pre = root.val
    root = root.right
  }
  return true
}