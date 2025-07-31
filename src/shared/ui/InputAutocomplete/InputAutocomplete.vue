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
  (e: 'createCustom', value: string, typeKind?: 'class' | 'enum'): void
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
  
  // Более гибкая проверка - курсор может быть в пределах многоточия или после него
  // но до закрывающей скобки >
  const isInPlaceholder = cursorPosition.value >= placeholder.start && cursorPosition.value <= placeholder.end
  
  // Также проверяем, есть ли текст в placeholderInput (это означает, что мы редактируем многоточие)
  const hasPlaceholderInput = placeholderInput.value.length > 0
  
  // Отладочная информация
  console.log('isCursorInPlaceholder debug:', {
    modelValue: props.modelValue,
    placeholder,
    cursorPosition: cursorPosition.value,
    isInPlaceholder,
    hasPlaceholderInput,
    placeholderInput: placeholderInput.value
  })
  
  return isInPlaceholder || hasPlaceholderInput
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

const placeholderInput = ref('')

const filteredOptions = computed(() => {
  let search = ''
  if (isCursorInPlaceholder.value) {
    search = placeholderInput.value
  } else {
    search = input.value
  }
  if (!search) return props.options
  
  // Убираем "?" для поиска
  const cleanSearch = search.endsWith('?') ? search.slice(0, -1).trim() : search.trim()
  
  // Если курсор в многоточии и введен текст, показываем только точные совпадения
  if (isCursorInPlaceholder.value && cleanSearch) {
    return props.options.filter(opt =>
      opt.toLowerCase() === cleanSearch.toLowerCase()
    )
  }
  
  // Поиск с начала строки (startsWith)
  return props.options.filter(opt =>
    opt.toLowerCase().startsWith(cleanSearch.toLowerCase())
  )
})

const isCustomType = computed(() => {
  let search = ''
  if (isCursorInPlaceholder.value) {
    search = placeholderInput.value
  } else {
    search = input.value
  }
  if (!props.allowCustom) return false
  if (!search) return false
  
  // Убираем "?" для проверки существования в списке
  const cleanSearch = search.endsWith('?') ? search.slice(0, -1).trim() : search.trim()
  
  // Проверяем, что имя не существует в списке и является валидным
  const result = !props.options.includes(cleanSearch) && cleanSearch.length > 0 && validateTypeName(search)
  
  // Временная отладка
  if (isCursorInPlaceholder.value && search) {
    console.log('isCustomType debug:', {
      search,
      cleanSearch,
      notInOptions: !props.options.includes(cleanSearch),
      hasLength: cleanSearch.length > 0,
      isValid: validateTypeName(search),
      options: props.options,
      result
    })
  }
  
  return result
})

const createText = computed(() => {
  if (isCursorInPlaceholder.value) {
    return placeholderInput.value
  }
  return input.value
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
            // Очищаем placeholderInput и открываем список для выбора
            placeholderInput.value = ''
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

// Функция валидации имени типа
const validateTypeName = (name: string): boolean => {
  // Убираем "?" для проверки основного имени
  const cleanName = name.endsWith('?') ? name.slice(0, -1).trim() : name.trim()
  
  // Имя должно начинаться с буквы или подчеркивания и содержать только буквы, цифры и подчеркивания
  const validNamePattern = /^[A-Za-z_][A-Za-z0-9_]*$/
  return validNamePattern.test(cleanName) && cleanName.length > 0
}

const createCustomType = () => {
  let typeName = ''
  
  if (isCursorInPlaceholder.value) {
    // Если курсор в многоточии, берем текст из placeholderInput
    typeName = placeholderInput.value.trim()
  } else {
    // Обычный режим
    typeName = input.value.trim()
  }
  
  if (typeName && validateTypeName(typeName)) {
    // Извлекаем базовый тип из generic конструкций
    const genericPattern = /^(List|Array|Map|Set|Task|Nullable)<(.+?)>$/i
    const match = typeName.match(genericPattern)
    if (match) {
      typeName = match[2].trim()
      const innerMatch = typeName.match(/^([A-Za-z_][A-Za-z0-9_]*)/)
      if (innerMatch) {
        typeName = innerMatch[1]
      }
    }
    
    // Убираем "?" если есть
    if (typeName.endsWith('?')) {
      typeName = typeName.slice(0, -1).trim()
    }
    
    // Проверяем валидность извлеченного имени
    if (!validateTypeName(typeName)) {
      return // Не создаем тип с невалидным именем
    }
    
    const isEnum = typeName.toLowerCase().includes('enum')
    const typeKind = isEnum ? 'enum' : 'class'
    emit('createCustom', typeName, typeKind)
    
    if (isCursorInPlaceholder.value) {
      // Заменяем многоточие на созданный тип
      const { before, after } = getTextAroundPlaceholder.value
      const newValue = before + typeName + after
      emit('update:modelValue', newValue)
      input.value = newValue
      placeholderInput.value = ''
    } else {
      emit('update:modelValue', input.value.trim())
    }
    close()
  }
}

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  cursorPosition.value = target.selectionStart || 0
  selectionStart.value = target.selectionStart || 0
  selectionEnd.value = target.selectionEnd || 0
  
  // Проверяем, есть ли многоточие в значении
  const hasPlaceholder = props.modelValue && props.modelValue.includes('...')
  
  if (hasPlaceholder) {
    // Если есть многоточие, пытаемся извлечь текст из него
    const { before, after } = getTextAroundPlaceholder.value
    const currentInput = target.value.substring(before.length, target.value.length - after.length)
    placeholderInput.value = currentInput
    
    // Отладочная информация
    console.log('onInput debug:', {
      targetValue: target.value,
      before,
      after,
      currentInput,
      placeholderInput: placeholderInput.value,
      cursorPosition: cursorPosition.value
    })
  } else {
    // Обычный режим
    input.value = target.value
  }
  
  isOpen.value = true
  highlighted.value = 0
}

const onKeydown = (e: KeyboardEvent) => {
  if (!isOpen.value && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    isOpen.value = true
    highlighted.value = 0
    return
  }
  if (!isOpen.value) return
  const maxIndex = filteredOptions.value.length + (isCustomType.value ? 1 : 0) - 1
  if (e.key === 'ArrowDown') {
    if (highlighted.value < maxIndex) {
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
    } else if (highlighted.value === filteredOptions.value.length && isCustomType.value) {
      createCustomType()
    } else if (isCustomType.value) {
      createCustomType()
    }
    e.preventDefault()
  } else if (e.key === 'Escape') {
    close()
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
      // Учитываем, что "+ Создать ..." находится после всех опций
      const elementIndex = highlighted.value
      const highlightedElement = listRef.value.children[elementIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  })
}

const onFocus = () => {
  // При фокусе проверяем, находится ли курсор в многоточии
  if (isCursorInPlaceholder.value) {
    // Очищаем placeholderInput и показываем полный список
    placeholderInput.value = ''
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

defineExpose({
  focus: () => {
    inputRef.value?.focus()
  }
})
</script>

<template>
  <div class="autocomplete">
         <input
       ref="inputRef"
       class="input"
       v-model="input"
       :placeholder="props.placeholder"
       @focus="onFocus"
       @input="onInput"
       @keydown="onKeydown"
       autocomplete="off"
       spellcheck="false"
     />
    <div v-if="isOpen" class="list" ref="listRef">
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
        Создать "{{ createText }}"
      </div>
      <div v-if="isOpen && filteredOptions.length === 0 && !isCustomType" class="empty">
        Нет совпадений
      </div>
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