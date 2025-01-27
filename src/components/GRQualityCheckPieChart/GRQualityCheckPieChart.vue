<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const totalQC = ref(0);
const completedQC = ref(0);
const pendingQcQC = ref(0);
const qcRejectedQC = ref(0);

const fetchGRQualityCheck = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');
        const result = response.data.result;

        // Filter the result to include only items where qcrequired is false
        const filteredResult = result.filter((item: any) => item.qcrequired === true);

        totalQC.value = filteredResult.length;
        completedQC.value = filteredResult.filter((item: any) => item.status === 'Completed').length;
        pendingQcQC.value = filteredResult.filter((item: any) => item.status === 'Pending QC').length;
        qcRejectedQC.value = filteredResult.filter((item: any) => item.status === 'QC Rejected').length;
    } catch (error) {
        console.error('Error fetching GR details:', error);
    }
};


onMounted(() => {
    fetchGRQualityCheck();
});

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const colorScheme = computed(() => useColorSchemeStore().colorScheme);
const darkMode = computed(() => useDarkModeStore().darkMode);

const customColors = ['#eab308', '#ef4444', '#22c55e'];

const data = computed<ChartData>(() => {
  return {
    labels: ["Pending QC", "QC Rejected", "Completed"],
    datasets: [
      {
        data: [pendingQcQC.value, qcRejectedQC.value, completedQC.value],
        backgroundColor: colorScheme.value ? customColors : "",
        hoverBackgroundColor: colorScheme.value ? customColors : "",
        borderWidth: 5,
        borderColor: darkMode.value ? '#333' : '#FFF', // Example border color
      },
    ],
  };
});

const options = computed<ChartOptions>(() => {
  return {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };
});
</script>

<template>
  <Chart
    type="pie"
    :width="props.width"
    :height="props.height"
    :data="data"
    :options="options"
  />
</template>
