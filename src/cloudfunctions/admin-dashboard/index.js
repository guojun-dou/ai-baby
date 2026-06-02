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
      return [2, '2', 'delivering']
  }
}

exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext()
    const openid =
      wxContext.OPENID != null ? String(wxContext.OPENID).trim() : ''

    await assertAdmin(openid)

    const _ = db.command
    const todayStart = getChinaTodayStart()

    const goodsWhere = _.or([{ deleted: false }, { deleted: _.exists(false) }])

    const [todayRes, deliveryRes, goodsRes] = await Promise.all([
      db
        .collection('orders')
        .where({
          createTime: _.gte(todayStart),
        })
        .count(),
      db
        .collection('orders')
        .where({
          status: _.in(statusCodeToDbValues(2)),
        })
        .count(),
      db.collection('goods').where(goodsWhere).count(),
    ])

    return success({
      todayOrderCount: todayRes.total || 0,
      deliveryCount: deliveryRes.total || 0,
      goodsCount: goodsRes.total || 0,
    })
  }
  catch (err) {
    console.error('[admin-dashboard]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
