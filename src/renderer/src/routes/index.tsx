import { Navigate } from 'react-router-dom'
import Accelerator from '@renderer/pages/accelerator'
import Region from '@renderer/pages/region'
import Package from '@renderer/pages/package'
import ProfileCenter from '@renderer/pages/profile-center'
import Profiles from '@renderer/pages/profiles'
import Proxies from '@renderer/pages/proxies'
import Rules from '@renderer/pages/rules'
import Settings from '@renderer/pages/settings'
import Login from '@renderer/pages/login'
const routes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/profiles',
    element: <Profiles />
  },
  {
    path: '/proxies',
    element: <Proxies />
  },
  {
    path: '/rules',
    element: <Rules />
  },
  {
    path: '/accelerator',
    element: <Accelerator />
  },
  {
    path: '/region',
    element: <Region />
  },
  {
    path: '/package',
    element: <Package />
  },
  {
    path: '/profile-center',
    element: <ProfileCenter />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/',
    element: <Navigate to="/accelerator" />
  }
]

export default routes
