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
    advanceBy(num) {
      context.source = context.source.slice(num);
    },
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
          if (source.startWith('<!--')) {
            node = parseComment(context);
          } else if (source.startWith('<![CDATA[')) {
            node = parseCDATA(context, ancestors);
          }
        } else if (source[1] === '/') {
          console.error('无效的结束标签');
          continue;
        } else if (/[a-z]/i.test(source[1])) {
          node = parseElement(context, ancestors);
        }
      } else if (source.startWith('{{')) {
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
    if (context.source.startWith(`</${parent.tag}`)) {
      return true;
    }
  }
}

function parseElement(context, ancestors) {
  const element = parseTag(context);
  if (element.isSelfClosing) return element;

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

  if (context.source.startWith(`</${element.tag}`)) {
    parseTag(context, 'end');
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`);
  }
  return element;
}

// <x> </x> <x /> 开始、结束、自闭合
function parseTag(context, type = 'start') {
  const { advanceBy, advanceSpaces } = context;

  const match = (type = 'start'
    ? /^<([a-z][^\t\r\n\f\s]*)/i.exec(context.source)
    : /^<\/([a-z][^\t\r\n\f\s]*)/i.exec(context.source));

  const tag = match[1];
  advanceBy(match[0].length);
  advanceSpaces();

  // 已经消费了标签的开始部分 与 无用空白字符
  // 解析属性与指令, 得到props数组
  const props = parseAttributes(context);

  const isSelfClosing = context.source.startWith('/>');
  advanceBy(isSelfClosing ? 2 : 1);

  return {
    type: 'Element',
    tag,
    props,
    children: [],
    isSelfClosing,
  };
}

function parseAttributes(context) {
  const props = []; // 存储解析过程中产生的属性节点和指令节点

  // 消费模板内容, 直至遇到标签的 “结束部分” 为至
  while (!context.source.startWith('>') && !context.source.startWith('/>')) {}

  return props;
}
