const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

/**
 * 统一成功返回
 * @param {Record<string, unknown>|Record<string, unknown>[]} data
 */
function ok(data) {
  return {
    success: true,
    data,
  }
}

/**
 * 统一失败返回（前端可依据 success === false 与 code 处理）
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
 * 获取商品列表（goods 集合）
 */
async function getGoodsList() {
  const res = await db.collection('goods').get()
  return ok(Array.isArray(res.data) ? res.data : [])
}

/**
 * 按文档 id 获取商品详情
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
 * 云函数入口
 *
 * 约定：
 * - 列表：不传 id，或传 action: 'list'
 * - 详情：传 id，或传 action: 'detail' 且带 id
 *
 * @param {{ action?: string, id?: string }} event
 */
exports.main = async (event = {}) => {
  try {
    const actionRaw = event.action
    const action =
      actionRaw === 'list' || actionRaw === 'detail' ? actionRaw : null
    const id =
      event.id !== undefined && event.id !== null
        ? String(event.id).trim()
        : ''

    if (action === 'list') {
      return await getGoodsList()
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

    return await getGoodsList()
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
