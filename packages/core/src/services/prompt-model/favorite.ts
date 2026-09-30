import type { FavoritePrompt } from '../favorite/types';
import type { ConversationMessage } from '../prompt/types';
import {
  PROMPT_MODEL_SCHEMA_VERSION,
  type PromptAsset,
  type PromptExample,
  type PromptImageRef,
  type PromptRunInput,
  type PromptRunOutput,
  type PromptSourceRef,
  type PromptVariable,
  type PromptVariableType,
} from './types';
import { createPromptContract, isPromptModeKey, resolvePromptModeKey } from './mode';
import { promptContentFromText } from './content';

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const asTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const asStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => asTrimmedString(item))
    .filter((item): item is string => Boolean(item));
};

const dedupeStrings = (items: string[]): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
};

const normalizeVariableType = (value: unknown): PromptVariableType | undefined => {
  if (value === 'string' || value === 'number' || value === 'boolean' || value === 'enum') {
    return value;
  }
  return undefined;
};

const parseVariable = (value: unknown): PromptVariable | null => {
  if (!isPlainObject(value)) return null;

  const name = asTrimmedString(value.name);
  if (!name) return null;

  return {
    name,
    description: asTrimmedString(value.description),
    type: normalizeVariableType(value.type),
    required: value.required === true,
    defaultValue: asTrimmedString(value.defaultValue ?? value.default ?? value.value),
    options: dedupeStrings(asStringArray(value.options)),
    source: asTrimmedString(value.source),
  };
};

const parseVariables = (value: unknown): PromptVariable[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => parseVariable(item))
      .filter((item): item is PromptVariable => Boolean(item));
  }

  if (!isPlainObject(value)) return [];

  return Object.entries(value)
    .map(([name, raw]): PromptVariable | null => {
      const normalizedName = name.trim();
      if (!normalizedName) return null;
      return {
        name: normalizedName,
        required: false,
        defaultValue: raw === undefined || raw === null ? undefined : String(raw),
        options: [],
      };
    })
    .filter((item): item is PromptVariable => Boolean(item));
};

const parseParameters = (value: unknown): Record<string, string> => {
  if (!isPlainObject(value)) return {};

  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    const normalizedKey = key.trim();
    if (!normalizedKey || raw === undefined || raw === null) continue;
    out[normalizedKey] = String(raw);
  }
  return out;
};

const parseMessages = (value: unknown): ConversationMessage[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item): ConversationMessage | null => {
      if (!isPlainObject(item)) return null;
      if (
        item.role !== 'system' &&
        item.role !== 'user' &&
        item.role !== 'assistant' &&
        item.role !== 'tool'
      ) {
        return null;
      }

      const content = typeof item.content === 'string' ? item.content : '';
      return {
        ...(asTrimmedString(item.id) ? { id: asTrimmedString(item.id) } : {}),
        role: item.role,
        content,
        ...(asTrimmedString(item.originalContent)
          ? { originalContent: asTrimmedString(item.originalContent) }
          : {}),
        ...(asTrimmedString(item.name) ? { name: asTrimmedString(item.name) } : {}),
        ...(Array.isArray(item.tool_calls) ? { tool_calls: item.tool_calls as ConversationMessage['tool_calls'] } : {}),
        ...(asTrimmedString(item.tool_call_id) ? { tool_call_id: asTrimmedString(item.tool_call_id) } : {}),
      };
    })
    .filter((item): item is ConversationMessage => Boolean(item));
};

const imageRefsFromParts = (urls: unknown, assetIds: unknown): PromptImageRef[] => [
  ...dedupeStrings(asStringArray(urls)).map((url): PromptImageRef => ({ kind: 'url', url })),
  ...dedupeStrings(asStringArray(assetIds)).map((assetId): PromptImageRef => ({
    kind: 'asset',
    assetId,
  })),
];

const parseSourceRef = (value: unknown): PromptSourceRef | undefined => {
  if (!isPlainObject(value)) return undefined;

  const kind = asTrimmedString(value.kind);
  if (
    kind !== 'workspace' &&
    kind !== 'favorite' &&
    kind !== 'garden' &&
    kind !== 'history' &&
    kind !== 'external' &&
    kind !== 'unknown'
  ) {
    return undefined;
  }

  return {
    kind,
    ...(asTrimmedString(value.id) ? { id: asTrimmedString(value.id) } : {}),
    ...(asTrimmedString(value.label) ? { label: asTrimmedString(value.label) } : {}),
    ...(asTrimmedString(value.url) ? { url: asTrimmedString(value.url) } : {}),
    ...(isPlainObject(value.metadata) ? { metadata: { ...value.metadata } } : {}),
  };
};

const parseExample = (
  value: unknown,
  favorite: FavoritePrompt,
  index: number,
  basedOnVersionId: string,
): PromptExample | null => {
  if (!isPlainObject(value)) return null;

  const text = asTrimmedString(value.text);
  const description = asTrimmedString(value.description);
  const outputText = asTrimmedString(value.outputText);
  const messages = parseMessages(value.messages);
  const parameters = parseParameters(value.parameters);
  const inputImages = imageRefsFromParts(value.inputImages, value.inputImageAssetIds);
  const outputImages = imageRefsFromParts(
    value.url ? [value.url] : value.images,
    value.imageAssetIds,
  );
  const exampleBasedOnVersionId = asTrimmedString(value.basedOnVersionId) ?? basedOnVersionId;

  const input: PromptRunInput = {};
  if (text) input.text = text;
  if (messages.length > 0) input.messages = messages;
  if (Object.keys(parameters).length > 0) input.parameters = parameters;
  if (inputImages.length > 0) input.images = inputImages;

  const output: PromptRunOutput = {};
  if (outputText) output.text = outputText;
  if (outputImages.length > 0) output.images = outputImages;

  const hasInputData = Boolean(input.text || input.messages || input.parameters || input.images);
  const hasOutputData = Boolean(output.text || output.images);
  if (!hasInputData && !hasOutputData && !description) return null;

  return {
    id: asTrimmedString(value.id) ?? `favorite:${favorite.id}:example:${index + 1}`,
    basedOnVersionId: exampleBasedOnVersionId,
    description,
    input,
    output: hasOutputData ? output : undefined,
    source: parseSourceRef(value.source) ?? { kind: 'favorite', id: favorite.id },
    metadata: isPlainObject(value.metadata) ? { ...value.metadata } : undefined,
  };
};

const parseExamples = (
  value: unknown,
  favorite: FavoritePrompt,
  basedOnVersionId: string,
): PromptExample[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => parseExample(item, favorite, index, basedOnVersionId))
    .filter((item): item is PromptExample => Boolean(item));
};

const readReproducibility = (
  metadata: Record<string, unknown> | undefined,
  favorite: FavoritePrompt,
  basedOnVersionId: string,
): {
  variables: PromptVariable[];
  examples: PromptExample[];
  sourceKind?: 'garden' | 'favorite';
} => {
  if (!metadata) {
    return { variables: [], examples: [] };
  }

  const reproducibility = isPlainObject(metadata.reproducibility)
    ? metadata.reproducibility
    : null;
  if (reproducibility) {
    return {
      variables: parseVariables(reproducibility.variables),
      examples: parseExamples(reproducibility.examples, favorite, basedOnVersionId),
      sourceKind: 'favorite',
    };
  }

  const gardenSnapshot = isPlainObject(metadata.gardenSnapshot) ? metadata.gardenSnapshot : null;
  if (gardenSnapshot) {
    const assets = isPlainObject(gardenSnapshot.assets) ? gardenSnapshot.assets : {};
    return {
      variables: parseVariables(gardenSnapshot.variables),
      examples: parseExamples(assets.examples, favorite, basedOnVersionId),
      sourceKind: 'garden',
    };
  }

  return {
    variables: parseVariables(metadata.variables),
    examples: parseExamples(metadata.examples, favorite, basedOnVersionId),
    sourceKind: 'favorite',
  };
};

const stripWorkspaceDraftReproducibility = (
  reproducibility: ReturnType<typeof readReproducibility>,
): ReturnType<typeof readReproducibility> => ({
  ...reproducibility,
  variables: reproducibility.variables.map((variable) => {
    if (variable.source !== 'workspace') return variable;
    const next: PromptVariable = {
      name: variable.name,
      required: variable.required,
      options: variable.options,
    };
    if (variable.description !== undefined) next.description = variable.description;
    if (variable.type !== undefined) next.type = variable.type;
    if (variable.source !== undefined) next.source = variable.source;
    return next;
  }),
  examples: reproducibility.examples.filter((example) => example.id !== 'workspace-current'),
});

export const isPromptAsset = (value: unknown): value is PromptAsset => {
  if (!isPlainObject(value)) return false;
  if (value.schemaVersion !== PROMPT_MODEL_SCHEMA_VERSION) return false;
  if (!asTrimmedString(value.id) || !asTrimmedString(value.title)) return false;
  if (!isPlainObject(value.contract) || !isPromptModeKey(value.contract.modeKey)) return false;
  if (!asTrimmedString(value.currentVersionId) || !Array.isArray(value.versions)) return false;
  if (!Array.isArray(value.examples)) return false;
  return typeof value.createdAt === 'number' && typeof value.updatedAt === 'number';
};

export interface PromptAssetFromFavoriteOptions {
  ignoreEmbeddedAsset?: boolean;
  stripWorkspaceDraft?: boolean;
}

const clonePromptSource = (source: PromptSourceRef | undefined): PromptSourceRef | undefined =>
  source
    ? {
        ...source,
        ...(source.metadata ? { metadata: { ...source.metadata } } : {}),
      }
    : undefined;

const clonePromptContent = (content: PromptAsset['versions'][number]['content']): PromptAsset['versions'][number]['content'] => {
  if (content.kind === 'messages') {
    return {
      kind: 'messages',
      messages: content.messages.map((message) => ({ ...message })),
    };
  }

  if (content.kind === 'image-prompt') {
    return {
      kind: 'image-prompt',
      text: content.text,
      ...(content.images ? { images: content.images.map((image) => ({ ...image })) } : {}),
    };
  }

  return { kind: 'text', text: content.text };
};

const clonePromptAssetVersions = (asset: PromptAsset): PromptAsset['versions'] =>
  asset.versions.map((version) => ({
    ...version,
    content: clonePromptContent(version.content),
    source: clonePromptSource(version.source),
    metadata: version.metadata ? { ...version.metadata } : undefined,
  }));

const clonePromptExamples = (examples: PromptExample[]): PromptExample[] =>
  examples.map((example) => ({
    ...example,
    input: {
      ...example.input,
      messages: example.input.messages?.map((message) => ({ ...message })),
      parameters: example.input.parameters ? { ...example.input.parameters } : undefined,
      images: example.input.images?.map((image) => ({ ...image })),
      metadata: example.input.metadata ? { ...example.input.metadata } : undefined,
    },
    output: example.output
      ? {
          ...example.output,
          images: example.output.images?.map((image) => ({ ...image })),
          metadata: example.output.metadata ? { ...example.output.metadata } : undefined,
        }
      : undefined,
    source: clonePromptSource(example.source),
    metadata: example.metadata ? { ...example.metadata } : undefined,
  }));

const messagesToComparableText = (messages: ConversationMessage[]): string =>
  messages
    .map((message) => ({
      role: message.role,
      content: typeof message.content === 'string' ? message.content.trim() : '',
    }))
    .filter((message) => message.content)
    .map((message) => `[${message.role}]\n${message.content}`)
    .join('\n\n');

export const promptContentToFavoriteContent = (content: PromptAsset['versions'][number]['content']): string => {
  if (content.kind === 'text' || content.kind === 'image-prompt') {
    return content.text;
  }

  return messagesToComparableText(content.messages);
};

const promptContentEquals = (
  left: PromptAsset['versions'][number]['content'],
  right: PromptAsset['versions'][number]['content'],
): boolean => {
  if (left.kind === 'text' && right.kind === 'text') {
    return left.text === right.text;
  }

  if (left.kind === 'image-prompt' && right.kind === 'image-prompt') {
    return left.text === right.text;
  }

  if (left.kind === 'messages' && right.kind === 'messages') {
    return JSON.stringify(left.messages) === JSON.stringify(right.messages);
  }

  if (left.kind === 'messages' && right.kind === 'text') {
    return messagesToComparableText(left.messages) === right.text;
  }

  if (left.kind === 'text' && right.kind === 'messages') {
    return left.text === messagesToComparableText(right.messages);
  }

  return false;
};

const hasReproducibilitySource = (metadata: Record<string, unknown> | undefined): boolean => {
  if (!metadata) return false;
  return (
    Object.prototype.hasOwnProperty.call(metadata, 'reproducibility') ||
    Object.prototype.hasOwnProperty.call(metadata, 'gardenSnapshot') ||
    Object.prototype.hasOwnProperty.call(metadata, 'variables') ||
    Object.prototype.hasOwnProperty.call(metadata, 'examples')
  );
};

const nextContentVersionNumber = (versions: PromptAsset['versions']): number =>
  versions.reduce((max, version) => Math.max(max, Number.isFinite(version.version) ? version.version : 0), 0) + 1;

const createContentVersionId = (
  favorite: FavoritePrompt,
  versionNumber: number,
): string => `favorite:${favorite.id}:version:${versionNumber}`;

const rebaseDefaultExampleVersionIds = (
  examples: PromptExample[],
  defaultVersionId: string,
  currentVersionId: string,
): PromptExample[] =>
  clonePromptExamples(examples).map((example) => (
    example.basedOnVersionId === defaultVersionId
      ? { ...example, basedOnVersionId: currentVersionId }
      : example
  ));

export const switchPromptAssetCurrentVersion = (
  asset: PromptAsset,
  versionId: string,
  updatedAt: number,
): { promptAsset: PromptAsset; content: string } | null => {
  const targetVersion = asset.versions.find((version) => version.id === versionId);
  if (!targetVersion) return null;

  return {
    promptAsset: {
      ...asset,
      currentVersionId: targetVersion.id,
      versions: clonePromptAssetVersions(asset),
      examples: clonePromptExamples(asset.examples),
      source: clonePromptSource(asset.source),
      metadata: asset.metadata ? { ...asset.metadata } : undefined,
      updatedAt,
    },
    content: promptContentToFavoriteContent(targetVersion.content),
  };
};

export const deletePromptAssetVersion = (
  asset: PromptAsset,
  versionId: string,
  updatedAt: number,
): PromptAsset | null => {
  if (asset.currentVersionId === versionId || asset.versions.length <= 1) return null;
  if (!asset.versions.some((version) => version.id === versionId)) return null;

  return {
    ...asset,
    versions: clonePromptAssetVersions(asset).filter((version) => version.id !== versionId),
    examples: clonePromptExamples(asset.examples),
    source: clonePromptSource(asset.source),
    metadata: asset.metadata ? { ...asset.metadata } : undefined,
    updatedAt,
  };
};

export const promptAssetFromFavorite = (
  favorite: FavoritePrompt,
  options: PromptAssetFromFavoriteOptions = {},
): PromptAsset => {
  const metadata = isPlainObject(favorite.metadata) ? favorite.metadata : undefined;
  if (!options.ignoreEmbeddedAsset && isPromptAsset(metadata?.promptAsset)) {
    return metadata.promptAsset;
  }

  const modeKey = resolvePromptModeKey({
    functionMode: favorite.functionMode,
    optimizationMode: favorite.optimizationMode,
    imageSubMode: favorite.imageSubMode,
  });
  const versionId = `favorite:${favorite.id}:current`;
  const rawReproducibility = readReproducibility(metadata, favorite, versionId);
  const reproducibility = options.stripWorkspaceDraft
    ? stripWorkspaceDraftReproducibility(rawReproducibility)
    : rawReproducibility;
  const sourceKind = reproducibility.sourceKind ?? 'favorite';

  const contentMetadata: Record<string, unknown> = {};
  if (metadata?.originalContent !== undefined) contentMetadata.originalContent = metadata.originalContent;
  if (metadata?.sourceHistoryId !== undefined) contentMetadata.sourceHistoryId = metadata.sourceHistoryId;
  if (metadata?.modelKey !== undefined) contentMetadata.modelKey = metadata.modelKey;
  if (metadata?.modelName !== undefined) contentMetadata.modelName = metadata.modelName;
  if (metadata?.templateId !== undefined) contentMetadata.templateId = metadata.templateId;

  return {
    schemaVersion: PROMPT_MODEL_SCHEMA_VERSION,
    id: `favorite:${favorite.id}`,
    title: favorite.title,
    description: favorite.description,
    tags: [...favorite.tags],
    category: favorite.category,
    contract: createPromptContract(modeKey, {
      variables: reproducibility.variables,
    }),
    currentVersionId: versionId,
    versions: [
      {
        id: versionId,
        version: 1,
        title: favorite.title,
        content: promptContentFromText(favorite.content, modeKey),
        createdAt: favorite.createdAt,
        updatedAt: favorite.updatedAt,
        source: { kind: 'favorite', id: favorite.id },
        metadata: Object.keys(contentMetadata).length > 0 ? contentMetadata : undefined,
      },
    ],
    examples: reproducibility.examples,
    source: { kind: sourceKind, id: favorite.id },
    createdAt: favorite.createdAt,
    updatedAt: favorite.updatedAt,
  };
};

export const refreshPromptAssetFromFavorite = (
  favorite: FavoritePrompt,
  options: PromptAssetFromFavoriteOptions = {},
): PromptAsset => {
  const metadata = isPlainObject(favorite.metadata) ? favorite.metadata : undefined;
  const embeddedAsset = isPromptAsset(metadata?.promptAsset) ? metadata.promptAsset : null;
  const metadataForProjection = metadata ? { ...metadata } : {};
  delete metadataForProjection.promptAsset;

  const projected = promptAssetFromFavorite(
    {
      ...favorite,
      metadata: metadataForProjection,
    },
    {
      ...options,
      ignoreEmbeddedAsset: true,
    },
  );

  if (!embeddedAsset) {
    return projected;
  }

  const versions = clonePromptAssetVersions(embeddedAsset);
  const currentVersion = versions.find((version) => version.id === embeddedAsset.currentVersionId);
  const projectedVersion = projected.versions[0];
  let currentVersionId = embeddedAsset.currentVersionId;

  if (!currentVersion || !promptContentEquals(currentVersion.content, projectedVersion.content)) {
    const versionNumber = nextContentVersionNumber(versions);
    const nextVersion = {
      ...projectedVersion,
      id: createContentVersionId(favorite, versionNumber),
      version: versionNumber,
      createdAt: favorite.updatedAt,
      updatedAt: favorite.updatedAt,
      content: clonePromptContent(projectedVersion.content),
      source: clonePromptSource(projectedVersion.source),
      metadata: projectedVersion.metadata ? { ...projectedVersion.metadata } : undefined,
    };
    versions.push(nextVersion);
    currentVersionId = nextVersion.id;
  }

  const shouldUseProjectedReproducibility = hasReproducibilitySource(metadataForProjection);
  const contract = shouldUseProjectedReproducibility
    ? projected.contract
    : createPromptContract(projected.contract.modeKey, {
        variables: embeddedAsset.contract.variables,
      });

  return {
    ...projected,
    id: embeddedAsset.id,
    contract,
    currentVersionId,
    versions,
    examples: shouldUseProjectedReproducibility
      ? rebaseDefaultExampleVersionIds(projected.examples, projectedVersion.id, currentVersionId)
      : clonePromptExamples(embeddedAsset.examples),
    createdAt: embeddedAsset.createdAt,
    updatedAt: favorite.updatedAt,
    metadata: embeddedAsset.metadata ? { ...embeddedAsset.metadata } : undefined,
  };
};
