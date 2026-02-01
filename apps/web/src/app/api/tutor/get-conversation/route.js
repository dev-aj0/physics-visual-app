import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      return Response.json(
        { error: "Problem ID is required" },
        { status: 400 },
      );
    }

    // Get or create conversation
    let [conversation] = await sql`
      SELECT * FROM tutor_conversations
      WHERE problem_id = ${problemId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!conversation) {
      [conversation] = await sql`
        INSERT INTO tutor_conversations (problem_id)
        VALUES (${problemId})
        RETURNING *
      `;
    }

    // Get messages
    const messages = await sql`
      SELECT role, content
      FROM tutor_messages
      WHERE conversation_id = ${conversation.id}
      ORDER BY created_at ASC
    `;

    return Response.json({
      conversationId: conversation.id,
      messages,
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return Response.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}
