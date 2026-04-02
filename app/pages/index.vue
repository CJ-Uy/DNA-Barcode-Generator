<script setup>
import html2canvas from 'html2canvas'

// ─── Barcode State ───────────────────────────────────────
const dnaSequence = ref('')
const barcodeWidth = ref(500)
const barcodeColors = ref([])
const barcodeElement = ref(null)

// ─── Advanced Settings ───────────────────────────────────
const showAdvanced = ref(false)
const rectangleLock = ref(false)
const barWidth = ref(4)
const barGap = ref(1)
const nucleotideColors = ref({
  A: '#22c55e',
  C: '#3b82f6',
  G: '#000000',
  T: '#ef4444',
  other: '#9ca3af',
})

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

// Rectangle lock: uses CSS grid for exact column layout
const barsPerRow = computed(() => {
  const step = barWidth.value + barGap.value
  return step > 0 ? Math.max(1, Math.floor(barcodeWidth.value / step)) : 1
})

// Pad last row so the grid fills a complete rectangle
const displayColors = computed(() => {
  if (!rectangleLock.value || barcodeColors.value.length === 0) return barcodeColors.value
  const extra = barcodeColors.value.length % barsPerRow.value
  if (extra === 0) return barcodeColors.value
  return [...barcodeColors.value, ...Array(barsPerRow.value - extra).fill('transparent')]
})

// Container style: grid when locked, fixed-width inline-block when not
const barcodeContainerStyle = computed(() => {
  if (rectangleLock.value && barcodeColors.value.length > 0) {
    const cols = barsPerRow.value
    const w = cols * barWidth.value + Math.max(0, cols - 1) * barGap.value
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, ${barWidth.value}px)`,
      columnGap: barGap.value + 'px',
      rowGap: '0px',
      width: w + 'px',
    }
  }
  return { width: barcodeWidth.value + 'px' }
})

// Bar style: no margin when using grid (grid-gap handles spacing)
const barStyle = (color) => {
  if (rectangleLock.value) {
    return { backgroundColor: color, width: barWidth.value + 'px', height: '40px' }
  }
  return {
    backgroundColor: color,
    width: barWidth.value + 'px',
    marginRight: barGap.value + 'px',
    height: '40px',
    display: 'inline-block',
    verticalAlign: 'top',
  }
}

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

const downloadBarcode = async () => {
  window.scrollTo(0, 0)
  if (barcodeElement.value instanceof HTMLElement) {
    const canvas = await html2canvas(barcodeElement.value, {
      width: barcodeElement.value.scrollWidth,
      height: barcodeElement.value.scrollHeight,
      windowWidth: barcodeElement.value.scrollWidth,
      windowHeight: barcodeElement.value.scrollHeight,
      scrollY: -window.scrollY,
      scale: 1,
      backgroundColor: null,
    })
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = 'dna-barcode.png'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
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

    <!-- Card 3: Barcode Output -->
    <UCard v-if="barcodeColors.length > 0">
      <template #header>
        <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100">Barcode</h2>
      </template>

      <div class="flex flex-col items-center gap-4">
        <!-- Barcode visualization -->
        <div
          ref="barcodeElement"
          :style="barcodeContainerStyle"
          class="overflow-hidden"
        >
          <div
            v-for="(color, index) in displayColors"
            :key="index"
            :style="barStyle(color)"
          />
        </div>

        <!-- Legend -->
        <div class="flex flex-wrap justify-center gap-6">
          <div v-for="item in legendItems" :key="item.nucleotide" class="flex items-center gap-1.5">
            <div :style="{ backgroundColor: item.color }" class="w-1.5 h-5 rounded-sm" />
            <span class="text-xs text-neutral-600 dark:text-neutral-300 font-medium">{{ item.nucleotide }}</span>
          </div>
        </div>

        <!-- Width Slider -->
        <div class="w-full max-w-sm">
          <div class="flex justify-between text-xs text-neutral-400 dark:text-neutral-500 mb-1">
            <span>Width</span>
            <span>{{ barcodeWidth }}px</span>
          </div>
          <USlider v-model="barcodeWidth" :min="100" :max="1500" />
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
            Rectangle lock — snap to clean block
            <span v-if="rectangleLock" class="text-neutral-400">({{ barsPerRow }} bars/row)</span>
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

          <!-- Gap -->
          <div>
            <div class="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1">
              <span>Gap between bars</span>
              <span>{{ barGap }}px</span>
            </div>
            <USlider v-model="barGap" :min="0" :max="8" />
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
      </div>

      <template #footer>
        <UButton
          label="Download PNG"
          icon="i-heroicons-arrow-down-tray"
          variant="soft"
          @click="downloadBarcode"
        />
      </template>
    </UCard>

  </div>
</template>
