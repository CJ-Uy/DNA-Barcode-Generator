const GENE_TERMS: Record<string, string> = {
  'COI (mtDNA)': 'COI[Gene] OR cytochrome oxidase I[Gene]',
  '16S rRNA': '16S rRNA[Gene] OR 16S ribosomal RNA[Gene]',
  '18S rRNA': '18S rRNA[Gene] OR 18S ribosomal RNA[Gene]',
  'ITS': 'ITS[Gene] OR internal transcribed spacer[Gene]',
}

export interface NCBIResult {
  id: string
  title: string
  length: number
}

export function useNCBI() {
  const results = ref<NCBIResult[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function searchSpecies(species: string, geneType: string): Promise<string> {
    pending.value = true
    error.value = null
    results.value = []

    try {
      // "Custom keyword" means search by species name only (no gene filter)
      const geneTerm = geneType === 'Custom keyword' ? '' : (GENE_TERMS[geneType] ?? geneType)
      const searchTerm = geneTerm ? `${species}[Organism] AND ${geneTerm}` : `${species}[Organism]`

      // Step 1: esearch — get sequence IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nucleotide&term=${encodeURIComponent(searchTerm)}&retmax=10&retmode=json`
      const searchData = await $fetch<any>(searchUrl)

      const ids: string[] = searchData?.esearchresult?.idlist ?? []
      if (ids.length === 0) {
        error.value = `No sequences found for "${species}" with gene type "${geneType}". Try a different species name or gene type.`
        return ''
      }

      // Step 2: esummary — get titles and lengths for all IDs
      const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nucleotide&id=${ids.join(',')}&retmode=json`
      const summaryData = await $fetch<any>(summaryUrl)

      results.value = ids.map((id) => {
        const doc = summaryData?.result?.[id]
        return {
          id,
          title: doc?.title ?? id,
          length: doc?.slen ?? 0,
        }
      })

      // Step 3: efetch — get FASTA sequence for the top result
      return await fetchSequence(ids[0])
    } catch (e) {
      error.value = 'Failed to reach NCBI. Check your connection and try again.'
      return ''
    } finally {
      pending.value = false
    }
  }

  async function fetchSequence(id: string): Promise<string> {
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nucleotide&id=${id}&rettype=fasta&retmode=text`
    const fasta = await $fetch<string>(fetchUrl, { responseType: 'text' })
    // FASTA format: first line starts with ">", rest are sequence lines
    const lines = fasta.split('\n').filter((l: string) => l.trim() !== '')
    const sequenceLines = lines.filter((l: string) => !l.startsWith('>'))
    return sequenceLines.join('').toUpperCase()
  }

  function reset() {
    results.value = []
    error.value = null
    pending.value = false
  }

  return { results, pending, error, searchSpecies, fetchSequence, reset }
}
