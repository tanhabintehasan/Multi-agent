'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/lib/admin-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Palette, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type BrandSettingsState = {
  brand_name: string;
  primary_color: string;

  logo_url: string; // uploaded result url
  toggle_icon_url: string; // URL only

  home_greeting: string;
  home_subtext: string;
  send_message_text: string;
  chat_to_agent_text: string;

  home_proxy_label: string;
  home_proxy_url: string;
  home_master_label: string;
  home_master_url: string;

  home_gradient_from: string;
  home_gradient_to: string;
};

export function BrandSettings() {
  const [settings, setSettings] = useState<BrandSettingsState>({
    brand_name: '',
    primary_color: '#1e3a8a',
    logo_url: '',
    toggle_icon_url: '',

    home_greeting: 'হাই 👋',
    home_subtext: 'আমরা কিভাবে সাহায্য করতে পারি?',
    send_message_text: 'আমাদের একটি মেসেজ পাঠান',
    chat_to_agent_text: 'কথা বলুন গ্রাহক এক্সিকিউটিভ এর সাথে',

    home_proxy_label: 'আমাদের প্রক্সি লিংক গুলো দেখে নিন',
    home_proxy_url: '/proxy-link',
    home_master_label: 'ভোক্তা মাস্টার এজেন্ট লিস্ট',
    home_master_url: '/master-agent-list',

    home_gradient_from: '#1f2d3a',
    home_gradient_to: '#243a52',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getBrandSettings();
      setSettings((prev) => ({
        ...prev,
        brand_name: data.brand_name || prev.brand_name,
        primary_color: data.primary_color || prev.primary_color,
        logo_url: data.logo_url || prev.logo_url,
        toggle_icon_url: data.toggle_icon_url || prev.toggle_icon_url,

        home_greeting: data.home_greeting || prev.home_greeting,
        home_subtext: data.home_subtext || prev.home_subtext,
        send_message_text: data.send_message_text || prev.send_message_text,
        chat_to_agent_text: data.chat_to_agent_text || prev.chat_to_agent_text,

        home_proxy_label: data.home_proxy_label || prev.home_proxy_label,
        home_proxy_url: data.home_proxy_url || prev.home_proxy_url,
        home_master_label: data.home_master_label || prev.home_master_label,
        home_master_url: data.home_master_url || prev.home_master_url,

        home_gradient_from: data.home_gradient_from || prev.home_gradient_from,
        home_gradient_to: data.home_gradient_to || prev.home_gradient_to,
      }));
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'Failed to load brand settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let logoUrl = settings.logo_url;

      if (logoFile) {
        logoUrl = await adminService.uploadBrandLogo(logoFile);
      }

      await adminService.updateBrandSettingsBulk({
        brand_name: settings.brand_name,
        primary_color: settings.primary_color,
        logo_url: logoUrl,
        toggle_icon_url: settings.toggle_icon_url,

        home_greeting: settings.home_greeting,
        home_subtext: settings.home_subtext,
        send_message_text: settings.send_message_text,
        chat_to_agent_text: settings.chat_to_agent_text,

        home_proxy_label: settings.home_proxy_label,
        home_proxy_url: settings.home_proxy_url,
        home_master_label: settings.home_master_label,
        home_master_url: settings.home_master_url,

        home_gradient_from: settings.home_gradient_from,
        home_gradient_to: settings.home_gradient_to,
      });

      setLogoFile(null);
      setSettings((p) => ({ ...p, logo_url: logoUrl }));

      toast({ title: 'Success', description: 'Brand settings updated successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Brand Settings</h2>
        <p className="text-gray-600 mt-1">Customize your chatbot appearance and messaging</p>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="brand_name">Brand Name</Label>
            <Input
              id="brand_name"
              value={settings.brand_name}
              onChange={(e) => setSettings({ ...settings, brand_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary_color"
                type="color"
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                value={settings.primary_color}
                onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          {/* LOGO UPLOAD */}
          <div className="space-y-2 md:col-span-2">
            <Label>Logo Upload (PNG/JPG)</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <Input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
              {settings.logo_url && (
                <img src={settings.logo_url} alt="logo" className="h-10 w-10 rounded-md object-cover border" />
              )}
              {logoFile && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  {logoFile.name}
                </span>
              )}
            </div>
          </div>

          {/* TOGGLE ICON URL */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="toggle_icon_url">Toggle Icon URL</Label>
            <Input
              id="toggle_icon_url"
              value={settings.toggle_icon_url}
              onChange={(e) => setSettings({ ...settings, toggle_icon_url: e.target.value })}
              placeholder="https://example.com/toggle.png"
            />
          </div>
        </div>

        {/* Gradient */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Background Gradient</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Gradient From</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.home_gradient_from}
                  onChange={(e) => setSettings({ ...settings, home_gradient_from: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.home_gradient_from}
                  onChange={(e) => setSettings({ ...settings, home_gradient_from: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gradient To</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={settings.home_gradient_to}
                  onChange={(e) => setSettings({ ...settings, home_gradient_to: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={settings.home_gradient_to}
                  onChange={(e) => setSettings({ ...settings, home_gradient_to: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Texts */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Tab Text Content</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Home Greeting</Label>
              <Input value={settings.home_greeting} onChange={(e) => setSettings({ ...settings, home_greeting: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Home Subtext</Label>
              <Input value={settings.home_subtext} onChange={(e) => setSettings({ ...settings, home_subtext: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Send Message Button Text</Label>
              <Input value={settings.send_message_text} onChange={(e) => setSettings({ ...settings, send_message_text: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Chat to Agent Text</Label>
              <Textarea
                value={settings.chat_to_agent_text}
                onChange={(e) => setSettings({ ...settings, chat_to_agent_text: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Tab Quick Buttons</h3>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Proxy Button Label</Label>
              <Input value={settings.home_proxy_label} onChange={(e) => setSettings({ ...settings, home_proxy_label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Proxy Redirect URL</Label>
              <Input value={settings.home_proxy_url} onChange={(e) => setSettings({ ...settings, home_proxy_url: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>Master Agent Label</Label>
              <Input value={settings.home_master_label} onChange={(e) => setSettings({ ...settings, home_master_label: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Master Agent Redirect URL</Label>
              <Input value={settings.home_master_url} onChange={(e) => setSettings({ ...settings, home_master_url: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t">
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Palette className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Preview</h4>
            <p className="text-sm text-blue-700">Visit embed page to see changes immediately.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
