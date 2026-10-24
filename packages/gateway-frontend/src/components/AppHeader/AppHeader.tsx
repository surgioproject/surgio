import { MenuIcon } from 'lucide-react'
import React from 'react'

const AppHeader = (params: { onAppDrawerButtonClick: () => void }) => {
  return (
    <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={() => params.onAppDrawerButtonClick()}
      >
        <span className="sr-only">Open sidebar</span>
        <MenuIcon className="h-6 w-6" aria-hidden="true" />
      </button>
      <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
        Surgio Dashboard
      </div>
    </div>
  )
}

export default AppHeader
