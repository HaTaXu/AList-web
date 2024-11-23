import {
  Box,
  Button,
  HStack,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tooltip,
  Tr,
  VStack,
} from "@hope-ui/solid"
import { createSignal, For } from "solid-js"
import {
  useFetch,
  useListFetch,
  useManageTitle,
  useRouter,
  useT,
} from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import {
  UserGroupPermissions,
  UserGroup,
  UserGroupMethods,
  PPageResp,
  PEmptyResp,
} from "~/types"
import { DeletePopover } from "../common/DeletePopover"
import { Wether } from "~/components"

const Permissions = (props: { user_group: UserGroup }) => {
  const t = useT()
  const color = (can: boolean) => `$${can ? "success" : "danger"}9`
  return (
    <HStack spacing="$0_5">
      <For each={UserGroupPermissions}>
        {(item, i) => (
          <Tooltip label={t(`users.permissions.${item}`)}>
            <Box
              boxSize="$2"
              rounded="$full"
              bg={color(UserGroupMethods.can(props.user_group.permission, i()))}
            ></Box>
          </Tooltip>
        )}
      </For>
    </HStack>
  )
}

const UserGroups = () => {
  const t = useT()
  useManageTitle("manage.sidemenu.user_groups")
  const { to } = useRouter()
  const [getUserGroupsLoading, getUserGroups] = useFetch(
    (): PPageResp<UserGroup> => r.get("/admin/user_group/list"),
  )
  const [userGroups, setUserGroups] = createSignal<UserGroup[]>([])
  const refresh = async () => {
    const resp = await getUserGroups()
    handleResp(resp, (data) => setUserGroups(data.content))
  }
  refresh()

  const [deleting, deleteUserGroup] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user_group/delete?id=${id}`),
  )
  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="accent"
          loading={getUserGroupsLoading()}
          onClick={refresh}
        >
          {t("global.refresh")}
        </Button>

        <Button
          onClick={() => {
            to("/@manage/userGroups/add")
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>

      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For
                each={[
                  "user_group_name",
                  "size",
                  "base_path",
                  "permission",
                  "available",
                ]}
              >
                {(title) => <Th>{t(`users.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>

          <Tbody>
            <For each={userGroups()}>
              {(userGroup) => (
                <Tr>
                  <Td>{userGroup.user_group_name}</Td>
                  <Td>{userGroup.size}</Td>
                  <Td>{userGroup.base_path}</Td>
                  <Td>
                    <Permissions user_group={userGroup} />
                  </Td>
                  <Td>
                    <Wether yes={!userGroup.disabled} />
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        colorScheme="accent"
                        onClick={() => {
                          to(`/@manage/userGroups/edit/${userGroup.id}`)
                        }}
                      >
                        {t("global.edit")}
                      </Button>

                      <Button
                        onClick={() => {
                          to(
                            `/@manage/userGroups/manage/${userGroup.user_group_name}`,
                          )
                        }}
                      >
                        {t("global.manage")}
                      </Button>

                      <DeletePopover
                        name={userGroup.user_group_name}
                        loading={deleting() === userGroup.id}
                        onClick={async () => {
                          const resp = await deleteUserGroup(userGroup.id)
                          handleResp(resp, () => {
                            notify.success(t("global.delete_success"))
                            refresh()
                          })
                        }}
                      />
                    </HStack>
                  </Td>
                </Tr>
              )}
            </For>
          </Tbody>
        </Table>
      </Box>
    </VStack>
  )
}

export default UserGroups
