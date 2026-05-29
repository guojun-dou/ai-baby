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
    const action =
      event.action != null ? String(event.action).trim() : 'status'

    if (!goodsId) {
      return fail('缺少 goodsId')
    }

    const docRef = db.collection('goods').doc(goodsId)
    const snap = await docRef.get()
    if (!snap.data) {
      return fail('商品不存在', 404)
    }

    const updateData = {
      updateTime: db.serverDate(),
    }

    if (action === 'delete') {
      Object.assign(updateData, { deleted: true })
    }
    else if (action === 'status') {
      const status = Number(event.status)
      if (status !== 0 && status !== 1) {
        return fail('status 须为 0 或 1')
      }
      Object.assign(updateData, { status })
    }
    else {
      return fail('未知 action（status | delete）')
    }

    await docRef.update({ data: updateData })

    return success({
      goodsId,
      action,
      status: action === 'status' ? Number(event.status) : undefined,
      deleted: action === 'delete' ? true : undefined,
    })
  }
  catch (err) {
    console.error('[admin-update-goods-status]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    const code =
      err && typeof err === 'object' && err.code === 'FORBIDDEN' ? 403 : -1
    return fail(msg, code)
  }
}
