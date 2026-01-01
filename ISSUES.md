### Findings (Ordered by Severity)

1.  **Critical (No Testing):** The entire project lacks a testing framework (`vitest`, `jest`, etc.) and test scripts. There is no foundation for unit, integration, or end-to-end testing, posing a significant risk to maintainability and stability.
    *   **File:** `package.json`

2.  **Critical (Auth & Error Handling):** The custom API fetcher is a central point of failure.
    *   **Auth:** It relies on a manually-synced token store, creating a race condition where requests can be sent with stale or missing auth headers.
    *   **Error Handling:** It throws generic errors, preventing the UI from handling different HTTP error codes (e.g., 404 vs. 500) gracefully.
    *   **File:** `src/lib/api/client.ts`

3.  **High (Inconsistent API Responses):** Components are full of defensive code to parse API responses that can be a single object, an array of objects, or a paginated object (`{ content: [...] }`). This makes frontend code brittle and unnecessarily complex.
    *   **Files:** `src/app/documents/page.tsx`, `src/app/documents/[uuid]/page.tsx`

4.  **High (Client-Side Auth Gate):** The app uses a client-side `useEffect` to guard protected routes. This results in a flicker of content and is less secure/performant than using Next.js Middleware for server-side redirects.
    *   **File:** `src/components/providers/auth-provider.tsx`

5.  **Medium (Component Complexity):** The main documents list page is a monolithic component handling data fetching, filtering, virtualization, and UI logic. This is difficult to maintain and test.
    *   **File:** `src/app/documents/page.tsx`

6.  **Medium (Generic Error UI):** The documents list page aggregates all query errors into one generic message, hiding the specific cause of failure from the user (e.g., if the Tags filter fails to load).
    *   **File:** `src/app/documents/page.tsx`

7.  **Low (Global Query Config):** React Query's `staleTime` and `refetchOnWindowFocus` are disabled globally. These powerful data-freshness features should be configured on a per-query basis to match the volatility of the data being fetched.
    *   **File:** `src/components/providers/query-provider.tsx`

8.  **Low (Styling/Code Style):** Minor inconsistencies exist in Tailwind's `dark:` mode styling and utility functions are re-defined in components instead of being shared.
    *   **Files:** `src/components/app-layout.tsx`

---

### Questions & Assumptions

1.  **Next.js Version:** `package.json` lists Next.js `v16.1.1` and React `v19.2.0`. Are these typos, or is this an internal/pre-release build? The latest stable is Next.js 14.
2.  **API Contract:** Is the inconsistent API response shape (object vs. array vs. paginated) intentional? A standardized response wrapper (e.g., always returning a paginated structure) would simplify the frontend significantly.
3.  **State Preservation:** Is there a requirement to preserve filter/search state across pages? The current implementation uses local component state, which is lost on navigation.

---

### Concise Change Summary

1.  **Testing:** Introduce a testing framework (e.g., `vitest`) and write initial unit tests for critical utilities like `apiFetch` and component tests for simple UI primitives.
2.  **Refactor `apiFetch`:**
    *   Remove the manual `token-store` and have `apiFetch` get the token directly from `react-oidc-context`'s `useAuth` hook or the underlying `UserManager`.
    *   Implement a custom `ApiError` class that includes the status code and response, and update React Query hooks to use it.
3.  **Standardize API:** Work with the backend team to standardize API responses. All list endpoints should return a consistent paginated shape.
4.  **Implement Middleware:** Replace the client-side `AuthGate` with Next.js Middleware to handle auth redirects on the server.
5.  **Refactor Components:** Break down the `DocumentsPage` into smaller, more focused components (e.g., `DocumentFilters`, `DocumentList`) and move static helper functions (`formatDate`, `formatFileSize`) to a shared `src/lib/utils.ts` file.