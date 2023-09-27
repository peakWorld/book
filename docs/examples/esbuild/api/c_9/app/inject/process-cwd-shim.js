let processCwdShim = () => '';

export {
  // 将全局'process.cwd'替换为processCwdShim
  processCwdShim as 'process.cwd'
}