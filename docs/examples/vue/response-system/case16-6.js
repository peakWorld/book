// 解析定界符
function parseInterpolation(context) {
  context.advanceBy('{{'.length); // 消费开始定界符
  // 找到结束定界符的位置索引
  closeIndex = context.source.indexOf('}}');
  if (closeIndex < 0) {
    console.error('插值缺少结束定界符');
  }
  // 截取开始定界符与结束定界符之间的内容作为插值表达式
  const content = context.source.slice(0, closeIndex);
  content.advanceBy(content.length); // 消费表达式的内容
  content.advanceBy('{{'.length); // 消费结束定界符

  return {
    type: 'Interpolation',
    content: {
      type: 'Expression',
      content: decodeHtml(content),
    },
  };
}

// 解析注释
function parseComment(context) {
  context.advanceBy('<!--'); // 消费注释的开始部分
  closeIndex = context.source.indexOf('-->'); // 结束位置
  const content = context.source.slice(0, closeIndex);
  content.advanceBy(content.length); // 消费内容
  content.advanceBy('-->'.length); // 消费结束部分

  return {
    type: 'Comment',
    content,
  };
}
