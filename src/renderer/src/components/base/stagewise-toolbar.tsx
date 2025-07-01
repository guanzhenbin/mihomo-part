/// <reference types="vite/client" />
import { useEffect, useState } from 'react'

// 全局标志，防止重复初始化
let isToolbarInitialized = false

const StagewiseToolbarWrapper: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [StagewiseToolbar, setStagewiseToolbar] = useState<React.ComponentType<{ config?: any }> | null>(null)
  const [ReactPlugin, setReactPlugin] = useState<unknown | null>(null)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    // 只在开发模式下且未初始化时动态导入 stagewise 包
    if (import.meta.env.DEV && !isToolbarInitialized) {
      // 首先检查是否已存在 stagewise 锚点
      const existingAnchor = document.querySelector('[data-stagewise-companion-anchor]')
      if (existingAnchor) {
        console.warn('Stagewise toolbar already exists, skipping initialization')
        return
      }

      isToolbarInitialized = true
      
      Promise.all([
        import('@stagewise/toolbar-react'),
        import('@stagewise-plugins/react')
      ]).then(([toolbarModule, pluginModule]) => {
        setStagewiseToolbar(() => toolbarModule.StagewiseToolbar)
        setReactPlugin(() => pluginModule.ReactPlugin)
        setShouldRender(true)
      }).catch((error) => {
        console.warn('Failed to load Stagewise toolbar:', error)
        isToolbarInitialized = false
      })
    }
  }, [])

  // 只有在开发模式下且组件已加载且应该渲染时才渲染
  if (!import.meta.env.DEV || !StagewiseToolbar || !ReactPlugin || !shouldRender) {
    return null
  }

  return (
    <StagewiseToolbar 
      config={{
        plugins: [ReactPlugin]
      }}
    />
  )
}

export default StagewiseToolbarWrapper 