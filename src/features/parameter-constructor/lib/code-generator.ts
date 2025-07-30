import type { CustomType, MethodParameters, CodeGenerationResult, ConstructorSettings } from '../model/types'

export class CodeGenerator {
  private settings: ConstructorSettings

  constructor(settings: ConstructorSettings) {
    this.settings = settings
  }

  generateMethodCode(methodParameters: MethodParameters): string {
    const { input, output } = methodParameters
    
    if (!input && !output) {
      return '// Выберите параметры метода'
    }

    const inputType = input || 'void'
    const outputType = output || 'void'
    
    switch (this.settings.language) {
      case 'csharp':
        return this.generateCSharpMethod(inputType, outputType)
      case 'typescript':
        return this.generateTypeScriptMethod(inputType, outputType)
      case 'java':
        return this.generateJavaMethod(inputType, outputType)
      default:
        return this.generateCSharpMethod(inputType, outputType)
    }
  }

  generateCustomTypesCode(customTypes: CustomType[]): string {
    if (customTypes.length === 0) {
      return '// Нет пользовательских типов'
    }

    switch (this.settings.language) {
      case 'csharp':
        return this.generateCSharpCustomTypes(customTypes)
      case 'typescript':
        return this.generateTypeScriptCustomTypes(customTypes)
      case 'java':
        return this.generateJavaCustomTypes(customTypes)
      default:
        return this.generateCSharpCustomTypes(customTypes)
    }
  }

  generateAllCode(methodParameters: MethodParameters, customTypes: CustomType[]): CodeGenerationResult {
    return {
      methodCode: this.generateMethodCode(methodParameters),
      customTypesCode: this.generateCustomTypesCode(customTypes)
    }
  }

  private generateCSharpMethod(inputType: string, outputType: string): string {
    const inputParam = inputType === 'void' ? '' : `${inputType} input`
    const documentation = this.settings.generateDocumentation 
      ? `/// <summary>
/// Описание метода
/// </summary>
/// <param name="input">Входящий параметр</param>
/// <returns>Результат выполнения</returns>
`
      : ''

    return `${documentation}public ${outputType} MethodName(${inputParam}) {
    // Реализация метода
    ${outputType === 'void' ? '' : 'return default;'}
}`
  }

  private generateTypeScriptMethod(inputType: string, outputType: string): string {
    const inputParam = inputType === 'void' ? '' : `input: ${inputType}`
    const documentation = this.settings.generateDocumentation 
      ? `/**
 * Описание метода
 * @param input Входящий параметр
 * @returns Результат выполнения
 */
`
      : ''

    return `${documentation}function methodName(${inputParam}): ${outputType} {
    // Реализация метода
    ${outputType === 'void' ? '' : 'return null;'}
}`
  }

  private generateJavaMethod(inputType: string, outputType: string): string {
    const inputParam = inputType === 'void' ? '' : `${inputType} input`
    const documentation = this.settings.generateDocumentation 
      ? `/**
 * Описание метода
 * @param input Входящий параметр
 * @return Результат выполнения
 */
`
      : ''

    return `${documentation}public ${outputType} methodName(${inputParam}) {
    // Реализация метода
    ${outputType === 'void' ? '' : 'return null;'}
}`
  }

  private generateCSharpCustomTypes(customTypes: CustomType[]): string {
    return customTypes.map(type => {
      if (type.type === 'class') {
        const params = type.parameters.map(param => {
          const documentation = this.settings.generateDocumentation 
            ? `    /// <summary>
    /// ${param.description || 'Описание отсутствует'}
    /// </summary>
`
            : ''
          return `${documentation}    public ${param.type} ${param.name} { get; set; }`
        }).join('\n\n')
        
        return `public class ${type.name}
{
${params || '    // Нет параметров'}
}`
      } else {
        const values = type.enumValues.map(enumVal => 
          `    ${enumVal.name} = ${enumVal.value}`
        ).join(',\n')
        
        return `public enum ${type.name}
{
${values || '    // Нет значений'}
}`
      }
    }).join('\n\n')
  }

  private generateTypeScriptCustomTypes(customTypes: CustomType[]): string {
    return customTypes.map(type => {
      if (type.type === 'class') {
        const params = type.parameters.map(param => {
          const documentation = this.settings.generateDocumentation 
            ? `  /** ${param.description || 'Описание отсутствует'} */\n`
            : ''
          return `${documentation}  ${param.name}: ${param.type};`
        }).join('\n')
        
        return `interface ${type.name} {
${params || '  // Нет параметров'}
}`
      } else {
        const values = type.enumValues.map(enumVal => 
          `  ${enumVal.name} = ${enumVal.value}`
        ).join(',\n')
        
        return `enum ${type.name} {
${values || '  // Нет значений'}
}`
      }
    }).join('\n\n')
  }

  private generateJavaCustomTypes(customTypes: CustomType[]): string {
    return customTypes.map(type => {
      if (type.type === 'class') {
        const params = type.parameters.map(param => {
          const documentation = this.settings.generateDocumentation 
            ? `    /**
     * ${param.description || 'Описание отсутствует'}
     */
`
            : ''
          return `${documentation}    private ${param.type} ${param.name};
    
    public ${param.type} get${param.name.charAt(0).toUpperCase() + param.name.slice(1)}() {
        return ${param.name};
    }
    
    public void set${param.name.charAt(0).toUpperCase() + param.name.slice(1)}(${param.type} ${param.name}) {
        this.${param.name} = ${param.name};
    }`
        }).join('\n\n')
        
        return `public class ${type.name} {
${params || '    // Нет параметров'}
}`
      } else {
        const values = type.enumValues.map(enumVal => 
          `    ${enumVal.name}(${enumVal.value})`
        ).join(',\n')
        
        return `public enum ${type.name} {
${values || '    // Нет значений'}
}`
      }
    }).join('\n\n')
  }
} 