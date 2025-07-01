import { Divider } from '@heroui/react'

import React from 'react'

interface Props {
  title: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  divider?: boolean
}

const SettingItem: React.FC<Props> = (props) => {
  const { title, actions, children, divider = false } = props

  return (
    <>
      <div className="select-text h-[56px] w-full flex justify-between items-center px-2 rounded-2xl backdrop-blur-xl bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.08] border border-white/10 shadow-lg hover:bg-gradient-to-r hover:from-white/[0.12] hover:via-white/[0.08] hover:to-white/[0.12] hover:border-white/20 transition-all duration-300">
        <div className="h-full flex items-center">
          <h4 className="h-full text-base leading-[56px] whitespace-nowrap text-white/90 font-medium">{title}</h4>
          <div className="ml-3">{actions}</div>
        </div>
        <div className="flex items-center">
          {children}
        </div>
      </div>
      {divider && <Divider className="my-6 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent shadow-sm" />}
    </>
  )
}

export default SettingItem
