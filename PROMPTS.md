# AI-Baby 小程序开发 PROMPTS

---

# 项目说明

项目名称：

AI-Baby

项目定位：

宝宝辅食微信小程序。

用户通过微信小程序浏览辅食商品、下单、填写配送地址。
商家通过微信云开发查看订单并进行配送。

项目目标：

- 一周完成 MVP
- 微信小程序上线
- 私域微信群转化
- 熟人电商模式

技术栈：

- uni-app
- Vue3
- TypeScript
- Pinia
- SCSS
- 微信云开发
- MongoDB（微信云数据库）

---

# 页面结构

/pages

- index 首页
- goods-detail 商品详情
- cart 购物车
- order-confirm 确认订单
- order-list 我的订单
- my 我的
- address 地址管理

---

# TabBar 设计

- 首页
- 购物车
- 订单
- 我的

---

# 开发规则

请严格遵守项目内 Cursor Rules：

- frontend.mdc
- ui.mdc
- cloud.mdc
- store.mdc

不要重复定义项目规范。

生成代码时：

- 优先使用已有 SCSS 变量
- 保持页面风格统一
- 保持微信小程序兼容
- 保持 uni-app 兼容

---

# 首页 Prompt

帮我生成 AI-Baby 首页。

页面功能：

- 调用 goods 云函数
- 获取商品列表
- 展示辅食商品

商品信息：

- 商品图片
- 商品标题
- 月龄标签
- 商品价格
- 简短描述

布局要求：

- 双列卡片布局
- 卡片阴影
- 圆角
- 母婴风

交互：

- 点击商品进入详情页
- 支持下拉刷新

要求：

- 输出完整 index.vue
- 使用 mock 数据兜底
- 代码可直接运行

---

# 商品详情页 Prompt

帮我生成 AI-Baby 商品详情页。

页面功能：

- 根据商品 id 获取商品详情
- 展示商品轮播图
- 展示商品标题
- 展示商品价格
- 展示适龄月龄
- 展示食材说明
- 展示营养说明
- 展示保存方式

底部按钮：

- 加入购物车
- 立即下单

要求：

- 输出完整 goods-detail.vue
- 使用 SCSS
- 微信小程序兼容

---

# 购物车页面 Prompt

帮我生成 AI-Baby 购物车页面。

功能：

- 展示购物车商品
- 商品数量增减
- 删除商品
- 自动计算总价
- 空购物车状态

底部：

- 总价
- 去结算按钮

要求：

- 使用 Pinia
- uni-app兼容
- 微信小程序兼容
- 输出完整 cart.vue

---

# 确认订单页面 Prompt

帮我生成 AI-Baby 确认订单页面。

页面内容：

- 收货人
- 手机号
- 收货地址
- 配送时间
- 订单备注
- 商品列表
- 合计金额

底部：

- 提交订单按钮

要求：

- 包含表单校验
- 使用 uni-app 表单写法
- 微信小程序兼容
- 输出完整页面

---

# 我的订单页面 Prompt

帮我生成 AI-Baby 我的订单页面。

功能：

- 获取订单列表
- 支持订单状态筛选

订单字段：

- 商品信息
- 总金额
- 订单状态
- 创建时间

订单状态：

- 待配送
- 配送中
- 已完成

要求：

- 卡片式布局
- 输出完整页面
- 使用 mock 数据兜底

---

# 我的页面 Prompt

帮我生成 AI-Baby 我的页面。

页面内容：

- 用户头像
- 用户昵称
- 我的订单入口
- 地址管理入口
- 联系客服
- 关于我们

要求：

- 母婴风
- 卡片布局
- 粉色系
- 输出完整 my.vue

---

# 地址管理页面 Prompt

帮我生成 AI-Baby 地址管理页面。

功能：

- 地址列表
- 新增地址
- 编辑地址
- 删除地址
- 默认地址设置

字段：

- 收货人
- 手机号
- 详细地址

要求：

- 包含表单校验
- 微信小程序兼容
- 输出完整 address.vue

---

# 商品列表组件 Prompt

帮我生成 AI-Baby 商品卡片组件。

组件名称：

GoodsCard

Props：

- 商品图片
- 商品标题
- 商品价格
- 商品标签
- 商品描述

功能：

- 点击跳转商品详情

要求：

- 卡片式布局
- 可复用
- SCSS
- 输出完整组件

---

# 空状态组件 Prompt

帮我生成 AI-Baby 空状态组件。

组件名称：

EmptyState

Props：

- title
- desc
- image

场景：

- 空购物车
- 无订单
- 无商品

要求：

- 母婴风
- 居中布局
- 可复用

---

# 底部提交栏组件 Prompt

帮我生成 AI-Baby 底部提交栏组件。

组件名称：

SubmitBar

功能：

- 显示价格
- 固定底部
- 提交按钮

Props：

- price
- buttonText

要求：

- uni-app兼容
- 微信小程序兼容
- 可复用

---

# TabBar 底部导航 Prompt

帮我生成 AI-Baby 小程序 TabBar 底部导航配置。

导航包含：

- 首页
- 购物车
- 订单
- 我的

页面路径：

- pages/index/index
- pages/cart/cart
- pages/order/list
- pages/my/my

要求：

- 生成完整 pages.json tabBar 配置
- 使用微信小程序兼容写法
- 使用底部固定导航
- 风格符合母婴风
- 选中颜色使用项目主色
- 未选中颜色使用灰色
- 使用 static/tab 目录下图标(预留位置，后期补充)

图标命名规范：

- static/
  - tab/
    - home.png
    - home-active.png
    - cart.png
    - cart-active.png
    - order.png
    - order-active.png
    - my.png
    - my-active.png

要求：

- 同时生成 tabBar 图标目录结构
- 不要生成错误路径
- 不要遗漏 selectedIconPath
- 保持 pages.json 结构正确

---

# Pinia 购物车 Store Prompt

帮我生成 AI-Baby 购物车 Store。

功能：

- 添加购物车
- 删除商品
- 修改数量
- 清空购物车
- 计算总价
- 计算商品数量

要求：

- defineStore
- setup 风格
- TypeScript
- uni.setStorageSync 持久化
- 输出完整 store

---

# 用户 Store Prompt

帮我生成 AI-Baby 用户 Store。

功能：

- 保存用户信息
- 登录
- 退出登录
- 持久化缓存

字段：

- userInfo
- token

要求：

- Pinia
- TypeScript
- composition api

---

# 云函数 goods Prompt

帮我生成 AI-Baby goods 云函数。

功能：

- 获取商品列表
- 获取商品详情

数据库：

goods

要求：

- wx-server-sdk
- 使用 async/await
- 包含错误处理
- 返回统一结构
- 输出完整 index.js

---

# 云函数 order Prompt

帮我生成 AI-Baby order 云函数。

功能：

- 创建订单
- 获取订单列表
- 更新订单状态

数据库：

orders

要求：

- wx-server-sdk
- 包含参数校验
- 包含错误处理
- 返回统一结构
- 输出完整 index.js

---

# 商品 MongoDB 数据结构 Prompt

帮我设计 AI-Baby 商品 MongoDB 数据结构。

字段包含：

- title
- desc
- price
- cover
- images
- tags
- age
- nutrition
- ingredients
- stock
- createTime

要求：

- TypeScript interface
- MongoDB 示例数据
- 字段解释

---

# 订单 MongoDB 数据结构 Prompt

帮我设计 AI-Baby 订单 MongoDB 数据结构。

字段包含：

- goodsList
- totalPrice
- username
- phone
- address
- remark
- deliveryTime
- status
- createTime

要求：

- TypeScript interface
- MongoDB 示例数据
- 字段解释

---

# 图标系统 Prompt

帮我为 AI-Baby 微信小程序生成完整图标方案。

项目风格：

- 母婴风
- 温柔
- 简洁
- 奶油风
- 圆润
- 轻量化

技术要求：

- uni-app
- 微信小程序兼容
- Vue3
- 使用 uni-icons
- TabBar 使用 png 图标

---

## 一、页面内图标方案

### 常用图标场景：

- 首页
- 购物车
- 下单
- 地址
- 电话
- 用户
- 设置
- 删除
- 添加
- 时间
- 配送
- 客服

### 页面内 icon 尺寸规范：

- 普通 icon：20~24
- TabBar icon：64x64 png
- 小图标：16~18
- 强调图标：28~32

### 输出要求：

- 使用 uni-icons
- 不要使用 Element Plus 图标
- 不要使用 iconfont 在线 CDN
- 保持图标风格统一
- 优先使用 outline 线性风格
- 给出推荐 icon type
- 给出推荐 size
- 给出推荐 color
- 给出示例代码

### 示例格式：

```vue
<uni-icons type="home" size="20" color="#ff8ba7" />
```

### 常用场景与 uni-icons `type`（outline，无 `-filled`）

| 场景            | 推荐 type                  | 推荐 size         | 推荐 color            |
| --------------- | -------------------------- | ----------------- | --------------------- |
| 首页            | `home`                     | 20–22（或 40rpx） | `#ff8ba7` / `#333333` |
| 购物车          | `cart`                     | 20–22             | `#ff8ba7` / `#333333` |
| 下单 / 结算     | `compose` 或 `cart`        | 22–24             | `#ff8ba7`             |
| 地址            | `location` 或 `map-pin`    | 20–22             | `#999999`             |
| 电话            | `phone`                    | 20–22             | `#ff8ba7`             |
| 用户 / 我的     | `person`                   | 20–22             | `#999999`             |
| 设置            | `gear` 或 `settings`       | 20–22             | `#999999`             |
| 删除            | `trash`                    | 18–20             | `#999999`             |
| 添加            | `plus` 或 `plusempty`      | 18–20             | `#ff8ba7`             |
| 时间 / 配送时段 | `calendar`                 | 18–20             | `#999999`             |
| 配送 / 物流     | `paperplane` 或 `navigate` | 20–22             | `#999999`             |
| 客服            | `chat` 或 `headphones`     | 20–22             | `#ff8ba7`             |

尺寸说明：普通 **20–24px**（或 `40rpx`–`48rpx` 字符串），小图标 **16–18px**，强调 **28–32px**；主色 **`#ff8ba7`**，次要 **`#999999`**，正文 **`#333333`**。

依赖：通过 **`src/uni_modules/uni-icons`** 引入；`pages.json` **easycom** 的 `custom` 指向 `@/uni_modules/uni-$1/...`（勿再使用 npm `@dcloudio/uni-ui` 路径）。

## 二、TabBar 图标方案

帮我生成 TabBar 图标设计方案。

### TabBar 包含：

- 首页
- 购物车
- 订单
- 我的

### 图标目录结构：

```text
static/
  tab/
    home.png
    home-active.png
    cart.png
    cart-active.png
    order.png
    order-active.png
    my.png
    my-active.png
```

### 图标规范：

- 默认尺寸：64x64 png
- inactive：#999999
- active：#ff8ba7
- 透明背景

### 输出要求：

- 使用 png 图标
- 使用 outline 线性风格
- 图标保持统一风格
- 适合母婴风
- 图标简洁圆润
- 推荐使用 IconPark 风格
- 给出每个图标推荐关键词
- 给出推荐下载尺寸
- 给出推荐颜色
- 给出 active 与 inactive 配色建议

### Tab 各页 IconPark 关键词（线性 / outline，圆角端点）

| Tab    | 关键词（英文检索）             | 导出尺寸              | inactive       | active         |
| ------ | ------------------------------ | --------------------- | -------------- | -------------- |
| 首页   | `home`, `house`, `smile house` | **64×64** PNG，透明底 | 描边 `#999999` | 描边 `#ff8ba7` |
| 购物车 | `shopping cart`, `cart`        | 同上                  | 同上           | 同上           |
| 订单   | `order`, `list`, `document`    | 同上                  | 同上           | 同上           |
| 我的   | `user`, `people`, `smile`      | 同上                  | 同上           | 同上           |

配色：与页面内图标一致，**无渐变**；线宽建议 **2px**（64 画布下约 2–2.5px），拐角圆润。

## 三、pages.json tabBar 配置

生成完整 pages.json tabBar 配置。

### 页面路径（与仓库 `pages.config.ts` 一致）：

- pages/index/index
- pages/cart/cart
- pages/order/list
- pages/my/my

### 输出要求：

- 路径正确
- iconPath 正确
- selectedIconPath 正确
- 微信小程序兼容
- 使用 static/tab 路径

## 四、SCSS 图标规范

样式见仓库 **`src/styles/icons.scss`**（已通过 `vite.config` 全局注入）。要求：

- 图标与文字垂直居中
- 使用 flex 对齐
- 图标间距统一
- icon 与 text 保持统一视觉风格

### 示例格式：

```scss
.icon-text {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
```

## 五、最终要求

### 要求：

- 不要生成不存在的图标路径
- 不要生成 web-only 图标方案
- 不要使用在线 CDN
- 不要使用在线 svg 链接
- 不要使用远程 icon 资源
- 保持 uni-app 兼容
- 保持微信小程序兼容
- 优先使用轻量方案
- 保持整体 UI 风格统一
- 保持线条简洁
- 不要使用渐变
- 不要使用复杂插画
- 不要使用 3D 风格
- 不要使用拟物风格

### 推荐图标来源：

- IconPark
- Material Symbols
- Remix Icon

优先使用 IconPark。

---

# 给首页每个商品增加"加入购物车"按钮

请基于当前 AI-Baby 项目生成代码。

要求：

- 严格遵守 Cursor Rules
- 保持 uni-app 兼容
- 保持微信小程序兼容
- 保持页面风格统一
- 优先输出完整代码
- 优先考虑移动端布局
- 优先使用icon图标
- 要有按钮阴影和适当圆角

---

# Cursor 通用 Prompt

请基于当前 AI-Baby 项目生成代码。

要求：

- 严格遵守 Cursor Rules
- 保持 uni-app 兼容
- 保持微信小程序兼容
- 保持页面风格统一
- 优先输出完整代码
- 优先考虑移动端布局
- 优先使用 mock 数据兜底
- 不要输出解释
- 不要生成 web-only API
- 不要使用 document/window/localStorage
