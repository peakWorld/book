function test() {
  return say() + write()
}

function say() {
  return 2 + 1
}

function write() {
  return 5
}

console.log('test()', test())