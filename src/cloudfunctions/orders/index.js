const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

function ok(data) {
  return {
    success: true,
    data,
  }
}

function fail(code, message) {
  return {
    success: false,
    code,
    message,
    error: message,
  }
}

/**
 * @param {unknown} v
 * @returns {string}
 */
function toIsoTime(v) {
  if (v == null)
    return ''
  if (v instanceof Date)
    return v.toISOString()
  if (typeof v === 'string')
    return v
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
 * @param {Record<string, unknown>} g
 * @returns {Record<string, unknown>}
 */
function normalizeGoodsLine(g) {
  const title = g.title != null ? String(g.title).trim() : ''
  const line = {
    title,
    price: Number(g.price),
    count: Math.floor(Number(g.count)),
    cover: g.cover != null ? String(g.cover) : '',
  }
  const gid =
    g.goodsId != null
      ? String(g.goodsId).trim()
      : g._id != null
        ? String(g._id).trim()
        : ''
  if (gid)
    Object.assign(line, { goodsId: gid })
  return line
}

/**
 * @param {Record<string, unknown>} doc
 * @returns {unknown[]}
 */
function pickGoodsList(doc) {
  if (Array.isArray(doc.goodsList))
    return doc.goodsList
  if (Array.isArray(doc.goods))
    return doc.goods
  return []
}

/**
 * @param {Record<string, unknown>} doc
 * @returns {number}
 */
function pickTotalPrice(doc) {
  const v = doc.totalPrice !== undefined && doc.totalPrice !== null
    ? doc.totalPrice
    : doc.total
  return typeof v === 'number' ? v : Number(v) || 0
}

/**
 * @param {Record<string, unknown>} doc
 * @returns {string}
 */
function pickCreateTime(doc) {
  return toIsoTime(doc.createTime ?? doc.createdAt)
}

/**
 * @param {unknown} line
 */
function mapGoodsLineForList(line) {
  if (line == null || typeof line !== 'object') {
    return { title: '', count: 0, cover: '' }
  }
  const o = /** @type {Record<string, unknown>} */ (line)
  return {
    title: o.title != null ? String(o.title) : '',
    cover: o.cover != null ? String(o.cover) : '',
    count: Math.floor(Number(o.count)) || 0,
  }
}

/**
 * @param {Record<string, unknown>} doc
 */
function mapOrderDoc(doc) {
  const id = doc._id != null ? String(doc._id) : ''
  const rawLines = pickGoodsList(doc)
  const goodsList = rawLines.map(mapGoodsLineForList)
  return {
    id,
    status: normalizeStatusCode(doc.status),
    totalPrice: pickTotalPrice(doc),
    createTime: pickCreateTime(doc),
    goodsList,
  }
}

/**
 * @param {string} phone
 */
function isPhoneCn(phone) {
  return /^1\d{10}$/.test(phone)
}

/**
 * @param {Record<string, unknown>} event
 * @param {string} openid
 */
async function handleCreate(event, openid) {
  const linesRaw = event.goodsList ?? event.goods
  const totalPriceRaw = event.totalPrice ?? event.total
  const usernameRaw = event.username ?? event.receiverName
  const phone = event.phone != null ? String(event.phone).trim() : ''
  const address = event.address != null ? String(event.address).trim() : ''

  if (!Array.isArray(linesRaw) || linesRaw.length === 0) {
    return fail('BAD_REQUEST', 'goodsList 必须为非空数组')
  }

  for (let i = 0; i < linesRaw.length; i++) {
    const g = linesRaw[i]
    if (g == null || typeof g !== 'object') {
      return fail('BAD_REQUEST', `goodsList[${i}] 格式错误`)
    }
    const go = /** @type {Record<string, unknown>} */ (g)
    const title = go.title != null ? String(go.title).trim() : ''
    const count = Number(go.count)
    if (!title) {
      return fail('BAD_REQUEST', `goodsList[${i}].title 不能为空`)
    }
    if (!Number.isFinite(count) || count < 1) {
      return fail('BAD_REQUEST', `goodsList[${i}].count 须为 >=1 的整数`)
    }
  }

  const totalPrice =
    typeof totalPriceRaw === 'number' ? totalPriceRaw : Number(totalPriceRaw)
  if (!Number.isFinite(totalPrice) || totalPrice <= 0) {
    return fail('BAD_REQUEST', 'totalPrice 须为大于 0 的数字')
  }

  let sum = 0
  for (const g of linesRaw) {
    const go = /** @type {Record<string, unknown>} */ (g)
    const price = go.price != null ? Number(go.price) : NaN
    const cnt = Number(go.count)
    if (!Number.isFinite(price) || price < 0) {
      return fail('BAD_REQUEST', '每件商品需提供合法 price')
    }
    sum += price * cnt
  }
  if (Math.abs(sum - totalPrice) > 0.02) {
    return fail('BAD_REQUEST', '商品金额与合计不一致')
  }

  const username = usernameRaw != null ? String(usernameRaw).trim() : ''

  if (username.length < 2) {
    return fail('BAD_REQUEST', 'username 至少 2 个字')
  }
  if (!isPhoneCn(phone)) {
    return fail('BAD_REQUEST', '手机号须为 11 位大陆号码')
  }
  if (address.length < 5) {
    return fail('BAD_REQUEST', 'address 至少 5 个字')
  }

  const remark = event.remark != null ? String(event.remark).trim().slice(0, 200) : ''
  const deliveryTime =
    event.deliveryTime != null ? String(event.deliveryTime).trim().slice(0, 64) : ''

  const goodsList = linesRaw.map((g) =>
    normalizeGoodsLine(/** @type {Record<string, unknown>} */ (g)),
  )

  const addRes = await db.collection('orders').add({
    data: {
      openid,
      goodsList,
      totalPrice,
      status: 1,
      username,
      phone,
      address,
      remark,
      deliveryTime,
      createTime: db.serverDate(),
      updateTime: db.serverDate(),
    },
  })

  return ok({
    orderId: addRes._id,
    status: 1,
    totalPrice,
  })
}

/**
 * @param {Record<string, unknown>} event
 * @param {string} openid
 */
async function handleList(event, openid) {
  const page = Math.max(1, Math.floor(Number(event.page) || 1))
  const pageSize = Math.min(
    20,
    Math.max(1, Math.floor(Number(event.pageSize) || 10)),
  )
  const statusRaw = event.status != null ? String(event.status).trim() : 'all'

  const _ = db.command
  const conditions = [{ openid }]

  if (statusRaw !== '' && statusRaw !== 'all') {
    const code = normalizeStatusCode(
      Number.isFinite(Number(statusRaw)) ? Number(statusRaw) : statusRaw,
    )
    conditions.push({
      status: _.in(statusCodeToDbValues(code)),
    })
  }

  const where = _.and(conditions)
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
    mapOrderDoc(/** @type {Record<string, unknown>} */ (doc)),
  )

  return ok({
    list,
    page,
    pageSize,
    total,
    hasMore: skip + list.length < total,
  })
}

/**
 * @param {Record<string, unknown>} event
 */
exports.main = async (event = {}) => {
  try {
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID != null ? String(wxContext.OPENID) : ''

    if (!openid) {
      return fail('UNAUTHORIZED', '无法获取用户 openid，请从小程序端调用')
    }

    const action = event.action != null ? String(event.action).trim() : ''

    if (action === 'create') {
      return await handleCreate(event, openid)
    }
    if (action === 'list') {
      return await handleList(event, openid)
    }

    return fail('BAD_REQUEST', '缺少或未知的 action（create | list）')
  }
  catch (err) {
    console.error('[orders]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    return fail('INTERNAL', msg)
  }
}
