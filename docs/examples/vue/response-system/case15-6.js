import { parse } from './case15-3.js';
import { dump } from './case15-4.js';

function traverseNode(ast, context) {
  context.currentNode = ast;
  const transforms = context.nodeTransforms;

  const exitFns = []; // 退出阶段回调函数数组
  for (let i = 0; i < transforms.length; i++) {
    // 返回函数作为退出阶段的回调函数
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

  // 在节点处理的最后阶段执行exitFns中的回调函数(反序执行)
  // 在进入阶段, transforms函数是顺序执行的；那么退出阶段, 必须反序执行exitFns函数
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

function transform(ast) {
  const context = {
    currentNode: null,
    childIndex: 0,
    parent: null,
    nodeTransforms: [transformElement, transformText],
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
  console.log(dump(ast));
}

function transformElement(node) {
  if (node.type === 'Element' && node.tag === 'p') {
    node.tag = 'h1';
  }
}

function transformText(node, context) {
  if (node.type === 'Text') {
    // 将文本节点替换为元素节点
    // context.replaceNode({ type: 'Element', tag: 'span' });
    // 删除当前节点
    // context.removeNode();
  }
}

const ast = parse('<div><p>Vue</p><p>Template</p></div>');
transform(ast);
