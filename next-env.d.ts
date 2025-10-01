/// <reference types="next" />
/// <reference types="next/image-types/global" />
/// <reference types="next/navigation-types/compat/navigation" />

declare module '*.md' {
  const content: string;
  export default content;
}

// NOTE: This file should not be edited
