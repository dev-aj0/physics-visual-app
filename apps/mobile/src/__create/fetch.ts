import { fetch as expoFetch } from 'expo/fetch';

const originalFetch = fetch;

const getURLFromArgs = (...args: Parameters<typeof fetch>) => {
  const [urlArg] = args;
  if (typeof urlArg === 'string') {
    return urlArg;
  } else if (typeof urlArg === 'object' && urlArg !== null) {
    return urlArg.url;
  }
  return null;
};

const isFileURL = (url: string) => {
  return url.startsWith('file://') || url.startsWith('data:');
};

type Params = Parameters<typeof expoFetch>;

const fetchToWeb = async function fetchWithHeaders(...args: Params) {
  const [input, init] = args;
  const url = getURLFromArgs(input, init);
  
  if (!url) {
    return expoFetch(input, init);
  }

  // Use original fetch for file URLs
  if (isFileURL(url)) {
    return originalFetch(input, init);
  }

  // For all HTTP/HTTPS URLs, use expo fetch directly
  if (typeof input === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
    return expoFetch(input, init);
  }

  // For relative paths starting with /api/, prepend base URL
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
  if (typeof input === 'string' && input.startsWith('/api/') && baseURL) {
    return expoFetch(`${baseURL}${input}`, init);
  }

  // For relative paths starting with /, prepend base URL
  if (typeof input === 'string' && input.startsWith('/') && baseURL) {
    return expoFetch(`${baseURL}${input}`, init);
  }

  // Default: use expo fetch
  return expoFetch(input, init);
};

export default fetchToWeb;
