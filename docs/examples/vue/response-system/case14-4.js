// A1 进场状态
// 创建DOM元素
const el = document.createElement('div');
el.classList.add('box');
// 在DOM元素被添加前, 定义元素的初始状态和运动过程
el.classList.add('enter-from');
el.classList.add('enter-active');

document.body.appendChild(el);

// 切换状态
// 直接绘制enter-to类的样式, 没有过渡效果；因为浏览器会在当前帧绘制DOM元素
// el.classList.remove('enter-from');
// el.classList.add('enter-to');

// 下一帧执行状态切换
requestAnimationFrame(() => {
  el.classList.remove('enter-from');
  el.classList.add('enter-to');

  el.addEventListener('transitionend', () => {
    el.classList.remove('enter-to');
    el.classList.remove('enter-active');
  });
});

// A2 离场状态
el.addEventListener('click', () => {
  // 当元素卸载时, 不要将其立即卸载；而是等待过渡效果结束后再卸载
  const performRemove = () => el.parentNode.removeChild(el);

  // 设置初始状态
  el.classList.add('leave-from');
  el.classList.add('leave-active');

  // 强制reflow: 使初始状态生效
  document.body.offsetHeight;

  // 在下一帧切换状态
  requestAnimationFrame(() => {
    // 切换到结束状态
    el.classList.remove('leave-from');
    el.classList.add('leave-to');

    el.addEventListener('transitionend', () => {
      el.classList.remove('leave-to');
      el.classList.remove('leave-active');
      // 过渡完成, 移除Dom元素;
      performRemove();
    });
  });
});
