import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Fallback values if parameters are missing
    const title = searchParams.get('title')?.slice(0, 60) || 'Conduit Workflow'
    const username = searchParams.get('username') || 'anonymous'
    const successRate = searchParams.get('successRate') || '0'
    
    const numericSuccess = parseInt(successRate, 10)
    const isVerified = numericSuccess >= 85

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#0a0a0a', // Dark theme background
            backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            padding: '80px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Top Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#10b981', borderRadius: '8px' }}></div>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#e5e5e5' }}>Conduit</span>
            </div>
            
            {/* Conditional Verified Badge */}
            {isVerified && (
              <div style={{ display: 'none', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '50px' }}>
                <span style={{ fontSize: '24px', color: '#10b981', fontWeight: 600 }}>✓ Verified Builder</span>
              </div>
            )}
            {/* Satori hack: flex + gap can be tricky, using explicit display for the badge */}
            {isVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', borderRadius: '50px' }}>
                <span style={{ fontSize: '24px', color: '#10b981', fontWeight: 600 }}>✓ Verified Builder</span>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
            <h1 style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff', lineHeight: 1.1, margin: 0 }}>
              {title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '32px', color: '#a3a3a3' }}>Built by</span>
              <span style={{ fontSize: '32px', fontWeight: 600, color: '#10b981' }}>@{username}</span>
            </div>
          </div>

          {/* Bottom Stats */}
          <div style={{ display: 'flex', gap: '48px', borderTop: '2px solid #333', paddingTop: '40px', width: '100%' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', color: '#a3a3a3' }}>Success Rate</span>
              <span style={{ fontSize: '48px', fontWeight: 700, color: '#ffffff' }}>{successRate}%</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '24px', color: '#a3a3a3' }}>Platform</span>
              <span style={{ fontSize: '48px', fontWeight: 700, color: '#ffffff' }}>Conduit AI</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Failed to generate image: ${e.message}`)
    return new Response(`Failed to generate image`, {
      status: 500,
    })
  }
}
