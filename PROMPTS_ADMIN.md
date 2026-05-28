# AI-Baby 管理端系统 Prompt

你正在为 AI-Baby 微信小程序开发完整管理端功能。

项目技术栈：

- uni-app
- Vue3
- script setup
- TypeScript
- Pinia
- SCSS
- 微信小程序
- 微信云开发
- MongoDB（微信云数据库）
- 云函数

---

# 一、项目目标

当前用户端已经实现：

- 首页商品展示
- 商品详情
- 购物车
- 下单
- 历史订单

现在需要继续开发：

- 管理端系统

用于：

- 商品管理
- 商品上下架
- 修改价格
- 修改库存
- 订单管理
- 配送状态管理
- 管理员权限控制

---

# 二、整体要求

必须：

- 保持 uni-app 兼容
- 保持微信小程序兼容
- 使用 Vue3 composition api
- 使用 script setup
- 使用 TypeScript
- 使用 SCSS
- 使用 flex 布局
- 使用 rpx 单位
- 页面适配移动端

禁止：

- 不要使用 React
- 不要使用 web-only API
- 不要使用 localStorage
- 不要使用 document/window
- 不要生成 PC 后台
- 不要生成 Element Plus
- 不要生成复杂后台框架
- 不要使用 web admin 模板

列表数据：

- 必须支持分页
- 每页默认 10 条
- 支持下拉加载更多
- 禁止一次性读取全部数据

管理端直接写在当前小程序内部。

---

# 三、管理端页面结构

在 pages 下新增：

```text
pages/
  admin/
    index/
      index.vue

    goods/
      index.vue

    goods-edit/
      index.vue

    order/
      index.vue

    order-detail/
      index.vue
```

要求：

- 一个页面一个文件夹
- 页面入口统一为 index.vue
- 同步更新 pages.json

管理入口：

- 仅管理员可见
- 普通用户不可进入 admin 页面
- 页面 onLoad 时校验管理员身份
- 非管理员自动返回首页

---

# 四、管理员权限系统

新增数据库：

- admin_users

数据结构：

```JSON
{
  "_id": "",
  "openid": "",
  "role": "admin",
  "name": "管理员"
}
```

要求：

- 使用云函数获取 openid
- 不允许前端伪造管理员
- 所有管理操作必须校验管理员权限
- 云函数内校验 admin_users

---

# 五、商品数据结构升级

修改 goods 集合。

新增字段：

```JSON
{

  "status": 1,
  "sort": 1
}
```

字段说明：

- status:
  - 1 上架
  - 0 下架

要求：

- 首页只能读取 status=1 商品
- 管理端可修改 status
- 管理端可修改库存 stock
- 管理端可修改价格 price

---

# 六、订单数据结构升级

修改 orders 集合。

订单状态：

- status:
  - 0 待付款
  - 1 待制作
  - 2 配送中
  - 3 已完成
  - 4 已取消

要求：

- 用户端显示订单状态
- 管理端可修改订单状态
- 管理端可查看联系方式
- 管理端可查看配送地址

---

# 七、订单 goodsList 必须保存商品快照。

下单时保存：

- 商品标题
- 商品价格
- 商品图片
- 商品数量

订单生成后：

- 不允许依赖 goods 实时数据
- 商品修改不影响历史订单

---

# 八、管理首页

页面：

- pages/admin/index/index.vue

功能：

- 今日订单数量
- 待配送数量
- 商品总数
- 快捷入口

页面风格：

- 卡片式布局
- 母婴风
- 奶油风
- 简洁圆角
- 使用浅粉色系

推荐颜色：

```SCSS
$primary: #ff8ba7;
$bg: #fff7f9;
$text: #333;
```

---

# 九、商品管理页

页面：

- pages/admin/goods/index.vue

功能：

- 商品列表
- 商品搜索
- 商品上下架
- 删除商品
- 编辑商品
- 新增商品

页面展示：

- 商品图片
- 标题
- 价格
- 库存
- 销量
- 状态

要求：

- 使用 mock 数据兜底
- 支持空状态
- 支持下拉刷新

---

# 十、商品删除使用软删除。

新增字段：

- deleted: true/false

要求：

- 不允许直接 remove 商品
- 删除商品时仅修改 deleted=true
- 用户端不读取 deleted=true 商品
- 历史订单仍保留商品数据

---

# 十一、商品编辑页

页面：

- pages/admin/goods-edit/index.vue

功能：

- 新增商品
- 编辑商品

字段：

- 商品标题
- 副标题
- 价格
- 原价
- 库存
- 分类
- 月龄
- 标签
- 商品描述
- 商品图片
- 上下架状态

要求：

- 使用表单布局
- 使用 uni-file-picker 上传图片
- 图片上传到云存储
- 保存到 goods 集合

要求生成：

- 完整 template
- 完整 script
- 完整 SCSS

---

# 十二、订单管理页

页面：

- pages/admin/order/index.vue

功能：

- 订单列表
- 按状态筛选
- 查看订单详情

展示内容：

- 订单号
- 用户电话
- 配送地址
- 商品数量
- 总价
- 订单状态
- 创建时间

要求：

- 卡片式布局
- 支持状态筛选

---

# 十三、订单详情页

页面：

- pages/admin/order-detail/index.vue

功能：

- 查看订单商品
- 查看联系方式
- 查看地址
- 修改订单状态

支持状态：

- 待制作
- 配送中
- 已完成
- 已取消

要求：

- 状态修改后同步数据库
- 显示状态颜色

推荐颜色：

```SCSS
待制作: #ffb703
配送中: #219ebc
已完成: #52b788
已取消: #999999
```

---

# 十四、云函数要求

新增云函数：

- cloudfunctions/
  - admin-check/
  - admin-goods-list/
  - admin-save-goods/
  - admin-update-goods-status/
  - admin-order-list/
  - admin-update-order-status/

要求：

- 使用 wx-server-sdk
- 云函数内校验管理员身份
- 使用 async/await
- 返回统一格式

统一返回：

```JSON
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

时间字段统一：

- createTime 使用 Date.now()
- updateTime 使用 Date.now()

更新时间：

- 修改商品时更新 updateTime
- 修改订单状态时更新 updateTime

---

# 十五、图片上传要求

使用：

```vue
<uni-file-picker />
```

要求：

- 上传到微信云存储
- 统一保存 cloud fileID
- 返回 cloud fileID
- 保存到 goods.cover
- 支持多图上传

禁止：

- base64
- tempFilePath
- 本地缓存
- 本地路径
- web 上传方案

---

# 十六、页面风格要求

整体风格：

- 母婴风
- 温柔
- 奶油风
- 留白充足
- 卡片式布局
- 圆角
- 轻量化

禁止：

- 深色主题
- 复杂渐变
- 拟物风
- 3D 风格
- PC 后台风格

---

# 十七、SCSS 规范

要求：

- 使用嵌套写法
- 不要平铺 class
- 页面根节点统一使用 .page

示例：

```SCSS
.page {
  padding: 24rpx;

  .card {
    border-radius: 24rpx;

    .title {
      font-size: 32rpx;
    }
  }
}
```

---

# 十八、云函数命名规范：

规范：

- admin- 开头表示管理端
- user- 开头表示用户端
- order- 开头表示订单
- goods- 开头表示商品

禁止：

- function1
- test
- demo
- temp

---

# 十九、类型定义规范：

目录：

```text
types/
  goods.ts
  order.ts
  user.ts
```

要求：

- 所有核心数据结构定义 TypeScript interface
- 页面与云函数共用类型定义
- 禁止使用 any

---

# 二十、API层规范

API 调用目录：

```text
api/
  goods.ts
  order.ts
  admin.ts
```

要求：

- 页面禁止直接调用云函数
- 所有云函数统一封装 api 层
- 页面仅调用 api 方法

禁止生成：

- axios
- fetch
- REST API
- Express API

项目仅使用：

- 微信云函数
- wx.cloud.callFunction

---

# 二十一、composables 规范

公共逻辑目录：

```text
composables/
  useUser.ts
  useCart.ts
  useOrder.ts
```

要求：

- 复用逻辑抽离 composables
- 页面仅保留页面逻辑

---

# 二十二、stores 使用规范

Store 规范：

```text
stores/
  user.ts
  cart.ts
  admin.ts
```

要求：

- 一个业务一个 store
- 禁止创建巨型 store
- store 仅存储状态
- 数据请求优先放 api 层

---

# 二十三、数据库规范：

数据库查询优化：

- goods 集合：
  - status 索引
  - deleted 索引
  - sort 索引
- orders 集合：
  - openid 索引
  - status 索引
  - createTime 索引

数据库字段默认值：

- goods：
  - stock 默认 0
  - sales 默认 0
  - deleted 默认 false
  - status 默认 1
- orders：
  - status 默认 1

---

# 二十四、其它规范

环境变量规范：

- 云环境 ID 统一放 config
- 不允许页面内硬编码 env
- 不允许重复初始化 cloud

日志规范：

- 禁止大量 console.log
- 调试日志开发完成后删除
- 错误日志统一 console.error

空状态规范：

- 空列表统一使用 EmptyState 组件
- 保持统一插图与文案风格

动画规范：

- 禁止复杂动画
- 禁止长时间 transition
- 优先保证小程序流畅度
- 管理端以功能优先

错误处理规范：

- 云函数调用必须 try/catch
- 错误统一 uni.showToast
- loading 必须正确关闭
- 禁止空 catch

组件规范：

- 优先页面内实现
- 简单 UI 不要过度拆分组件
- 高复用组件才放 components

---

# 二十五、页面命名规范

页面命名规范：

- 列表页：xxx/index
- 详情页：xxx-detail/index
- 编辑页：xxx-edit/index

禁止：

- aaa.vue
- test.vue
- demo.vue

---

# 二十六、补充规则

库存扣减规则

下单时：

- 自动扣减库存
- 库存不足禁止下单
- 已取消订单自动恢复库存

订单状态流转规则：

- 待付款 -> 待制作
- 待制作 -> 配送中
- 配送中 -> 已完成
- 任意状态可取消

禁止非法状态跳转。

---

# 二十七、最终要求

禁止前端直接操作数据库。

所有数据库读写必须通过云函数。

包括：

- 商品读取
- 商品修改
- 商品上下架
- 订单读取
- 订单状态修改

生成代码时：

- 优先输出完整代码
- 不要省略 template
- 不要省略 script
- 不要省略 style
- 不要生成伪代码
- 保证代码可直接运行
- 自动更新 pages.json
- 自动生成 mock 数据
- 自动生成类型定义
- 自动生成云函数

开发顺序：

1. 管理员权限校验
2. 商品管理列表
3. 商品编辑页
4. 商品上下架
5. 订单管理
6. 订单状态修改

每完成一个模块后：
先保证可以运行，
再继续下一个模块。
