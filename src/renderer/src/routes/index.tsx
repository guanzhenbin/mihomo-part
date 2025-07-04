import { Navigate } from 'react-router-dom'
import Override from '@renderer/pages/override'
import Proxies from '@renderer/pages/proxies'
import Rules from '@renderer/pages/rules'
import Settings from '@renderer/pages/settings'
import Profiles from '@renderer/pages/profiles'
import Logs from '@renderer/pages/logs'
import Connections from '@renderer/pages/connections'
import Mihomo from '@renderer/pages/mihomo'
import Sysproxy from '@renderer/pages/sysproxy'
import Tun from '@renderer/pages/tun'
import Resources from '@renderer/pages/resources'
import DNS from '@renderer/pages/dns'
import Sniffer from '@renderer/pages/sniffer'
import SubStore from '@renderer/pages/substore'
import ProfileCenter from '@renderer/pages/profile-center'
import Download from '@renderer/pages/download'
const routes = [
  {
    path: '/mihomo',
    element: <Mihomo />
  },
  {
    path: '/sysproxy',
    element: <Sysproxy />
  },
  {
    path: '/tun',
    element: <Tun />
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
    path: '/resources',
    element: <Resources />
  },
  {
    path: '/dns',
    element: <DNS />
  },
  {
    path: '/sniffer',
    element: <Sniffer />
  },
  {
    path: '/logs',
    element: <Logs />
  },
  {
    path: '/connections',
    element: <Connections />
  },
  {
    path: '/override',
    element: <Override />
  },
  {
    path: '/profiles',
    element: <Profiles />
  },
  {
    path: '/settings',
    element: <Settings />
  },
  {
    path: '/substore',
    element: <SubStore />
  },
  {
    path: '/profile-center',
    element: <ProfileCenter />
  },
  {
    path: '/download',
    element: <Download />
  },
  {
    path: '/',
    element: <Navigate to="/proxies" />
  }
]

export default routes
