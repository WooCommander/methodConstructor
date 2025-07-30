<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

type Props = {
  modelValue: string | null
  options: string[]
  placeholder?: string
  maxVisible?: number
  allowCustom?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Начните вводить тип...',
  maxVisible: 8,
  allowCustom: true
})

const emit = defineEmits<{ 
  (e: 'update:modelValue', value: string | null): void
  (e: 'createCustom', value: string): void
}>()

const input = ref('')
const isOpen = ref(false)
const highlighted = ref(-1)
const listRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

// Позиция курсора для определения, какую часть типа редактируем
const cursorPosition = ref(0)
const selectionStart = ref(0)
const selectionEnd = ref(0)

// Находим позицию многоточия в текущем значении
const findPlaceholderPosition = (value: string): { start: number; end: number } | null => {
  const match = value.match(/\.\.\./)
  if (match && match.index !== undefined) {
    return {
      start: match.index,
      end: match.index + 3
    }
  }
  return null
}

// Проверяем, находится ли курсор внутри многоточия
const isCursorInPlaceholder = computed(() => {
  if (!props.modelValue) return false
  const placeholder = findPlaceholderPosition(props.modelValue)
  if (!placeholder) return false
  
  return cursorPosition.value >= placeholder.start && cursorPosition.value <= placeholder.end
})

// Получаем текст до и после многоточия
const getTextAroundPlaceholder = computed(() => {
  if (!props.modelValue) return { before: '', after: '' }
  
  const placeholder = findPlaceholderPosition(props.modelValue)
  if (!placeholder) return { before: props.modelValue, after: '' }
  
  return {
    before: props.modelValue.substring(0, placeholder.start),
    after: props.modelValue.substring(placeholder.end)
  }
})

const filteredOptions = computed(() => {
  // Если курсор находится в многоточии, показываем все опции
  if (isCursorInPlaceholder.value) {
    return props.options
  }
  
  // Иначе фильтруем по введенному тексту
  const opts = !input.value ? props.options : props.options.filter(opt =>
    opt.toLowerCase().includes(input.value.toLowerCase())
  )
  // Если после фильтрации выделенный элемент вне диапазона — сбрасываем выделение
  if (highlighted.value >= opts.length) highlighted.value = opts.length - 1
  if (highlighted.value < 0 && opts.length > 0) highlighted.value = 0
  return opts
})

// Проверяем, является ли введенный текст пользовательским типом
const isCustomType = computed(() => {
  if (!input.value || !props.allowCustom) return false
  return !props.options.includes(input.value) && input.value.trim().length > 0
})

// Инициализация при изменении modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue !== null) {
    input.value = newValue
  }
}, { immediate: true })

const open = () => {
  isOpen.value = true
  highlighted.value = 0
}

const close = () => {
  isOpen.value = false
  highlighted.value = -1
}

const select = (option: string) => {
  if (isCursorInPlaceholder.value) {
    // Заменяем многоточие на выбранный тип
    const { before, after } = getTextAroundPlaceholder.value
    const newValue = before + option + after
    emit('update:modelValue', newValue)
    input.value = newValue
    
    close()
    
    // Устанавливаем курсор после вставленного типа
    nextTick(() => {
      if (inputRef.value) {
        const newPosition = before.length + option.length
        inputRef.value.setSelectionRange(newPosition, newPosition)
        inputRef.value.focus()
        
        // Если вставленный тип содержит многоточие, автоматически выделяем его
        if (option.includes('...')) {
          const placeholderPos = findPlaceholderPosition(newValue)
          if (placeholderPos) {
            inputRef.value.setSelectionRange(placeholderPos.start, placeholderPos.end)
            // Открываем список для выбора
            setTimeout(() => {
              isOpen.value = true
              highlighted.value = 0
            }, 50)
          }
        }
      }
    })
  } else {
    // Обычная замена всего значения
    emit('update:modelValue', option)
    input.value = option
    close()
    
    // Если выбранный тип содержит многоточие, автоматически выделяем его
    if (option.includes('...')) {
      nextTick(() => {
        if (inputRef.value) {
          const placeholderPos = findPlaceholderPosition(option)
          if (placeholderPos) {
            inputRef.value.setSelectionRange(placeholderPos.start, placeholderPos.end)
            // Открываем список для выбора
            setTimeout(() => {
              isOpen.value = true
              highlighted.value = 0
            }, 50)
          }
        }
      })
    }
  }
}

const createCustomType = () => {
  if (input.value.trim()) {
    emit('createCustom', input.value.trim())
    emit('update:modelValue', input.value.trim())
    close()
  }
}

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  input.value = target.value
  cursorPosition.value = target.selectionStart || 0
  selectionStart.value = target.selectionStart || 0
  selectionEnd.value = target.selectionEnd || 0
  
  // Если курсор находится в многоточии, открываем список со всеми опциями
  if (isCursorInPlaceholder.value) {
    isOpen.value = true
    highlighted.value = 0
  } else {
    // Обычный режим - фильтруем по введенному тексту
    isOpen.value = true
  }
}

const onKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    isOpen.value = true
    highlighted.value = 0
    return
  }
  
  if (!isOpen.value) return
  
  if (e.key === 'ArrowDown') {
    if (highlighted.value < filteredOptions.value.length - 1) {
      highlighted.value++
      scrollToHighlighted()
    }
    e.preventDefault()
  } else if (e.key === 'ArrowUp') {
    if (highlighted.value > 0) {
      highlighted.value--
      scrollToHighlighted()
    }
    e.preventDefault()
  } else if (e.key === 'Enter') {
    if (highlighted.value >= 0 && highlighted.value < filteredOptions.value.length) {
      select(filteredOptions.value[highlighted.value])
    } else if (isCustomType.value) {
      createCustomType()
    }
    e.preventDefault()
  } else if (e.key === 'Escape') {
    close()
    e.preventDefault()
  }
}

const onBlur = () => {
  // Не закрываем сразу, чтобы можно было кликнуть на опцию
  setTimeout(() => {
    if (!document.activeElement?.closest('.autocomplete')) {
      close()
    }
  }, 100)
}

const onOptionMouseEnter = (index: number) => {
  highlighted.value = index
}

const onOptionClick = (option: string) => {
  select(option)
}

const scrollToHighlighted = () => {
  nextTick(() => {
    if (listRef.value && highlighted.value >= 0) {
      const highlightedElement = listRef.value.children[highlighted.value] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  })
}

const onFocus = () => {
  // При фокусе проверяем, находится ли курсор в многоточии
  if (isCursorInPlaceholder.value) {
    open()
  }
}

const onKeyup = (e: KeyboardEvent) => {
  // Обновляем позицию курсора при навигации
  const target = e.target as HTMLInputElement
  cursorPosition.value = target.selectionStart || 0
  selectionStart.value = target.selectionStart || 0
  selectionEnd.value = target.selectionEnd || 0
}
</script>

<template>
  <div class="autocomplete">
    <input
      ref="inputRef"
      class="input"
      :placeholder="props.placeholder"
      :value="input"
      @focus="onFocus"
      @input="onInput"
      @keydown="onKeydown"
      @keyup="onKeyup"
      @blur="onBlur"
      autocomplete="off"
    />
    <div
      v-if="isOpen && (filteredOptions.length > 0 || isCustomType)"
      class="list"
      :style="{ maxHeight: `${props.maxVisible * 2.5}em`, overflowY: (filteredOptions.length > props.maxVisible || isCustomType) ? 'auto' : 'visible' }"
      ref="listRef"
    >
      <div
        v-for="(option, idx) in filteredOptions"
        :key="option"
        class="option"
        :class="{ 'option--highlighted': idx === highlighted }"
        @mouseenter="onOptionMouseEnter(idx)"
        @mousedown.prevent="onOptionClick(option)"
        data-option
      >
        {{ option }}
      </div>
      <div
        v-if="isCustomType"
        class="option option--custom"
        :class="{ 'option--highlighted': highlighted === filteredOptions.length }"
        @mouseenter="highlighted = filteredOptions.length"
        @mousedown.prevent="createCustomType"
        data-option
      >
        <span class="custom-icon">+</span>
        Создать "{{ input }}"
      </div>
    </div>
    <div v-if="isOpen && filteredOptions.length === 0 && !isCustomType" class="empty">
      Нет совпадений
    </div>
  </div>
</template>

<style lang="scss" scoped>
.autocomplete {
  position: relative;
  width: 100%;
}

.input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #f3f4f6;
  border-radius: 0.5rem;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
  background: #ffffff;
  color: #1f2937;

  &:focus {
    border-color: #3b82f6;
  }
}

.list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-top: none;
  border-radius: 0 0 0.5rem 0.5rem;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  z-index: 1000;
  max-height: 20em;
  overflow-y: auto;
}

.option {
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: #1f2937;

  &:hover {
    background-color: #f9fafb;
  }

  &.option--highlighted {
    background-color: #3b82f6;
    color: white;
  }

  &.option--custom {
    border-top: 1px solid #f3f4f6;
    font-style: italic;
    color: #10b981;
    
    .custom-icon {
      margin-right: 0.5rem;
      font-weight: bold;
    }
  }
}

.empty {
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
}
</style> 