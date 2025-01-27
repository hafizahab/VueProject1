<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, toRefs, watchEffect } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';

interface Response {
  id?: string;
  whiteSlipId?: string;
  shift?: string;
  machineCode?: string;
  weight?: string;
  processedWeight?: string;
  waste?: string;
  jobStatus?: string;
  blowrequired?: string;
}


const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  jobId: "",
  status: "",
  startDate: null,
  endDate: null,
});
const setFilter = (value: typeof filter) => {
  Object.assign(filter, value);
};

const initTabulator = () => {
  if (tableRef.value) {
    tabulator.value = new Tabulator(tableRef.value, {
      paginationMode: "local",
      filterMode: "local",
      sortMode: "local",
      printAsHtml: true,
      printStyled: true,
      pagination: true,
      paginationSize: 10,
      paginationSizeSelector: [5, 10, 20, 30, 40, true],
      layout: "fitColumns",
      responsiveLayout: "collapse",
      placeholder: "No matching records found",
      // Initial sort
      initialSort: [
        { column: "date", dir: "desc" }, // Sort by date in descending order
      ],


      columns: [
        {
          title: "",
          formatter: "responsiveCollapse",
          width: 40,
          minWidth: 30,
          hozAlign: "center",
          resizable: false,
          headerSort: false,
        },
        {
          title: "ID",
          minWidth: 200,
          responsive: 0,
          field: "jobId",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.id}</div>
              </div>`;
          },
        },
        {
          title: "JOB ID",
          minWidth: 150,
          responsive: 0,
          field: "whiteSlipId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.whiteSlipId}</div>
              </div>`;
          },
        },
        {
          title: "DATE",
          minWidth: 200,
          responsive: 0,
          field: "date",
          vertAlign: "middle",
          print: false,
          visible: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.date);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');
            const hours = String(fullDate.getHours()).padStart(2, '0');
            const minutes = String(fullDate.getMinutes()).padStart(2, '0');
            const seconds = String(fullDate.getSeconds()).padStart(2, '0');
            const meridian = (fullDate.getHours() < 12) ? 'AM' : 'PM';

            // Formatted date string
            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${meridian}`;

            return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
    </div>`;
          },
        },
        {
          title: "WEIGHT",
          minWidth: 120,
          responsive: 0,
          field: "weight",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const weight = response.weight ? response.weight : 'N/A';
            return `<div>
      <div class="font-medium whitespace-nowrap">${weight}</div>
    </div>`;
          },
        },
        {
          title: "PROCESSED WEIGHT",
          minWidth: 270,
          responsive: 0,
          field: "processedWeight",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const processedWeight = response.processedWeight ? response.processedWeight : 'N/A';
            return `<div>
      <div class="font-medium whitespace-nowrap">${processedWeight}</div>
    </div>`;
          },
        },

        {
          title: "JOB STATUS",
          minWidth: 150,
          responsive: 0,
          field: "jobStatus",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let statusClass = '';

            if (!status) {
              status = 'N/A';
              statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
            } else {
              switch (status) {
                case 'Completed':
                  statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
                  break;
                case 'Draft':
                  statusClass = 'bg-orange-100 text-orange-800 border-orange-400 dark:text-orange-500';
                  break;
                case 'QC Rejected':
                  statusClass = 'bg-red-100 text-red-800 border-red-400 dark:text-red-500';
                  break;
                case 'Pending':
                  statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:text-yellow-500';
                  break;
              }
            }

            return `<div class="flex items-center lg:justify-center ${statusClass} text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:${status === 'submitted' ? 'text-green-400' : 'text-yellow-400'} border">
      ${status}
    </div>`;
          },
        },

        {
          title: "ACTIONS",
          minWidth: 200,
          field: "actions",
          responsive: 1,
          hozAlign: "center",
          headerHozAlign: "center",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const container = document.createElement("div");
            container.classList.add("flex", "items-center", "lg:justify-center", "flex-col"); // Added flex-col class for vertical stacking

            const response = cell.getData();

           if (response.jobStatus !== "Completed") {
      const editLink = document.createElement("a");
      editLink.classList.add("flex", "items-center", "mr-3", "text-blue-500");
      editLink.href = "#";
      editLink.addEventListener("click", (event) => {
        event.preventDefault();
        editRole(response.id);
      });

      const editIcon = document.createElement("i");
      editIcon.classList.add("fa-regular", "fa-pen-to-square", "pr-2");
      editLink.appendChild(editIcon);
      editLink.appendChild(document.createTextNode("Edit"));
      container.appendChild(editLink);
    }

            // Render "Delete" link
            // const deleteLink = document.createElement("a");
            // deleteLink.classList.add("flex", "items-center", "text-danger");
            // deleteLink.href = "javascript:;";
            // deleteLink.addEventListener("click", function () {
            //   deleteRole(response.id); // Call the delete function
            // });

            // const deleteIcon = document.createElement("i");
            // deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
            // deleteLink.appendChild(deleteIcon);
            // deleteLink.appendChild(document.createTextNode("Delete"));
            // container.appendChild(deleteLink);


            const viewLink = document.createElement("a");
            viewLink.classList.add("flex", "items-center", "mr-3");
            viewLink.href = "#";
            viewLink.addEventListener("click", (event) => {
              event.preventDefault();
              viewRole(response.id);
            });

            const viewIcon = document.createElement("i");
            viewIcon.classList.add("fa-regular", "fa-eye", "pr-2");
            viewLink.appendChild(viewIcon);
            viewLink.appendChild(document.createTextNode("View"));
            container.appendChild(viewLink);
            // Render "View" link

            return container;
          },
        },


        {
          title: "GR Number",
          field: "grnumber",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Product Code",
          field: "productcode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Date",
          field: "date",
          visible: false,
          print: true,
          download: true,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.date);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');
            const hours = String(fullDate.getHours()).padStart(2, '0');
            const minutes = String(fullDate.getMinutes()).padStart(2, '0');
            const seconds = String(fullDate.getSeconds()).padStart(2, '0');
            const meridian = (fullDate.getHours() < 12) ? 'AM' : 'PM';

            // Formatted date string
            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${meridian}`;

            return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
    </div>`;
          },
        },
        {
          title: "Resource Code",
          field: "resourcecode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Shift",
          field: "shift",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Vendor Name",
          field: "vendorname",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Vendor Code",
          field: "vendorcode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "PO Number",
          field: "ponumber",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Lot Number",
          field: "lotnumber",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Nett",
          field: "nett",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Gross",
          field: "gross",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "UOM",
          field: "uom",
          visible: false,
          print: true,
          download: true,
        },

        {
          title: "Status",
          field: "status",
          visible: false,
          print: true,
          download: true,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let textColor;

            if (!status) {
              status = 'N/A';
              textColor = 'text-gray-600'; // Color for 'N/A'
            } else {
              switch (status) {
                case 'Completed':
                  textColor = 'text-green-600';
                  break;
                case 'Draft':
                  textColor = 'text-orange-600';
                  break;
                case 'Pending QC':
                  textColor = 'text-yellow-600';
                  break;
                case 'QC Rejected':
                  textColor = 'text-red-600';
                  break;
                default:
                  textColor = 'text-black'; // Default text color
              }
            }

            return `<span class="${textColor}">${status}</span>`;
          }
        },
      ],
    });
  }

  tabulator.value?.on("renderComplete", () => {
    createIcons({
      icons,
      attrs: {
        "stroke-width": 1.5,
      },
      nameAttr: "data-lucide",
    });
  });
};

// Redraw table onresize
const reInitOnResizeWindow = () => {
  window.addEventListener("resize", () => {
    if (tabulator.value) {
      tabulator.value.redraw();
      createIcons({
        icons,
        attrs: {
          "stroke-width": 1.5,
        },
        nameAttr: "data-lucide",
      });
    }
  });
};

// Filter function
// Update the onFilter function
const onFilter = () => {
  if (tabulator.value) {
    tabulator.value.setFilter(function (data: any) {
      // Parse dates from the data object
      const dateValue = new Date(data.created_date);
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;

      // Check if the date falls within the specified range or is exactly one of the dates
      if (!startDate || !endDate) {
        return true; // Return true if either startDate or endDate is null
      }

      const isWithinRange = dateValue >= startDate && dateValue <= endDate;
      const isStartDate = dateValue.toDateString() === startDate.toDateString();
      const isEndDate = dateValue.toDateString() === endDate.toDateString();

      return isWithinRange || isStartDate || isEndDate;
    });
  }
};


const jobId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("jobId", 'like', filter.jobId);
  }
};

const onStatus = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("status", 'like', filter.status);
  }
};

// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    jobId: "",
    status: "",
    startDate: null,
    endDate: null,
  });
  onFilter();
};

// Print
const onPrint = () => {
  if (tabulator.value) {
    tabulator.value.print();
  }
};


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/PostProdChemicalTreatment/';

onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      let filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: first by job status (Pending at the top), then by job ID in ascending order
      filteredData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') {
          return -1;
        }
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') {
          return 1;
        }
        return a.whiteSlipId.localeCompare(b.whiteSlipId);
      });

      // Once data is received, populate the table
      console.log(filteredData);
      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchNamesShift();
  fetchMachineId();
  fetchProductCodes();
  fetchMachinePP();
  fetchMachineBlow();
  fetchBinId();
  fetchWeight();
  fetchMovement();
  fetchProductMasterData();
});



// Utility Functions
const formatDate = (date: any) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

const formatDateView = (date: Date): string => {
  const pad = (n: number) => (n < 10 ? '0' + n : n);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = date.getHours() % 12 || 12;
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
};

// const formattedDate = computed(() => {
//   return formatDateView(new Date(viewData.date));
// });

const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const viewData = reactive({
  id: '',
  whiteSlipId: '',
  shift: '',
  machineCode: '',
  reassignedBinId: '',
  blowrequired: false,
  jobStatus: '',
});

// Form Data
const editFormData = reactive({
  id: null,
  whiteSlipId: '',
  shift: '',
  machineCode: '',
  productCode: '',
  hoursForChem: 0,
  minutesForChem: 0,
  secondsForChem: 0,
  totalTimeTaken: '',
  machineweight: 0,
  assignweight: 0,
  pendingweight: 0,
  reassignedBinId: '',
  blowrequired: false,
  jobStatus: '',
  weight: 0,
  waste: 0,
  processedWeight: 0,
  shifts: [] as string[],
  machineCodes: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  movements: [] as string[],
  bins: [] as string[],
  binData: [] as any[],
  listBinsList: [] as Array<{ id: string; binMasterId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  ppBlowList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    jobStatus: '',
    listBinsList: [] as Array<{ mappingId: string; type: string; weight: number; reassignBinId: string; status: string; productCode: string }>,
    listMachineList: [] as Array<{ code: string; type: string; status: string }>
  },

  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      type: string;
      weight: number;
      reassignBinId: string;
      status: string;
      productCode: string;
      dimensionCheck: string;
      functionalCheck: string;
      visualCheck1: string;
      visualCheck2: string;
      visualCheck3: string;
      room: string;
    }>
  },
  listMachinesList: [] as Array<{ code: string; type: string; status: string }>,
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
  chemJobRows: [] as Array<{
    jobId: string;
    subJobId: string;
    productCode: string;
    machineCode: string;
    binCode: string;
    shift: string;
    minCapacity: number;
    maxCapacity: number;
    weight: number;
    avgTimeTaken: string;
    status: string;
  }>,
});



// Computed property to calculate the assigned weight
const assignedWeight = computed(() => {
  return editFormData.chemJobRows
    .filter(row => row.status === 'Submitted')
    .reduce((total, row) => total + row.weight, 0);
});

// Computed property to calculate the pending weight
const pendingWeight = computed(() => {
  return editFormData.chemJobRows
    .filter(row => row.status === 'Pending')
    .reduce((total, row) => total + row.weight, 0);
});

// Watch the computed properties and assign their values to editFormData
watchEffect(() => {
  editFormData.assignweight = assignedWeight.value;
  editFormData.pendingweight = pendingWeight.value;
});

watch(
  () => editFormData.chemJobRows.map(row => row.weight),  // Watch the weight of each row
  (newWeights) => {
    // Calculate the sum of all weights
    const totalWeight = newWeights.reduce((total, weight) => total + (weight || 0), 0);
    editFormData.machineweight = totalWeight;  // Update machine weight with the sum
  },
  { deep: true }  // Deep watch to track changes inside the array
);

const fetchWeight = () => {
  axios.get('http://10.87.0.33:8082/api/PlanningDetails')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "deleted"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'deleted');

        // Find the item with the matching jobId
        const matchingItem = activeNameData.find(item => item.jobId === editFormData.whiteSlipId);

        if (matchingItem) {
          // Set the weight in editFormData
          editFormData.weight = matchingItem.quantity;
        } else {
          console.error('No matching jobId found in active data');
        }
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

watch(() => editFormData.whiteSlipId, (newJobId) => {
  if (newJobId) {
    fetchWeight();
  }
});

const fetchBinId = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const nameData = response.data.result;

    if (Array.isArray(nameData)) {
      // Filter out items with status "Inactive" or "InActive"
      const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

      // Map the activeNameData array to extract the 'id' property
      editFormData.bins = activeNameData.map(item => item.id);

      // Store the full bin data for later use
      editFormData.binData = activeNameData;
    } else {
      console.error('Invalid response format for name:', nameData);
    }
  } catch (error) {
    console.error('Error fetching names:', error);
  }
};

// Method to find bin details by id
const getBinDetails = (binMasterId: any) => {
  const bin = editFormData.binData.find(bin => bin.id === binMasterId);
  return bin || {};
};


const getBinDetailsChem = (binCode: any) => {
  return editFormData.binData.find(bin => bin.id === binCode) || {};
};



const updateCapacityValues = (binMasterId: any, row: any) => {
  const binDetails = getBinDetails(binMasterId);
  if (binDetails) {
    row.capacityMin = binDetails.capacityMin;
    row.capacityMax = binDetails.capacityMax;
  }
};


const updateCapacityValuesMachine = (binCode: any, row: any) => {
  const binDetails = getBinDetailsChem(binCode);
  if (binDetails) {
    row.minCapacity = binDetails.capacityMin || 0;
    row.maxCapacity = binDetails.capacityMax || 0;
  }
};

const fetchMovement = () => {
  axios.get('http://10.87.0.33:8082/api/MovementMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive'
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.movements = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchNamesShift = () => {
  axios.get('http://10.87.0.33:8082/api/ShiftMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        editFormData.shifts = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};



const fetchMachineId = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'chemical treatment'
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodes = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchMachinePP = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'chemical treatment'
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodesPP = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};
const fetchMachineBlow = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'blower'
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodesBlow = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchProductCodes = () => {
  axios.get('http://10.87.0.33:8082/api/ProductMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        editFormData.productcodes = activeNameData.map(item => item.code);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const productMasterData = ref<any[]>([]); // We use any[] here as the structure can vary

const fetchProductMasterData = async () => {
  try {
    const response = await fetch('http://10.87.0.33:8082/api/ProductMaster');
    const data = await response.json();
    productMasterData.value = data.result;

    // Populate product codes for the dropdown
    editFormData.productcodes = data.result.map((product: any) => product.code);
  } catch (error) {
    console.error('Error fetching product master data:', error);
  }
};


watch(() => editFormData.productCode, (newProductCode) => {
  if (newProductCode) {
    const matchedProduct = productMasterData.value.find(
      (product) => product.code === newProductCode
    );

    if (matchedProduct) {
      editFormData.blowrequired = matchedProduct.blowrequired;
    } else {
      editFormData.blowrequired = false;
    }
  }
});



const timeStringToSeconds = (timeString: any) => {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

const secondsToTimeString = (totalSeconds: any) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

watch(
  () => editFormData.chemJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.chemJobRows.forEach((row, index) => {
      if (row.weight !== newRows[index].weight || !fetchedSubJobIds.has(row.subJobId)) {
        if (row.weight > 0) {
          const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
          const totalSeconds = timePerKg * row.weight;
          row.avgTimeTaken = secondsToTimeString(totalSeconds);
        } else {
          row.avgTimeTaken = '';
        }
      }
    });
  },
  { deep: true }
);

const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => { editModal.value = value; };

// Utility function for error handling
const handleError = (error: any, message: any) => {
  console.error(message, error);
  Swal.fire({
    icon: 'error',
    title: 'Operation Failed',
    text: message,
  });
};

let fetchedSubJobIds = new Set();


const fetchAndSetChemJobs = (jobId: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  axios.get('http://10.87.0.33:8082/api/ChemicalTreatmentJobs')
    .then(response => {
      const machineJobsData = response.data.result || [];
      console.log('Fetched Machine Jobs Data:', machineJobsData);

      // Filter machine jobs based on job ID
      const filteredChemJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
      console.log('Filtered Machine Jobs based on Job ID:', filteredChemJobs);

      // Update fetchedSubJobIds
      fetchedSubJobIds = new Set(filteredChemJobs.map((job: any) => job.subJobId));

      // Assign the filtered machine jobs to editFormData.machineJobRows
      editFormData.chemJobRows = filteredChemJobs.map((job: any) => ({
        jobId: job.jobId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      }));

      console.log('Updated Machine Job Rows in Form Data:', editFormData.chemJobRows);

      if (editFormData.chemJobRows.length === 0) {
        console.warn('No machine jobs found for the specified Job ID:', jobId);
      }
    })
    .catch(error => {
      console.error('Error fetching machine jobs:', error);
    });
};



// Fetch and Set Data for Edit/View
const fetchAndSetData = (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      if (data && data.length > 0) {
        const [firstItem] = data;
        const filteredBins = firstItem.listBins ? firstItem.listBins.filter((bin: any) => bin.status !== 'deleted') : [];

        Object.assign(formData, {
          id: firstItem.id,
          whiteSlipId: firstItem.whiteSlipId,
          shift: firstItem.shift,
          machineCode: firstItem.machineCode,
          productCode: firstItem.productCode,
          totalTimeTaken: firstItem.totalTimeTaken || '00:00:00',
          waste: firstItem.waste,
          processedWeight: firstItem.processedWeight,
          collected: firstItem.collected,
          chemicaltreatmentrequired: firstItem.chemicaltreatmentrequired,
          blowrequired: firstItem.blowrequired,
          jobStatus: firstItem.jobStatus,
          listBinsList: firstItem.listBinsList || [],
          listBins: filteredBins,
          listMachines: firstItem.listMachines || [],
        });

        if (firstItem.totalWeight !== null && firstItem.totalWeight !== undefined && firstItem.totalWeight !== 0) {
          formData.totalWeight = firstItem.totalWeight;
        }

        fetchAndSetChemJobs(editFormData.whiteSlipId);
        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'));
};



const editRole = (machineId: string) => {
  resetEditFormData(); // Reset the form before fetching new data
  fetchAndSetData(machineId, editFormData, seteditModal);
};

const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

const resetEditFormData = () => {
  Object.assign(editFormData, {
    id: null,
    jobId: '',
    shift: '',
    machineCode: '',
    totalTimeTaken: '',
    hoursForChem: 0,
    minutesForChem: 0,
    secondsForChem: 0,
    productCode: '',
    // Reset other fields as necessary
  });
};


function formatNumber(value: any) {
  return String(value).padStart(2, '0');
}

watch(
  () => editFormData.productCode,
  (newProductCode) => {
    if (newProductCode) {
      axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
          const productData = response.data.result.find((item: any) => item.code === newProductCode);
          if (productData) {
            editFormData.totalTimeTaken = productData.timeTakenforChemicalTreatment || '00:00:00';
          } else {
            console.error(`Product code ${newProductCode} not found in the API response`);
          }
        })
        .catch(error => {
          console.error('Error fetching product data:', error);
        });
    }
  }
);


watch(
  () => [editFormData.hoursForChem, editFormData.minutesForChem, editFormData.secondsForChem],
  () => {
    editFormData.totalTimeTaken = `${formatNumber(editFormData.hoursForChem)}:${formatNumber(editFormData.minutesForChem)}:${formatNumber(editFormData.secondsForChem)}`;
  },
  { immediate: true }
);

// Update Table Data
const updateTableData = () => {
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      let filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: first by job status (Pending at the top), then by job ID in ascending order
      filteredData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') {
          return -1;
        }
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') {
          return 1;
        }
        return a.whiteSlipId.localeCompare(b.whiteSlipId);
      });

      // Once data is received, populate the table
      console.log(filteredData);
      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
};

const deleteRow = async (id: string, index: number) => {
  if (id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://10.87.0.33:8082/api/ListBins/${id}`);
          editFormData.listBins.splice(index, 1);
          Swal.fire({
            icon: 'success',
            title: 'Bin Deleted Successfully',
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: 'top-end',
            iconColor: 'green',
            toast: true,
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        } catch (error) {
          console.error('Error deleting bin:', error);
          Swal.fire(
            'Error!',
            'There was an error deleting the bin.',
            'error'
          );
        }
      }
    });
  } else {
    editFormData.listBins.splice(index, 1);
  }
};

const validBins = computed(() => editFormData.listBins.filter(row => row.status !== 'deleted'));


const addRow = () => {
  editFormData.listBins.push({
    id: '',
    binMasterId: '',
    mappingId: '',
    weight: 0,
    capacityMin: 0,
    capacityMax: 0,
    movement: '',
    reassignBinId: '',
    status: '',
  });
};


const addChemJobRow = () => {
  const newSubJobId = `${editFormData.whiteSlipId}-${editFormData.chemJobRows.length + 1}`;

  const newRow = {
    jobId: editFormData.whiteSlipId || '',
    subJobId: newSubJobId,
    productCode: '',
    machineCode: '',
    binCode: '',
    shift: '',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  editFormData.chemJobRows.push(newRow);

  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};


function onTimeInput(event: any) {
  const value = event.target.value;
  const isValid = /^(\d{2}):(\d{2}):(\d{2})$/.test(value);
  if (isValid) {
    const [hours, minutes, seconds] = value.split(':').map(Number);
    editFormData.totalTimeTaken = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
  } else {
    console.error('Invalid time format. Please use HH:MM:SS.');
  }
}


const submitChemJobRow = async (row: any) => {
  // Show confirmation dialog
  const confirmed = await Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: 'Do you want to submit the job details?',
    showCancelButton: true,
    confirmButtonText: 'Yes, submit it!',
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    reverseButtons: true,
  }).then(result => result.isConfirmed);

  // If the user cancels, do nothing
  if (!confirmed) return;

  try {
    // Prepare the payload
    const jobPayload = {
      jobId: row.jobId,
      subJobId: row.subJobId,
      productCode: String(editFormData.productCode),
      machineCode: row.machineCode,
      binCode: row.binCode,
      shift: row.shift,
      minCapacity: row.minCapacity,
      maxCapacity: row.maxCapacity,
      weight: row.weight,
      avgTimeTaken: row.avgTimeTaken,
      status: row.status,
    };

    // Submit the job via API
    const jobResponse = await axios.post(`${API_BASE_URL}SubmitChemicalTreatmentJob`, jobPayload);
    console.log('Job Submission Response:', jobResponse.data);

    // Optionally update local data if needed
    row.status = jobResponse.data.status || 'Submitted';

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: 'Job Submitted Successfully',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: 'top-end',
      iconColor: 'green',
      toast: true,
      background: '#fff',
      showClass: {
        popup: 'animate__animated animate__fadeInUp',
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp',
      },
    });

    // Optionally, re-fetch the job details if needed
    // await fetchJobDetails();

  } catch (error) {
    console.error('Error submitting chem job details:', error);

    // Show error message
    await Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the job details. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};

// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  const payload = {
    id: String(editFormData.id),
    whiteSlipId: String(editFormData.whiteSlipId),
    shift: String(editFormData.shift),
    machineCode: String(editFormData.machineCode),
    blowrequired: Boolean(editFormData.blowrequired),
    jobStatus: String(editFormData.jobStatus),
    weight: editFormData.weight,
    processedWeight: editFormData.processedWeight,
    waste: editFormData.waste,
    listBinsList: Array.isArray(editFormData.listBins) ? editFormData.listBins.map(item => ({
      mappingId: String(editFormData.whiteSlipId),
      binMasterId: item.binMasterId,
      weight: item.weight,
      capacityMin: item.capacityMin,
      capacityMax: item.capacityMax,
      reassignBinId: item.reassignBinId,
      movement: item.movement,
      status: item.status
    })) : [],
    ppBlowList: [{
      whiteSlipId: String(editFormData.whiteSlipId),
      shift: editFormData.ppBlowList.shift,
      machineCode: editFormData.ppBlowList.machineCode,
      jobStatus: editFormData.ppBlowList.jobStatus,
      listBinsList: editFormData.ppBlowList.listBinsList.map(bin => ({
        mappingId: String(editFormData.whiteSlipId),
        type: bin.type,
        weight: bin.weight,
        reassignBinId: bin.reassignBinId,
        status: bin.status,
        productCode: bin.productCode
      })),
      listMachineList: editFormData.ppBlowList.listMachineList.map(machine => ({
        code: machine.code,
        type: machine.type,
        status: machine.status
      }))
    }],
    qcInspectionList: [{
      shift: editFormData.qcInspectionList.shift,
      jobStatus: editFormData.qcInspectionList.jobStatus,
      binListforQCinspection: editFormData.qcInspectionList.binListforQCinspection.map(bin => ({
        mappingId: String(editFormData.whiteSlipId),
        type: bin.type,
        weight: bin.weight,
        reassignBinId: bin.reassignBinId,
        status: bin.status,
        productCode: bin.productCode,
        dimensionCheck: bin.dimensionCheck,
        functionalCheck: bin.functionalCheck,
        visualCheck1: bin.visualCheck1,
        visualCheck2: bin.visualCheck2,
        visualCheck3: bin.visualCheck3,
        room: bin.room
      }))
    }],
    listMachinesList: editFormData.listMachines.map(machine => ({
      code: machine.code,
      type: machine.type,
      status: machine.status
    })),
  };
  console.log('Payload for Save:', JSON.stringify(payload, null, 2));
  console.log('Payload:', payload); // Log the payload

  Swal.fire({
    title: 'Are you sure?',
    text: 'This will update the data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, update it!',
  }).then(result => {
    if (result.isConfirmed) {
      axios.put(`${API_BASE_URL}${editFormData.id}`, payload)
        .then(response => {
          console.log('API Response:', JSON.stringify(response.data, null, 2)); // Log the API response in JSON format
          seteditModal(false);
          updateTableData();
          resetFormData(editFormData);
          fetchNamesShift();
          fetchMachineId();
          fetchProductCodes();
          fetchMachinePP();
          fetchMachineBlow();
          fetchBinId();
          fetchWeight();
          fetchMovement();
          Swal.fire({
            icon: 'success',
            title: 'Updated Successfully',
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: 'top-end',
            iconColor: 'green',
            toast: true,
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
          formSubmitted.value = false; // Reset formSubmitted state after successful submission
        })
        .catch(error => {
          handleError(error, 'Error updating data');
          formSubmitted.value = false; // Reset formSubmitted state on error
        });
    } else {
      formSubmitted.value = false; // Reset formSubmitted state if update is canceled
    }
  });
};







// Delete Role
const deleteRole = (id: string) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will not be able to recover this data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then(result => {
    if (result.isConfirmed) {
      axios.delete(`${API_BASE_URL}${id}`)
        .then(() => {
          updateTableData();
          Swal.fire({
            icon: 'success',
            title: 'Data Deleted Successfully',
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: 'top-end',
            iconColor: 'green',
            toast: true,
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        })
        .catch(error => handleError(error, 'Error deleting data'));
    }
  });
};

// Reset Form Data
const resetFormData = (formData: any) => {
  Object.keys(formData).forEach((key) => {
    if (typeof formData[key] === 'boolean') {
      formData[key] = false;
    } else if (typeof formData[key] === 'number') {
      formData[key] = 0;
    } else if (Array.isArray(formData[key])) {
      formData[key] = [];
    } else if (typeof formData[key] === 'object' && formData[key] !== null) {
      formData[key] = {};
    } else {
      formData[key] = '';
    }
  });

  formData.date = formatDate(new Date());
  formData.status = '';

  // Ensure nested arrays and objects are properly initialized
  formData.listBins = [];
  formData.ppChemicalTreatmentList = {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    jobStatus: '',
    blowrequired: false,
    listBinsList: [],
    listMachineList: []
  };
  formData.ppBlowList = {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    jobStatus: '',
    listBinsList: [],
    listMachineList: []
  };
  formData.qcInspectionList = {
    shift: '',
    jobStatus: '',
    binListforQCinspection: []
  };
  formData.listMachinesList = [];
};



const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
};

const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
};

const isJobStatusDisabled = computed(() => {
  return editFormData.chemJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );
});

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
  const el = toPrint.value;
  if (el) {
    const newPrint = window.open("");
    newPrint?.document.write(`
      <html>
        <head>
          <title>Post Prod Chemical Treatment</title>
          <style>
            @media print {
              table {
                border-collapse: collapse;
                width: 100%;
                font-family: Arial, Helvetica, sans-serif;
              }
              th, td {
                border: 1px solid #000; /* Set border color */
                padding: 8px;
                text-align: left;
                vertical-align: top;
              }
              th {
                background-color: #f2f2f2;
                font-weight: bold;
                color: #000; /* Set text color */
              }
              td {
                color: #000
              }
              .title {
                text-align: center;
              }
              /* Status colors */
              .text-green-600 {
                color: #166534;
              }
              .text-cyan-600 {
                color: #155e75;
              }
              .text-red-600 {
                color: #991b1b;
              }
              .text-orange-600 {
                color: #9a3412;
              }
            }
          </style>
        </head>
        <body>
          <table class="w-full">
            <tbody>
              ${el.innerHTML}

            </tbody>
          </table>
        </body>
      </html>
    `);
    newPrint?.print();
    newPrint?.close();
  }
};


function addRowQC(listName: 'binListforQCinspection') {
  if (listName === 'binListforQCinspection') {
    editFormData.qcInspectionList.binListforQCinspection.push({
      mappingId: '',
      type: '',
      weight: 0,
      reassignBinId: '',
      status: '',
      productCode: '',
      dimensionCheck: '',
      functionalCheck: '',
      visualCheck1: '',
      visualCheck2: '',
      visualCheck3: '',
      room: ''
    });
  }
}

function removeRowQC(listName: 'binListforQCinspection', index: number) {
  if (listName === 'binListforQCinspection') {
    editFormData.qcInspectionList.binListforQCinspection.splice(index, 1);
  }
}



function addRowBlow(listName: 'listBinsList' | 'listMachineList') {
  if (listName === 'listBinsList') {
    editFormData.ppBlowList.listBinsList.push({
      mappingId: '',
      type: '',
      weight: 0,
      reassignBinId: '',
      status: '',
      productCode: ''
    });
  } else if (listName === 'listMachineList') {
    editFormData.ppBlowList.listMachineList.push({
      code: '',
      type: '',
      status: ''
    });
  }
}

function removeRowBlow(listName: 'listBinsList' | 'listMachineList', index: number) {
  if (listName === 'listBinsList') {
    editFormData.ppBlowList.listBinsList.splice(index, 1);
  } else if (listName === 'listMachineList') {
    editFormData.ppBlowList.listMachineList.splice(index, 1);
  }
}


watch(
  () => editFormData.listBins,
  (newBins) => {
    const totalProcessedWeight = newBins.reduce((acc, bin) => acc + (bin.weight || 0), 0);
    editFormData.processedWeight = totalProcessedWeight;
    editFormData.waste = editFormData.weight - editFormData.processedWeight;
  },
  { deep: true }
);

watch(
  () => editFormData.weight,
  (newWeight) => {
    editFormData.waste = newWeight - editFormData.processedWeight;
  }
);
</script>

<template>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Post Prod Chemical Treatment</h2>

  </div>
  <!-- BEGIN: HTML Table Data -->
  <div class="p-5 mt-5 intro-y box mb-10">
    <div class="flex flex-col mb-5 sm:flex-row sm:items-end xl:items-start">
      <form id="tabulator-html-filter-form" class="xl:flex sm:mr-auto" @submit="(e) => {
        e.preventDefault();
        onFilter();
      }">
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Job ID</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.jobId" type="text" class="mt-2 w-full"
                placeholder="Search Job ID..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="jobId">Job ID</Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-12 xl:w-auto xl:flex-initial">Status</label>
            <div class="relative">
              <FormSelect id="tabulator-html-filter-id" v-model="filter.status" class="mt-2 w-full"
                aria-label="Default select example">
                <option disabled value="">Select a Status Option</option>
                <option selected>Completed</option>
                <option selected>Draft</option>
                <option>Pending QC</option>
                <option>QC Rejected</option>
              </FormSelect>
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="onStatus">Status</Button>
            </div>
          </div>
        </div>
        <div class=" flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div class="flex">
              <div class="flex-1">
                <label class="flex-none w-12 xl:w-auto xl:flex-initial">Start Date</label>
                <div class="relative">
                  <FormInput id="tabulator-html-filter-id" v-model="filter.startDate" type="date" class="mt-2 w-full" />
                </div>

              </div>

            </div>
            <div class="flex">
              <div class="flex-1">
                <label class="flex-none w-12 xl:w-auto xl:flex-initial">Start Date</label>
                <div class="relative">
                  <FormInput id="tabulator-html-filter-id" v-model="filter.endDate" type="date" class="mt-2 w-full" />
                </div>

              </div>

            </div>
          </div>

          <div>

            <Button id="tabulator-html-filter-new-go" variant="primary" type="button" class="w-full top-0 right-0 mt-2"
              @click="onFilter">
              Date</Button>
          </div>
        </div>
      </form>
      <div class="flex mt-5 sm:mt-0">
        <Button id="tabulator-print" variant="outline-secondary" class="w-1/2 mr-2 sm:w-auto" @click="onResetFilter">
          Reset
        </Button>

        <Button id="tabulator-print" variant="outline-primary" class="w-1/2 mr-2 sm:w-auto" @click="onPrint">
          <Lucide icon="Printer" class="w-4 h-4 mr-2" /> Print
        </Button>


      </div>
    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulator" ref="tableRef" class="mt-5"></div>
    </div>
  </div>

  <Dialog
:staticBackdrop="true" size="3xl" :open="editModal" @close="() => {
    seteditModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          Edit Post Production Chemical Treatment
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-gr">Job ID</FormLabel>
            <FormInput v-model="editFormData.whiteSlipId" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Product Code</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.productCode"
              :class="{ 'border-red-500': formSubmitted && !editFormData.productCode }" class="sm:mr-2"
              aria-label="Default select example" disabled>
              <option disabled value="">Select a Product Code Option</option>
              <option v-for="productcode in editFormData.productcodes" :key="productcode" :value="productcode">
                {{ productcode }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.productCode" class="text-red-500">Product Code is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="time-picker-machine">Time Taken for Machine Station per KG (HH:MM:SS)</FormLabel>
            <div id="time-picker-machine" class="time-picker flex items-center">
              <FormInput v-model="editFormData.totalTimeTaken" name="totalTimeTaken" placeholder="HH:MM:SS"
                @input="onTimeInput" class="mr-2" disabled />
            </div>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Sub Job ID</FormLabel>
            <FormInput v-model="editFormData.subJobId" id="regular-form-4" type="text" placeholder="Sub Job ID" />
          </div> -->
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.shift" class="sm:mr-2 form-select mt-1 block w-full"
              aria-label="Default select example" :class="{ 'border-red-500': formSubmitted && !editFormData.shift }">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.shift" class="text-red-500">Shift is required!</span>
          </div> -->

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5"> Machine ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.machineCode" class="sm:mr-2 form-select mt-1 block w-full"
              aria-label="Default select example"
              :class="{ 'border-red-500': formSubmitted && !editFormData.machineCode }">
              <option disabled value="">Select a Machine ID Option</option>
              <option v-for="machineCode in editFormData.machineCodes" :key="machineCode" :value="machineCode">
                {{ machineCode }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.machineCode" class="text-red-500">Machine ID is required!</span>
          </div> -->
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="qcrequired" class="mr-2 ml-[-2]">
                Blow Required
              </FormCheck.Label>
              <FormCheck.Input id="qcrequired" v-model="editFormData.blowrequired" type="checkbox" disabled />
            </FormCheck>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Weight</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight)) }"
              id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Weight" disabled step="any" />
            <span v-if="formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight))"
              class="text-red-500">{{
                !editFormData.weight ? 'Weight is required!' : 'Weight must be a valid number!'
              }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Processed Weight</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight)) }"
              id="regular-form-8" v-model="editFormData.processedWeight" type="text" placeholder="Processed Weight"
              disabled step="any" />
            <span v-if="formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight))"
              class="text-red-500">{{ !editFormData.processedWeight ? 'Processed Weight is required!' : 'Processed Weight must be a valid number!'
              }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Waste</FormLabel>
            <FormInput id="regular-form-8" v-model="editFormData.waste" type="text" placeholder="Waste" disabled
              step="any" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class=" sm:mr-2" aria-label="Default select example" :disabled="isJobStatusDisabled">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>Pending</option>
            </FormSelect>
          </div>

          <!-- Machine Job Rows Section -->
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 mt-2 text-lg font-medium leading-none">Chemical Treatment Job Details</h6>
            <hr>
            <div v-if="editFormData.chemJobRows.length > 0" class="overflow-x-auto mt-3">
              <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">Sub Job ID</th>
                    <th class="py-2 px-4 border-b text-center">Mixer ID</th>
                    <th class="py-2 px-4 border-b text-center">Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Shift</th>
                    <th class="py-2 px-4 border-b text-center">Min Capacity</th>
                    <th class="py-2 px-4 border-b text-center">Max Capacity</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Avg Time Taken</th>
                    <th class="py-2 px-4 border-b text-center">Status</th>
                    <th class="py-2 px-4 border-b text-center">Submit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.chemJobRows" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.subJobId" type="text" class="w-full px-2 py-1 border rounded"
                       disabled />
                    </td>

                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="row.machineCode" class="sm:mr-2 form-select mt-1 block w-full"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'"
                        aria-label="Default select example">
                        <option disabled value="">Select a Machine ID Option</option>
                        <option v-for="machineCode in editFormData.machineCodes" :key="machineCode"
                          :value="machineCode">
                          {{ machineCode }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="row.binCode" class="sm:mr-2 form-select mt-1 block w-full"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'"
                        aria-label="Default select example" @change="updateCapacityValuesMachine(row.binCode, row)">
                        <option disabled value="">Select a Bin ID Option</option>
                        <option v-for="bin in editFormData.bins" :key="bin" :value="bin">
                          {{ bin }}
                        </option>
                      </FormSelect>
                    </td>

                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="row.shift" class="sm:mr-2 form-select mt-1 block w-full"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'"
                        aria-label="Default select example">
                        <option disabled value="">Select a Shift Option</option>
                        <option v-for="name in editFormData.shifts" :key="name" :value="name">
                          {{ name }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.minCapacity" type="number" class="w-full px-2 py-1 border rounded"
                        disabled />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.maxCapacity" type="number" class="w-full px-2 py-1 border rounded"
                        disabled />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.weight" type="number" class="w-full px-2 py-1 border rounded"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.avgTimeTaken" type="text" class="w-full px-2 py-1 border rounded"
                        disabled />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="row.status" type="text" class="w-full px-2 py-1 border rounded" disabled />
                    </td>

                    <td class="py-2 px-4 border-b text-center flex">
                      <button type="button" @click="submitChemJobRow(row)" :class="{
                        'bg-blue-700 hover:bg-blue-900': row.status !== 'Completed' && row.status !== 'Submitted',
                        'bg-gray-400 cursor-not-allowed': row.status === 'Completed' || row.status === 'Submitted'
                      }" class="my-2 mx-2 px-4 py-2 text-white rounded"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'">
                        Submit
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addChemJobRow"
              class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">
              Add Job Detail
            </button>
          </div>

          <!-- List Bins -->
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 mt-2 text-lg font-medium leading-none">List Bins</h6>
            <hr>
            <div v-if="validBins.length === 0" class="mt-3 text-red-600 text-center">
            </div>
            <div v-else class="overflow-x-auto mt-3">
              <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Capacity Min</th>
                    <th class="py-2 px-4 border-b text-center">Capacity Max</th>
                    <th class="py-2 px-4 border-b text-center">Movement</th>
                    <th class="py-2 px-4 border-b text-center">Reassign Bin Id</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.listBins" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b text-center">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b w-full">
                      <FormSelect v-model="row.binMasterId" class="sm:mr-2 " aria-label="Default select example"
                        @change="updateCapacityValues(row.binMasterId, row)">
                        <option disabled value="">Select a Bin ID Option</option>
                        <option v-for="binMasterId in editFormData.bins" :key="binMasterId" :value="binMasterId">
                          {{ binMasterId }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.weight" type="number" class="w-full px-2 py-1 border rounded large-width"
                        step="any" />
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.capacityMin" type="number"
                        class="w-full px-2 py-1 border rounded large-width" />
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.capacityMax" type="number"
                        class="w-full px-2 py-1 border rounded large-width" />
                    </td>
                    <td class="py-2 px-4 border-b w-full">
                      <FormSelect v-model="row.movement" class="sm:mr-2 " aria-label="Default select example">
                        <option disabled value="">Select a Movement Option</option>
                        <option v-for="movement in editFormData.movements" :key="movement" :value="movement">
                          {{ movement }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-">
                      <FormInput v-model="row.reassignBinId" type="text"
                        class="w-full px-2 py-1 border rounded small-width" />
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button type="button" @click="deleteRow(row.id, index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- <button type="button" @click="addRow"
              class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">
              Add Bin
            </button> -->
          </div>
          <!-- List Machine -->
          <div v-if="editFormData.listMachines.length > 0" class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 text-lg font-medium leading-none">List Bins</h6>
            <hr>
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-3">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">No.</th>
                  <th class="py-2 px-4 border-b text-center">Code</th>
                  <th class="py-2 px-4 border-b text-center">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.listMachines" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormInput type="text" v-model="row.code" class="form-input mt-1 block w-full" />
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormSelect v-model="row.type" id="blendingRequired" class="sm:mr-2">
                      <option disabled value="">Select a Type Option</option>
                      <option>Blending</option>
                      <option>Production</option>
                      <option>Blower</option>
                      <option>Chemical Treatment</option>
                    </FormSelect>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- PP Blow List -->
          <!-- <div v-if="editFormData.blowrequired" class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 text-lg font-medium leading-none">Post Production Blow</h6>
            <hr>
            <div>
              <div class="mt-5">
                <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
                <FormSelect v-model="editFormData.ppBlowList.shift" class="sm:mr-2 form-select block w-full"
                  aria-label="Default select example">
                  <option disabled value="">Select a Shift Option</option>
                  <option v-for="name in editFormData.shifts" :key="name" :value="name">
                    {{ name }}
                  </option>
                </FormSelect>
              </div>
              <div class="mt-5">
                <FormLabel class="block mb-2">Machine Code</FormLabel>
                <FormSelect v-model="editFormData.ppBlowList.machineCode" class="sm:mr-2 form-select mt-1 block w-full"
                  aria-label="Default select example">
                  <option disabled value="">Select a Machine Code Option</option>
                  <option v-for="name in editFormData.machineCodesBlow" :key="name" :value="name">
                    {{ name }}
                  </option>
                </FormSelect>
              </div>
            </div> -->

            <!-- List Bins List Table -->
            <!-- <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List Bins (Post Production Blow)</h6>
            <hr>
            <div v-if="editFormData.ppBlowList.listBinsList.length > 0">
              <table class="mt-5 min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Type</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Reassign Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Product Code</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bin, index) in editFormData.ppBlowList.listBinsList" :key="index">
                    <td class="py-2 px-4 border-b text-center small-width">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.type" class="form-input mt-1 block w-full">
                        <option disabled value="">Select a Type Option</option>
                        <option>Blending</option>
                        <option>Production</option>
                        <option>Blower</option>
                        <option>Chemical Treatment</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b small-width">
                      <FormInput v-model="bin.weight" type="number" class="w-full px-2 py-1 border rounded" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="bin.reassignBinId" type="text" class="w-full px-2 py-1 border rounded" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.productCode" class="sm:mr-2" aria-label="Default select example">
                        <option disabled value="">Select a Product Code Option</option>
                        <option v-for="productcode in editFormData.productcodes" :key="productcode"
                          :value="productcode">
                          {{ productcode }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="removeRowBlow('listBinsList', index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addRowBlow('listBinsList')"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add Bin</button> -->

            <!-- List Machine List Table -->
            <!-- <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List Machines</h6>
            <hr>
            <div v-if="editFormData.ppBlowList.listMachineList.length > 0">
              <table class="mt-5 min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Code</th>
                    <th class="py-2 px-4 border-b text-center">Type</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(machine, index) in editFormData.ppBlowList.listMachineList" :key="index">
                    <td class="py-2 px-4 border-b text-center small-width">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="machine.code" type="text" class="w-full px-2 py-1 border rounded" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="machine.type" class="form-input mt-1 block w-full">
                        <option disabled value="">Select a Type Option</option>
                        <option>Blending</option>
                        <option>Production</option>
                        <option>Blower</option>
                        <option>Chemical Treatment</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="removeRowBlow('listMachineList', index)"
                        class="text-red-600 hover:text-red-800 text-lg text-center">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addRowBlow('listMachineList')"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add Machine</button> -->
          <!-- </div> -->

          <!-- QC Inspection List -->
          <div v-if="!editFormData.blowrequired" class="mt-5 border py-5 px-3 rounded-lg overflow-hidden hidden">
            <h6 class="mb-2 text-lg font-medium leading-none">Bin List (Quality Control Inspection) </h6>
            <hr>
            <div>
              <!-- <div class="mt-5">
      <FormLabel class="block mb-2">Shift</FormLabel>
      <FormSelect v-model="editFormData.qcInspectionList.shift"
        class="sm:mr-2 form-select block w-full" aria-label="Default select example">
        <option disabled value="">Select a Shift Option</option>
        <option v-for="name in editFormData.shifts" :key="name" :value="name">
          {{ name }}
        </option>
      </FormSelect>
    </div> -->
              <!-- <div class="mt-5">
      <FormLabel class="block mb-2">Job Status</FormLabel>
      <FormInput v-model="editFormData.qcInspectionList.jobStatus" type="text" />
    </div> -->
            </div>

            <!-- Bin List for QC Inspection Table -->
            <!-- <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Bin List for QC Inspection</h6>
            <hr> -->
            <div v-if="editFormData.qcInspectionList.binListforQCinspection.length > 0" class="overflow-x-auto">
              <table class="mt-5 min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Type</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Reassign Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Product Code</th>
                    <th class="py-2 px-4 border-b text-center">Dimension Check</th>
                    <th class="py-2 px-4 border-b text-center">Functional Check</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 1</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 2</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 3</th>
                    <th class="py-2 px-4 border-b text-center">Room</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bin, index) in editFormData.qcInspectionList.binListforQCinspection" :key="index">
                    <td class="py-2 px-4 border-b text-center small-width">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.type" class="form-input mt-1 block w-full min-w-[150px]">
                        <option disabled value="">Select a Type Option</option>
                        <option>Blending</option>
                        <option>Production</option>
                        <option>Blower</option>
                        <option>Chemical Treatment</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b small-width">
                      <FormInput v-model="bin.weight" type="number"
                        class="w-full px-2 py-1 border rounded min-w-[80px]" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="bin.reassignBinId" type="text"
                        class="w-full px-2 py-1 border rounded min-w-[150px]" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.productCode" class="sm:mr-2 min-w-[100px]"
                        aria-label="Default select example">
                        <option disabled value="">Select a Product Code Option</option>
                        <option v-for="productcode in editFormData.productcodes" :key="productcode"
                          :value="productcode">
                          {{ productcode }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.dimensionCheck" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.functionalCheck" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck1" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck2" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck3" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.room" class="form-input mt-1 block w-full min-w-[100px]">
                        <option disabled value="">Select an Option</option>
                        <option>Clean</option>
                        <option>Non Clean</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="removeRowQC('binListforQCinspection', index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addRowQC('binListforQCinspection')"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add Bin</button>
          </div>


          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md" :disabled="isJobStatusDisabled">
            Submit
          </Button>
        </form>
      </Dialog.Description>
      <Dialog.Footer>
        <Button type="button" variant="outline-secondary" @click="() => {
          seteditModal(false);
        }
          " class="w-20 mr-1">
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>
  <!-- BEGIN: Modal Content -->
  <!-- <Dialog
:staticBackdrop="true" size="xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Machine Station
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <div class="hidden" ref="toPrint">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.whiteSlipId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Date
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ formattedDate }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Resource Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.resourceCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Shift
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.shift }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.status }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Product Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Required
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendRequired }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendweight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Collected
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.collected }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendStatus }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      List Bins
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.listBins }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Reassigned Bin ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.reassignedBinId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.jobStatus }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.productSubCodesofRecipe.length > 0">

                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="7"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Product Sub Codes of Recipe
                      </th>
                    </tr>
                    <tr>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Job ID
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Product Code
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Percentage
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Weight
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Status
                      </th>
                    </tr>
                    <tr v-for="(row, index) in viewData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.jobId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.productCode }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.percentage }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.status }}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.listBinsforBlend.length > 0">

                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="7"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        List Machines
                      </th>
                    </tr>
                    <tr>

                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Type
                      </th>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Weight
                      </th>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Reassign Bin ID
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Product Code
                      </th>

                    </tr>
                    <tr v-for="(row, index) in viewData.listBinsforBlend" :key="index" class="hover:bg-gray-100">
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.type }}
                      </td>
                      <td class=" px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.reassignBinId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.productCode }}
                      </td>

                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Date
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ formattedDate }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Resource Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.resourceCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.shift }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.status }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Product Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productCode }}
                  </td>
                </tr>

              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Required
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendRequired }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendweight }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Collected
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.collected }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendStatus }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List Bins
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.listBins }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Reassigned Bin ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.reassignedBinId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobStatus }}
                  </td>
                </tr>


              </tbody>
            </table>

          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.productSubCodesofRecipe.length > 0">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    Product Sub Codes of Recipe
                  </th>
                </tr>
                <tr>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Job ID
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Product Code
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Percentage
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Weight
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Status
                  </th>
                </tr>
                <tr v-for="(row, index) in viewData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.jobId }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.productCode }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.percentage }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.weight }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.status }}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.listBinsforBlend.length > 0">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    List Machines
                  </th>
                </tr>
                <tr>

                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Type
                  </th>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Weight
                  </th>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Reassign Bin ID
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Product Code
                  </th>

                </tr>
                <tr v-for="(row, index) in viewData.listBinsforBlend" :key="index" class="hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.type }}
                  </td>
                  <td class=" px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.weight }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.reassignBinId }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.productCode }}
                  </td>

                </tr>

              </tbody>
            </table>
          </div>
        </div>


      </Dialog.Description>
      <Dialog.Footer>
        <Button type="button" variant="primary" class="mr-2" @click="printTable">
          <i class="fa-solid fa-print mr-2"></i> Print
        </Button>

        <Button type="button" variant="outline-secondary" @click="() => {
          setviewModal(false);
        }
          " class="w-20 mr-1">
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog> -->
  <!-- END: Modal Content -->



</template>
<style scoped>
.overflow-x-auto {
  overflow-x: auto;
}

.overflow-y-auto {
  overflow-y: auto;
}

.max-h-full {
  max-height: 100vh;
}

.small-width {
  width: 80px;
}
</style>