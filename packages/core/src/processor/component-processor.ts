/**
 * Component Processor
 *
 * Provides both full pipeline and atomic operations for component processing:
 * - process(): Full pipeline - extract -> generate -> build
 * - extract(): Extract props, variants, dependencies from source code
 * - generate(): Generate semantic metadata using LLM
 * - build(): Combine extraction and generation into a manifest
 *
 * All methods throw on error - no discriminated unions.
 */

import {
  type ExtractionInput,
  type ExtractorResult,
  getExtractor,
  type IExtractor,
} from '../extractor/index.js';
import {
  type GeneratorInput,
  MetaGenerator,
  type MetaGeneratorConfig,
} from '../generator/index.js';
import {
  ManifestBuilder,
  type ManifestBuilderInput,
  type ManifestBuilderResult,
} from '../manifest/index.js';
import { ExtractionError } from '../types/errors.js';
import { createLogger } from '../utils/logger.js';

import type {
  BuildInput,
  BuildResult,
  ExtractResult,
  GenerateInput,
  GenerateResult,
  ProcessorConfig,
  ProcessorInput,
  ProcessorResult,
} from './types.js';

const logger = createLogger({ name: 'component-processor' });

// =============================================================================
// Component Processor
// =============================================================================

/**
 * ComponentProcessor provides operations for component processing.
 *
 * Two usage modes:
 *
 * 1. **Full Pipeline** - Use `process()` for complete extraction -> generation -> build:
 *    ```typescript
 *    const result = await processor.process(input);
 *    console.log(result.manifest);
 *    ```
 *
 * 2. **Atomic Operations** - Use individual methods for fine-grained control:
 *    - extract(): Extracts props, variants, and dependencies from source code
 *    - generate(): Generates semantic metadata using LLM
 *    - build(): Combines extraction and generation into a complete manifest
 *
 * All methods throw on error - use try/catch for error handling.
 *
 * @example
 * ```typescript
 * const processor = new ComponentProcessor();
 *
 * // Option 1: Full pipeline
 * const result = await processor.process(input);
 *
 * // Option 2: Step-by-step for more control
 * const extractResult = await processor.extract(input);
 * const genResult = await processor.generate({
 *   orgId: input.orgId,
 *   identity: extractResult.identity,
 *   extracted: extractResult.extracted,
 *   sourceHash: extractResult.sourceHash,
 * });
 * const buildResult = processor.build({
 *   orgId: input.orgId,
 *   identity: extractResult.identity,
 *   extracted: extractResult.extracted,
 *   meta: genResult.meta,
 *   sourceHash: extractResult.sourceHash,
 * });
 * ```
 */
export class ComponentProcessor {
  private readonly extractor: IExtractor;
  private readonly metaGenerator: MetaGenerator;
  private readonly manifestBuilder: ManifestBuilder;

  /**
   * Create a new ComponentProcessor instance
   *
   * @param config - Optional configuration for the processor
   */
  constructor(config: ProcessorConfig = {}) {
    // Initialize extractor with optional custom options
    // Default framework is 'react' - the processor uses this for all extractions
    this.extractor = getExtractor('react', config.extractorOptions);

    // Initialize meta generator with optional custom provider
    const generatorConfig: MetaGeneratorConfig = {
      provider: config.llmProvider,
      maxTokens: config.maxGenerationTokens,
    };
    this.metaGenerator = new MetaGenerator(generatorConfig);

    // Initialize manifest builder
    this.manifestBuilder = new ManifestBuilder();

    logger.debug('ComponentProcessor initialized', {
      hasCustomProvider: !!config.llmProvider,
      hasExtractorOptions: !!config.extractorOptions,
    });
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Process a component through the full pipeline.
   *
   * Orchestrates extraction -> generation -> build in sequence.
   * Returns a complete ProcessorResult with manifest.
   *
   * @param input - Processing input with source code and context
   * @returns ProcessorResult with manifest
   * @throws ExtractionError if extraction fails
   * @throws MetaGenerationError if generation fails
   * @throws ManifestBuildError if manifest building fails
   *
   * @example
   * ```typescript
   * const result = await processor.process({
   *   orgId: 'org-123',
   *   name: 'Button',
   *   sourceCode: buttonSourceCode,
   *   framework: 'react',
   * });
   *
   * console.log(result.manifest);
   * ```
   */
  async process(input: ProcessorInput): Promise<ProcessorResult> {
    logger.info('Starting full pipeline processing', {
      orgId: input.orgId,
      name: input.name,
      framework: input.framework ?? 'react',
    });

    // Step 1: Extract (throws on error)
    const extractResult = await this.extract(input);

    // Step 2: Generate (throws on error)
    const genResult = await this.generate({
      orgId: input.orgId,
      identity: extractResult.identity,
      extracted: extractResult.extracted,
      sourceHash: extractResult.sourceHash,
      hints: input.hints,
    });

    // Step 3: Build (throws on error)
    const buildResult = this.build({
      orgId: input.orgId,
      identity: extractResult.identity,
      extracted: extractResult.extracted,
      meta: genResult.meta,
      sourceHash: extractResult.sourceHash,
      availableComponents: input.availableComponents,
    });

    logger.info('Full pipeline processing completed', {
      orgId: input.orgId,
      name: input.name,
      id: buildResult.identity.id,
    });

    return {
      componentName: buildResult.componentName,
      identity: buildResult.identity,
      manifest: buildResult.manifest,
      sourceHash: buildResult.sourceHash,
      files: buildResult.files,
      extraction: extractResult.metadata,
    };
  }

  /**
   * Extract component metadata without LLM generation.
   *
   * This is Phase 1 of the two-phase API. Use this when you want to:
   * - Extract metadata quickly without waiting for LLM
   * - Store extraction results for later generation
   * - Batch extractions before running generation
   *
   * @param input - Processing input with source code
   * @returns ExtractResult with identity, extracted data, and metadata
   * @throws ExtractionError if extraction fails
   *
   * @example
   * ```typescript
   * const extractResult = await processor.extract(input);
   * // Later: run generation
   * const genResult = await processor.generate({
   *   orgId: input.orgId,
   *   identity: extractResult.identity,
   *   extracted: extractResult.extracted,
   *   sourceHash: extractResult.sourceHash,
   * });
   * ```
   */
  async extract(input: ProcessorInput): Promise<ExtractResult> {
    const framework = input.framework ?? 'react';

    logger.info('Starting extraction', {
      orgId: input.orgId,
      name: input.name,
      framework,
    });

    // Validate framework
    if (framework !== 'react') {
      throw new ExtractionError(
        `Unsupported framework: ${framework}. Only 'react' is supported.`,
        { componentName: input.name }
      );
    }

    // Build extraction input
    const extractionInput: ExtractionInput = {
      orgId: input.orgId,
      name: input.name,
      sourceCode: input.sourceCode,
      framework,
      filePath: input.filePath,
      existingId: input.existingId,
      storiesCode: input.storiesCode,
      storiesFilePath: input.storiesFilePath,
    };

    // Run extraction (throws on error)
    const output: ExtractorResult =
      await this.extractor.extract(extractionInput);

    logger.info('Extraction completed', {
      id: output.identity.id,
      name: output.identity.name,
      fallbackTriggered: output.fallbackTriggered,
    });

    return {
      id: output.identity.id,
      slug: output.identity.slug,
      identity: output.identity,
      extracted: output.data,
      sourceHash: output.sourceHash,
      metadata: {
        fallbackTriggered: output.fallbackTriggered,
        fallbackReason: output.fallbackReason,
        extractionMethod: output.extractionMethod,
      },
    };
  }

  /**
   * Generate LLM metadata from extraction results.
   *
   * This is Phase 2 of the two-phase API. Use after extract() to:
   * - Add semantic descriptions and patterns
   * - Generate usage examples
   * - Enrich metadata with AI insights
   *
   * Returns only the generation result (not a manifest). Use build()
   * to combine extraction and generation into a complete manifest.
   *
   * @param input - Generation input with extracted data from extract()
   * @returns GenerateResult with meta
   * @throws MetaGenerationError if generation fails
   *
   * @example
   * ```typescript
   * const genResult = await processor.generate(input);
   * // Build the final manifest
   * const buildResult = processor.build({
   *   orgId: input.orgId,
   *   identity: extractResult.identity,
   *   extracted: extractResult.extracted,
   *   meta: genResult.meta,
   *   sourceHash: extractResult.sourceHash,
   * });
   * ```
   */
  async generate(input: GenerateInput): Promise<GenerateResult> {
    logger.info('Starting generation', {
      orgId: input.orgId,
      name: input.identity.name,
      framework: input.identity.framework,
    });

    // Build generator input
    const generatorInput: GeneratorInput = {
      orgId: input.orgId,
      name: input.identity.name,
      framework: input.identity.framework,
      extracted: input.extracted,
      hints: input.hints,
    };

    // Run generation (throws on error)
    const genResult = await this.metaGenerator.generate(generatorInput);

    logger.info('Generation completed', {
      name: input.identity.name,
      provider: genResult.provider,
      model: genResult.model,
    });

    return {
      meta: genResult.meta,
      provider: genResult.provider,
      model: genResult.model,
    };
  }

  /**
   * Build manifest from extraction and generation results.
   *
   * This is the final phase that combines extracted data with
   * LLM-generated metadata into a complete manifest.
   *
   * @param input - Build input with extraction and generation results
   * @returns BuildResult with output and manifest
   * @throws ManifestBuildError if building fails
   *
   * @example
   * ```typescript
   * const buildResult = processor.build({
   *   orgId: 'org-123',
   *   identity: extractResult.identity,
   *   extracted: extractResult.extracted,
   *   meta: genResult.meta,
   *   sourceHash: extractResult.sourceHash,
   * });
   *
   * console.log(buildResult.manifest);
   * ```
   */
  build(input: BuildInput): BuildResult {
    logger.info('Building manifest', {
      orgId: input.orgId,
      name: input.identity.name,
    });

    const builderInput: ManifestBuilderInput = {
      orgId: input.orgId,
      identity: input.identity,
      extracted: input.extracted,
      meta: input.meta,
      sourceHash: input.sourceHash,
      availableComponents: input.availableComponents,
    };

    // Manifest builder now returns success directly (throws on error)
    const result: ManifestBuilderResult =
      this.manifestBuilder.build(builderInput);

    logger.info('Manifest built successfully', {
      id: result.identity.id,
      name: result.manifest.name,
    });

    return result;
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a ComponentProcessor with configuration
 *
 * @param config - Optional configuration overrides
 * @returns Configured ComponentProcessor instance
 */
export function createComponentProcessor(
  config?: ProcessorConfig
): ComponentProcessor {
  return new ComponentProcessor(config);
}
