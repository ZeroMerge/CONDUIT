// src/app/api/validate/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Fallback to avoid crashing if key is missing during build/dev
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy_key',
})

export async function POST(request: Request) {
    try {
        const { userResult, expectedOutcome } = await request.json()

        if (!userResult || !expectedOutcome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { success: false, feedback: "Developer mode: OpenAI API key is not configured in .env.local yet." },
                { status: 200 }
            )
        }

        const prompt = `
      You are an expert evaluator for an AI Workflow platform.
      
      EXPECTED OUTCOME:
      "${expectedOutcome}"

      USER'S ACTUAL RESULT:
      "${userResult}"

      Does the user's result successfully achieve the expected outcome?
      Respond ONLY with a valid JSON object matching this schema:
      {
        "success": boolean,
        "feedback": "A short, encouraging 1-sentence explanation of why it passed, OR what is missing/wrong."
      }
    `

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
        })

        const result = JSON.parse(response.choices[0].message.content || '{}')
        return NextResponse.json(result)

    } catch (error) {
        console.error('Validation API Error:', error)
        return NextResponse.json({ error: 'Failed to validate result' }, { status: 500 })
    }
}