'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminService } from '@/lib/admin-service';
import { Preset, QuickLink } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Link as LinkIcon,
  MessageSquare,
  ExternalLink,
  ChevronLeft,
  FolderTree,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type NodePathItem = {
  id: string | null; // null = root
  label: string;
};

export function FlowBuilder() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [path, setPath] = useState<NodePathItem[]>([{ id: null, label: 'Root' }]);

  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  const [newPreset, setNewPreset] = useState({
    button_label: '',
    question_text: '',
    answer_text: '',
    escalate_to_agent: false,
    is_active: true,
  });

  const [newLink, setNewLink] = useState({
    label: '',
    url: '',
    icon_name: 'ExternalLink',
  });

  const { toast } = useToast();

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, linksData] = await Promise.all([
        adminService.getAllPresets(),
        adminService.getAllQuickLinks(),
      ]);
      setPresets(presetsData);
      setQuickLinks(linksData);
    } finally {
      setLoading(false);
    }
  };

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, Preset[]>();
    for (const p of presets) {
      const key = (p.parent_id ?? null) as string | null;
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }

    map.forEach((arr) => {
      arr.sort((a, b) => {
        const ao = a.order_index ?? 0;
        const bo = b.order_index ?? 0;
        if (ao !== bo) return ao - bo;
        return (a.created_at ?? '').localeCompare(b.created_at ?? '');
      });
    });

    return map;
  }, [presets]);

  const currentNodes = childrenOf.get(activeParentId) || [];

  const openNode = (node: Preset) => {
    setActiveParentId(node.id);
    setPath((prev) => [...prev, { id: node.id, label: node.button_label }]);
  };

  const goBack = () => {
    if (path.length <= 1) return;
    const newPath = path.slice(0, -1);
    setPath(newPath);
    setActiveParentId(newPath[newPath.length - 1].id);
  };

  const jumpTo = (index: number) => {
    const newPath = path.slice(0, index + 1);
    setPath(newPath);
    setActiveParentId(newPath[newPath.length - 1].id);
  };

  const handleCreatePreset = async () => {
    if (!newPreset.button_label.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Button label is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminService.createPreset({
        button_label: newPreset.button_label.trim(),
        question_text: newPreset.question_text?.trim() || undefined,
        answer_text: newPreset.answer_text?.trim() || undefined,
        parent_id: activeParentId || undefined,
        escalate_to_agent: newPreset.escalate_to_agent,
        is_active: newPreset.is_active,
        order_index: currentNodes.length,
      });

      toast({ title: 'Success', description: 'Preset created successfully' });
      setShowPresetDialog(false);
      setNewPreset({
        button_label: '',
        question_text: '',
        answer_text: '',
        escalate_to_agent: false,
        is_active: true,
      });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create preset',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const childCount = (childrenOf.get(presetId) || []).length;

    const ok = childCount > 0
      ? confirm('Delete this button and ALL sub buttons?')
      : confirm('Delete this button?');

    if (!ok) return;

    try {
      // IMPORTANT: This will only delete children automatically if DB has ON DELETE CASCADE (SQL below)
      await adminService.deletePreset(presetId);

      // If we deleted the node we're currently inside, go back to parent
      if (activeParentId === presetId) {
        const newPath = path.slice(0, -1);
        setPath(newPath.length ? newPath : [{ id: null, label: 'Root' }]);
        setActiveParentId(newPath.length ? newPath[newPath.length - 1].id : null);
      }

      toast({ title: 'Success', description: 'Deleted successfully' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete',
        variant: 'destructive',
      });
    }
  };

  const updateNode = async (presetId: string, updates: Partial<Preset>) => {
    // Optimistic UI
    setPresets((prev) => prev.map((p) => (p.id === presetId ? { ...p, ...updates } : p)));

    try {
      await adminService.updatePreset(presetId, updates);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description: error?.message || 'Could not update',
        variant: 'destructive',
      });
      // Re-sync from DB
      await loadData();
    }
  };

  // Quick links
  const handleCreateLink = async () => {
    if (!newLink.label || !newLink.url) {
      toast({
        title: 'Validation Error',
        description: 'Label and URL are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await adminService.createQuickLink({
        ...newLink,
        order_index: quickLinks.length,
        is_active: true,
      });

      toast({ title: 'Success', description: 'Quick link created successfully' });
      setShowLinkDialog(false);
      setNewLink({ label: '', url: '', icon_name: 'ExternalLink' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create quick link',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!confirm('Delete this quick link?')) return;

    try {
      await adminService.deleteQuickLink(linkId);
      toast({ title: 'Success', description: 'Quick link deleted successfully' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to delete quick link',
        variant: 'destructive',
      });
    }
  };

  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Flow Builder</h2>
        <p className="text-gray-600 mt-1">Nested hybrid flow editor</p>
      </div>

      <Tabs defaultValue="presets" className="space-y-6">
        <TabsList>
          <TabsTrigger value="presets">
            <MessageSquare className="w-4 h-4 mr-2" />
            Preset Flow
          </TabsTrigger>
          <TabsTrigger value="links">
            <LinkIcon className="w-4 h-4 mr-2" />
            Quick Links
          </TabsTrigger>
        </TabsList>

        {/* PRESETS */}
        <TabsContent value="presets" className="space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
                {path.map((p, idx) => (
                  <button
                    key={`${p.id ?? 'root'}-${idx}`}
                    onClick={() => jumpTo(idx)}
                    className={`px-2 py-1 rounded hover:bg-gray-100 ${
                      idx === path.length - 1 ? 'text-gray-900 font-semibold' : ''
                    }`}
                    type="button"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {path.length > 1 && (
                <Button variant="outline" onClick={goBack} className="gap-2">
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
              )}

              <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add {activeParentId ? 'Child' : 'Root'} Button
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create {activeParentId ? 'Child' : 'Root'} Preset</DialogTitle>
                    <DialogDescription>
                      This will be added under: <b>{path[path.length - 1].label}</b>
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="button_label">Button Label (Required)</Label>
                      <Input
                        id="button_label"
                        value={newPreset.button_label}
                        onChange={(e) =>
                          setNewPreset((p) => ({ ...p, button_label: e.target.value }))
                        }
                        placeholder="সাব এডমিন লিষ্ট"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="question_text">Question Text (Optional)</Label>
                      <Textarea
                        id="question_text"
                        value={newPreset.question_text || ''}
                        onChange={(e) =>
                          setNewPreset((p) => ({ ...p, question_text: e.target.value }))
                        }
                        placeholder="User question..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="answer_text">Answer Text (Optional)</Label>
                      <Textarea
                        id="answer_text"
                        value={newPreset.answer_text || ''}
                        onChange={(e) =>
                          setNewPreset((p) => ({ ...p, answer_text: e.target.value }))
                        }
                        placeholder="Bot answer..."
                        rows={4}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="escalate"
                          checked={newPreset.escalate_to_agent}
                          onCheckedChange={(checked) =>
                            setNewPreset((p) => ({ ...p, escalate_to_agent: checked }))
                          }
                        />
                        <Label htmlFor="escalate">Escalate to Live Agent</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="active"
                          checked={newPreset.is_active}
                          onCheckedChange={(checked) =>
                            setNewPreset((p) => ({ ...p, is_active: checked }))
                          }
                        />
                        <Label htmlFor="active">Active</Label>
                      </div>
                    </div>

                    <Button onClick={handleCreatePreset} className="w-full">
                      Create Preset
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-3">
            {currentNodes.map((node) => {
              const childCount = (childrenOf.get(node.id) || []).length;

              return (
                <Card key={node.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{node.button_label}</h3>

                        <span className="px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded">
                          Children: {childCount}
                        </span>
                      </div>

                      {node.question_text && (
                        <p className="text-sm text-gray-600 mt-2">{node.question_text}</p>
                      )}

                      {node.answer_text && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                          {node.answer_text}
                        </div>
                      )}

                      {/* Editable switches anytime */}
                      <div className="mt-4 flex items-center gap-6 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!node.escalate_to_agent}
                            onCheckedChange={(checked) =>
                              void updateNode(node.id, { escalate_to_agent: checked })
                            }
                          />
                          <span className="text-sm text-gray-700">Escalate to Agent</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!node.is_active}
                            onCheckedChange={(checked) =>
                              void updateNode(node.id, { is_active: checked })
                            }
                          />
                          <span className="text-sm text-gray-700">Active</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openNode(node)}>
                        Open
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void handleDeletePreset(node.id)}
                        title={childCount > 0 ? 'Delete all (cascade)' : 'Delete'}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {currentNodes.length === 0 && (
              <div className="text-center py-10">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">No buttons found here.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Click <b>Add {activeParentId ? 'Child' : 'Root'} Button</b> to create one.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* QUICK LINKS */}
        <TabsContent value="links" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Quick Link
                </Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Quick Link</DialogTitle>
                  <DialogDescription>Add a new quick link to the home tab</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="link_label">Label</Label>
                    <Input
                      id="link_label"
                      value={newLink.label}
                      onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                      placeholder="আমাদের ওয়েবসাইট ভিজিট করুন"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="link_url">URL</Label>
                    <Input
                      id="link_url"
                      type="url"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon_name">Icon Name (Lucide)</Label>
                    <Input
                      id="icon_name"
                      value={newLink.icon_name}
                      onChange={(e) => setNewLink({ ...newLink, icon_name: e.target.value })}
                      placeholder="ExternalLink"
                    />
                  </div>

                  <Button onClick={handleCreateLink} className="w-full">
                    Create Quick Link
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {quickLinks.map((link) => (
              <Card key={link.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{link.label}</h3>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => void handleDeleteLink(link.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </Card>
            ))}

            {quickLinks.length === 0 && (
              <div className="col-span-full text-center py-12">
                <LinkIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No quick links found. Create your first link.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
