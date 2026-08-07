/// <reference path="../../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface Window {
  RayScroll: {
    add(handler: () => void): void;
    remove(handler: () => void): void;
  };
}

declare class Lenis {
  constructor(options: Record<string, unknown>);
  raf(time: number): void;
  start(): void;
  stop(): void;
  scrollTo(target: number | Element, options?: Record<string, unknown>): void;
}
