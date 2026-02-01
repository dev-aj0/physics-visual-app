import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, problemId, messages, stream } = body;

    if (!messages || messages.length === 0) {
      return Response.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Get problem context if problemId provided
    let problemContext = "";
    let problem = null;
    
    if (problemId) {
      const problems = await sql`
        SELECT * FROM problems WHERE id = ${problemId}
      `;
      problem = problems[0];
      if (problem) {
        problemContext = `The student is working on this problem: ${problem.problem_text}`;
      }
    }

    // Get or create conversation (only if we have a valid problem)
    let convId = conversationId;
    if (!convId && problem) {
      const [conversation] = await sql`
        INSERT INTO tutor_conversations (problem_id)
        VALUES (${problemId})
        RETURNING *
      `;
      convId = conversation.id;
    }

    // Store user message if we have a conversation
    const lastMessage = messages[messages.length - 1];
    if (convId && lastMessage.role === "user") {
      await sql`
        INSERT INTO tutor_messages (conversation_id, role, content)
        VALUES (${convId}, 'user', ${lastMessage.content})
      `;
    }

    // Build AI messages with context
    const aiMessages = [
      {
        role: "system",
        content: `You are a helpful physics tutor. Your goal is to help students understand physics concepts, not just give them answers. Use the Socratic method when appropriate.

${problemContext}

Guidelines:
- Ask guiding questions to help students think through problems
- Provide hints before giving full solutions
- Explain physics concepts clearly with formulas and equations
- Use analogies and real-world examples
- Be encouraging and supportive
- Break down complex ideas into simpler parts
- Cover topics like mechanics, forces, energy, momentum, waves, electricity, magnetism, thermodynamics, and more

IMPORTANT - Equation formatting rules:
- Write equations in simple text format, NOT LaTeX
- Use ² for squared (v² not v^2)
- Use ³ for cubed
- Use ½ for one-half, ¼ for one-quarter
- Use × for multiplication
- Use √ for square root
- Example: KE = ½mv² (not \\frac{1}{2}mv^2)
- Example: E = mc² (not E = mc^2)
- Example: F = ma
- Example: a = Δv/Δt
- Put equations on their own line for clarity`,
      },
      ...messages,
    ];

    // Call ChatGPT - construct absolute URL for server-side fetch
    const url = new URL(request.url);
    const baseURL = `${url.protocol}//${url.host}`;
    const chatResponse = await fetch(
      `${baseURL}/api/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: aiMessages,
          stream: stream || false,
        }),
      },
    );

    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error("ChatGPT API error:", errorText);
      throw new Error("Failed to get tutor response");
    }

    // If streaming, return the stream
    if (stream) {
      return new Response(chatResponse.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Otherwise, store and return the response
    const chatData = await chatResponse.json();
    const assistantMessage = chatData.choices[0].message.content;

    // Store assistant message if we have a conversation
    if (convId) {
      await sql`
        INSERT INTO tutor_messages (conversation_id, role, content)
        VALUES (${convId}, 'assistant', ${assistantMessage})
      `;
    }

    return Response.json({
      message: assistantMessage,
      conversationId: convId || null,
    });
  } catch (error) {
    console.error("Error in tutor chat:", error);
    return Response.json({ error: error.message || "Failed to process chat" }, { status: 500 });
  }
}
