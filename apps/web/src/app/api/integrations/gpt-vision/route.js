/**
 * OpenAI Vision API Endpoint
 * Extracts text and analyzes images using GPT-4 Vision
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set");
      return Response.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    // Prepare request body for OpenAI Vision
    const requestBody = {
      model: "gpt-4o", // GPT-4o supports vision
      messages: messages.map((msg) => {
        // Handle both text and image content
        if (Array.isArray(msg.content)) {
          return {
            role: msg.role,
            content: msg.content.map((item) => {
              if (item.type === "image_url") {
                return {
                  type: "image_url",
                  image_url: {
                    url: item.image_url.url,
                  },
                };
              }
              return {
                type: "text",
                text: item.text || item,
              };
            }),
          };
        }
        return {
          role: msg.role,
          content: msg.content,
        };
      }),
      max_tokens: 1000,
      temperature: 0.3, // Lower temperature for more accurate OCR
    };

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI Vision API error:", errorData);
      return Response.json(
        { error: "Failed to analyze image" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error in GPT Vision:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
