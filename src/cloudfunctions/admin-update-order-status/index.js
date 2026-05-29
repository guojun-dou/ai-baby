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
    const nextStatus = normalizeStatusCode(event.status)

    if (!orderId) {
      return fail('缺少 orderId')
    }
    if (![0, 1, 2, 3, 4].includes(nextStatus)) {
      return fail('status 须为 0-4')
    }

    const docRef = db.collection('orders').doc(orderId)
    const snap = await docRef.get()
    if (!snap.data) {
      return fail('订单不存在', 404)
    }

    const currentStatus = normalizeStatusCode(snap.data.status)
    if (!canTransition(currentStatus, nextStatus)) {
      return fail('不允许的状态变更')
    }

    await docRef.update({
      data: {
        status: nextStatus,
        updateTime: db.serverDate(),
      },
    })

    return success({
      orderId,
      status: nextStatus,
    })
  }
  catch (err) {
    console.error('[admin-update-order-status]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
