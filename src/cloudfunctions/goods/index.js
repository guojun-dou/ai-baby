const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

/**
 * @param {Record<string, unknown>|Record<string, unknown>[]} data
 */
function ok(data) {
  return {
    success: true,
    data,
  }
}

/**
 * @param {string} code
 * @param {string} message
 */
function fail(code, message) {
  return {
    success: false,
    code,
    message,
    error: message,
  }
}

/**
 * @param {Record<string, unknown>} doc
 */
function isOnSale(doc) {
  if (!doc) {
    return false
  }
  if (doc.deleted === true) {
    return false
  }
  if (doc.status === 0 || doc.status === '0') {
    return false
  }
  return true
}

/**
 * 用户端列表查询条件：上架且未删除
 */
function buildUserListWhere(keyword) {
  const _ = db.command
  const conditions = [
    _.or([{ deleted: false }, { deleted: _.exists(false) }]),
    _.or([{ status: 1 }, { status: _.exists(false) }]),
  ]

  const kw = keyword != null ? String(keyword).trim() : ''
  if (kw) {
    conditions.push({
      title: db.RegExp({
        regexp: kw,
        options: 'i',
      }),
    })
  }

  return _.and(conditions)
}

/**
 * @param {string} sortBy
 * @param {string} sortOrder
 */
function resolveListOrder(sortBy, sortOrder) {
  const by = sortBy != null ? String(sortBy).trim() : 'sort'
  const order = sortOrder === 'asc' ? 'asc' : 'desc'

  if (by === 'price') {
    return { field: 'price', order }
  }
  if (by === 'sales') {
    return { field: 'sales', order: 'desc' }
  }
  if (by === 'createTime') {
    return { field: 'createTime', order: 'desc' }
  }
  return { field: 'sort', order: 'asc' }
}

/**
 * 用户端商品分页列表
 * @param {Record<string, unknown>} event
 */
async function getUserGoodsList(event) {
  const page = Math.max(1, Math.floor(Number(event.page) || 1))
  const pageSize = Math.min(
    20,
    Math.max(1, Math.floor(Number(event.pageSize) || 10)),
  )
  const keyword = event.keyword != null ? String(event.keyword).trim() : ''
  const { field, order } = resolveListOrder(event.sortBy, event.sortOrder)

  const where = buildUserListWhere(keyword)
  const skip = (page - 1) * pageSize

  const [countRes, listRes] = await Promise.all([
    db.collection('goods').where(where).count(),
    db
      .collection('goods')
      .where(where)
      .orderBy(field, order)
      .skip(skip)
      .limit(pageSize)
      .get(),
  ])

  const total = countRes.total || 0
  const rawList = Array.isArray(listRes.data) ? listRes.data : []
  let list = rawList

  if (field === 'sort') {
    list = [...rawList].sort((a, b) => {
      const sa = Number(a.sort) || 0
      const sb = Number(b.sort) || 0
      if (sa !== sb) {
        return sa - sb
      }
      const ta = Date.parse(String(a.createTime ?? '')) || 0
      const tb = Date.parse(String(b.createTime ?? '')) || 0
      return tb - ta
    })
  }

  return ok({
    list,
    page,
    pageSize,
    total,
    hasMore: skip + list.length < total,
  })
}

/**
 * @param {string} id
 */
async function getGoodsDetail(id) {
  const snapshot = await db.collection('goods').doc(id).get()
  if (!snapshot.data) {
    return fail('NOT_FOUND', '商品不存在')
  }
  return ok(snapshot.data)
}

/**
 * 购物车批量校验在售状态
 * @param {Record<string, unknown>} event
 */
async function batchCheckGoods(event) {
  const idsRaw = event.ids
  if (!Array.isArray(idsRaw) || idsRaw.length === 0) {
    return ok({ items: [] })
  }

  const ids = [...new Set(idsRaw.map((id) => String(id).trim()).filter(Boolean))].slice(
    0,
    50,
  )

  const _ = db.command
  const res = await db
    .collection('goods')
    .where({ _id: _.in(ids) })
    .get()

  const docs = Array.isArray(res.data) ? res.data : []
  const docMap = new Map()
  for (const doc of docs) {
    if (doc && doc._id != null) {
      docMap.set(String(doc._id), doc)
    }
  }

  const items = ids.map((id) => {
    const doc = docMap.get(id)
    const onSale = isOnSale(doc)
    const title = doc && doc.title != null ? String(doc.title) : ''
    const price = doc ? Number(doc.price) || 0 : 0
    const cover = doc && doc.cover != null ? String(doc.cover) : ''
    const stock = doc ? Math.floor(Number(doc.stock) || 0) : 0
    return {
      _id: id,
      onSale,
      title,
      price,
      cover,
      stock,
    }
  })

  return ok({ items })
}

/**
 * @param {{ action?: string, id?: string }} event
 */
exports.main = async (event = {}) => {
  try {
    const actionRaw = event.action
    const action =
      actionRaw === 'list' || actionRaw === 'detail' || actionRaw === 'batchCheck'
        ? actionRaw
        : null
    const id =
      event.id !== undefined && event.id !== null
        ? String(event.id).trim()
        : ''

    if (action === 'list') {
      return await getUserGoodsList(event)
    }

    if (action === 'batchCheck') {
      return await batchCheckGoods(event)
    }

    if (action === 'detail') {
      if (!id) {
        return fail('BAD_REQUEST', '缺少商品 id')
      }
      return await getGoodsDetail(id)
    }

    if (id) {
      return await getGoodsDetail(id)
    }

    return await getUserGoodsList(event)
  }
  catch (err) {
    console.error('[goods]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    return fail('INTERNAL', msg)
  }
}
