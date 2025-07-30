<script setup lang="ts">
import { computed, ref } from 'vue'
import { CodeGenerator } from '../lib/code-generator'
import { exportToFile, copyToClipboard } from '../lib/utils'
import type { MethodParameters, CustomType, ConstructorSettings } from '../model/types'

type Props = {
  methodParameters: MethodParameters
  customTypes: CustomType[]
  settings: ConstructorSettings
}

const props = defineProps<Props>()

const codeGenerator = computed(() => new CodeGenerator(props.settings))

const generatedCode = computed(() => {
  return codeGenerator.value.generateMethodCode(props.methodParameters)
})

const customTypesCode = computed(() => {
  return codeGenerator.value.generateCustomTypesCode(props.customTypes)
})

const isCopied = ref(false)

const copyMethodCode = async () => {
  const success = await copyToClipboard(generatedCode.value)
  if (success) {
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}

const copyCustomTypesCode = async () => {
  const success = await copyToClipboard(customTypesCode.value)
  if (success) {
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}

const exportMethodCode = () => {
  const extension = props.settings.language === 'csharp' ? 'cs' : 
                   props.settings.language === 'typescript' ? 'ts' : 'java'
  exportToFile(generatedCode.value, `method.${extension}`)
}

const exportCustomTypesCode = () => {
  const extension = props.settings.language === 'csharp' ? 'cs' : 
                   props.settings.language === 'typescript' ? 'ts' : 'java'
  exportToFile(customTypesCode.value, `custom-types.${extension}`)
}

const exportAllCode = () => {
  const allCode = `${generatedCode.value}\n\n${customTypesCode.value}`
  const extension = props.settings.language === 'csharp' ? 'cs' : 
                   props.settings.language === 'typescript' ? 'ts' : 'java'
  exportToFile(allCode, `generated-code.${extension}`)
}
</script>

<template>
  <div class="code-generator">
    <!-- Сгенерированный код метода -->
    <div class="code-section">
      <div class="code-header">
        <h2 class="section-title">Сгенерированный код метода</h2>
        <div class="code-actions">
          <button 
            class="action-btn copy-btn"
            @click="copyMethodCode"
            :title="isCopied ? 'Скопировано!' : 'Копировать'"
          >
            {{ isCopied ? '✓' : '📋' }}
          </button>
          <button 
            class="action-btn export-btn"
            @click="exportMethodCode"
            title="Экспортировать"
          >
            💾
          </button>
        </div>
      </div>
      <pre class="code">{{ generatedCode }}</pre>
    </div>

    <!-- Код пользовательских типов -->
    <!-- <div class="code-section">
      <div class="code-header">
        <h2 class="section-title">Код пользовательских типов</h2>
        <div class="code-actions">
          <button 
            class="action-btn copy-btn"
            @click="copyCustomTypesCode"
            :title="isCopied ? 'Скопировано!' : 'Копировать'"
          >
            {{ isCopied ? '✓' : '📋' }}
          </button>
          <button 
            class="action-btn export-btn"
            @click="exportCustomTypesCode"
            title="Экспортировать"
          >
            💾
          </button>
        </div>
      </div>
      <pre class="code">{{ customTypesCode }}</pre>
    </div> -->

    <!-- Экспорт всего кода -->
    <div class="export-all">
      <button 
        class="export-all-btn"
        @click="exportAllCode"
        title="Экспортировать весь код"
      >
        📁 Экспортировать весь код
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.code-generator {
  margin-top: 2rem;
}

.code-section {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #f9fafb;
  border-bottom: 1px solid #f3f4f6;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.code-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  transition: all 0.2s ease;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  color: #6b7280;

  &:hover {
    background: #f3f4f6;
    color: #1f2937;
  }

  &.copy-btn {
    &:hover {
      background: #dbeafe;
      color: #1d4ed8;
    }
  }

  &.export-btn {
    &:hover {
      background: #dcfce7;
      color: #16a34a;
    }
  }
}

.code {
  padding: 1.5rem;
  margin: 0;
  background: #1f2937;
  color: #f9fafb;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.export-all {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.export-all-btn {
  padding: 1rem 2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}
</style> 