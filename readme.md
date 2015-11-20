#th145pat2json

This project can parse and convert [Touhou 14.5 Urban Legend in Limbo](http://www.tasofro.net/touhou145/) (th145) actor pat file into texture atlas (json and png files). Hitboxes are also extracted and a simple actor controller is offered to display the atlas (with [phaser.io](https://github.com/photonstorm/phaser))

这个项目可以把 [東方深秘録](http://www.tasofro.net/touhou145/) 的 pat 文件解析出来并转换为 texture atlas（纹理贴图集，包含 json 和 png 两个文件）。它同时也导出了 hitbox，并且基于 [phaser.io](https://github.com/photonstorm/phaser) 提供了一个可用键盘控制的简单角色控制器

Demo: http://lab.ofr.me/th145pat2json

##How to build

首先你需要把 th145 的数据文件解包（使用类似 [arc_unpacker](https://github.com/vn-tools/arc_unpacker) 这样的工具）

安装完 npm 相关依赖后，把解出来的 data/actor 文件夹里面的角色放到项目下的 res 文件夹，然后运行 npm run build

之后会生成如 futo.atlas.json 和 futo.atlas.png 这样的 atlas 文件。还有一个 futo.json 包含了 hitbox 等信息。

##TODOs

* 完善角色控制器的功能

##License

MIT
