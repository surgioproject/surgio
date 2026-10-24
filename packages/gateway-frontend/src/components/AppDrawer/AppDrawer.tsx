import React, { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XIcon } from 'lucide-react'

import AppDrawerContent from './AppDrawerContent'

// The panel, backdrop and close button move as one unit, so they share timing.
// Closing runs faster than opening because the user has already moved on.
const drawerEase = 'ease-[cubic-bezier(0.32,0.72,0,1)]'
const enterTiming = `duration-300 ${drawerEase} motion-reduce:transition-none`
const leaveTiming = `duration-200 ${drawerEase} motion-reduce:transition-none`

const AppDrawer = (params: {
  isOpen: boolean
  onClose: () => void
}): React.JSX.Element => {
  return (
    <>
      <Transition.Root show={params.isOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={params.onClose}
        >
          <Transition.Child
            as={Fragment}
            enter={`transition-opacity ${enterTiming}`}
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave={`transition-opacity ${leaveTiming}`}
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter={`transition-transform ${enterTiming}`}
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave={`transition-transform ${leaveTiming}`}
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter={`transition-opacity ${enterTiming}`}
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave={`transition-opacity ${leaveTiming}`}
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => params.onClose()}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                  <nav className="flex flex-1 flex-col">
                    <AppDrawerContent />
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6">
          <nav className="flex flex-1 flex-col">
            <AppDrawerContent />
          </nav>
        </div>
      </div>
    </>
  )
}

export default AppDrawer
