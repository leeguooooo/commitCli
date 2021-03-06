#!/usr/bin/env node

import chalk from 'chalk'
import shell from 'shelljs'
import {
  getCommitMsg, getGitBranch, getGitRemote, getScope, getType, getNeedLint
} from './tools.mjs'



if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git')
  shell.exit(1)
}

async function run() {
  // 本次提交类型
  const type = await getType()
  // 受影响范围
  const scope = await getScope()
  // 提交信息
  const commitMsg = await getCommitMsg()
  const finalScope = scope.trim() === '' ? '' : `(${scope})`
  // 选择 remote
  const remote = await getGitRemote()
  // 获取 branch
  const branch = await getGitBranch()

  // 是否 lint
  const needLint = await getNeedLint()

  if(needLint === 'yes') {
    console.log(chalk.green(`开始： eslint`))
    const result = shell.exec('npm run lint:cache')
    if (result.code !== 0) {
      console.log(result.stderr)
      return
    }
  }

  shell.exec(`git add .`)

  {
    const commitM = `${type}${finalScope}: ${commitMsg}`
    const result = shell.exec(`git commit -m "${commitM}"`)
    if (result.code !== 0) {
      console.log(result.stderr)
      return
    }
  }

  console.log(chalk.green(`开始执行： git push ${remote} ${branch}`))

  {
    const result = shell.exec(`git push ${remote} ${branch}`)
    if (result.code !== 0) {
      console.log(result.stderr)
      return
    }
  }

  console.log(chalk.green('本次提交成功！'))
}

run()
