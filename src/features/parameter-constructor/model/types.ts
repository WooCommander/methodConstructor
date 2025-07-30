import type { BaseType, CustomType, MethodParameters } from '@/shared/types/parameter-constructor'

export type { BaseType, CustomType, MethodParameters }

export type ParameterConstructorState = {
  baseTypes: BaseType[]
  customTypes: CustomType[]
  methodParameters: MethodParameters
}

export type CodeGenerationResult = {
  methodCode: string
  customTypesCode: string
}

export type ConstructorSettings = {
  language: 'csharp' | 'typescript' | 'java'
  generateDocumentation: boolean
  useNullableTypes: boolean
} 