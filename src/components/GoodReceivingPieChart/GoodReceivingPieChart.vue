<script setup lang="ts">
import { computed, ref, onMounted} from "vue";
import { ChartData, ChartOptions } from "chart.js/auto";
import { useColorSchemeStore } from "../../stores/color-scheme";
import { useDarkModeStore } from "../../stores/dark-mode";
import Chart from "../../base-components/Chart";
import axios from "axios";

const total = ref(0);
const completed = ref(0);
const draft = ref(0);
const pendingQc = ref(0);
const qcRejected = ref(0);

const fetchGRDetails = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');
    const result = response.data.result;

    total.value = result.length;
    completed.value = result.filter((item : any) => item.status === 'Completed').length;
    draft.value = result.filter((item : any) => item.status === 'Draft').length;
    pendingQc.value = result.filter((item : any) => item.status === 'Pending QC').length;
    qcRejected.value = result.filter((item : any) => item.status === 'QC Rejected').length;
  } catch (error) {
    console.error('Error fetching GR details:', error);
  }
};

onMounted(() => {
  fetchGRDetails();
});

const props = defineProps<{
  width?: number;
  height?: number;
}>();

const colorScheme = computed(() => useColorSchemeStore().colorScheme);
const darkMode = computed(() => useDarkModeStore().darkMode);

const customColors = ['#f97316', '#eab308', '#ef4444', '#22c55e'];

const data = computed<ChartData>(() => {
  return {
    labels: ["Draft", "Pending QC", "QC Rejected", "Completed"],
    datasets: [
      {
        data: [draft.value, pendingQc.value, qcRejected.value, completed.value],
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
