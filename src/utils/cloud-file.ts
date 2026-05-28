/**
 * 微信云存储 fileID（cloud://...）不能直接作为 <image src>：
 * 小程序会按当前页目录拼相对路径，出现 /pages/cart/cloud://... 。
 * 展示层通过云函数 getFileUrl 换临时 https；库内仍存 cloud:// fileID。
 */

export function isCloudFileId(url: string | undefined | null): boolean {
  if (url == null || typeof url !== 'string') {
    return false
  }
  return url.trim().startsWith('cloud://')
}

/** 可直接绑定 <image src>，不会被当成相对路径 */
export function isDirectImageSrc(url: string): boolean {
  const u = url.trim()
  if (!u || isCloudFileId(u)) {
    return false
  }
  return (
    u.startsWith('https://')
    || u.startsWith('http://')
    || u.startsWith('wxfile://')
    || u.startsWith('/')
    || u.startsWith('data:')
  )
}

function lookupUrlMap(
  fileId: string,
  urlMap?: ReadonlyMap<string, string> | Record<string, string>,
): string {
  if (!urlMap) {
    return ''
  }
  if (urlMap instanceof Map) {
    return urlMap.get(fileId) ?? ''
  }
  return urlMap[fileId] ?? ''
}

/**
 * 供模板 :src 使用：cloud:// 仅在有 https 映射时返回；否则返回 ''（勿回退 fileID）。
 */
export function resolveImageSrcForDisplay(
  raw: string | undefined | null,
  urlMap?: ReadonlyMap<string, string> | Record<string, string>,
): string {
  const u = String(raw ?? '').trim()
  if (!u) {
    return ''
  }
  if (isCloudFileId(u)) {
    const resolved = lookupUrlMap(u, urlMap)
    return isDirectImageSrc(resolved) ? resolved : ''
  }
  return isDirectImageSrc(u) ? u : ''
}

interface GetFileUrlRow {
  fileID: string
  tempFileURL?: string
  status: number
  errMsg?: string
}

interface GetFileUrlCloudResult {
  success?: boolean
  data?: GetFileUrlRow[]
  message?: string
}

/** 调用云函数 getFileUrl，将一批 cloud:// 转为临时 https */
async function fetchTempUrlMapFromCloud(fileIds: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  if (fileIds.length === 0) {
    return out
  }

  // #ifdef MP-WEIXIN
  return new Promise((resolve) => {
    wx.cloud.callFunction({
      name: 'getFileUrl',
      data: { fileList: [...fileIds] },
      success(res) {
        const result = res.result as GetFileUrlCloudResult
        if (!result?.success || !Array.isArray(result.data)) {
          console.warn('[cloud-file] getFileUrl:', result?.message ?? 'invalid response')
          resolve(out)
          return
        }
        for (const row of result.data) {
          if (
            row.status === 0
            && row.tempFileURL
            && isDirectImageSrc(row.tempFileURL)
          ) {
            out.set(row.fileID, row.tempFileURL)
          }
          else {
            console.warn(
              '[cloud-file] getFileUrl row:',
              row.fileID,
              row.errMsg ?? `status=${row.status}`,
            )
          }
        }
        resolve(out)
      },
      fail(err) {
        console.warn('[cloud-file] getFileUrl cloud fail:', err)
        resolve(out)
      },
    })
  })
  // #endif

  // #ifndef MP-WEIXIN
  return out
  // #endif
}

/**
 * 批量解析 cloud:// → 临时 URL；非 cloud 字符串映射为自身。
 * 单次最多 50 条（与云函数、微信限制一致），内部自动分片。
 */
export async function fetchCloudTempUrlMap(
  fileIds: readonly string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  const uniq = [...new Set(fileIds.map((x) => String(x ?? '').trim()).filter(Boolean))]
  for (const id of uniq) {
    if (!isCloudFileId(id) && isDirectImageSrc(id)) {
      out.set(id, id)
    }
  }
  const cloudOnly = uniq.filter(isCloudFileId)
  if (cloudOnly.length === 0) {
    return out
  }

  const chunkSize = 50
  for (let i = 0; i < cloudOnly.length; i += chunkSize) {
    const slice = cloudOnly.slice(i, i + chunkSize)
    const chunkMap = await fetchTempUrlMapFromCloud(slice)
    for (const [k, v] of chunkMap) {
      out.set(k, v)
    }
  }

  return out
}

/** 与输入数组等长，仅返回可安全用于 <image src> 的地址 */
export async function toDisplayImageUrls(urls: readonly string[]): Promise<string[]> {
  const list = urls.map((x) => String(x ?? '').trim())
  const m = await fetchCloudTempUrlMap(list)
  return list.map((u) => resolveImageSrcForDisplay(u, m))
}
