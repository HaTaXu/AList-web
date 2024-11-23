import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  VStack,
} from "@hope-ui/solid"
import { MaybeLoading, FolderChooseInput } from "~/components"
import { useFetch, useRouter, useT } from "~/hooks"
import { handleResp, notify, r } from "~/utils"
import {
  PEmptyResp,
  PResp,
  UserGroup,
  UserGroupMethods,
  UserGroupPermissions,
} from "~/types"
import { createStore } from "solid-js/store"
import { For } from "solid-js"

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
  const [userGroup, setUserGroup] = createStore<UserGroup>({
    id: 0,
    user_group_name: "",
    ugn_apply_to_all: false,
    size: 0,
    base_path: "/",
    bp_apply_to_all: false,
    permission: 0,
    pms_apply_to_all: false,
    disabled: false,
  })
  const [userGroupLoading, loadUserGroup] = useFetch(
    (): PResp<UserGroup> => r.get(`/admin/user_group/get?id=${id}`),
  )

  const initEdit = async () => {
    const resp = await loadUserGroup()
    handleResp(resp, setUserGroup)
  }
  if (id) {
    initEdit()
  }
  const [okLoading, ok] = useFetch((): PEmptyResp => {
    return r.post(`/admin/user_group/${id ? "update" : "create"}`, userGroup)
  })
  return (
    <MaybeLoading loading={userGroupLoading()}>
      <VStack w="$full" alignItems="start" spacing="$2">
        <Heading>{t(`global.${id ? "edit" : "add"}`)}</Heading>

        <FormControl w="$full" display="flex" flexDirection="column" required>
          <HStack spacing="$3">
            <FormLabel for="user_group_name" display="flex" alignItems="center">
              {t(`users.user_group_name`)}
            </FormLabel>
            <FormControl w="fit-content" display="flex">
              <Checkbox
                css={{ whiteSpace: "nowrap" }}
                id="ugn_apply_to_all"
                onChange={(e: any) =>
                  setUserGroup("ugn_apply_to_all", e.currentTarget.checked)
                }
                color="$neutral10"
                fontSize="$sm"
                checked={userGroup.ugn_apply_to_all}
                marginBottom="$1"
              >
                {t(`users.apply_to_all`)}
              </Checkbox>
            </FormControl>
          </HStack>
          <Input
            id="user_group_name"
            value={userGroup.user_group_name}
            onInput={(e) =>
              setUserGroup("user_group_name", e.currentTarget.value)
            }
          />
        </FormControl>

        <FormControl w="$full" display="flex" flexDirection="column" required>
          <HStack spacing="$3">
            <FormLabel for="base_path" display="flex" alignItems="center">
              {t(`users.base_path`)}
            </FormLabel>
            <FormControl w="fit-content" display="flex">
              <Checkbox
                css={{ whiteSpace: "nowrap" }}
                id="bp_apply_to_all"
                onChange={(e: any) =>
                  setUserGroup("bp_apply_to_all", e.currentTarget.checked)
                }
                color="$neutral10"
                fontSize="$sm"
                checked={userGroup.bp_apply_to_all}
                marginBottom="$1"
              >
                {t(`users.apply_to_all`)}
              </Checkbox>
            </FormControl>
          </HStack>
          <FolderChooseInput
            id="base_path"
            value={userGroup.base_path}
            onChange={(path) => setUserGroup("base_path", path)}
            onlyFolder
          />
        </FormControl>

        <FormControl w="$full">
          <HStack spacing="3.2rem">
            <FormLabel display="flex" alignItems="center">
              {t(`users.permission`)}
            </FormLabel>
            <FormControl w="fit-content" display="flex">
              <Checkbox
                css={{ whiteSpace: "nowrap" }}
                id="pms_apply_to_all"
                onChange={(e: any) =>
                  setUserGroup("pms_apply_to_all", e.currentTarget.checked)
                }
                color="$neutral10"
                fontSize="$sm"
                checked={userGroup.pms_apply_to_all}
                marginBottom="$1"
              >
                {t(`users.apply_to_all`)}
              </Checkbox>
            </FormControl>
          </HStack>
          <Flex w="$full" wrap="wrap" gap="$2">
            <For each={UserGroupPermissions}>
              {(item, i) => (
                <Permission
                  name={item}
                  can={UserGroupMethods.can(userGroup.permission, i())}
                  onChange={(val) => {
                    if (val) {
                      setUserGroup(
                        "permission",
                        (userGroup.permission |= 1 << i()),
                      )
                    } else {
                      setUserGroup(
                        "permission",
                        (userGroup.permission &= ~(1 << i())),
                      )
                    }
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
              setUserGroup("disabled", e.currentTarget.checked)
            }
            color="$neutral10"
            fontSize="$sm"
            checked={userGroup.disabled}
          >
            {t(`users.disabled`)}
          </Checkbox>
        </FormControl>

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
