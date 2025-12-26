import { NextResponse } from 'next/server';

// Cache the model name to avoid checking on every request
let cachedModelName: string | null = null;

async function getAvailableModel(apiKey: string): Promise<string> {
  // Return cached model if available
  if (cachedModelName) {
    console.log('Using cached model:', cachedModelName);
    return cachedModelName;
  }

  console.log('Fetching available models...');
  const modelsResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  );

  if (!modelsResponse.ok) {
    const errorData = await modelsResponse.json();
    throw new Error(`Failed to fetch models: ${errorData.error?.message || 'Unknown error'}`);
  }

  const modelsData = await modelsResponse.json();

  // Log all available models
  console.log('All available models:');
  modelsData.models?.forEach((model: any) => {
    console.log(`- ${model.name} (supports: ${model.supportedGenerationMethods?.join(', ')})`);
  });

  // Find a model that supports generateContent
  const availableModel = modelsData.models?.find((model: any) =>
    model.supportedGenerationMethods?.includes('generateContent')
  );

  if (!availableModel) {
    throw new Error('No models available that support generateContent');
  }

  // Cache the model name
  cachedModelName = availableModel.name;
  console.log('✅ Selected model:', cachedModelName);

  return cachedModelName as string;
}

export async function POST(request: Request) {
  try {
    const { code, framework } = await request.json();

    // Check if API key exists
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Get the model name (uses cache after first call)
    const modelName = await getAvailableModel(process.env.GEMINI_API_KEY);

    const prompt = `You are a senior frontend engineer conducting a code review. Analyze this ${framework.toUpperCase()} code and provide a structured review with specific code fixes.

    Code to review:
    \`\`\`${framework}
    ${code}
    \`\`\`

    Provide your review in the following JSON format (respond with ONLY valid JSON, no preamble):
    {
      "summary": "Brief overall assessment",
      "codeQuality": {
        "score": 1-10,
        "issues": ["issue1", "issue2"],
        "strengths": ["strength1", "strength2"]
      },
      "bestPractices": {
        "score": 1-10,
        "issues": ["issue1"],
        "strengths": ["strength1"]
      },
      "performance": {
        "score": 1-10,
        "issues": ["issue1"],
        "improvements": ["improvement1"]
      },
      "accessibility": {
        "score": 1-10,
        "issues": ["issue1"],
        "improvements": ["improvement1"]
      },
      "security": {
        "score": 1-10,
        "issues": ["issue1"],
        "recommendations": ["rec1"]
      },
      "codeFixes": [
        {
          "issue": "Brief description of the issue",
          "before": "problematic code snippet",
          "after": "corrected code snippet",
          "explanation": "Why this fix improves the code"
        }
      ]
    }

    Include at least 3-5 specific code fixes with before/after examples.`;

    console.log('🚀 Making request to Gemini API with model:', modelName);
    const startTime = Date.now();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          }
        })
      }
    );

    const endTime = Date.now();
    console.log(`⏱️ API response time: ${((endTime - startTime) / 1000).toFixed(2)}s`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json(
        { error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract text from Gemini response
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      const reviewText = data.candidates[0].content.parts[0].text;

      // Clean and parse JSON
      const cleanedText = reviewText.replace(/```json|```/g, '').trim();

      try {
        const reviewData = JSON.parse(cleanedText);
        console.log('✅ Successfully generated code review');
        return NextResponse.json({ content: [{ text: JSON.stringify(reviewData) }] });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Text that failed to parse:', cleanedText);
        return NextResponse.json(
          { error: 'Failed to parse AI response as JSON' },
          { status: 500 }
        );
      }
    } else {
      console.error('Unexpected response structure:', data);
      return NextResponse.json(
        { error: 'Invalid response structure from Gemini API' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('API Error:', error);
    console.error('Error message:', error.message);
    return NextResponse.json(
      { error: `Failed to analyze code: ${error.message}` },
      { status: 500 }
    );
  }
}