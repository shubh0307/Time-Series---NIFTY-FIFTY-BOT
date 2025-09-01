
import { GoogleGenAI, Type } from "@google/genai";
import type { DataPoint, ForecastResponse } from '../types';

// Ensure the API key is available, but do not hardcode it.
// It's assumed to be set in the environment.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export const generateNiftyForecast = async (historicalData: DataPoint[], forecastDays: number): Promise<ForecastResponse> => {
  const model = "gemini-2.5-flash";
  const lastHistoricalPrice = historicalData.length > 0 ? historicalData[historicalData.length - 1].price : 0;

  const prompt = `
    You are a financial analyst specializing in time series forecasting for Indian stock markets.
    Given the following daily closing prices for the NIFTY FIFTY index for the last 30 days, predict the closing prices for the next ${forecastDays} days.
    The last available historical price is ${lastHistoricalPrice}.
    
    Historical Data:
    ${JSON.stringify(historicalData)}

    Provide your response as a single, raw JSON object with the following keys:
    1. 'forecast': An array of ${forecastDays} objects, where each object has a 'price' (the most likely closing price), a 'high' (the upper bound of a 90% confidence interval), and a 'low' (the lower bound of the 90% confidence interval). All as numbers. The 'date' field will be ignored and recalculated later.
    2. 'summary': A brief, one-paragraph analysis of your forecast, highlighting the expected trend (e.g., bullish, bearish, sideways movement) and potential key levels to watch.
    3. 'predictedHigh': The absolute highest price (number) in your ${forecastDays}-day forecast's 'high' values.
    4. 'predictedLow': The absolute lowest price (number) in your ${forecastDays}-day forecast's 'low' values.
    5. 'percentageChange': The percentage change (number) from the last historical price (${lastHistoricalPrice}) to the last forecasted 'price' (day ${forecastDays}).
    
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
            price: { 
                type: Type.NUMBER,
                description: "The predicted closing price for the date."
            },
            high: {
                type: Type.NUMBER,
                description: "The upper bound of the 90% confidence interval."
            },
            low: {
                type: Type.NUMBER,
                description: "The lower bound of the 90% confidence interval."
            },
            // The date field is optional in the schema as we recalculate it client-side for accuracy
            date: {
                type: Type.STRING
            }
          },
          required: ["price", "high", "low"]
        },
      },
      summary: {
        type: Type.STRING,
        description: "A brief analysis of the forecast."
      },
      predictedHigh: {
        type: Type.NUMBER,
        description: "The highest predicted price in the forecast period."
      },
      predictedLow: {
        type: Type.NUMBER,
        description: "The lowest predicted price in the forecast period."
      },
      percentageChange: {
        type: Type.NUMBER,
        description: "The percentage change from the last historical price to the last forecasted price."
      }
    },
    required: ["forecast", "summary", "predictedHigh", "predictedLow", "percentageChange"]
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
    if (
        !parsedResponse.forecast || 
        !parsedResponse.summary || 
        !Array.isArray(parsedResponse.forecast) ||
        typeof parsedResponse.predictedHigh !== 'number' ||
        typeof parsedResponse.predictedLow !== 'number' ||
        typeof parsedResponse.percentageChange !== 'number' ||
        parsedResponse.forecast.some((p: any) => typeof p.price !== 'number' || typeof p.high !== 'number' || typeof p.low !== 'number')
    ) {
        throw new Error("Invalid response structure from API");
    }

    return parsedResponse as ForecastResponse;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get forecast from Gemini API.");
  }
};