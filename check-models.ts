import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not defined in environment variables.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function checkMyModels() {
    try {
        console.log("Fetching models...");
        // This fetches the actual list supported by the API endpoint
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        console.log("\n--- MODELS YOU CAN ACTUALLY USE ---");
        if (data.models) {
            data.models.forEach((m: any) => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`Model ID: ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("No models found in response:", data);
        }
    } catch (e) {
        console.error("Error fetching models:", e);
    }
}

checkMyModels();
