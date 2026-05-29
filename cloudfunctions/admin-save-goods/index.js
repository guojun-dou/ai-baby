const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

/**
 * @param {string} openid
 */
async function assertAdmin(openid) {
  if (!openid) {
    const err = new Error('无法获取用户 openid')
    err.code = 'UNAUTHORIZED'
    throw err
  }

  const res = await db
    .collection('admin_users')
    .where({ openid })
    .limit(1)
    .get()

  const row =
    Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null

  if (!row || String(row.role) !== 'admin') {
    const err = new Error('无管理员权限')
    err.code = 'FORBIDDEN'
    throw err
  }

  return row
}

/**
 * @param {unknown} data
 */
function success(data) {
  return {
    code: 0,
    message: 'success',
    data,
  }
}

/**
 * @param {string} message
 * @param {number} [code]
 */
function fail(message, code = -1) {
  return {
    code,
    message,
    data: null,
  }
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeTags(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0)
  }
  if (raw == null) {
    return []
  }
  return String(raw)
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
function normalizeImages(raw) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .map((u) => String(u).trim())
    .filter((u) => u.startsWith('cloud://'))
}

/**
 * @param {Record<string, unknown>} event
 */
function buildGoodsDoc(event) {
  const title = event.title != null ? String(event.title).trim() : ''
  const desc = event.desc != null ? String(event.desc).trim() : ''
  const age = event.age != null ? String(event.age).trim() : ''

  if (title.length < 2) {
    throw new Error('商品标题至少 2 个字')
  }
  if (!desc) {
    throw new Error('请填写商品描述')
  }

  const price = Number(event.price)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('请填写合法价格')
  }

  const stock = Math.floor(Number(event.stock))
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error('请填写合法库存')
  }

  const status = Number(event.status) === 0 ? 0 : 1
  const images = normalizeImages(event.images)
  const coverRaw = event.cover != null ? String(event.cover).trim() : ''
  const cover =
    coverRaw && coverRaw.startsWith('cloud://')
      ? coverRaw
      : images[0] ?? ''

  if (!cover) {
    throw new Error('请至少上传一张商品图片')
  }

  const originalPriceRaw = event.originalPrice
  let originalPrice
  if (originalPriceRaw !== undefined && originalPriceRaw !== null && originalPriceRaw !== '') {
    originalPrice = Number(originalPriceRaw)
    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
      throw new Error('原价格式不正确')
    }
  }

  const subtitle =
    event.subtitle != null ? String(event.subtitle).trim() : ''
  const category =
    event.category != null ? String(event.category).trim() : ''
  const sort = Math.floor(Number(event.sort) || 0)
  const tags = normalizeTags(event.tags)

  const doc = {
    title,
    subtitle,
    desc,
    price,
    stock,
    age,
    category,
    tags,
    images: images.length > 0 ? images : [cover],
    cover,
    status,
    sort,
    deleted: false,
    nutrition: event.nutrition != null ? String(event.nutrition) : '',
    ingredients: event.ingredients != null ? String(event.ingredients) : '',
    storage: event.storage != null ? String(event.storage) : '',
  }

  if (originalPrice !== undefined) {
    Object.assign(doc, { originalPrice })
  }

  return doc
}

/**
 * @param {Record<string, unknown>} event
 */
exports.main = async (event = {}) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid =
      wxContext.OPENID != null ? String(wxContext.OPENID).trim() : ''

    await assertAdmin(openid)

    const goodsId =
      event.goodsId != null ? String(event.goodsId).trim() : ''
    const doc = buildGoodsDoc(event)

    if (goodsId) {
      const snap = await db.collection('goods').doc(goodsId).get()
      if (!snap.data) {
        return fail('商品不存在', 404)
      }

      await db.collection('goods').doc(goodsId).update({
        data: {
          ...doc,
          updateTime: db.serverDate(),
        },
      })

      return success({ goodsId })
    }

    const addRes = await db.collection('goods').add({
      data: {
        ...doc,
        sales: 0,
        createTime: db.serverDate(),
        updateTime: db.serverDate(),
      },
    })

    return success({ goodsId: addRes._id })
  }
  catch (err) {
    console.error('[admin-save-goods]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
