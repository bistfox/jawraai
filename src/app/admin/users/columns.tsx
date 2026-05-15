'use client';

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import type { User } from '@/types';
import { useAuth } from '@/firebase';
import {
  adminBanUser,
  adminUnbanUser,
  adminUpdateUserProfile,
  adminDeleteUser,
} from '@/lib/admin-actions';
import { useToast } from '@/hooks/use-toast';

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, ArrowUpDown, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function targetUidOf(user: User) {
  return user.uid ?? user.id ?? '';
}

function UserRowActions({ user }: { user: User }) {
  const auth = useAuth();
  const { toast } = useToast();
  const uid = targetUidOf(user);
  const selfUid = auth.currentUser?.uid;

  const [viewOpen, setViewOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [banOpen, setBanOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const [username, setUsername] = React.useState(user.username ?? '');
  const [email, setEmail] = React.useState(user.email ?? '');
  const [coins, setCoins] = React.useState(String(user.coins ?? 0));
  const [bonus, setBonus] = React.useState(String(user.bonusMessagesBalance ?? 0));
  const [dailyLimit, setDailyLimit] = React.useState(String(user.dailyMessageLimit ?? 20));
  const [subscription, setSubscription] = React.useState<'free' | 'pro'>(user.subscription ?? 'free');
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<
    'active' | 'inactive' | 'banned'
  >((user.subscriptionStatus as 'active' | 'inactive' | 'banned') ?? 'inactive');
  const [planId, setPlanId] = React.useState<'basic' | 'pro' | 'premium' | 'advance'>(
    (user.planId as 'basic' | 'pro' | 'premium' | 'advance') ?? 'basic'
  );

  React.useEffect(() => {
    if (!editOpen) return;
    setUsername(user.username ?? '');
    setEmail(user.email ?? '');
    setCoins(String(user.coins ?? 0));
    setBonus(String(user.bonusMessagesBalance ?? 0));
    setDailyLimit(String(user.dailyMessageLimit ?? 20));
    setSubscription(user.subscription ?? 'free');
    setSubscriptionStatus((user.subscriptionStatus as 'active' | 'inactive' | 'banned') ?? 'inactive');
    setPlanId((user.planId as 'basic' | 'pro' | 'premium' | 'advance') ?? 'basic');
  }, [editOpen, user]);

  const getToken = async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not signed in');
    return u.getIdToken();
  };

  const runBan = async () => {
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminBanUser(idToken, uid);
      if (res.ok) {
        toast({ title: 'User banned' });
        setBanOpen(false);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const runUnban = async () => {
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminUnbanUser(idToken, uid);
      if (res.ok) {
        toast({ title: 'Ban removed' });
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const runDelete = async () => {
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminDeleteUser(idToken, uid);
      if (res.ok) {
        toast({ title: 'User deleted' });
        setDeleteOpen(false);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const runSaveEdit = async () => {
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminUpdateUserProfile(idToken, uid, {
        username: username.trim(),
        email: email.trim() || null,
        coins: Number.parseInt(coins, 10) || 0,
        bonusMessagesBalance: Number.parseInt(bonus, 10) || 0,
        dailyMessageLimit: Number.parseInt(dailyLimit, 10) || 0,
        subscription,
        subscriptionStatus,
        planId,
      });
      if (res.ok) {
        toast({ title: 'Profile updated' });
        setEditOpen(false);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const isBanned = user.subscriptionStatus === 'banned';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setViewOpen(true)}>View details</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>Edit user</DropdownMenuItem>
          {isBanned ? (
            <DropdownMenuItem onClick={() => void runUnban()} disabled={busy}>
              Unban user
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanOpen(true)} className="text-amber-600">
              Ban user
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            disabled={uid === selfUid}
            className="text-red-600"
          >
            Delete user
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">UID</span>
              <p className="font-mono break-all">{uid}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Username</span>
              <p>{user.username}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email</span>
              <p>{user.email ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Plan</span>
              <p>
                {user.planId ?? '—'} ({user.subscription ?? 'free'})
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p>{user.subscriptionStatus ?? '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Coins / bonus msgs</span>
              <p>
                {user.coins ?? 0} / {user.bonusMessagesBalance ?? 0}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor={`u-${uid}-name`}>Username</Label>
              <Input id={`u-${uid}-name`} value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`u-${uid}-email`}>Email (Firestore)</Label>
              <Input id={`u-${uid}-email`} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Subscription</Label>
                <Select value={subscription} onValueChange={(v) => setSubscription(v as 'free' | 'pro')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">free</SelectItem>
                    <SelectItem value="pro">pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={subscriptionStatus}
                  onValueChange={(v) =>
                    setSubscriptionStatus(v as 'active' | 'inactive' | 'banned')
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="banned">banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>planId</Label>
              <Select
                value={planId}
                onValueChange={(v) => setPlanId(v as 'basic' | 'pro' | 'premium' | 'advance')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">basic</SelectItem>
                  <SelectItem value="pro">pro</SelectItem>
                  <SelectItem value="premium">premium</SelectItem>
                  <SelectItem value="advance">advance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label htmlFor={`u-${uid}-coins`}>Coins</Label>
                <Input id={`u-${uid}-coins`} value={coins} onChange={(e) => setCoins(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`u-${uid}-bonus`}>Bonus msgs</Label>
                <Input id={`u-${uid}-bonus`} value={bonus} onChange={(e) => setBonus(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`u-${uid}-dl`}>Daily limit</Label>
                <Input id={`u-${uid}-dl`} value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void runSaveEdit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={banOpen} onOpenChange={setBanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be marked banned and set to a free/basic plan until you unban or edit them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void runBan()} disabled={busy}>
              Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes their Firestore profile (and nested data when supported) and Firebase Auth user if
              present. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void runDelete()}
              disabled={busy}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

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
            <AvatarImage
              src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`}
            />
            <AvatarFallback>
              <UserIcon />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.username}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'gender',
    header: 'Gender',
    cell: ({ row }) => <div className="capitalize">{row.getValue('gender')}</div>,
  },
  {
    id: 'planDisplay',
    header: 'Plan',
    cell: ({ row }) => {
      const u = row.original;
      const plan = u.planId ?? u.subscription ?? 'free';
      const isPaid = plan !== 'basic' && plan !== 'free';
      return (
        <Badge
          variant={isPaid ? 'default' : 'secondary'}
          className={cn(
            'capitalize',
            isPaid && 'bg-primary/80',
            u.planId === 'premium' && 'bg-purple-600',
            u.planId === 'advance' && 'bg-violet-700'
          )}
        >
          {String(plan)}
        </Badge>
      );
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
          className =
            'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
          break;
        case 'banned':
          variant = 'destructive';
          className =
            'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
          break;
        default:
          variant = 'secondary';
          className =
            'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
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
      const date = row.getValue('createdAt') as { toDate?: () => Date } | undefined;
      if (!date?.toDate) return 'N/A';
      return (
        <div title={format(date.toDate(), 'PPP p')}>
          {formatDistanceToNow(date.toDate(), { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <UserRowActions user={row.original} />,
  },
];
