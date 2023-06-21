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
    // 用来消费指定数量的字符, 接收一个数字参数
    advanceBy(num) {
      context.source = context.source.slice(num);
    },
    // 匹配空白字符
    advanceSpaces() {
      const match = /^[\t\r\n\f\s]+/.exec(context.source);
      if (match) {
        context.advanceBy(match[0].length);
      }
    },
  };
  const nodes = parseChildren(context, []);
  return { type: 'Root', children: nodes };
}

function parseChildren(context, ancestors) {
  let nodes = [];
  const { mode, source } = context;

  while (!isEnd(context, ancestors)) {
    let node;
    if (mode === TextModes.DATA || mode === TextModes.RCDATA) {
      if (mode === TextModes.DATA && source[0] === '<') {
        if (source[1] === '!') {
          if (source.startsWith('<!--')) {
            node = parseComment(context);
          } else if (source.startsWith('<![CDATA[')) {
            node = parseCDATA(context, ancestors);
          }
        } else if (source[1] === '/') {
          console.error('无效的结束标签');
          continue;
        } else if (/[a-z]/i.test(source[1])) {
          node = parseElement(context, ancestors);
        }
      } else if (source.startsWith('{{')) {
        node = parseInterpolation(context);
      }
    }

    if (!node) {
      node = parseText(context);
    }

    nodes.push(node);
  }

  return nodes;
}

function isEnd(context, ancestors) {
  if (!context.source) return true;
  for (let i = ancestors.length - 1; i >= 0; --i) {
    if (context.source.startsWith(`</${ancestors[i].tag}`)) {
      return true;
    }
  }
}

function parseElement(context, ancestors) {
  const element = parseTag(context);
  if (element.isSelfClosing) return element;

  // 切换正确的文本模式
  if (element.tag === 'textarea' || element.tag === 'title') {
    context.mode = TextModes.RCDATA;
  } else if (/style|xmp|iframe|noembed|noframes|noscript/.test(element.tag)) {
    context.mode = TextModes.RAWTEXT;
  } else {
    context.mode = TextModes.DATA;
  }

  ancestors.push(element);
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  if (context.source.startsWith(`</${element.tag}`)) {
    parseTag(context, 'end');
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`);
  }
  return element;
}

function parseTag(context, type = 'start') {
  const { advanceBy, advanceSpaces } = context;

  // 利用正则 匹配开始、结束标签
  const match = (type = 'start'
    ? /^<([a-z][^\t\r\n\f\s]*)/i.exec(context.source) // 开始标签
    : /^<\/([a-z][^\t\r\n\f\s]*)/i.exec(context.source)); // 结束标签

  const tag = match[1]; // 正则表达式的第一个捕获组的值就是标签名 div
  advanceBy(match[0].length); // 消费正则表达式匹配的全部内容 <div
  advanceSpaces(); // 消费标签中无用的空白字符

  // 如果字符以 '/>' 开头, 则表明是一个自闭合标签
  const isSelfClosing = context.source.startsWith('/>');
  advanceBy(isSelfClosing ? 2 : 1);

  return {
    type: 'Element',
    tag,
    props: [],
    children: [],
    isSelfClosing,
  };
}
