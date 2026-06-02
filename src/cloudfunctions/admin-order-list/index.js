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
 * @param {number} code
 * @returns {Array<number|string>}
 */
function statusCodeToDbValues(code) {
  switch (code) {
    case 0:
      return [0, '0']
    case 1:
      return [1, '1', 'pending']
    case 2:
      return [2, '2', 'delivering']
    case 3:
      return [3, '3', 'completed']
    case 4:
      return [4, '4', 'cancelled', 'canceled']
    default:
      return [1, '1', 'pending']
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
 * @param {Record<string, unknown>} doc
 * @returns {number}
 */
function pickGoodsCount(doc) {
  const lines = pickGoodsList(doc)
  let sum = 0
  for (const line of lines) {
    if (line != null && typeof line === 'object') {
      const o = /** @type {Record<string, unknown>} */ (line)
      sum += Math.floor(Number(o.count)) || 0
    }
  }
  return sum
}

/**
 * @param {Record<string, unknown>} doc
 * @returns {number}
 */
function pickTotalPrice(doc) {
  const v =
    doc.totalPrice !== undefined && doc.totalPrice !== null
      ? doc.totalPrice
      : doc.total
  return typeof v === 'number' ? v : Number(v) || 0
}

/**
 * @param {Record<string, unknown>} doc
 */
function mapOrderRow(doc) {
  return {
    _id: doc._id != null ? String(doc._id) : '',
    phone: doc.phone != null ? String(doc.phone) : '',
    address: doc.address != null ? String(doc.address) : '',
    goodsCount: pickGoodsCount(doc),
    totalPrice: pickTotalPrice(doc),
    status: normalizeStatusCode(doc.status),
    createTime: toIsoTime(doc.createTime ?? doc.createdAt),
  }
}

/** 东八区今日 00:00:00 */
function getChinaTodayStart() {
  const offset = 8 * 60 * 60 * 1000
  const shNow = new Date(Date.now() + offset)
  return new Date(
    Date.UTC(
      shNow.getUTCFullYear(),
      shNow.getUTCMonth(),
      shNow.getUTCDate(),
      0,
      0,
      0,
      0,
    ) - offset,
  )
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

    const page = Math.max(1, Math.floor(Number(event.page) || 1))
    const pageSize = Math.min(
      20,
      Math.max(1, Math.floor(Number(event.pageSize) || 10)),
    )
    const statusRaw =
      event.status != null ? String(event.status).trim() : 'all'
    const dateFilterRaw =
      event.dateFilter != null ? String(event.dateFilter).trim() : 'all'

    const _ = db.command
    const conditions = []

    if (statusRaw !== '' && statusRaw !== 'all') {
      const code = normalizeStatusCode(
        Number.isFinite(Number(statusRaw)) ? Number(statusRaw) : statusRaw,
      )
      conditions.push({
        status: _.in(statusCodeToDbValues(code)),
      })
    }

    if (dateFilterRaw === 'today') {
      conditions.push({
        createTime: _.gte(getChinaTodayStart()),
      })
    }

    let where = {}
    if (conditions.length === 1) {
      where = conditions[0]
    }
    else if (conditions.length > 1) {
      where = _.and(conditions)
    }

    const skip = (page - 1) * pageSize

    const [countRes, listRes] = await Promise.all([
      db.collection('orders').where(where).count(),
      db
        .collection('orders')
        .where(where)
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get(),
    ])

    const total = countRes.total || 0
    const rawList = Array.isArray(listRes.data) ? listRes.data : []
    const list = rawList.map((doc) =>
      mapOrderRow(/** @type {Record<string, unknown>} */ (doc)),
    )

    return success({
      list,
      page,
      pageSize,
      total,
      hasMore: skip + list.length < total,
    })
  }
  catch (err) {
    console.error('[admin-order-list]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
