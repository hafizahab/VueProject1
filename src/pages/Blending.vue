<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, Ref } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";


interface UserAccess {
    userId: string;
    blending?: string[];
}

let cachedUserAccess: UserAccess[] | null = null; // Use null initially to indicate no data is cached

function getUserAccessData(): Promise<UserAccess[]> {
    return new Promise((resolve, reject) => {
        if (cachedUserAccess) {
            resolve(cachedUserAccess);
        } else {
            loading.value = true; // Show the loading modal
            fetch('http://10.87.0.33:8082/api/UserAccessManagement')
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    // Ensure the data structure matches expectations
                    if (data && Array.isArray(data.result)) {
                        cachedUserAccess = data.result as UserAccess[]; // Explicitly cast data.result
                        resolve(cachedUserAccess);
                    } else {
                        throw new Error("Unexpected response format");
                    }
                })
                .catch((error) => reject(error))
                .finally(() => {
                    loading.value = false; // Hide the loading modal
                });
        }
    });
}

interface Response {
  id?: string;
  jobId?: string;
  shift?: string;
  weight?: string;
  waste?: string;
  date?: string;
  resourceCode?: string;
  status?: string;
  productCode?: string;
  machineId?: string;
  preBlendweight?: number;
  collected?: boolean;
  preBlendStatus?: string;
  listBins?: string;
  reassignedBinId?: string;
  totalTimeTaken?: string;
  processedWeight?: string;
  jobStatus?: string;
}


const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  jobId: "",
  productCode: "",
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
      // initialSort: [
      //   { column: "date", dir: "desc" }, // Sort by date in descending order
      // ],
// Add a title at the top of the print view
printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Blending
                </h1>
            `,

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
          field: "id",
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
          field: "jobId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.jobId}</div>
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
          title: "PART NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "productCode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
        <div class="font-medium whitespace-nowrap">${response.productCode}</div>
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
              // Convert 'PENDING' to 'Pending' before applying the formatting
              if (status === 'PENDING') {
                status = 'Pending';
              }

              switch (status) {
                case 'Completed':
                  statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
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
    minWidth: 300,
    field: "actions",
    responsive: 1,
    hozAlign: "center",
    headerHozAlign: "center",
    vertAlign: "middle",
    formatter: function (cell) {
        const container = document.createElement("div");
        container.classList.add(
            "flex",
            "items-center",
            "gap-3",
            "justify-center",
            "flex-nowrap",
            "overflow-x-auto",
            "whitespace-nowrap"
        );

        const response = cell.getData();
        const loggedInUserId = localStorage.getItem("userId");

        // Placeholder while data is being fetched
        container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

        getUserAccessData()
            .then((userAccessData) => {
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";

                if (userAccess) {
                    // Conditionally render "Edit" link
                    if (
                        userAccess.blending &&
                        userAccess.blending.includes("Edit") &&
                        response.jobStatus !== "Completed"
                    ) {
                        const editLink = document.createElement("a");
                        editLink.classList.add(
                            "flex",
                            "items-center",
                            "text-blue-500",
                            "text-sm"
                        );
                        editLink.href = "#";
                        editLink.addEventListener("click", (event) => {
                            event.preventDefault();
                            editRole(response.id);
                        });
                        editLink.innerHTML = `<i class="fa-regular fa-pen-to-square mr-1"></i>Edit`;
                        container.appendChild(editLink);
                    }
                }

                // Always render the "View" link
                const viewLink = document.createElement("a");
                viewLink.classList.add(
                    "flex",
                    "items-center",
                    "text-primary",
                    "text-sm"
                );
                viewLink.href = "#";
                viewLink.addEventListener("click", (event) => {
                    event.preventDefault();
                    viewRole(response.id);
                });
                viewLink.innerHTML = `<i class="fa-regular fa-eye mr-1"></i>View`;
                container.appendChild(viewLink);

                // Normalize row height
                cell.getRow().normalizeHeight();
            })
            .catch((error) => {
                console.error("Error fetching user access data:", error);
                container.innerHTML = `<span class="text-red-500 text-sm">Error</span>`;
            });

        return container;
    },
},



        {
          title: "Job ID",
          field: "jobId",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Part Number",
          field: "productCode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Weight",
          field: "weight",
          visible: false,
          print: true,
          download: true,
        },

      {
        title: "Waste",
        field: "waste",
        hozAlign: "center",
        visible: false,
          print: true,
          download: true,

      },
      {
        title: "Processed Weight",
        field: "processedWeight",
        hozAlign: "center",
        visible: false,
          print: true,
          download: true,

      },
      {
        title: "Total Time Taken",
        field: "totalTimeTaken",
        hozAlign: "center",
        visible: false,
          print: true,
          download: true,

      },

        {
          title: "Job Status",
          field: "jobStatus",
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
                case 'Pending':
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
const productCode = () => {
  if (tabulator.value && filter.productCode) {
    console.log("Applying filter for productCode:", filter.productCode);
    tabulator.value.setFilter("productCode", 'like', filter.productCode);
  } else {
    console.warn("Filter value is empty or Tabulator not initialized");
  }
};

const onStatus = () => {
  if (tabulator.value) {
    // Clear existing filters
    tabulator.value.clearFilter(true);

    // Check the selected status
    if (filter.status === "Pending") {
      // Apply 'like' filter for "Pending" to include all statuses with the word "Pending"
      tabulator.value.setFilter("jobStatus", 'like', "Pending");
    } else if (filter.status === "Completed") {
      // Apply exact match filter for "Completed"
      tabulator.value.setFilter("jobStatus", '=', filter.status);
    } else {
      // If no specific status filter is selected, revert to the default filter to exclude "Completed" items
      tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
    }
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

  // Reset to the default view with only "Pending" jobs
  if (tabulator.value) {
    tabulator.value.clearFilter(true);
    tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
  }
};


// Print
const onPrint = () => {
  if (tabulator.value) {
    tabulator.value.print();
  }
};


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/Blending/';
const loading = ref(false); // Controls loading animation modal

onMounted(() => {
  loading.value = true; // Show loading animation at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data by "Pending" status first, then by jobId numerically in ascending order
      const sortedData = filteredData.sort((a: any, b: any) => {
        const isPendingA = a.jobStatus.toUpperCase() === 'PENDING';
        const isPendingB = b.jobStatus.toUpperCase() === 'PENDING';
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;
        const jobIdA = parseInt(a.jobId.substring(1));
        const jobIdB = parseInt(b.jobId.substring(1));
        return jobIdA - jobIdB;
      });

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter(item => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    }),

    // Additional data-fetching functions
    fetchNamesShift(),
    fetchBinId(),
    fetchWeight(),
    fetchMachineIdMS(),
    fetchMovement(),
    fetchWHCode(),
    fetchMachineId(),
    fetchProductCodes(),
    fetchWM()
  ];

  // Wait for all fetch operations to complete
  Promise.all(fetchPromises)
    .catch(error => console.error('Error fetching data:', error))
    .finally(() => {
      loading.value = false; // Hide loading animation once all data is loaded
    });

  initTabulator();
  reInitOnResizeWindow();
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

const formattedDate = computed(() => {
  return formatDateView(new Date(viewData.date));
});

const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const viewData = reactive({
  id: null,
  jobId: '',
  date: formatDate(new Date()),
  resourceCode: '',
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  subJobId: '',
  machineId: '',
  totalTimeTaken: '',
  weight: 0,
  processedWeight: 0,
  waste: 0,
  shift: '',
  status: '',
  productCode: '',
  preBlendRequired: false,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  preBlendweight: 0,
  collected: false,
  preBlendStatus: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  listBins: '',
  reassignedBinId: '',
  jobStatus: '',
  initialStatus: '',
  shifts: [] as string[],
  productcodes: [] as string[],
  machineCodes: [] as string[],
  machineIds: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  whcode: [] as string[],
  binData: [] as any[],
  productSubCodesofRecipe: [] as Array<{ productRecipeMappingId: string; subJobId: string; jobId: string; productCode: string; percentage: ''; weight: number; status: string; }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; status: string; weight: number; capacityMin: number; capacityMax: number; movement: string; reassignBinId: string }>,
  listBinsforBlend: [] as Array<{ id: string; binMasterId: string; subJobId: string; status: string; weight: number; capacityMin: number; capacityMax: number; movement: string; reassignBinId: string }>,
  machineStation: {
    shift: '',
    machineCode: '',
    totalWeight: 0,
    processedWeight: 0,
    waste: 0,
  },
  subJobDetails: [] as Array<{
    jobId: string;
    subJobId: string;
    machineId: string;
    machineCode: string;
    status: string;
    initialStatus: string
    recipe: Array<{ productCode: string; percentage: number; weight: number }>;
  }>,
  ipqcList: [] as Array<{
    jobId: string;
    subJobId: string;
    weight: number;
    shift: string;
    qcPassed: boolean;
    processedWeight: number;
    waste: number;
    totalTimeTaken: string;
    jobStatus: string;
    binListforIPQC: Array<{
      binMasterId: string;
      mappingId: string;
      type: string;
      weight: number;
      movement: string;
      colour: string;
      capacityMin: number;
      capacityMax: number;
      reassignBinId: string;
      productCode: string;
      dimensionCheck_IPQC: string;
      functionalCheck_IPQC: string;
      visualCheck1_IPQC: string;
      visualCheck2_IPQC: string;
      visualCheck3_IPQC: string;
      room: string;
    }>;
  }>,
  whpowderList: [] as Array<{
    powderCode: string;
    requestedWeight: number;
    approvedWeight: number;
    isApproved: boolean;
    isRecieved: boolean;
  }>
});

// Form Data
const editFormData = reactive({
  id: null,
  jobId: '',
  date: formatDate(new Date()),
  resourceCode: '',
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  subJobId: '',
  machineId: '',
  totalTimeTaken: '',
  weight: 0,
  processedWeight: 0,
  waste: 0,
  shift: '',
  status: '',
  productCode: '',
  preBlendRequired: false,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  preBlendweight: 0,
  collected: false,
  preBlendStatus: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  listBins: '',
  reassignedBinId: '',
  jobStatus: '',
  initialStatus: '',
  shifts: [] as string[],
  productcodes: [] as string[],
  machineCodes: [] as string[],
  machineIds: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  whcode: [] as string[],
  binData: [] as any[],
  productSubCodesofRecipe: [] as Array<{ productRecipeMappingId: string; subJobId: string; jobId: string; productCode: string; percentage: ''; weight: number; status: string; }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; status: string; weight: number; capacityMin: number; capacityMax: number; movement: string; reassignBinId: string }>,
  listBinsforBlend: [] as Array<{ id: string; binMasterId: string; subJobId: string; status: string; weight: number; capacityMin: number; capacityMax: number; movement: string; reassignBinId: string }>,
  machineStation: {
    shift: '',
    machineCode: '',
    totalWeight: 0,
    processedWeight: 0,
    waste: 0,
  },
  subJobDetails: [] as Array<{
    id: '';
    jobId: string;
    subJobId: string;
    machineId: string;
    machineCode: string;
    status: string;
    initialStatus: string
    recipe: Array<{ productCode: string; percentage: number; weight: number }>;
  }>,
  ipqcList: [] as Array<{
    jobId: string;
    subJobId: string;
    weight: number;
    shift: string;
    qcPassed: boolean;
    processedWeight: number;
    waste: number;
    totalTimeTaken: string;
    jobStatus: string;
    binListforIPQC: Array<{
      binMasterId: string;
      mappingId: string;
      type: string;
      weight: number;
      movement: string;
      colour: string;
      capacityMin: number;
      capacityMax: number;
      reassignBinId: string;
      productCode: string;
      dimensionCheck_IPQC: string;
      functionalCheck_IPQC: string;
      visualCheck1_IPQC: string;
      visualCheck2_IPQC: string;
      visualCheck3_IPQC: string;
      room: string;
    }>;
  }>,
  whpowderList: [] as Array<{
    powderCode: string;
    requestedWeight: number;
    approvedWeight: number;
    isApproved: boolean;
    isRecieved: boolean;
  }>
});

// Helper method to calculate total
function calculateTotal(recipes: any[], field: string): number {
  return recipes.reduce((sum, recipe) => sum + recipe[field], 0);
}

// Dropdown control for each Powder Code in whpowderList
const isPowderCodeDropdownOpen: Ref<boolean[]> = ref([]); // Explicitly define as boolean[]
const searchPowderCodeQuery: Ref<string[]> = ref([]); // Define as string[]

// Computed property to filter powder codes based on search query for each powder
const filteredPowderCodes = (powderIndex: number) => {
  if (!searchPowderCodeQuery.value[powderIndex]) {
    return editFormData.whcode;
  }
  return editFormData.whcode.filter((code) =>
    code.toLowerCase().includes(searchPowderCodeQuery.value[powderIndex].toLowerCase())
  );
};

// Function to toggle dropdown open/close for Powder Code (for powder context)
const togglePowderCodeDropdown = (powderIndex: number) => {
  isPowderCodeDropdownOpen.value[powderIndex] = !isPowderCodeDropdownOpen.value[powderIndex];
  searchPowderCodeQuery.value[powderIndex] = ''; // Clear search query when dropdown is opened
};

// Function to select a Powder Code (for powder context)
const selectPowderCode = (powderIndex: number, powderCode: any) => {
  editFormData.whpowderList[powderIndex].powderCode = powderCode;
  isPowderCodeDropdownOpen.value[powderIndex] = false; // Close the dropdown after selecting
};



// Function to determine if the Machine ID dropdown is disabled
const isDisabled = (subJobDetail: any) => {
  return subJobDetail.status === 'Completed' ||
    subJobDetail.status === 'Submitted' ||
    (editFormData.machineIds.length === 0 && subJobDetail.status !== 'Pending');
};






// Dropdown control for each Machine ID in subJobDetails
// Dropdown control for each Machine ID in subJobDetails
const isMachineIdDropdownOpen: Ref<boolean[]> = ref([]);
const searchMachineIdQuery: Ref<string[]> = ref([]);

// Computed property to filter machine IDs based on search query for each sub-job
const filteredMachineIds = (subJobIndex: any) => {
  if (!searchMachineIdQuery.value[subJobIndex]) {
    return editFormData.machineIds;
  }
  return editFormData.machineIds.filter((machineId) =>
    machineId.toLowerCase().includes(searchMachineIdQuery.value[subJobIndex].toLowerCase())
  );
};

// Function to toggle dropdown open/close for Machine ID (for sub-job context)
const toggleMachineIdDropdown = (subJobIndex: any) => {
  if (!isDisabled(editFormData.subJobDetails[subJobIndex])) {
    isMachineIdDropdownOpen.value[subJobIndex] = !isMachineIdDropdownOpen.value[subJobIndex];
    searchMachineIdQuery.value[subJobIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Machine ID (for sub-job context)
const selectMachineId = (subJobIndex: any, machineId: any) => {
  editFormData.subJobDetails[subJobIndex].machineId = machineId;
  isMachineIdDropdownOpen.value[subJobIndex] = false; // Close the dropdown after selecting
};


// Define permission variables for blending
let canEditBlending = false;
const canCreateBlending = ref(false);

// Define the fetchUserBlendingPermissions function
const fetchUserBlendingPermissions = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'User ID not found in local storage'
    });
    return;
  }

  try {
    console.log(`Fetching details for user ID: ${userId}`); // Debugging line

    // Fetch user details from the UserAccessManagement API
    const userAccessResponse = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
    const userDetails = userAccessResponse.data.result.find((user: any) => user.userId === userId);

    if (userDetails) {
      console.log('Fetched user details:', userDetails); // Debugging line

      const blending = userDetails.blending || ''; // Ensure the value is a string

      // Check if the string contains "Create" and "Edit" for blending
      canCreateBlending.value = blending.includes('Create');
      canEditBlending = blending.includes('Edit');

      console.log('canCreateBlending:', canCreateBlending.value); // Debugging log
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User details not found'
      });
    }
  } catch (error) {
    console.error('Error fetching user details:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while fetching user details'
    });
  }
};

// Call the fetchUserBlendingPermissions function to get permissions
fetchUserBlendingPermissions();


const fetchWM = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type.toLowerCase() === 'weighing machine' &&
          item.location.toLowerCase() === 'blending'
        );

        const weightMachineNames = activeNameData.map(item => item.name);

        editFormData.weightmachines = weightMachineNames;

        if (weightMachineNames.length === 1) {
          // Only one item found
          editFormData.weightmachine = weightMachineNames[0]; // Set as default value for edit form

          editFormData.isWeightMachineDisabled = true;  // Disable the FormSelect for edit form
        } else if (weightMachineNames.length > 1) {
          // More than one item found
          editFormData.weightmachine = weightMachineNames[0]; // Set the first item as default for edit form

          editFormData.isWeightMachineDisabled = false; // Enable the FormSelect for edit form
        }


      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

// Add a new powder row to the list
const addPowder = () => {
  editFormData.whpowderList.push({
    powderCode: '',
    requestedWeight: 0,
    approvedWeight: 0,
    isApproved: false,
    isRecieved: false,
  });
};

// Remove a powder row from the list
const removePowder = (index: number) => {
  editFormData.whpowderList.splice(index, 1);
};

const WAREHOUSE_API_BASE_URL = 'http://10.87.0.33:8082/api/WarehouseRequest';

// Function to fetch warehouse powder list by Job ID dynamically using editFormData.jobId
const fetchPowderListByJobId = (isViewMode = false) => {
  const jobId = isViewMode ? viewData.jobId : editFormData.jobId;

  // Check if jobId is available
  if (!jobId) {
    console.error('Job ID is not set for the requested data.');
    return;
  }

  // Fetch all warehouse requests
  axios.get(WAREHOUSE_API_BASE_URL)
    .then(response => {
      const data = response.data.result;
      if (data && data.length > 0) {
        // Find the request with the matching jobId
        const request = data.find((item: any) => item.jobId === jobId);
        if (request) {
          // Fetch specific warehouse request details by the request ID
          const requestId = request.id;
          axios.get(`${WAREHOUSE_API_BASE_URL}/${requestId}`)
            .then(res => {
              const powderList = res.data.result[0]?.whPowderDetailsList;
              if (powderList && powderList.length > 0) {
                console.log('Powder list for Job ID:', jobId, powderList);

                // Assign powderList to the appropriate data object
                if (isViewMode) {
                  viewData.whpowderList = [...powderList];  // This will trigger reactivity for viewData
                } else {
                  editFormData.whpowderList = [...powderList];  // This will trigger reactivity for editFormData
                }
              } else {
                console.log('No powder list found for Job ID:', jobId);
              }
            })
            .catch(error => {
              console.error('Error fetching specific warehouse request:', error);
            });
        } else {
          console.log('No matching Job ID found.');
        }
      } else {
        console.log('No warehouse requests found.');
      }
    })
    .catch(error => {
      console.error('Error fetching warehouse requests:', error);
    });
};

// Watcher to ensure jobId is set before fetching powder list
watch(
  () => viewData.jobId,
  (newJobId) => {
    if (newJobId) {
      // Only call fetchPowderListByJobId when jobId is available
      fetchPowderListByJobId(true);
    }
  }
);



const markAsReceived = (index: number) => {
  // SweetAlert confirmation
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will submit the data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, submit it!',
  }).then((result) => {
    if (result.isConfirmed) {
      // Set the isRecieved to true for the selected powder row after confirmation
      editFormData.whpowderList[index].isRecieved = true;

      const payload = {
        jobId: editFormData.jobId, // Get the actual jobId from form data
        whpowderList: editFormData.whpowderList.map(powder => ({
          jobId: editFormData.jobId,
          powderCode: powder.powderCode,
          requestedWeight: powder.requestedWeight,
          approvedWeight: powder.approvedWeight,
          isApproved: powder.isApproved,
          isRecieved: powder.isRecieved,
        })),
      };

      // Log the payload to console before making the request
      console.log('Payload to be submitted:', JSON.stringify(payload, null, 2));

      // Fetch existing warehouse data
      axios.get(`${WAREHOUSE_API_BASE_URL}`)
        .then(response => {
          const matchingJob = response.data.result.find((item: any) => item.jobId === editFormData.jobId);

          if (matchingJob) {
            // If matching jobId is found, update the warehouse request using PUT
            const requestId = matchingJob.id;

            axios.put(`${WAREHOUSE_API_BASE_URL}/${requestId}`, payload)
              .then(response => {
                fetchWHCode();
                console.log('Warehouse Request Updated:', response.data);

                // SweetAlert success
                Swal.fire({
                  icon: 'success',
                  title: 'Data Marked as Received Successfully',
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
              .catch(error => {
                console.error('Error updating warehouse request:', error);

                // SweetAlert error
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to update warehouse request.',
                  text: error.message || 'Something went wrong!',
                  toast: true,
                  position: 'top-right',
                  showConfirmButton: false,
                  timer: 3000,
                });
              });
          } else {
            console.error('No matching jobId found for update.');
          }
        })
        .catch(error => {
          console.error('Error checking warehouse requests:', error);
          Swal.fire({
            icon: 'error',
            title: 'Failed to check warehouse requests.',
            text: error.message || 'Something went wrong!',
            toast: true,
            position: 'top-right',
            showConfirmButton: false,
            timer: 3000,
          });
        });
    }
  });
};




const submitWarehouseRequest = () => {
  // Validate if any requestedWeight has more than four decimal places
  const hasInvalidWeight = editFormData.whpowderList.some(powder => {
    return powder.requestedWeight.toString().split('.')[1]?.length > 4;
  });



  // If there are invalid weights, show a SweetAlert error
  if (hasInvalidWeight) {
    Swal.fire({
      icon: 'error',
      title: 'Validation Error',
      text: 'One or more powders have a requested weight with more than four decimal places.',
      toast: true,
      position: 'top-right',
      showConfirmButton: false,
      timer: 3000,
    });
    return; // Stop the function if validation fails
  }

  // Check if we have a matching jobId in the warehouse data
  axios.get(`${WAREHOUSE_API_BASE_URL}`)
    .then(response => {
      const matchingJob = response.data.result.find((item: any) => item.jobId === editFormData.jobId);

      const payload = {
        jobId: editFormData.jobId,  // Get the actual jobId from form data
        whpowderList: editFormData.whpowderList.map(powder => ({
          jobId: editFormData.jobId,
          powderCode: powder.powderCode,
          requestedWeight: powder.requestedWeight,
          approvedWeight: powder.approvedWeight,
          isApproved: powder.isApproved,
          isRecieved: powder.isRecieved,
        }))
      };

      // Log the payload to console before making the request
      console.log('Payload to be submitted:', JSON.stringify(payload, null, 2));

      if (matchingJob) {
        // If matching jobId is found, we will update the warehouse request using PUT
        const requestId = matchingJob.id;  // Get the id of the existing request

        // SweetAlert confirmation for updating
        Swal.fire({
          title: 'Are you sure?',
          text: 'This will submit the data!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#1e40af',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, submit it!',
        }).then((result) => {
          if (result.isConfirmed) {
            axios.put(`${WAREHOUSE_API_BASE_URL}/${requestId}`, payload)
              .then(response => {
                fetchWHCode();
                console.log('Warehouse Request Updated:', response.data);

                // SweetAlert success toast for update
                Swal.fire({
                  icon: 'success',
                  title: 'Data Submitted Successfully',
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
              .catch(error => {
                console.error('Error updating warehouse request:', error);

                // SweetAlert error toast for update failure
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to update warehouse request.',
                  text: error.message || 'Something went wrong!',
                  toast: true,
                  position: 'top-right',
                  showConfirmButton: false,
                  timer: 3000,
                });
              });
          }
        });

      } else {
        // If no matching jobId is found, we will submit a new request using POST

        // SweetAlert confirmation for creating a new request
        Swal.fire({
          title: 'Are you sure?',
          text: 'This will submit the data!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#1e40af',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Yes, submit it!',
        }).then((result) => {
          if (result.isConfirmed) {
            axios.post(WAREHOUSE_API_BASE_URL, payload)
              .then(response => {
                fetchWHCode();
                console.log('Warehouse Request Submitted:', response.data);

                // SweetAlert success toast for new submission
                Swal.fire({
                  icon: 'success',
                  title: 'Warehouse request submitted successfully!',
                  toast: true,
                  position: 'top-right',
                  showConfirmButton: false,
                  timer: 3000,
                });
              })
              .catch(error => {
                console.error('Error submitting warehouse request:', error);

                // SweetAlert error toast for submission failure
                Swal.fire({
                  icon: 'error',
                  title: 'Failed to submit warehouse request.',
                  text: error.message || 'Something went wrong!',
                  toast: true,
                  position: 'top-right',
                  showConfirmButton: false,
                  timer: 3000,
                });
              });
          }
        });
      }
    })
    .catch(error => {
      console.error('Error checking warehouse requests:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to check warehouse requests.',
        text: error.message || 'Something went wrong!',
        toast: true,
        position: 'top-right',
        showConfirmButton: false,
        timer: 3000,
      });
    });
};





watch(() => editFormData.jobId, (newJobId) => {
  editFormData.ipqcList.forEach((ipqcItem) => {
    ipqcItem.jobId = newJobId;
  });
});


const fetchWHCode = () => {
  // Check if productCode is defined and not empty
  if (!editFormData.productCode) {
    console.error('Product code is missing. Cannot fetch warehouse codes.');
    return; // Exit the function if productCode is missing
  }

  axios
    .get(`http://10.87.0.33:8082/api/ProductMaster/GetLastProductReceiptdatabyProductCode/${editFormData.productCode}`)
    .then((response) => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Directly map the result array to extract 'productCode'
        editFormData.whcode = nameData.map((item) => item.productCode);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch((error) => {
      console.error('Error fetching warehouse codes:', error);
    });
};


watch(() => editFormData.productCode, (newVal) => {
  if (newVal) {
    fetchWHCode();
  }
});

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

const fetchMachineIdMS = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'production'
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

const updateCapacityValues = (binMasterId: any, row: any) => {
  const binDetails = getBinDetails(binMasterId);
  if (binDetails) {
    row.capacityMin = binDetails.capacityMin;
    row.capacityMax = binDetails.capacityMax;
  }
};



const fetchWeight = (isView = false) => {
  return new Promise((resolve, reject) => {
    axios.get('http://10.87.0.33:8082/api/PlanningDetails')
      .then(response => {
        const nameData = response.data.result;

        if (Array.isArray(nameData)) {
          // Filter out items with status "deleted"
          const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'deleted');

          // Determine which data object to update based on isView flag
          const jobId = isView ? viewData.jobId : editFormData.jobId;
          const matchingItem = activeNameData.find(item => item.jobId === jobId);

          if (matchingItem) {
            // Update the appropriate data object based on isView
            if (isView) {
              viewData.weight = matchingItem.quantity;
            } else {
              editFormData.weight = matchingItem.quantity;
            }
            resolve(true); // Resolve the promise after setting the weight
          } else {
            console.error('No matching jobId found in active data');
            reject('No matching jobId found');
          }
        } else {
          console.error('Invalid response format for name:', nameData);
          reject('Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error fetching names:', error);
        reject(error);
      });
  });
};



watch(() => editFormData.jobId, (newJobId) => {
  if (newJobId) {
    fetchWeight();
  }
});

watch(() => viewData.jobId, (newJobId) => {
  if (newJobId) {
    fetchWeight();
  }
});



const fetchMachineId = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "BLENDING"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'blending'
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineIds = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};



const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => {
  viewModal.value = value;
  if (!value) {
    viewData.weight = 0;
  }
};

// Utility function for error handling
const handleError = (error: any, message: any) => {
  console.error(message, error);
  Swal.fire({
    icon: 'error',
    title: 'Operation Failed',
    text: message,
  });
};

interface Bin {
  id: string;
  binMasterId: string;
  mappingId: string;
  subJobId: string | null;
  type: string;
  weight: number;
  startIPQC: boolean;
  binName?: string; // Optional property to hold the bin name
}

interface BinMaster {
  id: string;
  name: string;
}


const fetchBins = async (jobId: string) => {
  try {
    const binResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');

    const bins: Bin[] = binResponse.data.result;
    const binMasters: BinMaster[] = binMasterResponse.data.result;

    // Create a map of binMasterId to bin name
    const binMasterMap: { [key: string]: string } = {}; // Define the map type
    binMasters.forEach((binMaster: BinMaster) => {
      binMasterMap[binMaster.id] = binMaster.name;
    });

    // Filter bins based on conditions
    const filteredBins = bins.filter(bin =>
  bin.weight > 0 &&                             // weight must be greater than 0
  (bin.type.toLowerCase() === 'blending' ||     // type can be 'blending'
   bin.type.toLowerCase() === 'waste') &&       // or 'waste'
  bin.mappingId === jobId                       // mappingId must match jobId
);


    if (filteredBins.length > 0) {
      // Add bin name to each filtered bin
      filteredBins.forEach(bin => {
        bin.binName = binMasterMap[bin.binMasterId] || 'Unknown';
      });

      console.log('Filtered Bins with Names:', filteredBins);
      editFormData.binData = filteredBins; // Set detailed bin data for display
    } else {
      // If no bins match, clear the bin data
      console.warn(`No bins found matching the criteria for Job ID: ${jobId}`);
      editFormData.binData = []; // Clear the bin data to hide the list
    }
  } catch (error) {
    console.error('Error fetching bins or bin master data:', error);
  }
};

// Utility function to convert null values to empty strings
const replaceNullWithEmptyString = (obj: any) => {
  for (let key in obj) {
    if (obj[key] === null) {
      obj[key] = "";
    }
  }
  return obj;
};

const releaseBin = async (binId: any) => {
  try {
    // Step 1: Fetch the specific bin data
    const binResponse = await axios.get(`http://10.87.0.33:8082/api/ListBins/${binId}`);
    let binData = binResponse.data.result;

    // Ensure binData is not an array (handling both array and object cases)
    if (Array.isArray(binData)) {
      binData = binData.find(bin => bin.id === binId);  // Find the correct bin by ID if it's an array
    }

    // Step 2: Update the weight to 0
    binData.weight = 0;

    // Step 3: Replace null values with empty strings in the binData object
    binData = replaceNullWithEmptyString(binData);

    // Step 4: Log the payload in console before submitting it
    console.log("Payload to be submitted:", JSON.stringify(binData, null, 2));

    // Step 5: Show a confirmation dialog before submitting
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will release the bin!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, release it!',
    });

    // Step 6: Check if the user confirmed the action
    if (result.isConfirmed) {
      // Step 7: Submit the updated data using PUT API
      await axios.put(`http://10.87.0.33:8082/api/ListBins/${binId}`, binData);

      Swal.fire({
        icon: 'success',
        title: 'Bin Released Successfully',
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

      // Optional: Refresh the bin list to reflect the changes in the UI
      await fetchBins(editFormData.jobId);
    } else {
      console.log('Release action cancelled.');
    }
  } catch (error) {
    console.error("Error releasing bin:", error);
    Swal.fire('Failed!', 'There was an error releasing the bin. Please try again.', 'error');
  }
};




// Computed property for processedWeight (sum of bin weights)
const processedWeight = computed(() => {
  const totalWeight = editFormData.binData.reduce((sum, bin) => sum + Number(bin.weight), 0);
  return totalWeight;
});

// Computed property for waste (weight - processedWeight)
const waste = computed(() => {
  const weight = Number(editFormData.weight) || 0;
  return weight - processedWeight.value;
});

// Watchers to automatically update processedWeight and waste
watch(processedWeight, (newProcessedWeight) => {
  editFormData.processedWeight = newProcessedWeight;
});

watch(waste, (newWaste) => {
  editFormData.waste = newWaste;
});


// Computed property for processedWeight in view mode
const viewProcessedWeight = computed(() => {
  const totalWeight = viewData.binData?.reduce((sum, bin) => sum + Number(bin.weight), 0) || 0;
  return totalWeight;
});

// Computed property for waste in view mode
const viewWaste = computed(() => {
  const weight = Number(viewData.weight) || 0;
  return weight - viewProcessedWeight.value;
});



// Fetch and Set Data for Edit/View without using ID directly in the URL
const fetchAndSetData = async (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  loading.value = true; // Show loading animation

  try {
    const response = await axios.get(API_BASE_URL);
    const data = response.data.result;

    if (data && data.length > 0) {
      const item = data.find((item: any) => item.id === id);

      if (item) {
        const filteredBins = item.listBinsforBlend ? item.listBinsforBlend.filter((bin: any) => bin.status !== 'deleted') : [];
        const sortedSubJobDetails = Array.isArray(item.subJobDetails)
          ? item.subJobDetails.sort((a: any, b: any) => b.subJobId.localeCompare(a.subJobId))
          : [];

        Object.assign(formData, {
          id: item.id,
          jobId: item.jobId,
          date: item.date || formatDate(new Date()),
          resourceCode: item.resourceCode,
          subJobId: item.subJobId,
          machineId: item.machineId,
          weight: item.weight,
          status: item.status,
          productCode: item.productCode,
          preBlendRequired: item.preBlendRequired,
          preBlendweight: item.preBlendweight,
          collected: item.collected,
          preBlendStatus: item.preBlendStatus,
          listBins: item.listBins,
          reassignedBinId: item.reassignedBinId,
          jobStatus: item.jobStatus,
          wettreatmentrequired: item.wettreatmentrequired,
          plasmatreatmentrequired: item.plasmatreatmentrequired,
          dustingrequired: item.dustingrequired,
          deburringrequired: item.deburringrequired,
          productSubCodesofRecipe: item.productSubCodesofRecipe || [],
          listBinsList: item.listBinsList || [],
          listBinsforBlend: filteredBins,
          machineStation: item.machineStation || { shift: '', machineCode: '', totalWeight: 0, processedWeight: 0, waste: 0 },
          subJobDetails: sortedSubJobDetails
        });

        if (item.shift) formData.shift = item.shift;
        formData.initialStatus = item.status;
        if (item.weight !== undefined) formData.weight = item.weight;

        // Wait for both fetchBins and fetchWeight to complete before setting loading to false
        await Promise.all([
          fetchBins(item.jobId),
          fetchWeight(isView) // Pass isView to fetchWeight to fetch the weight for viewData or editFormData
        ]);

        // Now open the modal and set loading to false only when all data is ready
        modalSetter(true);

        // Fetch additional data based on jobId
        await fetchPowderListByJobId();
      } else {
        console.error('No data found for the specified ID:', id);
      }
    } else {
      console.error('No data found.');
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    loading.value = false; // Hide loading animation only after all fetching is complete
  }
};



const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);


function formatNumber(value: any) {
  return String(value).padStart(2, '0');
}


watch(
  () => [editFormData.hoursForMachineStation, editFormData.minutesForMachineStation, editFormData.secondsForMachineStation],
  () => {
    editFormData.totalTimeTaken = `${formatNumber(editFormData.hoursForMachineStation)}:${formatNumber(editFormData.minutesForMachineStation)}:${formatNumber(editFormData.secondsForMachineStation)}`;
  },
  { immediate: true }
);


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

watch(
  () => editFormData.productCode,
  (newProductCode) => {
    if (newProductCode) {
      axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
          const productData = response.data.result.find((item: any) => item.code === newProductCode);
          if (productData) {
            editFormData.totalTimeTaken = productData.timeTakenforBlending || '00:00:00';
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
  () => [viewData.hoursForMachineStation, viewData.minutesForMachineStation, viewData.secondsForMachineStation],
  () => {
    viewData.totalTimeTaken = `${formatNumber(viewData.hoursForMachineStation)}:${formatNumber(viewData.minutesForMachineStation)}:${formatNumber(viewData.secondsForMachineStation)}`;
  },
  { immediate: true }
);

function onTimeInputForView(event: any) {
  const value = event.target.value;
  const isValid = /^(\d{2}):(\d{2}):(\d{2})$/.test(value);
  if (isValid) {
    const [hours, minutes, seconds] = value.split(':').map(Number);
    viewData.totalTimeTaken = `${formatNumber(hours)}:${formatNumber(minutes)}:${formatNumber(seconds)}`;
  } else {
    console.error('Invalid time format. Please use HH:MM:SS.');
  }
}

watch(
  () => viewData.productCode,
  (newProductCode) => {
    if (newProductCode) {
      axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
          const productData = response.data.result.find((item: any) => item.code === newProductCode);
          if (productData) {
            viewData.totalTimeTaken = productData.timeTakenforBlending || '00:00:00';
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


// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading animation at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data by "Pending" status first, then by jobId numerically in ascending order
      const sortedData = filteredData.sort((a: any, b: any) => {
        const isPendingA = a.jobStatus.toUpperCase() === 'PENDING';
        const isPendingB = b.jobStatus.toUpperCase() === 'PENDING';
        if (isPendingA && !isPendingB) return -1;
        if (!isPendingA && isPendingB) return 1;
        const jobIdA = parseInt(a.jobId.substring(1));
        const jobIdB = parseInt(b.jobId.substring(1));
        return jobIdA - jobIdB;
      });

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter(item => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    }),

    // Additional data-fetching functions
    fetchNamesShift(),
    fetchBinId(),
    fetchWeight(),
    fetchMachineIdMS(),
    fetchMovement(),
    fetchWHCode(),
    fetchMachineId(),
    fetchProductCodes(),
    fetchWM()
  ];

  // Wait for all fetch operations to complete
  Promise.all(fetchPromises)
    .catch(error => console.error('Error fetching data:', error))
    .finally(() => {
      loading.value = false; // Hide loading animation once all data is loaded
    });

  initTabulator();
  reInitOnResizeWindow();

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
          editFormData.listBinsforBlend.splice(index, 1);
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
    editFormData.listBinsforBlend.splice(index, 1);
  }
};

const validBins = computed(() => editFormData.listBinsforBlend.filter(row => row.status !== 'deleted'));


const addRow = () => {
  editFormData.listBinsforBlend.push({
    id: '',
    binMasterId: '',
    subJobId: '',
    weight: 0,
    capacityMin: 0,
    capacityMax: 0,
    movement: '',
    reassignBinId: '',
    status: '',
  });
};

// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  editFormData.ipqcList.forEach((ipqcItem) => {
    ipqcItem.jobId = editFormData.jobId;
  });

  // Check if jobStatus is 'Completed', if so, set weight to processedWeight
  const weightToSend = editFormData.jobStatus === 'Completed'
    ? editFormData.processedWeight
    : editFormData.weight;

  const payload = {
    jobId: String(editFormData.jobId),
    subJobId: String(editFormData.subJobId),
    shift: String(editFormData.shift),
    weight: weightToSend, // Use weightToSend based on the condition
    processedWeight: editFormData.processedWeight,
    totalTimeTaken: editFormData.totalTimeTaken,
    waste: editFormData.waste,
    wettreatmentrequired: Boolean(editFormData.wettreatmentrequired),
    plasmatreatmentrequired: Boolean(editFormData.plasmatreatmentrequired),
    dustingrequired: Boolean(editFormData.dustingrequired),
    deburringrequired: Boolean(editFormData.deburringrequired),
    machineId: String(editFormData.machineId),
    productCode: String(editFormData.productCode),
    jobStatus: String(editFormData.jobStatus),
    productSubCodesofRecipe: editFormData.productSubCodesofRecipe.map(item => ({
      productRecipeMappingId: item.productRecipeMappingId,
      subJobId: item.subJobId,
      jobId: item.jobId,
      productCode: item.productCode,
      percentage: parseFloat(item.percentage) || 0,
      weight: item.weight,
      status: item.status
    })),
    listBinsList: editFormData.binData.map(item => ({
      binMasterId: item.binMasterId,
      subJobId: item.subJobId,
      type: 'Blending',
      weight: item.weight,
      capacityMin: item.capacityMin,
      capacityMax: item.capacityMax,
      movement: 'Blending',
      reassignBinId: item.reassignBinId,
      status: item.status,
    })),
    machineStation: [{
      shift: editFormData.machineStation.shift,
      machineCode: editFormData.machineStation.machineCode,
      totalWeight: editFormData.machineStation.totalWeight,
      processedWeight: editFormData.machineStation.processedWeight,
      waste: editFormData.machineStation.waste,
    }],
    subJobDetails: editFormData.subJobDetails.map(subJobDetail => ({
      jobId: subJobDetail.jobId,
      subJobId: subJobDetail.subJobId,
      machineId: subJobDetail.machineId,
      status: subJobDetail.status,
      recipe: subJobDetail.recipe.map(recipe => ({
        productCode: recipe.productCode,
        percentage: recipe.percentage,
        weight: recipe.weight,
      }))
    })),
    ipqcList: [{
      jobId: String(editFormData.jobId),
      subJobId: String(editFormData.ipqcList[0]?.subJobId || ""),
      weight: editFormData.ipqcList[0]?.weight || 0,
      shift: String(editFormData.ipqcList[0]?.shift || ""),
      qcPassed: Boolean(editFormData.ipqcList[0]?.qcPassed),
      processedWeight: editFormData.ipqcList[0]?.processedWeight || 0,
      waste: editFormData.ipqcList[0]?.waste || 0,
      totalTimeTaken: String(editFormData.ipqcList[0]?.totalTimeTaken || ""),
      jobStatus: String(editFormData.ipqcList[0]?.jobStatus || ""),
      binListforIPQC: editFormData.ipqcList[0]?.binListforIPQC?.map(bin => ({
        binMasterId: String(bin.binMasterId),
        mappingId: String(bin.mappingId),
        type: String(bin.type),
        weight: bin.weight,
        movement: String(bin.movement),
        colour: String(bin.colour),
        capacityMin: bin.capacityMin,
        capacityMax: bin.capacityMax,
        reassignBinId: String(bin.reassignBinId),
        productCode: String(bin.productCode),
        dimensionCheck_IPQC: String(bin.dimensionCheck_IPQC),
        functionalCheck_IPQC: String(bin.functionalCheck_IPQC),
        visualCheck1_IPQC: String(bin.visualCheck1_IPQC),
        visualCheck2_IPQC: String(bin.visualCheck2_IPQC),
        visualCheck3_IPQC: String(bin.visualCheck3_IPQC),
        room: String(bin.room),
      })) || []
    }],
  };

  console.log('Payload for Save:', JSON.stringify(payload, null, 2));

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
          console.log('API Response:', JSON.stringify(response.data, null, 2));
          setEditSlideOver(false);
          updateTableData();


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

        })
        .catch(error => {
          handleError(error, 'Error updating data');
        });
    }
  });
};




const submitJobDetails = async (subJobDetail: any) => {
  const confirmed = await Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: 'Do you want to submit the job details?',
    showCancelButton: true,
    confirmButtonText: 'Yes, submit it!',
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    reverseButtons: true
  }).then(result => result.isConfirmed);

  if (!confirmed) return;

  try {
    const payload = {
      subJobId: subJobDetail.subJobId,
      machineId: subJobDetail.machineId,
    };

    const response = await axios.post('http://10.87.0.33:8082/api/Blending/SubmitJob', payload);
    console.log('Success:', response.data);

    // Update the local data model (assuming response.data contains the updated status or any other relevant data)
    subJobDetail.status = response.data.status || 'Submitted'; // or use whatever the correct status is
    // Any other fields you might want to update
    // subJobDetail.someOtherField = response.data.someOtherField;

    await Swal.fire({
      icon: 'success',
      title: 'Submitted Successfully',
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

    // Optionally, re-fetch the job details from the server if needed
    // await fetchJobDetails();

  } catch (error) {
    console.error('Error:', error);

    await Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the job details. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
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
  const resetObject = (obj: any) => {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'boolean') {
        obj[key] = false;
      } else if (typeof obj[key] === 'number') {
        obj[key] = 0;
      } else if (Array.isArray(obj[key])) {
        obj[key] = [];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        resetObject(obj[key]);
      } else {
        obj[key] = '';
      }
    });
  };

  resetObject(formData);

};



const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
};

const EditSlideOver = ref(false);

const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;

  // If EditSlideOver is set to false, clear the whpowderList
  if (!value) {
    clearPowderList();  // Call the function to clear the powder list
  }
};

// Watch EditSlideOver and trigger recalculation when it is set to true
// watch(EditSlideOver, (newValue) => {
//   if (newValue) {
//     // Force recomputation of computed properties
//     editFormData.processedWeight = processedWeight.value;
//     editFormData.waste = waste.value;
//   }
// });

// Function to clear the whpowderList
const clearPowderList = () => {
  editFormData.whpowderList = [];  // Reset the whpowderList to an empty array
};

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};


const isJobStatusDisabled = computed(() => {
  return editFormData.subJobDetails.some(subJob => subJob.status === 'Pending') ||
    !editFormData.subJobDetails.every(subJob => subJob.status === 'Completed');
});

const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
  const el = toPrint.value;
  if (el) {
    const newPrint = window.open("", "_blank");

    if (newPrint) {
      newPrint.document.write(`
        <html>
          <head>
            <title>Goods Receiving</title>
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
                  color: #000;
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

      // Close the document to ensure it's fully loaded
      newPrint.document.close();

      // Wait for the content to be fully loaded, then print
      newPrint.focus();  // Ensure the new window is focused

      // Listen for the 'afterprint' event to close the window after printing
      newPrint.onafterprint = () => {
        newPrint.close();
      };

      // Trigger the print dialog
      setTimeout(() => {
        newPrint.print();
      }, 500);  // 500ms delay to ensure content is fully loaded
    }
  }
};
</script>

<template>
  <!-- Loading Modal Overlay -->
  <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Blending</h2>

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
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Part Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.productCode" type="text" class="mt-2 w-full"
                placeholder="Search Part Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="productCode">Part Number</Button>
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
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </FormSelect>
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="onStatus">
                Status
              </Button>
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
:staticBackdrop="true" size="xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Blending
        </h2>
        <div>
          <FormLabel htmlFor="regular-form-5">Weight Machine</FormLabel>
          <FormSelect v-model="editFormData.weightmachine" class="sm:mr-2" aria-label="Default select example"
            :disabled="editFormData.isWeightMachineDisabled">
            <option disabled value="">Select a Weight Machine Option</option>
            <option v-for="weightMachine in editFormData.weightmachines" :key="weightMachine" :value="weightMachine">
              {{ weightMachine }}
            </option>
          </FormSelect>
        </div>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-gr">Job ID</FormLabel>
            <FormInput v-model="editFormData.jobId" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Part Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.productCode"
              :class="{ 'border-red-500': formSubmitted && !editFormData.productCode }" class="sm:mr-2"
              aria-label="Default select example" disabled>
              <option disabled value="">Select a Part Number Option</option>
              <option v-for="productcode in editFormData.productcodes" :key="productcode" :value="productcode">
                {{ productcode }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.productCode" class="text-red-500">Part Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="time-picker-machine">Time Taken for Blending per KG (HH:MM:SS)</FormLabel>
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
  <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
  <FormSelect v-model="editFormData.shift" class="sm:mr-2 form-select mt-1 block w-full"
    aria-label="Default select example">
    <option v-if="!editFormData.shift" disabled value="">Select a Shift Option</option>
    <option v-for="name in editFormData.shifts" :key="name" :value="name">
      {{ name }}
    </option>
  </FormSelect>
</div> -->


          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/3">
                    Weight<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/3">
                    Processed Weight<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/3">
                    Waste
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <div>

                      <FormInput
                        :class="{ 'border-red-500': formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight)) }"
                        id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Weight" disabled
                        step="any" />
                      <span v-if="formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight))"
                        class="text-red-500">
                        {{ !editFormData.weight ? 'Weight is required!' : 'Weight must be a valid number!' }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div>
                      <FormInput
                        :class="{ 'border-red-500': formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight)) }"
                        id="regular-form-9" v-model="editFormData.processedWeight" type="number"
                        placeholder="Processed Weight" :disabled="true" step="any" />
                      <span
                        v-if="formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight))"
                        class="text-red-500">
                        {{ !editFormData.processedWeight ? 'Processed Weight is required!' : 'Processed Weight must be a valid number!' }}
                      </span>

                    </div>
                  </td>
                  <td class="px-4 py-2">
                    <div>
                      <FormInput id="regular-form-10" v-model="editFormData.waste" type="text" placeholder="Waste"
                        disabled step="any" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div>
            <FormLabel htmlFor="regular-form-gr">Total Time</FormLabel>
            <FormInput v-model="editFormData.totalTimeTaken" id="regular-form-gr" type="text" disabled />
          </div> -->
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5 hidden">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Wet Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Plasma Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Dedusting<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Deburring<br>Required
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="wet-treatment-edit" v-model="editFormData.wettreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="plasma-treatment-edit" v-model="editFormData.plasmatreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="dusting-required-edit" v-model="editFormData.dustingrequired" type="checkbox"
                        disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="deburring-required-edit" v-model="editFormData.deburringrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>



          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class="sm:mr-2" aria-label="Default select example"
              :disabled="isJobStatusDisabled">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>Pending</option>
            </FormSelect>
          </div>

          <!-- Sub Job Details -->
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
  <h6 class="mb-2 text-lg font-medium leading-none">Sub Job Details</h6>
  <hr>
  <div v-for="(subJobDetail, subJobIndex) in editFormData.subJobDetails" :key="subJobIndex">
    <div>
      <div class="lg:flex lg:space-x-5 lg:w-full">
        <div class="mt-5 lg:flex-1">
          <FormLabel class="block mb-2">Sub Job ID</FormLabel>
          <FormInput v-model="subJobDetail.subJobId" type="text" disabled />
        </div>

        <div class="mt-5 lg:flex-1">
          <FormLabel htmlFor="regular-form-5">Machine ID</FormLabel>
          <div class="relative">
            <div @click="!isDisabled(subJobDetail) && toggleMachineIdDropdown(subJobIndex)"
              :class="['cursor-pointer p-2 border rounded', { 'cursor-not-allowed opacity-50': isDisabled(subJobDetail) }]">
              {{ subJobDetail.machineId || 'Select a Machine ID ' }}
            </div>

            <div v-if="isMachineIdDropdownOpen[subJobIndex]" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
              <input type="text" v-model="searchMachineIdQuery[subJobIndex]" placeholder="Search Machine ID"
                class="border-b border-gray-300 p-2 w-full" />
              <ul class="max-h-40 overflow-y-auto">
                <li v-for="machineId in filteredMachineIds(subJobIndex)" :key="machineId"
                  @click="selectMachineId(subJobIndex, machineId)" class="cursor-pointer p-2 hover:bg-gray-100">
                  {{ machineId }}
                </li>
                <li v-if="filteredMachineIds(subJobIndex).length === 0" class="p-2 text-gray-500">No results found</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-5 lg:flex-1">
          <FormLabel htmlFor="regular-form-1">Status</FormLabel>
          <FormSelect v-model="subJobDetail.status" class="sm:mr-2" aria-label="Default select example" disabled>
            <option disabled value="">Select a Job Status Option</option>
            <option>Completed</option>
            <option>Submitted</option>
            <option>Success</option>
            <option>Pending</option>
          </FormSelect>
        </div>

        <div class="mt-5 lg:flex-1">
          <Button type="button" @click="submitJobDetails(subJobDetail)" variant="primary" class="w-[100%] mr-2 lg:mt-6 shadow-md"
            :disabled="subJobDetail.status === 'Submitted' || subJobDetail.status === 'Completed' || !subJobDetail.machineId">
            Submit
          </Button>
        </div>
      </div>
    </div>

    <!-- Recipe Table -->
    <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Recipes</h6>
    <hr />
    <div class="mb-8 mt-5">
      <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
        <thead class="bg-primary text-white">
          <tr>
            <th class="py-2 px-4 border-b text-center">No.</th>
            <th class="py-2 px-4 border-b text-center">Part Number</th>
            <th class="py-2 px-4 border-b text-center">Percentage</th>
            <th class="py-2 px-4 border-b text-center">Weight</th>
          </tr>
        </thead>
        <tbody>
          <!-- List recipes -->
          <tr v-for="(recipe, recipeIndex) in subJobDetail.recipe" :key="recipeIndex">
            <td class="py-2 px-4 border-b text-center">{{ recipeIndex + 1 }}</td>
            <td class="py-2 px-4 border-b text-center">{{ recipe.productCode }}</td>
            <td class="py-2 px-4 border-b text-center">{{ recipe.percentage }}</td>
            <td class="py-2 px-4 border-b text-center">{{ recipe.weight }}</td>
          </tr>
          <!-- Total row -->
          <tr class="bg-emerald-800 text-white">
            <td colspan="2" class="py-2 px-4 border-t text-center font-semibold">Total</td>
            <td class="py-2 px-4 border-t text-center font-semibold">
              {{ calculateTotal(subJobDetail.recipe, 'percentage') }}
            </td>
            <td class="py-2 px-4 border-t text-center font-semibold">
              {{ calculateTotal(subJobDetail.recipe, 'weight') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <hr class="mt-10 border-t-2 border-gray">
  </div>
</div>



          <!-- WH Powder List Section -->
          <div class="mt-8">
            <div class="flex items-center justify-between mb-2">
              <h6 class="text-lg font-medium leading-none">Warehouse Powder List</h6>

              <!-- Button container aligned to the right -->
              <div class="flex space-x-2">
                <button type="button" @click="addPowder" class="bg-blue-600 text-white px-4 py-2 rounded">
                  Add
                </button>
                <button @click="submitWarehouseRequest" type="button" class="px-4 py-2 rounded text-white" :class="{
                  'bg-green-600 hover:bg-green-700': editFormData.whpowderList.length > 0,  // Active state
                  'bg-gray-400 cursor-not-allowed': editFormData.whpowderList.length === 0  // Disabled state
                }" :disabled="editFormData.whpowderList.length === 0">
                  Submit
                </button>


              </div>
            </div>
            <hr>

            <!-- Add Button -->


            <div class="mt-4" v-if="editFormData.whpowderList.length > 0">
              <table class="mt-5 min-w-full border-collapse rounded-lg shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center rounded-tl-lg">No.</th>
                    <th class="py-2 px-4 border-b text-center">Powder Code</th>
                    <th class="py-2 px-4 border-b text-center">Requested Weight</th>
                    <th class="py-2 px-4 border-b text-center">Approved Weight</th>
                    <th class="py-2 px-4 border-b text-center">Status</th>
                    <th class="py-2 px-4 border-b text-center">Received</th>
                    <th class="py-2 px-4 border-b text-center rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(powder, index) in editFormData.whpowderList" :key="index">
                    <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>

                    <!-- Custom Powder Code Dropdown with Disabled Binding -->
                    <td class="py-2 px-10 border-b text-center">
                      <div class="relative">
                        <div @click="!powder.isApproved && togglePowderCodeDropdown(index)"
                          :class="['cursor-pointer p-2 border rounded', { 'cursor-not-allowed opacity-50': powder.isApproved }]"
                          :disabled="powder.isApproved">
                          {{ powder.powderCode || 'Select a Powder Code' }}
                        </div>
                        <div v-if="isPowderCodeDropdownOpen[index]"
                          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                          <!-- Searchable input inside the dropdown -->
                          <input type="text" v-model="searchPowderCodeQuery[index]" placeholder="Search Powder Code"
                            class="border-b border-gray-300 p-2 w-full" />
                          <!-- Filtered options -->
                          <ul class="max-h-40 overflow-y-auto">
                            <li v-for="whcode in filteredPowderCodes(index)" :key="whcode"
                              @click="selectPowderCode(index, whcode)" class="cursor-pointer p-2 hover:bg-gray-100">
                              {{ whcode }}
                            </li>
                            <li v-if="filteredPowderCodes(index).length === 0" class="p-2 text-gray-500">No results
                              found</li>
                          </ul>
                        </div>
                      </div>
                    </td>

                    <!-- Requested Weight Input with Disabled Binding -->
                    <td class="py-2 px-4 border-b text-center">
                      <FormInput v-model="powder.requestedWeight" type="text" class="form-input border rounded w-full"
                        placeholder="Enter Requested Weight" :disabled="powder.isApproved"
                        :class="{ 'border-red-500': (powder.requestedWeight.toString().split('.')[1]?.length > 4) }" />
                      <!-- Validation Error Message -->
                      <span v-if="powder.requestedWeight.toString().split('.')[1]?.length > 4" class="text-red-500">
                        Requested Weight must have at most 4 decimal places!
                      </span>
                    </td>

                    <!-- Approved Weight -->
                    <td class="py-2 px-4 border-b text-center">{{ powder.approvedWeight }}</td>

                    <!-- Status -->
                    <td class="py-3 px-3 text-center hidden">
                      <span
                        :class="powder.isApproved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
                        {{ powder.isApproved ? 'Approved' : 'Pending' }}
                      </span>
                    </td>

                    <!-- Received Status -->
                    <td class="py-3 px-3 border-b text-center">
                      <span
                        :class="powder.isRecieved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
                        {{ powder.isRecieved ? 'Received' : 'Pending' }}
                      </span>
                    </td>

                    <!-- Mark as Received Button -->
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="markAsReceived(index)" type="button"
                        :disabled="powder.isRecieved || !powder.isApproved"
                        class="focus:outline-none inline-flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium transition duration-150 ease-in-out"
                        :class="(powder.isRecieved || !powder.isApproved) ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'">
                        Received
                      </button>
                    </td>

                    <!-- Remove Button -->
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="removePowder(index)" type="button"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>


            <!-- Submit Warehouse Request Button -->

          </div>

          <!-- Product Subt Codes of Recipe -->
          <div v-if="editFormData.productSubCodesofRecipe.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Product Sub Codes of Recipe</h6>
            <hr>
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-3">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center">No.</th>
                  <th class="py-2 px-4 border-b text-center">Job ID</th>
                  <th class="py-2 px-4 border-b text-center">Part Number</th>
                  <th class="py-2 px-4 border-b text-center">Percentage</th>
                  <th class="py-2 px-4 border-b text-center">Weight</th>
                  <th class="py-2 px-4 border-b text-center">Status</th>
                  <!-- <th class="py-2 px-4 border-b text-center">Actions</th> -->
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    {{ row.jobId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center hidden">
                    {{ row.productRecipeMappingId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center hidden">
                    {{ row.subJobId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    {{ row.productCode }}
                  </td>
                  <td class="py-2 px-4 border-b small-width text-center">
                    {{ row.percentage }}
                  </td>
                  <td class="py-2 px-4 border-b small-width text-center">
                    {{ row.weight.toFixed(4) }}
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    {{ row.status }}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>

          <!-- Show the filtered list of bins below the Job Status input -->
          <div v-if="editFormData.binData && editFormData.binData.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List of Bins</h6>
            <hr />

            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">No.</th>
                  <th class="py-2 px-4 border-b text-center">Bin Name</th> <!-- Add Bin Name Column -->
                  <th class="py-2 px-4 border-b text-center">Sub Job ID</th>
                  <th class="py-2 px-4 border-b text-center">Job ID</th>
                  <th class="py-2 px-4 border-b text-center">Weight</th>
                  <th class="py-2 px-4 border-b text-center">Action</th> <!-- New Action Column -->
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bin, index) in editFormData.binData" :key="bin.id" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ bin.binName }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ bin.subJobId }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ bin.mappingId }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ bin.weight }}</td>
                  <td class="py-2 px-4 border-b text-center">
                    <button
                      class="bg-blue-700 text-white px-2 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-500 whitespace-nowrap"
                      @click="releaseBin(bin.id)">
                      <i class="fa-solid fa-arrow-right-from-bracket pr-2"></i>Release
                    </button>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>




          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md" :disabled="isJobStatusDisabled">
            Submit
          </Button>
        </form>
      </Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
          setEditSlideOver(false);
        }" class="w-20 mr-1">
          Cancel
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>


  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Blending
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div ref="toPrint">
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">

            <div>
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
                      Part Number
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Time Taken for Blending per KG
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.totalTimeTaken }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.weight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Processed Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewProcessedWeight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Waste
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewWaste }}
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
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.status }}
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>


          </div>

          <!-- <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.listBinsforBlend.length > 0">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    List Bins
                  </th>
                </tr>
                <tr>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    No.
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Bin Master ID
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Weight
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Min Capacity
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Max Capacity
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Movement
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Reassign Bin ID
                  </th>

                </tr>
                <tr v-for="(row, index) in viewData.listBinsforBlend" :key="index"
                  class="hover:bg-gray-100 hover:dark:bg-gray-700">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.binMasterId }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.weight }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.capacityMin }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.capacityMax }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.movement }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.reassignBinId }}
                  </td>

                </tr>

              </tbody>
            </table>
          </div> -->
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
  <h6 class="mb-2 text-lg font-medium leading-none">Sub Job Details</h6>
  <hr>
  <div v-for="(subJobDetail, subJobIndex) in viewData.subJobDetails" :key="subJobIndex">
    <!-- Sub Job Details Table -->
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead class="bg-primary dark:bg-gray-800 text-white">
          <tr>
            <th scope="col" class="py-2 px-4 border-b text-center">Sub Job ID</th>
            <th scope="col" class="py-2 px-4 border-b text-center">Machine ID</th>
            <th scope="col" class="py-2 px-4 border-b text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover:bg-gray-100 dark:hover:bg-gray-100">
            <td class="py-2 px-4 border-b text-center">{{ subJobDetail.subJobId }}</td>
            <td class="py-2 px-4 border-b text-center">{{ subJobDetail.machineId || 'No Machine ID' }}</td>
            <td class="py-2 px-4 border-b text-center">{{ subJobDetail.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Recipe Table (View Mode) -->
    <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Recipes</h6>
    <hr>
    <div v-if="subJobDetail.recipe.length > 0">
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
          <thead class="bg-primary dark:bg-gray-800 text-white">
            <tr>
              <th scope="col" class="py-2 px-4 border-b text-center">No.</th>
              <th scope="col" class="py-2 px-4 border-b text-center">Part Number</th>
              <th scope="col" class="py-2 px-4 border-b text-center">Percentage</th>
              <th scope="col" class="py-2 px-4 border-b text-center">Weight</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(recipe, index) in subJobDetail.recipe" :key="index" class="hover:bg-gray-100 dark:hover:bg-gray-100">
              <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>
              <td class="py-2 px-4 border-b text-center">{{ recipe.productCode }}</td>
              <td class="py-2 px-4 border-b text-center">{{ recipe.percentage }}</td>
              <td class="py-2 px-4 border-b text-center">{{ recipe.weight }}</td>
            </tr>
            <!-- Total row -->
          <tr class="bg-emerald-800 text-white">
            <td colspan="2" class="py-2 px-4 border-t text-center font-semibold">Total</td>
            <td class="py-2 px-4 border-t text-center font-semibold">
              {{ calculateTotal(subJobDetail.recipe, 'percentage') }}
            </td>
            <td class="py-2 px-4 border-t text-center font-semibold">
              {{ calculateTotal(subJobDetail.recipe, 'weight') }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <hr class="mt-10 border-t-2 border-gray">
  </div>
</div>

<div class="mt-4" v-if="viewData.whpowderList.length > 0">
  <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Warehouse Powder List</h6>
  <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <thead class="bg-primary text-white">
        <tr>
          <th class="py-2 px-4 border-b text-center rounded-tl-lg">No.</th>
          <th class="py-2 px-4 border-b text-center">Powder Code</th>
          <th class="py-2 px-4 border-b text-center">Requested Weight</th>
          <th class="py-2 px-4 border-b text-center">Approved Weight</th>
          <th class="py-2 px-4 border-b text-center">Status</th>
          <th class="py-2 px-4 border-b text-center rounded-tr-lg">Received</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(powder, index) in viewData.whpowderList" :key="index" class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>

          <!-- Powder Code (Read-Only) -->
          <td class="py-2 px-4 border-b text-center">{{ powder.powderCode || 'No Powder Code' }}</td>

          <!-- Requested Weight (Read-Only) -->
          <td class="py-2 px-4 border-b text-center">{{ powder.requestedWeight }}</td>

          <!-- Approved Weight (Read-Only) -->
          <td class="py-2 px-4 border-b text-center">{{ powder.approvedWeight }}</td>

          <!-- Status (Read-Only) -->
          <td class="py-2 px-4 border-b text-center">
            <span
              :class="powder.isApproved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
              {{ powder.isApproved ? 'Approved' : 'Pending' }}
            </span>
          </td>

          <!-- Received Status (Read-Only) -->
          <td class="py-2 px-4 border-b text-center">
            <span
              :class="powder.isRecieved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
              {{ powder.isRecieved ? 'Received' : 'Pending' }}
            </span>
          </td>


        </tr>
      </tbody>
    </table>
  </div>
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
                    No
                  </th>
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
                <tr v-for="(row, index) in viewData.productSubCodesofRecipe" :key="index"
                  class="hover:bg-gray-100 hover:dark:bg-gray-700">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ index + 1 }}
                  </td>
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
            v-if="editFormData.binData && editFormData.binData.length > 0">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800 text-white">
                <tr>
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    List of Bins
                  </th>
                </tr>
                <tr>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    No.
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Bin Name
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Sub Job ID
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Job ID
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody class="w-full">
                <tr v-for="(bin, index) in editFormData.binData" :key="bin.id"
                  class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ bin.binName }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ bin.subJobId }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ bin.mappingId }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ bin.weight }}
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
  </Dialog>
  <!-- END: Modal Content -->

</template>

<style>
.rounded-tl-lg {
  border-top-left-radius: 0.5rem;
  /* Adjust the size as needed */
}

.rounded-tr-lg {
  border-top-right-radius: 0.5rem;
  /* Adjust the size as needed */
}
</style>