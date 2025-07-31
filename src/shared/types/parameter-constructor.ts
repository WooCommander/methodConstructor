// Общие типы для конструктора параметров

export type BaseType = 
  | 'string'
  | 'int'
  | 'float'
  | 'boolean'
  | 'Date'
  | 'List<...>'
  | 'Array<...>'
  | 'Map<...>'
  | 'Set<...>'
  | 'Nullable<...>'

export type CustomTypeKind = 'class' | 'enum'

export type Parameter = {
  name: string
  type: string
  description: string
  isNullable?: boolean
}

export type EnumValue = {
  name: string
  value: string
}

export type CustomType = {
  name: string
  type: CustomTypeKind
  parameters: Parameter[]
  enumValues: EnumValue[]
  namespace?: string
  baseType?: string
  parentType?: string
  isNullable?: boolean
}

export type MethodParameters = {
  input: string | null
  output: string | null
}

export type ConstructorState = {
  baseTypes: BaseType[]
  customTypes: CustomType[]
  methodParameters: MethodParameters
}

// Новые типы для JSON генерации
export type JsonTypeInfo = {
  Name: string
  Namespace: string
  IsGeneric: boolean
  IsEnum: boolean
  Generic?: JsonTypeInfo[]
}

export type JsonProperty = {
  Name: string
  Type: JsonTypeInfo
  Description: string
}

export type JsonClass = {
  Name: string
  Namespace: string
  Description?: string
  Properties: JsonProperty[]
}

export type JsonEnumValue = {
  Name: string
  Value: number
}

export type JsonEnum = {
  Name: string
  Namespace: string
  Value: JsonEnumValue[]
}

export type GeneratedJson = {
  RequestType: string
  ResponseType: string
  Class: JsonClass[]
  Enums: JsonEnum[]
} 