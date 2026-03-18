'use client';

import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { format, formatDistanceToNow } from 'date-fns';
import {
  approveSubscription,
  rejectSubscription,
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { SubscriptionRequest } from '@/types';

import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const ActionsCell = ({ request }: { request: SubscriptionRequest }) => {
  const { toast } = useToast();
  const [isApproveOpen, setIsApproveOpen] = React.useState(false);
  const [isRejectOpen, setIsRejectOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    const result = await approveSubscription(
      request.id,
      request.userId,
      request.requestedPlan
    );
    if (result.success) {
      toast({ title: 'Success', description: 'Subscription approved.' });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
    setIsApproveOpen(false);
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: 'Reason required',
        description: 'Please provide a reason for rejection.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    const result = await rejectSubscription(request.id, rejectionReason);
    if (result.success) {
      toast({ title: 'Success', description: 'Subscription rejected.' });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSubmitting(false);
    setIsRejectOpen(false);
    setRejectionReason('');
  };

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
          <DropdownMenuItem
            onClick={() => navigator.clipboard.writeText(request.transactionId)}
          >
            Copy TrxID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsApproveOpen(true)}
            disabled={request.status !== 'pending'}
            className="text-green-600 focus:text-green-700 focus:bg-green-50"
          >
            Approve
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsRejectOpen(true)}
            disabled={request.status !== 'pending'}
            className="text-red-600 focus:text-red-700 focus:bg-red-50"
          >
            Reject
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Approve Dialog */}
      <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the{' '}
              <strong>{request.requestedPlan}</strong> for{' '}
              <strong>{request.username || request.email}</strong>. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className={cn(buttonVariants({ variant: 'default' }), 'bg-green-600 hover:bg-green-700')}
            >
              {isSubmitting ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the request as rejected. Please provide a reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Transaction ID not found"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting}
              className={cn(buttonVariants({ variant: 'destructive' }))}
            >
              {isSubmitting ? 'Rejecting...' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const columns: ColumnDef<SubscriptionRequest>[] = [
  {
    accessorKey: 'email',
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
        const request = row.original;
        return (
            <div className="font-medium">{request.username || request.email}</div>
        )
    }
  },
  {
    accessorKey: 'requestedPlan',
    header: 'Plan',
     cell: ({ row }) => {
      const plan = row.getValue('requestedPlan') as string;
      const isPro = plan.toLowerCase().includes('pro');
      const isPremium = plan.toLowerCase().includes('premium');
      return <Badge variant={isPro || isPremium ? "default" : "secondary"} className={cn(isPro && "bg-primary/20 text-primary border-primary/40", isPremium && "bg-purple-500/20 text-purple-500 border-purple-500/40")}>{plan}</Badge>;
    },
  },
  {
    accessorKey: 'planPrice',
    header: 'Amount (BDT)',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('planPrice'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'BDT',
        minimumFractionDigits: 0,
      }).format(amount);
      return <div className="font-mono">{formatted}</div>;
    },
  },
  {
    accessorKey: 'paymentPhoneNumber',
    header: 'Payment Phone',
  },
  {
    accessorKey: 'transactionId',
    header: 'Transaction ID',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      let variant: 'default' | 'secondary' | 'destructive';
      let className = '';

      switch (status) {
        case 'approved':
          variant = 'default';
          className = 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700';
          break;
        case 'rejected':
          variant = 'destructive';
           className = 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
          break;
        default: // pending
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
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as any;
      if (!date) return 'N/A';
      return (
        <div title={format(date.toDate(), 'PPP p')}>
          {formatDistanceToNow(date.toDate(), { addSuffix: true })}
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell request={row.original} />,
  },
];
