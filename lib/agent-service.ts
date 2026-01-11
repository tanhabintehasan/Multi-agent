import { supabase } from './supabase';
import { Chat, Message } from '@/types';

export const agentService = {
  async getChats(agentId?: string): Promise<Chat[]> {
    let query = supabase
      .from('chats')
      .select(
        `
        *,
        assigned_agent:profiles!chats_assigned_agent_id_fkey(*)
      `
      )
      .in('status', ['pending', 'active'])
      .order('updated_at', { ascending: false });

    if (agentId) {
      query = query.or(`assigned_agent_id.eq.${agentId},assigned_agent_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching chats:', error);
      return [];
    }

    const chats = data || [];

    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .eq('sender_type', 'customer')
          .eq('is_read', false);

        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...chat,
          unread_count: count || 0,
          last_message: lastMessage,
        };
      })
    );

    return chatsWithUnread;
  },

  async assignChat(chatId: string, agentId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update({
        assigned_agent_id: agentId,
        status: 'active',
      })
      .eq('id', chatId);

    if (error) {
      throw error;
    }
  },

  async resolveChat(chatId: string): Promise<void> {
    const { error } = await supabase
      .from('chats')
      .update({ status: 'resolved' })
      .eq('id', chatId);

    if (error) {
      throw error;
    }
  },

  async sendMessage(
    chatId: string,
    content: string,
    agentId: string
  ): Promise<Message | null> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        sender_type: 'agent',
        sender_id: agentId,
        content,
        message_type: 'text',
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

  async markMessagesAsRead(chatId: string): Promise<void> {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .eq('sender_type', 'customer')
      .eq('is_read', false);
  },

  subscribeToChats(callback: () => void) {
    const channel = supabase
      .channel('chats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          callback();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        () => {
          callback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
