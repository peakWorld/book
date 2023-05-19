import { parse } from './case15-3.js';
import { dump } from './case15-4.js';

function traverseNode(ast, context) {
  context.currentNode = ast; // 设置当前转换节点

  const transforms = context.nodeTransforms;
  for (let i = 0; i < transforms.length; i++) {
    transforms[i](context.currentNode, context);
    // 任何转换函数都可能删除当前节点; 在函数执行完毕后, 都要检查当前节点是否已移除
    if (!context.currentNode) return;
  }

  const children = context.currentNode.children;
  if (children) {
    for (let i = 0; i < children.length; i++) {
      context.parent = context.currentNode; // 在转换字节点前, 将当前节点设置为父节点
      context.childIndex = i; // 设置位置索引
      traverseNode(children[i], context);
    }
  }
}

function transform(ast) {
  // context看作AST转换函数中的上下文数据, 维护程序的当前状态。
  const context = {
    currentNode: null, // 当前正在转换的节点
    childIndex: 0, // 当前节点在父节点的children中的位置索引
    parent: null, // 当前转换节点的父节点
    nodeTransforms: [transformElement, transformText],
    // 替换节点, 需要修改AST
    replaceNode(node) {
      // 当前节点在父节点children中的位置, 用新node替换
      context.parent.children[context.childIndex] = node;
      // 当前节点被新节点替换了, 更新currentNode
      context.currentNode = node;
    },
    // 删除当前节点
    removeNode() {
      if (context.parent) {
        // 根据当前节点的索引删除当前节点
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
    context.removeNode();
  }
}

const ast = parse('<div><p>Vue</p><p>Template</p></div>');
transform(ast);
