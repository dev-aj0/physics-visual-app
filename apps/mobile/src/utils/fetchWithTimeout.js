/**
 * Fetch with timeout. Aborts the request if it takes longer than ms.
 * @param {string} url - URL to fetch
 * @param {Object} options - fetch options (method, headers, body, etc.)
 * @param {number} ms - timeout in milliseconds (default: 15000)
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, ms = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw error;
  }
}

export default fetchWithTimeout;
