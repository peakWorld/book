// 先比对新老树, 得出pacthes
// 再用patches 来修改旧树

class Element {
  constructor (type, props, children) {
    this.type = type
    this.props = props
    this.children = children
  }
}

class VDom {

  static setAttr (node, key, val) {
    const tag = node.tagName.toLowerCase()
    if (/^on[a-z]*/.test(key)) { // 事件绑定
      node[key] = val
    } else if (tag === 'input' && key === 'value') { // form表单元素
      node.value = val
    } else if (key === 'style') { // 样式
      node.style.cssText = val
    } else {
      node.setAttribute(key, val)
    }
  }

  static render (vNode) {
    const { type, props, children } = vNode
    const ele = document.createElement(type)
    for (let key of props) {
      this.setAttr(ele, key, props[key])
    }
    children.forEach((child) => {
      const node = child instanceof Element ? this.render(child) : document.createTextNode(child)
      ele.appendChild(node)
    })
  }
}


class Diff {

  constructor () {
    this.index = 0
    this.patchIndex = 0
    this.patches = {}
  }

  getPatches (current, next) {
    this.index = 0
    this.compare(current, next)
    return this.patches
  }

  compare (current, next) { // 旧树节点一定存在
    const tmpPatches = []
    
    if (!next) { // 1. 新树不存在
      tmpPatches.push({ type: 'remove' })
    } else if (typeof current === 'string' && typeof next === 'string') {
      if (current !== next) tmpPatches.push({ type: 'text', payload: next })
    } else if (current.type === next.type) {
      this.compareAttr(current.props, next.props, tmpPatches)
      this.compareChildren(current, next)
    } else {
      tmpPatches.push({ type: 'replace', payload: next })
    }
    if (tmpPatches.length) {
      this.patches[this.index] = tmpPatches
    }
  }

  compareAttr(oldProps, newProps, patches) {
    for (let key in oldProps) {
      if (!newProps.hasOwnProperty(key)) { // 旧属性存在, 新属性不存在; 删除旧的属性
        patches.push({ type: 'attr', payload: { key, val: undefined }})
      } else if (oldProps[key] !== newProps[key]) { // 旧、新属性都存在, 但值不同, 替换值
        patches.push({ type: 'attr', payload: { key, val: newProps[key] }})
      }
    }

    for (let key in newProps) {
      if (!oldProps.hasOwnProperty(key)) { // 新属性存在, 旧属性不存在; 新增属性
        patches.push({ type: 'attr', payload: { key, val: newProps[key] }})
      }
    }
  }

  compareChildren (current, next) {
    const oldChildren = current.children
    const newChildren = next.children
    oldChildren.forEach((child, i) => {
      this.index++
      this.compare(child, newChildren[i])
    })
  }

  depatches (node, patches) {
    this.patches = patches
    this.patchIndex = 0
    this.walk(node)
  }

  walk (node) {
    const patches = this.patches[this.patchIndex++]
    const nodes = node.childNodes // text文本也是一个节点。
    nodes.forEach(child => this.walk(child))
    if (patches) {
      doPatch(node, patches)
    }
  }

  doPatch () {
    patches.forEach(patch => {
      switch (patch.type) {
        case 'ATTR':
          for (let key in patch.attr) {
            let value = patch.attr[key];
            if (value) {
              setAttr(node, key, value);
            } else {
              node.removeAttribute(key);
            }
          }
          break;
        case 'TEXT':
          node.textContent = patch.text;
          break;
        case 'REPLACE':
          let newNode = patch.newNode;
          newNode = (newNode instanceof Element) ? VDom.render(newNode) : document.createTextNode(newNode);
          node.parentNode.replaceChild(newNode, node);
          break;
        case 'REMOVE':
          node.parentNode.removeChild(node);
          break;
        default:
          break;
      }
  });
  }
}


const vNode1 = new Element('ul', { class: 'list' }, [
  new Element('li', { class: 'item' }, ['周杰伦']),
  new Element('li', { class: 'item' }, ['周杰伦']),
  new Element('li', { class: 'item' }, ['周杰伦']),
])

const vNode2 = new Element('ul', { class: 'list' }, [
  new Element('li', { class: 'item1' }, ['周杰伦']),
  new Element('li', { class: 'item' }, ['周杰伦2']),
  new Element('li', { class: 'item' }, ['周杰伦']),
  'haha'
])

const diff = new Diff()
console.log(diff.getPatches(vNode1,vNode2))