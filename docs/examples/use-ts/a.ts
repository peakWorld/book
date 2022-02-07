let a = 1

async function test() {
  const b = await (1 + a)
  const c = await new Promise((resolve) => resolve(2))
  return "1"
}

