import sql from "@/app/api/utils/sql";

// Helper function to generate visuals asynchronously
async function generateVisualsAsync(baseURL, problemId) {
  try {
    await fetch(`${baseURL}/api/problems/generate-visuals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problemId }),
    });
    console.log(`Visuals generated for problem ${problemId}`);
  } catch (error) {
    console.error("Error generating visuals (async):", error);
    // Don't throw - this is background work
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { problemText, imageUrl } = body;

    if (!problemText && !imageUrl) {
      return Response.json(
        { error: "Problem text or image is required" },
        { status: 400 },
      );
    }

    // Get base URL for internal API calls
    const url = new URL(request.url);
    const baseURL = `${url.protocol}//${url.host}`;

    // Create problem in database
    const [problem] = await sql`
      INSERT INTO problems (problem_text, problem_image_url)
      VALUES (${problemText || ""}, ${imageUrl || null})
      RETURNING *
    `;

    // Analyze the problem with AI to generate solution
    let extractedText = problemText;

    if (imageUrl) {
      // Read image from URL and convert to base64
      const imageResponse = await fetch(imageUrl);
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString("base64");
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";

      const visionMessages = [{
        role: "user",
        content: [
          {
            type: "text",
            text: problemText || "Extract the physics problem from this image. Include all numbers, units, and details. Describe any diagrams shown.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      }];

      const visionResponse = await fetch(`${baseURL}/api/integrations/gpt-vision/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: visionMessages }),
      });

      if (!visionResponse.ok) {
        console.error("Vision API error:", await visionResponse.text());
        throw new Error("Failed to analyze image");
      }

      const visionData = await visionResponse.json();
      extractedText = visionData.choices[0].message.content;

      // Update problem text if it was extracted from image
      if (!problemText) {
        await sql`
          UPDATE problems
          SET problem_text = ${extractedText}
          WHERE id = ${problem.id}
        `;
        problem.problem_text = extractedText;
      }
    }

    // Generate structured solution using ChatGPT
    const solutionMessages = [
      {
        role: "system",
        content: `You are a physics tutor. Analyze the problem and provide a structured solution with clear steps. 
        
Focus on physics concepts like:
- Forces and free body diagrams
- Motion and kinematics
- Energy conservation
- Momentum
- Electricity and magnetism
- Waves and optics

Provide step-by-step reasoning with formulas.`,
      },
      {
        role: "user",
        content: `Solve this physics problem step by step: ${problem.problem_text || extractedText}`,
      },
    ];

    const chatResponse = await fetch(
      `${baseURL}/api/integrations/chat-gpt/conversationgpt4`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: solutionMessages,
          json_schema: {
            name: "physics_solution",
            schema: {
              type: "object",
              properties: {
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      explanation: { type: "string" },
                      formula: { type: ["string", "null"] },
                    },
                    required: ["title", "explanation", "formula"],
                    additionalProperties: false,
                  },
                },
                final_answer: { type: "string" },
              },
              required: ["steps", "final_answer"],
              additionalProperties: false,
            },
            strict: true,
          },
        }),
      },
    );

    if (!chatResponse.ok) {
      throw new Error("Failed to generate solution");
    }

    const chatData = await chatResponse.json();
    
    // Handle both JSON string and object responses
    let solutionData;
    const content = chatData.choices[0]?.message?.content;
    if (typeof content === 'string') {
      try {
        solutionData = JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse solution JSON:", e);
        throw new Error("Invalid solution format from AI");
      }
    } else {
      solutionData = content;
    }

    // Store solution and steps
    const [solution] = await sql`
      INSERT INTO solutions (problem_id, final_answer)
      VALUES (${problem.id}, ${solutionData.final_answer})
      RETURNING *
    `;

    // Store steps
    for (let i = 0; i < solutionData.steps.length; i++) {
      const step = solutionData.steps[i];
      await sql`
        INSERT INTO solution_steps (solution_id, step_number, title, explanation, formula)
        VALUES (${solution.id}, ${i + 1}, ${step.title}, ${step.explanation}, ${step.formula})
      `;
    }

    // Auto-generate visuals in the background (don't wait for completion)
    generateVisualsAsync(baseURL, problem.id);

    return Response.json({
      success: true,
      problemId: problem.id,
    });
  } catch (error) {
    console.error("Error analyzing problem:", error);
    return Response.json(
      { error: "Failed to analyze problem" },
      { status: 500 },
    );
  }
}
