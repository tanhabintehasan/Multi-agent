'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { agentService } from '@/lib/agent-service';
import { chatService } from '@/lib/chat-service';
import { supabase } from '@/lib/supabase'; // ✅ add this
import { Chat, Message, Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Headphones,
  LogOut,
  Send,
  Check,
  MessageSquare,
  User,
  Clock,
  Home,
  Inbox,
  Archive,
  Settings,
  Camera,
} from 'lucide-react';
import { playSound } from '@/lib/sounds';

export default function AgentWorkspace() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isOnline, setIsOnline] = useState(false);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (profile) {
      loadChats();
      const unsubscribe = agentService.subscribeToChats(() => {
        loadChats();
        if (selectedChat) loadMessages(selectedChat.id);
      });
      return unsubscribe;
    }
  }, [profile]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      agentService.markMessagesAsRead(selectedChat.id);

      const unsubscribe = chatService.subscribeToMessages(selectedChat.id, (message) => {
        setMessages((prev) => [...prev, message]);
        if (message.sender_type === 'customer') playSound('delivered');
      });

      return unsubscribe;
    }
  }, [selectedChat]);

  const checkAuth = async () => {
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'agent') {
      router.push('/agent/login');
      return;
    }
    setProfile(user);
    setIsOnline(user.is_active);
    setLoading(false);
  };

  const loadChats = async () => {
    if (!profile) return;
    const data = await agentService.getChats(profile.id);
    setChats(data);
  };

  const loadMessages = async (chatId: string) => {
    const msgs = await chatService.getMessages(chatId);
    setMessages(msgs);
  };

  const handleToggleOnline = async () => {
    if (!profile) return;
    const newStatus = !isOnline;
    await authService.updateAgentStatus(profile.id, newStatus);
    setIsOnline(newStatus);
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);

    if (!chat.assigned_agent_id && profile) {
      await agentService.assignChat(chat.id, profile.id);
      loadChats();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedChat || !profile) return;

    const content = inputValue.trim();
    setInputValue('');

    await agentService.sendMessage(selectedChat.id, content, profile.id);
    playSound('delivered');
  };

  const handleResolveChat = async () => {
    if (!selectedChat) return;
    await agentService.resolveChat(selectedChat.id);
    setSelectedChat(null);
    loadChats();
  };

  const handleLogout = async () => {
    if (profile) {
      await authService.updateAgentStatus(profile.id, false);
    }
    await authService.signOut();
    router.push('/agent/login');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // ✅ Avatar click -> open file picker
  const openAvatarPicker = () => fileRef.current?.click();

  // ✅ Upload avatar to storage + update profiles.avatar_url
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // reset so selecting same file again works
    e.target.value = '';

    // optional validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Max avatar size is 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${profile.id}/${Date.now()}.${ext.toLowerCase()}`;

      const { error: uploadErr } = await supabase.storage
        .from('agent-avatars')
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadErr) throw new Error(uploadErr.message);

      const { data } = supabase.storage.from('agent-avatars').getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error('Failed to generate avatar url');

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateErr) throw new Error(updateErr.message);

      // update local state so UI changes instantly
      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Headphones className="w-6 h-6 text-white" />
              </div>

              {/* ✅ Agent avatar (click to change) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={openAvatarPicker}
                  className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border hover:opacity-90 transition relative"
                  title="Change avatar"
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-600" />
                  )}

                  {/* small camera badge */}
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border flex items-center justify-center">
                    <Camera className="w-3 h-3 text-gray-700" />
                  </span>

                  {uploadingAvatar && (
                    <span className="absolute inset-0 bg-black/30 text-white text-[10px] flex items-center justify-center">
                      ...
                    </span>
                  )}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div>
                <h1 className="text-lg font-bold text-gray-900">Agent Workspace</h1>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                <Switch checked={isOnline} onCheckedChange={handleToggleOnline} />
                <Badge variant={isOnline ? 'default' : 'secondary'} className="bg-green-600">
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 h-12">
              <Button variant="ghost" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Workspace
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Inbox className="w-4 h-4" />
                Active Chats
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Archive className="w-4 h-4" />
                Resolved
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Preferences
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Chat Queue</h2>
            <p className="text-sm text-gray-500 mt-1">{chats.length} active conversations</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full p-4 border-b hover:bg-gray-50 text-left transition-colors ${
                  selectedChat?.id === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{chat.customer_name || 'Anonymous'}</p>
                      <p className="text-xs text-gray-500">{chat.customer_email || 'No email'}</p>
                    </div>
                  </div>
                  {(chat.unread_count ?? 0) > 0 && <Badge className="bg-red-600">{chat.unread_count}</Badge>}
                </div>

                {chat.last_message && <p className="text-sm text-gray-600 truncate">{chat.last_message.content}</p>}

                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatTime(chat.updated_at)}</span>
                  <Badge variant="outline" className={chat.status === 'pending' ? 'border-orange-500 text-orange-700' : ''}>
                    {chat.status}
                  </Badge>
                </div>
              </button>
            ))}

            {chats.length === 0 && (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No active chats</p>
                <p className="text-sm text-gray-500 mt-1">New chats will appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedChat.customer_name || 'Anonymous Customer'}</h3>
                  <p className="text-sm text-gray-500">{selectedChat.customer_email}</p>
                </div>
                <Button onClick={handleResolveChat} variant="outline" size="sm">
                  <Check className="w-4 h-4 mr-2" />
                  Resolve Chat
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender_type === 'agent'
                          ? 'bg-green-600 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className={`text-xs mt-1 ${message.sender_type === 'agent' ? 'text-green-100' : 'text-gray-400'}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t bg-white p-4">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Chat Selected</h3>
                <p className="text-gray-600">Select a chat from the queue to start responding</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
