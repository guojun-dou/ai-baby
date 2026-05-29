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