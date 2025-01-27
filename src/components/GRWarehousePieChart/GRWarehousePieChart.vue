<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const totalWH = ref(0);
const receivedWH = ref(0);
const notReceivedWH = ref(0);

const fetchGRWarehouse = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');
        const result = response.data.result;

        // Filter the result to include only items where qcrequired is false
        const filteredResult = result.filter((item: any) => item.status === 'Completed');

        totalWH.value = filteredResult.length;
        receivedWH.value = filteredResult.filter((item: any) => item.receiveStatus === true).length;
        notReceivedWH.value = filteredResult.filter((item: any) => item.receiveStatus === false).length;
    } catch (error) {
        console.error('Error fetching GR details:', error);
    }
};

onMounted(() => {
  fetchGRWarehouse();
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
    labels: ["Pending", "Received"],
    datasets: [
      {
        data: [notReceivedWH.value, receivedWH.value],
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
