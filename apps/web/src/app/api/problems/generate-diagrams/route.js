import sql from "@/app/api/utils/sql";

/**
 * Generate actual SVG diagrams for physics problems
 * This creates visual representations like free body diagrams, projectile paths, etc.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { problemId, visualType } = body;

    if (!problemId) {
      return Response.json(
        { error: "Problem ID is required" },
        { status: 400 }
      );
    }

    // Get problem and visual description
    const [problem] = await sql`
      SELECT * FROM problems WHERE id = ${problemId}
    `;

    if (!problem) {
      return Response.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get visual description if visualType is provided
    let visualDescription = null;
    if (visualType) {
      const [visual] = await sql`
        SELECT * FROM visuals 
        WHERE problem_id = ${problemId} AND visual_type = ${visualType}
        LIMIT 1
      `;
      visualDescription = visual?.visual_description;
    }

    // Get base URL for internal API calls
    const url = new URL(request.url);
    const baseURL = `${url.protocol}//${url.host}`;

    // Use AI to generate SVG diagram code based on the problem
    const messages = [
      {
        role: "system",
        content: `You are a physics diagram generator. Generate SVG code for physics diagrams.
        
Create accurate, educational diagrams like:
- Free body diagrams with force vectors (arrows showing F, N, mg, etc.)
- Projectile motion trajectories (parabolic paths with velocity vectors)
- Energy bar charts (showing KE, PE, total energy)
- Force diagrams (showing all forces with labels)
- Motion diagrams (showing position at intervals)

The SVG MUST be:
- Valid SVG code starting with <svg> and ending with </svg>
- viewBox="0 0 400 300"
- Use these colors: background #FAFBFC, primary blue #5B9ED6, secondary orange #FFB88C, dark text #1E293B
- Include clear labels with font-family="system-ui, sans-serif"
- Use arrow markers for force vectors
- Be clean and educational

Example structure for a free body diagram:
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#5B9ED6"/>
    </marker>
  </defs>
  <!-- Object -->
  <rect x="175" y="125" width="50" height="50" fill="#FFB88C" stroke="#1E293B" stroke-width="2" rx="4"/>
  <!-- Forces with arrows -->
  <line x1="200" y1="175" x2="200" y2="250" stroke="#5B9ED6" stroke-width="3" marker-end="url(#arrow)"/>
  <text x="210" y="220" font-family="system-ui" font-size="14" fill="#1E293B">mg</text>
</svg>`,
      },
      {
        role: "user",
        content: `Generate an SVG diagram for this physics problem: ${problem.problem_text}
        ${visualDescription ? `Visual type: ${visualType}\nDescription: ${visualDescription}` : ""}
        
Create a detailed diagram that visualizes the physics concepts clearly.`,
      },
    ];

    const response = await fetch(`${baseURL}/api/integrations/chat-gpt/conversationgpt4`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        json_schema: {
          name: "svg_diagram",
          schema: {
            type: "object",
            properties: {
              svg: {
                type: "string",
                description: "Complete SVG code as a string",
              },
              description: {
                type: "string",
                description: "Brief description of what the diagram shows",
              },
            },
            required: ["svg", "description"],
            additionalProperties: false,
          },
          strict: true,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate diagram");
    }

    const data = await response.json();
    
    // Handle both JSON string and object responses
    let diagramData;
    const content = data.choices[0]?.message?.content;
    if (typeof content === 'string') {
      try {
        diagramData = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse diagram JSON:", e);
        throw new Error("Invalid diagram format from AI");
      }
    } else {
      diagramData = content;
    }
    
    if (!diagramData.svg || !diagramData.description) {
      throw new Error("Invalid diagram data structure");
    }

    // Update the visual with SVG data
    if (visualType) {
      await sql`
        UPDATE visuals
        SET svg_data = ${diagramData.svg}, 
            visual_description = ${diagramData.description}
        WHERE problem_id = ${problemId} AND visual_type = ${visualType}
      `;
    } else {
      // Create a new visual entry
      const [visual] = await sql`
        INSERT INTO visuals (problem_id, visual_type, visual_description, svg_data)
        VALUES (${problemId}, 'diagram', ${diagramData.description}, ${diagramData.svg})
        RETURNING *
      `;
      return Response.json({ visual });
    }

    // Get updated visual
    const [updatedVisual] = await sql`
      SELECT * FROM visuals 
      WHERE problem_id = ${problemId} AND visual_type = ${visualType}
      LIMIT 1
    `;

    return Response.json({ visual: updatedVisual });
  } catch (error) {
    console.error("Error generating diagram:", error);
    return Response.json(
      { error: "Failed to generate diagram" },
      { status: 500 }
    );
  }
}
