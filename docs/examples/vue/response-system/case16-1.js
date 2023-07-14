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

  // 返回解析后得到的节点
  const nodes = parseChildren(context, []);

  return { type: 'Root', children: nodes };
}

function parseChildren(context, ancestors) {
  // 存储字节点, 作为最终的返回值
  let nodes = [];
  const { mode, source } = context;

  // while循环
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

// 伪代码
function parseElement() {
  // 解析开始标签
  const element = parseTag();
  // 递归调用 parseChildren 函数进行 标签字节点的解析
  element.children = parseChildren();
  // 解析结束标签
  parseEndTag();

  return element;
}
