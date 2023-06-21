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

  return { type: 'Text', content };
}
