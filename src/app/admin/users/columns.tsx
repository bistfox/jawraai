'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import type { User } from '@/types';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ArrowUpDown, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
        const user = row.original;
        return (
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} />
                    <AvatarFallback><UserIcon/></AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                </div>
            </div>
        )
    }
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => <div className="capitalize">{row.getValue('gender')}</div>
  },
  {
    accessorKey: 'subscription',
    header: 'Plan',
     cell: ({ row }) => {
      const plan = row.original.subscription || 'free';
      const isPro = plan === 'pro';
      return <Badge variant={isPro ? "default" : "secondary"} className={cn('capitalize', isPro && "bg-primary/80")}>{plan}</Badge>;
    },
  },
  {
    accessorKey: 'subscriptionStatus',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.subscriptionStatus || 'inactive';
      let variant: 'default' | 'secondary' | 'destructive';
      let className = '';

      switch (status) {
        case 'active':
          variant = 'default';
          className = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
          break;
        case 'banned':
          variant = 'destructive';
          className = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
          break;
        default: // inactive
          variant = 'secondary';
           className = 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
      }
      return (
        <Badge variant={variant} className={cn('capitalize', className)}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Joined
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as any;
      if (!date || !date.toDate) return 'N/A';
      return (
        <div title={format(date.toDate(), 'PPP p')}>
          {formatDistanceToNow(date.toDate(), { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
        const user = row.original;
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem>View Profile</DropdownMenuItem>
                <DropdownMenuItem>Ban User</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">Delete User</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    },
  },
];
