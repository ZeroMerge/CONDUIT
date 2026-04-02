// src/app/api/validate/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
})

export async function POST(request: Request) {
    try {
        const { userResult, expectedOutcome } = await request.json()

        if (!userResult || !expectedOutcome) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            return NextResponse.json(
                { success: false, feedback: "Developer mode: Anthropic API key is not configured in .env.local yet." },
                { status: 200 }
            )
        }

        const prompt = `
        <role>You are a precise evaluator for an AI Workflow platform.</role>
        
        <goal>Determine if the user's result matches the expected outcome.</goal>
        
        <context>
            <expected_outcome>${expectedOutcome}</expected_outcome>
            <user_result>${userResult}</user_result>
        </context>

        <instructions>
            Analyze if the user's result successfully achieves the expected outcome.
            Respond ONLY with a valid JSON object matching this schema:
            {
              "success": boolean,
              "feedback": "A short, encouraging 1-sentence explanation of why it passed, OR what is missing/wrong."
            }
        </instructions>
        `

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
        })

        const content = response.content[0].type === 'text' ? response.content[0].text : ''
        const result = JSON.parse(content || '{}')
        return NextResponse.json(result)

    } catch (error) {
        console.error('Validation API Error:', error)
        return NextResponse.json({ error: 'Failed to validate result' }, { status: 500 })
    }
}