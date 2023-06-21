// 文本模式
const TextModes = {
  DATA: 'DATA',
  RCDATA: 'RCDATA',
  RAWTEXT: 'RAWTEXT',
  CDATA: 'CDATA',
};

function parse(str) {
  const context = {
    source: str,
    mode: TextModes.DATA,
  };
  const nodes = parseChildren(context, []);
  return { type: 'Root', children: nodes };
}

function parseChildren(context, ancestors) {
  let nodes = [];
  const { mode, source } = context;

  while (!isEnd(context, ancestors)) {
    let node;
    // 只有DATA 和 RCDATA模式才支持插值节点的解析
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      // 只有DATA模式才支持标签节点的解析
      if (mode === TextModes.DATA && source[0] === '<') {
        if (source[1] === '!') {
          if (source.startsWith('<!--')) {
            // 注释
            node = parseComment(context);
          } else if (source.startsWith('<![CDATA[')) {
            node = parseCDATA(context, ancestors);
          }
        } else if (source[1] === '/') {
          // 结束标签
          // 状态机遭遇了闭合标签, 抛出错误
          console.error('无效的结束标签');
          continue;
        } else if (/[a-z]/i.test(source[1])) {
          // 标签
          node = parseElement(context, ancestors);
        }
      } else if (source.startsWith('{{')) {
        // 解析插值
        node = parseInterpolation(context);
      }
    }

    // node不存在, 说明处于其他模式(非DATA、非RCDATA)
    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

// 解释二
function isEnd(context, ancestors) {
  if (!context.source) return true;
  // 与栈中所有节点做比较
  for (let i = ancestors.length - 1; i >= 0; --i) {
    if (context.source.startsWith(`</${ancestors[i].tag}`)) {
      return true;
    }
  }
}

function parseElement(context, ancestors) {
  // 解析开始标签
  const element = parseTag(context);
  if (element.isSelfClosing) return element;

  ancestors.push(element);
  // 递归调用 parseChildren 函数进行 标签字节点的解析
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (context.source.startsWith(`</${element.tag}`)) {
    parseTag(context, 'end');
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`);
  }
  return element;
}
