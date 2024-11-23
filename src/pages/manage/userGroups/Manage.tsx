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
  Icon,
} from "@hope-ui/solid"
import { createSignal, For, Show } from "solid-js"
import { useFetch, useListFetch, useRouter, useT } from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import {
  User,
  PPageResp,
  PEmptyResp,
  UserPermissions,
  UserMethods,
} from "~/types"
import { DeletePopover } from "../common/DeletePopover"
import { Wether } from "~/components"
import { BsArrowLeftCircle, BsArrowLeftCircleFill } from "solid-icons/bs"

const Permissions = (props: { user: User }) => {
  const t = useT()
  const color = (can: boolean) => `$${can ? "success" : "danger"}9`
  return (
    <HStack spacing="$0_5">
      <For each={UserPermissions}>
        {(item, i) => (
          <Tooltip label={t(`users.permissions.${item}`)}>
            <Box
              boxSize="$2"
              rounded="$full"
              bg={color(UserMethods.can(props.user, i()))}
            ></Box>
          </Tooltip>
        )}
      </For>
    </HStack>
  )
}

const GroupUsers = () => {
  const t = useT()
  const { to, params, back } = useRouter()

  // 获取当前用户组名称
  const { user_group_name } = params

  const [getUsersLoading, getUsers] = useFetch(
    (): PPageResp<User> =>
      r.get(`/admin/user/listByUserGroup?userGroupName=${user_group_name}`),
  )
  const [users, setUsers] = createSignal<User[]>([])
  const refresh = async () => {
    const resp = await getUsers()
    handleResp(resp, (data) => setUsers(data.content))
  }
  refresh()

  const [deleting, deleteUser] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/delete?id=${id}`),
  )
  const [cancel_2faId, cancel_2fa] = useListFetch(
    (id: number): PEmptyResp => r.post(`/admin/user/cancel_2fa?id=${id}`),
  )

  // 其他
  const [display, setDisplay] = createSignal("false")

  return (
    <VStack spacing="$2" alignItems="start" w="$full">
      <HStack spacing="$2">
        <Button
          colorScheme="success"
          onClick={() => {
            back()
          }}
          onMouseEnter={() => setDisplay("true")}
          onMouseLeave={() => setDisplay("false")}
          css={{ ".display": { display: "none" } }}
        >
          <HStack spacing="$3">
            <Icon
              classList={{ display: display() === "true" }}
              height="1.4em"
              width="1.4em"
              as={BsArrowLeftCircle}
            />
            <Icon
              classList={{ display: display() === "false" }}
              height="1.4em"
              width="1.4em"
              as={BsArrowLeftCircleFill}
            />
            {t(user_group_name)}
          </HStack>
        </Button>

        <Button
          colorScheme="accent"
          loading={getUsersLoading()}
          onClick={refresh}
        >
          {t("global.refresh")}
        </Button>

        <Button
          onClick={() => {
            to("/@manage/users/add")
          }}
        >
          {t("global.add")}
        </Button>
      </HStack>
      <Box w="$full" overflowX="auto">
        <Table highlightOnHover dense>
          <Thead>
            <Tr>
              <For each={["username", "base_path", "permission", "available"]}>
                {(title) => <Th>{t(`users.${title}`)}</Th>}
              </For>
              <Th>{t("global.operations")}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <For each={users()}>
              {(user) => (
                <Tr>
                  <Td>{user.username}</Td>
                  <Td>{user.base_path}</Td>
                  <Td>
                    <Permissions user={user} />
                  </Td>
                  <Td>
                    <Wether yes={!user.disabled} />
                  </Td>
                  <Td>
                    <HStack spacing="$2">
                      <Button
                        onClick={() => {
                          to(
                            `/@manage/userGroups/manage/${user_group_name}/${user.id}`,
                          )
                        }}
                      >
                        {t("global.edit")}
                      </Button>

                      <Button
                        colorScheme="accent"
                        loading={cancel_2faId() === user.id}
                        onClick={async () => {
                          const resp = await cancel_2fa(user.id)
                          handleResp(resp, () => {
                            notify.success(t("users.cancel_2fa_success"))
                            refresh()
                          })
                        }}
                      >
                        {t("users.cancel_2fa")}
                      </Button>

                      <Show when={user.role == 0}>
                        <DeletePopover
                          name={user.username}
                          loading={deleting() === user.id}
                          onClick={async () => {
                            const resp = await deleteUser(user.id)
                            handleResp(resp, () => {
                              notify.success(t("global.delete_success"))
                              refresh()
                            })
                          }}
                        />
                      </Show>
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

export default GroupUsers
