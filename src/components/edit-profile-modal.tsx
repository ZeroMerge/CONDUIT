"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { 
  X, RefreshCw, Loader2, Save, Sparkles, 
  User, Link as LinkIcon, Twitter, Github, MapPin, 
  FileText, Building2, Plus, Trash2, Search, Check,
  Workflow, Linkedin, Youtube, Instagram, Globe
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useUserStore } from '@/lib/stores/user'
import { Avatar } from '@/components/avatar'
import { AvatarColorPicker } from '@/components/avatar-color-picker'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import type { Profile, Flow } from '@/types'
import { cn } from '@/lib/utils'

interface EditProfileModalProps {
  profile: Profile
  onClose: () => void
}

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const router = useRouter()
  const { setProfile } = useUserStore()
  
  // Basic Info
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [seed, setSeed] = useState(profile.avatar_seed)
  const [bgColor, setBgColor] = useState(profile.avatar_bg_color || 'transparent')
  const [location, setLocation] = useState(profile.location || '')
  const [company, setCompany] = useState(profile.company || '')
  const [website, setWebsite] = useState(profile.website_url || '')
  const [readme, setReadme] = useState(profile.readme_markdown || '')
  
  // Dynamic Socials
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>(
    Array.isArray(profile.social_links) ? profile.social_links : []
  )
  const [newSocialUrl, setNewSocialUrl] = useState('')

  // Pinned Flows
  const [pinnedIds, setPinnedIds] = useState<string[]>(
    Array.isArray(profile.pinned_flow_ids) ? profile.pinned_flow_ids : []
  )
  const [userFlows, setUserFlows] = useState<Flow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fetchingFlows, setFetchingFlows] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'identity' | 'socials' | 'pins'>( 'identity')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchFlows() {
      setFetchingFlows(true)
      const { data } = await supabase
        .from('flows')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
      if (data) setUserFlows(data)
      setFetchingFlows(false)
    }
    fetchFlows()
  }, [profile.id])

  const strength = Math.round(
    ((fullName.length > 0 ? 10 : 0) +
     (bio.length > 0 ? 15 : 0) + 
     (location.length > 0 ? 5 : 0) + 
     (company.length > 0 ? 5 : 0) + 
     (website.length > 0 ? 10 : 0) + 
     (socials.length > 0 ? 15 : 0) + 
     (pinnedIds.length > 0 ? 10 : 0) + 
     (readme.length > 0 ? 30 : 0))
  )

  const handleShuffle = () => {
    setSeed(crypto.randomUUID())
  }

  const addSocial = () => {
    if (!newSocialUrl) return
    if (socials.length >= 4) {
      toast.error('Maximum 4 social links allowed')
      return
    }
    setSocials([...socials, { platform: 'Link', url: newSocialUrl }])
    setNewSocialUrl('')
  }

  const removeSocial = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index))
  }

  const togglePin = (flowId: string) => {
    if (pinnedIds.includes(flowId)) {
      setPinnedIds(pinnedIds.filter(id => id !== flowId))
    } else {
      if (pinnedIds.length >= 6) {
        toast.error('Maximum 6 pins allowed')
        return
      }
      setPinnedIds([...pinnedIds, flowId])
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('Not authenticated')

      const updates = {
        full_name: fullName.trim() || null,
        bio: bio.trim() || null,
        avatar_seed: seed,
        avatar_bg_color: bgColor,
        location: location.trim() || null,
        company: company.trim() || null,
        website_url: website.trim() || null,
        readme_markdown: readme.trim() || null,
        social_links: socials,
        pinned_flow_ids: pinnedIds,
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      setProfile({ ...profile, ...updates } as any)

      if (strength >= 100) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        })
        toast.success(`Profile Master!`, {
          description: "All fields are now complete. You've reached maximum builder status.",
          icon: <Sparkles className="h-4 w-4 text-emerald-500" />
        })
      } else {
        toast.success('Identity Updated!', {
          description: `Profile ${strength}% complete. Great progress!`,
        })
      }

      router.refresh()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const filteredFlows = userFlows.filter(f => 
    f.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-6 md:p-10 overflow-hidden selection:bg-[var(--accent)]/30">
      {/* Backdrop with theme-aware blur */}
      <div 
        className="absolute inset-0 bg-white/95 dark:bg-black/90 backdrop-blur-2xl transition-all duration-500 animate-in fade-in sm:rounded-[6px]"
        onClick={onClose}
      />

      <div className="relative w-full h-full sm:h-auto sm:w-[95vw] md:w-[85vw] lg:w-[75vw] max-w-4xl bg-[var(--bg-primary)] border-0 sm:border border-[var(--border)] rounded-none sm:rounded-[6px] shadow-2xl flex flex-col sm:max-h-[90vh] overflow-hidden animate-scale-in">
        
        {/* Fixed Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
          <div className="flex items-center gap-6">
             <div className="p-2 bg-[var(--bg-tertiary)] rounded-[6px] border border-[var(--border)]">
               <User className="h-4 w-4 text-[var(--accent)]" />
             </div>
             <div>
               <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-primary)] leading-none mb-1">Identity Builder</h2>
               <p className="text-[10px] font-bold text-[var(--text-tertiary)] opacity-60">Level Up Your Character</p>
             </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-secondary)] rounded-[6px] transition-all text-[var(--text-tertiary)] active:rotate-90 border border-[var(--border)] sm:border-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="shrink-0 flex gap-2 px-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30 overflow-x-auto no-scrollbar">
          {[
            { id: 'identity', label: 'Identity', icon: User },
            { id: 'socials', label: 'Socials', icon: LinkIcon },
            { id: 'pins', label: 'Showcase', icon: Workflow },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5" 
                  : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]/50"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Area */}
        <form 
          id="profile-edit-form"
          onSubmit={handleSave} 
          className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-10 custom-scrollbar"
        >
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">
            {/* Sidebar: Identity Shuffle (Sticky Layout) */}
            <div className="md:col-span-4 lg:col-span-3 space-y-8 h-fit">
               <div className="flex flex-col items-center gap-6">
                <div className="relative group/identity shrink-0">
                  <div className="absolute inset-0 bg-[var(--accent)] opacity-10 rounded-full blur-2xl group-hover/identity:opacity-20 transition-opacity" />
                  <Avatar seed={seed} size={200} bg_color={bgColor} className="w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] rounded-full border-[2px] border-[var(--border)] shadow-2xl relative z-10 transition-transform duration-500 group-hover/identity:scale-[1.02]" />
                    <button
                      type="button"
                      onClick={handleShuffle}
                      className="absolute -bottom-2 -right-2 z-20 bg-[var(--accent)] text-white p-2.5 rounded-[6px] shadow-2xl hover:scale-110 active:scale-95 transition-all outline-none border-[1.5px] border-[var(--bg-primary)] group/btn"
                      title="Generate New Soul"
                    >
                      <RefreshCw className="h-4 w-4 group-active/btn:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                <div className="w-full space-y-6 pt-2">
                  <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] pl-1">Identity Hue</p>
                    <AvatarColorPicker currentValue={bgColor} onSelect={setBgColor} />
                  </div>

                  <div className="pt-6 border-t border-[var(--border)] relative overflow-hidden group/strength">
                    <div className="flex justify-between items-center mb-2.5 px-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Character Score</span>
                      <span className={cn("text-[10px] font-black transition-colors", strength === 100 ? 'text-emerald-500' : 'text-[var(--accent)]')}>{strength}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden shadow-inner border border-[var(--border)]">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          strength < 40 ? 'bg-rose-500' :
                          strength < 70 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        )}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2 justify-center py-1.5 px-3 bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)]">
                       <Sparkles className="h-3 w-3 text-amber-500" />
                       <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Growth Potential Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB CONTENT: High Density */}
            <div className="md:col-span-8 lg:col-span-9">
              {activeTab === 'identity' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                        <User className="h-3 w-3" /> Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:font-medium placeholder:opacity-30"
                        placeholder="John Architect"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                        <MapPin className="h-3 w-3" /> Base Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium placeholder:opacity-30"
                        placeholder="San Francisco, CA"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                      <Building2 className="h-3 w-3" /> Organization
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium placeholder:opacity-30"
                      placeholder="Conduit Labs"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-0.5">
                       <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">Personal Tagline</label>
                       <span className="text-[8px] font-bold text-[var(--text-tertiary)]">{bio.length}/160</span>
                    </div>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[70px] resize-none font-medium leading-relaxed placeholder:opacity-30"
                      placeholder="Crafting distributed systems for the next decade..."
                      maxLength={160}
                    />
                  </div>

                  <div className="space-y-2 pt-2">
                     <label className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                       <span className="flex items-center gap-2"><Globe className="h-3 w-3" /> Professional Resume Link</span>
                     </label>
                     <div className="relative group/input">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-[var(--bg-tertiary)] rounded-[6px] border border-[var(--border)] group-focus-within/input:border-[var(--accent)]/50 transition-colors">
                           <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
                        </div>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] pl-14 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:opacity-30"
                          placeholder="https://identity.conduit.com"
                        />
                     </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <div className="flex items-center justify-between pb-1">
                       <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] opacity-60">
                         <FileText className="h-3 w-3" /> Identity Documentation (README)
                       </label>
                       <div className="px-2 py-0.5 rounded-[6px] bg-amber-500/10 border border-amber-500/20 text-[7px] font-black uppercase text-amber-500">30% Energy Gain</div>
                    </div>
                    <div className="border border-[var(--border)] rounded-[6px] overflow-hidden bg-[var(--bg-tertiary)]/30 group-within:border-[var(--accent)]/50 transition-all">
                       <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
                          <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">Markdown Editor</span>
                       </div>
                       <textarea
                         value={readme}
                         onChange={(e) => setReadme(e.target.value)}
                         className="w-full bg-transparent p-4 text-sm font-mono text-[var(--text-primary)] focus:outline-none min-h-[140px] resize-y leading-relaxed placeholder:opacity-20"
                         placeholder="# Architect Profile\n\nI build verified systems using Conduit..."
                       />
                    </div>
                    <p className="text-[8px] text-[var(--text-tertiary)] font-bold italic uppercase tracking-tight pl-1">This document serves as the high-level briefing for your profile overview.</p>
                  </div>
                </div>
              )}

              {activeTab === 'socials' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="bg-[var(--bg-tertiary)]/30 border border-[var(--border)] rounded-[6px] p-4 sm:p-5 space-y-4">
                     <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.1em] opacity-80 leading-relaxed">
                       Integrate Third-Party Signal Channels (Max 4)
                     </p>
                     
                     <div className="flex gap-2">
                       <div className="relative flex-1 group/soc">
                         <div className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-30 group-focus-within/soc:opacity-100 transition-opacity">
                            <Plus className="h-3.5 w-3.5" />
                         </div>
                         <input
                           type="text"
                           value={newSocialUrl}
                           onChange={(e) => setNewSocialUrl(e.target.value)}
                           placeholder="https://x.com/username"
                           className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                           onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSocial())}
                         />
                       </div>
                       <button
                         type="button"
                         onClick={addSocial}
                         className="px-6 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[10px] font-black uppercase tracking-widest rounded-[6px] transition-all flex items-center justify-center shadow-lg shadow-[var(--accent)]/10"
                       >
                         Link
                       </button>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {socials.map((social, index) => {
                      const lower = social.url.toLowerCase()
                      let Icon = LinkIcon
                      let label = 'Channel'
                      let color = 'text-[var(--text-tertiary)]'
                      
                      if (lower.includes('twitter.com') || lower.includes('x.com')) { Icon = Twitter; label = 'X'; color = 'text-sky-500' }
                      else if (lower.includes('github.com')) { Icon = Github; label = 'GitHub'; color = 'text-white' }
                      else if (lower.includes('linkedin.com')) { Icon = Linkedin; label = 'LinkedIn'; color = 'text-blue-600' }
                      else if (lower.includes('youtube.com')) { Icon = Youtube; label = 'YouTube'; color = 'text-red-500' }
                      else if (lower.includes('instagram.com')) { Icon = Instagram; label = 'Instagram'; color = 'text-pink-500' }

                      return (
                        <div key={index} className="flex items-center justify-between p-3.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] hover:border-[var(--accent)]/40 transition-all group/s overflow-hidden relative">
                          <div className="flex items-center gap-3.5 overflow-hidden">
                             <div className={cn("p-2 bg-[var(--bg-tertiary)] rounded-[6px] border border-[var(--border)] shrink-0", color)}>
                               <Icon className="h-3.5 w-3.5" />
                             </div>
                             <div className="overflow-hidden">
                               <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-primary)] leading-none mb-1">{label}</p>
                               <p className="text-[9px] font-bold text-[var(--text-tertiary)] truncate tracking-tight">{social.url.replace(/^https?:\/\//, '')}</p>
                             </div>
                          </div>
                            <button
                              type="button"
                              onClick={() => removeSocial(index)}
                              className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-tertiary)] rounded-[6px] transition-all opacity-0 group-hover/s:opacity-100"
                              title="Unlink"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                      )
                    })}
                    {socials.length === 0 && (
                      <div className="col-span-full py-10 border border-dashed border-[var(--border)] rounded-[6px] flex flex-col items-center justify-center opacity-20 group/empty hover:opacity-40 transition-opacity">
                         <Workflow className="h-6 w-6 mb-2 group-hover/empty:animate-bounce" />
                         <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">Signal Registry Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'pins' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full max-h-[500px]">
                  <div className="space-y-4 shrink-0">
                    <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.1em] leading-relaxed opacity-80">
                       Featured Architectures (Showcase {pinnedIds.length}/6)
                    </p>
                    
                    <div className="relative group/search">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)] group-focus-within/search:text-[var(--accent)] transition-colors" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter systems by title or category..."
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[6px] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar min-h-0">
                    {fetchingFlows ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Syncing Architectures...</span>
                      </div>
                    ) : filteredFlows.map(flow => {
                      const isPinned = pinnedIds.includes(flow.id)
                      return (
                        <div 
                          key={flow.id}
                          onClick={() => togglePin(flow.id)}
                          className={cn(
                            "flex items-center justify-between p-3.5 rounded-[6px] border transition-all cursor-pointer group/pin relative overflow-hidden",
                            isPinned 
                              ? "bg-[var(--bg-tertiary)]/50 border-[var(--accent)]/50 shadow-sm" 
                              : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--text-tertiary)]"
                          )}
                        >
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={cn(
                              "w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all",
                              isPinned ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--bg-primary)] group-hover/pin:border-[var(--accent)]"
                            )}>
                               {isPinned && <Check className="h-3 w-3" strokeWidth={3} />}
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-[var(--text-primary)] leading-none mb-1.5 group-hover/pin:text-[var(--accent)] transition-colors">{flow.title}</p>
                               <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">{flow.category || 'System Architecture'}</p>
                            </div>
                          </div>
                          {isPinned && <div className="absolute top-0 right-0 h-full w-1 bg-[var(--accent)]" />}
                          {!isPinned && pinnedIds.length >= 6 && <div className="absolute inset-0 bg-[var(--bg-primary)]/50 cursor-not-allowed" />}
                        </div>
                      )
                    })}
                    {!fetchingFlows && filteredFlows.length === 0 && (
                       <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-[8px] opacity-30">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No deployments found</p>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Fixed Footer Action Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--bg-primary)]/90 backdrop-blur-sm flex flex-col-reverse sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            DISCARD
          </button>
          
          <button
            type="submit"
            form="profile-edit-form"
            disabled={loading}
            className="w-full sm:w-auto sm:min-w-[200px] flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest py-3 sm:py-2.5 px-6 rounded-[6px] transition-all shadow-lg shadow-[var(--accent)]/10 active:scale-[0.98]"
          >
            {loading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                COMMIT IDENTITY CHANGES
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
