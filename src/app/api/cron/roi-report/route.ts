import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Secure the endpoint: check for the CRON_SECRET and matching Authorization header.
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // 2. Fetch Global Stats
    const { data: profiles } = await supabase.from('profiles').select('total_time_saved_minutes');
    const totalTimeSaved = profiles?.reduce((sum, p) => sum + (p.total_time_saved_minutes || 0), 0) || 0;

    const { count: totalCompletions } = await supabase.from('completions').select('*', { count: 'exact', head: true });

    // 3. Weekly Stats (Last 7 days)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const { count: weeklyCompletions } = await supabase
      .from('completions')
      .select('*', { count: 'exact', head: true })
      .gte('completed_at', lastWeek.toISOString());

    // 4. Trending Flows (Top 3 by completions this week)
    const { data: trendingFlows } = await supabase
      .from('flows')
      .select('title, category, completion_count')
      .order('completion_count', { ascending: false })
      .limit(3);

    // 5. Send Email via Resend
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@conduit.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `📊 Conduit Weekly ROI Report — ${new Date().toLocaleDateString()}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
          <h1 style="font-size: 24px; font-weight: bold; border-bottom: 2px solid #eee; padding-bottom: 10px;">Conduit Platform Stats</h1>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <p style="font-size: 12px; color: #666; text-transform: uppercase;">Total Time Saved</p>
              <p style="font-size: 28px; font-weight: 800; margin: 5px 0;">${totalTimeSaved}m</p>
              <p style="font-size: 14px; color: #16a34a;">+${(weeklyCompletions || 0) * 15}m this week</p>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px;">
              <p style="font-size: 12px; color: #666; text-transform: uppercase;">Valid Completions</p>
              <p style="font-size: 28px; font-weight: 800; margin: 5px 0;">${totalCompletions}</p>
              <p style="font-size: 14px; color: #16a34a;">+${weeklyCompletions || 0} this week</p>
            </div>
          </div>

          <h2 style="font-size: 18px; margin-top: 30px;">🔥 Trending Flows</h2>
          <ul style="list-style: none; padding: 0;">
            ${trendingFlows?.map(f => `
              <li style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <strong>${f.title}</strong> (${f.category}) — ${f.completion_count} runs
              </li>
            `).join('')}
          </ul>

          <p style="font-size: 12px; color: #999; margin-top: 40px; text-align: center;">
            This is an automated weekly report from the Conduit Authority Engine.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true, message: 'ROI Report sent' });

  } catch (error: any) {
    console.error('ROI Report Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
