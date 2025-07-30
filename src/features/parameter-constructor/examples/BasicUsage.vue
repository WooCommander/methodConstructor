<script setup lang="ts">
import { ref } from 'vue'
import { ParameterConstructor } from '../index'
import type { CustomType, MethodParameters } from '@/shared/types/parameter-constructor'

const constructorRef = ref<InstanceType<typeof ParameterConstructor> | null>(null)

const handleUpdate = (state: { customTypes: CustomType[], methodParameters: MethodParameters }) => {
  console.log('Constructor state updated:', state)
}

const handleAddSampleType = () => {
  constructorRef.value?.addCustomType('SampleType')
}

const handleGetState = () => {
  const state = constructorRef.value?.getState()
  console.log('Current state:', state)
}
</script>

<template>
  <div class="basic-usage">
    <h2>Базовое использование конструктора</h2>
    
    <div class="controls">
      <button @click="handleAddSampleType">Добавить пример типа</button>
      <button @click="handleGetState">Получить состояние</button>
    </div>
    
    <ParameterConstructor
      ref="constructorRef"
      @update="handleUpdate"
    />
  </div>
</template>

<style lang="scss" scoped>
.basic-usage {
  padding: 2rem;
}

.controls {
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
}

button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  
  &:hover {
    background: #2563eb;
  }
}
</style> 