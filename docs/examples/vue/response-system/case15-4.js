import { parse } from './case15-3.js';

// 打印当前AST中节点的信息
export function dump(node, indent = 0) {
  const type = node.type; // 节点类型
  const desc =
    node.type === 'Root' // 根节点, 没有描述
      ? ''
      : node.type === 'Element' // element类型, 描述 node.tag
      ? node.tag
      : node.content; // Text类型, 描述 node.content

  console.log(`${'-'.repeat(indent)}${type}:${desc}`);

  // 递归打印字节点
  if (node.children) {
    node.children.forEach((n) => dump(n, indent + 2));
  }
}

// 1. 遍历节点\节点操作臃肿(耦合) - 深度优先
// function traverseNode(ast) {
//   const currentNode = ast;

//   // Element类型, p标签替换为h1
//   if (currentNode.type === 'Element' && currentNode.tag === 'p') {
//     currentNode.tag = 'h1';
//   }

//   // Text类型, 重复文本内容
//   if (currentNode.type === 'Text') {
//     currentNode.content = currentNode.content.repeat(2);
//   }

//   const children = currentNode.children;
//   if (children) {
//     for (let i = 0; i < children.length; i++) {
//       traverseNode(children[i]);
//     }
//   }
// }

// 2. 对节点的操作和访问进行(解耦)
function traverseNode(ast, context) {
  const currentNode = ast;

  const transforms = context.nodeTransforms;
  for (let i = 0; i < transforms.length; i++) {
    transforms[i](currentNode, context);
  }

  const children = currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      traverseNode(children[i], context);
    }
  }
}

// ast转换函数
function transform(ast) {
  // 在transform函数内创建context对象
  const context = {
    nodeTransforms: [transformElement, transformText],
  };
  traverseNode(ast, context);
  console.log(dump(ast));
}

function transformElement(node) {
  if (node.type === 'Element' && node.tag === 'p') {
    node.tag = 'h1';
  }
}

function transformText(node) {
  if (node.type === 'Text') {
    node.content = node.content.repeat(2);
  }
}

// const ast = parse('<div><p>Vue</p><p>Template</p></div>');
// transform(ast);
