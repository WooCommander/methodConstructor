import type { 
  CustomType, 
  GeneratedJson, 
  JsonTypeInfo, 
  JsonProperty, 
  JsonClass, 
  JsonEnum,
  MethodParameters 
} from '../types/parameter-constructor'

// Маппинг базовых типов на их JSON представление
const baseTypeMapping: Record<string, { name: string; namespace: string; isEnum: boolean }> = {
  'string': { name: 'String', namespace: 'System', isEnum: false },
  'int': { name: 'Int32', namespace: 'System', isEnum: false },
  'long': { name: 'Int64', namespace: 'System', isEnum: false },
  'float': { name: 'Single', namespace: 'System', isEnum: false },
  'double': { name: 'Double', namespace: 'System', isEnum: false },
  'decimal': { name: 'Decimal', namespace: 'System', isEnum: false },
  'bool': { name: 'Boolean', namespace: 'System', isEnum: false },
  'boolean': { name: 'Boolean', namespace: 'System', isEnum: false },
  'byte': { name: 'Byte', namespace: 'System', isEnum: false },
  'short': { name: 'Int16', namespace: 'System', isEnum: false },
  'char': { name: 'Char', namespace: 'System', isEnum: false },
  'uuid': { name: 'Guid', namespace: 'System', isEnum: false },
  'DateTime': { name: 'DateTime', namespace: 'System', isEnum: false },
  'Date': { name: 'DateTime', namespace: 'System', isEnum: false }
}

// Функция для парсинга типа и извлечения информации о generic типах
function parseType(typeString: string): JsonTypeInfo {
  // Проверяем nullable тип (Type?)
  if (typeString.endsWith('?')) {
    const baseType = typeString.slice(0, -1).trim()
    return {
      Name: 'Nullable`1',
      Namespace: 'System',
      IsGeneric: true,
      IsEnum: false,
      Generic: [parseType(baseType)]
    }
  }
  
  // Проверяем, является ли это generic типом
  const genericMatch = typeString.match(/^(\w+)<(.+)>$/i)
  
  if (genericMatch) {
    const [, genericType, innerType] = genericMatch
    
    // Обрабатываем Nullable
    if (genericType.toLowerCase() === 'nullable') {
      return {
        Name: 'Nullable`1',
        Namespace: 'System',
        IsGeneric: true,
        IsEnum: false,
        Generic: [parseType(innerType)]
      }
    }
    
    // Обрабатываем List, Array
    if (['list', 'array'].includes(genericType.toLowerCase())) {
      return {
        Name: 'List`1',
        Namespace: 'System.Collections.Generic',
        IsGeneric: true,
        IsEnum: false,
        Generic: [parseType(innerType)]
      }
    }
    
    // Обрабатываем другие generic типы
    return {
      Name: `${genericType}\`1`,
      Namespace: 'System',
      IsGeneric: true,
      IsEnum: false,
      Generic: [parseType(innerType)]
    }
  }
  
  // Проверяем базовые типы
  const baseType = baseTypeMapping[typeString.toLowerCase()]
  if (baseType) {
    return {
      Name: baseType.name,
      Namespace: baseType.namespace,
      IsGeneric: false,
      IsEnum: baseType.isEnum
    }
  }
  
  // Это пользовательский тип
  return {
    Name: typeString,
    Namespace: 'Wiki.Microservice.IServices.Models', // Можно сделать настраиваемым
    IsGeneric: false,
    IsEnum: false
  }
}

// Функция для определения namespace на основе имени типа
function getNamespaceForType(typeName: string): string {
  if (typeName.includes('Request')) {
    return 'Wiki.Microservice.IServices.Models.ApiControllerService.Request'
  }
  if (typeName.includes('Response')) {
    return 'Wiki.Microservice.IServices.Models.ApiControllerService.Response'
  }
  if (typeName.includes('Page')) {
    return 'PaginationHelper.Lib'
  }
  if (typeName.includes('Enum')) {
    return 'Wiki.DataEnums'
  }
  return 'Wiki.Microservice.IServices.Models.ApiControllerService'
}

// Функция для генерации JSON класса
function generateJsonClass(customType: CustomType): JsonClass {
  const properties: JsonProperty[] = customType.parameters.map(param => ({
    Name: param.name,
    Type: parseType(param.type),
    Description: param.description
  }))
  
  return {
    Name: customType.name,
    Namespace: getNamespaceForType(customType.name),
    Description: customType.name.includes('Item') ? 'представление контроллера' : undefined,
    Properties: properties
  }
}

// Функция для генерации JSON enum
function generateJsonEnum(customType: CustomType): JsonEnum {
  const values: { Name: string; Value: number }[] = customType.enumValues.map((enumVal, index) => ({
    Name: enumVal.name,
    Value: parseInt(enumVal.value) || index
  }))
  
  return {
    Name: customType.name,
    Namespace: getNamespaceForType(customType.name),
    Value: values
  }
}

// Основная функция генерации JSON
export function generateJson(
  customTypes: CustomType[], 
  methodParameters: MethodParameters
): GeneratedJson {
  const classes: JsonClass[] = []
  const enums: JsonEnum[] = []
  
  // Разделяем типы на классы и enum'ы
  customTypes.forEach(type => {
    if (type.type === 'class') {
      classes.push(generateJsonClass(type))
    } else {
      enums.push(generateJsonEnum(type))
    }
  })
  
  // Определяем RequestType и ResponseType
  const requestType = methodParameters.input || 'ApiControllerListRequest'
  const responseType = methodParameters.output || 'ApiControllerListResponse'
  
  return {
    RequestType: requestType,
    ResponseType: responseType,
    Class: classes,
    Enums: enums
  }
}

// Функция для экспорта JSON в файл
export function exportJsonToFile(json: GeneratedJson, filename: string = 'generated-model.json') {
  const jsonString = JSON.stringify(json, null, 2)
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 