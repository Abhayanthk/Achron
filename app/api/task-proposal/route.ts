import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 1. Initialize the SDK (Do this outside the POST handler)
const apiKey = process.env.GEMINI_API_KEY || "";
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_PROMPT = `You are Achron Notes Structuring Engine.

Your task is to convert raw notes into a deeply structured, nested representation
that preserves ALL meaningful information while removing non-essential fluff.

────────────────────────
INPUT
────────────────────────
You will receive a block of notes written by the user or generated in a conversation.
The notes may be long, informal, opinionated, or unstructured.

────────────────────────
CORE OBJECTIVE
────────────────────────
Re-express the notes as a hierarchical structure suitable for a mind map.

This is NOT summarization.
This is NOT abstraction.
This is NOT reinterpretation.

Your goal is to:
- preserve all factual, conceptual, and instructional content
- reorganize the information into clear parent–child relationships
- remove only casual remarks, jokes, or stylistic filler that do not add meaning

────────────────────────
STRICT RULES
────────────────────────
- Preserve all meaningful content from the notes
- Do NOT invent new information
- Do NOT merge distinct ideas
- Do NOT compress content aggressively
- Do NOT explain or comment on the notes
- Do NOT add opinions or insights
- Remove only non-essential stylistic remarks


────────────────────────
STRUCTURE RULES
────────────────────────
- Output must be a single rooted tree
- Each node represents a concept, idea, rule, example, or instruction
- Child nodes must be logically dependent on their parent
- Depth is flexible but should reflect the note’s real structure
- Use short, clear labels that accurately represent the original content

────────────────────────
OUTPUT FORMAT
────────────────────────
Return VALID JSON ONLY in the following format:

{
  "id": string,
  "title": string,
  "children": [
    {
      "id": string,
      "title": string,
      "children": [ ... ]
    }
  ]
}

────────────────────────
OUTPUT CONSTRAINTS
────────────────────────
- IDs must be unique, lowercase, and stable
- Titles must be concise but faithful to the original meaning
- Leaf nodes should represent atomic ideas
- Order children logically, following the flow of the original notes
- Do NOT include empty children arrays unless necessary
- For points don't create multiple children instead create a single child with multiple points inside a in array

Return ONLY the JSON. No markdown. No explanations. No extra text.`;

export const POST = async (req: NextRequest) => {
    try {
        // Validation
        const { prompt } = await req.json();
        if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

        if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

        // 2. Setup the model with System Instructions
        // This is better than concatenating strings because it keeps the rules separate from user data
        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_PROMPT,
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        // 3. Generate Content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 4. Safe Parsing
        // Since we used responseMimeType: "application/json", Gemini will NOT 
        // include markdown backticks ```json ... ```. It returns pure JSON string.
        try {
            const parsedData = JSON.parse(text);
            return NextResponse.json(parsedData);
        } catch (parseError) {
            console.error("JSON Parse Error:", text);
            return NextResponse.json({ error: "Model returned invalid JSON" }, { status: 500 });
        }

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" }, 
            { status: 500 }
        );
    }
};

export const GET = async (req: NextRequest) => {
      // 1. YOUR INPUT DATA
const rootData = {
    "id": "dto-typescript-guide",
    "title": "DTO (Data Transfer Object) in TypeScript",
    "children": [
        {
            "id": "definition-and-nature",
            "title": "Definition and Nature",
            "children": [
                { "id": "plain-object-definition", "title": "A plain object definition describing the exact shape of data sent between application layers" },
                { "id": "dto-characteristics", "title": "Characteristics: No logic, no database magic, pure structure and rules" }
            ]
        },
        {
            "id": "dto-as-contract",
            "title": "The DTO as a Contract",
            "children": [
                { "id": "contract-boundaries", "title": "Bridges boundaries between Frontend ↔ Backend, Controller ↔ Service, and API ↔ Client" },
                { "id": "early-error-detection", "title": "Ensures TypeScript catches breaking changes during development rather than in production" }
            ]
        },
        {
            "id": "importance-of-dtos",
            "title": "Why DTOs Exist",
            "children": [
                {
                    "id": "without-dtos",
                    "title": "Risks without DTOs",
                    "children": [
                        { "id": "without-dtos-list", "title": "Anomalous objects in API, guesswork validation, refactoring landmines, and system drift" }
                    ]
                },
                {
                    "id": "with-dtos",
                    "title": "Benefits with DTOs",
                    "children": [
                        { "id": "with-dtos-list", "title": "Input control, guaranteed output, separation of concerns, and system reliability" }
                    ]
                }
            ]
        },
        {
            "id": "simple-dto-example",
            "title": "Simple Implementation Example",
            "children": [
                { "id": "create-user-interface", "title": "Interface: export interface CreateUserDTO { name: string; email: string; age?: number; }" },
                {
                    "id": "usage-enforcement",
                    "title": "Usage: function createUser(data: CreateUserDTO) { ... }",
                    "children": [
                        { "id": "enforcement-rules", "title": "Enforces: Required name and email, optional age, and strictly allows no extra fields" }
                    ]
                }
            ]
        },
        {
            "id": "conceptual-distinctions",
            "title": "DTO vs Model vs Entity",
            "children": [
                { "id": "dto-purpose", "title": "DTO: Shape of data moving in/out of the system" },
                { "id": "model-entity-purpose", "title": "Model / Entity: How data is stored in the database" },
                { "id": "service-logic-purpose", "title": "Service Logic: Operations performed on the data" },
                { "id": "separation-power", "title": "Power of Separation: Example - DB holds 'passwordHash', but API DTO does not" }
            ]
        },
        {
            "id": "real-project-patterns",
            "title": "DTOs in Real Projects",
            "children": [
                { "id": "class-based-dtos", "title": "Using classes (e.g., CreateTaskDTO) allows controllers to reject non-conforming data" }
            ]
        },
        {
            "id": "advanced-patterns",
            "title": "Advanced DTO Patterns",
            "children": [
                { "id": "read-vs-write", "title": "Directional DTOs: CreateUserDTO (Write), UpdateUserDTO (Update), UserResponseDTO (Read)" },
                { "id": "partial-dtos", "title": "Utility Types: type UpdateUserDTO = Partial<CreateUserDTO>;" },
                { "id": "runtime-validation", "title": "Validation Decorators: Using class-validator (@IsString, @IsEmail) for compile-time and runtime safety" }
            ]
        },
        {
            "id": "leverage-insight",
            "title": "The Leverage Insight",
            "children": [
                { "id": "control-points", "title": "DTOs are not extra files; they are bold boundaries and control points for scalable systems" }
            ]
        },
        {
            "id": "assignment-tasks",
            "title": "Practical Assignment",
            "children": [
                { "id": "assignment-steps", "title": "Tasks: Pick an endpoint, create Create/Update/Response DTOs, and replace all 'any' types" }
            ]
        }
    ]
};

// 2. CONFIGURATION
const CONFIG = {
    fontFamily: 1, // Virgil
    fontSize: 16,
    charWidthApprox: 10, // Approximate width per character in px
    lineHeight: 24,
    padding: 20,
    verticalGap: 150, // Space between rows
    horizontalGap: 40, // Space between sibling nodes
    colors: ["#ffc9c9", "#b2f2bb", "#a5d8ff", "#e5dbff", "#ffec99"] // Colors for Depth 0, 1, 2, 3...
};

// 3. HELPER FUNCTIONS
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function measureText(text: string) {
    // Simple heuristic for text wrapping and sizing
    const maxCharsPerLine = 40;
    const words = text.split(" ");
    let lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    const width = Math.min(text.length * CONFIG.charWidthApprox, maxCharsPerLine * CONFIG.charWidthApprox) + (CONFIG.padding * 2);
    const height = (lines.length * CONFIG.lineHeight) + (CONFIG.padding * 2);

    return { width, height, lines: lines.join("\n") };
}

// 4. LAYOUT ALGORITHM (Recursive Tree Layout)
// This calculates the X and Y coordinates for every node
let nextX = 0; // Tracks the next available X position at the bottom level

function calculateTreeLayout(node: any, depth = 0) {
    const size = measureText(node.title);
    node.width = size.width;
    node.height = size.height;
    node.formattedText = size.lines;
    node.depth = depth;
    node.y = depth * CONFIG.verticalGap;

    if (!node.children || node.children.length === 0) {
        // Leaf node: place it at the next available spot
        node.x = nextX;
        nextX += node.width + CONFIG.horizontalGap;
    } else {
        // Parent node: process children first
        node.children.forEach((child: any) => calculateTreeLayout(child, depth + 1));
        
        // Center parent over children
        const firstChild = node.children[0];
        const lastChild = node.children[node.children.length - 1];
        const childrenCenter = (firstChild.x + lastChild.x + (lastChild.width - firstChild.width)/2) / 2; // Rough centering
        
        // Ensure parent doesn't overlap with previous siblings (simple check)
        node.x = Math.max(nextX, childrenCenter);
        
        // If parent moved right due to nextX, we might need to shift children (omitted for simplicity, usually fine)
        if(node.x > childrenCenter) {
           // Simple push mechanism could go here, but usually tree builds left-to-right safely
           nextX = node.x + node.width + CONFIG.horizontalGap; 
        }
    }
    return node;
}

// 5. EXCALIDRAW ELEMENT GENERATOR
const excalidrawElements: any[] = [];

function createExcalidrawNode(node: any) {
    const groupId = generateId();
    const bg = CONFIG.colors[node.depth % CONFIG.colors.length];

    // 1. The Rectangle
    const rect = {
        type: "rectangle",
        id: node.id + "-rect",
        x: node.x,
        y: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: bg,
        strokeWidth: 1,
        fillStyle: "solid",
        roughness: 1,
        roundness: { type: 3 },
        groupIds: [groupId],
        boundElements: [{ id: node.id + "-text", type: "text" }] // Bind text to box
    };

    // 2. The Text
    const text = {
        type: "text",
        id: node.id + "-text",
        x: node.x + CONFIG.padding, // Simple centering logic handled by Excalidraw binding usually, but explicit here
        y: node.y + CONFIG.padding/2, // offset for padding
        width: node.width - (CONFIG.padding*2),
        height: node.height - (CONFIG.padding*2),
        text: node.formattedText,
        fontSize: CONFIG.fontSize,
        fontFamily: CONFIG.fontFamily,
        textAlign: "center",
        verticalAlign: "middle",
        groupIds: [groupId],
        containerId: node.id + "-rect" // Crucial for auto-centering text in box
    };

    excalidrawElements.push(rect, text);

    // 3. The Arrow (if parent exists)
    if (node.children) {
        node.children.forEach((child: any) => {
            const arrowId = generateId();
            const startX = node.x + (node.width / 2);
            const startY = node.y + node.height;
            const endX = child.x + (child.width / 2);
            const endY = child.y;

            const arrow = {
                type: "arrow",
                id: arrowId,
                x: startX,
                y: startY,
                width: endX - startX,
                height: endY - startY,
                strokeColor: "#5c5c5c",
                strokeWidth: 1,
                points: [[0, 0], [endX - startX, endY - startY]], // Relative points
                startBinding: { elementId: node.id + "-rect", gap: 5 },
                endBinding: { elementId: child.id + "-rect", gap: 5 },
                endArrowhead: "arrow"
            };
            excalidrawElements.push(arrow);
            
            // Recursively create children
            createExcalidrawNode(child);
        });
    }
}

// --- EXECUTION ---
calculateTreeLayout(rootData); // Calculate math
createExcalidrawNode(rootData); // Generate Objects

// Output result
console.log(JSON.stringify(excalidrawElements, null, 2));
    return NextResponse.json({excalidrawElements});
};
