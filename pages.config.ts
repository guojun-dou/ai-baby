import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

export default defineUniPages({
  easycom: {
    autoscan: true,
    custom: {
      // uni_modules 插件（与 npm @dcloudio/uni-ui 解耦）；勿指回 node_modules
      '^uni-(.*)': '@/uni_modules/uni-$1/components/uni-$1/uni-$1.vue',
    },
  },
  pages: [],
  tabBar: {
    color: '#999999',
    selectedColor: '#ff8ba7',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'static/tab/home.png',
        selectedIconPath: 'static/tab/home-active.png',
      },
      {
        pagePath: 'pages/cart/cart',
        text: '购物车',
        iconPath: 'static/tab/cart.png',
        selectedIconPath: 'static/tab/cart-active.png',
      },
      {
        pagePath: 'pages/order/list',
        text: '订单',
        iconPath: 'static/tab/order.png',
        selectedIconPath: 'static/tab/order-active.png',
      },
      {
        pagePath: 'pages/my/my',
        text: '我的',
        iconPath: 'static/tab/my.png',
        selectedIconPath: 'static/tab/my-active.png',
      },
    ],
  },
  globalStyle: {
    backgroundColor: '@bgColor',
    backgroundColorBottom: '@bgColorBottom',
    backgroundColorTop: '@bgColorTop',
    backgroundTextStyle: '@bgTxtStyle',
    navigationBarBackgroundColor: '#000000',
    navigationBarTextStyle: '@navTxtStyle',
    navigationBarTitleText: 'Uni Creator',
    navigationStyle: 'custom',
  },
  subPackages: [],
})
