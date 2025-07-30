<script setup lang="ts">
import { ref } from 'vue'
import CustomTypeCard from '@/entities/custom-type/ui/CustomTypeCard.vue'
import type { CustomType } from '../model/types'

type Props = {
  customTypes: CustomType[]
  allTypes: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updateType', updatedType: CustomType): void
  (e: 'deleteType', typeName: string): void
  (e: 'createCustomType', typeName: string): void
  (e: 'reorderTypes', newOrder: CustomType[]): void
}>()

// Состояние перетаскивания
const draggedTypeName = ref<string | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleUpdateType = (updatedType: CustomType) => {
  emit('updateType', updatedType)
}

const handleDeleteType = (typeName: string) => {
  emit('deleteType', typeName)
}

const handleCreateCustomType = (typeName: string) => {
  emit('createCustomType', typeName)
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
  if (draggedTypeName.value && draggedTypeName.value !== props.customTypes[index]?.name) {
    dragOverIndex.value = index
  }
}

const handleDrop = (e: DragEvent, dropIndex: number) => {
  e.preventDefault()
  
  if (!draggedTypeName.value) return
  
  const draggedIndex = props.customTypes.findIndex(type => type.name === draggedTypeName.value)
  if (draggedIndex === -1 || draggedIndex === dropIndex) return
  
  // Создаем новый порядок
  const newOrder = [...props.customTypes]
  const [draggedItem] = newOrder.splice(draggedIndex, 1)
  newOrder.splice(dropIndex, 0, draggedItem)
  
  emit('reorderTypes', newOrder)
  handleDragEnd()
}

const handleDragLeave = () => {
  dragOverIndex.value = null
}
</script>

<template>
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
        @drop="handleDrop($event, index)"
        @dragleave="handleDragLeave"
      >
        <CustomTypeCard
          :type="type"
          :all-types="allTypes"
          @update-type="handleUpdateType"
          @delete-type="() => handleDeleteType(type.name)"
          @create-custom-type="handleCreateCustomType"
          @drag-start="handleDragStart"
          @drag-end="handleDragEnd"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.custom-types {
  margin-top: 2rem;
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

.no-types {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-style: italic;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
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
</style> 