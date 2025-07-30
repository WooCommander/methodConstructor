<script setup lang="ts">
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
}>()

const handleUpdateType = (updatedType: CustomType) => {
  emit('updateType', updatedType)
}

const handleDeleteType = (typeName: string) => {
  emit('deleteType', typeName)
}

const handleCreateCustomType = (typeName: string) => {
  emit('createCustomType', typeName)
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
      <CustomTypeCard
        v-for="type in customTypes"
        :key="type.name"
        :type="type"
        :all-types="allTypes"
        @update-type="handleUpdateType"
        @delete-type="() => handleDeleteType(type.name)"
        @create-custom-type="handleCreateCustomType"
      />
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
</style> 