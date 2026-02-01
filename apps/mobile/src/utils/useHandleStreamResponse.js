import * as React from 'react';

function useHandleStreamResponse({
  onChunk,
  onFinish
}) {
  const handleStreamResponse = React.useCallback(
    async (response) => {
      if (!response.body) {
        console.error("No response body");
        onFinish("Error: No response from server");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process any remaining buffer
            if (buffer.trim()) {
              const lines = buffer.split('\n');
              for (const line of lines) {
                const content = extractContent(line);
                if (content !== null) {
                  fullContent += content;
                }
              }
            }
            onFinish(fullContent);
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Keep incomplete line in buffer
          
          for (const line of lines) {
            const content = extractContent(line);
            if (content !== null) {
              fullContent += content;
              onChunk(fullContent);
            }
          }
        }
      } catch (error) {
        console.error("Stream reading error:", error);
        onFinish(fullContent || "Error reading stream. Please try again.");
      }
    },
    [onChunk, onFinish]
  );
  
  const handleStreamResponseRef = React.useRef(handleStreamResponse);
  React.useEffect(() => {
    handleStreamResponseRef.current = handleStreamResponse;
  }, [handleStreamResponse]);
  
  return React.useCallback((response) => handleStreamResponseRef.current(response), []); 
}

// Extract content from a streaming line
function extractContent(line) {
  if (!line || line.trim() === '') return null;
  
  // Handle "data: [DONE]"
  if (line.trim() === 'data: [DONE]') return null;
  
  // Handle "data: <content>" format (our custom format - plain text after data:)
  if (line.startsWith('data: ')) {
    const content = line.slice(6); // Get everything after "data: "
    
    // Try to parse as JSON first (OpenAI format)
    try {
      const json = JSON.parse(content);
      // OpenAI streaming format: {"choices":[{"delta":{"content":"text"}}]}
      const deltaContent = json.choices?.[0]?.delta?.content;
      if (deltaContent !== undefined) {
        return deltaContent;
      }
      // Non-streaming format: {"choices":[{"message":{"content":"text"}}]}
      const messageContent = json.choices?.[0]?.message?.content;
      if (messageContent !== undefined) {
        return messageContent;
      }
      return null;
    } catch (e) {
      // Not JSON, treat as plain text - preserve the content exactly as is
      return content;
    }
  }
  
  // Handle lines that don't start with "data: " (shouldn't happen but just in case)
  return null;
}

export default useHandleStreamResponse;
