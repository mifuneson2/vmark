<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { wrapCJKRuns } from '../../theme/cjkSpacing'

const spacing = ref('0.05')
const previewRef = ref<HTMLElement | null>(null)
const compareWithRef = ref<HTMLElement | null>(null)

const spacingOptions = [
  { value: '0', label: 'Off', description: 'No extra spacing' },
  { value: '0.02', label: '0.02em', description: 'Tight - subtle' },
  { value: '0.03', label: '0.03em', description: 'Normal - balanced' },
  { value: '0.05', label: '0.05em', description: 'Loose - airy' },
  { value: '0.08', label: '0.08em', description: 'Very loose' },
]

const sampleTexts = [
  '中文排版的艺术在于细节。',
  '良好的字间距让阅读更加轻松自然。',
  '日本語の文字間隔も調整できます。',
  '한국어 텍스트도 지원됩니다.',
]

/** Apply wrapCJKRuns to preview and compare containers */
function applyWrapping() {
  if (previewRef.value) wrapCJKRuns(previewRef.value)
  if (compareWithRef.value) wrapCJKRuns(compareWithRef.value)
}

onMounted(() => applyWrapping())

// Re-wrap after spacing change (Vue re-renders the text, removing spans)
watch(spacing, () => nextTick(() => applyWrapping()))
</script>

<template>
  <div class="vmark-demo">
    <p class="vmark-demo__subtitle">Fine-tune character spacing for CJK text</p>

    <div class="options">
      <button
        v-for="option in spacingOptions"
        :key="option.value"
        :class="['option-btn', { 'active': spacing === option.value }]"
        @click="spacing = option.value"
      >
        <span class="option-btn__label">{{ option.label }}</span>
        <span class="option-btn__desc">{{ option.description }}</span>
      </button>
    </div>

    <div
      ref="previewRef"
      class="preview"
      :style="{ '--cjk-demo-spacing': spacing === '0' ? '0' : spacing + 'em' }"
    >
      <p
        v-for="(text, index) in sampleTexts"
        :key="index"
        class="preview__text"
      >
        {{ text }}
      </p>
    </div>

    <div class="vmark-grid vmark-grid--2">
      <div class="compare">
        <div class="compare__label">Without spacing</div>
        <div class="compare__text">
          中文排版的艺术在于细节。
        </div>
      </div>
      <div class="compare">
        <div class="compare__label">With 0.05em spacing</div>
        <div ref="compareWithRef" class="compare__text compare__text--spaced">
          中文排版的艺术在于细节。
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./vmark-ui.css"></style>
<style scoped>
.options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 8px 14px;
  font-family: var(--font-sans);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.option-btn:hover {
  border-color: var(--accent-primary);
}

.option-btn.active {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
  color: var(--contrast-text);
}

.option-btn__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.option-btn.active .option-btn__label {
  color: var(--contrast-text);
}

.option-btn__desc {
  font-size: 11px;
  color: var(--text-secondary);
}

.option-btn.active .option-btn__desc {
  color: rgba(255, 255, 255, 0.8);
}

.preview {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 24px;
  margin-bottom: 20px;
}

/* CJK spans inside preview use the dynamic spacing value */
.preview :deep(.cjk-spacing) {
  letter-spacing: var(--cjk-demo-spacing, 0.05em);
}

.preview__text {
  margin: 0 0 12px 0;
  font-size: 18px;
  line-height: 1.8;
  color: var(--text-color);
}

.preview__text:last-child {
  margin-bottom: 0;
}

.compare {
  padding: 16px;
  background: var(--subtle-bg);
  border-radius: var(--radius-md);
}

.compare__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.compare__text {
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-color);
}

.compare__text--spaced :deep(.cjk-spacing) {
  letter-spacing: 0.05em;
}
</style>
