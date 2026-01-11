'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Users, MessageSquare, Palette, LogOut } from 'lucide-react';
import { AgentManagement } from '@/components/admin/AgentManagement';
import { FlowBuilder } from '@/components/admin/FlowBuilder';
import { BrandSettings } from '@/components/admin/BrandSettings';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const user = await authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    setProfile(user);
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    router.push('/admin/login');
  };

  const goToProxyLink = () => {
    router.push('/admin/proxy-link'); // ✅ change if your route is different
  };

  const goToMasterAgentList = () => {
    router.push('/admin/master-agent-list'); // ✅ change if your route is different
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">Chatbot Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{profile?.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Removed the old NAV options from here */}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ✅ New nav options inside main div */}
        <section className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Quick Navigation</h2>
              <p className="text-sm text-gray-500">Go to key admin pages quickly</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={goToProxyLink} variant="default">
                প্রক্সি লিংক
              </Button>
              <Button onClick={goToMasterAgentList} variant="outline">
                মাস্টার এজেন্ট লিস্ট
              </Button>
            </div>
          </div>
        </section>

        {/* Existing Tabs section stays */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="agents" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Agent Management</span>
              <span className="sm:hidden">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="flow" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Flow Builder</span>
              <span className="sm:hidden">Flow</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="gap-2">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Brand Settings</span>
              <span className="sm:hidden">Brand</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents">
            <AgentManagement />
          </TabsContent>

          <TabsContent value="flow">
            <FlowBuilder />
          </TabsContent>

          <TabsContent value="branding">
            <BrandSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
