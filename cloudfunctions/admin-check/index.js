const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

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
 * 获取当前用户 openid，校验 admin_users 集合
 */
exports.main = async () => {
  try {
    const wxContext = cloud.getWXContext()
    const openid =
      wxContext.OPENID != null ? String(wxContext.OPENID).trim() : ''

    if (!openid) {
      return fail('无法获取用户 openid，请从小程序端调用')
    }

    const res = await db
      .collection('admin_users')
      .where({ openid })
      .limit(1)
      .get()

    const row =
      Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null

    if (!row || String(row.role) !== 'admin') {
      return success({
        isAdmin: false,
        openid,
      })
    }

    return success({
      isAdmin: true,
      openid,
      name: row.name != null ? String(row.name) : '管理员',
    })
  }
  catch (err) {
    console.error('[admin-check]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    return fail(msg)
  }
}
