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
 * @param {Record<string, unknown>} doc
 */
function mapGoodsRow(doc) {
  return {
    _id: doc._id != null ? String(doc._id) : '',
    title: doc.title != null ? String(doc.title) : '',
    cover: doc.cover != null ? String(doc.cover) : '',
    price: Number(doc.price) || 0,
    stock: Number(doc.stock) || 0,
    sales: Number(doc.sales) || 0,
    status: doc.status === 0 ? 0 : 1,
    sort: Number(doc.sort) || 0,
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

    const page = Math.max(1, Math.floor(Number(event.page) || 1))
    const pageSize = Math.min(
      20,
      Math.max(1, Math.floor(Number(event.pageSize) || 10)),
    )
    const keyword =
      event.keyword != null ? String(event.keyword).trim() : ''

    const _ = db.command
    const conditions = [
      _.or([{ deleted: false }, { deleted: _.exists(false) }]),
    ]

    if (keyword) {
      conditions.push({
        title: db.RegExp({
          regexp: keyword,
          options: 'i',
        }),
      })
    }

    const where = _.and(conditions)
    const skip = (page - 1) * pageSize

    const [countRes, listRes] = await Promise.all([
      db.collection('goods').where(where).count(),
      db
        .collection('goods')
        .where(where)
        .orderBy('createTime', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get(),
    ])

    const total = countRes.total || 0
    const rawList = Array.isArray(listRes.data) ? listRes.data : []
    const list = rawList.map((doc) =>
      mapGoodsRow(/** @type {Record<string, unknown>} */ (doc)),
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
    console.error('[admin-goods-list]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
