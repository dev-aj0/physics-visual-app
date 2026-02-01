/**
 * OpenAI GPT-4 Chat Completion Endpoint
 * Handles both streaming and non-streaming responses
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, stream = false, json_schema } = body;

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

    // Prepare request body for OpenAI
    const requestBody = {
      model: "gpt-4o", // Using GPT-4o for better performance and cost
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      stream: stream,
    };

    // Add structured output if json_schema is provided
    if (json_schema) {
      requestBody.response_format = {
        type: "json_schema",
        json_schema: {
          name: json_schema.name || "response",
          schema: json_schema.schema,
          strict: json_schema.strict || false,
        },
      };
    }

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
      console.error("OpenAI API error:", errorData);
      return Response.json(
        { error: "Failed to get response from OpenAI" },
        { status: response.status }
      );
    }

    // Handle streaming response
    if (stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) {
                controller.close();
                break;
              }
              
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    controller.close();
                    return;
                  }
                  
                  try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                      controller.enqueue(new TextEncoder().encode(`data: ${content}\n\n`));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          } catch (error) {
            controller.error(error);
          }
        },
      });
      
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Handle non-streaming response
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error in GPT-4 conversation:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
