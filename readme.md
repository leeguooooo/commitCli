# git commit cli 工具

> 会自动记录上一次操作

![gif](https://pica.zhimg.com/50/v2-4151bc085a160579e7f84aaca436c7ef_r.gif)

yarn add `leeguoo-commit-cli`

## 使用方法

> 在 package.json 中添加 eslint:cache 参数

```
{
  "start":{
    "c": "c",
    "lint:cache": "eslint src --cache --fix --ext .ts,.tsx"
  }
}
```

## 执行

`c` 或者 `commit`

