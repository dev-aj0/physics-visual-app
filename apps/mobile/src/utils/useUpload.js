import * as React from "react";
import { fetchWithTimeout } from "./fetchWithTimeout";

function useUpload() {
  const [loading, setLoading] = React.useState(false);
  const upload = React.useCallback(async (input) => {
    try {
      setLoading(true);
      const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
      if (!baseURL) {
        return { error: "EXPO_PUBLIC_BASE_URL is not configured" };
      }

      if ("reactNativeAsset" in input && input.reactNativeAsset) {
        const asset = input.reactNativeAsset;
        const formData = new FormData();
        const uri = asset.uri;
        const name = asset.name ?? uri.split("/").pop() ?? "image.jpg";
        const mimeType = asset.mimeType ?? "image/jpeg";

        formData.append("file", {
          uri,
          name,
          type: mimeType,
        });

        const response = await fetchWithTimeout(`${baseURL}/api/upload`, {
          method: "POST",
          body: formData,
        }, 30000);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 413) {
            throw new Error("File too large. Max 10MB.");
          }
          throw new Error(errData.error || "Upload failed");
        }

        const data = await response.json();
        return { url: data.url, mimeType: data.mimeType || null };
      }

      if ("base64" in input) {
        const response = await fetchWithTimeout(`${baseURL}/api/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64: input.base64 }),
        }, 30000);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Upload failed");
        }

        const data = await response.json();
        return { url: data.url, mimeType: data.mimeType || null };
      }

      if ("url" in input) {
        return { url: input.url, mimeType: null };
      }

      return { error: "Invalid upload input" };
    } catch (uploadError) {
      if (uploadError instanceof Error) {
        return { error: uploadError.message };
      }
      if (typeof uploadError === "string") {
        return { error: uploadError };
      }
      return { error: "Upload failed" };
    } finally {
      setLoading(false);
    }
  }, []);

  return [upload, { loading }];
}

export { useUpload };
export default useUpload;
