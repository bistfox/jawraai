'use client';

import * as React from 'react';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { Character, CharacterCategory } from '@/types';
import {
  adminCreateCharacter,
  adminUpdateCharacter,
  adminDeleteCharacter,
} from '@/lib/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react';

const CATEGORIES: CharacterCategory[] = [
  'Girlfriend AI',
  'Boyfriend AI',
  'Best Friend',
  'Therapist',
  'Teacher',
  'Anime Character',
  'Motivational Coach',
  'Funny Meme AI',
  'Islamic AI',
  'Horror Character',
  'Flirty Character',
  'Business Mentor',
  'Coding Assistant',
  'Story Writer',
  'Emotional Support AI',
];

type AccessTier = 'free' | 'pro' | 'premium';

function tierLabel(tier: string | undefined) {
  const t = tier ?? 'free';
  if (t === 'free') return 'Free';
  if (t === 'pro') return 'Pro';
  if (t === 'premium') return 'Premium';
  return t;
}

export default function AdminCharactersPage() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const charsQuery = React.useMemo(() => collection(firestore, 'characters'), [firestore]);
  const { data: characters, isLoading } = useCollection<Character>(charsQuery);

  const sorted = React.useMemo(() => {
    const list = characters ?? [];
    return [...list].sort((a, b) => {
      const af = a.isFeatured ? 1 : 0;
      const bf = b.isFeatured ? 1 : 0;
      if (af !== bf) return bf - af;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });
  }, [characters]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<Character | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Character | null>(null);
  const [busy, setBusy] = React.useState(false);

  const emptyForm = {
    name: '',
    description: '',
    category: 'Girlfriend AI' as CharacterCategory,
    avatarUrl: '',
    greeting: '',
    systemPrompt: '',
    visibility: 'public' as 'public' | 'private',
    accessTier: 'free' as AccessTier,
    isFeatured: false,
  };

  const [form, setForm] = React.useState(emptyForm);

  React.useEffect(() => {
    if (editTarget) {
      setForm({
        name: editTarget.name ?? '',
        description: editTarget.description ?? '',
        category: (editTarget.category as CharacterCategory) ?? 'Girlfriend AI',
        avatarUrl: editTarget.avatarUrl ?? '',
        greeting: editTarget.greeting ?? '',
        systemPrompt: editTarget.systemPrompt ?? '',
        visibility: editTarget.visibility ?? 'public',
        accessTier: (editTarget.accessTier as AccessTier) ?? 'free',
        isFeatured: Boolean(editTarget.isFeatured),
      });
    } else if (createOpen) {
      setForm(emptyForm);
    }
  }, [editTarget, createOpen]);

  const getToken = async () => {
    const u = auth.currentUser;
    if (!u) throw new Error('Not signed in');
    return u.getIdToken();
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminCreateCharacter(idToken, {
        name: form.name,
        description: form.description,
        category: form.category,
        avatarUrl: form.avatarUrl,
        greeting: form.greeting,
        systemPrompt: form.systemPrompt,
        visibility: form.visibility,
        accessTier: form.accessTier,
        isFeatured: form.isFeatured,
        tags: [],
      });
      if (res.ok) {
        toast({ title: 'Character created', description: res.id ? `id: ${res.id}` : undefined });
        setCreateOpen(false);
        setForm(emptyForm);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminUpdateCharacter(idToken, editTarget.id, {
        name: form.name,
        description: form.description,
        category: form.category,
        avatarUrl: form.avatarUrl,
        greeting: form.greeting,
        systemPrompt: form.systemPrompt,
        visibility: form.visibility,
        accessTier: form.accessTier,
        isFeatured: form.isFeatured,
      });
      if (res.ok) {
        toast({ title: 'Saved' });
        setEditTarget(null);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const idToken = await getToken();
      const res = await adminDeleteCharacter(idToken, deleteTarget.id);
      if (res.ok) {
        toast({ title: 'Deleted' });
        setDeleteTarget(null);
      } else {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const toggleFeatured = async (c: Character) => {
    try {
      const idToken = await getToken();
      const res = await adminUpdateCharacter(idToken, c.id, { isFeatured: !c.isFeatured });
      if (!res.ok) {
        toast({ title: 'Error', description: res.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e?.message ?? 'Failed', variant: 'destructive' });
    }
  };

  const formFields = (
    <>
      <div className="grid gap-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <div className="grid gap-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm((f) => ({ ...f, category: v as CharacterCategory }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Access</Label>
          <Select
            value={form.accessTier}
            onValueChange={(v) => setForm((f) => ({ ...f, accessTier: v as AccessTier }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label>Visibility</Label>
          <Select
            value={form.visibility}
            onValueChange={(v) => setForm((f) => ({ ...f, visibility: v as 'public' | 'private' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">public</SelectItem>
              <SelectItem value="private">private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Featured</Label>
          <Select
            value={form.isFeatured ? 'yes' : 'no'}
            onValueChange={(v) => setForm((f) => ({ ...f, isFeatured: v === 'yes' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Avatar URL</Label>
        <Input
          value={form.avatarUrl}
          onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
        />
      </div>
      <div className="grid gap-2">
        <Label>Greeting</Label>
        <Textarea
          value={form.greeting}
          onChange={(e) => setForm((f) => ({ ...f, greeting: e.target.value }))}
          rows={2}
        />
      </div>
      <div className="grid gap-2">
        <Label>System prompt (optional)</Label>
        <Textarea
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          rows={3}
        />
      </div>
    </>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Characters</h1>
          <p className="text-muted-foreground">
            Create, edit, set Free / Pro / Premium, feature, or remove characters (server-side admin).
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add character
        </Button>
      </div>

      {isLoading && !characters ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sorted.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{c.name}</h2>
                    {c.isFeatured && <Badge>Featured</Badge>}
                    {c.visibility && <Badge variant="secondary">{c.visibility}</Badge>}
                    <Badge variant="outline">{c.category}</Badge>
                    <Badge
                      variant={
                        (c.accessTier ?? 'free') === 'free'
                          ? 'secondary'
                          : (c.accessTier ?? 'free') === 'premium'
                            ? 'default'
                            : 'default'
                      }
                      className={
                        (c.accessTier ?? 'free') === 'premium' ? 'bg-purple-600 hover:bg-purple-600' : ''
                      }
                    >
                      {tierLabel(c.accessTier)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Owner: {c.ownerId ? String(c.ownerId) : 'prebuilt / admin'}
                  </p>
                </div>

                <div className="flex flex-shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                  <Button variant="secondary" size="sm" onClick={() => void toggleFeatured(c)}>
                    <Star className="mr-2 h-4 w-4" />
                    {c.isFeatured ? 'Unfeature' : 'Feature'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditTarget(c)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(c)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {sorted.length === 0 && (
            <p className="text-sm text-muted-foreground">No characters in Firestore yet.</p>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New character</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">{formFields}</div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={busy}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit character</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">{formFields}</div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={busy}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete character?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name} will be removed from Firestore. Sessions that reference this id may break.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={busy}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
