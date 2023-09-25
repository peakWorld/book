const test1 = () => {};

(async () => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
})();

export class Test2 {}

const x = [...[1, 3, 5]];

const { a: xa } = { a: 2 };

function* test2() {}

const tt = test2();
