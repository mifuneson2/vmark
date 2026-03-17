import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import LanguageSwitcher from './LanguageSwitcher.vue'
import GitHubLink from './GitHubLink.vue'
import BetaBadge from './BetaBadge.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'nav-bar-title-after': () => h(BetaBadge),
      'nav-bar-content-after': () => h('div', { class: 'nav-icons' }, [
        h(LanguageSwitcher),
        h(ThemeSwitcher),
        h(GitHubLink),
      ]),
    })
  },
} satisfies Theme
