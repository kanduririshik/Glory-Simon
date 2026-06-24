import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Flag, 
  Package, 
  AlertOctagon, 
  Plus, 
  Check,
  Layers3,
  Mail,
  Send
} from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GlassCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useCRM } from '../context/CRMContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  useSimulatedPortalRole,
  useGlobalTeamFilter
} from '../lib/assignments';
import { TeamSelector } from '../components/ui/TeamSelector';
import { ProfileCard } from '../components/ui/ProfileCard';

interface TaskItem {
  id: string;
  enquiryId: string;
  title: string;
  status: 'todo' | 'completed';
  dueDate: string;
  category: 'Design' | 'Procurement' | 'Execution';
}

interface Milestone {
  id: string;
  enquiryId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  targetDate: string;
}

export const ProjectHubPage: React.FC = () => {
  const { enquiries, updateEnquiry, profiles, sendEmail, emailTemplates } = useCRM();
  const { addToast } = useNotifications();

  // Send Update States
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [milestoneStatus, setMilestoneStatus] = useState('In Progress');
  const [updateDetails, setUpdateDetails] = useState('');
  const [isSendingUpdate, setIsSendingUpdate] = useState(false);

  // Active client selector
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string>('');
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();

  const filteredEnquiriesForSelect = useMemo(() => {
    const validStatuses = ['Confirmed', 'Project Confirmed', 'Won', 'Active Project', 'In Progress'];
    const list = enquiries.filter(e => validStatuses.includes(e.status));
    
    if (portalRole !== 'Admin') {
      return list.filter(e => {
        const staff = profiles.find(p => p.id === e.assignedStaffId);
        if (portalRole === 'Vendor Partner') {
          return staff?.role === 'Vendor Manager' || staff?.role === 'Procurement Coordinator';
        }
        return staff?.role === portalRole;
      });
    }

    if (globalFilter !== 'All') {
      return list.filter(e => e.assignedStaffId === globalFilter);
    }
    return list;
  }, [enquiries, globalFilter, portalRole, profiles]);

  const activeClient = useMemo(() => {
    return filteredEnquiriesForSelect.find(e => e.id === selectedEnquiryId) || filteredEnquiriesForSelect[0];
  }, [filteredEnquiriesForSelect, selectedEnquiryId]);

  // Debugging console logs
  console.log("Profiles:", profiles);
  console.log("Enquiries:", enquiries);
  console.log("Filtered Projects:", filteredEnquiriesForSelect);

  // Tasks mock data
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: 't1', enquiryId: 'e6', title: 'Compile marble slab mockups from Antolini', status: 'completed', dueDate: '2026-06-02', category: 'Design' },
    { id: 't2', enquiryId: 'e6', title: 'Verify historical board moldings parameters', status: 'todo', dueDate: '2026-06-12', category: 'Design' },
    { id: 't3', enquiryId: 'e6', title: 'Confirm logistics transport from Carrara ports', status: 'todo', dueDate: '2026-06-15', category: 'Procurement' },
    { id: 't4', enquiryId: 'e6', title: 'Finalize site wall leveling plaster work', status: 'todo', dueDate: '2026-06-20', category: 'Execution' },
    { id: 't5', enquiryId: 'e1', title: 'Bespoke brass hardware mock validation', status: 'todo', dueDate: '2026-06-14', category: 'Design' }
  ]);

  // Milestones
  const milestones: Milestone[] = [
    { id: 'm1', enquiryId: 'e6', title: 'Moodboard Design Sign-off', status: 'completed', targetDate: '2026-05-18' },
    { id: 'm2', enquiryId: 'e6', title: 'CAD Drawing Layout Approval', status: 'completed', targetDate: '2026-05-28' },
    { id: 'm3', enquiryId: 'e6', title: 'Raw Sourcing Orders Lock', status: 'in_progress', targetDate: '2026-06-10' },
    { id: 'm4', enquiryId: 'e6', title: 'Plumbing & Structural Demolition', status: 'pending', targetDate: '2026-06-25' }
  ];

  // Procurement order mock data
  const procurementOrders = [
    { item: 'Calacatta Gold slabs', vendor: 'Carrara Marble Imports', qty: '420m²', status: 'Shipped', tracking: 'IT-CN-90823' },
    { item: 'Bespoke Murano Chandelier', vendor: 'Murano Glass Artistry', qty: '1 Units', status: 'Processing', tracking: 'Pending' },
    { item: 'Charcoal Silk Velvet Fabrics', vendor: 'Belgian Linen Mills', qty: '120m', status: 'Delivered', tracking: 'US-DHL-89023' }
  ];

  // Snags mock data
  const snagList = [
    { desc: 'Nero Marquina tile alignment offset in lobby washroom', status: 'Open', priority: 'High' },
    { desc: 'Satin brass cabinet handles scuff marks on dining drawer', status: 'Open', priority: 'Low' },
    { desc: 'HVAC controller sensor dimming responsiveness lag', status: 'Resolved', priority: 'Medium' }
  ];

  // Active client tasks
  const clientTasks = useMemo(() => {
    return tasks.filter(t => t.enquiryId === (activeClient?.id || ''));
  }, [tasks, activeClient]);

  // Active client milestones
  const clientMilestones = useMemo(() => {
    return milestones.filter(m => m.enquiryId === (activeClient?.id || ''));
  }, [milestones, activeClient]);

  // Toggle task checkbox
  const toggleTaskStatus = (id: string) => {
    setTasks(prev => 
      prev.map(t => t.id === id ? { ...t, status: t.status === 'todo' ? 'completed' : 'todo' } : t)
    );
    addToast('Task Modified', 'Workflow status successfully toggled.', 'info');
  };

  // Add task submit
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeClient) return;

    const newTask: TaskItem = {
      id: 't_' + Math.random().toString(36).substr(2, 9),
      enquiryId: activeClient.id,
      title: newTaskTitle.trim(),
      status: 'todo',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week out
      category: 'Design'
    };

    setTasks(prev => [newTask, ...prev]);
    setNewTaskTitle('');
    addToast('Task Created', 'Added new project checklist task.', 'success');
  };

  const handleSendUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    setIsSendingUpdate(true);
    addToast('Dispatching update...', 'Compiling progress update email.', 'info');

    try {
      const tmpl = emailTemplates.find(t => t.id === 'progress_update') || {
        subject: 'Project Update: {projectName} - Glory Simon Interiors',
        body: 'Dear {clientName},\n\nWe are pleased to provide an update on the progress of your luxury interior installation at {location}.\n\nMilestone Status: {milestoneTitle} is now {milestoneStatus}.\nDetails: {updateDetails}\n\nWarm regards,\nGlory Simon Interiors Team'
      };

      const projectName = `${activeClient.projectType} at ${activeClient.location}`;
      const parseText = (txt: string) => {
        return txt
          .replace(/{clientName}/g, activeClient.clientName)
          .replace(/{projectName}/g, projectName)
          .replace(/{location}/g, activeClient.location || 'site')
          .replace(/{milestoneTitle}/g, selectedMilestone || 'Main Installation')
          .replace(/{milestoneStatus}/g, milestoneStatus)
          .replace(/{updateDetails}/g, updateDetails || 'Work is progressing smoothly.');
      };

      const emailSubject = parseText(tmpl.subject);
      const emailBody = parseText(tmpl.body);

      const result = await sendEmail({
        enquiryId: activeClient.id,
        recipientEmail: activeClient.email,
        subject: emailSubject,
        body: emailBody,
        emailType: 'Project Progress Update'
      });

      setIsSendingUpdate(false);
      if (result.success) {
        addToast('Project Update Sent', `Progress email dispatched to ${activeClient.clientName}.`, 'success');
        setIsUpdateModalOpen(false);
        setSelectedMilestone('');
        setUpdateDetails('');
      } else {
        addToast('Dispatch Failed', result.errorMessage || 'Failed to send update.', 'error');
      }
    } catch (err: any) {
      setIsSendingUpdate(false);
      console.error(err);
      addToast('Error', err.message || 'Could not send update email.', 'error');
    }
  };

  if (filteredEnquiriesForSelect.length === 0) {
    return (
      <div className="space-y-16 pb-20 overflow-x-hidden text-left bg-[#0A0A0A]">
        {/* Cinematic Hero Header */}
        <div className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=90" 
              alt="Executive project cockpit background" 
              className="w-full h-full object-cover brightness-[35%] filter contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          </div>
          <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-4">
            <span className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-display">Execution Cockpit</span>
            <h1 className="text-4xl md:text-5xl font-serif font-light text-white tracking-tight leading-tight">Project Execution Hub</h1>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="glass-premium-gold border border-[#D4A65A]/25 rounded-3xl p-12 text-center space-y-4">
            <h2 className="text-xl font-serif text-white">No Active Sourcing Projects</h2>
            <p className="text-xs text-[#A9A9A9] max-w-md mx-auto leading-relaxed">
              There are currently no projects with active status (Confirmed, Project Confirmed, Won, Active Project, or In Progress) allocated to your simulated view.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20 overflow-x-hidden text-left bg-[#0A0A0A]">
      
      {/* Cinematic Hero Header */}
      <div className="relative h-[40vh] w-full flex items-center justify-center overflow-hidden border-b border-[#D4A65A]/15 bg-[#050505]">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600&auto=format&fit=crop&q=90" 
            alt="Executive project cockpit background" 
            className="w-full h-full object-cover brightness-[35%] filter contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#0A0A0A]/40 to-[#0A0A0A]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vw] rounded-full bg-radial from-[#D4A65A]/5 to-transparent pointer-events-none filter blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto space-y-4">
          <span className="text-xxs tracking-[0.5em] text-[#E6C27A] uppercase font-bold block font-display">Execution Cockpit</span>
          <h1 className="text-4xl md:text-5xl font-serif font-medium text-white tracking-tight leading-tight">Project Execution Hub</h1>
          <p className="text-xs md:text-sm text-[#A9A9A9] max-w-xl mx-auto font-light tracking-wide leading-relaxed">
            Monitor spatial construction milestones, track procurement logistics pipelines, and resolve quality checklists.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        
        {/* Selector and Client Summary bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#D4A65A]/10 pb-6">
          <div className="space-y-1">
            <h2 className="text-xl font-serif text-white">Focus Sourcing Account</h2>
            <p className="text-[10px] text-[#A9A9A9]">Select an active client to display the construction cockpit.</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {activeClient && (
              <div className="flex flex-col gap-1 text-left min-w-[240px]">
                <span className="text-[8px] text-[#A9A9A9] uppercase font-mono tracking-wider">Project Owner</span>
                <TeamSelector
                  profiles={profiles}
                  selectedId={activeClient.assignedStaffId || ''}
                  onChange={async (newId) => {
                    try {
                      await updateEnquiry(activeClient.id, { assignedStaffId: newId });
                      addToast('Project Owner Reassigned', 'The project has been successfully reassigned.', 'success');
                    } catch (err: any) {
                      addToast('Reassignment failed', err?.message || 'Check database connection.', 'error');
                    }
                  }}
                  placeholder="Select Project Owner..."
                />
              </div>
            )}

            <div className="relative min-w-[260px] flex flex-col gap-1 text-left">
              <span className="text-[8px] text-[#A9A9A9] uppercase font-mono tracking-wider">Active Sourcing Project</span>
              <div className="relative">
                <select
                  className="w-full appearance-none pl-4 pr-12 py-3 glass-input-premium-light text-xs font-semibold cursor-pointer bg-[#141414] text-white focus:outline-none focus:border-[#D4A65A]/50 transition-all min-h-[48px] rounded-xl border border-[#D4A65A]/20"
                  value={selectedEnquiryId || (activeClient ? activeClient.id : '')}
                  onChange={e => setSelectedEnquiryId(e.target.value)}
                >
                  <option value="" disabled>Choose active project...</option>
                  {filteredEnquiriesForSelect.map(e => (
                    <option key={e.id} value={e.id} className="bg-[#141414] text-white">{e.clientName} ({e.status})</option>
                  ))}
                </select>
                <Layers3 className="absolute right-4 top-4 h-4 w-4 text-[#D4A65A] pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {activeClient ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Panel: Checklist and Sourcing orders */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Project Owner Profile Preview (if assigned) */}
              {activeClient.assignedStaffId && (
                <div className="space-y-2">
                  <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-widest font-semibold block px-1">Project Owner Details</span>
                  <ProfileCard profile={profiles.find(p => p.id === activeClient.assignedStaffId)} />
                </div>
              )}

              {/* Checklist */}
              <GlassCard hoverEffect={false} className="p-8 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe space-y-6">
                <div className="flex justify-between items-center border-b border-[#D4A65A]/10 pb-4">
                  <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest flex items-center gap-2">
                    <CheckSquare className="h-4.5 w-4.5 text-[#D4A65A]" /> Project Checklist Taskboard
                  </h3>
                </div>

                {/* Task list */}
                <div className="space-y-3">
                  {clientTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => toggleTaskStatus(task.id)}
                      className="flex justify-between items-center p-4 rounded-xl border border-[#D4A65A]/15 bg-[#171717]/50 hover:bg-[#171717]/80 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-3 text-left">
                        <span className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                          task.status === 'completed' ? 'bg-[#9BCF8A] border-[#9BCF8A] text-black' : 'border-[#D4A65A]/35 bg-black'
                        }`}>
                          {task.status === 'completed' && <Check className="h-3.5 w-3.5 text-black" />}
                        </span>
                        <span className={`text-xs font-medium ${task.status === 'completed' ? 'line-through text-[#CBBEAB]/60' : 'text-[#F5F1EA]'}`}>
                          {task.title}
                        </span>
                      </span>
                      <span className="text-[9px] text-[#CBBEAB] font-mono">Due: {task.dueDate}</span>
                    </div>
                  ))}

                  {clientTasks.length === 0 && (
                    <div className="text-center py-8 text-[#CBBEAB]/60 text-xs italic">
                      No active tasks allocated for this lead. Add one below.
                    </div>
                  )}
                </div>

                {/* Add Task form */}
                <form onSubmit={handleAddTask} className="flex gap-3 pt-4 border-t border-[#D4A65A]/10">
                  <input
                    type="text"
                    placeholder="Allocate new task requirement..."
                    className="flex-grow text-xs bg-[#111111] text-white border border-[#D4A65A]/25 rounded-lg px-3 py-2"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                  />
                  <Button type="submit" variant="gold" className="cursor-pointer flex items-center gap-1.5 px-6">
                    Add Task <Plus className="h-3.5 w-3.5" />
                  </Button>
                </form>
              </GlassCard>

              {/* Procurement Order Log */}
              <GlassCard hoverEffect={false} className="p-8 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe space-y-6">
                <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest flex items-center gap-2 border-b border-[#D4A65A]/10 pb-4">
                  <Package className="h-4.5 w-4.5 text-[#D99A6C]" /> Raw Material Procurement Tracking
                </h3>

                <div className="overflow-x-auto rounded-xl border border-[#D4A65A]/15 bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="border-b border-[#D4A65A]/25 bg-[#0A0A0A] text-[#D4A65A] text-[9.5px] uppercase tracking-wider">
                        <th className="p-4">Sourced Material</th>
                        <th className="p-4">Vendor</th>
                        <th className="p-4">Quantity</th>
                        <th className="p-4">Carrier Status</th>
                        <th className="p-4 text-right">Waybill No</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D4A65A]/10 text-[#CBBEAB]">
                      {procurementOrders.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-[#D4A65A]/2 transition-colors">
                          <td className="p-4 font-semibold text-[#F5F1EA]">{ord.item}</td>
                          <td className="p-4 text-[#CBBEAB]/80">{ord.vendor}</td>
                          <td className="p-4 font-mono text-[#F5F1EA]">{ord.qty}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase ${
                              ord.status === 'Delivered' ? 'bg-emerald-950/30 text-[#9BCF8A] border border-emerald-500/15' : 
                              ord.status === 'Shipped' ? 'bg-[#D4A65A]/10 text-[#E6C27A] border border-[#D4A65A]/20' : 'bg-[#171717] text-[#CBBEAB] border border-white/5'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-4 text-right font-mono text-[10px] text-[#CBBEAB]/60">{ord.tracking}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>

            </div>

            {/* Right Panel: Milestones & Snags */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Milestones timeline */}
              <GlassCard hoverEffect={false} className="p-6 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe space-y-4">
                <div className="flex justify-between items-center border-b border-[#D4A65A]/10 pb-3">
                  <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest flex items-center gap-2">
                    <Flag className="h-4.5 w-4.5 text-[#D4A65A]" /> Project Milestones
                  </h3>
                  <Button 
                    size="sm" 
                    variant="glass" 
                    onClick={() => {
                      if (clientMilestones.length > 0) {
                        setSelectedMilestone(clientMilestones[0].title);
                      } else {
                        setSelectedMilestone('Custom Stage');
                      }
                      setIsUpdateModalOpen(true);
                    }}
                    className="text-[9px] uppercase tracking-wider font-semibold border border-[#D4A65A]/25 text-[#D4A65A] hover:bg-[#D4A65A]/10 px-2 py-1 h-auto"
                  >
                    <Mail className="h-3 w-3 mr-1" /> Send Update
                  </Button>
                </div>

                <div className="space-y-6 pt-3">
                  {clientMilestones.map(mile => (
                    <div key={mile.id} className="flex gap-4 text-left group">
                      <div className="flex flex-col items-center flex-shrink-0 mt-1">
                        <div className={`h-2.5 w-2.5 rounded-full shadow-sm transition-transform ${
                          mile.status === 'completed' ? 'bg-[#9BCF8A] shadow-[#9BCF8A]/30' : 
                          mile.status === 'in_progress' ? 'bg-[#D4A65A] shadow-[#D4A65A]/30 animate-pulse' : 'bg-[#171717] border border-[#D4A65A]/25'
                        }`} />
                        <div className="w-[1px] h-10 bg-[#D4A65A]/10 mt-1" />
                      </div>
                      <div className="space-y-1">
                        <span className={`text-xs block font-semibold ${mile.status === 'completed' ? 'text-[#CBBEAB]/60 line-through' : 'text-[#F5F1EA]'}`}>
                          {mile.title}
                        </span>
                        <span className="text-[9px] text-[#CBBEAB]/50 font-mono mt-0.5 block">Target: {mile.targetDate}</span>
                      </div>
                    </div>
                  ))}

                  {clientMilestones.length === 0 && (
                    <div className="text-center py-6 text-[#CBBEAB]/60 text-xs italic">
                      No milestones configured.
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Snag Lists */}
              <GlassCard hoverEffect={false} className="p-6 bg-[#111111] border-[#D4A65A]/20 shadow-soft-luxe space-y-4">
                <h3 className="text-xs font-semibold text-white font-sans uppercase tracking-widest flex items-center gap-2 border-b border-[#D4A65A]/10 pb-3">
                  <AlertOctagon className="h-4.5 w-4.5 text-[#D99A6C]" /> Quality Snag List
                </h3>

                <div className="space-y-3.5 pt-2">
                  {snagList.map((snag, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-[#D4A65A]/10 bg-[#171717]/30 space-y-2 text-left hover:border-[#D4A65A]/35 hover:bg-[#171717]/60 transition-all">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          snag.priority === 'High' ? 'bg-orange-950/40 text-[#D99A6C] border border-[#D99A6C]/25' : 'bg-[#171717] text-[#CBBEAB] border border-[#D4A65A]/15'
                        }`}>
                          {snag.priority} Priority
                        </span>
                        <span className={`text-[9.5px] font-bold font-mono ${snag.status === 'Resolved' ? 'text-[#9BCF8A]' : 'text-[#D4A65A]'}`}>
                          {snag.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#EAE3D8] leading-relaxed font-light">{snag.desc}</p>
                    </div>
                  ))}
                </div>
              </GlassCard>

            </div>

          </div>
        ) : (
          <div className="text-center py-20 text-[#A9A9A9] text-xs font-display">
            Please select a project to display the execution parameters.
          </div>
        )}
      </div>

      {/* Send Project Update Email Modal */}
      <Modal isOpen={isUpdateModalOpen} onClose={() => setIsUpdateModalOpen(false)} title="Send Luxury Progress Update">
        {activeClient && (
          <form onSubmit={handleSendUpdateEmail} className="space-y-4 font-display text-left">
            <div>
              <span className="text-[10px] font-mono text-[#CBBEAB] block">Recipient</span>
              <strong className="text-white text-xs">{activeClient.clientName} ({activeClient.email})</strong>
            </div>

            <div>
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Select Milestone</label>
              <select
                className="w-full glass-input-premium-light text-xs cursor-pointer bg-[#141414] text-white focus:outline-none focus:border-[#D4A65A] border border-[#D4A65A]/20 rounded-xl px-3 py-2"
                value={selectedMilestone}
                onChange={e => setSelectedMilestone(e.target.value)}
              >
                {clientMilestones.map(m => (
                  <option key={m.id} value={m.title} className="bg-[#141414] text-white">{m.title}</option>
                ))}
                <option value="Custom Stage" className="bg-[#141414] text-white">Custom Stage (Freeform)</option>
              </select>
            </div>

            {selectedMilestone === 'Custom Stage' && (
              <div>
                <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Custom Stage Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Drywall Wood Veneer Trims"
                  className="w-full glass-input-premium-light text-xs bg-black/40 text-white focus:outline-none focus:border-[#D4A65A] border border-[#D4A65A]/20 rounded-xl px-3 py-2"
                  onChange={e => setSelectedMilestone(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Milestone Status</label>
              <select
                className="w-full glass-input-premium-light text-xs cursor-pointer bg-[#141414] text-white focus:outline-none focus:border-[#D4A65A] border border-[#D4A65A]/20 rounded-xl px-3 py-2"
                value={milestoneStatus}
                onChange={e => setMilestoneStatus(e.target.value)}
              >
                <option value="In Progress" className="bg-[#141414] text-white">In Progress</option>
                <option value="Completed" className="bg-[#141414] text-white">Completed</option>
                <option value="On Hold" className="bg-[#141414] text-white">On Hold / Awaiting Materials</option>
              </select>
            </div>

            <div>
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Detailed Update Snags / Notes *</label>
              <textarea
                required
                rows={4}
                placeholder="Detail the status of material sourcing, structural finishes, or custom millwork snags..."
                className="w-full glass-input-premium-light text-xs bg-black/40 text-white focus:outline-none focus:border-[#D4A65A] border border-[#D4A65A]/20 rounded-xl px-3 py-2 resize-none"
                value={updateDetails}
                onChange={e => setUpdateDetails(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
              <Button variant="ghost" type="button" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
              <Button variant="gold" type="submit" isLoading={isSendingUpdate} className="flex items-center gap-1">
                <Send className="h-3.5 w-3.5 mr-1" /> Dispatch Update
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default ProjectHubPage;
