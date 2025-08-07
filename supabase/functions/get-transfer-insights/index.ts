import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TransferQuery {
  fromPsp: string;
  toPsp: string;
  currency: string;
  amount?: number;
}

interface AIInsight {
  confidence: number;
  estimatedFee: number;
  estimatedTime: number;
  isSupported: boolean;
  notes: string;
  sourceInfo: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { fromPsp, toPsp, currency, amount = 1000 }: TransferQuery = await req.json();

    console.log(`Analyzing transfer route: ${fromPsp} → ${toPsp} (${currency})`);

    // Create a comprehensive prompt for Gemini
    const prompt = `
    As a financial technology expert, analyze the current money transfer capabilities between payment service providers in 2025.

    Query: Can I send ${currency} ${amount} from ${fromPsp} to ${toPsp}?

    Please provide a detailed analysis covering:
    1. Current direct integration status between these PSPs
    2. Estimated transfer fees (as percentage)
    3. Typical processing time in hours
    4. Required KYC/verification levels
    5. Geographic restrictions if any
    6. Alternative routing options if direct transfer isn't possible
    7. Recent changes or updates to their APIs/partnerships

    Focus on factual, current information from 2024-2025. Consider:
    - Official API documentation and partnerships
    - Industry reports and fintech news
    - Regulatory compliance requirements
    - Technical limitations and capabilities

    Format your response as JSON with these exact fields:
    {
      "isSupported": boolean,
      "confidence": number (0-100),
      "estimatedFeePercentage": number,
      "estimatedTimeHours": number,
      "kycRequired": boolean,
      "notes": "detailed explanation",
      "alternativeRoutes": ["option1", "option2"],
      "lastUpdated": "2025-01-XX",
      "sourceInfo": "summary of information sources"
    }
    `;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            topK: 1,
            topP: 1,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', geminiData);

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log('Raw Gemini text:', responseText);

    // Extract JSON from the response
    let aiInsight: AIInsight;
    try {
      // Try to find JSON in the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedResponse = JSON.parse(jsonMatch[0]);
        aiInsight = {
          confidence: parsedResponse.confidence || 50,
          estimatedFee: parsedResponse.estimatedFeePercentage || 3.0,
          estimatedTime: parsedResponse.estimatedTimeHours || 24,
          isSupported: parsedResponse.isSupported || false,
          notes: parsedResponse.notes || 'AI analysis based on current market data',
          sourceInfo: parsedResponse.sourceInfo || 'Gemini AI analysis of current PSP capabilities'
        };
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing JSON, using fallback analysis:', parseError);
      
      // Fallback: analyze the text response for key indicators
      const text = responseText.toLowerCase();
      const isSupported = text.includes('yes') || text.includes('supported') || text.includes('possible');
      const hasAPI = text.includes('api') || text.includes('integration');
      
      aiInsight = {
        confidence: isSupported ? (hasAPI ? 75 : 60) : 35,
        estimatedFee: text.includes('low fee') ? 1.5 : text.includes('high fee') ? 4.0 : 2.5,
        estimatedTime: text.includes('instant') ? 1 : text.includes('days') ? 48 : 12,
        isSupported: isSupported,
        notes: responseText.substring(0, 200) + '...',
        sourceInfo: 'AI analysis of current market information'
      };
    }

    console.log('Final AI insight:', aiInsight);

    return new Response(JSON.stringify(aiInsight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-transfer-insights function:', error);
    
    // Return a fallback response instead of error
    const fallbackInsight: AIInsight = {
      confidence: 40,
      estimatedFee: 3.0,
      estimatedTime: 24,
      isSupported: false,
      notes: 'Unable to get real-time data. This is a fallback estimate.',
      sourceInfo: 'Fallback analysis due to API unavailability'
    };

    return new Response(JSON.stringify(fallbackInsight), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});