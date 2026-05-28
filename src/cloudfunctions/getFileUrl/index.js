const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const MAX_FILE_LIST = 50

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
 * 云存储 fileID → 临时 HTTPS（服务端 getTempFileURL，避免客户端 STORAGE_EXCEED_AUTHORITY）
 *
 * @param {{ fileList?: string[] }} event
 * @returns {{ success: boolean, data?: Array<{ fileID: string, tempFileURL?: string, status: number, errMsg?: string }> }}
 */
exports.main = async (event = {}) => {
  try {
    const raw = event.fileList
    if (!Array.isArray(raw) || raw.length === 0) {
      return fail('BAD_REQUEST', 'fileList 必须为非空数组')
    }
    if (raw.length > MAX_FILE_LIST) {
      return fail('BAD_REQUEST', `单次最多 ${MAX_FILE_LIST} 个 fileID`)
    }

    const fileList = raw
      .map((id) => (id != null ? String(id).trim() : ''))
      .filter((id) => id.startsWith('cloud://'))

    if (fileList.length === 0) {
      return fail('BAD_REQUEST', 'fileList 中须包含有效的 cloud:// fileID')
    }

    const res = await cloud.getTempFileURL({ fileList })
    const list = Array.isArray(res.fileList) ? res.fileList : []

    return ok(
      list.map((row) => ({
        fileID: row.fileID,
        tempFileURL: row.tempFileURL ?? '',
        status: row.status,
        errMsg: row.errMsg ?? '',
      })),
    )
  }
  catch (err) {
    console.error('[getFileUrl]', err)
    const msg =
      err && typeof err === 'object' && err.message
        ? String(err.message)
        : '服务异常'
    return fail('INTERNAL', msg)
  }
}
