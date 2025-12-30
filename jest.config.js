export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.ts'],
  testTimeout: 10000, // 10 second timeout for tests
  maxWorkers: 1, // Run tests serially to avoid resource conflicts
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^../lib/supabase$': '<rootDir>/src/__mocks__/lib/supabase.ts',
    '^../lib/convex$': '<rootDir>/src/__mocks__/lib/convex.ts',
    '^../config/environment$': '<rootDir>/src/__mocks__/config/environment.ts',
    '^./lib/supabase$': '<rootDir>/src/__mocks__/lib/supabase.ts',
    '^./lib/convex$': '<rootDir>/src/__mocks__/lib/convex.ts',
    '^./config/environment$': '<rootDir>/src/__mocks__/config/environment.ts',
    '^../../convex/_generated/api$': '<rootDir>/src/__mocks__/convex/_generated/api.ts',
    '^../convex/_generated/api$': '<rootDir>/src/__mocks__/convex/_generated/api.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.app.json',
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|convex)/)',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
}