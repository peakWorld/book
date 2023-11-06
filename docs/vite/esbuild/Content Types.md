Content Types
每种内容类型都有一个关联的“加载器”，告诉esbuild如何解释文件内容。

# JavaScript
默认对 .js、.cjs 和 .mjs 文件启用; .cjs扩展名是node用于CommonJS模块，.mjs扩展名是node用于ECMAScript模块。

注: esbuild支持所有现代JavaScript语法, 默认情况下，esbuild的输出将利用所有现代JS功能; 然而，较新的语法可能不受较旧浏览器的支持，因此需要配置target选项.

## JavaScript caveats

* ES5 is not supported well
尚不支持将ES6+语法转换为 ES5。然而，如果使用esbuild转换ES5代码，仍应将目标设置为es5。这可以防止esbuild将ES6语法引入ES5代码中。

* Private member performance
私有成员转换（针对 #name 语法）使用 WeakMap 和 WeakSet 来保留此功能的隐私属性。在此语法转换的情况下, 创建许多具有私有字段或私有方法的类实例可能会给垃圾回收器带来很多开销。

注: 大型 map 对象可能会导致垃圾回收的性能问题

* Imports follow ECMAScript module behavior
在导入需要全局状态的模块之前修改全局状态，是行不通的。因为esbuild实际上会将所有导入语句“提升”到文件的顶部。

* Avoid direct eval when bundling
使用 eval(x) 意味着在x中的求值代码可以通过名称引用任何包含作用域中的任何变量。