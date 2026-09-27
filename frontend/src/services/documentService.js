import { api, uploadToPresignedUrl } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { demoDocuments } from "../data/demoDocuments.js";

let demoCopy = demoDocuments.map((d) => ({ ...d }));
let nextId = 100;

function isDemoMode() {
  return !import.meta.env.VITE_API_BASE_URL;
}

/** Returns the current Supabase user.id to use as session_id. */
async function getSessionId() {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export const documentService = {
  async getDocuments() {
    if (isDemoMode()) return [...demoCopy];
    const session_id = await getSessionId();
    return api.get(`/documents?session_id=${session_id}`).then((r) => r.documents);
  },

  async getDocument(documentId) {
    if (isDemoMode()) {
      const doc = demoCopy.find((d) => d.document_id === documentId);
      if (!doc) throw new Error("Document not found");
      return { ...doc };
    }
    const session_id = await getSessionId();
    return api.get(`/documents/${documentId}?session_id=${session_id}`);
  },

  async processDocument(documentId) {
    if (isDemoMode()) return { status: "queued" };
    const session_id = await getSessionId();
    return api.post(`/documents/${documentId}/process`, { session_id });
  },
};

export const uploadService = {
  /**
   * Step 1: Request a presigned upload URL from the FastAPI backend.
   * The backend verifies the Supabase JWT and returns { upload_url, document_id, s3_key }.
   */
  async getPresignedUrl(filename) {
    if (isDemoMode()) {
      await delay(300);
      const documentId = `doc-${Date.now()}-${nextId++}`;
      return { upload_url: null, document_id: documentId, s3_key: `uploads/${filename}` };
    }
    const session_id = await getSessionId();
    return api.post("/documents/upload-url", { session_id, filename });
  },

  async uploadFile(uploadUrl, file, onProgress) {
    if (!uploadUrl) {
      for (let i = 0; i <= 100; i += 20) {
        await delay(150);
        onProgress?.(i);
      }
      return;
    }
    return uploadToPresignedUrl(uploadUrl, file, onProgress);
  },

  async uploadDocument(file, onProgress) {
    const { upload_url, document_id, s3_key } = await this.getPresignedUrl(file.name);
    await this.uploadFile(upload_url, file, onProgress);

    if (isDemoMode()) {
      const newDoc = {
        document_id,
        filename: file.name,
        s3_key,
        uploaded_at: new Date().toISOString(),
        status: "processing",
        tasks_generated: 0,
        type: file.name.split(".").pop().toLowerCase(),
        pages: null,
      };
      demoCopy = [newDoc, ...demoCopy];
      setTimeout(() => {
        demoCopy = demoCopy.map((d) =>
          d.document_id === document_id
            ? { ...d, status: "ready", tasks_generated: 2, pages: 3 }
            : d
        );
      }, 4000);
      return newDoc;
    }

    // Trigger backend processing (Textract OCR -> AI extraction -> DynamoDB)
    documentService.processDocument(document_id).catch((err) => {
      console.error("Document processing error:", err);
    });

    return { document_id, s3_key };
  },
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
