# AI-Baby 管理端开发任务

基于当前 AI-Baby uni-app 微信小程序项目，

继续开发：

# 管理端系统

注意：

项目已经存在：

- 用户端
- 商品列表
- 购物车
- 下单
- 订单列表

请在现有项目基础上继续开发。

必须遵守当前项目 Rules：

- frontend.mdc
- ui.mdc
- cloud.mdc
- store.mdc

禁止重新生成已有用户端页面。

---

# 第一阶段：管理员权限系统

目标：

实现管理员身份校验。

---

## 需要生成：

### 数据库

新增：

```json
admin_users
数据结构：
{
  "_id": "",
  "openid": "",
  "role": "admin",
  "name": "管理员"
}
```

### 云函数

生成：

- cloudfunctions/
  - admin-check/
    - index.js

功能：

- 获取当前用户 openid
- 校验是否存在 admin_users
- 返回管理员状态

要求：

- 使用 wx-server-sdk
- 使用 async/await
- 返回统一结构

返回格式：

```JSON
{
  "code": 0,
  "message": "success",
  "data": {
    "isAdmin": true
  }
}
```

### api层

生成：

- api/
  - admin.ts

封装：

```TypeScript
checkAdmin()
```

### Store

生成：

- stores/
  - admin.ts

要求：

- 保存管理员状态
- 保存 loading 状态

### composables

生成：

- composables/
  - useAdmin.ts

功能：

- 获取管理员状态
- 页面权限校验

### 页面权限要求

后续所有：

pages/admin/\*

页面：

- onLoad 时校验管理员
- 非管理员自动返回首页
- 提示无权限

### 输出要求

生成：

- 完整云函数
- 完整 api
- 完整 store
- 完整 composable
- TypeScript 类型
- 必要的目录结构

不要生成伪代码。

完成后先保证可以运行。

---

# 第二阶段：管理端首页

## AI-Baby 管理端首页开发

继续开发：

管理端首页。

页面：

```text
pages/admin/index/index.vue
```

### 页面功能

展示：

- 今日订单数量
- 待配送订单数量
- 商品总数
- 快捷入口

快捷入口：

- 商品管理
- 订单管理

### 页面要求

风格：

- 奶油风
- 母婴风
- 卡片式布局
- 圆角
- 留白充足

颜色：

```scss
$primary: #ff8ba7;
$bg: #fff7f9;
$text: #333;
```

### 数据要求

先使用 mock 数据兜底。

后续再接真实云函数

### 输出要求

生成：

- 完整 template
- 完整 script setup
- 完整 TypeScript
- 完整 SCSS
- 使用嵌套 SCSS

页面根节点统一：

```scss
.page
```

不要省略代码。

---

# 第三阶段：商品管理列表

## AI-Baby 商品管理列表开发

继续开发：

商品管理页。

页面：

```text
pages/admin/goods/index.vue
```

### 页面功能

实现：

- 商品列表
- 商品搜索
- 商品上下架
- 删除商品（软删除）
- 编辑商品
- 新增商品

### 商品数据结构

goods 集合新增：

```json
{
  "status": 1,
  "deleted": false,
  "sort": 1
}
```

状态：

- 1 上架
- 0 下架

### 列表要求

必须：

- 分页
- 每页 10 条
- 下拉加载更多
- 支持下拉刷新

禁止：

- 一次性读取全部数据

### 展示内容

- 商品图片
- 标题
- 价格
- 库存
- 销量
- 上下架状态

### 云函数

生成：

```text
cloudfunctions/
  admin-goods-list/
  admin-update-goods-status/
```

要求：

- 校验管理员身份
- 使用分页查询
- 过滤 deleted=true

### API层

生成：

```text
api/goods.ts
```

封装：

- getAdminGoodsList
- updateGoodsStatus

### 页面要求

风格：

- 移动端管理页
- 卡片式布局
- 简洁轻量

支持：

- 空状态
- loading
- 错误提示

### 输出要求

生成完整：

- 页面
- 云函数
- API
- 类型定义
- mock 数据

不要生成伪代码。

---

# 第四阶段：商品编辑页

## AI-Baby 商品编辑页开发

继续开发：

商品编辑页。

页面：

```text
pages/admin/goods-edit/index.vue
```

### 页面功能

支持：

- 新增商品
- 编辑商品

### 表单字段

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

### 图片上传

使用：

```vue
<uni-file-picker />
```

要求：

- 上传微信云存储
- 保存 cloud fileID
- 支持多图上传

禁止：

- base64
- tempFilePath
- 本地缓存

### 云函数

生成：

```text
cloudfunctions/
  admin-save-goods/
```

要求：

- 新增商品
- 编辑商品
- 自动更新 updateTime

### API

封装：

- saveGoods

### 页面要求

- 表单布局
- 卡片式输入框
- 移动端适配
- 使用 SCSS 嵌套

### 输出要求

生成：

- 完整页面
- 完整云函数
- API
- 类型定义

不要省略代码。

---

# 第五阶段：订单管理列表

## AI-Baby 订单管理列表开发

继续开发：

订单管理页。

页面：

```text
pages/admin/order/index.vue
```

### 页面功能

实现：

- 订单列表
- 状态筛选
- 查看订单详情

### 订单状态

```text
0 待付款
1 待制作
2 配送中
3 已完成
4 已取消
```

### 展示内容

- 订单号
- 用户电话
- 配送地址
- 商品数量
- 总价
- 状态
- 创建时间

### 列表要求

- 分页
- 每页10条
- 下拉加载更多
- 下拉刷新

### 云函数

生成：

```text
cloudfunctions/
  admin-order-list/
```

### API

封装：

- getAdminOrderList

### 页面要求

- 卡片式布局
- 状态颜色区分
- 支持空状态

### 输出要求

生成：

- 页面
- 云函数
- API
- 类型定义

不要伪代码。
