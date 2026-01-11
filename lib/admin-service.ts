// lib/admin-service.ts
import { supabase } from './supabase';
import { Profile, Preset, QuickLink } from '@/types';

export type BrandSettingKey =
  | 'brand_name'
  | 'primary_color'
  | 'logo_url'
  | 'toggle_icon_url'
  | 'home_greeting'
  | 'home_subtext'
  | 'send_message_text'
  | 'chat_to_agent_text'
  // New keys used by your BrandSettings component
  | 'home_proxy_label'
  | 'home_proxy_url'
  | 'home_master_label'
  | 'home_master_url'
  | 'home_gradient_from'
  | 'home_gradient_to'
  // Keeping your old keys too (safe even if unused)
  | 'home_quick_link_1_label'
  | 'home_quick_link_1_url'
  | 'home_quick_link_2_label'
  | 'home_quick_link_2_url';

function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export const adminService = {
  async getAgents(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return [];
    }
    return data || [];
  },

  async createAgent(email: string, fullName: string, password: string): Promise<{ id: string }> {
    const res = await fetch('/api/admin/create-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || 'Failed to create agent');
    return json;
  },

  async updateAgent(agentId: string, updates: Partial<Profile>): Promise<void> {
    const { error } = await supabase.from('profiles').update(updates).eq('id', agentId);
    if (error) throw error;
  },

  async deleteAgent(agentId: string): Promise<void> {
    const { error } = await supabase.from('profiles').delete().eq('id', agentId);
    if (error) throw error;
  },

  async getAllPresets(): Promise<Preset[]> {
    const { data, error } = await supabase
      .from('presets')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching presets:', error);
      return [];
    }
    return data || [];
  },

  async createPreset(preset: Omit<Preset, 'id' | 'created_at'>): Promise<Preset | null> {
    const { data, error } = await supabase.from('presets').insert(preset).select().single();
    if (error) throw error;
    return data;
  },

  async updatePreset(presetId: string, updates: Partial<Preset>): Promise<void> {
    const { error } = await supabase.from('presets').update(updates).eq('id', presetId);
    if (error) throw error;
  },

  // Verifiable delete (prevents “silent no-op” when RLS blocks)
  async deletePreset(presetId: string): Promise<void> {
    const { data, error } = await supabase.from('presets').delete().eq('id', presetId).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Delete blocked (RLS) or record not found.');
  },

  async getAllQuickLinks(): Promise<QuickLink[]> {
    const { data, error } = await supabase
      .from('quick_links')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching quick links:', error);
      return [];
    }
    return data || [];
  },

  async createQuickLink(link: Omit<QuickLink, 'id' | 'created_at'>): Promise<QuickLink | null> {
    const { data, error } = await supabase.from('quick_links').insert(link).select().single();
    if (error) throw error;
    return data;
  },

  async updateQuickLink(linkId: string, updates: Partial<QuickLink>): Promise<void> {
    const { error } = await supabase.from('quick_links').update(updates).eq('id', linkId);
    if (error) throw error;
  },

  async deleteQuickLink(linkId: string): Promise<void> {
    const { data, error } = await supabase.from('quick_links').delete().eq('id', linkId).select('id');
    if (error) throw error;
    if (!data || data.length === 0) throw new Error('Delete blocked (RLS) or record not found.');
  },

  // Single setting upsert
  async updateBrandSettings(key: BrandSettingKey, value: string): Promise<void> {
    const { error } = await supabase
      .from('brand_settings')
      .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });

    if (error) throw error;
  },

  // ✅ Bulk upsert for saving all settings at once
  async updateBrandSettingsBulk(
    settings: Partial<Record<BrandSettingKey, string>>
  ): Promise<void> {
    const rows = Object.entries(settings)
      .filter(([, v]) => typeof v === 'string')
      .map(([k, v]) => ({
        setting_key: k,
        setting_value: v as string,
      }));

    if (rows.length === 0) return;

    const { error } = await supabase
      .from('brand_settings')
      .upsert(rows, { onConflict: 'setting_key' });

    if (error) throw error;
  },

  async getBrandSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase.from('brand_settings').select('setting_key, setting_value');
    if (error) {
      console.error('Error fetching brand settings:', error);
      return {};
    }

    const settings: Record<string, string> = {};
    data?.forEach((item) => {
      settings[item.setting_key] = item.setting_value ?? '';
    });

    return settings;
  },

  // Upload logo (file) -> store public URL in brand_settings.logo_url
  async uploadBrandLogo(file: File): Promise<string> {
    const bucket = 'brand-assets';
    const ext = (file.name.split('.').pop() || 'png').toLowerCase();
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) ? ext : 'png';

    const path = `logos/${Date.now()}.${safeExt}`;

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || `image/${safeExt}`,
    });

    if (uploadError) throw uploadError;

    const publicUrl = getPublicUrl(bucket, path);

    // store URL in brand_settings
    await this.updateBrandSettings('logo_url', publicUrl);

    return publicUrl;
  },
};
