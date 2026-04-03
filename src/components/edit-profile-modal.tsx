"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  X, RefreshCw, Loader2, Save, Sparkles, 
  User, Link as LinkIcon, Twitter, Github, MapPin, 
  FileText, Building2, Plus, Trash2, Search, Check,
  Workflow
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
  const [socials, setSocials] = useState<{ platform: string; url: string }[]>(profile.social_links || [])
  const [newSocialUrl, setNewSocialUrl] = useState('')

  // Pinned Flows
  const [pinnedIds, setPinnedIds] = useState<string[]>(profile.pinned_flow_ids || [])
  const [userFlows, setUserFlows] = useState<Flow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [fetchingFlows, setFetchingFlows] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'identity' | 'socials' | 'pins'>( 'identity')

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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-[var(--bg-primary)] border border-[var(--border)] rounded-[6px] w-full max-w-4xl my-auto shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent)] text-white rounded-[6px]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-[var(--text-primary)]">Identity Builder</h2>
              <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Build your verified profile</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[var(--bg-tertiary)] rounded-[4px] text-[var(--text-tertiary)] transition-colors border border-[var(--border)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)]/30 px-6">
          {[
            { id: 'identity', label: 'Basic Info', icon: User },
            { id: 'socials', label: 'Social Accounts', icon: LinkIcon },
            { id: 'pins', label: 'Pinned Flows', icon: Workflow },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all",
                activeTab === tab.id 
                  ? "border-[var(--accent)] text-[var(--text-primary)]" 
                  : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            {/* Sidebar: Avatar & Strength (Always Visible) */}
            <div className="md:col-span-4 space-y-10">
               <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <Avatar seed={seed} size={140} bg_color={bgColor} className="shadow-2xl" />
                  <button
                    type="button"
                    onClick={handleShuffle}
                    className="absolute -bottom-2 -right-2 bg-[var(--accent)] text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all outline-none border-2 border-[var(--bg-primary)]"
                    title="Shuffle Robot"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="w-full space-y-6">
                  <div className="text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-3">Identity Color</p>
                    <AvatarColorPicker currentValue={bgColor} onSelect={setBgColor} />
                  </div>

                  <div className="pt-6 border-t border-[var(--border)]">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Strength</span>
                      <span className="text-[10px] font-black text-[var(--accent)]">{strength}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--accent-rgb),0.3)] ${
                          strength < 40 ? 'bg-rose-500' :
                          strength < 70 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${strength}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-center mt-3 text-[var(--text-tertiary)] font-bold uppercase tracking-widest italic">Character Completion</p>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB CONTENT */}
            <div className="md:col-span-8">
              {activeTab === 'identity' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                      <User className="h-3 w-3" /> Display Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-bold placeholder:font-medium"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                        <MapPin className="h-3 w-3" /> Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                        placeholder="e.g. Lagos, Nigeria / Remote"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                        <Building2 className="h-3 w-3" /> Company
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all font-medium"
                        placeholder="e.g. Conduit Labs"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[80px] resize-none font-medium leading-relaxed"
                      placeholder="A brief tagline about your work..."
                      maxLength={160}
                    />
                    <p className="text-[9px] text-[var(--text-tertiary)] text-right font-bold tracking-widest">{bio.length} / 160</p>
                  </div>

                  <div className="space-y-3">
                     <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                       <LinkIcon className="h-3 w-3" /> Website
                     </label>
                     <input
                       type="url"
                       value={website}
                       onChange={(e) => setWebsite(e.target.value)}
                       className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                       placeholder="https://yourpage.com"
                     />
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                      <FileText className="h-3 w-3" /> Profile README (Markdown)
                    </label>
                    <textarea
                      value={readme}
                      onChange={(e) => setReadme(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] p-4 text-sm font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] min-h-[160px] resize-y leading-relaxed"
                      placeholder="# Hey there 👋 I'm [Username]..."
                    />
                    <p className="text-[9px] text-[var(--text-tertiary)] font-bold italic uppercase tracking-tighter">This content will be featured prominently on your profile 'Overview'.</p>
                  </div>
                </div>
              )}

              {activeTab === 'socials' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-[var(--text-tertiary)] leading-relaxed uppercase tracking-widest">
                       Link your social accounts to your profile. Up to 4 links.
                     </p>
                     
                     <div className="flex gap-3">
                       <input
                         type="text"
                         value={newSocialUrl}
                         onChange={(e) => setNewSocialUrl(e.target.value)}
                         placeholder="Paste link to social profile (X, LinkedIn, etc.)"
                         className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                         onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSocial())}
                       />
                       <button
                         type="button"
                         onClick={addSocial}
                         className="px-6 bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] rounded-[6px] transition-all flex items-center justify-center"
                       >
                         <Plus className="h-4 w-4" />
                       </button>
                     </div>
                  </div>

                  <div className="space-y-3">
                    {socials.map((social, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] group/social">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className="p-2 bg-[var(--bg-secondary)] rounded-[6px] border border-[var(--border)]">
                             <LinkIcon className="h-3.5 w-3.5 text-[var(--accent)]" />
                           </div>
                           <span className="text-xs font-bold text-[var(--text-secondary)] truncate">{social.url}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSocial(index)}
                          className="p-1.5 hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-tertiary)] rounded-[4px] transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    {socials.length === 0 && (
                      <div className="py-12 border border-dashed border-[var(--border)] rounded-[6px] flex flex-col items-center justify-center opacity-40">
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No social links added</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'pins' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 flex flex-col h-full max-h-[500px]">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] leading-relaxed uppercase tracking-widest">
                       Select up to six public workflows you&apos;d like to show to anyone. {6 - pinnedIds.length} remaining.
                    </p>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter systems..."
                        className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-[6px] pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {fetchingFlows ? (
                      <div className="flex justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                      </div>
                    ) : filteredFlows.map(flow => {
                      const isPinned = pinnedIds.includes(flow.id)
                      return (
                        <div 
                          key={flow.id}
                          onClick={() => togglePin(flow.id)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-[6px] border transition-all cursor-pointer group/pin",
                            isPinned 
                              ? "bg-[var(--accent)]/5 border-[var(--accent)]/30" 
                              : "bg-[var(--bg-tertiary)] border-[var(--border)] hover:border-[var(--text-tertiary)]"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-5 h-5 rounded-[4px] border flex items-center justify-center transition-all",
                              isPinned ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border)] bg-[var(--bg-primary)] group-hover/pin:border-[var(--accent)]"
                            )}>
                              {isPinned && <Check className="h-3 w-3" />}
                            </div>
                            <div>
                               <p className="text-[11px] font-black text-[var(--text-primary)] leading-none mb-1.5">{flow.title}</p>
                               <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">{flow.category || 'System'}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black text-[var(--text-tertiary)]">Builder Choice</span>
                        </div>
                      )
                    })}
                    {!fetchingFlows && filteredFlows.length === 0 && (
                       <div className="py-12 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">No systems found</p>
                       </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t border-[var(--border)] bg-[var(--bg-secondary)]/50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-8 py-3 text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black uppercase tracking-widest py-3.5 rounded-[6px] transition-all shadow-xl shadow-[var(--accent)]/10 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Identity...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Confirm Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
