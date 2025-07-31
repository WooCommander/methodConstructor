<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import InputAutocomplete from '@/shared/ui/InputAutocomplete/InputAutocomplete.vue'
import type { CustomType, Parameter, EnumValue, CustomTypeKind } from '@/shared/types/parameter-constructor'
import { validateCustomType } from '../lib/validators'

type Props = {
  type: CustomType
  allTypes: string[]
  isUnused?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'createCustomType', typeName: string): void
  (e: 'updateType', updatedType: CustomType): void
  (e: 'deleteType'): void
  (e: 'dragStart', typeName: string): void
  (e: 'dragEnd'): void
}>()

const isExpanded = ref(false)
const isEditing = ref(false)

// Для класса
const newParameterName = ref('')
const newParameterType = ref('')
const newParameterDescription = ref('')
const newParameterTypeRef = ref()

// Для enum
const newEnumName = ref('')
const newEnumValue = ref('')

// Валидация
const validation = computed(() => validateCustomType(props.type))

// Валидация имени параметра/enum значения
const validateName = (name: string, existingNames: string[]): { isValid: boolean; error?: string } => {
  if (!name.trim()) {
    return { isValid: false, error: 'Имя не может быть пустым' }
  }
  
  if (name.includes(' ')) {
    return { isValid: false, error: 'Имя не может содержать пробелы' }
  }
  
  if (/^\d/.test(name)) {
    return { isValid: false, error: 'Имя не может начинаться с цифры' }
  }
  
  if (existingNames.includes(name)) {
    return { isValid: false, error: 'Имя уже используется' }
  }
  
  return { isValid: true }
}

// Изменение типа (class/enum)
const changeType = (newType: CustomTypeKind) => {
  if (newType !== props.type.type) {
    const updatedType = {
      ...props.type,
      type: newType,
      parameters: newType === 'class' ? [] : props.type.parameters,
      enumValues: newType === 'enum' ? [] : props.type.enumValues
    }
    emit('updateType', updatedType)
  }
}

// Добавление параметра класса
const addParameter = () => {
  if (newParameterName.value.trim() && newParameterType.value.trim()) {
    const updatedType = {
      ...props.type,
      parameters: [
        ...props.type.parameters,
        {
          name: newParameterName.value.trim(),
          type: newParameterType.value.trim(),
          description: newParameterDescription.value.trim()
        }
      ]
    }
    emit('updateType', updatedType)
    newParameterName.value = ''
    newParameterType.value = ''
    newParameterDescription.value = ''
    
    // Устанавливаем фокус на поле типа для следующего параметра
    nextTick(() => {
      newParameterTypeRef.value?.focus?.()
    })
  }
}

// Удаление параметра класса
const removeParameter = (index: number) => {
  const updatedType = {
    ...props.type,
    parameters: props.type.parameters.filter((_, i) => i !== index)
  }
  emit('updateType', updatedType)
}

// Обновление параметра класса
const updateParameter = (index: number, field: 'name' | 'type' | 'description', value: string) => {
  const updatedType = {
    ...props.type,
    parameters: props.type.parameters.map((param, i) => 
      i === index ? { ...param, [field]: value } : param
    )
  }
  emit('updateType', updatedType)
}

// Добавление значения enum
const addEnumValue = () => {
  if (newEnumName.value.trim()) {
    // Автоматически определяем следующее значение
    let nextValue = 0
    if (props.type.enumValues.length > 0) {
      const maxValue = Math.max(...props.type.enumValues.map((v: EnumValue) => parseInt(v.value) || 0))
      nextValue = maxValue + 1
    }
    
    const updatedType = {
      ...props.type,
      enumValues: [
        ...props.type.enumValues,
        {
          name: newEnumName.value.trim(),
          value: nextValue.toString()
        }
      ]
    }
    emit('updateType', updatedType)
    newEnumName.value = ''
    newEnumValue.value = ''
  }
}

// Удаление значения enum
const removeEnumValue = (index: number) => {
  const updatedType = {
    ...props.type,
    enumValues: props.type.enumValues.filter((_, i) => i !== index)
  }
  emit('updateType', updatedType)
}

// Обновление значения enum
const updateEnumValue = (index: number, field: 'name' | 'value', value: string) => {
  const updatedType = {
    ...props.type,
    enumValues: props.type.enumValues.map((enumVal, i) => 
      i === index ? { ...enumVal, [field]: value } : enumVal
    )
  }
  emit('updateType', updatedType)
}

const handleCreateCustomType = (typeName: string) => {
  emit('createCustomType', typeName)
}

// Обработчики перетаскивания
const handleDragStart = (e: DragEvent) => {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.type.name)
  }
  emit('dragStart', props.type.name)
}

const handleDragEnd = () => {
  emit('dragEnd')
}
</script>

<template>
     <div 
     class="card" 
     :class="{ 
       'card--invalid': !validation.isValid,
       'card--unused': props.isUnused 
     }"
     draggable="true"
     @dragstart="handleDragStart"
     @dragend="handleDragEnd"
   >
         <div class="header">
       <div class="title" @click="isExpanded = !isExpanded">
         <span class="drag-handle">⋮⋮</span>
         <span class="expand-icon">{{ isExpanded ? '▼' : '▶' }}</span> 
         <!-- Переключатель типа -->
         <select 
           class="type-select"
           :value="type.type"
           @change="(e) => changeType((e.target as HTMLSelectElement).value as 'class' | 'enum')"
           @click.stop
         >
           <option value="class">class</option>
           <option value="enum">enum</option>
         </select>
         <span class="type-name">{{ type.name }}</span> :<span class="type-name" :class="{'is-not-exist':!type.parentType}" >{{ type.parentType||"Базовый тип" }}</span>
         <!-- <span class="parameter-count">
           ({{ type.type === 'class' ? type.parameters.length + ' параметров' : type.enumValues.length + ' значений' }})
         </span> -->
         <div class="header-controls">
         <div class="actions" v-if ="!isEditing" >
           <button 
             class="action-btn"
             @click.stop="isEditing = !isEditing"
           >
             {{  '+' }}
           </button>
           <!-- <button 
             class="action-btn delete-btn"
             @click.stop="emit('deleteType')"
             title="Удалить"
           >
             ×
           </button> -->
         </div>
       </div>
       </div>

     </div>
    
    <!-- Ошибки валидации -->
    <div v-if="!validation.isValid" class="validation-errors">
      <div v-for="error in validation.errors" :key="error" class="error">
        {{ error }}
      </div>
    </div>
    
    <div v-if="isExpanded" class="content">

      <!-- Содержимое для класса -->
      <div v-if="type.type === 'class'">
        <div v-if="type.parameters.length === 0" class="no-items">
          Нет параметров
        </div>
        
        <div v-else class="parameters-list">
          <div 
            v-for="(param, index) in type.parameters" 
            :key="index"
            class="parameter"
          >
            <InputAutocomplete
              v-if="isEditing"
              :isSimpleMode="true"
              class="param-type-input"
              :model-value="param.type"
              :options="allTypes"
              placeholder="Тип"
              :allow-custom="true"
              @update:model-value="updateParameter(index, 'type', $event || '')"
              @create-custom="handleCreateCustomType"
            />
            <span v-else class="param-type" :title="param.type">{{ param.type }}</span>
            
            <input
              v-if="isEditing"
              class="param-input"
              :value="param.name"
              @input="updateParameter(index, 'name', ($event.target as HTMLInputElement).value)"
              placeholder="Имя параметра"
            />
            <span v-else class="param-name" :title="param.name">{{ param.name }}</span>
            <span class="param-description">//</span>
            <input
              v-if="isEditing"
              class="param-input"
              :value="param.description"
              @input="updateParameter(index, 'description', ($event.target as HTMLInputElement).value)"
              placeholder="Описание"
            />
            <span v-else class="param-description" :title="param.description">{{ param.description }}</span>
            
            <button
              v-if="isEditing"
              class="action-btn delete-btn"
              @click="removeParameter(index)"
              title="Удалить параметр"
            >
              ×
            </button>
          </div>
        </div>
        
        <div v-if="isEditing" class="add-item">
          <InputAutocomplete
            ref="newParameterTypeRef"
            class="param-type-input"
            :isSimpleMode="true"
            :model-value="newParameterType"
            :options="allTypes"
            placeholder="Тип"
            :allow-custom="true"
            @update:model-value="newParameterType = $event || ''"
            @create-custom="handleCreateCustomType"
          />
          <input
            class="param-input"
            v-model="newParameterName"
            placeholder="Имя параметра"
            @keyup.enter="addParameter"
          />
          <input
            class="param-input"
            v-model="newParameterDescription"
            placeholder="Описание"
            @keyup.enter="addParameter"
          />
          <button 
            class="action-btn add-btn"style="min-width: 2rem;"
            @click="()=>{addParameter();isEditing = !isEditing}"
            title="Добавить параметр"
          >
          ✓
          </button>
          <button 
             class="action-btn" style="min-width: 2rem;"
             @click.stop="isEditing = !isEditing"

           >
           ×
           </button>
        </div>
      </div>

      <!-- Содержимое для enum -->
      <div v-if="type.type === 'enum'">
        <div v-if="type.enumValues.length === 0" class="no-items">
          Нет значений
        </div>
        
        <div v-else class="enum-list">
          <div 
            v-for="(enumVal, index) in type.enumValues" 
            :key="index"
            class="enum-item"
          >
            <input
              v-if="isEditing"
              class="param-input"
              :value="enumVal.name"
              @input="updateEnumValue(index, 'name', ($event.target as HTMLInputElement).value)"
              placeholder="Имя"
            />
            <span v-else class="param-name" :title="enumVal.name">{{ enumVal.name }}</span>
            
            <span class="param-separator">=</span>
            
            <input
              v-if="isEditing"
              class="param-input"
              :value="enumVal.value"
              @input="updateEnumValue(index, 'value', ($event.target as HTMLInputElement).value)"
              placeholder="Значение"
            />
            <span v-else class="param-value" :title="enumVal.value">{{ enumVal.value }}</span>
            
            <button
              v-if="isEditing"
              class="action-btn delete-btn"
              @click="removeEnumValue(index)"
              title="Удалить значение"
            >
              ×
            </button>
          </div>
        </div>
        
        <div v-if="isEditing" class="add-item">
          <input
            class="param-input"
            v-model="newEnumName"
            placeholder="Имя"
            @keyup.enter="addEnumValue"
          />
          <span class="param-separator">=</span>
          <input
            class="param-input"
            v-model="newEnumValue"
            placeholder="Значение"
            @keyup.enter="addEnumValue"
          />
          <button 
            class="action-btn add-btn"
            @click="addEnumValue"
            title="Добавить значение"
          >
            +
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.card {
  // background: #ffffff;
  border: 1px solid #f3f4f6;
  // border-radius: 0.75rem;
  // margin-bottom: 1rem;
  transition: all 0.2s ease;
  cursor: grab;
  position: relative;

  &:hover {
    // box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  }

  &:active {
    cursor: grabbing;
  }

  &--invalid {
    border-color: #ef4444;
    background: #fef2f2;
  }

  &--unused {
    opacity: 0.6;
    // background: #f9fafb;
    border-color: #d1d5db;
  }

  &.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
  }

  &.drag-over {
    border-color: #3b82f6;
    background: #f0f9ff;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f9fafb;
  }
}

.title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.drag-handle {
  color: #9ca3af;
  font-size: 1rem;
  cursor: grab;
  user-select: none;
  margin-right: 0.5rem;

  &:active {
    cursor: grabbing;
  }
}

.expand-icon {
  color: #6b7280;
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem; 
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;

  &.type-class {
    background: #dbeafe;
    color: #1d4ed8;
  }

  &.type-enum {
    background: #fef3c7;
    color: #d97706;
  }
}

.type-name {
  font-weight: 400;
  color: var(--text-primary, #20AA9F);
  &.is-not-exist{
    color: var(--text-tertiary, #93969B);
  }
}

.parameter-count {
  color: #6b7280;
  font-size: 0.875rem;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-select {
  padding: 0.25rem 0.5rem;
  border-color: unset;
  border: 0;
  background: #ffffff;
  color: var(--text-info, #2A77EF);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-right: 0.5rem;

  &:focus {
    outline: none;
    // border-color: #unset;
    // box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
  }

  &:hover {
    // border-color: #d1d5db;
  }
}

.actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: all 0.2s ease;
  color: #6b7280;

  &:hover {
    background: #3b82f6;
    color: white;
  }

  &.delete-btn {
    &:hover {
      background: #ef4444;
    }
  }

  &.add-btn {
    &:hover {
      background: #10b981;
    }
  }
}

.validation-errors {
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border-top: 1px solid #fecaca;
}

.error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;

  &:last-child {
    margin-bottom: 0;
  }
}

.content {
  // border-top: 1px solid #f3f4f6;
  padding: 0.5rem 1rem;
  overflow: visible;
}



.no-items {
  color: #6b7280;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.parameters-list,
.enum-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.parameter,
.enum-item {
  padding-left: 8.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  // padding: 0.5rem;
  
  border-radius: 0.25rem;
}

.param-type-input {
  flex: 0;
  min-width: 11rem;

}

.param-input {
  flex: 1;
  padding: 0.25rem 0.5rem;
  border: 1px solid #f3f4f6;
  border-radius: 0.25rem;
  font-size: 0.9rem;
  background: #ffffff;
  color: #1f2937;

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
}

.param-name {
  // flex: 0 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  // font-weight: 500;
}

.param-type {
  // flex: 0 8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-info, #20AA9F);
  font-family: monospace;
}

.param-description {
  // flex: 1;
  color:var(--text-tertiary, #7CAA20);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-wrap: nowrap;
  font-style: italic;
}

.param-value {
  flex: 1;
  color: #f59e0b;
  font-family: monospace;
}

.param-separator {
  color: #6b7280;
  font-weight: bold;
}

.add-item {
  padding-left: 8.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  // padding: 0.5rem;
  
  border-radius: 0.25rem;
  // margin-top: 0.5rem;
}
</style> 