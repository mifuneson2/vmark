<script setup lang="ts">
// Beta badge for VMark site title
// Minimal outlined design with subtle pulse indicator
</script>

<template>
  <span class="beta-badge" title="Beta Release - Stable but evolving">
    <span class="beta-dot"></span>
    <span class="beta-text">beta</span>
  </span>
</template>

<style scoped>
.beta-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: 10px;
  padding: 2px 8px 2px 6px;
  font-size: 10px;
  font-weight: 500;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  letter-spacing: 0.5px;
  text-transform: lowercase;
  border-radius: 100px;
  border: 1px solid var(--vp-c-brand-1);
  background: transparent;
  color: var(--vp-c-brand-1);
  cursor: help;
  user-select: none;
  vertical-align: middle;
  position: relative;
  top: -1px;
  transition: all 0.2s ease;
}

.beta-badge:hover {
  background: var(--vp-c-brand-soft);
  border-color: var(--vp-c-brand-2);
}

/* Pulsing dot indicator */
.beta-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  position: relative;
  flex-shrink: 0;
}

.beta-dot::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
  opacity: 0.4;
  animation: beta-pulse 2s ease-in-out infinite;
}

.beta-text {
  line-height: 1;
}

@keyframes beta-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* Theme adjustments */
[data-vmark-theme="night"] .beta-badge,
.dark .beta-badge {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}

[data-vmark-theme="night"] .beta-dot,
.dark .beta-dot {
  background: var(--vp-c-brand-1);
}

[data-vmark-theme="night"] .beta-dot::before,
.dark .beta-dot::before {
  background: var(--vp-c-brand-1);
}

/* Reduce motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  .beta-dot::before {
    animation: none;
    opacity: 0.3;
    transform: scale(1.5);
  }
}
</style>
