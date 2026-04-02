// src/app/api/validate/route.ts
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Fallback to avoid crashing if key is missing during build/dev
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
                { 
                    success: false, 
                    feedback: "Developer mode: Anthropic API key is not configured in .env.local yet." 
                },
                { status: 200 }
            )
        }

        const prompt = `
<role>
You are an expert evaluator for the Conduit AI Workflow platform. Your task is to determine if a user's output successfully matches the expected outcome of a specific workflow step.
</role>

<context>
- Workflow Step Expected Outcome: "${expectedOutcome}"
- User's Actual Submitted Result: "${userResult}"
</context>

<instructions>
1. Analyze the User's Result against the Expected Outcome.
2. Be fair but rigorous. Minor formatting differences are okay, but core information must be present.
3. Provide a helpful, encouraging 1-sentence feedback message.
4. If it fails, explain exactly what is missing or incorrect.
5. Respond ONLY with a valid JSON object wrapped in <response> tags.
</instructions>

<example_format>
<response>
{
  "success": true,
  "feedback": "Great job! You've correctly identified the core components of the request."
}
</response>
</example_format>
`

        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0,
        })

        const content = response.content[0].type === 'text' ? response.content[0].text : ''
        const jsonMatch = content.match(/<response>([\s\S]*?)<\/response>/)
        const jsonString = jsonMatch ? jsonMatch[jsonMatch.length - 1].trim() : content.trim()
        
        try {
            const result = JSON.parse(jsonString)
            return NextResponse.json(result)
        } catch (parseError) {
            console.error('JSON Parse Error from Claude:', jsonString)
            return NextResponse.json({ 
                success: false, 
                feedback: "The AI evaluator returned an invalid response format. Please try again." 
            })
        }

    } catch (error) {
        console.error('Validation API Error:', error)
        return NextResponse.json({ error: 'Failed to validate result' }, { status: 500 })
    }
}