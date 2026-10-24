import client from '@/libs/http'
import { useStores } from '@/stores'
import { observer } from 'mobx-react-lite'
import { useSnackbar } from 'notistack'
import React, { useState } from 'react'
import {
  DownloadCloudIcon,
  PlaneTakeoffIcon,
  EraserIcon,
  HomeIcon,
  Loader2,
  LogOutIcon,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { cn } from '@/libs/shadcn'
import { Separator } from '@/components/ui/separator'

const pages = [
  { name: '首页', href: '/', icon: HomeIcon },
  { name: 'Artifact 列表', href: '/artifacts', icon: DownloadCloudIcon },
  { name: 'Provider 列表', href: '/providers', icon: PlaneTakeoffIcon },
] as const

// Rows are 44px tall in the touch drawer and 40px in the desktop sidebar.
const itemClassName =
  'group flex w-full items-center gap-x-3 rounded-md px-2 py-2.5 lg:py-2 text-sm leading-6 font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
const iconClassName = 'size-5 shrink-0 transition-colors duration-150 ease-out'

const PageLinks = () => (
  <ul role="list" className="flex flex-1 flex-col gap-1">
    {pages.map((page) => (
      <li key={page.href}>
        <NavLink
          to={page.href}
          end
          className={({ isActive }) =>
            cn(
              itemClassName,
              'text-foreground',
              isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
            )
          }
        >
          {({ isActive }) => (
            <>
              <page.icon
                className={cn(
                  iconClassName,
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground group-hover:text-foreground'
                )}
                aria-hidden="true"
              />
              {page.name}
            </>
          )}
        </NavLink>
      </li>
    ))}
  </ul>
)

const ActionButton = (props: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  isPending: boolean
  onClick: () => void
}) => {
  const Icon = props.isPending ? Loader2 : props.icon

  return (
    <button
      type="button"
      disabled={props.isPending}
      onClick={props.onClick}
      className={cn(
        itemClassName,
        'text-muted-foreground transition-[color,background-color,scale] hover:bg-secondary/50 hover:text-foreground active:scale-[0.96] disabled:pointer-events-none'
      )}
    >
      <Icon
        className={cn(iconClassName, props.isPending && 'animate-spin')}
        aria-hidden="true"
      />
      {props.label}
    </button>
  )
}

const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err)

const Actions = () => {
  const { enqueueSnackbar } = useSnackbar()
  const navigate = useNavigate()
  const [pendingAction, setPendingAction] = useState<string>()

  const run = (name: string, action: () => Promise<void>) => {
    setPendingAction(name)
    action()
      .catch((err) => {
        enqueueSnackbar(`${name}失败：${errorMessage(err)}`, {
          variant: 'error',
        })
      })
      .finally(() => setPendingAction(undefined))
  }

  const cleanCache = async () => {
    await client.post('/api/clean-cache')
    enqueueSnackbar('清除成功', { variant: 'success' })
  }

  const logout = async () => {
    await client.post('/api/auth/logout')
    navigate('/auth', { replace: true })
  }

  const actions = [
    { name: '清除缓存', icon: EraserIcon, action: cleanCache },
    { name: '登出', icon: LogOutIcon, action: logout },
  ]

  return (
    <ul role="list" className="flex flex-col gap-1">
      {actions.map((item) => (
        <li key={item.name}>
          <ActionButton
            label={item.name}
            icon={item.icon}
            isPending={pendingAction === item.name}
            onClick={() => run(item.name, item.action)}
          />
        </li>
      ))}
    </ul>
  )
}

// The fixed height keeps the actions above from moving when the config loads.
const Versions = observer(() => {
  const stores = useStores()

  return (
    <div className="h-8 px-2 text-xs text-muted-foreground">
      {stores.config.isReady ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-2">
          <dt>Surgio</dt>
          <dd>
            <code>{stores.config.config.coreVersion}</code>
          </dd>
          <dt>Gateway</dt>
          <dd>
            <code>{stores.config.config.backendVersion}</code>
          </dd>
        </dl>
      ) : null}
    </div>
  )
})

const AppDrawerContent = () => (
  <div className="flex flex-1 flex-col gap-4 py-5 lg:pt-8">
    <PageLinks />
    <Separator />
    <Actions />
    <Versions />
  </div>
)

export default AppDrawerContent
