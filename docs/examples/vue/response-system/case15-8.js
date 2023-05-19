import { parse } from './case15-3.js';
import { transform } from './case15-7.js';

function compile(template) {
  // 模板AST
  const ast = parse(template);
  // 将模板ast转换成 jsAST
  transform(ast);
  // 代码生成
  const code = generate(ast.jsNode);

  return code;
}

function generate(node) {
  // 维护代码生成过程中程序的运行状态
  const context = {
    code: '', // 最终生成的渲染函数代码
    // 代码拼接
    push(code) {
      context.code += code;
    },
    /** 增强代码的可读性 */
    currentIndent: 0, // 缩进级别
    // 换行, 在代码字符串后追加 \n 字符; 换行时保留缩进,追加 currentIndent*2个空格字符
    newline() {
      context.code += '\n' + '  '.repeat(context.currentIndent);
    },
    // 增加缩进
    indent() {
      context.currentIndent++;
      context.newline();
    },
    // 取消缩进
    deIndent() {
      context.currentIndent--;
      context.newline();
    },
  };
  genNode(node, context); // 完成代码的生成
  return context.code;
}

// 匹配JsAST节点, 调用相应的生成函数
function genNode(node, context) {
  switch (node.type) {
    case 'FunctionDecl':
      genFunctionDecl(node, context);
      break;
    case 'ReturnStatement':
      genReturnStatement(node, context);
      break;
    case 'CallExpression':
      genCallExpression(node, context);
      break;
    case 'StringLiteral':
      genStringLiteral(node, context);
      break;
    case 'ArrayExpression':
      genArrayExpression(node, context);
      break;
  }
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    genNode(node, context);
    if (i < nodes.length - 1) {
      push(',');
    }
  }
}

function genFunctionDecl(node, context) {
  const { push, indent, deIndent } = context;
  // node.id 描述函数名称的标识符
  push(`function ${node.id.name}`);
  push('(');
  // 生成函数参数代码
  genNodeList(node.params, context);
  push(')');
  push('{');
  indent();
  // 生成代码体
  node.body.forEach((n) => genNode(n, context));
  deIndent();
  push('}');
}

function genArrayExpression(node, context) {
  const { push } = context;
  push('[');
  genNodeList(node.elements, context);
  push(']');
}

function genReturnStatement(node, context) {
  const { push } = context;
  push(`return `);
  genNode(node.return, context);
}

function genStringLiteral(node, context) {
  const { push } = context;
  push(`'${node.value}'`);
}

function genCallExpression(node, context) {
  const { push } = context;
  const { callee, arguments: args } = node;
  push(`${callee.name}(`);
  genNodeList(args, context);
  push(')');
}

const code = compile('<div><p>Vue</p><p>Template</p></div>');
console.log('code', code);
