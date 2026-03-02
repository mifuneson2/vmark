<script setup>
import { ref, computed, onMounted } from 'vue'

const stats = ref(null)
const error = ref(false)

const platformLabels = {
  'darwin-aarch64': 'macOS (Apple Silicon)',
  'darwin-x86_64': 'macOS (Intel)',
  'windows-x86_64': 'Windows',
  'linux-x86_64': 'Linux',
  'linux-aarch64': 'Linux (ARM)',
}

function label(key) {
  return platformLabels[key] || key
}

const hasPlatforms = computed(() => {
  return stats.value && stats.value.platforms && Object.keys(stats.value.platforms).length > 0
})

const hasVersions = computed(() => {
  return stats.value && stats.value.versions && Object.keys(stats.value.versions).length > 0
})

const versionRows = computed(() => {
  if (!hasVersions.value) return []
  const entries = Object.entries(stats.value.versions)
  entries.sort(([a], [b]) => b.localeCompare(a, undefined, { numeric: true }))
  const rows = entries.slice(0, 3).map(([v, c]) => ({ label: `v${v}`, count: c }))
  if (entries.length > 3) {
    const olderSum = entries.slice(3).reduce((sum, [, c]) => sum + c, 0)
    rows.push({ label: 'Older', count: olderSum })
  }
  return rows
})

onMounted(async () => {
  try {
    const res = await fetch('https://log.vmark.app/api/stats')
    stats.value = await res.json()
  } catch {
    error.value = true
  }
})
</script>

<template>
  <div v-if="stats && stats.total && stats.total.pings > 0" class="user-stats">
    <div class="stats-grid">
      <div class="stat-header">
        <span class="header-spacer"></span>
        <span class="header-label">Today</span>
        <span class="header-label">This Week</span>
        <span class="header-label">This Month</span>
        <span class="header-label">All Time</span>
      </div>
      <div class="stat-row">
        <span class="row-label">Update Pings</span>
        <span class="stat-sub">{{ stats.today.pings }}</span>
        <span class="stat-sub">{{ stats.week.pings }}</span>
        <span class="stat-sub">{{ stats.month.pings }}</span>
        <span class="stat-sub">{{ stats.total.pings }}</span>
      </div>
      <div class="stat-row">
        <span class="row-label">Unique IPs</span>
        <span class="stat-number">{{ stats.today.ips }}</span>
        <span class="stat-number">{{ stats.week.ips }}</span>
        <span class="stat-number">{{ stats.month.ips }}</span>
        <span class="stat-number">{{ stats.total.ips }}</span>
      </div>
    </div>

    <div v-if="hasPlatforms || hasVersions" class="stats-details">
      <div v-if="hasPlatforms" class="stats-breakdown">
        <h4 class="breakdown-title">Platforms</h4>
        <div class="breakdown-list">
          <div v-for="(count, platform) in stats.platforms" :key="platform" class="breakdown-item">
            <span class="breakdown-label">{{ label(platform) }}</span>
            <span class="breakdown-value">{{ count }}</span>
          </div>
        </div>
      </div>
      <div v-if="hasVersions" class="stats-breakdown">
        <h4 class="breakdown-title">Versions</h4>
        <div class="breakdown-list">
          <div v-for="row in versionRows" :key="row.label" class="breakdown-item">
            <span class="breakdown-label">{{ row.label }}</span>
            <span class="breakdown-value">{{ row.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <p class="stats-note">
      Unique IPs / update check pings — actual users may be higher (shared IPs).
      <a href="/guide/privacy">Privacy →</a>
    </p>
  </div>
</template>

<style scoped>
.user-stats {
  margin: 1.5rem 0;
  text-align: center;
}

.stats-grid {
  display: inline-grid;
  grid-template-columns: auto auto auto auto auto;
  gap: 0.25rem 1.5rem;
  justify-items: center;
  margin: 0 auto;
}

.stat-header,
.stat-row {
  display: contents;
}

.header-spacer {
  /* empty first column */
}

.header-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  padding-bottom: 0.25rem;
}

.row-label {
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  justify-self: end;
  padding: 0.35rem 0;
}

.stat-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--vp-c-brand-1);
  line-height: 1.2;
  padding: 0.35rem 0;
}

.stat-sub {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
  padding: 0.35rem 0;
}

.stats-details {
  display: flex;
  gap: 2rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.25rem;
}

.stats-breakdown {
  min-width: 160px;
}

.breakdown-title {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  margin: 0 0 0.5rem 0;
  text-align: center;
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  background: var(--vp-c-bg-soft);
  font-size: 0.8rem;
}

.breakdown-label {
  color: var(--vp-c-text-2);
}

.breakdown-value {
  color: var(--vp-c-brand-1);
  font-weight: 600;
  margin-left: 1rem;
}

.stats-note {
  text-align: center;
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin-top: 0.75rem;
}

.stats-note a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.stats-note a:hover {
  text-decoration: underline;
}
</style>
