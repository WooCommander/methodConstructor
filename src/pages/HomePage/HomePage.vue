<script setup lang="ts">
import { ref, computed } from 'vue'
import InputAutocomplete from '@/shared/ui/InputAutocomplete/InputAutocomplete.vue'
import CustomTypeCard from '@/entities/custom-type/ui/CustomTypeCard.vue'
import { generateJson, exportJsonToFile } from '@/shared/lib/json-generator'

// Базовые типы
const baseTypes = [
  'bool',
  'byte',
  'short',
  'int',
  'long',
  'float',
  'double',
  'decimal',
  'char',
  'string',
  'uuid',  
  'DateTime',
  
  'List<...>',
  'Array<...>',
  'Nullable<...>',
  'Task<...>',
  
]

// Пользовательские типы
const customTypes = ref<Array<{
  name: string
  type: 'class' | 'enum'
  parameters: Array<{
    name: string
    type: string
    description: string
  }>
  enumValues: Array<{
    name: string
    value: string
  }>
}>>([])

// Параметры метода
const inputParameter = ref<string | null>(null)
const outputParameter = ref<string | null>(null)

// Полный список типов (базовые + пользовательские)
const allTypes = computed(() => {
  const customTypeNames = customTypes.value.map(type => type.name)
  return [...baseTypes, ...customTypeNames]
})

// Функция для извлечения всех типов из строки типа (включая generic)
const extractTypesFromString = (typeString: string): string[] => {
  const types: string[] = []
  
  // Регулярное выражение для поиска типов в generic конструкциях
  // Ищет паттерны типа List<Type>, Nullable<Type>, Dictionary<Key, Value> и т.д.
  const genericRegex = /<([^<>]+)>/g
  let match
  
  // Извлекаем типы из generic конструкций
  while ((match = genericRegex.exec(typeString)) !== null) {
    const genericContent = match[1]
    // Разделяем по запятой для случаев типа Dictionary<Key, Value>
    const genericTypes = genericContent.split(',').map(t => t.trim())
    types.push(...genericTypes)
  }
  
  // Также добавляем основной тип (без generic части)
  const baseType = typeString.replace(/<[^<>]*>/, '').trim()
  if (baseType && !types.includes(baseType)) {
    types.push(baseType)
  }
  
  return types
}

// Определяем неиспользуемые типы
const unusedTypes = computed(() => {
  const usedTypes = new Set<string>()
  
  // Добавляем типы, используемые в параметрах метода
  if (inputParameter.value) {
    const inputTypes = extractTypesFromString(inputParameter.value)
    inputTypes.forEach(type => usedTypes.add(type))
  }
  if (outputParameter.value) {
    const outputTypes = extractTypesFromString(outputParameter.value)
    outputTypes.forEach(type => usedTypes.add(type))
  }
  
  // Добавляем типы, используемые в параметрах всех классов
  customTypes.value.forEach(type => {
    if (type.type === 'class') {
      type.parameters.forEach(param => {
        const paramTypes = extractTypesFromString(param.type)
        paramTypes.forEach(paramType => {
          if (customTypes.value.find(t => t.name === paramType)) {
            usedTypes.add(paramType)
          }
        })
      })
    }
  })
  
  return customTypes.value.filter(type => !usedTypes.has(type.name))
})

// Обработка создания пользовательского типа
const handleCreateCustomType = (typeName: string, typeKind?: 'class' | 'enum') => {
  // Проверяем, что тип с таким именем еще не существует
  if (!customTypes.value.find(type => type.name === typeName)) {
    // Определяем тип на основе имени или переданного параметра
    let finalType: 'class' | 'enum' = 'class'
    if (typeKind) {
      finalType = typeKind
    } else if (typeName.toLowerCase().includes('enum')) {
      finalType = 'enum'
    }
    
    customTypes.value.push({
      name: typeName,
      type: finalType,
      parameters: [],
      enumValues: finalType === 'enum' ? [{ name: 'Value1', value: '0' }] : []
    })
  }
}

// Обновление пользовательского типа
const handleUpdateCustomType = (updatedType: any) => {
  const index = customTypes.value.findIndex(type => type.name === updatedType.name)
  if (index !== -1) {
    customTypes.value[index] = updatedType
  }
}

// Удаление пользовательского типа
const handleDeleteCustomType = (typeName: string) => {
  customTypes.value = customTypes.value.filter(type => type.name !== typeName)
  
  // Удаляем ссылки на удаленный тип из параметров
  if (inputParameter.value === typeName) {
    inputParameter.value = null
  }
  if (outputParameter.value === typeName) {
    outputParameter.value = null
  }
}

// Состояние перетаскивания
const draggedTypeName = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)

// Переупорядочивание пользовательских типов
const handleReorderTypes = (newOrder: any[]) => {
  customTypes.value = newOrder
}

// Обработчики перетаскивания
const handleDragStart = (typeName: string) => {
  draggedTypeName.value = typeName
}

const handleDragEnd = () => {
  draggedTypeName.value = null
  dragOverIndex.value = null
}

const handleDragOver = (e: DragEvent, index: number) => {
  e.preventDefault()
  if (draggedTypeName.value && draggedTypeName.value !== customTypes.value[index]?.name) {
    dragOverIndex.value = index
  }
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}

// Генерация и экспорт JSON
const generatedJson = computed(() => {
  return generateJson(customTypes.value, {
    input: inputParameter.value,
    output: outputParameter.value
  })
})

const handleExportJson = () => {
  exportJsonToFile(generatedJson.value, 'api-model.json')
}

// Генерация кода метода
const generatedCode = computed(() => {
  if (!inputParameter.value && !outputParameter.value) {
    return '// Выберите параметры метода'
  }

  const input = inputParameter.value || 'void'
  const output = outputParameter.value || 'void'
  
  return `public ${output} (${input === 'void' ? '' : input} input) {
    // Реализация метода
}`
})

// Генерация кода пользовательских типов
const generateCustomTypesCode = computed(() => {
  if (customTypes.value.length === 0) {
    return '// Нет пользовательских типов'
  }

  return customTypes.value.map(type => {
    if (type.type === 'class') {
      const params = type.parameters.map(param => 
        `    /// <summary>
    /// ${param.description || 'Описание отсутствует'}
    /// </summary>
    public ${param.type} ${param.name} { get; set; }`
      ).join('\n\n')
      
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
})
</script>

<template>
  <div class="home-page">
    <h1 class="title">Конструктор параметров метода</h1>
    
    <div class="container">
      <!-- Параметры метода -->
      <div class="method-params">
        <h2 class="section-title">Параметры метода</h2>
        
        <div class="param-group">
          <label class="label">Входящий параметр:</label>
          <InputAutocomplete
            v-model="inputParameter"
            :options="allTypes"
            placeholder="Выберите или введите тип..."
            :allow-custom="true"
            @create-custom="handleCreateCustomType"
          />
        </div>
        
        <div class="param-group">
          <label class="label">Исходящий параметр:</label>
          <InputAutocomplete
            v-model="outputParameter"
            :options="allTypes"
            placeholder="Выберите или введите тип..."
            :allow-custom="true"
            @create-custom="handleCreateCustomType"
          />
        </div>
        
        <div class="selected-params">
          <div v-if="inputParameter" class="selected">
            <span>Входящий: <b>{{ inputParameter }}</b></span>
          </div>
          <div v-if="outputParameter" class="selected">
            <span>Исходящий: <b>{{ outputParameter }}</b></span>
          </div>
        </div>
      </div>
      
      <!-- Сгенерированный код -->
      <!-- <div class="generated-code">
        <h2 class="section-title">Сгенерированный код</h2>
        <pre class="code">{{ generatedCode }}</pre>
      </div> -->
    </div>
    
    <!-- Пользовательские типы -->
    <div class="custom-types">
      <h2 class="section-title">
        Пользовательские типы 
        <span class="type-count">({{ customTypes.length }})</span>
      </h2>
      
      <div v-if="customTypes.length === 0" class="no-types">
        Создайте пользовательский тип, введя его название в поле выше
      </div>
      
      <div v-else class="types-list">
                 <div
           v-for="(type, index) in customTypes"
           :key="type.name"
           class="type-wrapper"
           :class="{ 'drag-over': dragOverIndex === index }"
           @dragover="handleDragOver($event, index)"
           @drop="(e) => {
             e.preventDefault()
             const draggedName = e.dataTransfer?.getData('text/plain')
             if (draggedName && draggedName !== type.name) {
               const draggedIndex = customTypes.findIndex(t => t.name === draggedName)
               if (draggedIndex !== -1 && draggedIndex !== index) {
                 const newOrder = [...customTypes]
                 const [draggedItem] = newOrder.splice(draggedIndex, 1)
                 newOrder.splice(index, 0, draggedItem)
                 handleReorderTypes(newOrder)
               }
             }
             handleDragEnd()
           }"
           @dragleave="handleDragLeave"
         >
                     <CustomTypeCard
             :type="type"
             :all-types="allTypes"
             :is-unused="unusedTypes.includes(type)"
             @update-type="handleUpdateCustomType"
             @delete-type="() => handleDeleteCustomType(type.name)"
             @create-custom-type="handleCreateCustomType"
             @drag-start="handleDragStart"
             @drag-end="handleDragEnd"
           />
        </div>
      </div>
    </div>

    <!-- Код пользовательских типов -->
    <div class="custom-types-code">
      <h2 class="section-title">Код пользовательских типов</h2>
      <pre class="code">{{ generateCustomTypesCode }}</pre>
    </div>

    <!-- Сгенерированный JSON -->
    <div class="generated-json">
      <div class="section-header">
        <h2 class="section-title">Сгенерированный JSON</h2>
        <button class="export-btn" @click="handleExportJson">
          📥 Экспорт JSON
        </button>
      </div>
      <pre class="code">{{ JSON.stringify(generatedJson, null, 2) }}</pre>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 2rem;
  text-align: center;
}

.container {

  // gap: 2rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.type-count {
  font-size: 1rem;
  color: #6b7280;
  font-weight: normal;
}

.method-params {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.param-group {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.selected-params {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f3f4f6;
}

.selected {
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  
  b {
    color: #3b82f6;
    font-family: monospace;
  }
}

.generated-code,
.custom-types-code,
.generated-json {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.export-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #2563eb;
  }
}

.code {
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 0.5rem;
  padding: 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #1f2937;
  white-space: pre-wrap;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.custom-types {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.no-types {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.types-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.type-wrapper {
  transition: all 0.2s ease;
  
  &.drag-over {
    transform: translateY(2px);
    
    .card {
      border-color: #3b82f6;
      background: #f0f9ff;
      box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
    }
  }
}

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
  
  .home-page {
    padding: 1rem;
  }
}
</style> 