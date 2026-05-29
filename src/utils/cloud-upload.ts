/**
 * 选择图片并上传微信云存储，返回 cloud fileID（不持久化 tempFilePath）。
 */
export function uploadGoodsImage(localPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const extMatch = localPath.match(/\.(\w+)(?:\?|$)/)
    const ext = extMatch?.[1] ?? 'jpg'
    const cloudPath = `goods/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    wx.cloud.uploadFile({
      cloudPath,
      filePath: localPath,
      success(res) {
        if (res.fileID) {
          resolve(res.fileID)
          return
        }
        reject(new Error('上传失败'))
      },
      fail(err) {
        reject(err)
      },
    })
    // #endif

    // #ifndef MP-WEIXIN
    resolve('/static/logo.svg')
    // #endif
  })
}

/**
 * 批量上传本地临时路径，返回 cloud fileID 列表。
 */
export async function uploadGoodsImages(localPaths: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const p of localPaths) {
    const id = await uploadGoodsImage(p)
    ids.push(id)
  }
  return ids
}
