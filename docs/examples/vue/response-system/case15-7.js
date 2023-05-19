import { parse } from './case15-3.js';
import { dump } from './case15-4.js';

function traverseNode(ast, context) {
  context.currentNode = ast;
  const transforms = context.nodeTransforms;

  const exitFns = [];
  for (let i = 0; i < transforms.length; i++) {
    const onExit = transforms[i](context.currentNode, context);
    if (onExit) {
      exitFns.push(onExit);
    }
    if (!context.currentNode) return;
  }
  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      context.parent = context.currentNode;
      context.childIndex = i;
      traverseNode(children[i], context);
    }
  }

  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

export function transform(ast) {
  const context = {
    currentNode: null,
    childIndex: 0,
    parent: null,
    nodeTransforms: [transformElement, transformText, transformRoot],
    replaceNode(node) {
      context.parent.children[context.childIndex] = node;
      context.currentNode = node;
    },
    removeNode() {
      if (context.parent) {
        context.parent.children.splice(context.childIndex, 1);
        context.currentNode = null;
      }
    },
  };
  traverseNode(ast, context);
  console.log(ast.jsNode);
}

function transformElement(node) {
  // 转换标签节点 在退出阶段执行; 确保该标签的字节点全部处理完成
  return () => {
    if (node.type !== 'Element') return;

    // 1、创建h函数调用语句, 第一个参数是标签名称
    const callExp = createCallExpression('h', [createStringLiteral(node.tag)]);

    // 2、调用参数
    node.children.length === 1
      ? callExp.arguments.push(node.children[0].jsNode)
      : callExp.arguments.push(
          createArrayExpression(node.children.map((c) => c.jsNode))
        );

    node.jsNode = callExp;
  };
}

function transformText(node) {
  if (node.type !== 'Text') return;

  // 文本节点对应的 JSAST节点是一个字符串子面量
  node.jsNode = createStringLiteral(node.content);
}

function transformRoot(node) {
  // 转换根节点
  return () => {
    if (node.type !== 'Root') return;

    // 根节点的第一个字节点 是模板的根节点(不考虑多根节点情况)
    const vnodeJSAST = node.children[0].jsNode;

    // 创建render函数的声明语句节点
    node.jsNode = {
      type: 'FunctionDecl',
      id: { type: 'Identifier', name: 'render' },
      params: [],
      body: [
        {
          type: 'ReturnStatement',
          return: vnodeJSAST,
        },
      ],
    };
  };
}

// 创建JS AST节点
function createStringLiteral(value) {
  return { type: 'StringLiteral', value };
}

function createIdentifier(name) {
  return { type: 'Identifier', name };
}

function createArrayExpression(elements) {
  return { type: 'ArrayExpression', elements };
}

function createCallExpression(callee, args) {
  return {
    type: 'CallExpression',
    callee: createIdentifier(callee),
    arguments: args,
  };
}

// const ast = parse('<div><p>Vue</p><p>Template</p></div>');
// transform(ast);
