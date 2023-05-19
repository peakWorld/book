import { tokenize } from './case15-2.js';

export function parse(str) {
  const tokens = tokenize(str); // 标记化, 得到tokens
  const root = { type: 'Root', children: [] }; // 创建Root根节点

  const elementStack = [root];

  while (tokens.length) {
    const parent = elementStack[elementStack.length - 1]; // 当前栈顶节点作为父节点
    const t = tokens[0];
    // 根据token类型进行处理
    switch (t.type) {
      case 'tag': // 开始标签
        const elementNode = { type: 'Element', tag: t.name, children: [] };
        parent.children.push(elementNode);
        elementStack.push(elementNode);
        break;
      case 'text': // 文本
        const textNode = { type: 'Text', content: t.content };
        parent.children.push(textNode);
        break;
      case 'tagEnd': // 结束标签
        elementStack.pop();
        break;
    }
    tokens.shift(); // 消费已扫描的token
  }

  return root;
}

// const ast = parse('<div><p>Vue</p><p>Template</p></div>');
// console.log('ast', ast);
