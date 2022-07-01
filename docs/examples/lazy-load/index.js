const dom = document.querySelector('#root')

let text = ''
for (let i = 0; i < 9; i ++) {
  text += `<img src="./demo.jpg" data-src="${i+1}.jpg"/>`
}
dom.innerHTML = text

const imgs = document.querySelectorAll('img')
const viewHeight = document.documentElement.clientHeight || window.innerHeight
let num = 0

function lazyload () {
  for (let i = num, len = imgs.length; i < len; i++) {
    const imgDom = imgs[i]
    const top = imgDom.getBoundingClientRect().top
    if (viewHeight - top >= 0) {
      const realSrc = imgDom.getAttribute('data-src')
      imgDom.setAttribute('src', `./${realSrc}`)
    }
  }
}

document.addEventListener('scroll', lazyload, false)