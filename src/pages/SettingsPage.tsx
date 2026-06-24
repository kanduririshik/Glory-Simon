import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Mail, 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Settings,
  Plug,
  RefreshCw
} from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { useNotifications } from '../context/NotificationContext';
import { GlassCard } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useGlobalTeamFilter } from '../lib/assignments';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types';

export const SettingsPage: React.FC = () => {
  const { 
    profiles, 
    createProfile, 
    updateProfile, 
    deleteProfile,
    emailTemplates,
    updateEmailTemplate,
    sendEmail,
    emailLogs
  } = useCRM();
  const { addToast } = useNotifications();
  const [globalFilter, setGlobalFilter] = useGlobalTeamFilter();

  const [activeTab, setActiveTab] = useState<'team' | 'integrations' | 'preferences'>('team');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);

  // Integrations Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState('welcome');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('kanduririshik@gmail.com');
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  // Gmail Status State
  const [integrationStatus, setIntegrationStatus] = useState<{
    connected: boolean;
    productionMode: boolean;
    senderEmail: string;
    lastSuccessfulSend: string | null;
    lastError: string | null;
    loading: boolean;
  }>({
    connected: false,
    productionMode: false,
    senderEmail: 'kanduririshik@gmail.com',
    lastSuccessfulSend: null,
    lastError: null,
    loading: true
  });

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('gmail-service', {
        body: { action: 'get-status' }
      });
      if (!error && data) {
        setIntegrationStatus({
          connected: data.connected,
          productionMode: data.productionMode,
          senderEmail: data.senderEmail || 'kanduririshik@gmail.com',
          lastSuccessfulSend: data.lastSuccessfulSend,
          lastError: data.lastError,
          loading: false
        });
      } else {
        setIntegrationStatus(prev => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('[SettingsPage] Error fetching Gmail integration status:', err);
      setIntegrationStatus(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (activeTab === 'integrations') {
      checkStatus();
    }
  }, [activeTab]);

  // Sync template subject/body when template ID or template array changes
  useEffect(() => {
    const template = emailTemplates.find(t => t.id === selectedTemplateId);
    if (template) {
      setTemplateSubject(template.subject);
      setTemplateBody(template.body);
    }
  }, [selectedTemplateId, emailTemplates]);

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateEmailTemplate(selectedTemplateId, {
        subject: templateSubject,
        body: templateBody
      });
      addToast('Template Saved', 'Email template updated successfully.', 'success');
    } catch (err: any) {
      addToast('Save Failed', err.message || 'Error saving template', 'error');
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingEmail(true);
    try {
      const res = await sendEmail({
        enquiryId: '00000000-0000-0000-0000-000000000000', // empty fallback uuid
        recipientEmail: testEmailAddress,
        subject: 'Glory Simon Interiors Integration Test',
        body: 'This is a secure integration verification dispatch from your Glory Simon Interiors CRM. Your Gmail API integration is successfully authenticated.',
        emailType: 'Test'
      });
      if (res.success) {
        addToast('Test Email Dispatched', `Delivered test package to ${testEmailAddress}.`, 'success');
        setShowTestModal(false);
        await checkStatus(); // refresh status
      } else {
        addToast('Test Failed', res.errorMessage || 'Unknown error occurred.', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Failed to dispatch test.', 'error');
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('Interior Designer');
  const [avatarUrl, setAvatarUrl] = useState('');

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setRole('Interior Designer');
    setAvatarUrl('');
    setEditingProfile(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFullName(profile.fullName);
    setEmail(profile.email);
    setRole(profile.role);
    setAvatarUrl(profile.avatarUrl || '');
    setIsModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      addToast('Validation Error', 'Full Name and Email are required.', 'error');
      return;
    }

    try {
      if (editingProfile) {
        // Edit flow
        await updateProfile(editingProfile.id, {
          fullName,
          email,
          role,
          avatarUrl: avatarUrl || undefined
        });
        addToast('Profile Updated', `${fullName}'s record has been successfully updated.`, 'success');
      } else {
        // Create flow
        await createProfile({
          fullName,
          email,
          role,
          avatarUrl: avatarUrl || undefined
        });
        addToast('Member Added', `${fullName} has been added to the team.`, 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      addToast('Error', err.message || 'Operation failed.', 'error');
    }
  };

  const handleDeleteProfile = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove ${name} from team records?`)) {
      try {
        await deleteProfile(id);
        addToast('Member Removed', `${name}'s record has been successfully deleted.`, 'success');
      } catch (err: any) {
        addToast('Error', err.message || 'Failed to delete record.', 'error');
      }
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole) {
      case 'Admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Project Manager':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Interior Designer':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Site Engineer':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto overflow-x-hidden text-left font-sans pb-20">
      {/* Header */}
      <div className="border-b border-[#D4A65A]/15 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.2em] text-[#8B7355] uppercase font-bold font-mono">System Settings</span>
          <h1 className="text-4xl font-serif font-medium text-white mt-1">Glory Simon Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1 font-light leading-relaxed">
            Manage company team records, staff assignments, and preferences.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 w-fit p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
        <button 
          onClick={() => setActiveTab('team')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'team' 
              ? 'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/20' 
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Users className="h-4 w-4" /> Team Members
        </button>
        <button 
          onClick={() => setActiveTab('integrations')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'integrations' 
              ? 'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/20' 
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Plug className="h-4 w-4" /> Gmail Integration
        </button>
        <button 
          onClick={() => setActiveTab('preferences')} 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            activeTab === 'preferences' 
              ? 'bg-[#D4A65A]/15 text-[#E6C27A] border border-[#D4A65A]/20' 
              : 'text-slate-400 hover:text-white border border-transparent'
          }`}
        >
          <Settings className="h-4 w-4" /> System Preferences
        </button>
      </div>

      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Team Management Card */}
          <GlassCard hoverEffect={false} className="p-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div>
                <h3 className="text-base font-serif font-medium text-white">Staff Assignment Records</h3>
                <p className="text-[10.5px] text-slate-500 font-light mt-0.5">
                  These records are used for assigning designers, engineers, and coordinators to projects and leads.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-1.5 px-4.5 py-2 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
              >
                <Plus className="h-3.5 w-3.5" /> Add Staff Member
              </button>
            </div>

            {/* Profiles Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#D4A65A]/10 text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    <th className="py-3 px-4 font-normal">Member</th>
                    <th className="py-3 px-4 font-normal">Email Address</th>
                    <th className="py-3 px-4 font-normal">System Role</th>
                    <th className="py-3 px-4 font-normal">Joined</th>
                    <th className="py-3 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                  {profiles.map((p) => {
                    const avatar = p.profileImage || p.avatarUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=60';
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4.5 px-4">
                          <div className="flex items-center gap-3">
                            <img src={avatar} alt={p.fullName} className="h-9 w-9 rounded-xl object-cover border border-[#D4A65A]/20 shadow-inner" />
                            <div>
                              <span className="font-semibold text-white block">{p.fullName}</span>
                              <span className="text-[10px] text-slate-400 block font-light">{p.roleTitle || p.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4.5 px-4 text-slate-400">{p.email}</td>
                        <td className="py-4.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-medium border ${getRoleBadgeColor(p.role)}`}>
                            {p.role}
                          </span>
                        </td>
                        <td className="py-4.5 px-4 text-slate-400 font-mono text-[10px]">
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-4.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {globalFilter === p.id ? (
                              <button
                                onClick={() => {
                                  setGlobalFilter('All');
                                  addToast('Filter Reset', 'Displaying all CRM records.', 'info');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#D4A65A]/20 border border-[#D4A65A] text-[#E6C27A] hover:bg-[#D4A65A]/30 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(212,166,90,0.15)]"
                                title="Clear Filter"
                              >
                                <Users className="h-3.5 w-3.5" /> Filtering Workload
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setGlobalFilter(p.id);
                                  addToast('Workload Filter Applied', `Displaying only records assigned to ${p.fullName}.`, 'info');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-[#D4A65A]/10 border border-[#D4A65A]/25 text-[#E6C27A] hover:bg-[#D4A65A]/20 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider font-mono"
                                title="Filter Workload"
                              >
                                <Users className="h-3.5 w-3.5" /> Filter Workload
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-[#D4A65A]/40 text-slate-300 hover:text-[#E6C27A] transition-all cursor-pointer"
                              title="Edit Record"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProfile(p.id, p.fullName)}
                              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:border-rose-500/40 text-slate-300 hover:text-rose-400 transition-all cursor-pointer"
                              title="Remove Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {profiles.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                        No team profiles found in the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Connection Status Card */}
          <div className="lg:col-span-4 space-y-6">
            <GlassCard hoverEffect={false} className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                  Gmail Authentication Status
                </h3>
                <p className="text-[10px] text-slate-400 font-light mt-1">
                  Deliver proposals and updates securely from your authenticated address.
                </p>
              </div>

              <div className="space-y-4 text-xs text-left">
                {integrationStatus.loading ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 gap-2 font-mono">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#D4A65A]" /> Checking credentials...
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="p-4 bg-[#141414]/60 border border-[#D4A65A]/25 rounded-2xl space-y-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Account:</span>
                        <span className="font-bold text-white font-mono">{integrationStatus.senderEmail}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Connection Status:</span>
                        {integrationStatus.productionMode ? (
                          integrationStatus.connected ? (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono bg-emerald-950/40 text-[#9BCF8A] border border-emerald-500/25 uppercase flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Connected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono bg-rose-950/40 text-rose-400 border border-rose-500/25 uppercase flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> Connection Failed
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[8.5px] font-bold font-mono bg-amber-950/40 text-amber-400 border border-amber-500/25 uppercase flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> Simulation Mode
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Mode:</span>
                        <span className="text-white font-semibold font-mono text-[10px]">
                          {integrationStatus.productionMode ? 'Production' : 'Simulation'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">OAuth Scope:</span>
                        <span className="text-[#E6C27A] font-mono text-[9px] font-semibold">
                          {integrationStatus.productionMode ? 'gmail.send (Verified)' : 'N/A'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Last Send Result:</span>
                        <span className={`font-mono text-[9.5px] font-semibold ${integrationStatus.lastError ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {integrationStatus.lastError ? 'Error' : (integrationStatus.lastSuccessfulSend ? 'Success' : 'None')}
                        </span>
                      </div>
                    </div>

                    {!integrationStatus.productionMode && (
                      <div className="p-3 bg-amber-950/20 border border-amber-500/20 text-amber-400 rounded-xl text-[10px] leading-relaxed">
                        ⚠️ <strong>Warning</strong>: Gmail OAuth credentials are missing in Supabase. The CRM is running in Simulation Mode and will mock all dispatches.
                      </div>
                    )}

                    {integrationStatus.productionMode && !integrationStatus.connected && (
                      <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl text-[10px] leading-relaxed">
                        ❌ <strong>Authentication Error</strong>: Real-mode configured, but Deno could not verify Google tokens. Verify secrets in Supabase dashboard.
                      </div>
                    )}

                    {integrationStatus.lastError && (
                      <div className="p-3 bg-rose-950/10 border border-rose-500/10 text-rose-400/90 rounded-xl text-[9px] font-mono break-words">
                        <strong>Last Error Details:</strong> {integrationStatus.lastError}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-2.5 pt-2">
                  <button 
                    onClick={() => {
                      addToast('OAuth Connect Triggered', 'Authenticating via Google secure gateway...', 'info');
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md text-center"
                  >
                    Reconnect Gmail Account
                  </button>
                  <button 
                    onClick={async () => {
                      setIntegrationStatus(prev => ({ ...prev, loading: true }));
                      await checkStatus();
                      addToast('Status Synced', 'Gmail API status updated.', 'success');
                    }}
                    disabled={integrationStatus.loading}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${integrationStatus.loading ? 'animate-spin' : ''}`} /> Refresh Connection
                  </button>
                  <button 
                    onClick={() => setShowTestModal(true)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#D4A65A]/10 border border-[#D4A65A]/25 text-[#E6C27A] hover:bg-[#D4A65A]/20 text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </GlassCard>

            {/* Email Logs Dashboard */}
            <GlassCard hoverEffect={false} className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                  Gmail Send Metrics
                </h3>
                <p className="text-[10px] text-slate-400 font-light mt-1">
                  Historical telemetry and outbound audit summaries.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-[#141414]/40 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Total Sent</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                    {emailLogs.filter(log => log.status === 'delivered' || log.status === 'sent').length}
                  </span>
                </div>
                <div className="p-3 bg-[#141414]/40 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Failed</span>
                  <span className={`text-lg font-bold font-mono mt-0.5 block ${emailLogs.filter(log => log.status === 'failed').length > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {emailLogs.filter(log => log.status === 'failed').length}
                  </span>
                </div>
                <div className="p-3 bg-[#141414]/40 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Quotations</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                    {emailLogs.filter(log => log.emailType.toLowerCase().includes('quotation') && (log.status === 'delivered' || log.status === 'sent')).length}
                  </span>
                </div>
                <div className="p-3 bg-[#141414]/40 border border-white/5 rounded-xl">
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Invoices</span>
                  <span className="text-lg font-bold text-white font-mono mt-0.5 block">
                    {emailLogs.filter(log => log.emailType.toLowerCase().includes('invoice') && (log.status === 'delivered' || log.status === 'sent')).length}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#141414]/60 border border-white/5 rounded-xl text-left text-[9.5px] space-y-1">
                <span className="text-slate-400 uppercase font-mono block text-[8px]">Last Dispatch Timestamp</span>
                <span className="text-slate-200 block font-semibold font-mono">
                  {integrationStatus.lastSuccessfulSend ? new Date(integrationStatus.lastSuccessfulSend).toLocaleString() : 'Never'}
                </span>
              </div>
            </GlassCard>
          </div>

          {/* Email Template Editor */}
          <div className="lg:col-span-8">
            <GlassCard hoverEffect={false} className="p-6">
              <div className="border-b border-white/5 pb-3 mb-5">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                  Email Templates Editor
                </h3>
                <p className="text-[10.5px] text-slate-400 font-light mt-0.5">
                  Customize subjects and messages automatically sent during customer pipelines.
                </p>
              </div>

              <form onSubmit={handleSaveTemplate} className="space-y-4 text-left">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-mono block">Select Template</label>
                    <select
                      className="w-full bg-[#141414] border border-[#D4A65A]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all cursor-pointer"
                      value={selectedTemplateId}
                      onChange={e => setSelectedTemplateId(e.target.value)}
                    >
                      <option value="welcome">Welcome Email</option>
                      <option value="quotation">Quotation Email</option>
                      <option value="invoice">Invoice Email</option>
                      <option value="site_visit">Site Visit Confirmation</option>
                      <option value="progress_update">Project Progress Update</option>
                      <option value="project_completion">Project Completion Email</option>
                    </select>
                  </div>
                  <div className="p-3 bg-[#141414]/30 border border-white/5 rounded-xl flex items-center justify-between text-xxs font-mono text-slate-400">
                    <div>
                      <span className="block font-bold text-slate-300">Variables available:</span>
                      <span className="block mt-1 font-sans text-[10px]">
                        {selectedTemplateId === 'quotation' && '{clientName}, {quotationNumber}, {amount}, {location}'}
                        {selectedTemplateId === 'invoice' && '{clientName}, {invoiceNumber}, {amount}'}
                        {selectedTemplateId === 'welcome' && '{clientName}, {projectType}, {location}'}
                        {selectedTemplateId === 'site_visit' && '{clientName}, {location}, {date}, {time}, {staffName}'}
                        {selectedTemplateId === 'progress_update' && '{clientName}, {projectName}, {location}, {milestoneTitle}, {milestoneStatus}, {updateDetails}'}
                        {selectedTemplateId === 'project_completion' && '{clientName}, {projectType}, {location}'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block">Email Subject</label>
                  <input
                    type="text"
                    required
                    value={templateSubject}
                    onChange={e => setTemplateSubject(e.target.value)}
                    placeholder="Enter email subject line..."
                    className="w-full bg-[#141414] border border-[#D4A65A]/25 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-mono block">Email Body Message</label>
                  <textarea
                    rows={8}
                    required
                    value={templateBody}
                    onChange={e => setTemplateBody(e.target.value)}
                    placeholder="Write template message content..."
                    className="w-full bg-[#141414] border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all font-mono leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
                  >
                    Save Template Config
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}

      {activeTab === 'preferences' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            {/* Company Metadata */}
            <GlassCard hoverEffect={false} className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/5 pb-2">
                Company Portfolio Metadata
              </h3>
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Organization Name</span>
                  <span className="font-semibold text-[#E6C27A] mt-0.5 block">Glory Simon Interiors Ltd</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Headquarters Address</span>
                  <span className="text-slate-300 mt-0.5 block">Level 12, Manhattan Design Center, NY</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-mono block">Design Domain</span>
                  <span className="text-slate-300 mt-0.5 block">glorysimon.com</span>
                </div>
              </div>
            </GlassCard>

            {/* Notification configurations */}
            <GlassCard hoverEffect={false} className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <Bell className="h-4.5 w-4.5 text-[#D4A65A]" /> Notification Configurations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">In-app notifications</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5 block">Show toast alerts on status changes</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4.5 w-4.5 border-slate-300 rounded text-[#D4A65A] focus:ring-[#D4A65A] cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Automated Slack webhooks</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5 block">Post lead progress metrics to channel</span>
                  </div>
                  <input type="checkbox" defaultChecked className="h-4.5 w-4.5 border-slate-300 rounded text-[#D4A65A] focus:ring-[#D4A65A] cursor-pointer" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Slack SiteVisit schedules</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5 block">Notify engineers when inspection dates lock</span>
                  </div>
                  <input type="checkbox" className="h-4.5 w-4.5 border-slate-300 rounded text-[#D4A65A] focus:ring-[#D4A65A] cursor-pointer" />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Email / Gateway setup */}
          <div className="space-y-8">
            <GlassCard hoverEffect={false} className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
                <Mail className="h-4.5 w-4.5 text-[#D4A65A]" /> Gateway Integration Setup
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">WhatsApp Business Cloud API</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5 block">Connect custom phone templates numbers</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#141414]/60 border border-white/5 text-[8px] font-mono text-slate-400 uppercase">Mock Mode</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">EmailJS / Gmail Gateway</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5 block">Deliver proposals from support@glorysimon.com</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#141414]/60 border border-white/5 text-[8px] font-mono text-slate-400 uppercase">Connected (Gmail)</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Profile Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProfile ? 'Edit Staff Profile' : 'Add New Staff Profile'}
      >
        <form onSubmit={handleSaveProfile} className="space-y-5 py-2 text-left">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-mono">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Sneha Patel"
              className="w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-mono">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. sneha@glorysimon.com"
              className="w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-mono">Role Class</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all cursor-pointer"
            >
              <option value="Admin">Admin (e.g. Glory Simon)</option>
              <option value="Project Manager">Project Manager (e.g. Sarah Jenkins)</option>
              <option value="Interior Designer">Interior Designer (e.g. Michael Chen)</option>
              <option value="Site Engineer">Site Engineer (e.g. David Ross)</option>
              <option value="Vendor Manager">Vendor Manager (e.g. Elena Rostova)</option>
              <option value="Procurement Coordinator">Procurement Coordinator</option>
              <option value="Client Relationship Manager">Client Relationship Manager</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-mono">Avatar URL (Optional)</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md"
            >
              {editingProfile ? 'Save Changes' : 'Create Record'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Test Email Modal */}
      <Modal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Send Test Email Sourcing Verification"
      >
        <form onSubmit={handleSendTestEmail} className="space-y-4 py-2 text-left">
          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Enter the recipient address below. This will dispatch a secure verification packet to test Gmail API functionality.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block font-mono">Recipient Email</label>
            <input
              type="email"
              required
              value={testEmailAddress}
              onChange={e => setTestEmailAddress(e.target.value)}
              placeholder="e.g. yourname@example.com"
              className="w-full bg-[#1C1C1E]/60 border border-[#D4A65A]/25 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-6">
            <button
              type="button"
              onClick={() => setShowTestModal(false)}
              className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isTestingEmail}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#D4A65A] to-[#E6C27A] text-black text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {isTestingEmail ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                'Dispatch Test Packet'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SettingsPage;
