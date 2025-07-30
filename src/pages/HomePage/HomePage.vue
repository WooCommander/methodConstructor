<script setup lang="ts">
import { ref, computed } from 'vue'
import InputAutocomplete from '@/shared/ui/InputAutocomplete/InputAutocomplete.vue'
import CustomTypeCard from '@/shared/ui/CustomTypeCard/CustomTypeCard.vue'

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

// Обработка создания пользовательского типа
const handleCreateCustomType = (typeName: string) => {
  // Проверяем, что тип с таким именем еще не существует
  if (!customTypes.value.find(type => type.name === typeName)) {
    customTypes.value.push({
      name: typeName,
      type: 'class', // По умолчанию создается как класс
      parameters: [],
      enumValues: []
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
      <div class="generated-code">
        <h2 class="section-title">Сгенерированный код</h2>
        <pre class="code">{{ generatedCode }}</pre>
      </div>
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
        <CustomTypeCard
          v-for="type in customTypes"
          :key="type.name"
          :type="type"
          :all-types="allTypes"
          @update-type="handleUpdateCustomType"
          @delete-type="() => handleDeleteCustomType(type.name)"
          @create-custom-type="handleCreateCustomType"
        />
      </div>
    </div>

    <!-- Код пользовательских типов -->
    <div class="custom-types-code">
      <h2 class="section-title">Код пользовательских типов</h2>
      <pre class="code">{{ generateCustomTypesCode }}</pre>
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
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
.custom-types-code {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
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

@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
  
  .home-page {
    padding: 1rem;
  }
}
</style> 