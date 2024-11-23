import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  SelectContent,
  SelectListbox,
  SelectOption,
  SelectOptionIndicator,
  SelectOptionText,
  SelectTrigger,
  VStack,
} from "@hope-ui/solid"
import { MaybeLoading, FolderChooseInput } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import {
  PEmptyResp,
  PPageResp,
  PResp,
  User,
  UserGroup,
  UserGroupMethods,
  UserMethods,
  UserPermissions,
} from "~/types"
import { createStore } from "solid-js/store"
import { createSignal, For, Show } from "solid-js"
import { BsExclamationCircle, BsXCircle, BsXCircleFill } from "solid-icons/bs"

const Permission = (props: {
  can: boolean
  onChange: (val: boolean) => void
  name: string
}) => {
  const t = useT()
  return (
    <FormControl
      display="inline-flex"
      flexDirection="row"
      alignItems="center"
      gap="$2"
      rounded="$md"
      shadow="$md"
      p="$2"
      w="fit-content"
    >
      <FormLabel mb="0">{t(`users.permissions.${props.name}`)}</FormLabel>
      <Checkbox
        checked={props.can}
        onChange={() => props.onChange(!props.can)}
      />
    </FormControl>
  )
}

const AddOrEdit = () => {
  const t = useT()
  const { params, back } = useRouter()
  const { id } = params

  // 获取所有用户组信息，更新用户组成员数
  const [getUserGroupsLoading, getUserGroups] = useFetch(
    (): PPageResp<UserGroup> => r.get("/admin/user_group/list"),
  )
  const [userGroups, setUserGroups] = createSignal<UserGroup[]>([])
  const [userGroupNames, setUserGroupNames] = createSignal<string[]>([])
  const ugNames: string[] = []
  const ugBP = new Map<string, string>([])
  const ugPms = new Map<string, number>([])
  const refresh = async () => {
    const resp = await getUserGroups()
    handleResp(resp, (data) => setUserGroups(data.content))
    for (let i = 0; i < userGroups().length; i++) {
      ugNames.push(userGroups()[i].user_group_name)
      ugBP.set(userGroups()[i].user_group_name, userGroups()[i].base_path)
      ugPms.set(userGroups()[i].user_group_name, userGroups()[i].permission)
    }
    setUserGroupNames(ugNames)
  }
  refresh()

  // 获取当前用户信息以及上传用户信息
  const [userGroupName, setUserGroupName] = createSignal<string>("")
  const [user, setUser] = createStore<User>({
    id: 0,
    username: "",
    password: "",
    user_group: "",
    base_path: "/",
    role: 0,
    permission: 0,
    disabled: false,
    sso_id: "",
  })
  const [BP, setBP] = createSignal<string>("")
  const [pms, setPms] = createSignal<number>(0)
  const [userLoading, loadUser] = useFetch(
    (): PResp<User> => r.get(`/admin/user/get?id=${id}`),
  )

  const initEdit = async () => {
    const resp = await loadUser()
    handleResp(resp, setUser)
    setUserGroupName(user.user_group)
    setBP(user.base_path)
    setPms(user.permission)
  }
  if (id) {
    initEdit()
  }
  const [okLoading, ok] = useFetch((): PEmptyResp => {
    return r.post(`/admin/user/${id ? "update" : "create"}`, user)
  })

  // 其他
  const [display, setDisplay] = createSignal("false")

  return (
    <MaybeLoading loading={userLoading()}>
      <VStack w="$full" alignItems="start" spacing="$2">
        <Heading>{t(`global.${id ? "edit" : "add"}`)}</Heading>

        <Show when={!UserMethods.is_guest(user)}>
          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel for="username" display="flex" alignItems="center">
              {t(`users.username`)}
            </FormLabel>
            <input type="password" hidden autocomplete="new-password" />
            <Input
              id="username"
              value={user.username}
              onInput={(e) => setUser("username", e.currentTarget.value)}
            />
          </FormControl>

          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel for="password" display="flex" alignItems="center">
              {t(`users.password`)}
            </FormLabel>
            <input type="password" hidden autocomplete="new-password" />
            <Input
              id="password"
              type="password"
              placeholder="********"
              value={user.password}
              onInput={(e) => setUser("password", e.currentTarget.value)}
            />
          </FormControl>
        </Show>

        <Show when={!UserMethods.is_admin(user)}>
          <MaybeLoading loading={getUserGroupsLoading()}>
            <FormControl w="$full" display="flex" flexDirection="column">
              <FormLabel for="user_group">
                <HStack spacing="$2">
                  {t("users.select_user_group")}
                  <Show
                    when={
                      userGroupName() != "" &&
                      !userGroupNames().includes(userGroupName())
                    }
                  >
                    <HStack color="$danger9" spacing="$1">
                      <Icon as={BsExclamationCircle} />
                      {t("users.user_group_not_exist")}
                    </HStack>
                  </Show>
                </HStack>
              </FormLabel>
              <Select
                id="user_group"
                onChange={function (e: any) {
                  setUserGroupName(e)
                  setUser("user_group", userGroupName)
                  const currentBP = ugBP.get(userGroupName())
                  const currentPms = ugPms.get(userGroupName())
                  if (currentBP != undefined && currentPms != undefined) {
                    setBP(currentBP)
                    setPms(currentPms)
                    setUser("base_path", BP)
                    setUser("permission", pms)
                  }
                }}
              >
                <SelectTrigger
                  css={{
                    ".hope-c-gYjErV": {
                      flexGrow: "1",
                      flexShrink: "1",
                      textAlign: "start",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                    ".hope-c-cNask": {
                      color: "var(--hope-colors-neutral9)",
                      opacity: "1",
                    },
                  }}
                >
                  <Show
                    when={user.user_group == ""}
                    fallback={
                      <div class="hope-select__value hope-c-gYjErV hope-c-PJLV hope-c-PJLV-ijhzIfm-css">
                        {user.user_group}
                      </div>
                    }
                  >
                    <span class="hope-select__placeholder hope-c-gYjErV hope-c-cNask hope-c-PJLV hope-c-PJLV-ijhzIfm-css">
                      {t("global.choose")}
                    </span>
                  </Show>
                  <Button
                    height="1.4em"
                    width="1.4em"
                    borderRadius="0.7em"
                    paddingLeft="0"
                    paddingRight="0"
                    colorScheme="neutral"
                    onMouseEnter={() => setDisplay("true")}
                    onMouseLeave={() => setDisplay("false")}
                    onClick={function (e: any) {
                      e.stopPropagation()
                      setUserGroupName("")
                      setBP("/")
                      setPms(0)
                      setUser("user_group", userGroupName)
                      setUser("base_path", BP)
                      setUser("permission", pms)
                      const trigger =
                        document.getElementById("user_group-trigger")
                      const div = trigger!.firstChild
                      if (div != null && div!.nodeName == "DIV") {
                        const span = document.createElement("span")
                        const spanText = document.createTextNode("选择")
                        span.setAttribute(
                          "class",
                          "hope-select__placeholder hope-c-gYjErV hope-c-cNask hope-c-PJLV hope-c-PJLV-ijhzIfm-css",
                        )
                        span.appendChild(spanText)
                        trigger!.replaceChild(span, div)
                      }
                    }}
                    css={{ ".display": { display: "none" } }}
                  >
                    <Icon
                      classList={{ display: display() === "true" }}
                      height="1.4em"
                      width="1.4em"
                      as={BsXCircle}
                    />
                    <Icon
                      classList={{ display: display() === "false" }}
                      height="1.4em"
                      width="1.4em"
                      as={BsXCircleFill}
                    />
                  </Button>
                </SelectTrigger>
                <SelectContent>
                  <SelectListbox>
                    <SelectOption value={user.user_group} display="none">
                      {t(user.user_group)}
                    </SelectOption>
                    <For each={userGroups()}>
                      {(userGroup) => (
                        <SelectOption
                          value={userGroup.user_group_name}
                          disabled={userGroup.disabled}
                        >
                          <SelectOptionText>
                            {t(userGroup.user_group_name)}
                          </SelectOptionText>
                          <SelectOptionIndicator />
                        </SelectOption>
                      )}
                    </For>
                  </SelectListbox>
                </SelectContent>
              </Select>
            </FormControl>
          </MaybeLoading>

          <FormControl w="$full" display="flex" flexDirection="column" required>
            <FormLabel for="base_path" display="flex" alignItems="center">
              {t(`users.base_path`)}
            </FormLabel>
            <FolderChooseInput
              id="base_path"
              value={BP()}
              onChange={(path) => {
                setBP(path)
                setUser("base_path", BP)
              }}
              onlyFolder
            />
          </FormControl>

          <FormControl w="$full">
            <FormLabel display="flex" alignItems="center">
              {t(`users.permission`)}
            </FormLabel>
            <Flex w="$full" wrap="wrap" gap="$2">
              <For each={UserPermissions}>
                {(item, i) => (
                  <Permission
                    name={item}
                    can={UserGroupMethods.can(pms(), i())}
                    onChange={(val) => {
                      let permission = pms()
                      if (val) {
                        permission |= 1 << i()
                      } else {
                        permission &= ~(1 << i())
                      }
                      setPms(permission)
                      setUser("permission", pms)
                    }}
                  />
                )}
              </For>
            </Flex>
          </FormControl>

          <FormControl w="fit-content" display="flex">
            <Checkbox
              css={{ whiteSpace: "nowrap" }}
              id="disabled"
              onChange={(e: any) =>
                setUser("disabled", e.currentTarget.checked)
              }
              color="$neutral10"
              fontSize="$sm"
              checked={user.disabled}
            >
              {t(`users.disabled`)}
            </Checkbox>
          </FormControl>
        </Show>

        <HStack spacing="$2">
          <Button
            colorScheme="accent"
            loading={okLoading()}
            onClick={async () => {
              const resp = await ok()
              // TODO maybe can use handleRespWithNotifySuccess
              handleResp(resp, () => {
                notify.success(t("global.save_success"))
                back()
              })
            }}
          >
            {t(`global.${id ? "save" : "add"}`)}
          </Button>

          <Button
            onClick={async () => {
              back()
            }}
          >
            {t(`global.back`)}
          </Button>
        </HStack>
      </VStack>
    </MaybeLoading>
  )
}

export default AddOrEdit
