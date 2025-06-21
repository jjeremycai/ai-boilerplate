import { Catalyst } from '@cai/ui-tw'
import { Link, useLocation } from '@tanstack/react-router'
import { 
  HomeIcon, 
  UserIcon, 
  BeakerIcon, 
  RectangleStackIcon, 
  ListBulletIcon,
  ArrowPathIcon,
  KeyIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  
  const navigation = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
    { name: 'Data Fetching', href: '/data-fetching', icon: ArrowPathIcon },
    { name: 'SSR Demo', href: '/ssr', icon: RectangleStackIcon },
    { name: 'Virtual List', href: '/virtualized-list', icon: ListBulletIcon },
    { name: 'Catalyst Test', href: '/catalyst-test', icon: BeakerIcon },
    { name: 'User Details', href: '/params/123', icon: UserIcon },
  ]

  const authNavigation = [
    { name: 'Sign In', href: '/sign-in', icon: ArrowRightOnRectangleIcon },
    { name: 'Sign Up', href: '/sign-up', icon: UserPlusIcon },
    { name: 'Password Reset', href: '/password-reset', icon: KeyIcon },
  ]

  return (
    <Catalyst.SidebarLayout
      navbar={
        <Catalyst.Navbar>
          <Catalyst.NavbarSpacer>
            <Catalyst.NavbarSection>
              <Catalyst.NavbarItem href="/" current={location.pathname === '/'}>
                <SparklesIcon className="w-5 h-5" />
                CAI App
              </Catalyst.NavbarItem>
            </Catalyst.NavbarSection>
            <Catalyst.NavbarSection>
              <Catalyst.NavbarItem href="/sign-in">
                <Catalyst.Avatar src="/avatar.jpg" />
              </Catalyst.NavbarItem>
            </Catalyst.NavbarSection>
          </Catalyst.NavbarSpacer>
        </Catalyst.Navbar>
      }
      sidebar={
        <Catalyst.Sidebar>
          <Catalyst.SidebarHeader>
            <Catalyst.SidebarSection>
              <Catalyst.Heading>Navigation</Catalyst.Heading>
            </Catalyst.SidebarSection>
          </Catalyst.SidebarHeader>
          
          <Catalyst.SidebarBody>
            <Catalyst.SidebarSection>
              {navigation.map((item) => (
                <Catalyst.SidebarItem 
                  key={item.name} 
                  href={item.href}
                  current={location.pathname === item.href}
                >
                  <item.icon className="w-5 h-5" />
                  <Catalyst.SidebarLabel>{item.name}</Catalyst.SidebarLabel>
                </Catalyst.SidebarItem>
              ))}
            </Catalyst.SidebarSection>

            <Catalyst.SidebarDivider />

            <Catalyst.SidebarSection>
              <Catalyst.SidebarHeading>Authentication</Catalyst.SidebarHeading>
              {authNavigation.map((item) => (
                <Catalyst.SidebarItem 
                  key={item.name} 
                  href={item.href}
                  current={location.pathname === item.href}
                >
                  <item.icon className="w-5 h-5" />
                  <Catalyst.SidebarLabel>{item.name}</Catalyst.SidebarLabel>
                </Catalyst.SidebarItem>
              ))}
            </Catalyst.SidebarSection>
          </Catalyst.SidebarBody>

          <Catalyst.SidebarFooter>
            <Catalyst.SidebarSection>
              <Catalyst.SidebarItem href="/settings">
                <Catalyst.Avatar src="/avatar.jpg" slot="icon" />
                <Catalyst.SidebarLabel>Jeremy Cai</Catalyst.SidebarLabel>
              </Catalyst.SidebarItem>
            </Catalyst.SidebarSection>
          </Catalyst.SidebarFooter>
        </Catalyst.Sidebar>
      }
    >
      {children}
    </Catalyst.SidebarLayout>
  )
}