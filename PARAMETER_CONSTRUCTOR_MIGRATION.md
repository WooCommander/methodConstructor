# Перенос конструктора параметров в FSD проект

Этот документ описывает, как перенести конструктор параметров из исходного проекта в новый проект с архитектурой Feature-Sliced Design (FSD).

## Структура файлов для переноса

### 1. Общие типы (shared/types)
```
src/shared/types/parameter-constructor.ts
```

### 2. UI компоненты (shared/ui)
```
src/shared/ui/InputAutocomplete/InputAutocomplete.vue
```

### 3. Сущности (entities)
```
src/entities/custom-type/
├── model/types.ts
├── lib/validators.ts
└── ui/CustomTypeCard.vue
```

### 4. Фичи (features)
```
src/features/parameter-constructor/
├── model/types.ts
├── lib/
│   ├── code-generator.ts
│   └── utils.ts
└── ui/
    ├── ParameterConstructor.vue
    ├── MethodParameters.vue
    ├── CustomTypesList.vue
    └── CodeGenerator.vue
```

### 5. Страницы (pages)
```
src/pages/ConstructorPage/ConstructorPage.vue
```

## Инструкции по переносу

### Шаг 1: Создание структуры папок

Создайте следующую структуру в вашем FSD проекте:

```bash
mkdir -p src/shared/types
mkdir -p src/shared/ui/InputAutocomplete
mkdir -p src/entities/custom-type/{model,lib,ui}
mkdir -p src/features/parameter-constructor/{model,lib,ui}
mkdir -p src/pages/ConstructorPage
```

### Шаг 2: Копирование файлов

Скопируйте все файлы из списка выше в соответствующие папки вашего проекта.

### Шаг 3: Настройка роутинга

Добавьте роут для страницы конструктора в ваш роутер:

```typescript
// src/app/router/index.ts
import ConstructorPage from '@/pages/ConstructorPage/ConstructorPage.vue'

const routes = [
  {
    path: '/constructor',
    name: 'Constructor',
    component: ConstructorPage
  }
  // ... другие роуты
]
```

### Шаг 4: Обновление импортов

Убедитесь, что все импорты в файлах используют правильные пути для вашего проекта. Основные импорты:

```typescript
// В компонентах фичи
import InputAutocomplete from '@/shared/ui/InputAutocomplete/InputAutocomplete.vue'
import CustomTypeCard from '@/entities/custom-type/ui/CustomTypeCard.vue'

// В типах
import type { CustomType, MethodParameters } from '@/shared/types/parameter-constructor'
```

### Шаг 5: Настройка стилей

Убедитесь, что у вас есть глобальные стили. Если нет, создайте:

```scss
// src/shared/styles/variables.scss
$primary-color: #3b82f6;
$secondary-color: #64748b;
$success-color: #10b981;
$warning-color: #f59e0b;
$error-color: #ef4444;

$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-light: #9ca3af;

$bg-primary: #ffffff;
$bg-secondary: #f9fafb;
$bg-tertiary: #f3f4f6;

// ... остальные переменные
```

```scss
// src/shared/styles/global.scss
@import './variables.scss';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  color: $text-primary;
  background-color: $bg-secondary;
}

// ... остальные глобальные стили
```

## Использование конструктора

### Базовое использование

```vue
<template>
  <ParameterConstructor @update="handleUpdate" />
</template>

<script setup lang="ts">
import ParameterConstructor from '@/features/parameter-constructor/ui/ParameterConstructor.vue'
import type { CustomType, MethodParameters } from '@/features/parameter-constructor/model/types'

const handleUpdate = (state: { customTypes: CustomType[], methodParameters: MethodParameters }) => {
  console.log('State updated:', state)
}
</script>
```

### Расширенное использование с настройками

```vue
<template>
  <ParameterConstructor
    :initial-custom-types="initialTypes"
    :initial-method-parameters="initialParams"
    :settings="settings"
    @update="handleUpdate"
  />
</template>

<script setup lang="ts">
import ParameterConstructor from '@/features/parameter-constructor/ui/ParameterConstructor.vue'
import type { CustomType, MethodParameters, ConstructorSettings } from '@/features/parameter-constructor/model/types'

const initialTypes: CustomType[] = [
  {
    name: 'User',
    type: 'class',
    parameters: [
      { name: 'id', type: 'int', description: 'User ID' },
      { name: 'name', type: 'string', description: 'User name' }
    ],
    enumValues: []
  }
]

const initialParams: MethodParameters = {
  input: 'User',
  output: 'string'
}

const settings: ConstructorSettings = {
  language: 'typescript',
  generateDocumentation: true,
  useNullableTypes: false
}

const handleUpdate = (state: { customTypes: CustomType[], methodParameters: MethodParameters }) => {
  // Обработка изменений
}
</script>
```

### Программное управление

```vue
<template>
  <ParameterConstructor ref="constructorRef" />
  <button @click="addCustomType">Добавить тип</button>
  <button @click="getState">Получить состояние</button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ParameterConstructor from '@/features/parameter-constructor/ui/ParameterConstructor.vue'

const constructorRef = ref<InstanceType<typeof ParameterConstructor> | null>(null)

const addCustomType = () => {
  constructorRef.value?.addCustomType('NewType')
}

const getState = () => {
  const state = constructorRef.value?.getState()
  console.log('Current state:', state)
}
</script>
```

## Возможности конструктора

### 1. Базовые типы
- `string`, `int`, `float`, `boolean`, `Date`
- `List<...>`, `Array<...>`, `Map<...>`, `Set<...>`

### 2. Пользовательские типы
- Классы с параметрами и описаниями
- Перечисления с значениями
- Валидация имен и типов

### 3. Генерация кода
- Поддержка C#, TypeScript, Java
- Автоматическая генерация документации
- Экспорт в файлы
- Копирование в буфер обмена

### 4. Сохранение состояния
- Автоматическое сохранение в localStorage
- Загрузка сохраненного состояния
- Очистка состояния

## Настройка и кастомизация

### Добавление новых языков программирования

1. Обновите тип `ConstructorSettings` в `src/features/parameter-constructor/model/types.ts`
2. Добавьте методы генерации в `src/features/parameter-constructor/lib/code-generator.ts`
3. Обновите компонент `CodeGenerator.vue`

### Добавление новых базовых типов

1. Обновите массив `BASE_TYPES` в `src/features/parameter-constructor/lib/utils.ts`
2. Обновите тип `BaseType` в `src/shared/types/parameter-constructor.ts`

### Кастомизация стилей

Все компоненты используют SCSS модули. Вы можете переопределить стили, создав свои CSS переменные или изменив существующие стили.

## Требования

- Vue 3 с Composition API
- TypeScript
- SCSS поддержка
- Поддержка ES6+ модулей

## Поддержка браузеров

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Лицензия

Этот код предоставляется как есть для использования в ваших проектах. 