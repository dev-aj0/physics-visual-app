import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, problemId, messages, stream, imageUrl } = body;

    if (!messages || messages.length === 0) {
      return Response.json(
        { error: "Messages are required" },
        { status: 400 },
      );
    }

    // Build messages for AI - convert last user message to multimodal if imageUrl provided
    let aiMessagesInput = [...messages];
    if (imageUrl && aiMessagesInput.length > 0) {
      const lastMsg = aiMessagesInput[aiMessagesInput.length - 1];
      if (lastMsg.role === "user") {
        const textContent = lastMsg.content || "What can you tell me about this image?";
        aiMessagesInput = [
          ...aiMessagesInput.slice(0, -1),
          {
            role: "user",
            content: [
              { type: "text", text: textContent },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ];
      }
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
        content: `You are an expert physics tutor. Your goal is to help students understand physics concepts deeply, not just give them answers. Use the Socratic method when appropriate—ask guiding questions before revealing solutions.

${problemContext}

Physics domains you cover: mechanics (Newton's laws, free body diagrams, friction), kinematics (motion, projectiles, vectors), energy (kinetic, potential, conservation), momentum (collisions, impulse), circular motion, waves and optics, electricity and magnetism (circuits, fields), thermodynamics, and modern physics.

Guidelines:
- Ask guiding questions to help students think through problems
- Provide hints before giving full solutions; avoid spoiling the answer
- Explain physics concepts clearly with formulas and equations
- Use analogies and real-world examples (sports, everyday objects)
- Be encouraging and supportive; celebrate correct reasoning
- Break down complex ideas into simpler parts
- When the student shares a diagram or image, refer to specific elements (vectors, axes, labels) you see

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
      ...aiMessagesInput,
    ];

    // Call ChatGPT with retry for transient failures
    const url = new URL(request.url);
    const baseURL = `${url.protocol}//${url.host}`;
    const maxRetries = 2;
    let chatResponse;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        chatResponse = await fetch(
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

        if (chatResponse.ok) break;

        const errorText = await chatResponse.text();
        lastError = new Error(`API error ${chatResponse.status}: ${errorText}`);
        if (chatResponse.status >= 500 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        } else {
          throw lastError;
        }
      } catch (err) {
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        } else {
          throw err;
        }
      }
    }

    if (!chatResponse.ok) {
      console.error("ChatGPT API error:", lastError);
      throw new Error("Failed to get tutor response. Please try again.");
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
