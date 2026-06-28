import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCRM } from '@/context/CRMContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/Card';
import { useNotifications } from '@/context/NotificationContext';
import { TeamSelector } from '@/components/ui/TeamSelector';
import { ProfileCard } from '@/components/ui/ProfileCard';
import { 
  Search, 
  UserPlus, 
  Edit2, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  Building2, 
  Calendar,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { Client, ClientStatus } from '@/types';

export const ClientManagementPage: React.FC = () => {
  const { clients, createClient, updateClient, deleteClient, isLoading, profiles, createEnquiry, enquiries, updateEnquiry } = useCRM();
  const { addToast } = useNotifications();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Active');
  const [notes, setNotes] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = 
        c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()));
        
      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const openCreateModal = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setStatus('Active');
    setNotes('');
    setAssignedStaffId(profiles[0]?.id || '');
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (client: Client) => {
    setSelectedClient(client);
    setFullName(client.fullName);
    setEmail(client.email);
    setPhone(client.phone || '');
    setCompany(client.company || '');
    setStatus(client.status);
    setNotes(client.notes || '');
    setAssignedStaffId(client.assignedStaffId || (profiles[0]?.id || ''));
    setFormError('');
    setIsEditOpen(true);
  };

  const openDetailModal = (client: Client) => {
    setSelectedClient(client);
    setIsDetailOpen(true);
  };

  const openDeleteConfirm = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteConfirmOpen(true);
  };

  // Status Styling
  const getStatusBadge = (s: ClientStatus) => {
    switch (s) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Inactive':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'Lead':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Archived':
        return 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20';
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) {
      setFormError('Name and Email are required.');
      return;
    }

    // Check if email already exists
    const emailExists = (clients || []).some(
      c => c.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (emailExists) {
      setFormError('A client with this email address is already registered.');
      return;
    }

    setFormError('');
    setActionLoading(true);

    try {
      // 1. Create client
      await createClient({
        fullName,
        email,
        phone: phone || undefined,
        company: company || undefined,
        status,
        notes: notes || undefined,
        assignedStaffId: assignedStaffId || undefined
      });

      // 2. Create matching project enquiry (so they show up in Client Enquiries Registry)
      await createEnquiry({
        clientName: fullName,
        phoneNumber: phone || '',
        email: email,
        companyName: company || '',
        projectType: 'Home Interior',
        location: 'TBD',
        budget: 150000,
        sqFtArea: 2500,
        preferredStyle: 'Luxury',
        requirements: notes || 'Registered from Client Database.',
        notes: notes || '',
        leadSource: 'Referral',
        priority: 'Medium',
        status: 'New Lead', // Default status for Enquiry Registry
        assignedStaffId: assignedStaffId || undefined
      });

      addToast('Success', `${fullName} has been registered successfully.`, 'success');
      setIsCreateOpen(false);
    } catch (err: any) {
      console.error(err);
      const isDuplicate = err.message?.toLowerCase().includes('duplicate key') || 
                          err.message?.toLowerCase().includes('clients_email_key') ||
                          err.message?.toLowerCase().includes('unique constraint');
      setFormError(isDuplicate ? 'A client with this email address is already registered.' : (err.message || 'An error occurred while creating client.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    if (!fullName || !email) {
      setFormError('Name and Email are required.');
      return;
    }

    // Check if email already exists for another client
    const emailExists = (clients || []).some(
      c => c.email.trim().toLowerCase() === email.trim().toLowerCase() && c.id !== selectedClient.id
    );
    if (emailExists) {
      setFormError('A client with this email address is already registered.');
      return;
    }

    setFormError('');
    setActionLoading(true);

    try {
      // 1. Update client
      await updateClient(selectedClient.id, {
        fullName,
        email,
        phone: phone || undefined,
        company: company || undefined,
        status,
        notes: notes || undefined,
        assignedStaffId: assignedStaffId || undefined
      });

      // 2. Update matching project enquiry if found
      const matchingEnquiry = (enquiries || []).find(
        e => e.email.toLowerCase() === selectedClient.email.toLowerCase() || 
             e.clientName.toLowerCase() === selectedClient.fullName.toLowerCase()
      );
      if (matchingEnquiry) {
        await updateEnquiry(matchingEnquiry.id, {
          clientName: fullName,
          email: email,
          phoneNumber: phone || '',
          companyName: company || '',
          assignedStaffId: assignedStaffId || undefined
        });
      }

      addToast('Success', `Client details for ${fullName} updated successfully.`, 'success');
      setIsEditOpen(false);
    } catch (err: any) {
      console.error(err);
      const isDuplicate = err.message?.toLowerCase().includes('duplicate key') || 
                          err.message?.toLowerCase().includes('clients_email_key') ||
                          err.message?.toLowerCase().includes('unique constraint');
      setFormError(isDuplicate ? 'A client with this email address is already registered.' : (err.message || 'An error occurred while updating client.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClient) return;
    setActionLoading(true);
    try {
      await deleteClient(selectedClient.id);
      addToast('Client Deleted', 'The client record has been removed.', 'success');
      setIsDeleteConfirmOpen(false);
    } catch (err: any) {
      console.error(err);
      addToast('Deletion Failed', err.message || 'An error occurred while deleting the client.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Directory Title and Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D4A65A]/15 pb-4">
        <div>
          <h1 className="text-3xl font-serif text-[#F5F1EA]">Client Directory</h1>
          <p className="text-xs text-[#CBBEAB]/70 mt-1">Manage official registered clients and track their status.</p>
        </div>
        <Button variant="premium" className="flex items-center gap-2 cursor-pointer font-medium tracking-wide text-xs sm:text-sm" onClick={openCreateModal}>
          <UserPlus className="h-4.5 w-4.5" />
          Register New Client
        </Button>
      </div>

      {/* Filters and Search Bar */}
      <GlassCard className="p-4 flex flex-col md:flex-row justify-between items-center gap-4" hoverEffect={false}>
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B7355]">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-[#0A0A0A] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A65A]"
            placeholder="Search name, email, company..."
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs text-[#CBBEAB] uppercase tracking-wider font-sans whitespace-nowrap">Filter Status:</span>
          <div className="flex rounded-xl border border-[#D4A65A]/15 overflow-hidden p-0.5 bg-[#0A0A0A]/40">
            {['All', 'Active', 'Inactive', 'Lead', 'Archived'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 text-xs rounded-lg transition-all cursor-pointer font-medium ${
                  statusFilter === f 
                    ? 'bg-[#D4A65A] text-black shadow-md' 
                    : 'text-[#CBBEAB] hover:text-[#F5F1EA] hover:bg-white/[0.02]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Main Clients Grid/Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-4">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Retrieving client database...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <GlassCard className="p-12 text-center" hoverEffect={false}>
          <AlertCircle className="h-10 w-10 text-[#8B7355] mx-auto mb-3" />
          <h3 className="text-lg font-serif text-[#F5F1EA]">No Clients Found</h3>
          <p className="text-sm text-[#CBBEAB]/65 mt-1">Try adjusting your filters or search terms.</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden border border-[#D4A65A]/15" hoverEffect={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>Client Name</th>
                  <th>Contact Info</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D4A65A]/10">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-[#D4A65A]/2 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-black text-xs shrink-0"
                             style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)' }}>
                          {client.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div>
                          <button 
                            onClick={() => openDetailModal(client)}
                            className="font-serif text-[#F5F1EA] hover:text-[#D4A65A] font-medium text-sm transition-colors text-left block cursor-pointer focus:outline-none"
                          >
                            {client.fullName}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5 text-xs text-[#CBBEAB]/80">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-[#8B7355]" />
                          <span>{client.email}</span>
                        </div>
                        {client.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-[#8B7355]" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-sans text-[#F5F1EA]">
                        {client.company || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(client.status)}`}>
                        {client.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-[#CBBEAB]/70 font-sans">
                        <Calendar className="h-3.5 w-3.5 text-[#8B7355]" />
                        <span>{new Date(client.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" className="p-2 cursor-pointer rounded-lg text-[#CBBEAB] hover:text-[#D4A65A]" title="Edit Details" onClick={() => openEditModal(client)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-2 cursor-pointer rounded-lg text-[#CBBEAB] hover:text-rose-400 hover:bg-rose-500/5" title="Delete Client" onClick={() => openDeleteConfirm(client)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* CREATE CLIENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6 md:p-8 relative max-h-[90vh] overflow-y-auto" hover={false}>
            <button className="absolute top-4 right-4 text-[#CBBEAB] hover:text-[#F5F1EA] cursor-pointer" onClick={() => setIsCreateOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-serif text-[#F5F1EA] mb-6">Register Client</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                    placeholder="client@email.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                    placeholder="+91 99999 99999"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Lead">Lead</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Assigned Team Member *</label>
                <TeamSelector
                  profiles={profiles}
                  selectedId={assignedStaffId}
                  onChange={(id) => setAssignedStaffId(id)}
                  placeholder="Choose team member to assign..."
                />
                {assignedStaffId && (
                  <div className="mt-2">
                    <ProfileCard profile={profiles.find((p) => p.id === assignedStaffId)} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                  placeholder="Design tastes, site dimensions, or requirements notes..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="glass" className="cursor-pointer" onClick={() => setIsCreateOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="premium" className="cursor-pointer" isLoading={actionLoading}>
                  Register Client
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* EDIT CLIENT MODAL */}
      {isEditOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <GlassCard className="w-full max-w-lg p-6 md:p-8 relative max-h-[90vh] overflow-y-auto" hover={false}>
            <button className="absolute top-4 right-4 text-[#CBBEAB] hover:text-[#F5F1EA] cursor-pointer" onClick={() => setIsEditOpen(false)}>
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-2xl font-serif text-[#F5F1EA] mb-6">Edit Client Details</h3>
            <form onSubmit={handleEdit} className="space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{formError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Email *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Company Name</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClientStatus)}
                  className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Lead">Lead</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Assigned Team Member *</label>
                <TeamSelector
                  profiles={profiles}
                  selectedId={assignedStaffId}
                  onChange={(id) => setAssignedStaffId(id)}
                  placeholder="Choose team member to assign..."
                />
                {assignedStaffId && (
                  <div className="mt-2">
                    <ProfileCard profile={profiles.find((p) => p.id === assignedStaffId)} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-[#CBBEAB] uppercase tracking-wider font-medium">Internal Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-[#050505] border border-[#D4A65A]/25 text-[#F5F1EA] rounded-xl text-sm focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="glass" className="cursor-pointer" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="premium" className="cursor-pointer" isLoading={actionLoading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* DETAIL DRAWER / OVERLAY MODAL */}
      {isDetailOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/75 backdrop-blur-xs">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="w-full max-w-md h-full bg-[#0A0A0A] border-l border-[#D4A65A]/15 p-6 flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-[#D4A65A]/10 pb-4">
                <h3 className="text-xl font-serif text-[#F5F1EA]">Client Profile</h3>
                <button className="text-[#CBBEAB] hover:text-[#F5F1EA] cursor-pointer" onClick={() => setIsDetailOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center p-4">
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-black text-xl mb-4 font-serif"
                     style={{ background: 'linear-gradient(135deg, #D4A65A 0%, #E6C27A 100%)', boxShadow: '0 0 20px rgba(212,166,90,0.25)' }}>
                  {selectedClient.fullName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <h4 className="text-lg font-serif font-medium text-[#F5F1EA]">{selectedClient.fullName}</h4>
                <p className="text-xs text-[#CBBEAB]/65 mt-1 font-sans">{selectedClient.company || 'Private Residence'}</p>
                <span className={`inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedClient.status)}`}>
                  {selectedClient.status}
                </span>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#D4A65A]/10">
                <div className="flex items-start gap-3">
                  <Mail className="h-4.5 w-4.5 text-[#8B7355] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans">Email Address</span>
                    <p className="text-sm text-[#F5F1EA] font-sans">{selectedClient.email}</p>
                  </div>
                </div>

                {selectedClient.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-4.5 w-4.5 text-[#8B7355] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans">Phone Number</span>
                      <p className="text-sm text-[#F5F1EA] font-sans">{selectedClient.phone}</p>
                    </div>
                  </div>
                )}

                {selectedClient.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4.5 w-4.5 text-[#8B7355] shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans">Business Entity</span>
                      <p className="text-sm text-[#F5F1EA] font-sans">{selectedClient.company}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Clock className="h-4.5 w-4.5 text-[#8B7355] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans">Registered Date</span>
                    <p className="text-sm text-[#F5F1EA] font-sans">{new Date(selectedClient.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {selectedClient.notes && (
                  <div className="p-3.5 rounded-xl border border-[#D4A65A]/10 bg-white/[0.01] space-y-1">
                    <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans block">Client Notes</span>
                    <p className="text-xs text-[#CBBEAB] font-sans leading-relaxed whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}

                {selectedClient.assignedStaffId && (
                  <div className="pt-4 border-t border-[#D4A65A]/10 space-y-2 text-left">
                    <span className="text-[10px] text-[#CBBEAB]/60 uppercase tracking-widest font-sans block">Assigned Owner</span>
                    <ProfileCard profile={profiles.find((p) => p.id === selectedClient.assignedStaffId)} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-[#D4A65A]/10 mt-6">
              <Button variant="glass" className="w-full cursor-pointer" onClick={() => { setIsDetailOpen(false); openEditModal(selectedClient); }}>
                Edit Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteConfirmOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <GlassCard className="w-full max-w-sm p-6 relative border-rose-500/20" hoverEffect={false}>
            <h3 className="text-xl font-serif text-rose-400 mb-3 flex items-center gap-2">
              Confirm Deletion
            </h3>
            <p className="text-sm text-[#CBBEAB] mb-6 leading-relaxed">
              Are you sure you want to remove the client record for <strong className="text-[#F5F1EA]">{selectedClient.fullName}</strong>? This action is permanent.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="glass" className="cursor-pointer" onClick={() => setIsDeleteConfirmOpen(false)} disabled={actionLoading}>
                Cancel
              </Button>
              <Button variant="danger" className="cursor-pointer" onClick={handleDelete} isLoading={actionLoading}>
                Delete Record
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ClientManagementPage;
