#!/usr/bin/env node

import chalk from 'chalk'
import fs from 'fs'
import ini from 'ini'
import inquirer from 'inquirer'
import path, { dirname } from 'path'
import shell from 'shelljs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 *
 * @returns lint
 */
export function getNeedLint() {
  const lastLint = getCache('lint') || 'yes'
  const lintList = [
    'yes',
    'no'
  ]
  return inquirer
  .prompt([
    {
      type: 'list',
      name: 'lint',
      message: '是否需要 lint ? ：',
      choices: lintList,
      pageSize: lintList.length,
      default: lintList.indexOf(lastLint),
    },
  ])
  .then((answer) => {
    setCache('lint', lintList.indexOf(answer.lint))
    return answer.lint
  })
  .catch((ex) => {
    console.log(ex)
  })
}

/**
 * 选择 remote 仓库，会记录到缓存文件中。
 * @returns
 */
export function getGitRemote() {
  const lastRemote = getCache('remote')
  // 获取所有可用 remote
  const configPath = path.resolve(__dirname, '../../.git/config')
  if (!fs.existsSync(configPath)) {
    return 'origin'
  }
  const config = fs.readFileSync(configPath, 'utf-8')
  const configInfo = ini.parse(config)
  const remoteList = []
  const choices = []

  Object.keys(configInfo).forEach((key) => {
    if (key.startsWith('remote ')) {
      const remote = key.split('"')[1]
      remoteList.push(remote)
      choices.push(remote, new inquirer.Separator())
    }
  })

  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'remote',
        message: '选择 remote ：',
        choices: remoteList,
        pageSize: choices.length,
        default: remoteList.indexOf(lastRemote),
      },
    ])
    .then((answer) => {
      setCache('remote', answer.remote)
      return answer.remote
    })
    .catch((ex) => {
      console.log(ex)
    })
}

export function getType() {
  const lastCommitType = getCache('commitType')
  const commitType = [
    'feat 新特性、新功能',
    'build 编译相关的修改，例如发布版本、对项目构建或者依赖的改动',
    'chore 其他修改, 比如改变构建流程、或者增加依赖库、工具等',
    'ci 持续集成修改',
    'docs 文档修改',
    'fix 修改bug',
    'perf 优化相关，比如提升性能、体验',
    'refactor 代码重构',
    'revert 回滚到上一个版本',
    'style 代码格式修改, 注意不是 css 修改',
    'test 测试用例修改',
  ]

  const choices = []

  commitType.forEach((type) => {
    choices.push(type, new inquirer.Separator())
  })

  return inquirer
    .prompt([
      {
        type: 'list',
        name: 'commitType',
        message: '选择提交类型：',
        choices: commitType,
        pageSize: choices.length,
        default: lastCommitType || 0,
      },
    ])
    .then((answer) => {
      const commitTypeContent = answer.commitType.split(' ')[0]
      commitType.forEach((type, i) => {
        if (type.split(' ')[0] === commitTypeContent) {
          setCache('commitType', i)
        }
      })
      return commitTypeContent
    })
    .catch((ex) => {
      console.log(ex)
    })
}

export function getScope() {
  return inquirer
    .prompt([
      {
        type: 'input',
        name: 'scope',
        message:
          'commit 影响的范围，比如数据层、控制层、视图层等等，视项目不同而不同(可具体到某个文件), 可直接回车为空: ',
        validate() {
          return true
        },
      },
    ])
    .then((answer) => {
      return answer.scope
    })
    .catch((ex) => {
      console.log(ex)
    })
}

export function getCommitMsg() {
  const lastCommitMsg = getCache('commitMsg')
  const tipMsg = lastCommitMsg ? '直接回车使用上次提交信息' : '不能为空'
  const config = {
    type: 'input',
    name: 'bio',
    message: `本次提交信息,${tipMsg}: `,
    validate(text) {
      // console.log(text)
      if (text.trim() === '') {
        return '不能为空'
      }
      if (text !== lastCommitMsg) setCache('commitMsg', text)
      return true
    },
  }

  if (lastCommitMsg) {
    config.default = lastCommitMsg
  }

  return inquirer
    .prompt([config])
    .then((answer) => {
      return answer.bio
    })
    .catch((ex) => {
      console.log(ex)
    })
}

/**
 * 添加缓存信息文件到 gitignore
 */
export function ignoreAddCommitCache() {
  const gitignorePath = path.join(__dirname, '.gitignore')
  let gitignoreObj
  try {
    const gitignore = fs.readFileSync(gitignorePath, 'utf8')
    gitignoreObj = ini.parse(gitignore)
  } catch (error) {
    console.log(error)
    gitignoreObj={}
  }
  let hasAdd = false
  Object.keys(gitignoreObj).forEach((key) => {
    if (~key.indexOf('.commitCache.json')) {
      console.log(key)
      hasAdd = true
    }
    console.log(chalk.gray(`${key}`))
  })
  console.log(chalk.red(hasAdd))
  if (!hasAdd) {
    fs.appendFile(
      gitignorePath,
      `
# 提交脚本缓存记录
/scripts/commit/.commitCache.json`,
      (err) => {
        if (err) {
          console.error(err)
          return
        }
      },
    )
  }
}

/**
 * 获取当前分支
 * @returns branchName 当前分支名称
 */
 export function getGitBranch() {
  const res = shell.exec('git rev-parse --abbrev-ref HEAD');
  return res.stdout;
}

/**
 * 根据 key 获取本地缓存信息
 * @param key - string 缓存信息的 key
 * @returns value - string 缓存信息的 value
 */
export function getCache(key) {
  const cachePath = path.resolve(__dirname, './.commitCache.json')
  if (!fs.existsSync(cachePath)) {
    return null
  }
  const cache = fs.readFileSync(cachePath, 'utf-8')
  const cacheInfo = JSON.parse(cache)
  return cacheInfo[key]
}

/**
 * 根据 key 设置本地缓存信息
 * @param key - string 缓存信息的 key
 * @param value - string 缓存信息的 value
 * @returns value - string 缓存信息的 value
 */
export function setCache(key, value) {
  const cachePath = path.resolve(__dirname, './.commitCache.json')
  let cache = {}

  if (fs.existsSync(cachePath)) {
    cache = fs.readFileSync(cachePath, 'utf-8')
  }
  let cacheInfo = {}
  try {
    cacheInfo = JSON.parse(cache)
  } catch (error) {
    console.log('.commitCache 内不是 json 格式')
  }
  cacheInfo[key] = value
  fs.writeFileSync(cachePath, JSON.stringify(cacheInfo, null, 2))
}
