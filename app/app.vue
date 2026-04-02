<script setup>
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
const toggleColorMode = () => {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}
</script>

<template>
  <UApp>
    <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <!-- Navigation Bar -->
      <nav class="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <NuxtLink to="/" class="flex items-center gap-2">
            <span class="text-lg font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">DNA Barcode Generator</span>
          </NuxtLink>
          <div class="flex items-center gap-1">
            <UButton to="/" variant="ghost" color="neutral" size="sm" label="Generator" />
            <UButton to="/about" variant="ghost" color="neutral" size="sm" label="About" />
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              :icon="isDark ? 'i-heroicons-sun' : 'i-heroicons-moon'"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggleColorMode"
            />
          </div>
        </div>
      </nav>

      <!-- Page Content -->
      <main class="max-w-3xl mx-auto px-6 py-10">
        <NuxtPage />
      </main>
    </div>
  </UApp>
</template>
