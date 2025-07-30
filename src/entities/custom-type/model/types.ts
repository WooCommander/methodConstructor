import type { CustomType, Parameter, EnumValue, CustomTypeKind } from '@/shared/types/parameter-constructor'

export type { CustomType, Parameter, EnumValue, CustomTypeKind }

export type CustomTypeFormData = {
  name: string
  type: CustomTypeKind
  parameters: Parameter[]
  enumValues: EnumValue[]
}

export type CustomTypeValidation = {
  isValid: boolean
  errors: string[]
}

export type CustomTypeUpdateEvent = {
  type: CustomType
  action: 'create' | 'update' | 'delete'
} 