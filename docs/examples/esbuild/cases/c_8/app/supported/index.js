const xx = () => {};

const alsoHuge = BigInt(9007199254740991);

console.log(xx, alsoHuge);

export class Test {}

async function test() {
  const xx = await new Promise((resolve) => setTimeout(resolve, 2000));
}
