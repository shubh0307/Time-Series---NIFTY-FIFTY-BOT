
import { GoogleGenAI, Type } from "@google/genai";
import type { DataPoint, ForecastResponse } from '../types';

// Ensure the API key is available, but do not hardcode it.
// It's assumed to be set in the environment.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export const generateNiftyForecast = async (historicalData: DataPoint[]): Promise<ForecastResponse> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a financial analyst specializing in time series forecasting for Indian stock markets.
    Given the following daily closing prices for the NIFTY FIFTY index for the last 30 days, predict the closing prices for the next 7 days.
    
    Historical Data:
    ${JSON.stringify(historicalData)}

    Provide your response as a single, raw JSON object with two keys:
    1. 'forecast': An array of 7 objects, where each object has a 'date' (in 'YYYY-MM-DD' format, continuing from the last historical date) and a 'price' (as a number).
    2. 'summary': A brief, one-paragraph analysis of your forecast, highlighting the expected trend (e.g., bullish, bearish, sideways movement) and potential key levels to watch.
    
    Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. Just the raw JSON object.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      forecast: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { 
                type: Type.STRING,
                description: "The forecasted date in YYYY-MM-DD format." 
            },
            price: { 
                type: Type.NUMBER,
                description: "The predicted closing price for the date."
            },
          },
          required: ["date", "price"]
        },
      },
      summary: {
        type: Type.STRING,
        description: "A brief analysis of the forecast."
      },
    },
    required: ["forecast", "summary"]
  };

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.5,
      },
    });

    const jsonText = response.text;
    const parsedResponse = JSON.parse(jsonText);

    // Basic validation
    if (!parsedResponse.forecast || !parsedResponse.summary || !Array.isArray(parsedResponse.forecast)) {
        throw new Error("Invalid response structure from API");
    }

    return parsedResponse as ForecastResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get forecast from Gemini API.");
  }
};
