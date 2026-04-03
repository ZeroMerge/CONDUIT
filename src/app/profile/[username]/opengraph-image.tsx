import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Conduit User Profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { username: string } }) {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', params.username)
    .single() as { data: any }

  if (!profile) return new ImageResponse(<div style={{ background: 'black', color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Profile Not Found</div>)

  const level = Math.floor((profile.total_xp || 0) / 200) + 1
  const hoursSaved = Math.round((profile.total_time_saved_minutes || 0) / 60)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #050505, #111)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          color: 'white',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Abstract Background Shapes */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: '400px', height: '400px', background: 'radial-gradient(circle, #10B98122 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -150, left: -150, width: '500px', height: '500px', background: 'radial-gradient(circle, #3B82F611 0%, transparent 70%)', borderRadius: '50%' }} />

        {/* Verified Status Badge */}
        {profile.is_verified && (
            <div style={{ position: 'absolute', top: 40, right: 40, border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px 24px', borderRadius: '100px', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>VERIFIED AUTHORITY</span>
            </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '60px', zIndex: 10 }}>
            {/* Avatar Circle */}
            <div style={{ position: 'relative', display: 'flex' }}>
                <img 
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${profile.avatar_seed}`} 
                    style={{ width: '220px', height: '220px', borderRadius: '110px', border: '5px solid #111', boxShadow: '0 0 40px rgba(16,185,129,0.3)' }} 
                />
                <div style={{ position: 'absolute', bottom: 10, right: 10, background: '#10B981', color: 'white', width: '60px', height: '60px', borderRadius: '30px', border: '4px solid #111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900' }}>
                    {level}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '10px' }}>
                    {profile.username}
                </div>
                <div style={{ fontSize: '32px', color: '#888', fontWeight: '500', marginBottom: '30px' }}>
                    Level {level} AI Workflow Expert
                </div>

                {/* Stat Grid */}
                <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>XP Earned</span>
                        <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{(profile.total_xp || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Time Saved</span>
                        <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{hoursSaved}h</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.05)', padding: '20px 30px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span style={{ fontSize: '14px', color: '#666', textTransform: 'uppercase', marginBottom: '5px' }}>Streak</span>
                        <span style={{ fontSize: '32px', fontWeight: 'bold' }}>{profile.current_streak} days</span>
                    </div>
                </div>
            </div>
        </div>

        <div style={{ position: 'absolute', bottom: 40, opacity: 0.4, fontSize: '16px', fontWeight: 'bold', letterSpacing: '2px' }}>
            CONDUIT / PROOF OF EFFICIENCY
        </div>
      </div>
    ),
    { ...size }
  )
}
