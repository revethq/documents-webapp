import { defineConfig } from 'orval';

export default defineConfig({
  kala: {
    input: {
      target: 'http://localhost:5051/openapi?format=json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/lib/api/generated',
      schemas: 'src/lib/api/models',
      client: 'react-query',
      httpClient: 'fetch',
      mock: false,
      baseUrl: 'http://localhost:5051',
      override: {
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
