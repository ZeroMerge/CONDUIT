import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Conduit Flow Preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: flow } = await supabase
    .from('flows')
    .select('*, creator:profiles(*)')
    .eq('id', params.id)
    .single() as { data: any }

  if (!flow) return new ImageResponse(<div>Flow Not Found</div>)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #000, #111)',
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
        {/* Subtle Grid Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 2px 2px, #333 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* Floating Verified Badge (if applicable) */}
        {flow.creator?.is_verified && (
            <div style={{ position: 'absolute', top: 40, right: 40, background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '40px', fontSize: '20px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                <span>✓ Verified Creator</span>
            </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>
                Conduit AI Workflow
            </div>
            
            <div style={{ fontSize: '84px', fontWeight: '900', textAlign: 'center', lineHeight: 1.1, maxWidth: '900px', marginBottom: '40px' }}>
                {flow.title}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '24px 48px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <img 
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${flow.creator?.avatar_seed}`} 
                    style={{ width: '80px', height: '80px', borderRadius: '40px', border: '2px solid #10B981' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '32px', fontWeight: '600' }}>{flow.creator?.username}</span>
                    <span style={{ fontSize: '20px', color: '#888' }}>{flow.completion_count} successful runs</span>
                </div>
            </div>
        </div>

        {/* Global ROI Ticker in OG */}
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', color: '#555', fontSize: '18px', fontWeight: '500' }}>
            CONDUIT — THE GLOBAL AUTHORITY FOR AI EFFICIENCY
        </div>
      </div>
    ),
    { ...size }
  )
}