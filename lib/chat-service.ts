import { supabase } from './supabase';
import { Chat, Message, Preset, QuickLink, BrandSettings } from '@/types';

export const chatService = {
  async createChat(customerName?: string, customerEmail?: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        customer_name: customerName,
        customer_email: customerEmail,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return null;
    }

    return data;
  },

  async getChat(chatId: string): Promise<Chat | null> {
    const { data, error } = await supabase
      .from('chats')
      .select(`
        *,
        assigned_agent:profiles!chats_assigned_agent_id_fkey(*)
      `)
      .eq('id', chatId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching chat:', error);
      return null;
    }

    return data;
  },

  async sendMessage(
    chatId: string,
    content: string,
    senderType: 'customer' | 'agent' | 'bot',
    senderId?: string,
    messageType: string = 'text',
    metadata?: any
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: senderType,
        sender_id: senderId,
        content,
        message_type: messageType,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    await supabase
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return data;
  },

  async getMessages(chatId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  },

  async getPresets(parentId: string | null = null): Promise<Preset[]> {
    const query = supabase
      .from('presets')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (parentId === null) {
      query.is('parent_id', null);
    } else {
      query.eq('parent_id', parentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching presets:', error);
      return [];
    }

    return data || [];
  },

  async getQuickLinks(): Promise<QuickLink[]> {
    const { data, error } = await supabase
      .from('quick_links')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching quick links:', error);
      return [];
    }

    return data || [];
  },

  async getBrandSettings(): Promise<BrandSettings> {
    const { data, error } = await supabase
      .from('brand_settings')
      .select('setting_key, setting_value');

    if (error) {
      console.error('Error fetching brand settings:', error);
      return {
        brand_name: 'MALIK.VIP',
        primary_color: '#1e3a8a',
        logo_url: '',
        home_greeting: 'হাই 👋',
        home_subtext: 'আমরা কিভাবে সাহায্য করতে পারি?',
        send_message_text: 'আমাদের একটি মেসেজ পাঠান',
        chat_to_agent_text: 'কথা বলুন গ্রাহক এক্সিকিউটিভ এর সাথে',
      };
    }

    const settings: any = {};
    data?.forEach((item) => {
      settings[item.setting_key] = item.setting_value;
    });

    return {
      brand_name: settings.brand_name || 'MALIK.VIP',
      primary_color: settings.primary_color || '#1e3a8a',
      logo_url: settings.logo_url || '',
      home_greeting: settings.home_greeting || 'হাই 👋',
      home_subtext: settings.home_subtext || 'আমরা কিভাবে সাহায্য করতে পারি?',
      send_message_text: settings.send_message_text || 'আমাদের একটি মেসেজ পাঠান',
      chat_to_agent_text: settings.chat_to_agent_text || 'কথা বলুন গ্রাহক এক্সিকিউটিভ এর সাথে',
    };
  },

  async uploadFile(file: File, chatId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${chatId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(fileName);

    return data.publicUrl;
  },

  subscribeToMessages(chatId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
