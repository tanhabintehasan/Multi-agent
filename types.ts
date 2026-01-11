export type UserRole = 'admin' | 'agent' | 'customer';

export type BrandSettings = {
  brand_name?: string;
  primary_color?: string;
  logo_url?: string | null;
  toggle_icon_url?: string | null;

  home_greeting?: string;
  home_subtext?: string;
  send_message_text?: string;
  chat_to_agent_text?: string;

  home_gradient_from?: string;
  home_gradient_to?: string;

  // New keys (admin panel uses these)
  home_proxy_label?: string;
  home_proxy_url?: string;
  home_master_label?: string;
  home_master_url?: string;

  // Old keys (backward compatibility)
  home_quick_link_1_label?: string;
  home_quick_link_1_url?: string;
  home_quick_link_2_label?: string;
  home_quick_link_2_url?: string;
};

export type Profile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  is_online?: boolean | null;
  created_at?: string;
  updated_at?: string;
};

export type ChatStatus = 'pending' | 'active' | 'closed';

export type Chat = {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  assigned_agent_id?: string | null;
  status?: ChatStatus | string;
  created_at?: string;
  updated_at?: string;
  assigned_agent?: Profile | null;
};

export type MessageSenderType = 'customer' | 'agent' | 'bot';
export type MessageType = 'text' | 'image' | 'document' | string;

export type Message = {
  id: string;
  chat_id: string;
  sender_type: MessageSenderType;
  sender_id?: string | null;
  content: string;
  message_type: MessageType;
  metadata?: Record<string, any> | null;
  created_at: string;
  sender?: Profile | null;
};

export type Preset = {
  id: string;
  parent_id?: string | null;
  button_label: string;
  answer_text?: string | null;
  order_index?: number | null;
  is_active?: boolean | null;
  escalate_to_agent?: boolean | null;
  created_at?: string;
};

export type QuickLink = {
  id: string;
  label: string;
  url: string;
  order_index?: number | null;
  is_active?: boolean | null;
  created_at?: string;
};
