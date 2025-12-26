# File Upload System Plan

## Overview

This document outlines the implementation plan for the file upload system in Kala WebApp, using S3 presigned URLs and the auto-generated API hooks from Orval.

---

## Available Backend API Hooks

### 1. `usePostApiV1FilesInitiateUpload()` - Request Presigned URL

**Request:**
```typescript
{
  documentId?: number;        // Optional: for adding new version to existing doc
  fileName: string;           // File name
  contentType?: string;       // MIME type (e.g., "application/pdf")
  description?: string;       // Optional description
}
```

**Response:**
```typescript
{
  uploadUrl: string;           // S3 presigned URL for direct upload
  s3Key: string;              // S3 object key
  documentVersionUuid: string; // Document version identifier
  expiresInMinutes?: number;  // URL expiration time
}
```

### 2. `usePostApiV1FilesCompleteUpload()` - Mark Upload Complete

**Request:**
```typescript
{
  documentVersionUuid: string; // From initiate response
}
```

**Response:**
```typescript
{
  documentVersion: DocumentVersionDTO; // Full document version details
}
```

### 3. `useGetApiV1FilesDownloadDocumentVersionUuid(uuid)` - Download File

Query hook for downloading file by document version UUID.

---

## Upload Flow

```
┌─────────────┐
│ User selects│
│    file     │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 1. Request Presigned URL            │
│    POST /api/v1/files/initiate      │
│    { fileName, contentType, ... }   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 2. Upload to S3                     │
│    PUT {presignedUrl}               │
│    Track progress with XHR          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 3. Notify Backend                   │
│    POST /api/v1/files/complete      │
│    { documentVersionUuid }          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ 4. Upload Complete                  │
│    Document version ready           │
└─────────────────────────────────────┘
```

---

## Implementation Components

### 1. Custom Hook: `useFileUpload`

**Location:** `src/hooks/useFileUpload.ts`

**Purpose:** Orchestrates the 3-step upload process and manages state

**State:**
```typescript
interface UploadProgress {
  state: 'idle' | 'initiating' | 'uploading' | 'completing' | 'complete' | 'error';
  progress: number;  // 0-100
  error?: string;
}
```

**API:**
```typescript
const { uploadFile, progress, reset } = useFileUpload();

await uploadFile(file, {
  documentId?: number;
  description?: string;
  onProgress?: (percent: number) => void;
});
```

**Implementation:**
```typescript
export function useFileUpload() {
  const [progress, setProgress] = useState<UploadProgress>({
    state: 'idle',
    progress: 0
  });

  const initiateUpload = usePostApiV1FilesInitiateUpload();
  const completeUpload = usePostApiV1FilesCompleteUpload();

  const uploadFile = async (file: File, options?) => {
    // Step 1: Initiate
    setProgress({ state: 'initiating', progress: 0 });
    const { uploadUrl, documentVersionUuid } = await initiateUpload.mutateAsync({
      data: {
        fileName: file.name,
        contentType: file.type,
        description: options?.description,
        documentId: options?.documentId
      }
    });

    // Step 2: Upload to S3
    setProgress({ state: 'uploading', progress: 0 });
    await uploadToS3(uploadUrl, file, {
      onProgress: (percent) => {
        setProgress({ state: 'uploading', progress: percent });
        options?.onProgress?.(percent);
      }
    });

    // Step 3: Complete
    setProgress({ state: 'completing', progress: 100 });
    const result = await completeUpload.mutateAsync({
      data: { documentVersionUuid }
    });

    setProgress({ state: 'complete', progress: 100 });
    return result.data;
  };

  return { uploadFile, progress, reset };
}
```

---

### 2. S3 Upload Helper: `uploadToS3`

**Purpose:** Direct upload to S3 with progress tracking using XMLHttpRequest

**Why XHR instead of fetch?**
- `fetch()` doesn't support upload progress events
- XHR provides `upload.onprogress` event for tracking

**Implementation:**
```typescript
async function uploadToS3(
  presignedUrl: string,
  file: File,
  options: { onProgress?: (percent: number) => void }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        options.onProgress?.(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

    // PUT request with file as body
    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}
```

---

### 3. UI Component: `FileUploadZone`

**Location:** `src/components/file-upload-zone.tsx`

**Features:**
- Drag and drop support
- File picker fallback
- Progress bar with percentage
- State-based UI (idle, uploading, complete, error)
- Visual feedback for each state

**Props:**
```typescript
interface FileUploadZoneProps {
  documentId?: number;        // Optional: for new version
  onComplete?: (result: any) => void; // Callback on success
}
```

**States:**
1. **Idle** - Drag & drop zone with upload icon
2. **Initiating** - "Preparing upload..." spinner
3. **Uploading** - Progress bar with percentage
4. **Completing** - "Finalizing..." message
5. **Complete** - Success message with "Upload another" button
6. **Error** - Error message with "Try again" button

**Visual Design:**
```
┌─────────────────────────────────────┐
│         ⬆ Upload Icon               │
│                                     │
│   Drop file here or click to upload│
│   PDF, Word, Excel up to 100MB     │
│                                     │
└─────────────────────────────────────┘

         ↓ (when uploading)

┌─────────────────────────────────────┐
│ Uploading... 47%                    │
│ ████████████░░░░░░░░░░░░░░░         │
└─────────────────────────────────────┘

         ↓ (when complete)

┌─────────────────────────────────────┐
│ ✓ Upload complete!                  │
│ [Upload another file]               │
└─────────────────────────────────────┘
```

---

## Usage Examples

### Example 1: Upload New Document

```typescript
import FileUploadZone from '@/components/file-upload-zone';

function NewDocumentPage() {
  const handleComplete = (result: any) => {
    console.log('Document created:', result.documentVersion);
    router.push(`/documents/${result.documentVersion.documentId}`);
  };

  return (
    <div>
      <h1>Upload New Document</h1>
      <FileUploadZone onComplete={handleComplete} />
    </div>
  );
}
```

### Example 2: Add New Version to Existing Document

```typescript
function DocumentDetailPage({ documentId }: { documentId: number }) {
  const queryClient = useQueryClient();

  const handleComplete = () => {
    // Refresh document versions list
    queryClient.invalidateQueries(['document-versions', documentId]);
  };

  return (
    <div>
      <h2>Add New Version</h2>
      <FileUploadZone
        documentId={documentId}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

---

## Advanced Features (Future Enhancements)

### 1. Multiple File Upload Queue

```typescript
interface UploadQueue {
  files: Array<{
    id: string;
    file: File;
    state: UploadState;
    progress: number;
  }>;
  concurrent: number; // Upload N files at once
}
```

### 2. Retry Logic

```typescript
async function uploadWithRetry(
  uploadFn: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      await sleep(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
```

### 3. Chunked Upload (for large files)

```typescript
// For files > 100MB, split into chunks
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB

async function uploadInChunks(file: File, urls: string[]) {
  const chunks = Math.ceil(file.size / CHUNK_SIZE);

  for (let i = 0; i < chunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    await uploadToS3(urls[i], chunk, {
      onProgress: (p) => updateOverallProgress(i, chunks, p)
    });
  }
}
```

### 4. Pause/Resume Upload

```typescript
// Store XHR reference to abort
let currentXHR: XMLHttpRequest | null = null;

function pauseUpload() {
  currentXHR?.abort();
}

function resumeUpload() {
  // Re-request presigned URL and continue
}
```

### 5. Client-Side Validation

```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'image/jpeg',
  'image/png',
  // etc.
];

function validateFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return 'File size exceeds 100MB limit';
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'File type not supported';
  }
  return null;
}
```

---

## Error Handling

### Error Types

```typescript
type UploadError =
  | 'PRESIGNED_URL_FAILED'   // Backend didn't return URL
  | 'S3_UPLOAD_FAILED'       // S3 rejected upload
  | 'COMPLETE_FAILED'        // Backend didn't confirm
  | 'FILE_TOO_LARGE'         // Client-side validation
  | 'INVALID_FILE_TYPE'      // Client-side validation
  | 'NETWORK_ERROR'          // Connection lost
  | 'EXPIRED_URL';           // Presigned URL expired
```

### Error Recovery

```typescript
function handleUploadError(error: UploadError, context: any) {
  switch (error) {
    case 'S3_UPLOAD_FAILED':
      // Retry upload to S3
      return retryS3Upload(context);

    case 'COMPLETE_FAILED':
      // File is on S3 but backend doesn't know
      // Retry confirmation
      return retryComplete(context);

    case 'EXPIRED_URL':
      // Request new presigned URL and retry
      return restartUpload(context);

    case 'NETWORK_ERROR':
      // Wait and retry
      return scheduleRetry(context);

    default:
      // Show error to user
      return showError(error);
  }
}
```

---

## Testing Checklist

- [ ] Upload small file (< 1MB)
- [ ] Upload large file (> 10MB)
- [ ] Upload with slow network (throttling)
- [ ] Cancel upload mid-progress
- [ ] Upload with network interruption
- [ ] Upload invalid file type
- [ ] Upload file exceeding size limit
- [ ] Upload same file twice
- [ ] Upload to existing document (new version)
- [ ] Upload to new document
- [ ] Multiple concurrent uploads
- [ ] Dark mode support
- [ ] Mobile responsiveness

---

## Security Considerations

1. **File Type Validation**
   - Client-side: Check MIME type before upload
   - Server-side: Validate file content (not just extension)

2. **Size Limits**
   - Enforced by presigned URL policy
   - Client-side validation for better UX

3. **Presigned URL Expiration**
   - URLs expire after N minutes
   - Handle expiration gracefully

4. **Virus Scanning**
   - Backend should scan uploaded files (ClamAV)
   - Don't mark as "ready" until scan complete

5. **Rate Limiting**
   - Limit presigned URL requests per user
   - Prevent abuse

---

## Performance Optimizations

1. **Concurrent Uploads**
   - Upload multiple files in parallel (limit: 3-5)

2. **Progress Debouncing**
   - Update UI every 100ms, not on every progress event

3. **Lazy Loading**
   - Load upload component only when needed

4. **Cancel Unused Requests**
   - Abort XHR if user navigates away

---

## File Structure

```
src/
├── hooks/
│   └── useFileUpload.ts          # Main upload orchestration
├── components/
│   └── file-upload-zone.tsx      # UI component
├── lib/
│   └── upload-helpers.ts         # S3 upload, validation
└── types/
    └── upload.ts                 # TypeScript types
```

---

## Dependencies

- ✅ **@tanstack/react-query** - Already installed
- ✅ **Generated API hooks** - Already generated via Orval
- ✅ **Heroicons** - Already installed for icons
- ⬜ **react-dropzone** (optional) - For enhanced drag & drop

---

## Next Steps

1. Create `src/hooks/useFileUpload.ts`
2. Create `src/components/file-upload-zone.tsx`
3. Add to documents page
4. Test with backend
5. Add validation and error handling
6. Implement advanced features (queue, retry, etc.)

---

## Notes

- The backend API is simpler than expected - only 2 endpoints!
- Using PUT upload (not FormData) - cleaner implementation
- UUID-based confirmation instead of S3 key
- All types auto-generated from OpenAPI spec
- React Query provides built-in retry and error handling
