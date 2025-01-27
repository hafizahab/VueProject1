<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const totalWR = ref(0);
const completedWR = ref(0);
const pendingWR = ref(0);

const fetchWarehouseRequest = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/WarehouseRequest');
    const result = response.data.result;

    // Filter out items with 'Draft' status
    const filteredData = result.filter((item: any) => item.status !== 'Draft');

    // Add status field based on whPowderDetailsList
    filteredData.forEach((item: any) => {
      const allApproved = item.whPowderDetailsList.every((powder: any) => powder.isApproved);
      item.status = allApproved ? 'Completed' : 'Pending';
    });

    // Count the total, completed, and pending items
    totalWR.value = filteredData.length;
    completedWR.value = filteredData.filter((item: any) => item.status === 'Completed').length;
    pendingWR.value = filteredData.filter((item: any) => item.status === 'Pending').length;

  } catch (error) {
    console.error('Error fetching Warehouse Request details:', error);
  }
};

onMounted(() => {
    fetchWarehouseRequest();
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
        data: [pendingWR.value, completedWR.value],
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
