<script setup>
const colorLegend = [
  { nucleotide: 'A', color: 'green', name: 'Adenine' },
  { nucleotide: 'C', color: 'blue', name: 'Cytosine' },
  { nucleotide: 'G', color: 'black', name: 'Guanine' },
  { nucleotide: 'T', color: 'red', name: 'Thymine' },
  { nucleotide: 'Other', color: 'gray', name: 'Non-standard / gap' },
]
</script>

<template>
  <div class="flex flex-col gap-6">

    <UCard>
      <template #header>
        <h1 class="text-xl font-bold text-neutral-800 dark:text-neutral-100">About DNA Barcode Generator</h1>
      </template>

      <div class="flex flex-col gap-6 text-neutral-700 dark:text-neutral-300 text-sm leading-relaxed">

        <section>
          <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">What is DNA Barcoding?</h2>
          <p class="mb-2">
            DNA barcoding is a technique for identifying species using short, standardized regions of the genome,
            similar to how a product barcode uniquely identifies an item. By comparing these sequences across organisms,
            scientists can identify unknown specimens, study biodiversity, and detect food fraud or illegal wildlife trade.
          </p>
          <p>
            The most widely used barcode gene for animals is COI (cytochrome oxidase subunit I),
            a mitochondrial gene that is well-conserved within species but variable enough between species
            to act as a reliable identifier. For bacteria and archaea, 16S rRNA is the standard.
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-3">How the Colors Work</h2>
          <p class="mb-4">
            Each nucleotide in the sequence is mapped to a color and rendered as a vertical bar.
            The full sequence becomes a unique visual fingerprint:
          </p>
          <div class="flex flex-wrap gap-4">
            <div v-for="item in colorLegend" :key="item.nucleotide" class="flex items-center gap-2">
              <div :style="{ backgroundColor: item.color }" class="w-2 h-8 rounded-sm shrink-0" />
              <div>
                <div class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ item.nucleotide }}</div>
                <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.name }}</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Data Source: NCBI Entrez</h2>
          <p class="mb-2">
            Species sequences are fetched from the
            <a href="https://www.ncbi.nlm.nih.gov/" target="_blank" rel="noopener" class="text-primary-600 hover:underline font-medium">
              National Center for Biotechnology Information (NCBI)
            </a>
            using their free Entrez E-utilities API.
            NCBI is a division of the U.S. National Library of Medicine and hosts the world's largest
            public database of DNA sequences (GenBank).
          </p>
          <p>
            The API is free and publicly accessible. Searches are rate-limited to approximately
            3 requests per second for unauthenticated users, which is more than enough for interactive use.
          </p>
        </section>

        <section>
          <h2 class="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">How to Use</h2>
          <ol class="list-decimal list-inside space-y-1">
            <li>Search for a species by name (common or scientific) and select a gene type</li>
            <li>The top matching sequence loads automatically, or you can browse the full results list</li>
            <li>Click Generate Barcode to visualize the sequence</li>
            <li>Adjust the width slider to zoom in or out on the barcode</li>
            <li>Download the barcode as a PNG image</li>
          </ol>
        </section>

      </div>

      <template #footer>
        <UButton to="/" label="Go to Generator" icon="i-heroicons-arrow-left" variant="soft" />
      </template>
    </UCard>

  </div>
</template>