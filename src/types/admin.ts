/** admin_users 集合文档 */
export interface AdminUserDocument {
  _id?: string
  openid: string
  role: 'admin'
  name: string
}

/** admin-check 云函数 data 字段 */
export interface AdminCheckData {
  isAdmin: boolean
  name?: string
  openid?: string
}

/** 管理端云函数统一响应 */
export interface AdminCloudResponse<T = unknown> {
  code: number
  message: string
  data: T | null
}
