import url from './btn.png'
let image = new Image
image.src = url
document.body.appendChild(image)

import svg from './btn.svg'
let doc = new DOMParser().parseFromString(svg, 'application/xml')
let node = document.importNode(doc.documentElement, true)
document.body.appendChild(node)

export default class Home {
  static age = 12
  public sex = 1
}

console.log('png', url)
console.log('svg', svg)