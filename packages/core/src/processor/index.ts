/**
 * Processor Module
 *
 * Exports ComponentProcessor and related types for orchestrating
 * the full extraction-generation-build pipeline.
 *
 * All methods throw on error - no discriminated unions.
 */

// Main processor
export {
  ComponentProcessor,
  createComponentProcessor,
} from './component-processor.js';

// =============================================================================
// Types
// =============================================================================

export type {
  // Build phase
  BuildInput,
  BuildResult,
  // Extraction phase
  ExtractResult,
  // Generation phase
  GenerateInput,
  GenerateResult,
} from './types.js';

// =============================================================================
// Common Types (Shared across APIs)
// =============================================================================

export type {
  ExtractionMetadata,
  ProcessorConfig,
  ProcessorInput,
  ProcessorResult,
} from './types.js';

// =============================================================================
// Manifest Builder Types (for build() return type)
// =============================================================================

export type { ManifestBuilderResult } from '../manifest/index.js';
