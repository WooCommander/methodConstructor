<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import MethodParameters from './MethodParameters.vue'
import CustomTypesList from './CustomTypesList.vue'
import CodeGenerator from './CodeGenerator.vue'
import { BASE_TYPES, getAllTypes, createCustomType, updateCustomType, deleteCustomType, cleanMethodParameters } from '../lib/utils'
import type { CustomType, MethodParameters as MethodParametersType, ConstructorSettings } from '../model/types'

type Props = {
  initialCustomTypes?: CustomType[]
  initialMethodParameters?: MethodParametersType
  settings?: Partial<ConstructorSettings>
}

const props = withDefaults(defineProps<Props>(), {
  initialCustomTypes: () => [],
  initialMethodParameters: () => ({ input: null, output: null }),
  settings: () => ({})
})

const emit = defineEmits<{
  (e: 'update', state: { customTypes: CustomType[], methodParameters: MethodParametersType }): void
}>()

// Состояние
const customTypes = ref<CustomType[]>(props.initialCustomTypes)
const methodParameters = ref<MethodParametersType>(props.initialMethodParameters)

// Настройки
const settings = ref<ConstructorSettings>({
  language: 'csharp',
  generateDocumentation: true,
  useNullableTypes: false,
  ...props.settings
})

// Вычисляемые свойства
const allTypes = computed(() => getAllTypes(customTypes.value))

// Обработчики событий
const handleUpdateInput = (value: string | null) => {
  methodParameters.value.input = value
  emitUpdate()
}

const handleUpdateOutput = (value: string | null) => {
  methodParameters.value.output = value
  emitUpdate()
}

const handleCreateCustomType = (typeName: string) => {
  const newType = createCustomType(typeName)
  customTypes.value.push(newType)
  emitUpdate()
}

const handleUpdateCustomType = (updatedType: CustomType) => {
  customTypes.value = updateCustomType(customTypes.value, updatedType)
  // Очищаем ссылки на удаленные типы
  methodParameters.value = cleanMethodParameters(methodParameters.value, customTypes.value)
  emitUpdate()
}

const handleDeleteCustomType = (typeName: string) => {
  customTypes.value = deleteCustomType(customTypes.value, typeName)
  // Очищаем ссылки на удаленные типы
  methodParameters.value = cleanMethodParameters(methodParameters.value, customTypes.value)
  emitUpdate()
}

const handleReorderTypes = (newOrder: CustomType[]) => {
  customTypes.value = newOrder
  emitUpdate()
}

const emitUpdate = () => {
  emit('update', {
    customTypes: customTypes.value,
    methodParameters: methodParameters.value
  })
}

// Следим за изменениями и очищаем невалидные ссылки
watch(customTypes, () => {
  methodParameters.value = cleanMethodParameters(methodParameters.value, customTypes.value)
}, { deep: true })

// Экспортируем методы для внешнего использования
defineExpose({
  getState: () => ({
    customTypes: customTypes.value,
    methodParameters: methodParameters.value,
    settings: settings.value
  }),
  setState: (newState: { customTypes: CustomType[], methodParameters: MethodParametersType }) => {
    customTypes.value = newState.customTypes
    methodParameters.value = newState.methodParameters
    emitUpdate()
  },
  addCustomType: handleCreateCustomType,
  updateCustomType: handleUpdateCustomType,
  deleteCustomType: handleDeleteCustomType
})
</script>

<template>
  <div class="parameter-constructor">
    <div class="container">
      <!-- Параметры метода -->
      <MethodParameters
        :method-parameters="methodParameters"
        :all-types="allTypes"
        @update-input="handleUpdateInput"
        @update-output="handleUpdateOutput"
        @create-custom-type="handleCreateCustomType"
      />
      
      <!-- Сгенерированный код -->
      <CodeGenerator
        :method-parameters="methodParameters"
        :custom-types="customTypes"
        :settings="settings"
      />
    </div>
    
    <!-- Пользовательские типы -->
    <CustomTypesList
      :custom-types="customTypes"
      :all-types="allTypes"
      @update-type="handleUpdateCustomType"
      @delete-type="handleDeleteCustomType"
      @create-custom-type="handleCreateCustomType"
      @reorder-types="handleReorderTypes"
    />
  </div>
</template>

<style lang="scss" scoped>
.parameter-constructor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
</style> 