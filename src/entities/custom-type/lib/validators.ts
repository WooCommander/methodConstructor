import type { CustomType, Parameter, EnumValue, CustomTypeValidation } from './types'

export const validateCustomType = (type: CustomType): CustomTypeValidation => {
  const errors: string[] = []

  // Проверка имени
  if (!type.name.trim()) {
    errors.push('Имя типа не может быть пустым')
  } else if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(type.name)) {
    errors.push('Имя типа должно начинаться с буквы или подчеркивания и содержать только буквы, цифры и подчеркивания')
  }

  // Проверка параметров класса
  if (type.type === 'class') {
    const parameterNames = type.parameters.map(p => p.name)
    const duplicateNames = parameterNames.filter((name, index) => parameterNames.indexOf(name) !== index)
    
    if (duplicateNames.length > 0) {
      errors.push(`Дублирующиеся имена параметров: ${duplicateNames.join(', ')}`)
    }

    type.parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        errors.push(`Параметр ${index + 1}: имя не может быть пустым`)
      }
      if (!param.type.trim()) {
        errors.push(`Параметр ${index + 1}: тип не может быть пустым`)
      }
    })
  }

  // Проверка значений enum
  if (type.type === 'enum') {
    const enumNames = type.enumValues.map(e => e.name)
    const duplicateNames = enumNames.filter((name, index) => enumNames.indexOf(name) !== index)
    
    if (duplicateNames.length > 0) {
      errors.push(`Дублирующиеся имена значений enum: ${duplicateNames.join(', ')}`)
    }

    type.enumValues.forEach((enumVal, index) => {
      if (!enumVal.name.trim()) {
        errors.push(`Значение enum ${index + 1}: имя не может быть пустым`)
      }
      if (!enumVal.value.trim()) {
        errors.push(`Значение enum ${index + 1}: значение не может быть пустым`)
      }
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateParameter = (parameter: Parameter): CustomTypeValidation => {
  const errors: string[] = []

  if (!parameter.name.trim()) {
    errors.push('Имя параметра не может быть пустым')
  }
  if (!parameter.type.trim()) {
    errors.push('Тип параметра не может быть пустым')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateEnumValue = (enumValue: EnumValue): CustomTypeValidation => {
  const errors: string[] = []

  if (!enumValue.name.trim()) {
    errors.push('Имя значения enum не может быть пустым')
  }
  if (!enumValue.value.trim()) {
    errors.push('Значение enum не может быть пустым')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
} 