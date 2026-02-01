import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get problems with solution status
    const problems = await sql`
      SELECT 
        p.*,
        CASE WHEN s.id IS NOT NULL THEN true ELSE false END as has_solution,
        (SELECT COUNT(*) FROM visuals v WHERE v.problem_id = p.id) as visual_count
      FROM problems p
      LEFT JOIN solutions s ON p.id = s.problem_id
      ORDER BY p.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Get total count
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM problems
    `;

    return Response.json({
      problems,
      total: parseInt(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error listing problems:", error);
    return Response.json(
      { error: "Failed to list problems" },
      { status: 500 }
    );
  }
}
