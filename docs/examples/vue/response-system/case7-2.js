const { effect, ref } = VueReactivity;

function createRender() {
  function mountElement(vnode, contaier) {
    // Q1 存在大量依赖于浏览器的API
    const el = document.createElement(vnode.type); // 创建dom元素
    if (typeof vnode.children === 'string') {
      el.textContent = vnode.children;
    }
    contaier.appendChild(el); // 将元素添加到容器中
  }

  // n1 旧vnode; n2 新vnode; contaier 容器
  function patch(n1, n2, contaier) {
    if (!n1) {
      // n1不存在, 挂载操作
      mountElement(n2, contaier);
    } else {
      // n1存在, 需要打补丁; 比较新旧vnode的差异
    }
  }

  function render(vnode, contaier) {
    if (vnode) {
      patch(contaier._vnode, vnode, contaier); // 新vnode存在, 将其与旧vnode一起传给patch函数, 进行打补丁
    } else {
      if (contaier._vnode) {
        // 旧vnode存在, 且新vnode不存在, 说明是卸载操作; 清空contaier内的DOM
        contaier.innerHTML = '';
      }
    }
    contaier._vnode = vnode;
  }
  function hydrate(vnode, contaier) {} // 服务端渲染
  return { render, hydrate };
}

// S1 用法
// const renderer = createRender();
// renderer.render(oldVnode, document.getElementById('#app')); // 首次渲染(挂载, 特殊打补丁)
// renderer.render(newVnode, document.getElementById('#app')); // 第二次渲染(打补丁, 试图找到并更新变更点)

// S2 渲染节点
const vnode = { type: 'h1', children: 'hello' };
const renderer = createRender();
renderer.render(vnode, document.getElementById('app'));
