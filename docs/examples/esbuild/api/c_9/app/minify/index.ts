const fn = obj => { return obj.x }

function test() {
  return fn({ x: 2 }) + 1
}

// 模板
const aTest = "a\n" + "b"

console.log(fn, test, aTest)

// 直接使用eval; 阻止了整个文件的minfy
// let result = eval('{ x: 1 }')

// 间接使用eval; 正常压缩
const st = eval
let result = st('{ x: 1 }')
