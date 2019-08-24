#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# 生成静态文件
yarn docs:build

# 生成文档
(cd docs/.vuepress/dist &&
  echo 'surgio.royli.dev' > CNAME &&
  git init &&
  git add -A &&
  git commit -m 'deploy docs' &&
  git push -f git@github.com:geekdada/surgio.git master:gh-pages)

# Clean up
rm -rf docs/.vuepress/dist
