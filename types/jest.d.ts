/// <reference types="jest" />

declare global {
  const jest: typeof import('jest')
  const expect: jest.Expect
  const describe: jest.Describe
  const it: jest.It
  const beforeEach: jest.Lifecycle
  const afterEach: jest.Lifecycle
  const beforeAll: jest.Lifecycle
  const afterAll: jest.Lifecycle
  const test: jest.It
}

export {}