<!-- https://esbuild.github.io/getting-started/ -->

❓ 代表疑惑。
文件(代码)编码
  format
路径解析(文件引入)
  conditions/Main fields 即package.json中字段配置
  import/require 即文件加载方式

platform
  平台的默认配置(可覆盖)、专属设置。

# 基础

* 打包用于浏览器的代码[c1_2]
默认情况下，打包器会输出用于浏览器的代码。

esbuild在没有任何配置的情况下，仅通过使用.jsx扩展名，就将JSX语法转换为JavaScript; 想在.js文件中使用JSX语法，可以使用--loader:.js=jsx标志通知esbuild

* 打包用于node的代码[c1_3]
在使用node时不需要打包程序，但有时在运行代码之前使用esbuild处理代码仍然会有益处。

打包可以自动剥离TypeScript类型，将ECMAScript模块语法转换为CommonJS，并将较新的JavaScript语法转换为特定版本的node的较旧语法; 可以减小下载大小，并且在加载时从文件系统中读取的时间也会更少。

所有内置于node中的包，例如fs，都会自动标记为外部包，因此esbuild不会尝试打包它们; 还禁用了package.json中的browser字段的解释。

注: 设置`packages=external`, 捆绑包中不再包含依赖项; 那么在运行时仍必须在文件系统上存在这些依赖项; 与平台无关。

# API

## esbuild.build [c2_1]
高级使用build API需要设置一个长时间运行的构建上下文。 使用给定上下文进行的所有构建都共享相同的构建选项，并且后续的构建是增量进行的（即它们重用以前构建的一些工作以提高性能）

* Watch mode
告诉esbuild监视文件系统，并在您编辑并保存可能使构建无效的文件时自动重构。

* Serve mode
启动一个本地开发服务器，用于提供最新构建结果。传入的请求会自动触发新的构建，因此当您在浏览器中重新加载页面时，您的Web应用程序始终是最新的。

* Rebuild mode
允许手动调用构建。在将esbuild与其他工具集成时非常有用（例如，使用自定义文件监视器或开发服务器，而不是esbuild内置的工具）

## esbuild.transform [c2_2]
构建的一种有限特殊情况，它将代表内存中的代码字符串在与任何其他文件完全隔离的环境中进行转换。

## 特定细节 【c2_3】
esbuild的JS API有异步和同步两种版本。

* 异步API
建议使用，因为它适用于所有环境，而且速度更快、功能更强大。

优点：可以使用异步API与插件一起使用; 当前线程不会被阻塞，因此可以同时执行其他工作； 可以同时运行许多esbuild API调用，这些调用会在所有可用的CPU上分布，以实现最大性能

缺点：使用promises可能会导致代码混乱，特别是在CommonJS中，因为顶级等待不可用；在必须同步的情况下不起作用，例如在require.extensions中。

* 同步API
仅在node中工作，并且只能完成某些操作，但在某些特定的node情况下有时是必要的。

优点：避免使用promises可能会导致更清晰的代码，特别是当顶级等待不可用时；在必须同步的情况下工作，例如在require.extensions中。

缺点：您无法使用同步API与插件一起使用，因为插件是异步的；阻塞了当前线程，因此不能同时执行其他工作；使用同步API会阻止esbuild并行化esbuild API调用。

## 在浏览器中 【c2_4】
esbuild API也可以在浏览器中使用Web Worker中的WebAssembly运行。需要安装esbuild-wasm包，而不是esbuild包

# General options

## Bundle [Build][c3_1]
打包一个文件意味着将任何导入的依赖项内联到文件本身中。此过程是递归的，因此依赖项的依赖项（以此类推）也将被内联。
默认情况下，esbuild不会打包输入文件, 必须显式启用打包.

注: 打包与文件串联不同。启用打包后将多个输入文件传递给esbuild将创建多个单独的包，而不是将输入文件连接在一起。要使用esbuild将一组文件连接在一起，请将它们全部导入单个入口点文件，并仅使用esbuild打包该文件。
注: 开启tree-shake

* 不可分析(Non-analyzable)导入
打包是编译时操作，esbuild不支持所有形式的运行时路径解析。
仅当导入路径为字符串文字或通配符模式时，才会将其打包在一起。其他形式的导入路径不会被打包，而是在生成的输出中保留原样。
```js
// 可分析的导入（将由esbuild打包）
import 'pkg';
import('pkg');
require('pkg');
import(`./locale-${foo}.json`);
require(`./locale-${foo}.json`);

// 不可分析的导入（将不会被esbuild打包）
import(`pkg/${foo}`);
require(`pkg/${foo}`);
['pkg'].map(require);
```

解决的方法: 将包含此问题代码的软件包标记为外部的，以便不包含在包中。然后，确保外部包的副本在运行时可用于打包代码。

运行时文件系统(仿真): 某些打包工具（如Webpack）尝试通过将所有潜在可达的文件包含在包中，然后在运行时模拟文件系统来支持所有形式的运行时路径解析。

* 通配符模式(Glob-Style)导入
在某些情况下，可以将在运行时评估的导入路径打包。但是导入路径表达式必须是字符串连接的形式，并且必须以./或../开头; 字符串连接链中的每个非字符串表达式都成为通配符模式中的通配符。
```js
// 两种形式
// kind 就是非字符串表达式, 即通配符
const json1 = require('./glob/' + kind + '.json')
const json2 = require(`./glob/${kind}.json`)
```
执行此操作时，esbuild将搜索与模式匹配的所有文件，并将路径到打包模块的映射一起包含在捆绑包中。
```js
// 路径到捆绑模块的映射
var globRequire_glob_a__js = __glob({
  "./glob/a_1.js": () => require_a_1(),
  "./glob/a_2.js": () => require_a_2()
});

// 导入表达式
globRequire_glob_a__js(`./glob/a_${kind}.js`);

// 在捆绑包中, 导入表达式被替换为查找映射中的相应模块
```
减少esbuild执行的文件系统I/O量的两种方法：
1、将要导入的所有文件放在一个目录中，然后在模式中包含该目录。这限制了esbuild只在该目录内搜索。
2、防止esbuild搜索任何子目录。例如'./data/' + x + '.json'将与任何子目录中的任何内容匹配x，而'./data-' + x + '.json'将仅与顶级目录中的任何内容匹配x（但不在任何子目录中）。

## Cancel [Build][c3_2]
使用 rebuild 手动调用增量构建时，可能需要使用取消 API 来提前结束当前的构建，以便开始新的构建。

确保在开始新的构建之前取消操作已经完成，否则下一个重建将给你刚刚取消的仍未结束的构建。

## Live reload [Build][c3_3]
实时重新加载(刷新页面)是一种开发方法，可以在浏览器和代码编辑器同时打开并可见的情况下使用。当您编辑并保存源代码时，浏览器会自动重新加载，重新加载的应用程序版本包含您所做的更改。

* 注意事项
1、esbuild的输出发生变化时，这些事件才会触发; 与构建无关的文件发生变化时，它们不会触发。
2、浏览器厂商已经决定不在没有TLS的情况下实现HTTP/2; 而每个域名下HTTP/1.1只能建立6个链接, /esbuild 将占用一个; 如果打开了超过六个使用这种实时重新加载技术的HTTP选项卡，将在其中一些选项卡中无法使用实时重新加载。解决方法是启用https协议。

* CSS热重载
更改事件还包含额外的信息，以支持更高级的用例。包含了自上次构建以来已更改的文件的路径(添加、删除和更新数组)
```js
interface ChangeEvent {
  added: string[]
  removed: string[]
  updated: string[]
}
```

* Js热重载
esbuild尚未实现JavaScript的热重载。由于CSS是无状态的，可以透明地实现CSS的热重载，但JavaScript是有状态的，因此无法像CSS那样透明地实现JavaScript的热重载。

在esbuild的实时重新加载中，可以将应用程序当前的JavaScript状态保存在sessionStorage中，以便在页面重新加载后更轻松地恢复应用程序的JavaScript状态。如果应用程序加载速度很快，那么使用JavaScript进行实时重新加载几乎可以像使用JavaScript进行热重载一样快。

## Platform [Build & Transform][c3_4]
默认情况下，esbuild的打包器配置为生成面向浏览器的代码。如果打包的代码是为了在Node.js环境中运行，应该将平台设置为node。

* browser[默认]
1. (启用打包)默认的输出格式设置为iife，即 `format: 'iife'`。
2. 如果一个包在package.json文件中为browser字段指定了一个映射，esbuild将使用该映射将特定文件或模块替换为其适用于浏览器的版本。
3. mainFields 默认设置为 browser,module,main
- 特殊行为：如果一个包提供了module和main入口点，但没有browser入口点，那么当该包使用require导入时，将使用main替代module。[参考](https://github.com/SunshowerC/blog/issues/8)
4. conditions 自动包含browser条件。
5. 如果没有自定义conditions，还将包括特定于 Webpack 的module条件(为 CommonJS 文件提供可tree shaking的ESM替代方案)
6. 在使用build API时，如果启用了所有minify选项，则所有process.env.NODE_ENV表达式都自动定义为 "production"，否则为 "development"。
- 注: 只有在 process、process.env 和 process.env.NODE_ENV 尚未定义时，才会发生这种替换。为了避免基于 React 的代码立即崩溃。
7. 在JavaScript代码中，字符序列</script>将被转义；在CSS代码中，字符序列</style>将被转义。这样做是为了防止将esbuild的输出直接内联到HTML文件中。

* node
1. (启用打包)默认输出格式设置为cjs，即 `format: 'cjs'`。
2. 所有内置的 node 模块（如 fs）都会自动标记为外部模块。
3. mainFields 设置为 main,module。
- 注: 对于同时提供module和main的包，tree shaking可能不会发生，因为tree shaking适用于ECMAScript模块，而不适用于CommonJS模块。
4. conditions 自动包含node条件。
5. 如果没有自定义conditions，还将包括特定于 Webpack 的module条件。
6. 当格式(format)设置为cjs但入口点为ESM时，esbuild将为任何命名导出添加特殊注释，以便使用ESM语法从生成的CommonJS文件中导入这些命名导出。[参考](https://nodejs.org/api/esm.html#commonjs-namespaces)

* neutral
1. (启用打包)默认输出格式设置为 esm。
2. 默认情况下，mainFields 设置为空。
3. conditions 不会自动包含任何特定于平台的值。

## Rebuild [Build][c3_5]
涉及使用相同选项反复调用 esbuild 的构建 API，可使用 Rebuild API; 重新构建比再次构建更高效，因为一些先前构建的数据被缓存，如果原始文件自上次构建以来未发生更改，可以重复使用。

* 缓存形式
1、文件存储在内存中，如果文件元数据自上次构建以来未更改，将不会从文件系统中重新读取。此优化仅适用于文件系统路径。它不适用于由插件创建的虚拟模块。
2、已解析的 AST 存储在内存中，如果文件内容自上次构建以来未更改，将避免重新解析 AST。除了文件系统模块外，此优化还适用于由插件创建的虚拟模块，只要虚拟模块路径保持不变。

## Serve [Build][3_6]
每个传入请求在尚未进行中时启动重建，然后在提供文件之前等待当前重建完成，esbuild 永远不会提供陈旧的构建结果。
其他开发设置可能不是这样: 一个常见的设置是运行一个本地文件监视器，每当输入文件更改时，它会重新构建输出文件，然后单独运行一个本地文件服务器来提供这些输出文件。但这意味着如果重建尚未完成，编辑后重新加载可能会重新加载旧的输出文件。

* Arguments
1、host 默认情况下，esbuild 使 Web 服务器在所有 IPv4 网络接口上可用。这对应于主机地址 0.0.0.0。
2、port 可以在此处选择性地配置 HTTP 端口。如果省略，默认开放端口，优先选择 8000 到 8009 范围内的端口。
3、servedir 一个额外内容的目录，当传入请求与任何生成的输出文件路径不匹配时，esbuild 的 HTTP 服务器可以提供这些内容，而不是返回 404。这可以将 esbuild 用作通用的本地 Web 服务器。
4、fallback 一个 HTML 文件，当传入请求与任何生成的输出文件路径不匹配时，esbuild 的 HTTP 服务器可以提供此文件，而不是返回 404。可以使用它作为自定义的“未找到”页面; 还可以将其用作单页应用程序的入口点，该应用程序会更改当前 URL，因此需要同时从许多不同的 URL 提供服务。
5、onRequest 这个回调函数会在每个传入请求时调用一次，并提供关于请求的一些信息; 此回调在请求完成后调用。无法使用此回调以任何方式修改请求。

* Enabling HTTPS
1、生成一个自签名证书。有很多方法可以做到这一点。这里有一个方法，假设您已经安装了 openssl 命令：
```sh
openssl req -x509 -newkey rsa:4096 -keyout your.key -out your.cert -days 9999 -nodes -subj /CN=127.0.0.1
```
2、使用 keyfile 和 certfile serve 参数将 your.key 和 your.cert 传递给 esbuild。
3、当您加载页面时，在浏览器中点击通过恐怖警告（自签名证书不安全，但这无关紧要，因为我们只是进行本地开发）。

注意：esbuild 的 HTTPS 支持与安全性无关。在 esbuild 中启用 HTTPS 的唯一原因是因为浏览器使得在不进行这些额外操作的情况下，使用某些现代 Web 功能进行本地开发变得不可能。

* 自定义服务器行为 [3_6_2]
要自定义 esbuild 本地服务器的行为，无法直接挂接到服务器本身。相反，应该通过在 esbuild 前面放置一个代理来自定义行为；代理服务器提供了在请求到达 esbuild 服务器之前以及从 esbuild 服务器返回响应之后，对请求和响应进行自定义处理的能力。
1、注入您自己的 404 页面
2、自定义路由到文件系统上文件的映射
3、将某些路由重定向到 API 服务器，而不是到 esbuild

## Tsconfig [Build][3_7]
通常，构建 API 会自动发现 tsconfig.json 文件并在构建过程中读取其内容。
也可以配置一个自定义的 tsconfig.json 文件来替代；如果需要使用不同设置对相同代码进行多次构建，这可能很有用。

## Watch [Build][3_8]
esbuild 中的 watch 模式是使用轮询而不是操作系统特定的文件系统 API 来实现的，以实现可移植性。
轮询系统: 与传统的一次性扫描整个目录树的轮询系统相比，使用相对较少的 CPU。文件系统仍然会被定期扫描，但每次扫描只检查您文件的随机子集，这意味着在文件更改后不久就会检测到更改，但不一定是立即检测到。

注意: 如果不想使用基于轮询的方法，仍然可以使用esbuild的rebuild API 和 其他的文件监视器库来自己实现 watch 模式。

# Input

## 入口 [Build][4_1]
一个文件数组，每个文件都作为打包算法的输入。输出.js文件
多个入口点: 如果有多个逻辑独立的代码组，例如主线程和工作线程; 具有相对独立的不同区域的应用程序，例如登陆页面、编辑页面和设置页面，那么多个入口点会很有用。
单入口点: 有助于引入关注点分离，并有助于减少浏览器需要下载的不必要代码量。

## Loader [Build & Transform][c4_2]
给定的文件类型配置加载器，使用import语句或require调用加载该文件类型。
必须配置了加载器, 才能加载对应文件。

* transform
仅需要一个加载器，因为不涉及与文件系统的交互，因此不处理文件扩展名。

## Stdin [Build][4_3]
用来在文件系统上根本不存在模块的情况下运行构建;

# Output contents

## Banner [Build & Transform] [5_1]
在生成的JavaScript和CSS文件的开头插入任意字符串, 通常用于插入注释.


## Footer [Build & Transform]
在生成的JavaScript和CSS文件的末尾插入任意字符串.

## Charset [Build & Transform] [5_2]
默认情况下，esbuild的输出仅为ASCII; 任何非ASCII字符都使用反斜杠转义序列进行转义。
1、浏览器默认会误解非ASCII字符，这会引起混淆。必须在HTML中显式添加<meta charset="utf-8">或使用正确的Content-Type标头提供服务，以使浏览器不会破坏您的代码
2、非ASCII字符可能会显著减慢浏览器的解析速度。

注意
1、此标志不适用于注释。在注释中保留非ASCII数据应该没问题，因为即使编码错误，运行时环境也应该完全忽略所有注释的内容。而且，除许可相关的注释外，esbuild都会剔除所有注释。
2、适用于所有输出文件类型。

## Format [Build & Transform] [5_3]
设置生成的JavaScript文件的输出格式。
当没有指定输出格式时，如果启用了打包，esbuild会为您选择一个输出格式；如果禁用了打包，则不进行任何格式转换。

* IIFE
当未指定输出格式、启用打包且平台设置为browser（默认情况下如此）时，将自动启用iife格式。
旨在在浏览器中运行: 将代码包装在函数表达式中可确保代码中的任何变量不会意外地与全局范围内的变量冲突。如果您的入口点具有要作为浏览器中全局变量公开的导出，您可以使用全局名称设置来配置该全局变量的名称。

* CommonJS
当未指定输出格式、启用打包且平台设置为node时，将自动启用cjs格式。
旨在在node中运行: 假定环境包含exports、require和module。具有ECMAScript模块语法的导出的入口点将被转换为一个模块，该模块在exports上为每个导出名称设置一个getter。

* ESM
当未指定输出格式、启用打包且平台设置为neutral时，将自动启用esm格式。
假定环境支持import和export语法。具有CommonJS模块语法的导出的入口点将被转换为module.exports值的单个默认导出。

- esm格式可以在浏览器或节点中使用，但必须将其显式加载为模块。如果从另一个模块导入它，这将自动发生。
1、在browser中，可以使用<script src="file.js" type="module"></script>加载模块。
2、在node中，可以使用node --experimental-modules file.mjs加载模块。注意，除非在package.json文件中配置了"type": "module"，否则节点需要.mjs扩展名;使用esbuild中的out extension设置来自定义esbuild生成的文件的输出扩展名。

## Global name [Build & Transform] [5_4]
此选项仅在格式设置为iife时才有意义。

设置用于存储入口点导出的全局变量的名称; 全局名称还可以是复合属性表达式，在这种情况下，esbuild将生成具有该属性的全局变量。冲突的现有全局变量将不会被覆盖。
这可以用于实现“命名空间”，其中多个独立脚本将其导出添加到同一个全局对象上。

## Legal comments(合法注释) [Build & Transform] [5_5]
一个“合法注释”被认为是JS中的语句级注释或CSS中的规则级注释，其中包含 @license 或 @preserve，或以 //! 或 /*! 开头。
默认情况下，这些注释会保留在输出文件中，因为这符合代码原作者的意图。

* 配置注释行为：
1、none 不保留任何合法注释。
2、inline 保留所有合法注释。
3、eof 将所有合法注释移到文件末尾。
4、linked 将所有合法注释移到 .LEGAL.txt 文件中，并用注释链接它们。
5、external 将所有合法注释移到 .LEGAL.txt 文件中，但不链接它们。

注: 当启用打包时，默认行为是 eof，否则为 inline。
注: 在表达式内部或声明级别的注释不被视为合法注释。

## Line limit [Build & Transform]
为了防止esbuild生成具有非常长行的输出文件，这有助于在实现不佳的文本编辑器中提高编辑性能。将此设置为正整数，以告诉esbuild在行经过该字节数后尽快结束

此设置适用于JavaScript和CSS，并且在禁用缩小化时仍然有效。请注意，打开此设置将使您的文件变大，因为额外的换行符会占用文件中的额外空间（即使在gzip压缩后）。

## Splitting [Build] [5_6]
只适用于esm输出格式。
在跨代码拆分块的import语句中还存在一个已知的排序问题。[issue](https://github.com/evanw/esbuild/issues/399)

1、多个入口之间共享的代码被拆分到一个单独的共享文件中，这两个入口都导入; 如果用户首先浏览一个页面，然后浏览另一个页面，那么如果共享部分已经被下载并被他们的浏览器缓存，就不必从头开始下载第二个页面的所有JavaScript。

2、通过异步import()表达式引用的代码将被拆分到一个单独的文件中，并且只有在执行该表达式时才加载。这使的可以通过仅在启动时下载所需的代码，然后在稍后需要时懒惰地下载其他代码，从而提高应用程序的初始下载时间。

注: 如果未启用代码拆分，import()表达式将变为Promise.resolve().then(() => require())。这仍然保留了表达式的异步语义，但这意味着导入的代码包含在同一个包中，而不是拆分到一个单独的文件。

# Output location

## Allow overwrite [Build] [6_1]
允许输出文件覆盖输入文件。默认情况下不启用此设置，因为这样做意味着覆盖您的源代码，如果您的代码未检入，可能会导致数据丢失。但是支持这个功能可以通过避免使用临时目录来简化某些工作流程。

## Asset names [Build] [6_2]
在加载器配置文件时, 设置生成输出文件的文件名。
使用占位符模板配置输出路径，当生成输出路径时，占位符将被替换为特定于文件的值。

使用四个占位符：
1、[dir] 从包含文件的目录到outbase目录的相对路径。它的目的是通过在输出目录内镜像输入目录结构，使资产输出路径看起来更美观。
2、[name] 不带扩展名的原始文件名。例如，如果资产最初命名为image.png，那么模板中的[name]将被替换为image。使用此占位符并非必要；只是为了提供便于人类阅读的资产名称，以便更容易进行调试。
3、[hash] 文件的内容哈希，用于避免名称冲突。
4、[ext] 文件扩展名（即最后一个.字符后的所有内容）。它可以用于将不同类型的资产放入不同的目录。例如 assets/[ext]/[name]-[hash] 可能将名为image.png的资产写为assets/png/image-CQFGD2NG.png。

## Chunk names [Build] [6_3]
在启用代码拆分时自动生成的共享代码块的文件名.

使用三个占位符：
1、[name] 目前这将始终是 `chunk`，在未来的版本中，此占位符可能会具有其他值。
2、[hash] 代码块的内容哈希。在生成多个共享代码块的情况下，包含此内容是必要的，以便区分不同的代码块。
3、[ext] 这是代码块的文件扩展名（即最后一个.字符后的所有内容）。

注: 代码块路径模板不需要包含**文件扩展名**。在模板替换后，将自动将适当内容类型的配置输出扩展名添加到输出路径的末尾。

注: 此选项仅控制共享代码的自动生成代码块的名称。它不控制与入口点相关的输出文件的名称。这些名称当前是根据原始入口点文件相对于outbase目录的路径确定的，这种行为无法更改。

## Entry names [Build] [6_4]
设置每个输入文件相对应的输出文件的文件名。

使用四个占位符：
1、[dir] 从包含入口点文件的目录到outbase目录的相对路径。它的目的是帮助您避免不同子目录中同名入口点之间的冲突。
- 例如，如果有两个入口src/pages/home/index.ts和src/pages/about/index.ts，outbase目录是src，入口名称模板是[dir]/[name]，输出目录将包含pages/home/index.js和pages/about/index.js。如果入口名称模板只是[name]，那么打包将失败，因为输出目录中将有两个具有相同输出路径index.js的输出文件。

2、[name] 不带扩展名的入口原始文件名。例如，如果输入入口点文件名为app.js，那么模板中的[name]将被替换为app。
3、[hash] 输出文件的内容哈希，可以用于充分利用浏览器缓存。将[hash]添加到入口点名称意味着esbuild将计算一个与相应输出文件（以及任何输出文件导入的文件，如果代码拆分处于活动状态）的所有内容相关的哈希。
- 哈希的设计是仅在与该输出文件相关的任何输入文件更改时才更改。
- 可以让Web服务器告诉浏览器将这些文件缓存到永远（实际上，您可以说它们在很长一段时间后过期，例如一年）。然后，可以使用元文件中的信息来确定哪个输出文件路径对应于哪个输入入口，以便知道在<script>标签中包含哪个路径。

4、[ext] 这是入口点文件将写入的文件扩展名（即out extension设置，而不是原始文件扩展名）。它可以用于将不同类型的入口点放入不同的目录。

## Out extension [Build] [6_5]
自定义esbuild生成的文件的文件扩展名，将其更改为除.js或.css之外的其他扩展名。
特别是，.mjs和.cjs文件扩展名在节点中具有特殊含义（它们分别表示ESM格式和CommonJS格式的文件）。

## Outdir [Build]
如果输出目录尚不存在，将生成输出目录，但如果已经包含一些文件，则不会清除它。
任何生成的文件将静默覆盖具有相同名称的现有文件。如果希望输出目录仅包含当前esbuild运行中的文件，则应在运行esbuild之前自行清除输出目录。

如果构建包含位于单独目录中的多个入口点，则目录结构将从所有输入入口点路径中的最低公共祖先目录开始复制到输出目录中。

## Outfile [Build]
构建操作的输出文件名。这仅适用于具有单个入口点的情况; 如果有多个入口点，必须使用outdir选项来指定输出目录。

## Outbase [Build] [6_6]
构建包含位于单独目录中的多个入口点，那么目录结构将相对于outbase目录复制到输出目录中。

例如，如果有两个入口点app/outbase/home/index.ts和app/outbase/about/index.ts，以及outbase目录为app，那么输出目录将包含outbase/home/index.js和outbase/about/index.js。

## Public path [Build] [6_7]
与外部文件加载器结合使用时，这非常有用。公共路径选项允许将基本路径添加到此加载器加载的每个文件的导出字符串之前。

## Write [Build] [6_8]
构建API调用可以直接写入文件系统，也可以将要写入的文件作为内存缓冲区返回。默认情况下，CLI和JavaScript API会写入文件系统，而Go API则不会。

# Path resolution

## Alias [Build] [7_1]
在打包时用一个包替换另一个包.
在esbuild的所有其他路径解析逻辑之前，首先进行这些新的替换; 一个用例是将仅适用于node的包替换为适用于浏览器的包，这些包位于无法控制的第三方代码中.

注意: 当使用别名替换导入路径时，生成的导入路径是在工作目录中解析的，而不是在包含导入路径的源文件所在的目录中解析。

## Conditions [Build] [7_2]
解释 package.json 中的 exports 字段。可以使用 conditions 设置添加自定义条件; 可以指定任意数量的条件，对于这些条件的含义完全取决于包的作者。

* How conditions work
允许在不同情况下将相同的导入路径重定向到不同的文件位置。包含条件和路径的重定向映射存储在包的 package.json 文件的 exports 字段中。

内置了五个具有特殊行为的条件(Conditions, 且无法禁用)
1、default 该条件始终处于活动状态。旨在最后提供回退选项，以便在没有其他条件适用时使用。当在本机运行代码时，该条件也处于活动状态。
2、import 该条件仅在导入路径来自 ESM 导入语句或 import() 表达式时处于活动状态。它可用于提供特定于 ESM 的代码。当在本机运行代码时，该条件也处于活动状态（但仅在 ESM 上下文中）。
3、require 该条件仅在导入路径来自 CommonJS require() 调用时处于活动状态。它可用于提供特定于 CommonJS 的代码。当在本机运行代码时，该条件也处于活动状态（但仅在 CommonJS 上下文中）。
4、browser 该条件仅在 esbuild 的 platform 设置为 browser 时处于活动状态。它可用于提供特定于浏览器的代码。当在本机运行代码时，该条件**不处于活动状态**。
5、node 该条件仅在 esbuild 的 platform 设置为 node 时处于活动状态。它可用于提供特定于 node 的代码。当在本机运行代码时，该条件也处于活动状态。

6、module 当平台设置为浏览器或 Node，且未配置自定义条件时; 如果配置了任何自定义条件（即使是一个空列表），那么这个条件将不再自动包含：
注: 用来告诉 esbuild 在打包时为给定的导入路径选择 ESM 变体，以提供更好的 tree-shaking。这个条件在本地运行代码时不会生效，它是专门针对打包工具的，并源于 Webpack。

## External(外部文件|路径) [Build] [7_3]
将一个文件或一个包标记为外部文件，以将其排除在构建之外。这个文件或包的导入将会被保留（对于 iife 和 cjs 格式使用 require，对于 esm 格式使用 import），并且将在运行时进行加载，而不是被打包进构建文件中。

* 通配符 `*`
在外部路径中使用 * 通配符，将匹配该模式的所有文件标记为外部文件;
```js
// external: ['*.png', '/images/*'],
// 使用 .png 来移除所有的 .png 文件，或者使用 /images/ 来移除所有以 /images/ 开头的路径。
```

外部路径在路径解析之前和之后都会被应用，这使得可以匹配源代码中的导入路径和绝对文件系统路径。
如果外部路径在任一情况下匹配，则该路径被视为外部路径。
1、在路径解析开始之前，会将导入路径与所有的外部路径进行匹配。此外，如果外部路径看起来像一个包路径（即不以 / 或 ./ 或 ../ 开头），则会检查导入路径是否具有该包路径作为路径前缀。
```js
// @foo/bar 隐含了 @foo/bar/*, 将匹配路径 @foo/bar/baz
// 将标记 @foo/bar 包中的所有路径为外部路径
```
2、路径解析结束后，解析后的绝对路径会与所有不像包路径的外部路径进行匹配（即以 / 或 ./ 或 ../ 开头的路径）。但在检查之前，会将外部路径与当前工作目录连接并标准化，变成一个绝对路径（即使它包含 * 通配符）。
```js
// ./dir/* 将目录 dir 中的所有内容标记为外部路径
// 注: 前导的 ./ 很重要, 因为 dir/* 会被视为一个包路径，在路径解析结束后不会进行检查。
```

## Main fields [Build] [7_4]
主要的JavaScript打包工具，允许指定其他的package.json字段，在解析包时进行尝试决定导入哪个文件。

目前有三个这样的字段在被广泛使用：
1、main 这是与 Node 一起使用的包的标准字段, main已经硬编码到了 Node 的模块解析逻辑中。由于它是为 Node 使用而设计的，因此可以合理地期望该字段中的文件路径是一个 CommonJS 风格的模块。
2、module 这个字段来自于一个关于如何将 ECMAScript 模块集成到 Node 中的提案。因此，可以合理地期望该字段中的文件路径是一个 ECMAScript 风格的模块。尽管这个提案没有被 Node 采纳（Node 使用 "type": "module" 代替），但是它被主要的打包工具采用，因为 ECMAScript 风格的模块可以实现更好的 tree shaking。
注: 一些包错误地将 module 字段用于浏览器特定的代码，将 Node 特定的代码留给了 main 字段。这可能是因为 Node 忽略了 module 字段，而人们通常只使用打包工具来处理浏览器特定的代码。然而，打包 Node 特定的代码也是有价值的（例如，可以减少下载和启动时间），而将浏览器特定的代码放在 module 中的包会阻止打包工具有效地进行 tree shaking。如果你想在包中发布浏览器特定的代码，请使用 browser 字段。
3、browser 这个字段来自于一个提案，允许打包工具将 Node 特定的文件或模块替换为适用于浏览器的版本。它允许你指定一个备用的浏览器特定入口点。

* For package authors
一个包可以同时使用 browser 和 module 字段。
如果编写一个使用 browser 字段和 module 字段组合的包，那么希望填写完整的 CommonJS-vs-ESM 和 browser-vs-node 四个条目。为此，需要使用 browser 字段的扩展形式，即一个映射而不仅仅是一个字符串：
```json
// main 字段应该是 CommonJS，而 module 字段应该是 ESM。
{
  "main": "./node-cjs.js",
  "module": "./node-esm.js",
  "browser": {
    "./node-cjs.js": "./browser-cjs.js",
    "./node-esm.js": "./browser-esm.js"
  }
}
```
如果省略了这四个条目中的一个，那么就有可能选择错误的变体。例如，如果省略了 CommonJS 浏览器版本的条目，那么可能会选择 CommonJS Node 版本。
注: 代码采用的编译format 和 文件解析(导入)方式 无关。
注: 使用main、module 和 browser是旧的方法; 还有一种较新的方法，package.json 中的 exports 字段。

## Node paths [Build] [7_5]
Node 的模块解析算法支持一个名为 NODE_PATH 的环境变量，其中包含一个全局目录列表，用于解析导入路径。
除了在所有父目录中的 node_modules 中搜索包之外，还会在这些路径中搜索包。

## Packages [Build] [7_5]
将包的所有依赖项从捆绑包中排除(作为外部文件)。
所有看起来像 npm 包的导入路径（即不以 ./x 或 ../x 路径开头且不是 /x 的导入路径）标记为 external。

注: 仅在bundle: true 时才有效。
注: 将导入路径标记为external是在进行alias重写后进行的; 因此在使用此设置时，alias功能仍然有效。

## Resolve extensions [Build] [7_5]
Node解析算法支持隐式文件扩展名(文件路径中不需要加后缀名)。
esbuild中隐式文件扩展名, 默认为 .tsx,.ts,.jsx,.js,.css,.json

## Working directory  [Build] [7_6]
指定用于构建的工作目录; 通常默认为调用 esbuild API 的进程的当前工作目录。
esbuild 使用工作目录进行一些不同的操作，包括将 API 选项中给定的相对路径解析为绝对路径，并在日志消息中将绝对路径漂亮地打印为相对路径。

# Transformation

## JSX [Build & Transform] [8_1]
告诉esbuild如何处理JSX语法

1、transform 告诉esbuild使用一个通用的转换器将 JSX 转换为 JS，该转换器在许多使用 JSX 语法的库之间共享。
注: 想在每个文件上配置此设置，可以使用 // @jsxRuntime classic 注释。
```jsx
// 代码转换如下:
// <div id="cs"><span>33</span></div>
React.createElement("div", { id: "cs" }, React.createElement("span", null, "33"))
```
2、preserve 这将保留输出中的 JSX 语法，而不是将其转换为函数调用。JSX 元素被视为一级语法，并仍受到其他设置的影响，例如缩小和属性混淆。
注: 这意味着输出文件不是有效的 JavaScript 代码。这个特性旨在在打包后使用另一个工具来转换esbuild的输出文件中的JSX语法。
3、automatic 这个转换器是在 React 17+ 中引入的，非常特定于 React。[细节描述](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md)。
注: 如果想启用此转换的开发模式版本，则需要额外启用 JSX dev 设置。
注: 想在每个文件上配置此设置，可以使用 // @jsxRuntime automatic 注释。

## JSX dev [Build & Transform]
如果将JSX转换设置为 automatic，则启用此设置会导致 esbuild 自动将文件名和源位置注入到每个 JSX 元素中; JSX 库可以使用此信息来帮助调试。
如果JSX转换设置为除 automatic 以外的其他值，则此设置不起作用。

## JSX factory [Build & Transform]
设置每个JSX element的调用函数。
```jsx
// 代码转换如下:
// <div id="cs"><span>33</span></div>
// React.createElement("div", { id: "cs" }, "33")

// 使用 `jsxFactory: 'h'`
// h("div", { id: "cs" }, "33")
```
注: 当JSX转换设置为automatic时，此设置不起作用.
注: 在 tsconfig.json 文件中添加以下内容来为TypeScript配置JSX，esbuild应该会自动选择它，而无需进行配置：
`{ "compilerOptions": { "jsxFactory": "h" } }`

## JSX fragment [Build & Transform]
设置每个JSX fragment的调用函数。
注: 当JSX转换设置为automatic时，此设置不起作用。
注: 在 tsconfig.json 文件中添加以下内容来为TypeScript配置JSX，esbuild应该会自动选择它，而无需进行配置：
`{ "compilerOptions": { "jsxFragmentFactory": "Fragment" } }`

## JSX import source [Build & Transform] ❓

## JSX side effects [Build & Transform]
默认情况下，esbuild 假设 JSX 表达式是没有副作用的，这意味着它们带有 /* @PURE */ 注释，并且在未使用时会在打包时被删除; 这遵循 JSX 用于虚拟 DOM 的常见用法，并适用于绝大多数 JSX 库。
然而，有些人编写的 JSX 库不具有此属性（具体来说，JSX 表达式可能具有任意副作用，并且在未使用时无法删除）。

## Supported [Build & Transform]  [8_2]
允许在单个语法特性级别上, 自定义esbuild不支持的语法特性集。
例如
  1、不支持 class语法时, 会生成一个错误。
  2、不支持 arrow函数语法时, 会转化成普通函数。

通常，当使用target设置时，会指定supported配置; 一般应该使用target设置而不是此设置。如果除此设置外还指定了target，则此设置将覆盖target指定的任何内容。
[文档](https://esbuild.github.io/api/#supported)

1、JavaScript 运行时通常会快速实现较新的语法特性，但比相同效果的旧JavaScript慢; 可以通过告诉 esbuild 假装不支持此语法特性来获得加速。
2、使用另一个工具处理 esbuild 的输出，并且可能希望 esbuild 转换某些功能，而另一个工具转换其他某些功能。例如，如果使用esbuild将文件单独转换为ES5，但随后将输出馈送到Webpack进行打包，则可能希望保留 import() 表达式，即使它们在 ES5 中是语法错误。

## Target  [Build & Transform]  [8_3]
为生成的JavaScript、CSS代码设置目标环境。告诉esbuild将这些环境无法使用的JavaScript语法转换为较旧的语法，以便在这些环境中运行。
注: 仅涉及语法特性，不会自动为这些环境不使用的新API添加polyfill; 必须自己导入需要的API的polyfill, esbuild不会自动注入polyfill。

* 指定JavaScript语言版本
默认目标是esnext，这意味esbuild 将假定所有最新的 JavaScript 和 CSS 特性都受支持。
可以精确地指定版本号 => 例如，node12.19.0 而不是仅 node12

注: 如果需要在个别特性级别上自定义支持的语法特性集，除了代替目标提供的内容，还可以使用supported设置来实现。

# Optimization

## Define [Build & Transform] [9_1]
提供了一种用常量表达式替换全局标识符的方法。
注: 字符串中的表达式必须是JSON对象（null、布尔值、数字、字符串、数组或对象）或单个标识符。

## Drop [Build & Transform]
在构建之前, 编辑源代码以删除某些结构。
* debugger
移除所有的debugger语句。
* console
移除所有的console语句。

## Drop labels [Build & Transform]
在构建之前,编辑源代码以删除带有特定标签名称的标签语句。

## Ignore annotations [Build & Transform] [9_2]
由于JavaScript是一种动态语言，对于编译器来说，识别未使用的代码有时非常困难，因此社区开发了一些注释来帮助告诉编译器哪些代码应被视为无副作用且可移除的。

*  /* #__PURE__ */ 注释
在函数调用前的内联 /* #__PURE__ */ 注释告诉esbuild，如果未使用结果值，则可以删除该函数调用。

* sideEffects
在package.json文件中用于指示模块打包工具（如webpack）哪些文件可以安全地进行tree-shaking。
1. `sideEffects: ['polyfills.js']` 告诉打包工具，文件polyfills.js具有副作用，不应尝试移除它(其他文件可以进行tree-shaking)
2. `sideEffects: false` 所有文件都没有副作用, 可尝试移除。
3. `sideEffects: true` 所有文件都有副作用, 不应尝试移除。

注: 不依赖这些注释, esbuild也会自动tree-shake未使用的导入。

## Inject [Build] [9_3]
允许自动将全局变量替换为从另一个文件导入的内容。

* Auto-import for JSX
当JSX转换未设置为automatic时，可以使用inject功能自动导入JSX表达式的工厂和片段。

* Injecting files without imports
被注入的文件没有导出任何内容。
这种情况下，被注入的文件将在输出文件的最前面，就像每个输入文件都包含`import "./xx.js"`一样。

* Conditionally injecting a file
如果只有在实际使用导出时才想有条件地导入文件，应该将注入的文件标记为没有副作用.
方法: 将其放在一个包中，并在该包的 package.json 文件中添加 "sideEffects": false。

## Keep names [Build & Transform] [9_4]
在 JavaScript 中，函数和类上的name属性默认为源代码中附近的标识符;

* 缩小化会重命名符号以减小代码大小，而打包有时需要重命名符号以避免冲突。
```jsx
function fn() {}
let fn = function() {};
fn = function() {};
let [fn = function() {}] = [];
let {fn = function() {}} = {};
[fn = function() {}] = [];
({fn = function() {}} = {});
```

* 一些框架依赖于name属性进行注册和绑定
这种情况下可以启用此选项，以便即使在缩小化的代码中也保留原始名称值。

## Mangle props [Build & Transform] [9_5]
将正则表达式传递给esbuild，告诉esbuild自动重命名与此正则表达式匹配的所有**属性**。

注: 使用此功能可能会以微妙的方式破坏代码。除非知道自己在做什么，以及确切知道它将如何影响代码和所有依赖项，请不要使用此功能。
注: 属性名称仅在单个esbuild API调用中保持一致混淆。每个esbuild API调用都执行独立的属性混淆操作，因此由两个不同API调用生成的输出文件可能将相同的属性混淆为两个不同的名称，这可能导致生成的代码行为不正确。
注: 一个单独的设置，而不是 minify 设置的一部分。

* Quoted properties
混淆字符串字面量的内容。
注: 默认情况下，esbuild不会修改字符串字面量的内容。这意味着可以通过将其引用为字符串来避免对单个属性进行混淆。

* Mangling other strings
混淆代码中任意其他位置的字符串中的属性名: 在字符串前加上一个 /* @__KEY__ */ 注释，告诉esbuild字符串的内容应被视为可以混淆的属性名。

* Preventing renaming
将某些属性排除在混淆之外，可以使用额外的设置来保留它们。[批量属性]

* Persisting renaming decisions
将原始名称到混淆名称的映射存储在持久性缓存中。在初始构建过程中，所有混淆属性重命名都会记录在缓存中。后续构建重用缓存中存储的重命名，并为任何新增加的属性添加额外的重命名。
1. 在将缓存传递给esbuild之前编辑缓存，可以自定义混淆属性重命名为什么。
2. 缓存充当所有混淆属性的列表。可以轻松扫描它，查看是否有任何意外的属性重命名。
3. 通过将重命名值设置为false而不是字符串来禁用[单个属性]的混淆。
4. 确保构建之间的重命名一致（例如，主线程文件和 Web Worker，或库和插件）。没有此功能，每个构建都将执行独立的重命名操作，而混淆的属性名称可能不一致。

注: 指定属性的混淆名称。

## Minify [Build & Transform] [9_6]
生成的代码将被缩小而不是美观地打印。缩小的代码通常等同于未缩小的代码，但体积较小; 意味着下载速度更快，但调试起来更困难。

* 执行三个独立操作
1. 删除空白：使用 minifyWhitespace 选项。
2. 重写语法以使其更紧凑：使用 minifySyntax 选项。
3. 将局部变量重命名为较短的名称：使用 minifyIdentifiers 选项。

* Considerations
1. 当启用minify时，还应设置target选项（设置在minify时使用较旧的语言目标）
2. Js模板字面量中的字符转义序列\n将被替换为换行符。转义序列\n需要两个字节，而换行符需要一个字节。
3. 默认情况下，不会缩小顶级声明的名称(esbuild不知道您将如何处理输出); 设置输出格式（或启用捆绑, 默认输出格式）告诉esbuild输出将在其自己的范围内运行，这意味着可以安全地缩小顶级声明名称.
4. 对于所有Js代码的100%缩小都不是安全的。
```js
// 源代码
function logMessage(message) {
  console.log(message);
}
function executeFunction(fnName, ...args) {
  window[fnName](...args);
}
executeFunction('logMessage', 'Hello, World!');

// 压缩后
function n(n){console.log(n)}function e(e,...n){window[e](...n)}e("logMessage","Hello, World!");

// 函数名logMessage变为n，executeFunction在运行时将无法找到名为logMessage的函数，导致程序无法正常工作
```
5. 默认情况下，esbuild不会保留函数和类对象上的.name属性值; 如果需要依赖此属性，应启用keep names选项。
6. 使用某些Js功能可能会禁用esbuild的许多优化，包括缩小。
```js
// 使用直接 eval 和/或 with 语句会阻止 esbuild 将标识符重命名为较小的名称，因为这些功能会导致标识符绑定在运行时而不是编译时发生。

// 间接eval的行为与直接eval不同，因为间接行为是在全局作用域中执行，而不是在当前作用域中执行。
```
7. esbuild中的缩小算法尚未执行高级代码优化。其他高代码优化工具:
  -  [Terser](https://github.com/terser/terser#readme)
  -  [Google Closure Compiler](https://github.com/google/closure-compiler#readme)

## Pure [Build & Transform] [9_7]
各种工具有一种约定: 在new或call表达式之前使用包含`/* @__PURE__ */`或`/* #__PURE__ */`的特殊注释, 表示如果结果值未使用，则可以删除该表达式。

注: 约定信息由esbuild之类的打包器在进行tree shaking时使用; 本质上是一个抽象缩写，表示“如果未使用，可以删除”。
注: 注释的效果仅限于调用本身，而不包括参数。

## Tree shaking [Build & Transform] [9_8]
一种常见的编译器优化，可以自动删除无法访问的代码。

* 未使用的函数将被自动丢弃
注: esbuild的tree shaking实现依赖于使用ECMAScript模块导入和导出语句, 不适用于CommonJS模块。
注: 仅当`bundle: true`或`format: 'iife'`时，才启用tree shaking，否则禁用 tree shaking。

# Source maps
<!-- TODO -->

# Build metadata
