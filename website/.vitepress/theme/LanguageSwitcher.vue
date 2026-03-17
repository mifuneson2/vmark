<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { site, localeIndex, page } = useData()

const locales = [
  { key: 'root', flag: 'us' },
  { key: 'zh-CN', flag: 'cn' },
  { key: 'zh-TW', flag: 'hk' },
  { key: 'ja', flag: 'jp' },
  { key: 'ko', flag: 'kr' },
  { key: 'es', flag: 'es' },
  { key: 'fr', flag: 'fr' },
  { key: 'de', flag: 'de' },
  { key: 'it', flag: 'it' },
  { key: 'pt-BR', flag: 'br' },
]

const items = computed(() => {
  const siteLocales = site.value.locales
  const currentKey = localeIndex.value
  const relativePath = page.value.relativePath

  const currentPrefix = currentKey === 'root' ? '' : `${currentKey}/`

  return locales.map(({ key, flag }) => {
    const config = siteLocales[key]
    if (!config) return null

    const targetPrefix = key === 'root' ? '' : `${key}/`
    let pagePath = relativePath
    if (currentPrefix && pagePath.startsWith(currentPrefix)) {
      pagePath = pagePath.slice(currentPrefix.length)
    }

    const link = `/${targetPrefix}${pagePath}`
      .replace(/\.md$/, '.html')
      .replace(/index\.html$/, '')

    return {
      label: config.label,
      link,
      flag,
      active: key === currentKey,
    }
  }).filter(Boolean)
})
</script>

<template>
  <div class="lang-dropdown">
    <button class="lang-trigger" title="Switch language">
      <span class="vpi-languages" />
    </button>
    <div class="lang-menu">
      <a
        v-for="item in items"
        :key="item!.link"
        :href="item!.link"
        :class="['lang-option', { active: item!.active }]"
      >
        <span
          class="lang-flag"
          :style="{ backgroundImage: `url(https://flagicons.lipis.dev/flags/4x3/${item!.flag}.svg)` }"
        ></span>
        <span>{{ item!.label }}</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.lang-dropdown {
  position: relative;
  display: none;
}

@media (min-width: 1280px) {
  .lang-dropdown {
    display: flex;
    align-items: center;
  }
}

.lang-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background 0.2s ease;
  color: var(--vp-c-text-2);
  font-size: 16px;
}

.lang-trigger:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.lang-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: var(--dropdown-min-width);
  padding: var(--dropdown-padding);
  border: 1px solid var(--vp-c-border);
  border-radius: var(--dropdown-radius);
  background: var(--vp-c-bg);
  box-shadow: var(--dropdown-shadow);
  z-index: 100;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s, visibility 0.25s;
}

.lang-dropdown:hover .lang-menu {
  opacity: 1;
  visibility: visible;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: var(--dropdown-item-padding);
  border: none;
  border-radius: var(--dropdown-item-radius);
  background: transparent;
  color: var(--vp-c-text-1);
  font-size: var(--dropdown-item-font-size);
  cursor: pointer;
  transition: background 0.15s ease;
  text-decoration: none;
}

.lang-option:hover {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
}

.lang-option.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.lang-flag {
  width: 15px;
  height: 11px;
  flex-shrink: 0;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  border-radius: 2px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15);
}
</style>
