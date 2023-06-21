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
    parseTag(context, 'end'); // 结束只消耗
  } else {
    console.error(`${element.tag} 标签缺少闭合标签`);
  }
  return element;
}

// <x> </x> <x /> 开始、结束、自闭合
function parseTag(context, type = 'start') {
  const { advanceBy, advanceSpaces } = context;

  const match =
    type == 'start'
      ? /^<([a-z][^\t\r\n\f\s]*)/i.exec(context.source)
      : /^<\/([a-z][^\t\r\n\f\s]*)/i.exec(context.source);

  const tag = match[1];
  advanceBy(match[0].length);
  advanceSpaces();

  // 已经消费了标签的开始部分 与 无用空白字符
  // 解析属性与指令, 得到props数组
  const props = type == 'start' ? parseAttributes(context) : [];

  const isSelfClosing = context.source.startsWith('/>');
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
  const { advanceBy, advanceSpaces } = context;
  const props = []; // 存储解析过程中产生的属性节点和指令节点

  // 消费模板内容, 直至遇到标签的 “结束部分” 为至
  while (!context.source.startsWith('>') && !context.source.startsWith('/>')) {
    const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source); // 匹配属性名称
    const name = match[0]; // 得到属性名称
    advanceBy(name.length); // 消费属性名称
    advanceSpaces(); // 消费属性名称与等号之间的空白字符
    advanceBy(1); // 消费等号
    advanceSpaces(); // 消费等号与属性值之间的空白字符

    let value = ''; // 属性值
    const quote = context.source[0]; // 当前模板内容的第一个字符
    const isQuote = quote === "'" || quote === '"'; // 判断属性值是否被引号引用

    if (isQuote) {
      advanceBy(1); // 消费引号
      const endQuoteIndex = context.source.indexOf(quote); // 获取下一个引号的索引
      if (endQuoteIndex > -1) {
        value = context.source.slice(0, endQuoteIndex); // 下一个引号前的内容都为属性值
        advanceBy(value.length);
        advanceBy(1); // 消费引号
      } else {
        console.error('缺少引号');
      }
    } else {
      const match = /^[^\t\r\n\f >]+/.exec(context.source); // 下一个空白符前的内容当作属性值
      value = match[0];
      advanceBy(value.length);
    }

    advanceSpaces(); // 消费属性值后的空白字符

    props.push({ type: 'Attribute', name, value });
  }

  return props;
}

// parse(`<div id = "foo v-show="display">`); // 这种情况下 匹配 不对
console.log(parse(`<div id = "foo" v-show="display"></div>`));
