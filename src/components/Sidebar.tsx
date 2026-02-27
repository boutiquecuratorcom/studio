'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Settings } from 'lucide-react';
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
import { LogOut, User } from 'lucide-react';
import { isAdminEmail } from '@/lib/admin';


const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/editor', label: 'AI Editor' },
  { href: '/post-creator', label: 'Post Creator' },
  { href: '/engagement-machine', label: 'Engagement Machine' },
  { href: '/inventory', label: 'My Rack' },
  { href: '/uploads', label: 'My Library' },
  { href: '/my-brand', label: 'My Brand' },
  { href: '/looks', label: 'Looks' },
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
    <aside className="w-64 flex-shrink-0 bg-secondary border-r flex flex-col">
      <div className="h-24 flex items-center px-8">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="ml-3 text-lg font-headline font-semibold tracking-wide text-foreground">
          Boutique Curator
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-4 py-2.5 text-base transition-colors font-medium',
                isActive
                  ? 'text-foreground bg-black/5'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {user && (
        <div className="p-4 border-t">
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start text-left h-auto py-2 px-2">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL ?? ''} alt={user.email ?? ''} />
                            <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col items-start overflow-hidden">
                            <span className="font-semibold text-sm truncate w-full">{user.displayName || user.email?.split('@')[0]}</span>
                            <span className="text-xs text-muted-foreground">{isAdmin ? 'Admin' : 'Member'}</span>
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
