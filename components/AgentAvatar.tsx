'use client';

import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Props = {
  userId: string;              // auth.uid()
  avatarUrl: string | null;    // profiles.avatar_url
  onUpdated?: (newUrl: string) => void;
  size?: number;
};

export function AgentAvatar({ userId, avatarUrl, onUpdated, size = 56 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = () => fileRef.current?.click();

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${userId}/${Date.now()}.${ext.toLowerCase()}`;

      const { error: upErr } = await supabase.storage
        .from('agent-avatars')
        .upload(path, file, { upsert: true, contentType: file.type });

      if (upErr) throw new Error(upErr.message);

      const { data } = supabase.storage.from('agent-avatars').getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error('Failed to get avatar url');

      // Update profiles.avatar_url for current user
      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (dbErr) throw new Error(dbErr.message);

      onUpdated?.(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const onChangeFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // optional: limit size
    if (file.size > 2 * 1024 * 1024) {
      alert('Max 2MB');
      return;
    }

    await upload(file);

    // reset input so same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={pickFile}
        className="relative rounded-full overflow-hidden border bg-gray-100 hover:opacity-90 transition"
        style={{ width: size, height: size }}
        title="Change avatar"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
            👤
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white text-xs">
            Uploading...
          </div>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChangeFile}
      />
    </div>
  );
}
