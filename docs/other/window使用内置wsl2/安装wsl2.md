1. 按照文章安装wsl2，安装ubuntu 
```
  https://docs.microsoft.com/zh-cn/windows/wsl/install-win10#step-2---update-to-wsl-2
```

2. 安装Oh-My-Zsh
```
  1. 安装 sudo apt install zsh
  2. 将 zsh-install.sh文件拷贝到 ~/ 下
  3. sh zsh-install.sh
  4. 修改主题为 ys
```

3. 安装nvm
```
 https://github.com/nvm-sh/nvm#troubleshooting-on-linux

 将下面配置 复制到 .zshrc文件下

  # nvm配置
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
  # nvm 下载node配置
  export NVM_NODEJS_ORG_MIRROR=https://npm.taobao.org/mirrors/node

```

4. 安装go
```
https://docs.studygolang.com/doc/install
```

5. 问题
```
关闭 Hyper-v后, 打不开wsl2
https://blog.csdn.net/KindSuper_liu/article/details/112316734

在window中管理员执行 Hyper-V.md文件
```