'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/lib/admin-service';
import { supabase } from '@/lib/supabase'; // <-- adjust if your supabase client is in a different file
import { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type NewAgentState = {
  email: string;
  fullName: string;
  password: string;
  avatarFile: File | null;
  avatarPreview: string;
};

export function AgentManagement() {
  const [agents, setAgents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  const [newAgent, setNewAgent] = useState<NewAgentState>({
    email: '',
    fullName: '',
    password: '',
    avatarFile: null,
    avatarPreview: '',
  });

  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAgents();
    // cleanup preview url
    return () => {
      if (newAgent.avatarPreview) URL.revokeObjectURL(newAgent.avatarPreview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAgents();
      setAgents(data);
    } finally {
      setLoading(false);
    }
  };

  const resetNewAgent = () => {
    if (newAgent.avatarPreview) URL.revokeObjectURL(newAgent.avatarPreview);
    setNewAgent({ email: '', fullName: '', password: '', avatarFile: null, avatarPreview: '' });
  };

  const onPickAvatar = (file: File | null) => {
    if (newAgent.avatarPreview) URL.revokeObjectURL(newAgent.avatarPreview);

    if (!file) {
      setNewAgent((p) => ({ ...p, avatarFile: null, avatarPreview: '' }));
      return;
    }

    const preview = URL.createObjectURL(file);
    setNewAgent((p) => ({ ...p, avatarFile: file, avatarPreview: preview }));
  };

  /**
   * Upload avatar into Supabase Storage bucket: "agent-avatars"
   * Returns public URL (or signed URL if you prefer).
   */
  const uploadAgentAvatar = async (agentId: string, file: File): Promise<string> => {
    const ext = file.name.split('.').pop() || 'png';
    const safeExt = ext.toLowerCase();
    const path = `${agentId}/${Date.now()}.${safeExt}`;

    const { error: uploadErr } = await supabase.storage
      .from('agent-avatars')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadErr) {
      throw new Error(uploadErr.message);
    }

    // Public URL (bucket must be public OR you handle signed URLs)
    const { data } = supabase.storage.from('agent-avatars').getPublicUrl(path);
    if (!data?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded avatar.');
    }

    return data.publicUrl;
  };

  const handleCreateAgent = async () => {
    if (!newAgent.email || !newAgent.fullName || !newAgent.password) {
      toast({
        title: 'Validation Error',
        description: 'All fields are required (avatar optional).',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      // 1) Create agent (auth user + profiles row)
      const created = await adminService.createAgent(newAgent.email, newAgent.fullName, newAgent.password);

      // IMPORTANT: created must include id
      const createdId = (created as any)?.id as string | undefined;

      // 2) Optional avatar upload + set avatar_url
      if (createdId && newAgent.avatarFile) {
        const avatarUrl = await uploadAgentAvatar(createdId, newAgent.avatarFile);
        await adminService.updateAgent(createdId, { avatar_url: avatarUrl });
      }

      toast({ title: 'Success', description: 'Agent created successfully' });

      setShowDialog(false);
      resetNewAgent();
      await loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create agent',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (agentId: string, currentStatus: boolean) => {
    try {
      await adminService.updateAgent(agentId, { is_active: !currentStatus });
      toast({
        title: 'Success',
        description: `Agent ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update agent status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;

    try {
      await adminService.deleteAgent(agentId);
      toast({ title: 'Success', description: 'Agent deleted successfully' });
      loadAgents();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agent',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div className="text-center py-12">Loading agents...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agent Management</h2>
          <p className="text-gray-600 mt-1">Create and manage agent accounts</p>
        </div>

        <Dialog
          open={showDialog}
          onOpenChange={(open) => {
            setShowDialog(open);
            if (!open) resetNewAgent();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Agent
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Agent</DialogTitle>
              <DialogDescription>Add a new agent to your support team</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* ✅ Avatar input (optional) */}
              <div className="space-y-2">
                <Label htmlFor="avatar">Agent Avatar (Optional)</Label>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
                    {newAgent.avatarPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={newAgent.avatarPreview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-500">No</span>
                    )}
                  </div>

                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickAvatar(e.target.files?.[0] ?? null)}
                  />
                </div>
                <p className="text-xs text-gray-500">You can skip this. Agent will be created without avatar.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAgent.email}
                  onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                  placeholder="agent@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={newAgent.fullName}
                  onChange={(e) => setNewAgent({ ...newAgent, fullName: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAgent.password}
                  onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>

              <Button onClick={handleCreateAgent} className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create Agent'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
                  {agent.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agent.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : agent.is_active ? (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <UserX className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900">{agent.full_name}</h3>
                  <p className="text-sm text-gray-500">{agent.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-t">
              <span className="text-sm text-gray-600">Active Status</span>
              <Switch checked={agent.is_active} onCheckedChange={() => handleToggleActive(agent.id, agent.is_active)} />
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleDeleteAgent(agent.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </Card>
        ))}

        {agents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <UserX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No agents found. Create your first agent to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
