import { describe, expect, it } from 'vitest'

import type { FavoritePrompt } from '../../../src/services/favorite/types'
import {
  PROMPT_MODEL_SCHEMA_VERSION,
  createPromptContract,
  promptAssetFromFavorite,
  refreshPromptAssetFromFavorite,
  type PromptAsset,
} from '../../../src/services/prompt-model'

const createFavorite = (overrides: Partial<FavoritePrompt> = {}): FavoritePrompt => ({
  id: 'fav-1',
  title: 'Favorite title',
  content: 'Write a concise summary for {{topic}}.',
  description: 'Favorite description',
  createdAt: 1000,
  updatedAt: 2000,
  tags: ['tag-a'],
  category: 'cat-a',
  useCount: 0,
  functionMode: 'basic',
  optimizationMode: 'system',
  ...overrides,
})

describe('promptAssetFromFavorite', () => {
  it('projects a plain favorite into a prompt asset without changing persistence shape', () => {
    const favorite = createFavorite()
    const asset = promptAssetFromFavorite(favorite)

    expect(asset).toMatchObject({
      schemaVersion: PROMPT_MODEL_SCHEMA_VERSION,
      id: 'favorite:fav-1',
      title: 'Favorite title',
      contract: {
        modeKey: 'basic-system',
        family: 'basic',
        subMode: 'system',
      },
      currentVersionId: 'favorite:fav-1:current',
      source: { kind: 'favorite', id: 'fav-1' },
      createdAt: 1000,
      updatedAt: 2000,
    })
    expect(asset.versions).toHaveLength(1)
    expect(asset.versions[0].content).toEqual({
      kind: 'text',
      text: 'Write a concise summary for {{topic}}.',
    })
  })

  it('projects metadata variables and examples into the asset contract and examples', () => {
    const favorite = createFavorite({
      functionMode: 'context',
      optimizationMode: 'user',
      metadata: {
        variables: [
          {
            name: 'topic',
            description: 'Summary topic',
            type: 'string',
            required: true,
            defaultValue: 'release notes',
          },
        ],
        examples: [
          {
            id: 'example-1',
            basedOnVersionId: 'asset-version-1',
            source: {
              kind: 'workspace',
              id: 'implicit:basic-system',
              metadata: {
                assetBinding: {
                  assetId: 'asset-1',
                  versionId: 'asset-version-1',
                  status: 'linked',
                },
              },
            },
            text: 'Summarize this release',
            parameters: { topic: 'release notes' },
            inputImages: ['https://example.test/input.png'],
            inputImageAssetIds: ['input-asset'],
            imageAssetIds: ['generated-asset'],
            images: ['https://example.test/output.png'],
          },
        ],
      },
    })

    const asset = promptAssetFromFavorite(favorite)

    expect(asset.contract.modeKey).toBe('pro-variable')
    expect(asset.contract.variables).toEqual([
      {
        name: 'topic',
        description: 'Summary topic',
        type: 'string',
        required: true,
        defaultValue: 'release notes',
        options: [],
      },
    ])
    expect(asset.examples[0]).toMatchObject({
      id: 'example-1',
      basedOnVersionId: 'asset-version-1',
      source: {
        kind: 'workspace',
        id: 'implicit:basic-system',
        metadata: {
          assetBinding: {
            assetId: 'asset-1',
            versionId: 'asset-version-1',
            status: 'linked',
          },
        },
      },
      input: {
        text: 'Summarize this release',
        parameters: { topic: 'release notes' },
        images: [
          { kind: 'url', url: 'https://example.test/input.png' },
          { kind: 'asset', assetId: 'input-asset' },
        ],
      },
      output: {
        images: [
          { kind: 'url', url: 'https://example.test/output.png' },
          { kind: 'asset', assetId: 'generated-asset' },
        ],
      },
    })
  })

  it('projects legacy example messages and text output into prompt asset examples', () => {
    const favorite = createFavorite({
      functionMode: 'context',
      optimizationMode: 'system',
      metadata: {
        examples: [
          {
            id: 'conversation-example',
            messages: [
              { id: 'msg-1', role: 'system', content: 'You are concise.' },
              { id: 'msg-2', role: 'user', content: 'Summarize {{topic}}.' },
            ],
            parameters: { topic: 'release notes' },
            outputText: 'Concise release summary.',
            metadata: {
              testRunId: 'run-1',
            },
          },
        ],
      },
    })

    const asset = promptAssetFromFavorite(favorite)

    expect(asset.contract.modeKey).toBe('pro-conversation')
    expect(asset.examples[0]).toMatchObject({
      id: 'conversation-example',
      basedOnVersionId: 'favorite:fav-1:current',
      input: {
        messages: [
          { id: 'msg-1', role: 'system', content: 'You are concise.' },
          { id: 'msg-2', role: 'user', content: 'Summarize {{topic}}.' },
        ],
        parameters: { topic: 'release notes' },
      },
      output: {
        text: 'Concise release summary.',
      },
      metadata: {
        testRunId: 'run-1',
      },
    })
  })

  it('reads Garden reproducibility without mutating the Garden snapshot', () => {
    const gardenSnapshot = {
      variables: [{ name: 'style', required: true }],
      assets: {
        examples: [
          {
            id: 'garden-example',
            text: 'Draw a product poster',
            parameters: { style: 'flat' },
          },
        ],
      },
    }
    const favorite = createFavorite({
      functionMode: 'image',
      imageSubMode: 'text2image',
      metadata: { gardenSnapshot },
    })
    const before = JSON.stringify(gardenSnapshot)

    const asset = promptAssetFromFavorite(favorite)

    expect(JSON.stringify(gardenSnapshot)).toBe(before)
    expect(asset.source).toEqual({ kind: 'garden', id: 'fav-1' })
    expect(asset.contract.modeKey).toBe('image-text2image')
    expect(asset.contract.variables).toMatchObject([{ name: 'style', required: true }])
    expect(asset.examples).toHaveLength(1)
  })

  it('prefers an embedded promptAsset when metadata already has one', () => {
    const embedded: PromptAsset = {
      schemaVersion: PROMPT_MODEL_SCHEMA_VERSION,
      id: 'asset-embedded',
      title: 'Embedded asset',
      tags: [],
      contract: createPromptContract('basic-user'),
      currentVersionId: 'v1',
      versions: [
        {
          id: 'v1',
          version: 1,
          content: { kind: 'text', text: 'embedded content' },
          createdAt: 1,
        },
      ],
      examples: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const favorite = createFavorite({
      metadata: {
        promptAsset: embedded,
        variables: [{ name: 'ignored' }],
      },
    })

    expect(promptAssetFromFavorite(favorite)).toBe(embedded)
  })

  it('can rebuild an embedded prompt asset from the current favorite fields', () => {
    const embedded: PromptAsset = {
      schemaVersion: PROMPT_MODEL_SCHEMA_VERSION,
      id: 'asset-stale',
      title: 'Stale asset',
      tags: [],
      contract: createPromptContract('basic-system'),
      currentVersionId: 'stale-version',
      versions: [
        {
          id: 'stale-version',
          version: 1,
          content: { kind: 'text', text: 'stale content' },
          createdAt: 1,
        },
      ],
      examples: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const favorite = createFavorite({
      id: 'fav-current',
      title: 'Current title',
      content: 'Current content',
      metadata: {
        promptAsset: embedded,
      },
    })

    const asset = promptAssetFromFavorite(favorite, { ignoreEmbeddedAsset: true })

    expect(asset).not.toBe(embedded)
    expect(asset.id).toBe('favorite:fav-current')
    expect(asset.title).toBe('Current title')
    expect(asset.versions[0].content).toEqual({ kind: 'text', text: 'Current content' })
  })

  it('refreshes an embedded prompt asset without churning equivalent rich content versions', () => {
    const embedded: PromptAsset = {
      schemaVersion: PROMPT_MODEL_SCHEMA_VERSION,
      id: 'asset-rich',
      title: 'Rich asset',
      tags: [],
      contract: createPromptContract('pro-conversation'),
      currentVersionId: 'v1',
      versions: [
        {
          id: 'v1',
          version: 1,
          content: {
            kind: 'messages',
            messages: [
              { role: 'system', content: 'Be concise.' },
              { role: 'user', content: 'Summarize {{topic}}.' },
            ],
          },
          createdAt: 1,
        },
      ],
      examples: [],
      createdAt: 1,
      updatedAt: 2,
    }
    const favorite = createFavorite({
      id: 'fav-rich',
      functionMode: 'context',
      optimizationMode: 'system',
      content: '[system]\nBe concise.\n\n[user]\nSummarize {{topic}}.',
      metadata: {
        promptAsset: embedded,
        reproducibility: {
          variables: [{ name: 'topic', required: true }],
        },
      },
    })

    const asset = refreshPromptAssetFromFavorite(favorite)

    expect(asset.currentVersionId).toBe('v1')
    expect(asset.versions).toHaveLength(1)
    expect(asset.versions[0].content).toEqual(embedded.versions[0].content)
    expect(asset.contract.variables).toMatchObject([{ name: 'topic', required: true }])
  })

  it('strips workspace-only example values from generated prompt assets', () => {
    const favorite = createFavorite({
      metadata: {
        reproducibility: {
          variables: [
            {
              name: 'topic',
              source: 'workspace',
              defaultValue: 'temporary value',
            },
            {
              name: 'tone',
              defaultValue: 'friendly',
            },
          ],
          examples: [
            {
              id: 'workspace-current',
              text: 'Workspace prompt',
              parameters: { topic: 'temporary value' },
            },
            {
              id: 'manual-example',
              text: 'Manual example',
            },
          ],
        },
      },
    })

    const asset = promptAssetFromFavorite(favorite, { stripWorkspaceDraft: true })

    expect(asset.contract.variables).toEqual([
      {
        name: 'topic',
        required: false,
        options: [],
        source: 'workspace',
      },
      {
        name: 'tone',
        required: false,
        defaultValue: 'friendly',
        options: [],
      },
    ])
    expect(asset.examples.map((example) => example.id)).toEqual(['manual-example'])
  })
})
