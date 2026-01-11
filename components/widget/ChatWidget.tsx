'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { HomeTab } from './HomeTab';
import { ChatTab } from './ChatTab';
import { BrandSettings } from '@/types';
import { chatService } from '@/lib/chat-service';

interface ChatWidgetProps {
  onClose?: () => void;   // parent controls open/close
  embedded?: boolean;
}

export type TabType = 'home' | 'chat';

export function ChatWidget({ onClose, embedded = false }: ChatWidgetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [chatId, setChatId] = useState<string | null>(null);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
  brand_name: 'MALIK.VIP',
  primary_color: '#2c3e50',
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


  useEffect(() => {
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    const settings = await chatService.getBrandSettings();
    setBrandSettings(settings);
  };

  const handleStartChat = async () => {
    const existingChatId = localStorage.getItem('chatbot_chat_id');

    if (existingChatId) {
      setChatId(existingChatId);
      setActiveTab('chat');
      return;
    }

    const chat = await chatService.createChat();
    if (chat) {
      setChatId(chat.id);
      localStorage.setItem('chatbot_chat_id', chat.id);
      setActiveTab('chat');
    }
  };

  const handleBackToHome = () => {
    setActiveTab('home');
  };

  return (
    <div className="relative flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl">
      {/* ✅ NO onClose passed into HomeTab/ChatTab anymore */}
      {activeTab === 'home' ? (
        <HomeTab brandSettings={brandSettings} onStartChat={handleStartChat} />
      ) : (
        <ChatTab
          chatId={chatId}
          brandSettings={brandSettings}
          onBack={handleBackToHome}
        />
      )}

      {/* ✅ ONE SINGLE toggle button (same position you marked) */}
     
    </div>
  );
}
