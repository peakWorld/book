// 二分查找 在有序数组中查找某个值
const arr = [1, 5, 6, 8, 9, 13, 21, 25, 33]
// function query (arr, num) {
//   let start = 0, end = arr.length - 1
//   while (start <= end) {
//     const mid = (start + end) >> 1
//     if (arr[mid] === num) {
//       return 1
//     } else if (arr[mid] > num) {
//       end = mid - 1
//     } else {
//       start = mid + 1
//     }
//   }
//   return -1
// }

// function query2 (arr, num) {
//   if (!arr.length) return -1
//   const mid = arr.length >> 1
//   if (arr[mid] === num) {
//     return 1
//   } else if (arr[mid] > num) {
//     return query2(arr.slice(0, mid - 1), num)
//   } else {
//     return query2(arr.slice(mid + 1), num)
//   }
// }

// console.log(query2(arr, 6))

const DATA = [3,44,38,55,47,15,36,26,27,2,46,4,19,50,48]
// 排序-冒泡
// function bubbleSort (arr) {
//   for (let i = 0, len = arr.length; i < len; i++) {
//     for (let j = i + 1; j < len; j++) {
//       if (arr[j] < arr[i]) {
//         [arr[j], arr[i]] = [arr[i], arr[j]]
//       }
//     }
//   }
//   return arr
// }
// 排序-冒泡优化
// function bubbleSort1 (arr) {
//   let i = arr.length - 1
//   while (i > 0) {
//     // 记录每次循环, 最后一次交换的位置, 作为下次循环的尾部
//     // 默认为0, 该次循环没有交换位置
//     let pos = 0
//     for (let j = 0; j < i; j++) { // 将大值往右侧置换
//       if (arr[j] > arr[j + 1]) {
//         pos = j;
//         [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]
//       }
//     }
//     i = pos
//   }
//   return arr
// }

// 排序-选择
// function selectionSort (arr) {
//   for (let i = 0, len = arr.length; i < len; i++) {
//     let min = i // 
//     for (let j = i + 1; j < len; j++) {
//       if (arr[j] < arr[min]) min = j
//     }
//     [arr[i], arr[min]] = [arr[min], arr[i]]
//   }
//   return arr
// }

// 排序-插入
// function insertionSort(arr) {
//   // 假定第一个是有序的, 从第二个数开始往有序列表中插入数据
//   for (let i = 1, len = arr.length; i < len; i++) {
//     let insertVal = arr[i]
//     let sortedArrIndex = i - 1
//     // 往有序数组中插入一个数, 找到正确的位置
//     // while (sortedArrIndex >= 0 && insertVal < arr[sortedArrIndex]) {
//     //   arr[sortedArrIndex + 1] = arr[sortedArrIndex]
//     //   sortedArrIndex--
//     // }
//     // arr[sortedArrIndex + 1] = insertVal

//     while (insertVal < arr[sortedArrIndex] && sortedArrIndex >= 0) {
//       [arr[sortedArrIndex], arr[sortedArrIndex + 1]] = [arr[sortedArrIndex + 1], arr[sortedArrIndex]]
//       sortedArrIndex--
//     }
//   }
//   return arr
// }

// 排序-希尔
// function shellSort(arr) {
//   const len = arr.length
//   // 将数组arr划分成多个逻辑数组, 逻辑数组的增量为gap, 
//   // 每个gap增量中的所有逻辑数组进行插入排序, 改变增量gap, 直至gap = 1
//   // 先尽量将数组排序, 最后整体排序
//   for (let gap = len >> 1; gap > 0; gap >>= 1) {
//     // 对所有的逻辑数组进行插入排序。
//     // 初识化i = gap, 则是假设逻辑数组的第一个数是有序的
//     // 这里可以看成是对逻辑数组的并行处理, 不是串行的
//     // 即按数组(arr)的顺序依次往下执行, 每个i都是某个逻辑数组的值
//     for (let i = gap; i < len; i++) {
//       // 对每个逻辑数组进行插入处理
//       const val = arr[i]
//       let j = i - gap
//       while (j >= 0 && arr[j] > val) {
//         arr[j + gap] = arr[j]
//         j -= gap
//       }
//       arr[j + gap] = val
//     }
//   }
//   return arr
// }

// 归并排序
// 递归分割无序数组, 直到每个子数组只有单个元素; 单个元素的数组肯定是有序数组
// function mergeSort (arr) {
//   const len = arr.length
//   if (len < 2) return arr
//   return merge(
//     mergeSort(arr.slice(0, len >> 1)),
//     mergeSort(arr.slice(len >> 1))
//   )
// }
// // 合并两个有序数组, 返回一个新的有序数组
// function merge (arr1, arr2) {
//   const res = []
//   while (arr1.length && arr2.length) {
//     if (arr1[0] < arr2[0]) {
//       res.push(arr1.shift())
//     } else {
//       res.push(arr2.shift())
//     }
//   }
//   while(arr1.length) {
//     res.push(arr1.shift())
//   }
//   while(arr2.length) {
//     res.push(arr2.shift())
//   }
//   return res
// }

// 快速排序
// function quickSort (arr) {
//   const len = arr.length
//   if (len < 2) return arr
//   const midV = arr[len >> 1]
//   const left = []
//   const right = []
//   for (let i = 0; i < len; i++) {
//     const tmp = arr[i]
//     if (midV > tmp) left.push(tmp)
//     if (midV < tmp) right.push(tmp)
//   }
//   return [...quickSort(left), midV, ...quickSort(right)]
// }

// 堆排序
// function heapSort (arr) {
//   const len = arr.length
//   //  Math.floor(len / 2) - 1 是最后一个子节点的父节点索引
//   // 从堆的底部依次往上, 维护堆性质
//   for (let i = Math.floor(len / 2) - 1; i >= 0; i--) {
//     swapHeap(arr, i, len)
//   }
//   // 逐次求大顶堆, 置换收尾
//   for (let i = len - 1; i > 0; i--) {
//     [arr[0], arr[i]] = [arr[i], arr[0]]
//     swapHeap(arr, 0, i) // i表示当前堆中值的数量, 每次减1
//   }
//   return arr
// }

// function swapHeap (arr, i, len) {
//   const left = 2 * i + 1
//   const right = 2 * i + 2
//   let max = i
//   // 和左右子树比较, 获取最大值索引
//   if (left < len && arr[left] > arr[max]) max = left
//   if (right < len && arr[right] > arr[max]) max = right
//   // 左右字数有值比节点大, 交换数值; 维护交换数值后子树的堆性质
//   if (max !== i) {
//     [arr[max], arr[i]] = [arr[i], arr[max]]
//     swapHeap(arr, max, len)
//   }
// }

// 计数排序
// function countSort (arr) {
//   const res = []
//   const tmpArr = []
//   let min = Number.MAX_SAFE_INTEGER
//   let max = Number.MIN_SAFE_INTEGER
//   for (let i = 0, len = arr.length; i < len; i++) {
//     const tmp = arr[i]
//     if (tmp > max) max = tmp
//     if (tmp < min) min = tmp
//     tmpArr[tmp] = tmpArr[tmp] ? tmpArr[tmp] + 1 : 1 // 数组中的值是tmpArr的序号, 出现一次加1
//   }
//   for (let j = min; j <= max; j++) { // 数组最大值, 最小值
//     const size = tmpArr[j] // 数组中该数出现的次数
//     if (size === 1) {
//       res.push(j)
//     }
//     if (size > 1) {
//       for (let k = 0; k < size; k++) {
//         res.push(j)
//       }
//     }
//   }
//   return res
// }

// 桶排序
// function bucketSort (arr, size) {
//   const buckets = []
//   let res = []
//   let min = Number.MAX_SAFE_INTEGER
//   let max = Number.MIN_SAFE_INTEGER
//   // 求出数组的最大最小值
//   for (let i = 0, len = arr.length; i < len; i++) {
//     const tmp = arr[i]
//     if (tmp < min) min = tmp
//     if (tmp > max) max = tmp
//   }
//   // 根据桶的个数, 计算每个桶的区间
//   const step = Math.floor((max - min + 1) / size)
//   for (let j = 0, len = arr.length; j < len; j++) {
//     const val = arr[j]
//     const index = Math.floor((val - min) / step) // 求出当前数字位于哪个桶
//     if (!buckets[index]) { // 如果桶不存在, 新建桶
//       buckets[index] = [val]
//     } else { // 如果桶存在, 插入算法插入新数
//       // 插入排序, 从有序数组的最后一位插入新数据
//       let k = buckets[index].length - 1 
//       while (k >= 0 && val < buckets[index][k]) {
//         buckets[index][k + 1] = buckets[index][k]
//         k--
//       }
//       buckets[index][k + 1] = val
//     }
//   }
//   for (let i = 0; i < size; i++) { // 按顺序合并桶
//     res = [...res, ...buckets[i]]
//   }
//   return res
// }
console.log(bucketSort(DATA, 5))
