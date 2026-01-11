'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  MessageSquare,
  Users,
  Settings,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">ChatBot System</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/setup">
                <Button variant="ghost" size="sm">Setup</Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline">Admin</Button>
              </Link>
              <Link href="/agent/login">
                <Button>Agent Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
              Multi-Agent Real-Time
              <span className="block text-blue-600 mt-2">Chatbot Plugin System</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              A professional, self-hosted, and portable chatbot system with real-time messaging,
              multi-agent support, and complete customization capabilities.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/embed">
                <Button size="lg" className="text-lg px-8">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try Live Demo
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Settings className="w-5 h-5 mr-2" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Key Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-Time Messaging</h3>
                <p className="text-gray-600">
                  Instant message delivery with Supabase Realtime, typing indicators, and sound
                  effects for seamless communication.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Multi-Agent Support</h3>
                <p className="text-gray-600">
                  Manage multiple agents with individual workspaces, chat queues, and online/offline
                  status tracking.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Embeddable Widget</h3>
                <p className="text-gray-600">
                  Portable widget with Shadow DOM and Iframe technology. Embed on any website
                  without style conflicts.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nested Presets</h3>
                <p className="text-gray-600">
                  Create intelligent conversation flows with nested preset questions and answers.
                  Escalate to live agents when needed.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
                <p className="text-gray-600">
                  Role-based access control with Supabase Auth. Row Level Security ensures data
                  privacy and protection.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Customization</h3>
                <p className="text-gray-600">
                  Brand colors, logos, text content, and Bengali language support. Customize every
                  aspect through the admin panel.
                </p>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Complete System Components
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-blue-600" />
                  Admin Dashboard
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Create and manage agent accounts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Flow Builder for presets and quick links
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Brand customization (colors, logos, text)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Complete control over chatbot behavior</span>
                  </li>
                </ul>
                <Link href="/admin/login" className="mt-6 block">
                  <Button className="w-full">
                    Access Admin Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>

              <Card className="p-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-green-600" />
                  Agent Workspace
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Real-time chat queue and notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Send text messages and view file attachments
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Online/Offline status toggle
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">
                      Chat assignment and resolution management
                    </span>
                  </li>
                </ul>
                <Link href="/agent/login" className="mt-6 block">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Access Agent Workspace
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Embed on Any Website</h2>
            <p className="text-xl mb-8 text-blue-100">
              Add this simple script to your website and start chatting with your customers
              instantly.
            </p>
            <div className="bg-gray-900 rounded-lg p-6 text-left">
              <code className="text-green-400 text-sm">
                {`<script src="https://your-domain.com/widget.js"></script>`}
              </code>
            </div>
            <p className="mt-6 text-blue-100">
              The widget is fully responsive, mobile-friendly, and uses Shadow DOM to prevent style
              conflicts.
            </p>
          </div>
        </section>

        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Experience the power of a professional multi-agent chatbot system
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/embed">
                <Button size="lg" className="text-lg px-8">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Try the Widget
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  <Settings className="w-5 h-5 mr-2" />
                  Login as Admin
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Built with Next.js, Tailwind CSS, Supabase, and shadcn/ui
            </p>
            <p className="text-sm">
              Multi-Agent Real-Time Chatbot Plugin System &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
