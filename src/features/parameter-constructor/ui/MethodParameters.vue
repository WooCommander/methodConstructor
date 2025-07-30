<script setup lang="ts">
import { computed } from 'vue'
import InputAutocomplete from '@/shared/ui/InputAutocomplete/InputAutocomplete.vue'
import type { MethodParameters } from '../model/types'

type Props = {
  methodParameters: MethodParameters
  allTypes: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updateInput', value: string | null): void
  (e: 'updateOutput', value: string | null): void
  (e: 'createCustomType', typeName: string): void
}>()

const handleCreateCustomType = (typeName: string) => {
  emit('createCustomType', typeName)
}
</script>

<template>
  <div class="method-params">
    <h2 class="section-title">Параметры метода</h2>
    
    <div class="param-group">
      <label class="label">Входящий параметр:</label>
      <InputAutocomplete
        :model-value="methodParameters.input"
        :options="allTypes"
        placeholder="Выберите или введите тип..."
        :allow-custom="true"
        @update:model-value="emit('updateInput', $event)"
        @create-custom="handleCreateCustomType"
      />
    </div>
    
    <div class="param-group">
      <label class="label">Исходящий параметр:</label>
      <InputAutocomplete
        :model-value="methodParameters.output"
        :options="allTypes"
        placeholder="Выберите или введите тип..."
        :allow-custom="true"
        @update:model-value="emit('updateOutput', $event)"
        @create-custom="handleCreateCustomType"
      />
    </div>
    
    <div class="selected-params">
      <div v-if="methodParameters.input" class="selected">
        <span>Входящий: <b>{{ methodParameters.input }}</b></span>
      </div>
      <div v-if="methodParameters.output" class="selected">
        <span>Исходящий: <b>{{ methodParameters.output }}</b></span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.method-params {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1.5rem;
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
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.selected {
  padding: 0.5rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  color: #0369a1;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }

  b {
    font-weight: 600;
  }
}
</style> 