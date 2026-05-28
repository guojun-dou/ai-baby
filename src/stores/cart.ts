import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 与业务约定一致：云文档 _id 或前端 id */
export interface CartItem {
  _id: string
  title: string
  price: number
  cover: string
  count: number
}

const STORAGE_KEY = 'cart'

function normalizeRow(r: Record<string, unknown>): CartItem {
  return {
    _id: String(r._id ?? ''),
    title: String(r.title ?? '商品'),
    price: Number(r.price) || 0,
    cover: String(r.cover ?? ''),
    count: Math.max(0, Math.floor(Number(r.count) || 0)),
  }
}

function loadCart(): CartItem[] {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!Array.isArray(raw))
      return []
    return raw
      .filter((x): x is Record<string, unknown> => x !== null && typeof x === 'object')
      .map(normalizeRow)
      .filter((i) => i._id !== '' && i.count > 0)
  }
  catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {
  const cartList = ref<CartItem[]>(loadCart())

  function persist() {
    try {
      uni.setStorageSync(STORAGE_KEY, cartList.value)
    }
    catch (e) {
      console.error(e)
    }
  }

  function addCart(payload: {
    _id: string
    title: string
    price: number
    cover: string
    count?: number
  }) {
    const id = String(payload._id)
    if (!id)
      return
    const add = Math.max(1, Math.floor(payload.count ?? 1))
    const idx = cartList.value.findIndex((i) => i._id === id)
    if (idx >= 0) {
      const row = cartList.value[idx]!
      cartList.value.splice(idx, 1, {
        ...row,
        count: row.count + add,
      })
    }
    else {
      cartList.value.push({
        _id: id,
        title: payload.title,
        price: payload.price,
        cover: payload.cover,
        count: add,
      })
    }
    persist()
  }

  function removeCart(_id: string) {
    cartList.value = cartList.value.filter((i) => i._id !== _id)
    persist()
  }

  function clearCart() {
    cartList.value = []
    persist()
  }

  function changeCount(_id: string, count: number) {
    const c = Math.floor(count)
    if (c < 1) {
      removeCart(_id)
      return
    }
    const idx = cartList.value.findIndex((i) => i._id === _id)
    if (idx < 0)
      return
    const row = cartList.value[idx]!
    cartList.value.splice(idx, 1, { ...row, count: c })
    persist()
  }

  const totalPrice = computed(() =>
    cartList.value.reduce((sum, i) => sum + i.price * i.count, 0),
  )

  const totalCount = computed(() =>
    cartList.value.reduce((sum, i) => sum + i.count, 0),
  )

  /** 从本地缓存重新载入（如从其他入口写过 Storage） */
  function hydrateFromStorage() {
    cartList.value = loadCart()
  }

  return {
    cartList,
    addCart,
    removeCart,
    clearCart,
    changeCount,
    totalPrice,
    totalCount,
    hydrateFromStorage,
  }
})
