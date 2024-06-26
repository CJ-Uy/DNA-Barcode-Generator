<script setup>
import html2canvas from "html2canvas";

const dnaSequence = ref("");
const barcodeWidth = ref(500);

const colorMapping = {
  a: "green",
  c: "blue",
  g: "black",
  t: "red",
  default: "gray",
};

const generateBarcode = () => {
  barcodeColors.value = dnaSequence.value
    .toLowerCase()
    .split("")
    .map((nucleotide) => colorMapping[nucleotide] || colorMapping.default);
};

const barcodeColors = ref([]);

const barcodeElement = ref(null);
const downloadBarcode = async () => {
  window.scrollTo(0, 0);
  // Check if barcodeElement.value is a valid HTML element
  if (barcodeElement.value instanceof HTMLElement) {
    const canvas = await html2canvas(barcodeElement.value, {
      width: barcodeElement.value.scrollWidth,
      height: barcodeElement.value.scrollHeight,
      windowWidth: barcodeElement.value.scrollWidth,
      windowHeight: barcodeElement.value.scrollHeight,
      scrollY: -window.scrollY,
      scale: 1, // You can adjust the scale for better resolution
      backgroundColor: null,
    });
    const image = canvas.toDataURL("image/png");

    // Create a link to download the image
    const link = document.createElement("a");
    link.href = image;
    link.download = "dna-barcode.png";
    document.body.appendChild(link);
    link.click();

    // Remove the link after starting the download
    document.body.removeChild(link);
  } else {
    console.error("barcodeElement.value is not a valid HTML element");
  }
};
</script>

<template>
  <div class="m-10">
    <UCard class="mb-10">
      <template #header>
        <h1>DNA BARCODE MAKER</h1>
      </template>

      <UTextarea v-model="dnaSequence" placeholder="Enter DNA sequence" />
      <template #footer>
        <div class="flex flex-col justify-center items-center">
          <UButton
            label="Generate DNA Barcode"
            @click="generateBarcode"
            class="mr-3 mb-5"
          />
          <URange
            v-model="barcodeWidth"
            label="Barcode Width"
            min="100"
            max="1500"
          />
          <UButton label="Download DNA Barcode" @click="downloadBarcode" />
        </div>
      </template>
    </UCard>

    <div class="flex flex-col justify-center items-center">
      <div
        class="barcode"
        ref="barcodeElement"
        :style="{ width: barcodeWidth + 'px' }"
      >
        <!-- Barcode -->
        <div
          v-for="(color, index) in barcodeColors"
          :key="index"
          :style="{ backgroundColor: color }"
          class="w-1 h-10 mr-[1px] inline-block mb-[-3.5px]"
        ></div>
      </div>
      <div>
        <!-- Legend -->
        <div class="text-center mt-3 font-bold">LEGEND:</div>
        <div class="legend flex justify-center mt-3">
          <div
            v-for="(color, nucleotide) in colorMapping"
            :key="nucleotide"
            class="flex items-center mr-12"
          >
            <div :style="{ backgroundColor: color }" class="w-1 h-6 mr-2"></div>
            <span v-if="nucleotide != 'default'">{{
              nucleotide.toUpperCase()
            }}</span>
            <span v-else>No Consensus</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
