import { defineConfig } from 'orval';

export default defineConfig({
  kala: {
    input: {
      target: './openapi.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/lib/api/generated',
      schemas: 'src/lib/api/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      baseUrl: '',
      override: {
        mutator: {
          path: 'src/lib/api/client.ts',
          name: 'apiFetch',
        },
        query: {
          useQuery: true,
          useSuspenseQuery: false,
          signal: true,
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
  },
});
