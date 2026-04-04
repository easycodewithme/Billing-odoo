import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function Header({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-30 flex h-14 items-center border-b bg-background px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          <Menu className="size-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <span className="text-lg font-bold tracking-tight">SubManager</span>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm font-medium sm:inline-block">
          {user?.fullName}
        </span>
        {user?.role && (
          <Badge variant="secondary" className="hidden capitalize sm:inline-flex">
            {user.role}
          </Badge>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar>
              {user?.avatar && <AvatarImage src={user.avatar} alt={user?.fullName} />}
              <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" sideOffset={8} className="w-48">
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="size-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="size-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
