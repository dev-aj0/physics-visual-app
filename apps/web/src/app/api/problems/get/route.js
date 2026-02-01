import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json(
        { error: "Problem ID is required" },
        { status: 400 },
      );
    }

    // Get problem
    const [problem] = await sql`
      SELECT * FROM problems WHERE id = ${id}
    `;

    if (!problem) {
      return Response.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get solution with steps
    const [solution] = await sql`
      SELECT * FROM solutions WHERE problem_id = ${id}
    `;

    let solutionWithSteps = null;
    if (solution) {
      const steps = await sql`
        SELECT * FROM solution_steps
        WHERE solution_id = ${solution.id}
        ORDER BY step_number ASC
      `;
      solutionWithSteps = { ...solution, steps };
    }

    // Get visuals
    const visuals = await sql`
      SELECT * FROM visuals WHERE problem_id = ${id}
    `;

    return Response.json({
      problem,
      solution: solutionWithSteps,
      visuals,
    });
  } catch (error) {
    console.error("Error fetching problem:", error);
    return Response.json({ error: "Failed to fetch problem" }, { status: 500 });
  }
}
