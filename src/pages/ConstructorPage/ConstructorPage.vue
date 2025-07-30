<script setup lang="ts">
import { ref } from 'vue'
import ParameterConstructor from '@/features/parameter-constructor/ui/ParameterConstructor.vue'
import type { CustomType, MethodParameters } from '@/features/parameter-constructor/model/types'

const constructorRef = ref<InstanceType<typeof ParameterConstructor> | null>(null)

const handleUpdate = (state: { customTypes: CustomType[], methodParameters: MethodParameters }) => {
  console.log('Constructor state updated:', state)
  // Здесь можно сохранить состояние в localStorage или отправить на сервер
}

const handleSaveState = () => {
  if (constructorRef.value) {
    const state = constructorRef.value.getState()
    localStorage.setItem('parameterConstructorState', JSON.stringify(state))
    alert('Состояние сохранено!')
  }
}

const handleLoadState = () => {
  const savedState = localStorage.getItem('parameterConstructorState')
  if (savedState && constructorRef.value) {
    try {
      const state = JSON.parse(savedState)
      constructorRef.value.setState({
        customTypes: state.customTypes || [],
        methodParameters: state.methodParameters || { input: null, output: null }
      })
      alert('Состояние загружено!')
    } catch (error) {
      console.error('Failed to load state:', error)
      alert('Ошибка при загрузке состояния')
    }
  } else {
    alert('Сохраненное состояние не найдено')
  }
}

const handleClearState = () => {
  if (constructorRef.value) {
    constructorRef.value.setState({
      customTypes: [],
      methodParameters: { input: null, output: null }
    })
    localStorage.removeItem('parameterConstructorState')
    alert('Состояние очищено!')
  }
}
</script>

<template>
  <div class="constructor-page">
    <header class="page-header">
      <h1 class="page-title">Конструктор параметров метода</h1>
      <div class="header-actions">
        <button class="action-btn save-btn" @click="handleSaveState">
          💾 Сохранить
        </button>
        <button class="action-btn load-btn" @click="handleLoadState">
          📂 Загрузить
        </button>
        <button class="action-btn clear-btn" @click="handleClearState">
          🗑️ Очистить
        </button>
      </div>
    </header>

    <ParameterConstructor
      ref="constructorRef"
      @update="handleUpdate"
    />
  </div>
</template>

<style lang="scss" scoped>
.constructor-page {
  min-height: 100vh;
  background: #f9fafb;
}

.page-header {
  background: #ffffff;
  border-bottom: 1px solid #f3f4f6;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    transform: translateY(-1px);
  }

  &.save-btn {
    background: #10b981;
    color: white;

    &:hover {
      background: #059669;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }
  }

  &.load-btn {
    background: #3b82f6;
    color: white;

    &:hover {
      background: #2563eb;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  &.clear-btn {
    background: #ef4444;
    color: white;

    &:hover {
      background: #dc2626;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .header-actions {
    justify-content: center;
  }
}
</style> 