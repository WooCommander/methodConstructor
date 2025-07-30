import type { BaseType, CustomType, MethodParameters } from '../model/types'

export const BASE_TYPES: BaseType[] = [
  'string',
  'int',
  'float',
  'boolean',
  'Date',
  'List<...>',
  'Array<...>',
  'Map<...>',
  'Set<...>'
]

export const getAllTypes = (customTypes: CustomType[]): string[] => {
  const customTypeNames = customTypes.map(type => type.name)
  return [...BASE_TYPES, ...customTypeNames]
}

export const createCustomType = (name: string): CustomType => {
  return {
    name,
    type: 'class',
    parameters: [],
    enumValues: []
  }
}

export const updateCustomType = (
  customTypes: CustomType[],
  updatedType: CustomType
): CustomType[] => {
  const index = customTypes.findIndex(type => type.name === updatedType.name)
  if (index !== -1) {
    const newTypes = [...customTypes]
    newTypes[index] = updatedType
    return newTypes
  }
  return customTypes
}

export const deleteCustomType = (
  customTypes: CustomType[],
  typeName: string
): CustomType[] => {
  return customTypes.filter(type => type.name !== typeName)
}

export const cleanMethodParameters = (
  methodParameters: MethodParameters,
  customTypes: CustomType[]
): MethodParameters => {
  const customTypeNames = customTypes.map(type => type.name)
  const allValidTypes = [...BASE_TYPES, ...customTypeNames]
  
  return {
    input: methodParameters.input && allValidTypes.includes(methodParameters.input) 
      ? methodParameters.input 
      : null,
    output: methodParameters.output && allValidTypes.includes(methodParameters.output) 
      ? methodParameters.output 
      : null
  }
}

export const validateTypeName = (name: string, existingTypes: CustomType[]): boolean => {
  if (!name.trim()) return false
  
  // Проверяем, что имя соответствует правилам именования
  const nameRegex = /^[A-Za-z_][A-Za-z0-9_]*$/
  if (!nameRegex.test(name)) return false
  
  // Проверяем, что имя не конфликтует с базовыми типами
  if (BASE_TYPES.includes(name as BaseType)) return false
  
  // Проверяем, что имя не конфликтует с существующими пользовательскими типами
  if (existingTypes.some(type => type.name === name)) return false
  
  return true
}

export const generateTypeName = (baseName: string, existingTypes: CustomType[]): string => {
  let counter = 1
  let name = baseName
  
  while (!validateTypeName(name, existingTypes)) {
    name = `${baseName}${counter}`
    counter++
  }
  
  return name
}

export const exportToFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
} 