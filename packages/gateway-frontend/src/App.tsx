import AppDrawer from '@/components/AppDrawer'
import AppHeader from '@/components/AppHeader'
import { validateCookie, validateToken } from '@/libs/http'
import React, { useCallback, useEffect, Suspense, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Routes, Route, useLocation, Outlet } from 'react-router-dom'

import './App.css'
import { defaultFetcher } from './libs/utils'
import { useStores } from './stores'
import { Config } from './stores/config'
import NotFoundPage from './pages/NotFound'

const ArtifactListPage = React.lazy(() => import('./pages/ArtifactList'))
const ProviderListPage = React.lazy(() => import('./pages/ProviderList'))
const HomePage = React.lazy(() => import('./pages/Home'))
const AuthPage = React.lazy(() => import('./pages/Auth'))
const EmbedArtifactPage = React.lazy(() => import('./pages/embeds/Artifact'))

const App = () => {
  const stores = useStores()
  const location = useLocation()

  const validateAuth = useCallback(() => {
    const search = new URLSearchParams(location.search)

    if (search.get('access_token')) {
      stores.config.updateConfig({
        accessToken: search.get('access_token'),
      })

      return validateToken()
    }

    return validateCookie()
  }, [location.search, stores.config])

  const fetchConfig = () => {
    return defaultFetcher<Partial<Config>>('/api/config')
  }

  useEffect(() => {
    validateAuth()
      .then((user) => {
        if (user.accessToken) {
          stores.config.updateConfig({
            accessToken: user.accessToken,
          })
        }

        if (user.viewerToken) {
          stores.config.updateConfig({
            viewerToken: user.viewerToken,
          })
        }

        return fetchConfig()
      })
      .catch(() => {
        // 授权失败，直接获取配置信息
        return fetchConfig()
      })
      .then((config) => {
        stores.config.updateConfig(config)
      })
      .catch((err) => {
        console.error(err)
      })
  }, [stores.config, validateAuth])

  return (
    <div className="flex flex-1 items-stretch relative flex-col">
      {stores.config.isReady ? (
        <>
          <Routes>
            <Route path="/" element={<NormalLayout key={location.key} />}>
              <Route
                path="artifacts"
                element={<RouteSuspense element={<ArtifactListPage />} />}
              />
              <Route
                path="providers"
                element={<RouteSuspense element={<ProviderListPage />} />}
              />
              <Route index element={<RouteSuspense element={<HomePage />} />} />
            </Route>

            <Route path="/" element={<LayoutWithoutNav />}>
              <Route
                path="/auth"
                element={<RouteSuspense element={<AuthPage />} />}
              />
              <Route
                path="/embed/artifact/:artifactName"
                element={<RouteSuspense element={<EmbedArtifactPage />} />}
              />
            </Route>

            <Route path="/*" element={<NotFoundPage />} />
          </Routes>
        </>
      ) : null}
    </div>
  )
}

function NormalLayout() {
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false)

  return (
    <>
      <AppHeader onAppDrawerButtonClick={() => setIsAppDrawerOpen(true)} />

      <AppDrawer
        isOpen={isAppDrawerOpen}
        onClose={() => setIsAppDrawerOpen(false)}
      />

      <main className="flex flex-1 flex-col w-full bg-gray-50 py-4 sm:py-6 lg:py-8 lg:pl-72">
        <div className="flex flex-1 flex-col px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </>
  )
}

function LayoutWithoutNav() {
  return (
    <main className="flex flex-col w-full min-h-full bg-gray-50 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <Outlet />
    </main>
  )
}

function RouteSuspense({ element }: { element: React.ReactNode }) {
  return <Suspense fallback={<></>}>{element}</Suspense>
}

export default observer(App)
