import sql from "@/app/api/utils/sql";

export async function POST(request) {
  try {
    const body = await request.json();
    const { problemId } = body;

    if (!problemId) {
      return Response.json(
        { error: "Problem ID is required" },
        { status: 400 },
      );
    }

    // Get base URL for internal API calls
    const url = new URL(request.url);
    const baseURL = `${url.protocol}//${url.host}`;

    // Get problem
    const [problem] = await sql`
      SELECT * FROM problems WHERE id = ${problemId}
    `;

    if (!problem) {
      return Response.json({ error: "Problem not found" }, { status: 404 });
    }

    // Generate visual descriptions using AI
    const messages = [
      {
        role: "system",
        content: `You are a physics visualization expert. Analyze physics problems and identify what visual diagrams would help understand the problem.
        
For each problem, suggest 1-3 relevant visualizations from these types:
- free_body_diagram: Shows forces acting on objects
- projectile_motion: Shows trajectory paths
- energy_diagram: Shows energy transformations
- force_vectors: Shows direction and magnitude of forces
- motion_diagram: Shows position over time
- circuit_diagram: For electrical problems
- wave_diagram: For wave/oscillation problems

Be specific about what should be shown in each diagram.`,
      },
      {
        role: "user",
        content: `Analyze this physics problem and suggest appropriate visual diagrams: ${problem.problem_text}`,
      },
    ];

    const response = await fetch(`${baseURL}/api/integrations/chat-gpt/conversationgpt4`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        json_schema: {
          name: "physics_visuals",
          schema: {
            type: "object",
            properties: {
              visuals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: {
                      type: "string",
                    },
                    description: {
                      type: "string",
                    },
                  },
                  required: ["type", "description"],
                  additionalProperties: false,
                },
              },
            },
            required: ["visuals"],
            additionalProperties: false,
          },
          strict: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate visuals");
    }

    const data = await response.json();
    
    // Handle both JSON string and object responses
    let visualsData;
    const content = data.choices[0]?.message?.content;
    if (typeof content === 'string') {
      try {
        visualsData = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse visuals JSON:", e);
        throw new Error("Invalid visuals format from AI");
      }
    } else {
      visualsData = content;
    }

    // Store visuals in database
    const visuals = [];
    for (const visual of visualsData.visuals) {
      const [stored] = await sql`
        INSERT INTO visuals (problem_id, visual_type, visual_description)
        VALUES (${problemId}, ${visual.type}, ${visual.description})
        RETURNING *
      `;
      visuals.push(stored);
    }

    return Response.json({ visuals });
  } catch (error) {
    console.error("Error generating visuals:", error);
    return Response.json(
      { error: "Failed to generate visuals" },
      { status: 500 },
    );
  }
}
