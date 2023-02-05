## 引言
看到[参考链接1](https://www.darraghoriordan.com/2021/11/06/how-to-write-an-eslint-plugin-typescript/)以后，觉得用TS写一个eslint插件应该很简单~~🐔⌨️🍚~~，尝试下来确实如此。

## 前置知识
本文假设
- 你对AST遍历有所了解。
- 你写过单测用例。

## 第一个eslint规则：no-console
为了简单，我们只使用tsc。首先`package.json`需要设置入口`"main": "dist/index.js",`，`tsconfig.json`需要设置`"outDir": "dist"`、`"include": ["src"]`。接下来设计一下单元测试和构建命令：

```json
"scripts": {
  "clean": "rm -Rf ./dist/",
  "build": "yarn clean && mkdir ./dist && tsc",
  "test": "jest",
  "test:help": "jest --help",
  "lint": "eslint \"src/**/*.{js,jsx,ts,tsx}\" \"test/**/*.{js,jsx,ts,tsx}\" \"*.{js,jsx,ts,tsx}\" --fix"
},
```

用`ESLintUtils.RuleTester`写的`.test.ts`用`mocha`或者`jest`都能运行，我选择了`jest`。

当我们运行`yarn lint`时，`node_modules/@eslint/eslintrc/lib/config-array-factory.js`的`this._loadPlugin`会加载插件，相当于在node环境运行上面指定的入口点`dist/index.js`。所以我们需要知道`@eslint`如何描述一个eslint插件，才能写出`src/index.ts`。查看`this._loadPlugin`可知，`plugin.definition`的类型应为：

```ts
type Plugin = {
  configs?: Record<string, ConfigData> | undefined;
  environments?: Record<string, Environment> | undefined;
  processors?: Record<string, Processor> | undefined;
  rules?: Record<...> | undefined;
}
```

结合参考链接1，我们得出结论：一般来说需要提供`rules`和`configs`属性。`rules`可以理解为具体的规则定义；`configs`可以理解为规则的集合，可以称为“最佳实践”，最常见的`configs`是`recommended`。

于是写出`src/index.ts`：

```ts
import rules from './rules';
import configs from './configs';

const configuration = {
  rules,
  configs
};

export = configuration;
```

`src/rules/index.ts`：

```ts
import noConsole from './noConsole';

const allRules = {
  'no-console': noConsole
};

export default allRules;
```

`src/configs/index.ts`：

```ts
import all from './all';
import recommended from './recommended';

const allConfigs = {
  all,
  recommended
};

export default allConfigs;
```

`src/configs/all.ts`：

```ts
export default {
  parser: '@typescript-eslint/parser',
  parserOptions: { sourceType: 'module' },
  rules: {
    '@hans/use-i18n-hans/no-console': 'error'
  }
};
```

我们用`createRule`函数来创建一条规则。它需要传一个对象，我列举一下这个对象常用的几个属性：
- `meta.schema`：配置`eslint`规则的时候可以指定的`options`参数。通常传入的值为`{}`（不接收参数）和`object[]`。
- `meta.messages`：一个对象，`{ messageId: text }`。
- `create`方法：`eslint`需要建立AST并遍历，所以要拿到这个方法的返回值作为遍历AST的配置。输入参数是`context`对象，常用的方法有：`context.options[0]`获取传入的参数；`context.getFilename()`获取当前`yarn lint`正在解析的文件名；`context.report`函数向用户报错，通常这么用：`context.report({ node, messageId: 'xxMessageId' })`，`messageId`必须符合`meta.messages`给出的定义。`create`方法返回的对象有点类似于`@babel/traverse`的`traverse`方法的第二个参数，具体写法看参考链接1的项目就行。

```ts
import { TSESLint, ASTUtils } from '@typescript-eslint/utils';
import createRule from '../utils/createRule';
import path from 'path';
import multimatch from 'multimatch';

// 模仿babel中的写法 import { isIdentifier } from '@babel/types';
const {
  isIdentifier
} = ASTUtils;

const whiteList = ['memory'];

const rule = createRule({
  name: 'no-console',
  meta: {
    docs: {
      description: 'Remember to delete console.method()',
      recommended: 'error',
      requiresTypeChecking: false
    },
    messages: {
      rememberToDelete: 'Remember to delete console.method()'
    },
    type: 'problem',
    schema: {}
  },
  create (
    context: Readonly<TSESLint.RuleContext<'rememberToDelete', never[]>>
  ) {
    return {
      MemberExpression (node) {
        if (isIdentifier(node.object) && node.object.name === 'console' &&
            isIdentifier(node.property) && Object.prototype.hasOwnProperty.call(console, node.property.name) &&
            !whiteList.includes(node.property.name)
        ) {
          context.report({ node, messageId: 'rememberToDelete' });
        }
      }
    };
  }
});

export default rule;
```

代码传送门：`src/rules/noConsole.ts`

## 本地测试
单元测试：

```bash
yarn test
```

### 本地查看效果
首先：

```bash
yarn build
```

在另一个项目（这里用了相对路径，用绝对路径也行）：

```bash
yarn add -D file:../eslint-plugin-use-i18n-hans
```

**注意：每次重新build后都需要在另一个项目重新`yarn add`**

这样会得到：

```json
{
  "devDependencies": {
    "@hans/eslint-plugin-use-i18n-hans": "file:../eslint-plugin-use-i18n-hans",
  }
}
```

接下来配置`.eslintrc.js`：

```js
module.exports = {
  plugins: [
    '@hans/use-i18n-hans',
  ],
  extends: [
    'plugin:@hans/use-i18n-hans/recommended',
  ],
}
```

插件名为`@hans/use-i18n-hans`，使用了`configs`中的`recommended`。

最后重启vscode或运行`yarn lint`就能看到我们的第一个eslint插件生效了。
```
<path>/file-encrypt/webpack-plugin-utils.js
  16:5  error  Remember to delete console.log()  @hans/use-i18n-hans/no-console
```

![第一个eslint插件第一个规则](./README_assets/1-%E7%AC%AC%E4%B8%80%E4%B8%AAeslint%E6%8F%92%E4%BB%B6%E7%AC%AC%E4%B8%80%E4%B8%AA%E8%A7%84%E5%88%99.png)

## no-console规则添加功能：排除用户指定的文件
修改一下`meta.schema`，新增输入参数：

```ts
schema = [
  {
    properties: {
      excludedFiles: {
        type: 'array'
      }
    }
  }
]
```

和对应的类型定义：

```ts
type Options = [{
  excludedFiles: string[];
}];

{
  create (
    context: Readonly<TSESLint.RuleContext<'rememberToDelete', Options>>
  ) {}
}
```

然后在`create`函数体加几句判定：

```ts
const fileName = context.getFilename();
const options = context.options[0] || {};
const { excludedFiles } = options;
if (Array.isArray(excludedFiles)) {
  const excludedFilePaths = excludedFiles.map(excludedFile => path.resolve(excludedFile));
  if (multimatch([fileName], excludedFilePaths).length > 0) {
    return {};
  }
}
```

`context.getFilename()`文档：https://eslint.org/docs/latest/extend/custom-rules#the-context-object。其特性：在`yarn test`时会返回`file.ts`，在作为npm包引入另一个项目后，可以正常获取文件的绝对路径。

为了支持glob语法，我们引入了`multimatch`。但需要**指定版本为5.0.0**，因为`multimatch6.0.0`只支持es module，而我反复尝试都无法找到一个可以生效的`jest`配置（`transformIgnorePatterns`等配置项的资料都极少，[这篇blog](https://www.cnblogs.com/xueyoucd/p/10495922.html)看上去操作性很强，但尝试后依旧无效……）。

构建完成后，我们可以在另一个项目尝试配置`@hans/use-i18n-hans/no-console`规则：

```js
'@hans/use-i18n-hans/no-console': ['error', {
  excludedFiles: [
    'add-copyright-plugin.js',
    'copyright-print.js',
    'webpack-plugin-utils.js',
    'src/utils/my-eslint-plugin-tests/no-warn-folder/**/*.js',
    'tests/**/*.js',
  ],
}],
```

`.eslintrc.js`取消或添加注释并保存，vscode应该能立刻看到报错的产生和消失。

## 发布npm包
TODO

## 参考资料
1. 值得参考的教程：https://www.darraghoriordan.com/2021/11/06/how-to-write-an-eslint-plugin-typescript/