<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const planningCompleted = ref(0);
const planningPending = ref(0);
const planningBlending = ref(0);
const planningMachineStation = ref(0);
const planningSecondaryProcess = ref(0);
const planningPacking = ref(0);
const planningTotal = ref(0);

const fetchPlanning= async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/PlanningDetails');
    const result = response.data.result;

    // Filter out items with 'Draft' status
    const filteredData = result.filter((item: any) => item.status !== 'deleted');


    // Count the total, completed, and pending items
    planningTotal.value = filteredData.length;
    planningCompleted.value = filteredData.filter((item: any) => item.jobstatus === 'Completed').length;
    planningPending.value = filteredData.filter((item: any) => item.jobstatus === 'Pending').length;
    planningBlending.value = filteredData.filter((item: any) => item.jobstatus === 'Pending Blending').length;
    planningMachineStation.value = filteredData.filter((item: any) => item.jobstatus === 'Pending Machine Station').length;
    planningSecondaryProcess.value = filteredData.filter((item: any) => item.jobstatus === 'Pending Secondary Process').length;
    planningPacking.value = filteredData.filter((item: any) => item.jobstatus === 'Pending Packing').length;

  } catch (error) {
    console.error('Error fetching Warehouse Request details:', error);
  }
};


onMounted(() => {
    fetchPlanning();
});

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const colorScheme = computed(() => useColorSchemeStore().colorScheme);
const darkMode = computed(() => useDarkModeStore().darkMode);

const customColors = ['#db2777', '#9333ea', '#c026d3','#0284c7','#eab308', '#22c55e'];

const data = computed<ChartData>(() => {
  return {
    labels: ["Pending Pacing", "Pending Secondary Process", "Pending Machine Station", "Pending Blending", "Pending", "Received"],
    datasets: [
      {
        data: [planningPacking.value, planningSecondaryProcess.value, planningMachineStation.value, planningBlending.value, planningPending.value, planningCompleted.value],
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
