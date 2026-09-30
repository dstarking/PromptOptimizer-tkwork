export type XmlNodeKind = 'element' | 'text' | 'comment' | 'cdata' | 'processing'

export interface XmlNodeAttribute {
  name: string
  value: string
}

export interface XmlNodeModel {
  kind: XmlNodeKind
  name?: string
  value?: string
  attributes?: XmlNodeAttribute[]
  children?: XmlNodeModel[]
}

export interface XmlRendererParseResult {
  source: string
  rootNodes: XmlNodeModel[]
  error: string | null
}
