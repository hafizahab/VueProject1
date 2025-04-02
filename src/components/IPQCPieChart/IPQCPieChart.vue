<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const IPQCPending = ref(0);
const IPQCCompleted = ref(0);

const fetchIPQCData = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/IPQC');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count

        // Count pending and completed jobs
        IPQCPending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        IPQCCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;
    } catch (error) {
        console.error('Error fetching IPQC details:', error);
    }
};

onMounted(() => {
    fetchIPQCData();
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
        data: [IPQCPending.value, IPQCCompleted.value],
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
