const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

/** @typedef {'pending'|'delivering'|'completed'} OrderStatus */

const ORDER_STATUS = new Set(['pending', 'delivering', 'completed'])

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
 * 列表页需要的单行形状
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
 * 数据库文档 -> 前端订单列表项（与小程序 OrderRecord 对齐）
 * @param {Record<string, unknown>} doc
 */
function mapOrderDoc(doc) {
  const id = doc._id != null ? String(doc._id) : ''
  const rawLines = pickGoodsList(doc)
  const goodsList = rawLines.map(mapGoodsLineForList)
  return {
    id,
    status: doc.status,
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
 * 创建订单（入库字段与 `OrderMongoDocument` 一致）
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
      status: 'pending',
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
    status: 'pending',
    totalPrice,
  })
}

/**
 * 当前用户的订单列表
 * @param {string} openid
 */
async function handleList(openid) {
  const res = await db.collection('orders').where({ openid }).get()

  const raw = Array.isArray(res.data) ? res.data : []
  const list = raw
    .map((doc) => mapOrderDoc(doc))
    .sort((a, b) => {
      const ta = Date.parse(a.createTime) || 0
      const tb = Date.parse(b.createTime) || 0
      return tb - ta
    })
  return ok(list)
}

/**
 * 更新订单状态（仅订单归属者可改）
 * @param {Record<string, unknown>} event
 * @param {string} openid
 */
async function handleUpdateStatus(event, openid) {
  const orderId = event.orderId != null ? String(event.orderId).trim() : ''
  const status = event.status != null ? String(event.status).trim() : ''

  if (!orderId) {
    return fail('BAD_REQUEST', '缺少 orderId')
  }
  if (!ORDER_STATUS.has(status)) {
    return fail('BAD_REQUEST', 'status 须为 pending | delivering | completed')
  }

  const docRef = db.collection('orders').doc(orderId)
  const snap = await docRef.get()
  if (!snap.data) {
    return fail('NOT_FOUND', '订单不存在')
  }
  const owner = snap.data.openid != null ? String(snap.data.openid) : ''
  if (owner !== openid) {
    return fail('FORBIDDEN', '无权操作该订单')
  }

  await docRef.update({
    data: {
      status,
      updateTime: db.serverDate(),
    },
  })

  return ok({
    orderId,
    status,
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
      return await handleList(openid)
    }
    if (action === 'updateStatus') {
      return await handleUpdateStatus(event, openid)
    }

    return fail('BAD_REQUEST', '缺少或未知的 action（create | list | updateStatus）')
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
