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

export type CustomTypeKind = 'class' | 'enum'

export type Parameter = {
  name: string
  type: string
  description: string
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