* zsh配置安装后, 但是切换用户失效
1. 执行命令 `vim ~/.bashrc`
2. 在文件尾部加上以下代码
```bash
  # Launch Zsh
  if [ -t 1 ]; then
  exec zsh
  fi
```