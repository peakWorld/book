// parseChildren-parseText
function parseText(context) {
  // 文本内容的结尾索引(默认将整个模板剩余内容都作为文本内容)
  let endIndex = context.source.length;
  // 寻找字符<的位置索引
  const ltIndex = context.source.indexOf('<');
  // 寻找定界符{{的位置索引
  const delimiterIndex = context.source.indexOf('{{');

  // 取小值作为新的结尾索引
  if (ltIndex > -1 && ltIndex < endIndex) {
    endIndex = ltIndex;
  }
  if (delimiterIndex > -1 && delimiterIndex < endIndex) {
    endIndex = delimiterIndex;
  }
  // 截取文本内容
  const content = context.source.slice(0, endIndex);
  // 消耗文本内容
  context.advanceBy(content.length);

  return { type: 'Text', content: decodeHtml(content) };
}

// 命名字符引用表
const namedCharacterReference = {
  gt: '>',
  'gt;': '>',
  lt: '<',
  'lt;': '<',
  'ltcc;': '⪦',
};

// 待解码的文本内容, 是否作为属性值
function decodeHtml(rawText, asAttr = false) {
  let offset = 0;
  const end = rawText.length;
  // 解码后的文本将作为返回值
  let decodedText = '';
  // 引用表中实体名称的最大长度
  let maxCRNameLength = 0;

  // advance 用于消费指定长度的文本
  function advance(length) {
    offset += length;
    rawText = rawText.slice(length);
  }

  while (offset < end) {
    // 匹配字符引用开始部分
    // head[0] === '&' 命名字符引用
    // head[0] === '&#' 十进制数字字符引用
    // head[0] === '&#x 十六进制数字字符引用
    const head = /&(?:#x?)?/i.exec(rawText);

    // 如果没有匹配, 则没有需要解码的内容了
    if (!head) {
      const remaining = end - offset; // 计算剩余内容的长度
      decodedText += rawText.slice(0, remaining);
      advance(remaining);
      break;
    }

    // head.index 为匹配的字符&在rawText中的位置索引; 截取字符&之前的内容加到 decodedText 上
    decodedText += rawText.slice(0, head.index);
    advance(head.index);

    // 满足为命名字符引用, 否则为数字字符引用
    if (head[0] === '&') {
      let name = '';
      let value;
      // 命名字符引用下一个字符必须是 ASCII 字母或数字; 否则为普通文本
      if (/[0-9a-z]/i.test(rawText[1])) {
        // 计算引用表实体名称的最大值
        if (!maxCRNameLength) {
          maxCRNameLength = Object.keys(namedCharacterReference).reduce(
            (max, name) => Math.max(max, name.length),
            0
          );
        }
        // 从最大长度对文本进行截取, 并试图去引用表中找到对应的项
        for (let length = maxCRNameLength; !value && length >= 0; --length) {
          name = rawText.substr(1, length);
          value = namedCharacterReference[name];
        }
        // 找到对应项的值
        if (value) {
          const semi = name.endsWith(';'); // 实体名称最后一个匹配字符是否为分号
          // 如果解码文本作为属性值; 最后一个匹配的字符不是分号, 且最后一个匹配字符的下一个字符是等于号、ASCII字母或数字
          // 由于历史原因, 将字符&和实体名称作为普通文字
          if (
            asAttr &&
            !semi &&
            /[=a-z0-9]/i.test(rawText[name.length + 1] || '')
          ) {
            decodedText += '&' + name;
            advance(1 + name.length);
          } else {
            decodedText += value;
            advance(1 + name.length);
          }
        } else {
          decodedText += '&' + name;
          advance(1 + name.length);
        }
      } else {
        decodedText += '&';
        advance(1);
      }
    } else {
      const hex = head[0] === '&#x'; // 判断十进制/十六进制
      const pattern = hex ? /^&#x([0-9a-f]+);?/i : /^&#([0-9]+);?/i;
      const body = pattern.exec(rawText);

      // 匹配成功
      if (body) {
        const cp = Number.parseInt(body[1], hex ? 16 : 10); // 将码点字符串转换为数字
        // 码点合法性检查
        // TODO
        decodedText += String.fromCodePoint(cp); // 解码
        advance(body[0].length);
      } else {
        decodedText += head[0];
        advance(head[0].length);
      }
    }
  }

  return decodedText;
}
