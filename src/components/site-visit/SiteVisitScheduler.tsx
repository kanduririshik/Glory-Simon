import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Check, Calendar, MapPin, Clock, User } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useNotifications } from '../../context/NotificationContext';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import type { SiteVisit, VisitStatus } from '../../types';
import { 
  useSimulatedPortalRole, 
  useGlobalTeamFilter 
} from '../../lib/assignments';
import { TeamSelector } from '../ui/TeamSelector';
import { ProfileCard } from '../ui/ProfileCard';

export const SiteVisitScheduler: React.FC = () => {
  const { 
    siteVisits, 
    enquiries, 
    profiles,
    createSiteVisit, 
    updateSiteVisit,
    sendEmail,
    emailTemplates
  } = useCRM();

  const { addToast } = useNotifications();

  // Calendar Focus: June 2026
  const monthName = 'June 2026';

  // Schedule Modal controls
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Edit/Reschedule state
  const [selectedVisit, setSelectedVisit] = useState<SiteVisit | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  const [portalRole] = useSimulatedPortalRole();
  const [globalFilter] = useGlobalTeamFilter();

  console.log("Profiles:", profiles);
  console.log("Site Visits:", siteVisits);

  // Helper to resolve engineer name from profiles by ID
  const getEngineerName = (engineerId: string): string => {
    const profile = profiles.find(p => p.id === engineerId);
    return profile ? profile.fullName : 'Unassigned';
  };

  // Default to first profile ID (or empty if profiles not loaded yet)
  const defaultEngineerId = useMemo(() => {
    // Prefer a Site Engineer profile as default
    const siteEngineer = profiles.find(p => p.role === 'Site Engineer');
    return siteEngineer?.id || profiles[0]?.id || '';
  }, [profiles]);

  // Form State — engineerId is now a user_profiles.id value
  const [formData, setFormData] = useState({
    enquiryId: '',
    time: '10:00',
    engineerId: '',
    notes: ''
  });

  // Edit engineer state — holds user_profiles.id
  const [editEngineerId, setEditEngineerId] = useState('');

  // Set default engineerId once profiles load
  useEffect(() => {
    if (defaultEngineerId && !formData.engineerId) {
      setFormData(prev => ({ ...prev, engineerId: defaultEngineerId }));
    }
  }, [defaultEngineerId]);

  // Set edit engineer from selectedVisit
  useEffect(() => {
    if (selectedVisit) {
      setEditEngineerId(selectedVisit.engineerId || defaultEngineerId);
    }
  }, [selectedVisit, defaultEngineerId]);

  // Calculate calendar days
  // June 2026 has 30 days and starts on Monday
  const daysInMonth = 30;
  const startDayOfWeek = 0; // Monday start (0 = Mon, 1 = Tue...)

  const calendarDays = useMemo(() => {
    const days = [];
    // Pad initial blank spaces
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, dateString: '' });
    }
    // Add real days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `2026-06-${d.toString().padStart(2, '0')}`;
      days.push({ day: d, dateString });
    }
    return days;
  }, [daysInMonth, startDayOfWeek]);

  // Filter visits based on active portal simulation role and global team filter
  const filteredVisits = useMemo(() => {
    return siteVisits.filter(v => {
      if (portalRole !== 'Admin') {
        const engineerProfile = profiles.find(p => p.id === v.engineerId);
        const linkedEnquiry = enquiries.find(e => e.id === v.enquiryId);
        const enquiryStaff = profiles.find(p => p.id === linkedEnquiry?.assignedStaffId);
        
        if (portalRole === 'Vendor Partner') {
          return engineerProfile?.role === 'Vendor Manager' || enquiryStaff?.role === 'Vendor Manager';
        }
        return engineerProfile?.role === portalRole || enquiryStaff?.role === portalRole;
      }
      
      if (globalFilter !== 'All') {
        const linkedEnquiry = enquiries.find(e => e.id === v.enquiryId);
        return v.engineerId === globalFilter || linkedEnquiry?.assignedStaffId === globalFilter;
      }
      
      return true;
    });
  }, [siteVisits, globalFilter, portalRole, profiles, enquiries]);

  // Group visits by date (YYYY-MM-DD)
  const visitsByDate = useMemo(() => {
    const map: Record<string, SiteVisit[]> = {};
    filteredVisits.forEach(v => {
      const datePart = v.scheduledAt.split('T')[0];
      if (!map[datePart]) map[datePart] = [];
      map[datePart].push(v);
    });
    return map;
  }, [filteredVisits]);

  // Click on a calendar day to schedule a visit
  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    // Reset form with default engineer
    setFormData({
      enquiryId: '',
      time: '10:00',
      engineerId: defaultEngineerId,
      notes: ''
    });
    setIsScheduleOpen(true);
  };

  // Schedule Form Submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.enquiryId || !selectedDay) {
      addToast('Incomplete directives', 'Please choose a client lead.', 'warning');
      return;
    }

    // Validate that the selected engineer ID exists in user_profiles
    const engineerProfile = profiles.find(p => p.id === formData.engineerId);
    if (!engineerProfile) {
      addToast('Invalid engineer', 'Selected engineer does not exist in the system. Please select a valid team member.', 'error');
      return;
    }

    const isoDateTime = `2026-06-${selectedDay.toString().padStart(2, '0')}T${formData.time}:00Z`;

    try {
      await createSiteVisit({
        enquiryId: formData.enquiryId,
        scheduledAt: isoDateTime,
        status: 'Scheduled',
        engineerId: formData.engineerId, // This is now a user_profiles.id
        notes: formData.notes
      });

      // Dispatch automated site visit confirmation email asynchronously
      const activeTmpl = emailTemplates.find(t => t.id === 'site_visit') || {
        subject: 'Site Visit Scheduled: Glory Simon Interiors',
        body: 'Hi {clientName},\n\nThis is to confirm your site visit for the {location} property has been scheduled:\n\nDate: {date}\nTime: {time}\nAssigned Designer/Engineer: {staffName}\n\nWarm regards,\nGlory Simon Interiors'
      };

      const client = enquiries.find(e => e.id === formData.enquiryId);
      const engineer = profiles.find(p => p.id === formData.engineerId);

      if (client) {
        const formattedDate = new Date(isoDateTime).toLocaleDateString();
        const formattedTime = formData.time;

        const parseText = (txt: string) => {
          return txt
            .replace(/{clientName}/g, client.clientName)
            .replace(/{location}/g, client.location || 'site')
            .replace(/{date}/g, formattedDate)
            .replace(/{time}/g, formattedTime)
            .replace(/{staffName}/g, engineer ? engineer.fullName : 'Senior Site Engineer');
        };

        const emailSubject = parseText(activeTmpl.subject);
        const emailBody = parseText(activeTmpl.body);

        sendEmail({
          enquiryId: client.id,
          recipientEmail: client.email,
          subject: emailSubject,
          body: emailBody,
          emailType: 'Site Visit Confirmation'
        }).then(res => {
          if (res.success) {
            console.log('[SiteVisitScheduler] Site visit confirmation email sent successfully.');
          } else {
            console.error('[SiteVisitScheduler] Failed to send site visit confirmation email:', res.errorMessage);
          }
        }).catch(err => {
          console.error('[SiteVisitScheduler] Error dispatching site visit confirmation email:', err);
        });
      }

      setIsScheduleOpen(false);
      // Reset form
      setFormData({ enquiryId: '', time: '10:00', engineerId: defaultEngineerId, notes: '' });
      addToast('Site Visit Booked', `${engineerProfile.fullName} assigned successfully.`, 'success');
    } catch (err: any) {
      console.error('[SiteVisitScheduler] createSiteVisit failed:', err);
      addToast('Booking failed', err?.message || 'Check client record connection.', 'error');
    }
  };

  // Reschedule Form Submit
  const handleRescheduleSubmit = async (e: React.FormEvent, newStatus?: VisitStatus) => {
    e.preventDefault();
    if (!selectedVisit) return;

    try {
      const updates: Partial<SiteVisit> = {
        notes: selectedVisit.notes,
        engineerId: editEngineerId // Save updated engineer ID
      };
      if (newStatus) {
        updates.status = newStatus;
      }
      
      await updateSiteVisit(selectedVisit.id, updates);
      setIsRescheduleOpen(false);
      setSelectedVisit(null);
      addToast('Inspection logs updated', `Status/notes modified successfully.`, 'success');
    } catch (err: any) {
      console.error('[SiteVisitScheduler] updateSiteVisit failed:', err);
      addToast('Failed to update visit', err?.message || 'Please try again.', 'error');
    }
  };
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4A65A]/15 pb-4">
        <div>
          <span className="text-xxs tracking-widest text-[#8B7355] uppercase font-semibold font-display">inspections center</span>
          <h1 className="text-3xl serif-editorial font-medium text-luxe-primary tracking-tight mt-1">Inspections Scheduler</h1>
        </div>
        <Button onClick={() => handleDayClick(new Date().getDate())} className="flex items-center gap-1.5 cursor-pointer">
          <Plus className="h-4 w-4" /> Book Inspection
        </Button>
      </div>

      {/* Calendar Header Control */}
      <div className="flex items-center justify-between glass-premium-light px-5 py-4 rounded-2xl shadow-soft-luxe">
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-[#D4A65A]" />
          <h2 className="text-sm font-semibold text-luxe-secondary tracking-wider uppercase">{monthName}</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-1.5 rounded-lg bg-[#141414]/60 border border-white/5 text-slate-400 cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg bg-[#141414]/60 border border-white/5 text-slate-400 cursor-not-allowed">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="border border-[#D4A65A]/15 rounded-3xl overflow-hidden glass-premium-light shadow-soft-luxe">
        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-px border-b border-[#D4A65A]/15 bg-[#141414]/80">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="py-3 text-center text-[#E6C27A] text-[10px] font-display font-semibold tracking-wider uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#D4A65A]/10">
          {calendarDays.map((cell, idx) => {
            const dayVisits = cell.day ? visitsByDate[cell.dateString] || [] : [];
            const hasVisits = dayVisits.length > 0;
            
            return (
              <div
                key={idx}
                className={`bg-[#141414]/40 min-h-[120px] p-2.5 flex flex-col justify-between transition-colors relative group ${
                  cell.day ? 'hover:bg-[#D4A65A]/10 cursor-pointer' : 'opacity-10 pointer-events-none'
                }`}
                onClick={() => cell.day && handleDayClick(cell.day)}
              >
                {/* Day Marker */}
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-mono font-medium ${
                    hasVisits ? 'text-[#C76B4F] font-bold' : 'text-slate-400 group-hover:text-luxe-primary'
                  }`}>
                    {cell.day}
                  </span>
                  {cell.day && (
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded bg-[#141414]/60 border border-white/5">
                      <Plus className="h-3 w-3 text-slate-400 hover:text-luxe-primary" />
                    </span>
                  )}
                </div>

                {/* Scheduled list inside day */}
                <div className="mt-2.5 flex-grow space-y-1.5 overflow-y-auto max-h-24 scrollbar-none">
                  {dayVisits.map(visit => {
                    const client = enquiries.find(e => e.id === visit.enquiryId);
                    return (
                      <div
                        key={visit.id}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent modal scheduling trigger
                          setSelectedVisit(visit);
                          setIsRescheduleOpen(true);
                        }}
                        className={`p-1.5 rounded-lg text-[9px] border font-display transition-all duration-300 ${
                          visit.status === 'Completed'
                            ? 'bg-[#4E7A65]/10 text-[#4E7A65] border-[#4E7A65]/20'
                            : visit.status === 'Cancelled'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-[#D4A65A]/10 text-[#8B7355] border-[#D4A65A]/25 hover:border-[#D4A65A]/50'
                        }`}
                      >
                        <div className="font-semibold truncate">{client?.clientName || 'Unknown Client'}</div>
                        <div className="text-[8.5px] text-[#D4A65A] font-semibold truncate mt-0.5">Eng: {getEngineerName(visit.engineerId)}</div>
                        <div className="text-[7.5px] opacity-75 truncate mt-0.5">{visit.notes || 'Routine Sourcing'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: SCHEDULE VISIT */}
      <Modal isOpen={isScheduleOpen} onClose={() => setIsScheduleOpen(false)} title={`Book Inspection - June ${selectedDay}, 2026`}>
        <form onSubmit={handleScheduleSubmit} className="space-y-4 font-display">
          <div>
            <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Link client enquiry *</label>
            <select
              required
              className="w-full glass-input-premium-light text-xs cursor-pointer"
              value={formData.enquiryId}
              onChange={e => setFormData({ ...formData, enquiryId: e.target.value })}
            >
              <option value="" disabled>Choose client...</option>
              {enquiries
                .filter(e => e.status !== 'Confirmed' && e.status !== 'Lost')
                .map(e => (
                  <option key={e.id} value={e.id}>{e.clientName} ({e.projectType})</option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Time of visit</label>
              <input
                type="time"
                className="w-full glass-input-premium-light text-xs"
                value={formData.time}
                onChange={e => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Assigned Engineer *</label>
              <TeamSelector
                profiles={profiles}
                selectedId={formData.engineerId}
                onChange={id => setFormData({ ...formData, engineerId: id })}
                placeholder="Select engineer to assign..."
              />
              {formData.engineerId && (
                <div className="mt-3">
                  <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Engineer Profile Preview</span>
                  <ProfileCard profile={profiles.find(p => p.id === formData.engineerId)} />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Directives & Notes</label>
            <textarea
              rows={3}
              placeholder="Laser measurements, lighting testing, structural inspections..."
              className="w-full glass-input-premium-light text-xs resize-none"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" type="button" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
            <Button variant="gold" type="submit">Schedule Visit</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: DETAIL VIEW/EDIT */}
      <Modal isOpen={isRescheduleOpen} onClose={() => { setIsRescheduleOpen(false); setSelectedVisit(null); }} title="Review Site Inspection">
        {selectedVisit && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-5 font-display">
            <div className="p-4 bg-luxury-bg-sec/50 rounded-2xl border border-white/5 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded bg-[#D4A65A]/10 border border-white/5"><User className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                <div>
                  <span className="text-[9px] text-[#8B7355] uppercase block font-mono">Client Account</span>
                  <span className="text-luxe-label font-semibold block mt-0.5">
                    {enquiries.find(e => e.id === selectedVisit.enquiryId)?.clientName || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#D4A65A]/10 border border-white/5"><Clock className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                  <div>
                    <span className="text-[9px] text-[#8B7355] uppercase block font-mono">Scheduled At</span>
                    <span className="text-luxe-label block mt-0.5 font-mono">
                      {new Date(selectedVisit.scheduledAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-grow">
                  <span className="p-1 rounded bg-[#D4A65A]/10 border border-white/5"><MapPin className="h-3.5 w-3.5 text-[#D4A65A]" /></span>
                  <div className="flex-grow space-y-2">
                    <span className="text-[9px] text-[#8B7355] uppercase block font-mono">Assigned Engineer *</span>
                    <TeamSelector
                      profiles={profiles}
                      selectedId={editEngineerId}
                      onChange={id => setEditEngineerId(id)}
                      placeholder="Select engineer..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {editEngineerId && (
              <div className="mt-3">
                <span className="text-[9px] text-[#8B7355] uppercase font-mono tracking-wider font-semibold block mb-1">Engineer Profile Details</span>
                <ProfileCard profile={profiles.find(p => p.id === editEngineerId)} />
              </div>
            )}

            <div>
              <label className="block text-xxs text-[#8B7355] mb-1 font-mono uppercase font-semibold">Directives & Findings</label>
              <textarea
                rows={3}
                className="w-full glass-input-premium-light text-xs resize-none"
                value={selectedVisit.notes || ''}
                onChange={e => setSelectedVisit({ ...selectedVisit, notes: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-between pt-2 border-t border-white/5 mt-4">
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="glass" 
                  className="flex items-center gap-1.5 text-[#4E7A65] hover:bg-[#4E7A65]/10 cursor-pointer"
                  onClick={(e) => handleRescheduleSubmit(e, 'Completed')}
                >
                  <Check className="h-3.5 w-3.5" /> Complete Visit
                </Button>
                <Button 
                  type="button" 
                  variant="danger" 
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={(e) => handleRescheduleSubmit(e, 'Cancelled')}
                >
                  Cancel Visit
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" type="button" onClick={() => { setIsRescheduleOpen(false); setSelectedVisit(null); }}>Discard</Button>
                <Button variant="gold" type="submit">Save notes</Button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default SiteVisitScheduler;
