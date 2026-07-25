# 我每天在用的 8 个命令行小技巧

命令行用得越久，越觉得它像一个被低估的乐器。下面这些是我几乎每天都会用到的随手技巧。

## 1. 用 `tree` 一眼看清目录结构

```bash
tree -L 2 -I 'node_modules|.git'
```

只看两层，并忽略掉噪音目录，复杂项目瞬间清爽。

## 2. 用 `!!` 补齐上一条命令

刚 `apt install` 忘了加 `sudo`？直接：

```bash
sudo !!
```

它会自动把上一条命令补全在后面。

## 3. 用 `Ctrl + R` 反向搜索历史

不用再翻 `history | grep`，按下 `Ctrl + R` 直接输入关键词，命中即回车。

## 4. 用 `awk` 抽列

```bash
ps aux | awk '{print $2, $11}'
```

第二列是 PID，第十一列是命令——排错时特别顺手。

## 5. 用 `jq` 看 JSON

```bash
curl -s https://api.example.com/health | jq '.status'
```

## 6. 用 `fzf` 模糊查找一切

文件、历史、进程，配上模糊搜索，手指几乎不用移动。

## 7. 用 `alias` 把常用命令缩写

```bash
alias ll='ls -lah --color=auto'
alias gs='git status'
```

## 8. 用 `&&` 串起流程

```bash
npm test && npm run build && echo "全部通过 ✅"
```

> 工具的意义不在于多，而在于你真正记住的那几个。

把这些变成肌肉记忆，终端会从「要对抗的东西」变成「顺手的手套」。
