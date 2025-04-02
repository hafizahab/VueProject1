<script setup lang="ts">
import _ from "lodash";
import { ref, provide, onMounted, computed } from "vue";
import fakerData from "../utils/faker";
import Button from "../base-components/Button";
import Pagination from "../base-components/Pagination";
import { FormInput, FormSelect } from "../base-components/Form";
import TinySlider, { TinySliderElement } from "../base-components/TinySlider";
import Lucide from "../base-components/Lucide";
import Tippy from "../base-components/Tippy";
import Litepicker from "../base-components/Litepicker";
import ReportDonutChart from "../components/ReportDonutChart";
import ReportLineChart from "../components/ReportLineChart";
import GoodReceivingPieChart from "../components/GoodReceivingPieChart";
import GRQualityCheckPieChart from "../components/GRQualityCheckPieChart/GRQualityCheckPieChart.vue";
import GRWarehousePieChart from "../components/GRWarehousePieChart/GRWarehousePieChart.vue";
import WarehouseRequestPieChart from "../components/WarehouseRequestPieChart/WarehouseRequestPieChart.vue";
import PlanningPieChart from "../components/PlanningPieChart/PlanningPieChart.vue";
import BlendingPieChart from "../components/BlendingPieChart/BlendingPieChart.vue";
import MachineStationPieChart from "../components/MachineStationPieChart/MachineStationPieChart.vue";
import IPQCPieChart from "../components/IPQCPieChart/IPQCPieChart.vue";
import SecondaryProcessPieChart from "../components/SecondaryProcessPieChart/SecondaryProcessPieChart.vue";
import OQCPieChart from "../components/OQCPieChart/OQCPieChart.vue";
import PackingPieChart from "../components/PackingPieChart/PackingPieChart.vue";
import ReportPieChart1 from "../components/ReportPieChart1";
import ReportCartonsChart from "../components/ReportCartonsChart.vue";

import ReportPacketsChart from "../components/ReportPacketsChart";
import SimpleLineChart1 from "../components/SimpleLineChart1";
import ReportBlendChart from "../components/ReportBlendChart";
import ReportRecipesChart from "../components/ReportRecipesChart";
import LeafletMap from "../components/LeafletMap";
import { Menu } from "../base-components/Headless";
import Table from "../base-components/Table";
import Progress from "../base-components/Progress";
import axios from "axios";


const progressItems = ref([{ completion: '20%' }, { completion: '75%' }, { completion: '90%' }])

const salesReportFilter = ref<string>("");
const importantNotesRef = ref<TinySliderElement>();

provide("bind[importantNotesRef]", (el: TinySliderElement) => {
    importantNotesRef.value = el;
});

const prevImportantNotes = () => {
    importantNotesRef.value?.tns.goTo("prev");
};
const nextImportantNotes = () => {
    importantNotesRef.value?.tns.goTo("next");
};


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
        completed.value = result.filter((item: any) => item.status === 'Completed').length;
        draft.value = result.filter((item: any) => item.status === 'Draft').length;
        pendingQc.value = result.filter((item: any) => item.status === 'Pending QC').length;
        qcRejected.value = result.filter((item: any) => item.status === 'QC Rejected').length;
    } catch (error) {
        console.error('Error fetching GR details:', error);
    }
};

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


const planningCompleted = ref(0);
const planningPending = ref(0);
const planningBlending = ref(0);
const planningMachineStation = ref(0);
const planningSecondaryProcess = ref(0);
const planningPacking = ref(0);
const planningTotal = ref(0);

const fetchPlanning = async () => {
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

const blendingTotal = ref(0);
const blendingPending = ref(0);
const blendingCompleted = ref(0);
const totalProcessedWeightBlending = ref(0);
const totalWasteBlending = ref(0);

const fetchBlendingData = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/Blending');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        blendingTotal.value = filteredData.length;

        // Count pending and completed jobs
        blendingPending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        blendingCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;

        // Calculate combined total of processedWeight and waste
        totalProcessedWeightBlending.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.processedWeight || 0), 0).toFixed(4)
        );
        totalWasteBlending.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.waste || 0), 0).toFixed(4)
        );

    } catch (error) {
        console.error('Error fetching Blending details:', error);
    }
};

const machinesBlending = ref([]);
const pendingMachinesBlending = ref(0);
const totalJobsInPendingMachinesBlending = ref(0);

const fetchBlendingJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/Blending/GetBlendingJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    machinesBlending.value = machineResult;
    pendingMachinesBlending.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

    totalJobsInPendingMachinesBlending.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/Blending/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      totalJobsInPendingMachinesBlending.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const machinestationTotal = ref(0);
const machinestationPending = ref(0);
const machinestationCompleted = ref(0);
const totalProcessedWeightmachinestation = ref(0);
const totalWastemachinestation = ref(0);

const fetchMachineStation = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/MachineStation');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        machinestationTotal.value = filteredData.length;

        // Count pending and completed jobs
        machinestationPending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        machinestationCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;

        // Calculate combined total of processedWeight and waste
        totalProcessedWeightmachinestation.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.processedWeight || 0), 0).toFixed(4)
        );
        totalWastemachinestation.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.waste || 0), 0).toFixed(4)
        );

        console.log('machinestation Total:', machinestationTotal.value);
        console.log('machinestation Pending:', machinestationPending.value);
        console.log('machinestation Completed:', machinestationCompleted.value);
        console.log('Total Processed Weight machinestation:', totalProcessedWeightmachinestation.value);
        console.log('Total Waste machinestation:', totalWastemachinestation.value);
    } catch (error) {
        console.error('Error fetching machinestation details:', error);
    }
};


const machinesMachine= ref([]);
const pendingMachinesMachine = ref(0);
const totalJobsInPendingMachinesMachine = ref(0);

const fetchMachineJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/MachineStation/GetMachineJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    machinesMachine.value = machineResult;
    pendingMachinesMachine.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

    totalJobsInPendingMachinesMachine.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/MachineStation/GetMachineDetailsbyMachineCode/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      totalJobsInPendingMachinesMachine.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const totalIPQC = ref(0);
const pendingIPQC = ref(0);
const completedIPQC = ref(0);

const fetchIPQC = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/IPQC');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        totalIPQC.value = filteredData.length;

        // Count pending and completed jobs
        pendingIPQC.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        completedIPQC.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;

    } catch (error) {
        console.error('Error fetching machinestation details:', error);
    }
};

const SPtotal = ref(0);
const SPpending = ref(0);
const spCompleted = ref(0);
const SPweight = ref(0);
const SPwaste = ref(0);

const fetchSP = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/SecondaryProcess');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        SPtotal.value = filteredData.length;

        // Count pending and completed jobs
        SPpending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        spCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;

        // Calculate combined total of processedWeight and waste
        SPweight.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.processedWeight || 0), 0).toFixed(4)
        );
        SPwaste.value = parseFloat(
            filteredData.reduce((sum: number, item: any) => sum + (item.waste || 0), 0).toFixed(4)
        );

    } catch (error) {
        console.error('Error fetching machinestation details:', error);
    }
};

const WTmachine = ref([]);
const WTpendingmachine = ref(0);
const WTtotalpendingJob = ref(0);

const fetchWTJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/WetTreatment/GetWetTreatmentJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    WTmachine.value = machineResult;
    WTpendingmachine.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

      WTtotalpendingJob.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/WetTreatment/GetWTDetailsbyMachineCode/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      WTtotalpendingJob.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const PTmachine = ref([]);
const PTpendingmachine = ref(0);
const PTtotalpendingJob = ref(0);

const fetchPTJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/PlasmaTreatment/GetPlasmaTreatmentJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    PTmachine.value = machineResult;
    PTpendingmachine.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

      PTtotalpendingJob.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/PlasmaTreatment/GetPTDetailsbyMachineCode/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      PTtotalpendingJob.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const DBmachine = ref([]);
const DBpendingmachine = ref(0);
const DBtotalpendingJob = ref(0);

const fetchDBJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/Deburring/GetDeburringJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    DBmachine.value = machineResult;
    DBpendingmachine.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

      DBtotalpendingJob.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/Deburring/GetDeburringDetailsbyMachineCode/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      DBtotalpendingJob.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const DDmachine = ref([]);
const DDpendingmachine = ref(0);
const DDtotalpendingJob = ref(0);

const fetchDDJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/Dedusting/GetDedustingJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    DDmachine.value = machineResult;
    DDpendingmachine.value = machineResult.filter((machine :any) => machine.status === 'Pending').length;

    // Fetch detailed job data for pending machines (API 2)
    const pendingMachineIds = machineResult
      .filter((machine:any) => machine.status === 'Pending')
      .map((machine:any) => machine.machineId);

      DDtotalpendingJob.value = 0;

    for (const machineId of pendingMachineIds) {
      const jobResponse = await axios.get(`http://10.87.0.33:8082/api/Dedusting/GetDedustingDetailsbyMachineCode/${machineId}`);
      const jobResult = jobResponse.data.result || [];

      DDtotalpendingJob.value += jobResult.length;
    }


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

const OQCtotal = ref(0);
const OQCpending = ref(0);
const OQCcompleted = ref(0);
const OQCPass = ref(0);
const OQCFailed = ref(0);



const fetchOQC = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/QCInspection');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        OQCtotal.value = filteredData.length;

        // Count pending and completed jobs
        OQCpending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        OQCcompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;



    } catch (error) {
        console.error('Error fetching QC Inspection details:', error);
    }
};

const packingTotal = ref(0);
const packingPending = ref(0);
const packingCompleted = ref(0);
const holdingBagList = ref(0);

const fetchPacking = async () => {
    try {
        const response = await axios.get('http://10.87.0.33:8082/api/Packing');
        const result = response.data.result || [];

        // Filter out items with 'deleted' status
        const filteredData = result.filter((item: any) => item.status !== 'deleted');

        // Update total count
        packingTotal.value = filteredData.length;

        // Count pending and completed jobs
        packingPending.value = filteredData.filter((item: any) => item.jobStatus === 'Pending').length;
        packingCompleted.value = filteredData.filter((item: any) => item.jobStatus === 'Completed').length;
 // Fetch holding bag list data
 const holdingBagResponse = await axios.get('http://10.87.0.33:8085/api/HoldingBagList');
        const holdingBagResult = holdingBagResponse.data.result || [];

        // Update holdingBagList count
        holdingBagList.value = holdingBagResult.length;

    } catch (error) {
        console.error('Error fetching machinestation details:', error);
    }
};

const packingJobTotal = ref([]);
const packingJobPending = ref(0);
const packingJobCompleted = ref(0);

const fetchPackingJob = async () => {
  try {
    // Fetch machine data (API 1)
    const machineResponse = await axios.get('http://10.87.0.33:8082/api/Packing/GetPackingJobs');
    const machineResult = machineResponse.data.result || [];

    // Update total and pending machine counts
    packingJobTotal.value = machineResult;
    packingJobPending.value = machineResult.filter((machine :any) => machine.jobStatus === 'Submitted').length;
    packingJobCompleted.value = machineResult.filter((machine :any) => machine.jobStatus === 'Completed').length;


  } catch (error) {
    console.error('Error fetching dashboard data:', error);
  }
};

onMounted(() => {
    fetchGRDetails();
    fetchGRQualityCheck();
    fetchGRWarehouse();
    fetchWarehouseRequest();
    fetchPlanning();
    fetchBlendingData();
    fetchBlendingJob();
    fetchMachineStation();
    fetchMachineJob();
    fetchIPQC();
    fetchSP();
    fetchWTJob();
    fetchPTJob();
    fetchDBJob();
    fetchDDJob();
    fetchOQC();
    fetchPacking();
    fetchPackingJob();
});


const userAccessString = localStorage.getItem('userAccess');
const userAccess = userAccessString ? JSON.parse(userAccessString) : null;

const hasGoodsReceivingAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.goodsReceiving && currentUser.goodsReceiving.includes('View');
    }
    return false;
});
const hasGoodsReceivingQCAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.goodsReceive && currentUser.goodsReceive.includes('View');
    }
    return false;
});
const hasGoodsReceivingWHAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.warehouse && currentUser.warehouse.includes('View');
    }
    return false;
});
const hasGoodsReceivingWRAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.warehouseRequest && currentUser.warehouseRequest.includes('View');
    }
    return false;
});
const hasPlanningAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.planning && currentUser.planning.includes('View');
    }
    return false;
});
const hasBlendingAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.blending && currentUser.blending.includes('View');
    }
    return false;
});
const hasMachineAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.machineStation_Production && currentUser.machineStation_Production.includes('View');
    }
    return false;
});
const hasIPQCAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.inProcessQualityCheck && currentUser.inProcessQualityCheck.includes('View');
    }
    return false;
});
const hasSPAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.secondaryProcess && currentUser.secondaryProcess.includes('View');
    }
    return false;
});
const hasWTAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.wetTreatmentJob && currentUser.wetTreatmentJob.includes('View');
    }
    return false;
});
const hasPTAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.plasmaTreatmentJob && currentUser.plasmaTreatmentJob.includes('View');
    }
    return false;
});
const hasDBAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.deburringJob && currentUser.deburringJob.includes('View');
    }
    return false;
});
const hasDDAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.deburringJob && currentUser.deburringJob.includes('View');
    }
    return false;
});
const hasOQCAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.outgoingQualityCheck && currentUser.outgoingQualityCheck.includes('View');
    }
    return false;
});
const hasPackingAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.packing && currentUser.packing.includes('View');
    }
    return false;
});
const hasPackingJobAccess = computed(() => {
    if (userAccess && userAccess.result) {
        const currentUser = userAccess.result.find((user: any) => user.userId === localStorage.getItem('userId'));
        return currentUser && currentUser.packingJob && currentUser.packingJob.includes('View');
    }
    return false;
});
</script>

<template>
    <div class="grid grid-cols-12 gap-4 mt-10">

        <!-- Parent container is now correctly defined with `grid-cols-12` -->
        <div class="col-span-12">

            <div class="grid grid-cols-12 gap-4">
                <!-- BEGIN: GoodReceiving -->

                <div v-if="hasGoodsReceivingAccess" class="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Good Receiving</h2>
                        <router-link :to="{ name: 'side-menu-good-receiving' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                            :class="['relative zoom-in']">
                            <div class="flex items-center">
                                <div class="flex-column">
                                    <div class="text-md font-medium leading-8">Total</div>
                                    <div class="text-xl text-slate-600 dark:text-gray-50">{{ total }}</div>
                                </div>
                                <div class="ml-auto">
                                    <div class="relative w-auto pl-4 flex-initial">
                                        <div
                                            class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                            <i class="fa-solid fa-box text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ completed }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-orange-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-orange-100 dark:bg-gray-500 text-orange-600 dark:text-orange-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ draft }}
                                    </dt>
                                    <dd class="text-center text-orange-600 dark:text-orange-300 text-sm font-medium">
                                        Draft <i class="fa-solid fa-pen-to-square text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ pendingQc }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending QC<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-red-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-red-100 dark:bg-gray-500 text-red-600 dark:text-red-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ qcRejected }}
                                    </dt>
                                    <dd class="text-center text-red-600 dark:text-red-300 text-sm font-medium">
                                        QC Rejected <i class="fa-solid fa-circle-xmark text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <div class="my-2">
                            <GoodReceivingPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: GoodReceiving -->
                <!-- BEGIN: QualityCheck -->
                <div v-if="hasGoodsReceivingQCAccess" class="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">GR Quality Check</h2>
                        <router-link :to="{ name: 'side-menu-quality-check' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                            :class="['relative zoom-in']">
                            <div class="flex items-center">
                                <div class="flex-column">
                                    <div class="text-md font-medium leading-8">Total</div>
                                    <div class="text-xl text-slate-600 dark:text-gray-50">{{ totalQC }}</div>
                                </div>
                                <div class="ml-auto">
                                    <div class="relative w-auto pl-4 flex-initial">
                                        <div
                                            class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                            <i class="fa-solid fa-star text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-1 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ completedQC }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>


                            </div>
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ pendingQcQC }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending QC<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-red-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-red-100 dark:bg-gray-500 text-red-600 dark:text-red-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ qcRejectedQC }}
                                    </dt>
                                    <dd class="text-center text-red-600 dark:text-red-300 text-sm font-medium">
                                        QC Rejected <i class="fa-solid fa-circle-xmark text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <div class="my-2">
                            <GRQualityCheckPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: QualityCheck -->
                <!-- BEGIN: Warehouse -->
                <div v-if="hasGoodsReceivingQCAccess" class="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">GR Warehouse</h2>
                        <router-link :to="{ name: 'side-menu-gr-warehouse' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                            :class="['relative zoom-in']">
                            <div class="flex items-center">
                                <div class="flex-column">
                                    <div class="text-md font-medium leading-8">Total</div>
                                    <div class="text-xl text-slate-600 dark:text-gray-50">{{ totalWH }}</div>
                                </div>
                                <div class="ml-auto">
                                    <div class="relative w-auto pl-4 flex-initial">
                                        <div
                                            class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                            <i class="fa-solid fa-warehouse text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-1 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ receivedWH }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Received<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                            <div class="grid grid-cols-1 gap-3 mb-2">

                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ notReceivedWH }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <div class="my-2">
                            <GRWarehousePieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: Warehouse -->
                <!-- BEGIN: WarehouseRequest -->
                <div v-if="hasGoodsReceivingWRAccess" class="col-span-12 sm:col-span-6 lg:col-span-3">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Warehouse Request</h2>
                        <router-link :to="{ name: 'side-menu-warehouse-request' }"
                            class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                            :class="['relative zoom-in']">
                            <div class="flex items-center">
                                <div class="flex-column">
                                    <div class="text-md font-medium leading-8">Total</div>
                                    <div class="text-xl text-slate-600 dark:text-gray-50">{{ totalWR }}</div>
                                </div>
                                <div class="ml-auto">
                                    <div class="relative w-auto pl-4 flex-initial">
                                        <div
                                            class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                            <i class="fa-solid fa-truck-ramp-box text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-1 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ completedWR }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                            <div class="grid grid-cols-1 gap-3 mb-2">

                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ pendingWR }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <div class="my-2">
                            <WarehouseRequestPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: WarehouseRequest -->
                <!-- BEGIN: Planning -->
                <div v-if="hasPlanningAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Planning</h2>
                        <router-link :to="{ name: 'side-menu-planning' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="px-5 py-2 mb-3 rounded-lg bg-lime-50 dark:bg-gray-600"
                            :class="['relative zoom-in']">
                            <div class="flex items-center">
                                <div class="flex-column">
                                    <div class="text-md font-medium leading-8">Total</div>
                                    <div class="text-xl text-slate-600 dark:text-gray-50">{{ planningTotal }}</div>
                                </div>
                                <div class="ml-auto">
                                    <div class="relative w-auto pl-4 flex-initial">
                                        <div
                                            class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                            <i class="fa-solid fa-clipboard-list text-xl"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-3 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningCompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningPending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="p-4 bg-sky-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-sky-100 dark:bg-gray-500 text-sky-600 dark:text-sky-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningBlending }}
                                    </dt>
                                    <dd class="text-center text-sky-600 dark:text-sky-300 text-sm font-medium">
                                        Pending Blending<i class="fa-brands fa-mix text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                            <div class="grid grid-cols-3 gap-3 mb-2">

                                <dl class="p-2 bg-fuchsia-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-gray-500 text-fuchsia-600 dark:text-fuchsia-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningMachineStation }}
                                    </dt>
                                    <dd class="text-center text-fuchsia-600 dark:text-fuchsia-300 text-sm font-medium">
                                        Pending Machine Station <i class="fa-solid fa-laptop text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="p-2 bg-purple-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-purple-100 dark:bg-gray-500 text-purple-600 dark:text-purple-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningSecondaryProcess }}
                                    </dt>
                                    <dd class="text-center text-purple-600 dark:text-purple-300 text-sm font-medium">
                                        Pending Secondary Process <i class="fa-solid fa-angle-right text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="p-2 bg-pink-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-pink-100 dark:bg-gray-500 text-pink-600 dark:text-lime-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ planningPacking }}
                                    </dt>
                                    <dd class="text-center text-pink-600 dark:text-pink-300 text-sm font-medium">
                                        Pending Packing <i class="fa-solid fa-box-open text-md ml-2"></i>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                        <div class="my-2">
                            <PlanningPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: Planning -->
                <!-- BEGIN: Blending -->
                <div v-if="hasBlendingAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Blending</h2>
                        <router-link :to="{ name: 'side-menu-blending' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-1 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            blendingTotal }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-arrows-rotate text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="grid grid-cols-2 gap-3">


                            <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Processed Weight</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalProcessedWeightBlending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                                <i class="fa-solid fa-arrows-spin text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-3 rounded-lg bg-red-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Waste</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{ totalWasteBlending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-red-500">
                                                <i class="fa-solid fa-recycle text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ blendingCompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ blendingPending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <BlendingPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: Blending -->
                <!-- BEGIN: BlendingJob -->
                <div v-if="hasBlendingAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Blending Job</h2>
                        <router-link :to="{ name: 'side-menu-blending-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            machinesBlending.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            pendingMachinesBlending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalJobsInPendingMachinesBlending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END: BlendingJob -->
                 <!-- BEGIN: MachineStation -->
                <div v-if="hasMachineAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Machine Station</h2>
                        <router-link :to="{ name: 'side-menu-machine-station' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-1 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            machinestationTotal }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-gear text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="grid grid-cols-2 gap-3">


                            <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Processed Weight</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalProcessedWeightmachinestation }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                                <i class="fa-solid fa-arrows-spin text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-3 rounded-lg bg-red-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Waste</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{ totalWastemachinestation }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-red-500">
                                                <i class="fa-solid fa-recycle text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ machinestationCompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ machinestationPending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <MachineStationPieChart :height="213" />
                        </div>
                    </div>
                </div>
                 <!-- BEGIN: MachineStationJob -->
                 <div v-if="hasMachineAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Machine Station Job</h2>
                        <router-link :to="{ name: 'side-menu-machine-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            machinesMachine.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            pendingMachinesMachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalJobsInPendingMachinesMachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                 <!-- BEGIN: InProgressQualityCheck -->
                 <div v-if="hasIPQCAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">In Progress Quality Check</h2>
                        <router-link :to="{ name: 'side-menu-in-progress-quality-check' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-1 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalIPQC }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-gear text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ completedIPQC }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ pendingIPQC }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <IPQCPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: InProgressQualityCheck -->
                 <!-- BEGIN: SecondaryProcess -->
                <div v-if="hasSPAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Secondary Process</h2>
                        <router-link :to="{ name: 'side-menu-secondary-process' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-1 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            SPtotal }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-gear text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="grid grid-cols-2 gap-3">


                            <div class="px-5 py-2 mb-3 rounded-lg bg-blue-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Processed Weight</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            SPweight }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-blue-500">
                                                <i class="fa-solid fa-arrows-spin text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-3 rounded-lg bg-red-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Waste</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{ SPwaste }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-red-500">
                                                <i class="fa-solid fa-recycle text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ spCompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ SPpending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <SecondaryProcessPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: SecondaryProcess -->
                 <!-- BEGIN: WetTreatmentJob -->
                 <div v-if="hasWTAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Wet Treatment Job</h2>
                        <router-link :to="{ name: 'side-menu-wet-treatment-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            WTmachine.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            WTpendingmachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            WTtotalpendingJob }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END : WetTreatmentJob -->
                 <!-- BEGIN: PlasmaTreatmentJob -->
                 <div v-if="hasPTAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Plasma Treatment Job</h2>
                        <router-link :to="{ name: 'side-menu-plasma-treatment-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            PTmachine.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            PTpendingmachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            PTtotalpendingJob }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END : PlasmaTreatmentJob -->
                 <!-- BEGIN: Deburring -->
                 <div v-if="hasDBAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Deburring Job</h2>
                        <router-link :to="{ name: 'side-menu-deburring-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DBmachine.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DBpendingmachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DBtotalpendingJob }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END : Deburring -->
                 <!-- BEGIN: Dedusting -->
                 <div v-if="hasDDAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Dedusting Job</h2>
                        <router-link :to="{ name: 'side-menu-dedusting-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DDmachine.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gears text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-orange-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Pending Machines</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DDpendingmachine }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-orange-500">
                                                <i class="fa-solid fa-stopwatch text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            DDtotalpendingJob }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END : Dedusting -->
                 <!-- BEGIN: OQC -->
                <div v-if="hasOQCAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Out Going Quality Check</h2>
                        <router-link :to="{ name: 'side-menu-qc-inspection' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-1 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            OQCtotal }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-arrows-rotate text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ OQCcompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ OQCpending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <OQCPieChart :height="213" />
                        </div>
                    </div>
                </div>
                <!-- END: OQC -->
                  <!-- BEGIN: Packing -->
                <div v-if="hasPackingAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Packing </h2>
                        <router-link :to="{ name: 'side-menu-packing' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-2 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-lime-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            packingTotal }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-lime-500">
                                                <i class="fa-solid fa-gear text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-violet-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Holding Bag List </div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            holdingBagList }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-violet-500">
                                                <i class="fa-solid fa-suitcase text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div class="bg-white dark:bg-gray-700 p-3 rounded-lg box">
                            <div class="grid grid-cols-2 gap-3 mb-2">
                                <dl class="bg-green-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-green-100 dark:bg-gray-500 text-green-600 dark:text-green-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ packingCompleted }}
                                    </dt>
                                    <dd class="text-center text-green-600 dark:text-green-300 text-sm font-medium">
                                        Completed<i class="fa-solid fa-circle-check text-md ml-2"></i>
                                    </dd>
                                </dl>
                                <dl class="bg-yellow-50 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center h-[78px]"
                                    :class="['relative zoom-in']">
                                    <dt
                                        class="w-8 h-8 rounded-full bg-yellow-100 dark:bg-gray-500 text-yellow-600 dark:text-yellow-300 text-sm font-medium flex items-center justify-center mb-1">
                                        {{ packingPending }}
                                    </dt>
                                    <dd class="text-center text-yellow-600 dark:text-yellow-300 text-sm font-medium">
                                        Pending<i class="fa-solid fa-clock text-md ml-2"></i>
                                    </dd>
                                </dl>

                            </div>
                        </div>
                        <div class="my-2">
                            <PackingPieChart :height="213" />
                        </div>
                    </div>
                </div>
                 <!-- END: Packing -->
                  <!-- BEGIN: BlendingJob -->
                <div v-if="hasPackingJobAccess" class="col-span-12 sm:col-span-12 lg:col-span-12">
                    <div class="flex items-center h-10 intro-y">
                        <h2 class="mr-5 text-lg font-medium truncate">Packing Job</h2>
                        <router-link :to="{ name: 'side-menu-packing-job' }" class="ml-auto truncate text-primary">
                            See More
                        </router-link>
                    </div>
                    <div class="p-5 mt-5 intro-y box">
                        <div class="grid grid-cols-3 gap-3 mb-2">


                            <div class="px-5 py-2 mb-1 rounded-lg bg-sky-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Packing Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            packingJobTotal.length }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-sky-500">
                                                <i class="fa-solid fa-gear text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-yellow-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Pending Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            packingJobPending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-yellow-500">
                                                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="px-5 py-2 mb-1 rounded-lg bg-green-50 dark:bg-gray-600"
                                :class="['relative zoom-in']">
                                <div class="flex items-center ">
                                    <div class="flex-column">
                                        <div class="text-md font-medium leading-8">Total Completed Job</div>
                                        <div class="text-xl text-slate-600 dark:text-gray-50">{{
                                            totalJobsInPendingMachinesBlending }}</div>
                                    </div>
                                    <div class="ml-auto">
                                        <div class="relative w-auto pl-4 flex-initial">
                                            <div
                                                class="text-white p-3 text-center inline-flex items-center justify-center w-12 h-12 shadow-lg rounded-lg bg-green-500">
                                                <i class="fa-solid fa-circle-check text-xl"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
                <!-- END: BlendingJob -->
                <!-- <div class="col-span-12 mt-8 mb-10 lg:col-span-12">
                    <div class="items-center block h-10 intro-y sm:flex">
                        <h2 class="mr-5 text-lg font-medium truncate">Machine Station</h2>
                    </div>
                    <div class="p-5 mt-12 intro-y box sm:mt-5">
                        <div class="flex flex-col md:flex-row md:items-center">
                            <div class="flex">
                                <div>
                                    <div class="text-lg font-medium text-primary dark:text-slate-300 xl:text-xl">
                                        Waste
                                    </div>
                                    <div class="mt-0.5 text-slate-600">2024</div>
                                </div>
                            </div>
                        </div>
                        <div :class="[
                            'relative',
                            'before:content-[\'\'] before:block before:absolute before:w-16 before:left-0 before:top-0 before:bottom-0 before:ml-10 before:mb-7 before:bg-gradient-to-r before:from-white before:via-white/80 before:to-transparent before:dark:from-darkmode-600',
                            'after:content-[\'\'] after:block after:absolute after:w-16 after:right-0 after:top-0 after:bottom-0 after:mb-7 after:bg-gradient-to-l after:from-white after:via-white/80 after:to-transparent after:dark:from-darkmode-600',
                        ]">
                            <ReportLineChart :height="275" class="mt-6 -mb-6" />
                        </div>
                    </div>
                </div> -->
            </div>
        </div>
    </div>


</template>
