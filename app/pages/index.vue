<script setup>
// ─── Barcode State ───────────────────────────────────────
const dnaSequence = ref('')
const barcodeColors = ref([])

// ─── Layout Controls ─────────────────────────────────────
const barsPerRowTarget = ref(80)  // user-facing "bars per row" slider
const rectangleLock = ref(false)

// ─── Advanced Settings ───────────────────────────────────
const showAdvanced = ref(false)
const barWidth = ref(4)
const barHeight = ref(40)
const barGap = ref(1)
const rowGap = ref(0)
const nucleotideColors = ref({
  A: '#22c55e',
  C: '#3b82f6',
  G: '#000000',
  T: '#ef4444',
  other: '#9ca3af',
})

// ─── Export State ────────────────────────────────────────
const downloadFormat = ref('png')
const downloadBg = ref('#ffffff')
const downloadFormats = [
  { label: 'PNG', value: 'png' },
  { label: 'JPG', value: 'jpg' },
  { label: 'SVG', value: 'svg' },
  { label: 'Transparent', value: 'transparent' },
]

const colorMapping = computed(() => ({
  a: nucleotideColors.value.A,
  c: nucleotideColors.value.C,
  g: nucleotideColors.value.G,
  t: nucleotideColors.value.T,
  default: nucleotideColors.value.other,
}))

const legendItems = computed(() => [
  { nucleotide: 'A', color: nucleotideColors.value.A },
  { nucleotide: 'C', color: nucleotideColors.value.C },
  { nucleotide: 'G', color: nucleotideColors.value.G },
  { nucleotide: 'T', color: nucleotideColors.value.T },
  { nucleotide: 'Other', color: nucleotideColors.value.other },
])

// Column counts where the last row is missing ≤5 bars (almost-clean rectangle)
const validCols = computed(() => {
  const n = barcodeColors.value.length
  if (n === 0) return []
  const valid = []
  for (let c = 1; c <= n; c++) {
    const remainder = n % c
    const missing = remainder === 0 ? 0 : c - remainder
    if (missing <= 5) valid.push(c)
  }
  return valid
})

// Actual bars per row: snaps to nearest valid col when locked, raw target otherwise
const barsPerRow = computed(() => {
  const target = Math.max(1, barsPerRowTarget.value)
  if (!rectangleLock.value || validCols.value.length === 0) return target
  return validCols.value.reduce((best, c) =>
    Math.abs(c - target) < Math.abs(best - target) ? c : best
  )
})

const maxBarsPerRow = computed(() => Math.max(1, barcodeColors.value.length))

// On lock-enable or new barcode, snap to the valid col count closest to a square
const _snapToSquare = () => {
  if (!rectangleLock.value || validCols.value.length === 0) return
  const sq = Math.sqrt(barcodeColors.value.length)
  barsPerRowTarget.value = validCols.value.reduce((best, c) =>
    Math.abs(c - sq) < Math.abs(best - sq) ? c : best
  )
}
watch(rectangleLock, (locked) => { if (locked) _snapToSquare() })
watch(barcodeColors, () => { if (rectangleLock.value) _snapToSquare() })

// Pad last row with transparent bars when locked and not a perfect fill
const displayColors = computed(() => {
  if (barcodeColors.value.length === 0) return []
  const cols = barsPerRow.value
  const extra = barcodeColors.value.length % cols
  if (!rectangleLock.value || extra === 0) return barcodeColors.value
  return [...barcodeColors.value, ...Array(cols - extra).fill('transparent')]
})

// Always CSS grid — both locked and unlocked use barsPerRow columns
const barcodeContainerStyle = computed(() => {
  if (barcodeColors.value.length === 0) return {}
  const cols = barsPerRow.value
  const w = cols * barWidth.value + Math.max(0, cols - 1) * barGap.value
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${barWidth.value}px)`,
    columnGap: barGap.value + 'px',
    rowGap: rowGap.value + 'px',
    width: w + 'px',
  }
})

const barStyle = (color) => ({
  backgroundColor: color,
  width: barWidth.value + 'px',
  height: barHeight.value + 'px',
})

const generateBarcode = () => {
  barcodeColors.value = dnaSequence.value
    .toLowerCase()
    .split('')
    .map((n) => colorMapping.value[n] || colorMapping.value.default)
}

const clearAll = () => {
  dnaSequence.value = ''
  barcodeColors.value = []
  ncbi.reset()
  searchQuery.value = ''
  showResults.value = false
}

const _triggerDownload = (href, filename) => {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Build a canvas that exactly matches the preview (uses displayColors + rowGap)
const _buildCanvas = () => {
  const colors = displayColors.value
  if (colors.length === 0) return null
  const cols = barsPerRow.value
  const rows = Math.ceil(colors.length / cols)
  const colStep = barWidth.value + barGap.value
  const rowStep = barHeight.value + rowGap.value
  const w = cols * barWidth.value + Math.max(0, cols - 1) * barGap.value
  const h = rows * barHeight.value + Math.max(0, rows - 1) * rowGap.value
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (downloadFormat.value !== 'transparent') {
    ctx.fillStyle = downloadBg.value
    ctx.fillRect(0, 0, w, h)
  }
  colors.forEach((color, i) => {
    if (color === 'transparent') return
    ctx.fillStyle = color
    ctx.fillRect((i % cols) * colStep, Math.floor(i / cols) * rowStep, barWidth.value, barHeight.value)
  })
  return canvas
}

const downloadBarcode = () => {
  const colors = displayColors.value
  if (colors.length === 0) return

  if (downloadFormat.value === 'svg') {
    const cols = barsPerRow.value
    const rows = Math.ceil(colors.length / cols)
    const colStep = barWidth.value + barGap.value
    const rowStep = barHeight.value + rowGap.value
    const w = cols * barWidth.value + Math.max(0, cols - 1) * barGap.value
    const h = rows * barHeight.value + Math.max(0, rows - 1) * rowGap.value
    const bg = downloadFormat.value !== 'transparent'
      ? `<rect width="${w}" height="${h}" fill="${downloadBg.value}"/>`
      : ''
    const rects = colors.map((color, i) => {
      if (color === 'transparent') return ''
      return `<rect x="${(i % cols) * colStep}" y="${Math.floor(i / cols) * rowStep}" width="${barWidth.value}" height="${barHeight.value}" fill="${color}"/>`
    }).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${bg}${rects}</svg>`
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    _triggerDownload(url, 'dna-barcode.svg')
    URL.revokeObjectURL(url)
    return
  }

  const canvas = _buildCanvas()
  if (!canvas) return
  const mime = downloadFormat.value === 'jpg' ? 'image/jpeg' : 'image/png'
  const ext = downloadFormat.value === 'transparent' ? 'png' : downloadFormat.value
  _triggerDownload(canvas.toDataURL(mime, 0.95), `dna-barcode.${ext}`)
}

// ─── Sequence Stats ───────────────────────────────────────
const seqStats = computed(() => {
  const seq = dnaSequence.value.toUpperCase()
  const len = seq.replace(/\s/g, '').length
  if (len === 0) return null
  const counts = { A: 0, C: 0, G: 0, T: 0, other: 0 }
  for (const ch of seq) {
    if (ch === 'A') counts.A++
    else if (ch === 'C') counts.C++
    else if (ch === 'G') counts.G++
    else if (ch === 'T') counts.T++
    else if (ch.trim()) counts.other++
  }
  const totalNucleotides = counts.A + counts.C + counts.G + counts.T
  const gcContent = totalNucleotides > 0 ? (((counts.G + counts.C) / totalNucleotides) * 100).toFixed(1) : '0.0'
  return { len, gcContent, ...counts }
})

// ─── Example Sequences ───────────────────────────────────
const EXAMPLES = [
  {
    label: 'Human COI',
    sequence: 'ATGTTCGCCGACCGTTGACTATTCTCTACAAACCACAAAGACATTGGAACACTATACCTATTATTCGGCGCATGAGCTGGAGTCCTAGGCACAGCTCTAAGCCTCCTTATTCGAGCCGAGCTGGGCCAGCCAGGCAACCTTCTAGGTAACGACCACATCTACAACGTTATCGTCACAGCCCATGCATTTGTAATAATCTTCTTCATAGTAATACCCATCATAATCGGAGGCTTTGGCAACTGACTAGTTCCCCTAATAATCGGTGCCCCCGATATGGCGTTTCCCCGCATAAACAACATAAGCTTCTGACTCTTACCTCCCTCTCTCCTACTCCTGCTCGCATCTGCTGGAGTAGAAGCTGGGGCTGGAACAGG',
  },
  {
    label: 'E. coli 16S',
    sequence: 'AAATTGAAGAGTTTGATCATGGCTCAGATTGAACGCTGGCGGCAGGCCTAACACATGCAAGTCGAACGGTAACAGGAAGAAGCTTGCTTCTTTGCTGACGAGTGGCGGACGGGTGAGTAATGTCTGGGAAACTGCCTGATGGAGGGGGATAACTACTGGAAACGGTAGCTAATACCGCATAACGTCGCAAGACCAAAGAGGGGGACCTTCGGGCCTCTTGCCATCGGATGTGCCCAGATGGGATTAGCTAGTAGGTGGGGTAACGGCTCACCTAGGCGACGATCCCTAGCTGGTCTGAGAGGATGACCAGCCACACTGGAACTGAGACACGGTCCAGACTCCTACGGGAGGCAGCAGTGGGGAATATTGCA',
  },
  {
    label: 'Arabidopsis ITS',
    sequence: 'TCGAAACCTGCATAGCAGAACGACCCGTGAACATGTAAAAACAATTTTCCCTTTGAGAAAATATTTTAAATTTTTTTCAAAACTTTTTTAAATGAGATTTTTGGATTTTTTTCTTTTTTTTCTTTTTTTTTTCAAACTTCTTTTTTTTAAAAAAAAAAGATTTTTGGAAAAAAAAAAAAAGATTTTTGGAAAAAAAAGATTTTTGGAAAAAAAAGATTTTTGGAAAAAAAAGATTTTTGGAAAAAAAAAAAAAGATTTTTGGAAAAAAAAAAAAAGATTTTTGGAAAAAAAAAAAAAGATTTTTGGAAAAAAAAAAAAAGAT',
  },
]

const loadExample = (seq) => {
  dnaSequence.value = seq
  barcodeColors.value = []
}

// ─── NCBI Search ─────────────────────────────────────────
const ncbi = useNCBI()
const searchQuery = ref('')
const selectedGeneType = ref('COI (mtDNA)')
const showResults = ref(false)
const loadingResult = ref(false)

const geneTypeOptions = [
  { label: 'COI (mtDNA)', value: 'COI (mtDNA)' },
  { label: '16S rRNA', value: '16S rRNA' },
  { label: '18S rRNA', value: '18S rRNA' },
  { label: 'ITS', value: 'ITS' },
  { label: 'Custom keyword', value: 'Custom keyword' },
]

const handleSearch = async () => {
  if (!searchQuery.value.trim()) return
  showResults.value = false
  const sequence = await ncbi.searchSpecies(searchQuery.value.trim(), selectedGeneType.value)
  if (sequence) {
    dnaSequence.value = sequence
    barcodeColors.value = []
  }
}

const selectResult = async (result) => {
  loadingResult.value = true
  const sequence = await ncbi.fetchSequence(result.id)
  loadingResult.value = false
  if (sequence) {
    dnaSequence.value = sequence
    barcodeColors.value = []
    showResults.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Card 1: Species Search -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Search by Species</h2>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Auto-populate a real DNA sequence from NCBI</p>
      </template>

      <div class="flex flex-col gap-3">
        <div class="flex gap-2">
          <UInput
            v-model="searchQuery"
            class="flex-1"
            placeholder='e.g. "dog", "Homo sapiens", "E. coli"'
            icon="i-heroicons-magnifying-glass"
            @keyup.enter="handleSearch"
          />
          <USelect
            v-model="selectedGeneType"
            :options="geneTypeOptions"
            class="w-44"
          />
        </div>
        <div class="flex items-center gap-3">
          <UButton
            label="Search"
            :loading="ncbi.pending.value"
            :disabled="!searchQuery.trim()"
            @click="handleSearch"
          />
          <button
            v-if="ncbi.results.value.length > 1"
            class="text-sm text-primary-600 hover:underline"
            @click="showResults = !showResults"
          >
            {{ showResults ? 'Hide' : '↕ ' + ncbi.results.value.length + ' results' }}
          </button>
        </div>

        <!-- Results Dropdown -->
        <div v-if="showResults && ncbi.results.value.length > 0" class="border border-neutral-200 rounded-lg overflow-hidden">
          <button
            v-for="result in ncbi.results.value"
            :key="result.id"
            class="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors disabled:opacity-50"
            :disabled="loadingResult"
            @click="selectResult(result)"
          >
            <div class="font-medium text-neutral-800 dark:text-neutral-100 truncate">{{ result.title }}</div>
            <div class="text-neutral-400 dark:text-neutral-500 text-xs mt-0.5">{{ result.length }} bp · ID: {{ result.id }}</div>
          </button>
        </div>

        <!-- Error -->
        <UAlert
          v-if="ncbi.error.value"
          color="red"
          variant="soft"
          icon="i-heroicons-exclamation-triangle"
          :description="ncbi.error.value"
        />
      </div>
    </UCard>

    <!-- Card 2: Sequence Input -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Sequence</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Or paste your own DNA sequence below</p>
          </div>
          <UButton
            v-if="dnaSequence || barcodeColors.length"
            label="Clear"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-heroicons-x-mark"
            @click="clearAll"
          />
        </div>
      </template>

      <div class="flex flex-col gap-3">
        <!-- Example chips -->
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-xs text-neutral-400 dark:text-neutral-500 font-medium">Examples:</span>
          <button
            v-for="ex in EXAMPLES"
            :key="ex.label"
            class="text-xs px-2.5 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 hover:border-primary-400 hover:text-primary-700 text-neutral-600 dark:text-neutral-300 transition-colors"
            @click="loadExample(ex.sequence)"
          >
            {{ ex.label }}
          </button>
        </div>

        <UTextarea
          v-model="dnaSequence"
          placeholder="Enter or paste a DNA sequence (A, C, G, T)..."
          :rows="4"
        />

        <!-- Stats -->
        <div v-if="seqStats" class="flex flex-wrap gap-3 text-xs text-neutral-500 dark:text-neutral-400">
          <span><span class="font-semibold text-neutral-700 dark:text-neutral-200">{{ seqStats.len }}</span> bp</span>
          <span>·</span>
          <span>GC: <span class="font-semibold text-neutral-700 dark:text-neutral-200">{{ seqStats.gcContent }}%</span></span>
          <span>·</span>
          <span class="text-green-700">A: {{ seqStats.A }}</span>
          <span class="text-blue-700">C: {{ seqStats.C }}</span>
          <span class="text-neutral-800">G: {{ seqStats.G }}</span>
          <span class="text-red-600">T: {{ seqStats.T }}</span>
          <template v-if="seqStats.other > 0">
            <span>·</span>
            <span class="text-gray-400">Other: {{ seqStats.other }}</span>
          </template>
        </div>
      </div>

      <template #footer>
        <UButton
          label="Generate Barcode"
          :disabled="!dnaSequence.trim()"
          @click="generateBarcode"
        />
      </template>
    </UCard>

    <!-- Card 3: Barcode Controls -->
    <UCard v-if="barcodeColors.length > 0">
      <template #header>
        <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Barcode</h2>
      </template>

      <div class="flex flex-col items-center gap-4">

        <!-- Legend -->
        <div class="flex flex-wrap justify-center gap-6">
          <div v-for="item in legendItems" :key="item.nucleotide" class="flex items-center gap-1.5">
            <div :style="{ backgroundColor: item.color }" class="w-1.5 h-5 rounded-sm" />
            <span class="text-xs text-neutral-600 dark:text-neutral-300 font-medium">{{ item.nucleotide }}</span>
          </div>
        </div>

        <!-- Bars per row slider -->
        <div class="w-full max-w-sm">
          <div class="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mb-1">
            <span>Bars per row</span>
            <span>{{ barsPerRow }}{{ rectangleLock && barsPerRow !== barsPerRowTarget ? ' (snapped)' : '' }}</span>
          </div>
          <USlider v-model="barsPerRowTarget" :min="1" :max="maxBarsPerRow" />
        </div>

        <!-- Rectangle Lock Toggle -->
        <div class="flex items-center gap-2 w-full max-w-sm">
          <input
            id="rect-lock"
            v-model="rectangleLock"
            type="checkbox"
            class="w-4 h-4 accent-primary-500 cursor-pointer"
          />
          <label for="rect-lock" class="text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer select-none">
            Rectangle lock
            <span v-if="rectangleLock" class="text-neutral-400">
              — {{ barsPerRow }} cols × {{ Math.ceil(barcodeColors.length / barsPerRow) }} rows
            </span>
          </label>
        </div>

        <!-- Advanced Settings Toggle -->
        <button
          class="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors w-full max-w-sm text-left"
          @click="showAdvanced = !showAdvanced"
        >
          {{ showAdvanced ? '▾ Hide advanced settings' : '▸ Advanced settings' }}
        </button>

        <!-- Advanced Settings Panel -->
        <div v-if="showAdvanced" class="w-full max-w-sm flex flex-col gap-4 border border-neutral-100 dark:border-neutral-700 rounded-lg p-4 bg-neutral-50 dark:bg-neutral-800">

          <!-- Bar Width -->
          <div>
            <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Bar width</span>
              <span>{{ barWidth }}px</span>
            </div>
            <USlider v-model="barWidth" :min="1" :max="16" />
          </div>

          <!-- Bar Height -->
          <div>
            <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Bar height</span>
              <span>{{ barHeight }}px</span>
            </div>
            <USlider v-model="barHeight" :min="4" :max="200" />
          </div>

          <!-- Column gap -->
          <div>
            <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Gap between bars</span>
              <span>{{ barGap }}px</span>
            </div>
            <USlider v-model="barGap" :min="0" :max="8" />
          </div>

          <!-- Row gap -->
          <div>
            <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Gap between rows</span>
              <span>{{ rowGap }}px</span>
            </div>
            <USlider v-model="rowGap" :min="0" :max="16" />
          </div>

          <!-- Nucleotide Colors -->
          <div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-2">Nucleotide colors</p>
            <div class="grid grid-cols-5 gap-2">
              <div v-for="key in ['A', 'C', 'G', 'T', 'other']" :key="key" class="flex flex-col items-center gap-1">
                <input
                  type="color"
                  :value="nucleotideColors[key]"
                  class="w-8 h-8 rounded cursor-pointer border border-neutral-200"
                  @input="nucleotideColors[key] = $event.target.value"
                />
                <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ key === 'other' ? '?' : key }}</span>
              </div>
            </div>
          </div>

          <!-- Reset Colors -->
          <button
            class="text-xs text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 text-left transition-colors"
            @click="nucleotideColors = { A: '#22c55e', C: '#3b82f6', G: '#000000', T: '#ef4444', other: '#9ca3af' }"
          >
            Reset colors to default
          </button>

        </div>

        <!-- Export Section -->
        <div class="w-full max-w-sm flex flex-col gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Export</p>

          <!-- Format pills -->
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="fmt in downloadFormats"
              :key="fmt.value"
              :class="[
                'text-xs px-3 py-1 rounded-full border transition-colors',
                downloadFormat === fmt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-500'
              ]"
              @click="downloadFormat = fmt.value"
            >{{ fmt.label }}</button>
          </div>

          <!-- Background color (hidden for transparent) -->
          <div v-if="downloadFormat !== 'transparent'" class="flex items-center gap-3">
            <label class="text-xs text-neutral-500 dark:text-neutral-400">Background</label>
            <input type="color" v-model="downloadBg" class="w-7 h-7 rounded cursor-pointer border border-neutral-200" />
            <span class="text-xs text-neutral-400 font-mono">{{ downloadBg }}</span>
          </div>

          <UButton
            label="Download"
            icon="i-heroicons-arrow-down-tray"
            variant="soft"
            class="self-start"
            @click="downloadBarcode"
          />
        </div>

      </div>
    </UCard>

    <!-- Barcode visualization — always outside the card, below controls -->
    <div
      v-if="barcodeColors.length > 0"
      class="relative w-screen left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border-y border-neutral-200 dark:border-neutral-800 py-6 overflow-x-auto flex justify-center"
    >
      <div :style="barcodeContainerStyle">
        <div v-for="(color, index) in displayColors" :key="index" :style="barStyle(color)" />
      </div>
    </div>

  </div>
</template>
