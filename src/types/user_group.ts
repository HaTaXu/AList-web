export interface UserGroup {
  id: number
  user_group_name: string
  ugn_apply_to_all: boolean
  size: number
  base_path: string
  bp_apply_to_all: boolean
  permission: number
  pms_apply_to_all: boolean
  disabled: boolean
}

export const UserGroupPermissions = [
  "see_hides",
  "access_without_password",
  "offline_download",
  "online_download",
  "write",
  "rename",
  "move",
  "copy",
  "delete",
  "webdav_read",
  "webdav_manage",
] as const

export const UserGroupMethods = {
  can: (permission: number, order: number) => ((permission >> order) & 1) == 1,
}
