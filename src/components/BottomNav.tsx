'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, PlusCircle, Upload, History, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',   label: 'Home',    Icon: Home },
  { href: '/routine/new', label: 'Create',  Icon: PlusCircle },
  { href: '/upload',      label: 'Import',  Icon: Upload },
  { href: '/history',     label: 'History', Icon: History },
]

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
      {navItems.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          className={`bottom-nav-item ${pathname.startsWith(href) ? 'active' : ''}`}
        >
          <Icon size={21} />
          <span>{label}</span>
        </Link>
      ))}

      <button
        className="bottom-nav-item"
        onClick={handleLogout}
        aria-label="Sign out"
      >
        <LogOut size={21} />
        <span>Sign out</span>
      </button>
    </nav>
  )
}
