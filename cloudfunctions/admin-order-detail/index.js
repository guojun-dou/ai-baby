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
 * @returns {number}
 */
function normalizeStatusCode(raw) {
  if (raw === 0 || raw === '0') {
    return 0
  }
  if (raw === 1 || raw === '1' || raw === 'pending') {
    return 1
  }
  if (raw === 2 || raw === '2' || raw === 'delivering') {
    return 2
  }
  if (raw === 3 || raw === '3' || raw === 'completed') {
    return 3
  }
  if (raw === 4 || raw === '4' || raw === 'cancelled' || raw === 'canceled') {
    return 4
  }
  return 1
}

/**
 * @param {number} from
 * @param {number} to
 * @returns {boolean}
 */
function canTransition(from, to) {
  if (from === to) {
    return false
  }
  if (to === 4) {
    return from !== 4
  }
  if (from === 4 || from === 3) {
    return false
  }
  const forward = { 0: 1, 1: 2, 2: 3 }
  return forward[from] === to
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function toIsoTime(v) {
  if (v == null) {
    return ''
  }
  if (v instanceof Date) {
    return v.toISOString()
  }
  if (typeof v === 'string') {
    return v
  }
  try {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? '' : d.toISOString()
  }
  catch {
    return ''
  }
}

/**
 * @param {Record<string, unknown>} doc
 * @returns {unknown[]}
 */
function pickGoodsList(doc) {
  if (Array.isArray(doc.goodsList)) {
    return doc.goodsList
  }
  if (Array.isArray(doc.goods)) {
    return doc.goods
  }
  return []
}

/**
 * @param {unknown} line
 */
function mapGoodsLine(line) {
  if (line == null || typeof line !== 'object') {
    return { title: '', price: 0, count: 0, cover: '' }
  }
  const o = /** @type {Record<string, unknown>} */ (line)
  return {
    title: o.title != null ? String(o.title) : '',
    price: Number(o.price) || 0,
    count: Math.floor(Number(o.count)) || 0,
    cover: o.cover != null ? String(o.cover) : '',
  }
}

/**
 * @param {Record<string, unknown>} doc
 */
function mapOrderDetail(doc) {
  const rawLines = pickGoodsList(doc)
  const totalRaw =
    doc.totalPrice !== undefined && doc.totalPrice !== null
      ? doc.totalPrice
      : doc.total

  return {
    _id: doc._id != null ? String(doc._id) : '',
    username: doc.username != null ? String(doc.username) : '',
    phone: doc.phone != null ? String(doc.phone) : '',
    address: doc.address != null ? String(doc.address) : '',
    remark: doc.remark != null ? String(doc.remark) : '',
    deliveryTime: doc.deliveryTime != null ? String(doc.deliveryTime) : '',
    goodsList: rawLines.map(mapGoodsLine),
    totalPrice: typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0,
    status: normalizeStatusCode(doc.status),
    createTime: toIsoTime(doc.createTime ?? doc.createdAt),
    updateTime: toIsoTime(doc.updateTime ?? doc.createTime ?? doc.createdAt),
  }
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

    const orderId =
      event.orderId != null ? String(event.orderId).trim() : ''

    if (!orderId) {
      return fail('缺少 orderId')
    }

    const snap = await db.collection('orders').doc(orderId).get()
    if (!snap.data) {
      return fail('订单不存在', 404)
    }

    return success(mapOrderDetail(snap.data))
  }
  catch (err) {
    console.error('[admin-order-detail]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
