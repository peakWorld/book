// Vue 模板
<div>
  <h1 v-if="ok">Vue Template</h1>
</div>;

// 模板AST
const ast = {
  type: 'Root', // 逻辑根节点
  // 模板真正的根节点
  children: [
    {
      type: 'Element', // div标签节点
      tag: 'div',
      children: [
        {
          type: 'Element', // h1标签节点
          tag: 'h1',
          props: [
            {
              type: 'Directive', // v-if指令节点, 类型Directive代表指令
              name: 'if', // 指令名称为if, 不带有前缀v-
              exp: {
                type: 'Expression', // 表达式节点
                content: 'ok',
              },
            },
          ],
        },
      ],
    },
  ],
};

// 模板AST具有与模板同构的嵌套结构
// 1、通过节点的type属性区分不同类型的节点。
// 2、标签节点的子节点存储在其children数组中。
// 3、标签节点的属性节点和指令节点存储在props数组中。
// 4、不同类型的节点会使用不同的对象属性进行描述。例如: 指令节点拥有name属性(指令名称), 表达式节点拥有content属性(表达式内容)
