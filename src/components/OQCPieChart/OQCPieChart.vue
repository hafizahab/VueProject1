<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const OQCPending = ref(0);
const OQCCompleted = ref(0);

const fetchOQCData = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/QCInspection');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count

        // Count pending and completed jobs
        OQCPending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        OQCCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;
    } catch (error) {
        console.error('Error fetching OQC details:', error);
    }
};

onMounted(() => {
    fetchOQCData();
});

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const colorScheme = computed(() => useColorSchemeStore().colorScheme);
const darkMode = computed(() => useDarkModeStore().darkMode);

const customColors = ['#eab308', '#22c55e'];

const data = computed<ChartData>(() => {
  return {
    labels: ["Pending", "Completed"],
    datasets: [
      {
        data: [OQCPending.value, OQCCompleted.value],
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
