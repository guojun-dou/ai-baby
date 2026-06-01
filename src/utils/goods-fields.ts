import type { GoodDetail, GoodItem } from '@/types/goods'

export function getGoodsId(item: GoodItem): string {
  return String(item._id ?? item.id ?? '')
}

export function getGoodsTitle(item: GoodItem): string {
  return (item.title ?? item.name ?? '未命名商品').trim() || '未命名商品'
}

/** 列表首图：cover → image/imgUrl → images[0] */
export function getGoodsCover(item: GoodItem): string {
  const fromCover = (item.cover ?? item.image ?? item.imgUrl ?? '').trim()
  if (fromCover) {
    return fromCover
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images.find((u) => u && String(u).trim() !== '')
    if (first) {
      return String(first).trim()
    }
  }
  return ''
}

export function getGoodsDesc(item: GoodItem): string {
  const t = (item.desc ?? item.description ?? item.summary ?? '').trim()
  return t || '营养配比，守护每一口成长'
}

/**
 * 卡片角标/标签：优先 `tags`（多段用 · 连接），其次 `age`，再兼容旧月龄字段。
 */
export function getGoodsCardTag(item: GoodItem): string {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags
      .filter((t) => t != null && String(t).trim() !== '')
      .slice(0, 2)
      .map((t) => String(t).trim())
      .join(' · ')
  }
  if (item.age != null && String(item.age).trim() !== '') {
    return String(item.age).trim()
  }
  if (item.month_label != null && String(item.month_label).trim() !== '') {
    return String(item.month_label).trim()
  }
  if (item.monthAge != null && String(item.monthAge).trim() !== '') {
    return `${item.monthAge}月龄`
  }
  if (item.ageMonths != null && !Number.isNaN(Number(item.ageMonths))) {
    return `${item.ageMonths}月龄`
  }
  return '全阶段'
}

/** 是否可购买：上架、未删除、有库存 */
export function isGoodsPurchasable(item: GoodItem | null | undefined): boolean {
  if (!item) {
    return false
  }
  if (item.deleted === true) {
    return false
  }
  const st = item.status
  if (st === 0) {
    return false
  }
  const stock = item.stock
  if (typeof stock === 'number' && stock <= 0) {
    return false
  }
  return true
}

/** 详情轮播：images 非空优先，否则单图 cover / 旧字段 */
export function getDetailImageList(d: GoodDetail | null | undefined): string[] {
  if (!d) {
    return []
  }
  if (Array.isArray(d.images) && d.images.length > 0) {
    return d.images.filter(Boolean).map(String)
  }
  const one = (d.cover ?? d.image ?? d.imgUrl ?? '').trim()
  return one ? [one] : []
}

/** 详情月龄 pill：age 优先，再 month_label 与旧字段 */
export function getDetailAgeLabel(d: GoodDetail | null | undefined): string {
  if (!d) {
    return ''
  }
  if (d.age != null && String(d.age).trim() !== '') {
    return String(d.age).trim()
  }
  if (d.month_label != null && String(d.month_label).trim() !== '') {
    return String(d.month_label).trim()
  }
  if (d.monthAge != null && String(d.monthAge).trim() !== '') {
    return `${d.monthAge} 月龄`
  }
  if (d.ageMonths != null && !Number.isNaN(Number(d.ageMonths))) {
    return `${d.ageMonths} 月龄`
  }
  return '全阶段'
}
