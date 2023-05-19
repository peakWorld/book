// 定义状态机的状态
const state = {
  initial: 1, // 初始状态
  tagOpen: 2, // 标签开始状态
  tagName: 3, // 标签名称状态
  text: 4, // 文本状态
  tagEnd: 5, // 结束标签状态
  tagEndName: 6, // 结束标签名称状态
};

// 判断是否是字母
function isAlpha(char) {
  return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
}

export function tokenize(str) {
  let currentState = state.initial; // 初始状态
  const chars = []; // 缓存字符
  const tokens = []; // 存储生成的token

  while (str) {
    const char = str[0];
    switch (currentState) {
      case state.initial: // 初始状态
        if (char === '<') {
          currentState = state.tagOpen;
          str = str.slice(1);
        } else if (isAlpha(char)) {
          currentState = state.text;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case state.tagOpen: // 标签开始状态
        if (isAlpha(char)) {
          currentState = state.tagName;
          chars.push(char);
          str = str.slice(1);
        } else if (char === '/') {
          currentState = state.tagEnd;
          str = str.slice(1);
        }
        break;
      case state.tagName: // 标签名称状态
        if (isAlpha(char)) {
          chars.push(char); // 标签名称状态下, 缓存当前字符到chars数组
          str = str.slice(1);
        } else if (char === '>') {
          currentState = state.initial;
          // 创建一个Token标签
          tokens.push({ type: 'tag', name: chars.join('') });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case state.text: // 文本状态
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === '<') {
          currentState = state.tagOpen; // 遇到 <, 文本内容识别完成
          tokens.push({ type: 'text', content: chars.join('') });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
      case state.tagEnd: // 标签结束状态
        if (isAlpha(char)) {
          currentState = state.tagEndName;
          chars.push(char);
          str = str.slice(1);
        }
        break;
      case state.tagEndName: // 结束标签名称状态
        if (isAlpha(char)) {
          chars.push(char);
          str = str.slice(1);
        } else if (char === '>') {
          currentState = state.initial;
          tokens.push({ type: 'tagEnd', name: chars.join('') });
          chars.length = 0;
          str = str.slice(1);
        }
        break;
    }
  }

  return tokens;
}

// const tokens = tokenize('<p>Vue</p>');
// console.log('tokens', tokens);
