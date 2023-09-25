// 默认不会混淆
const test_ = 1

// 只有属性才混淆
const test2 = {
  key_: 2,
  name_: 3,
  age_: 4,

  // 字符串字面量属性[默认不混淆]
  'keep_': 5
}

const /* @__KEY__ */ test3_ = 6 // 不会混淆, 非属性

Object.defineProperty(
  {},
  /* @__KEY__ */ 'foo_', // 会混淆, 其他位置的字符串中的属性名
  { get: () => 123 },
)