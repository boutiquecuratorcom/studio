'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Settings,
  Home,
  LayoutGrid,
  Wand2,
  PenSquare,
  MessageCircle,
  Briefcase,
  Heart,
  LogOut,
  User,
  Library,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useAuth } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { isAdminEmail } from '@/lib/admin';


const navItems = [
    { href: '/dashboard', label: 'Studio', icon: Home },
    { href: '/inventory', label: 'My Rack', icon: LayoutGrid },
    { href: '/outfits', label: 'Outfits', icon: Briefcase },
    { href: '/editor', label: 'Glow-Up Studio', icon: Wand2 },
    { href: '/post-creator', label: 'Post Creator', icon: PenSquare },
    { href: '/engagement-machine', label: 'Engagement', icon: MessageCircle },
    { href: '/my-brand', label: 'My Brand', icon: Heart },
    { href: '/uploads', label: 'Library', icon: Library },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const auth = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="h-24 flex items-center px-6 border-b border-white/10">
        <Sparkles className="h-7 w-7 text-sidebar-accent" />
        <h1 className="ml-3 text-lg font-headline font-bold tracking-wide text-white">
          Boutique Curator
        </h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-4 py-3 text-base transition-colors font-medium gap-3',
                isActive
                  ? 'bg-white/10 text-sidebar-foreground-active font-semibold'
                  : 'hover:bg-white/5 hover:text-sidebar-foreground-active'
              )}
            >
              <item.icon className="h-5 w-5 text-sidebar-accent" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t border-white/10">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 px-2 hover:bg-white/5">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? ''} />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-semibold text-sm text-sidebar-foreground-active truncate w-full">{user.displayName || user.email?.split('@')[0]}</span>
                            <span className="text-xs text-sidebar-foreground">{isAdmin ? 'Admin' : 'Member'}</span>
                        </div>
                    </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.displayName || user.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/profile">
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <Link href="/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      )}
    </aside>
  );
}
