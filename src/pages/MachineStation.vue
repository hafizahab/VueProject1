<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, toRefs, watchEffect, nextTick, Ref } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import LoadingIcon from "../base-components/LoadingIcon";

interface UserAccess {
  userId: string;
  machineStation_Production?: string[];
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
  machineCode?: string;
  productCode?: string;
  totalWeight?: any;
  waste?: any;
  wettreatmentrequired?: any;
  blowrequired?: any;
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
          title: "PART NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "productCode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.productCode}</div>
    </div>`;
          },
        },
        //     {
        //       title: "MACHINE CODE",
        //       minWidth: 150,
        //       responsive: 0,
        //       field: "machineCode",
        //       vertAlign: "middle",
        //       print: false,
        //       download: false,
        //       formatter(cell) {
        //         const response: Response = cell.getData();
        //         return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.machineCode}</div>
        // </div>`;
        //       },
        //     },


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
                  // Conditionally render the "Edit" link if permission exists and jobStatus is not "Completed"
                  if (
                    userAccess.machineStation_Production &&
                    userAccess.machineStation_Production.includes("Edit") &&
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

const productCode = () => {
  if (tabulator.value && filter.productCode) {
    console.log("Applying filter for productCode:", filter.productCode);
    tabulator.value.setFilter((data) => {
      const searchValue = filter.productCode.toLowerCase();
      const columnValue = data.productCode ? data.productCode.toLowerCase() : '';
      return columnValue.includes(searchValue);
    });
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

const loading = ref<boolean>(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/MachineStation/';

onMounted(() => {
  loading.value = true; // Show loading animation

  // Define an array of promises for each data-fetching function
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data by "Pending" jobs first, then by jobId ascending
      const sortedData = filteredData.sort((a: any, b: any) => {
        const aJobStatus = a.jobStatus.toUpperCase();
        const bJobStatus = b.jobStatus.toUpperCase();

        if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
        if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

        const jobIdA = parseInt(a.jobId.substring(1), 10);
        const jobIdB = parseInt(b.jobId.substring(1), 10);
        return jobIdA - jobIdB;
      });

      console.log('Sorted Data:', sortedData);

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    }),

    // Additional asynchronous initializations
    fetchNamesShift(),
    fetchMachineId(),
    fetchWeight(editFormData.jobId),
    fetchMovement(),
    fetchProductCodes(),
    fetchMachinePP(),
    fetchMachineBlow(),
    fetchWM()
  ];

  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading animation once all tasks are completed
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
  shift: '',
  machineCode: '',
  totalTimeTaken: '',
  machineweight: 0,
  pendingToBeProcessedWeight: 0,
  pendingToBeAssignedWeight: 0,
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  productCode: '',
  totalWeight: 0,
  waste: 0,
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  processedWeight: 0,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  jobStatus: '',
  times: [] as string[],
  shifts: [] as string[],
  machineCodes: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  binData: [] as any[],
  binDataB: [] as any[],
  productSubCodesofRecipe: [] as Array<{ jobId: string; productCode: string; percentage: ''; weight: number; status: string }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; type: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; type: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,

  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      binMasterId: string;
      weight: number;
      reassignBinId: string;
      movement: string;
      capacityMin: number;
      capacityMax: number;
    }>
  },
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
  machineJobRows: [] as Array<{
    jobId: string;
    subJobId: string;
    binName: string;
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

  // New properties as objects instead of arrays
  wetTreatmentList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    blowrequired: false,
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  plasmaTreatmentList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    blowrequired: false,
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  dedustingList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  deburringList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  }
});

// Form Data
const editFormData = reactive({
  id: null,
  jobId: '',
  shift: '',
  machineCode: '',
  totalTimeTaken: '',
  machineweight: 0,
  pendingToBeProcessedWeight: 0,
  pendingToBeAssignedWeight: 0,
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  productCode: '',
  totalWeight: 0,
  waste: 0,
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  processedWeight: 0,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  jobStatus: '',
  times: [] as string[],
  shifts: [] as string[],
  machineCodes: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  binData: [] as any[],
  binDataB: [] as any[],
  productSubCodesofRecipe: [] as Array<{ jobId: string; productCode: string; percentage: ''; weight: number; status: string }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; type: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; type: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,

  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      binMasterId: string;
      weight: number;
      reassignBinId: string;
      movement: string;
      capacityMin: number;
      capacityMax: number;
    }>
  },
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
  machineJobRows: [] as Array<{
    jobId: string;
    subJobId: string;
    binName: string;
    productCode: string;
    machineCode: string;
    binCode: string;
    shift: string;
    minCapacity: number;
    maxCapacity: number;
    weight: number;
    avgTimeTaken: string;
    status: string;
    selectedBinIndex?: number | null;
  }>,

  // New properties as objects instead of arrays
  wetTreatmentList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    blowrequired: false,
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  plasmaTreatmentList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    blowrequired: false,
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  dedustingList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  },
  deburringList: {
    whiteSlipId: '',
    shift: '',
    machineCode: '',
    weight: 0,
    processedWeight: 0,
    waste: 0,
    totalTimeTaken: '',
  }
});



// Dropdown control for each Machine Code and Bin Code in machineJobRows
const isMachineCodeDropdownOpen: Ref<boolean[]> = ref([]);
const searchMachineCodeQuery: Ref<string[]> = ref([]);
// Dropdown control for each Machine Code and Bin Code in machineJobRows
const isBinCodeDropdownOpen: Ref<boolean[]> = ref([]);
const searchBinCodeQuery: Ref<string[]> = ref([]);

// Computed properties to filter machine codes and bin codes based on search query
const filteredMachineCodes = (rowIndex: number) => {
  if (!searchMachineCodeQuery.value[rowIndex]) {
    return editFormData.machineCodes;
  }
  return editFormData.machineCodes.filter((code: string) =>
    code.toLowerCase().includes(searchMachineCodeQuery.value[rowIndex].toLowerCase())
  );
};



// Functions to toggle dropdown open/close for Machine Code and Bin Code
const toggleMachineCodeDropdown = (rowIndex: number) => {
  if (!editFormData.machineJobRows[rowIndex].status.includes('Completed') && !editFormData.machineJobRows[rowIndex].status.includes('Submitted')) {
    isMachineCodeDropdownOpen.value[rowIndex] = !isMachineCodeDropdownOpen.value[rowIndex];
    searchMachineCodeQuery.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to reset all dropdowns
const resetBinCodeDropdowns = () => {
  isBinCodeDropdownOpen.value = isBinCodeDropdownOpen.value.map(() => false);
};


// Function to toggle the Bin Code dropdown for a specific row
const toggleBinCodeDropdown = (rowIndex: number) => {
  const row = editFormData.machineJobRows[rowIndex];

  if (!row.status.includes('Completed') && !row.status.includes('Submitted')) {
    // Check if the dropdown is already open
    if (isBinCodeDropdownOpen.value[rowIndex]) {
      // If open, close it
      isBinCodeDropdownOpen.value[rowIndex] = false;
    } else {
      // If closed, open it and reset other dropdowns
      resetBinCodeDropdowns(); // Close all dropdowns
      isBinCodeDropdownOpen.value[rowIndex] = true; // Open dropdown for the selected row
      searchBinCodeQuery.value[rowIndex] = ''; // Clear search query when dropdown is opened
    }
  }
};
// Function to select a Machine Code or Bin Code
const selectMachineCode = (rowIndex: number, machineCode: string) => {
  editFormData.machineJobRows[rowIndex].machineCode = machineCode;
  isMachineCodeDropdownOpen.value[rowIndex] = false; // Close dropdown after selection
};

// Function to select a Bin Code and store both binCode (ID) and binName
const selectBinCode = (rowIndex: number, bin: any) => {
  const row = editFormData.machineJobRows[rowIndex];
  row.binCode = bin.binMasterId as string; // Type assertion to bypass the error
  row.binName = bin.binName;
  resetBinCodeDropdowns();
};

// Define permission variable for machineStation_Production
let canEditMachineStationProduction = false;

// Define the fetchUserMachineStationProductionPermissions function
const fetchUserMachineStationProductionPermissions = async () => {
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

      const machineStationProduction = userDetails.machineStation_Production || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for machineStation_Production
      canEditMachineStationProduction = machineStationProduction.includes('Edit');

      console.log('canEditMachineStationProduction:', canEditMachineStationProduction); // Debugging log
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

// Call the fetchUserMachineStationProductionPermissions function to get permissions
fetchUserMachineStationProductionPermissions();

const fetchWM = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type.toLowerCase() === 'weighing machine' &&
          item.location.toLowerCase() === 'machine station'
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


// Define a reactive property to keep track of the selected bin index
const selectedBinIndex = ref<number | null>(null);  // Track the selected bin index

// Function to toggle bin selection for a specific row
const toggleBinSelection = (rowIndex: number) => {
  const row = editFormData.machineJobRows[rowIndex];

  if (row.selectedBinIndex !== undefined && row.selectedBinIndex === rowIndex) {
    row.selectedBinIndex = null; // Unselect if already selected
    resetBinCodeDropdowns(); // Close all dropdowns
  } else {
    row.selectedBinIndex = rowIndex; // Select the bin
    toggleBinCodeDropdown(rowIndex); // Open the bin code dropdown
    focusBinCodeSelect(rowIndex);    // Focus the bin select element
  }
};

// Function to focus the <select> element for the row
const focusBinCodeSelect = async (rowIndex: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelect-${rowIndex}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select element
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};

// Computed property to calculate the pending to be processed weight (status = 'Submitted')
const pendingToBeProcessedWeight = computed(() => {
  return editFormData.machineJobRows
    .filter(row => row.status === 'Submitted')
    .reduce((total, row) => total + (row.weight || 0), 0);
});

// Computed property to calculate the pending to be assigned weight
const pendingToBeAssignedWeight = computed(() => {
  const totalWeightFromPlanning = editFormData.totalWeight || 0; // Assuming totalWeight is from planning
  const assignedWeight = editFormData.machineJobRows
    .reduce((total, row) => total + (row.weight || 0), 0); // Sum of all weights in the sub job list
  return totalWeightFromPlanning - assignedWeight;
});

// Watch the computed properties and assign their values to editFormData
watchEffect(() => {
  // Remove the processedWeight assignment here
  editFormData.pendingToBeProcessedWeight = pendingToBeProcessedWeight.value;
  editFormData.pendingToBeAssignedWeight = pendingToBeAssignedWeight.value;
});



const fetchBinId = async (jobId: string, isView: boolean = false) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const nameData = response.data.result;

    if (Array.isArray(nameData)) {
      // Filter bins by jobId and ensure weight > 0
      const filteredBins = nameData.filter(item =>
        item.mappingId === jobId &&
        item.weight > 0 &&
        item.status.toLowerCase() !== 'inactive' &&
        item.type.toLowerCase()  === 'Blending'
      );

      // Log the filtered response
      console.log('Filtered Bins:', filteredBins);

      // Update the correct data object based on isView flag
      if (isView) {
        viewData.bins = filteredBins.map(item => item.id);
        viewData.binData = filteredBins;
      } else {
        editFormData.bins = filteredBins.map(item => item.id);
        editFormData.binData = filteredBins;
      }
    } else {
      console.error('Invalid response format for name:', nameData);
    }
  } catch (error) {
    console.error('Error fetching bins by jobId:', error);
  }
};





// Method to find bin details by id
const getBinDetails = (binMasterId: any) => {
  const bin = editFormData.binData.find(bin => bin.id === binMasterId);
  return bin || {};
};


const getBinDetailsMachine = (binCode: string) => {
  // Assuming editFormData.binData contains the enriched bin details
  const binDetails = editFormData.binData.find(bin => bin.id === binCode);
  return binDetails;
};



const updateCapacityValuesMachine = (binCode: any, row: any) => {
  const binDetails = getBinDetailsMachine(binCode);
  if (binDetails) {
    row.minCapacity = binDetails.capacityMin || 0;
    row.maxCapacity = binDetails.capacityMax || 0;
    row.weight = binDetails.weight || 0; // Populate weight as well
  } else {
    row.minCapacity = 0;
    row.maxCapacity = 0;
    row.weight = 0;
  }
};



const fetchWeight = async (jobId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch Blending API data
    const blendingResponse = await axios.get('http://10.87.0.33:8085/api/Blending');
    const blendingData = blendingResponse.data.result;

    // Find the blending job by jobId
    const blendingJob = blendingData.find((job: any) => job.jobId === jobId);

    if (!blendingJob || !Array.isArray(binsData)) {
      console.error('Unexpected response format from API');
      return;
    }

    // Extract subJobDetails
    const subJobDetails = blendingJob.subJobDetails;

    // Check if exactly one subJobDetail has the status "Submitted"
    const submittedSubJobs = subJobDetails.filter((subJob: any) => subJob.status.toLowerCase() === 'submitted');

    let filteredBins = [];

    // Fetch all bins matching the jobId and conditions if no filtering by "Completed" is needed
    filteredBins = binsData.filter(
      bin => bin.mappingId === jobId && bin.weight > 0 && bin.type.toLowerCase() === 'blending'
    );

    // If exactly one subJobDetail is submitted, narrow down bins matching the subJobId
    if (submittedSubJobs.length === 1) {
      const submittedSubJobId = submittedSubJobs[0].subJobId;
      filteredBins = filteredBins.filter(
        bin => bin.subJobId === submittedSubJobId
      );
    }

    // Calculate the total weight by summing the weights of the filtered bins
    const totalWeight = filteredBins.reduce((sum, bin) => sum + bin.weight, 0);

    // Set the weight in editFormData and viewData
    editFormData.totalWeight = totalWeight;
    viewData.totalWeight = totalWeight;

    console.log(`Total weight calculated: ${totalWeight}`);
  } catch (error) {
    console.error('Error fetching weight data:', error);
  }
};





watch(() => editFormData.jobId, (newJobId) => {
  if (newJobId) {
    fetchWeight(editFormData.jobId);
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
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'production' || item.type.toLowerCase() === 'machine station')
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
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'production' || item.type.toLowerCase() === 'machine station')
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
  () => editFormData.machineJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.machineJobRows.forEach((row, index) => {
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

// Function to filter bin codes for a specific row based on search query
const filteredBinOptionsForRow = (currentIndex: number) => {
  // Collect all selected bin IDs from machineJobRows, excluding the current row
  const selectedBins = editFormData.machineJobRows
    .filter((row, index) => index !== currentIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin codes
    .filter(Boolean); // Remove null or undefined values

  // Filter out bins that are already selected in other rows
  let availableBins = editFormData.binData.filter(bin => !selectedBins.includes(bin.binMasterId));

  // If there's a search query, further filter the available bins based on the query
  if (searchBinCodeQuery.value[currentIndex]) {
    availableBins = availableBins.filter(bin =>
      bin.binName.toLowerCase().includes(searchBinCodeQuery.value[currentIndex].toLowerCase())
    );
  }

  return availableBins;
};


// Method to fetch both ListBins and BinMaster data
const fetchBinsAndBinMaster = async (jobId : string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    // Filter bins based on conditions
    const filteredBins = binsData.filter(
      (bin : any) => bin.mappingId === jobId && bin.weight > 0 && bin.type.toLowerCase() === 'blending'
    );

    console.log('Filtered Bins:', filteredBins);

    // Enrich filtered bins with bin names from BinMaster
    const enrichedBins = filteredBins.map((bin : any) => {
      const matchedBinMaster = binMasterData.find((bm : any) => bm.id === bin.binMasterId);
      if (!matchedBinMaster) {
        console.warn(`No matching BinMaster found for binMasterId: ${bin.binMasterId}`);
      }
      return {
        ...bin,
        binName: matchedBinMaster ? matchedBinMaster.name : 'No Bin',
      };
    });

    console.log('Enriched Bins:', enrichedBins);

    // Update the form data
    editFormData.binData = enrichedBins;

    if (enrichedBins.length === 0) {
      console.warn('No enriched bins were found or matched.');
    }
  } catch (error) {
    console.error('Error in fetchBinsAndBinMaster:', error);
  }
};



const fetchBinsAndBinMasterProd = async (jobId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    if (Array.isArray(binsData) && Array.isArray(binMasterData)) {
      // Filter bins by jobId, weight > 0, and type is 'Production' or 'Machine Station'
      const filteredBins = binsData.filter(
        bin => bin.mappingId === jobId && bin.weight > 0 && (bin.type === 'Production' || bin.type === 'Machine Station')
      );

      // Add bin names from BinMaster data by matching `binMasterId` with `BinMaster`'s `id`
      const enrichedBins = filteredBins.map(bin => {
  const matchedBinMaster = binMasterData.find(bm => bm.id === bin.binMasterId);

  let qcPass = 'Pending'; // Default to 'Pending'

  // If Dimension Check (DC) or Functional Check (FC) is "Reject", QC Pass should be "Fail"
  if (bin.dimensionCheck_IPQC === 'Reject' || bin.functionalCheck_IPQC === 'Reject') {
    qcPass = 'Fail';
  }
  // If Dimension Check or Functional Check is empty, QC Pass should be "Pending"
  else if (!bin.dimensionCheck_IPQC || !bin.functionalCheck_IPQC) {
    qcPass = 'Pending';
  }
  // Else, evaluate Visual Checks
  else {
    const vc1 = bin.visualCheck1_IPQC;
    const vc2 = bin.visualCheck2_IPQC;
    const vc3 = bin.visualCheck3_IPQC;

    if (!vc1 && !vc2 && !vc3) {
      // If VC1, VC2, VC3 are all empty = Pending
      qcPass = 'Pending';
    } else if (vc3 === 'Approve') {
      // If VC3 is Approved = Pass
      qcPass = 'Pass';
    } else if (vc3 === 'Reject') {
      // If VC3 is Rejected = Fail
      qcPass = 'Fail';
    } else if (vc2 === 'Approve') {
      // If VC2 is Approved = Pass
      qcPass = 'Pass';
    } else if (vc2 === 'Reject') {
      // If VC2 is Rejected = Fail
      qcPass = 'Fail';
    } else if (vc1 === 'Approve') {
      // If VC1 is Approved = Pass
      qcPass = 'Pass';
    } else if (vc1 === 'Reject') {
      // If VC1 is Rejected = Fail
      qcPass = 'Fail';
    } else {
      // If none of the above, default to Pending
      qcPass = 'Pending';
    }
  }

  return {
    ...bin,
    binName: matchedBinMaster ? matchedBinMaster.name : 'No Bin', // Add the bin name
    qcPass // Add QC Pass field
  };
});


      // Update the form data
      editFormData.bins = enrichedBins.map(bin => bin.id);
      editFormData.binDataB = enrichedBins;
    } else {
      console.error('Unexpected response format from API');
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
      text: 'This will update the bin!',
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
      await fetchBinsAndBinMasterProd(editFormData.jobId);
    } else {
      console.log('Release action cancelled.');
    }
  } catch (error) {
    console.error("Error releasing bin:", error);
    Swal.fire('Failed!', 'There was an error releasing the bin. Please try again.', 'error');
  }
};


// Watch for changes in jobId and fetch bins and bin master data accordingly
watch(() => editFormData.jobId, (newJobId) => {
  if (newJobId) {
    fetchBinsAndBinMaster(newJobId);
    fetchBinsAndBinMasterProd(newJobId);
  }
});




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


const fetchAndSetMachineJobs = async (jobId: string, isViewMode = false) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  loading.value = true; // Show loading animation
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/MachineJobs');
    const machineJobsData = response.data.result || [];
    console.log('Fetched Machine Jobs Data:', machineJobsData);

    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
    console.log('Filtered Machine Jobs based on Job ID:', filteredMachineJobs);

    // Ensure bin data is loaded if not available
    const targetData = isViewMode ? viewData : editFormData;
    if (!targetData.binData || targetData.binData.length === 0) {
      await fetchBinsAndBinMaster(jobId);
    }

    // Map the machine job rows and update the appropriate data object
    targetData.machineJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = targetData.binData.find(bin => bin.binMasterId === job.binCode);
if (!matchedBin) {
  console.warn(`No bin found for binCode: ${job.binCode} in binData`);
}



      return {
        jobId: job.jobId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released',
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      };
    });

    console.log('Updated Machine Job Rows in Form Data with Bin Names:', targetData.machineJobRows);

    if (targetData.machineJobRows.length === 0) {
      console.warn('No machine jobs found for the specified Job ID:', jobId);
    }
  } catch (error) {
    console.error('Error fetching machine jobs:', error);
  } finally {
    loading.value = false; // Hide loading animation
  }
};




const fetchAndFilterBins = (jobId: string) => {
  axios.get('http://10.87.0.33:8082/api/ListBins')
    .then(response => {
      const binsData = response.data.result || [];
      console.log('Fetched Bins Data:', binsData);

      // Filter bins based on the provided conditions
      const filteredBins = binsData.filter((bin: any) =>
        bin.weight > 0 &&
        bin.type === 'Blending' &&
        bin.mappingId === jobId
      );

      console.log('Filtered Bins:', filteredBins);

      // Assign the filtered bins to the editFormData.bins
      editFormData.bins = filteredBins;
    })
    .catch(error => {
      console.error('Error fetching bins:', error);
    });
};


// Fetch and Set Data for Edit/View
const fetchAndSetData = async (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  loading.value = true; // Show loading animation

  try {
    const response = await axios.get(`${API_BASE_URL}${id}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      const [firstItem] = data;
      const filteredBins = firstItem.listBins ? firstItem.listBins.filter((bin: any) => bin.status !== 'deleted') : [];

      // Update the formData (editFormData) for both view and edit mode
      Object.assign(formData, {
        id: firstItem.id,
        jobId: firstItem.jobId,
        shift: firstItem.shift,
        machineCode: firstItem.machineCode,
        productCode: firstItem.productCode,
        totalTimeTaken: firstItem.totalTimeTaken || '00:00:00',
        waste: firstItem.waste,
        processedWeight: firstItem.processedWeight,
        collected: firstItem.collected,
        wettreatmentrequired: firstItem.wettreatmentrequired,
        plasmatreatmentrequired: firstItem.plasmatreatmentrequired,
        dustingrequired: firstItem.dustingrequired,
        deburringrequired: firstItem.deburringrequired,
        jobStatus: firstItem.jobStatus,
        listBinsList: firstItem.listBinsList || [],
        listBins: filteredBins,
        listMachines: firstItem.listMachines || [],
        totalWeight: firstItem.totalWeight || 0,
      });

      // Fetch related bins and machine jobs using jobId
      await fetchBinsAndBinMaster(firstItem.jobId);

      // Fetch machine jobs if needed
      await fetchAndSetMachineJobs(firstItem.jobId);

      // Initialize dropdown controls
      const targetMachineJobRows = isView ? viewData.machineJobRows : editFormData.machineJobRows;
      isBinCodeDropdownOpen.value = new Array(targetMachineJobRows.length).fill(false);
      searchBinCodeQuery.value = new Array(targetMachineJobRows.length).fill("");

      // Show modal after data is set
      modalSetter(true);
    } else {
      console.error('No data found for the specified ID:', id);
    }
  } catch (error) {
    console.error('Error fetching data for editing:', error);
  } finally {
    loading.value = false; // Hide loading animation
  }
};






const editRole = (machineId: string) => {
  resetEditFormData(); // Reset the form before fetching new data
  fetchAndSetData(machineId, editFormData, seteditModal);
};

const viewRole = (id: string) => {
  resetEditFormData(); // Reset the form before fetching new data
  // Fetch data directly into editFormData and set view mode
  fetchAndSetData(id, editFormData, setviewModal) // isView = true
    .catch(error => {
      console.error("Error in viewRole:", error);
    });
};

const resetEditFormData = () => {
  Object.assign(editFormData, {
    id: null,
    jobId: '',
    shift: '',
    machineCode: '',
    totalTimeTaken: '',
    hoursForMachineStation: 0,
    minutesForMachineStation: 0,
    secondsForMachineStation: 0,
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
            editFormData.totalTimeTaken = productData.timeTakenforMachineStation || '00:00:00';
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
  () => [editFormData.hoursForMachineStation, editFormData.minutesForMachineStation, editFormData.secondsForMachineStation],
  () => {
    editFormData.totalTimeTaken = `${formatNumber(editFormData.hoursForMachineStation)}:${formatNumber(editFormData.minutesForMachineStation)}:${formatNumber(editFormData.secondsForMachineStation)}`;
  },
  { immediate: true }
);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading animation

  // Define an array of promises for each data-fetching function
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data by "Pending" jobs first, then by jobId ascending
      const sortedData = filteredData.sort((a: any, b: any) => {
        const aJobStatus = a.jobStatus.toUpperCase();
        const bJobStatus = b.jobStatus.toUpperCase();

        if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
        if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

        const jobIdA = parseInt(a.jobId.substring(1), 10);
        const jobIdB = parseInt(b.jobId.substring(1), 10);
        return jobIdA - jobIdB;
      });

      console.log('Sorted Data:', sortedData);

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    }),

    // Additional asynchronous initializations
    fetchNamesShift(),
    fetchMachineId(),
    fetchWeight(editFormData.jobId),
    fetchMovement(),
    fetchProductCodes(),
    fetchMachinePP(),
    fetchMachineBlow(),
    fetchWM()
  ];

  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading animation once all tasks are completed
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
    subJobId: '',
    mappingId: '',
    weight: 0,
    capacityMin: 0,
    capacityMax: 0,
    movement: 'Production',
    reassignBinId: '',
    type: 'Production',
    status: '',
  });
};

const addMachineJobRow = () => {
  const newSubJobId = `${editFormData.jobId}-${editFormData.machineJobRows.length + 1}`;

  const newRow = {
    jobId: editFormData.jobId || '',
    subJobId: newSubJobId,
    binName: '',
    productCode: '',
    machineCode: '',
    binCode: '',
    shift: 'Day shift',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  editFormData.machineJobRows.push(newRow);

  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};

// Function to delete a wet job row
const deleteMachineJobRow = (index: number) => {
  editFormData.machineJobRows.splice(index, 1);
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

const submitAllPendingMachineJobs = async () => {
  formSubmitted.value = true;
  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.machineJobRows.filter(row => row.status === 'Pending');

  // Validate Machine Name and Bin Name
  const invalidRows = pendingRows.filter(row => !row.machineCode || !row.binCode);

  if (invalidRows.length > 0) {
    Swal.fire({
      icon: 'error',
      title: 'Please complete the field',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: 'top-end',
      iconColor: 'red',
      toast: true,
      background: '#fff',
      showClass: {
        popup: 'animate__animated animate__fadeInUp',
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp',
      },
    });
    return;
  }

  if (pendingRows.length === 0) {
    Swal.fire({
      icon: 'info',
      title: 'No Pending Jobs',
      text: 'There are no jobs with a status of "Pending" to submit.',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      iconColor: 'blue',
      background: '#fff',
    });
    return;
  }

  // Show confirmation dialog
  const confirmed = await Swal.fire({
    icon: 'warning',
    title: 'Are you sure?',
    text: `You are about to submit ${pendingRows.length} pending job(s).`,
    showCancelButton: true,
    confirmButtonText: 'Yes, submit all!',
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    reverseButtons: true,
  }).then(result => result.isConfirmed);

  // If the user cancels, do nothing
  if (!confirmed) return;

  try {
    // Submit each pending row one by one
    const submissionPromises = pendingRows.map(row => {
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

      // Log the payload
      console.log('Submitting Job Payload:', JSON.stringify(jobPayload, null, 2));

      return axios.post(`${API_BASE_URL}SubmitMachineJob`, jobPayload)
        .then(response => {
          console.log('Job Submission Response:', response.data);
          row.status = response.data.status || 'Submitted'; // Update status to "Submitted"
        })
        .catch(error => {
          console.error('Error submitting job:', error);
          row.status = 'Error'; // Mark the row as "Error" if submission fails
        });
    });

    // Wait for all submissions to complete
    await Promise.all(submissionPromises);

    // Show success message
    Swal.fire({
      icon: 'success',
      title: `${pendingRows.length} pending job(s) have been submitted.`,
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      iconColor: 'green',
      background: '#fff',
    });
  } catch (error) {
    console.error('Error submitting all pending jobs:', error);
    formSubmitted.value = false;
    // Show error message
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the pending jobs. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};




const submitMachineJobRow = async (row : any) => {
  formSubmitted.value = true;
  // Validation for Machine Name and Bin Name
  if (!row.machineCode || !row.binCode) {
    Swal.fire({
      icon: 'error',
      title: 'Please complete the field',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: 'top-end',
      iconColor: 'red',
      toast: true,
      background: '#fff',
      showClass: {
        popup: 'animate__animated animate__fadeInUp',
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp',
      },
    });
    return;
  }



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

  // Log the payload in JSON format
  console.log('Job Payload:', JSON.stringify(jobPayload, null, 2));

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
    // Submit the job via API
    const jobResponse = await axios.post(`${API_BASE_URL}SubmitMachineJob`, jobPayload);
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
    });
  } catch (error) {
    console.error('Error submitting machine job details:', error);
    formSubmitted.value = false;
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

  // Check if all the treatment flags are false
  const isAllTreatmentRequiredFalse = !editFormData.wettreatmentrequired &&
    !editFormData.plasmatreatmentrequired &&
    !editFormData.dustingrequired &&
    !editFormData.deburringrequired;

  // Check if jobStatus is 'Completed', then set totalWeight to processedWeight
  const totalWeightToSend = editFormData.jobStatus === 'Completed'
    ? editFormData.processedWeight
    : editFormData.totalWeight;

  const payload = {
    jobId: String(editFormData.jobId),
    shift: String(editFormData.shift),
    machineCode: String(editFormData.machineCode),
    productCode: String(editFormData.productCode),
    totalWeight: totalWeightToSend, // Use the conditionally set totalWeight here
    waste: editFormData.waste,
    processedWeight: editFormData.processedWeight,
    wettreatmentrequired: Boolean(editFormData.wettreatmentrequired),
    plasmatreatmentrequired: Boolean(editFormData.plasmatreatmentrequired),
    dustingrequired: Boolean(editFormData.dustingrequired),
    deburringrequired: Boolean(editFormData.deburringrequired),
    jobStatus: String(editFormData.jobStatus),

    // Submit only bins with QC Pass = "Pass"
    listBinsList: Array.isArray(editFormData.binDataB)
  ? editFormData.jobStatus === 'Completed'
    ? editFormData.binDataB
        .filter(item => item.qcPass === 'Pass') // Filter bins with QC Pass = "Pass" when jobStatus is 'Completed'
        .map(item => ({
          mappingId: String(editFormData.jobId),
          binMasterId: item.binMasterId,
          subJobId: item.subJobId,
          weight: item.weight,
          capacityMin: item.capacityMin,
          capacityMax: item.capacityMax,
          reassignBinId: item.reassignBinId,
          movement: "Machine Station",
          type: item.type,
          status: item.status,
          dimensionCheck_IPQC: item.dimensionCheck_IPQC,
          functionalCheck_IPQC: item.functionalCheck_IPQC,
          visualCheck1_IPQC: item.visualCheck1_IPQC,
          visualCheck3_IPQC: item.visualCheck3_IPQC,
          visualCheck2_IPQC: item.visualCheck2_IPQC,
        }))
    : editFormData.binDataB.map(item => ({
        mappingId: String(editFormData.jobId),
        binMasterId: item.binMasterId,
        subJobId: item.subJobId,
        weight: item.weight,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
        reassignBinId: item.reassignBinId,
        movement: "Machine Station",
        type: item.type,
        status: item.status,
        dimensionCheck_IPQC: item.dimensionCheck_IPQC,
        functionalCheck_IPQC: item.functionalCheck_IPQC,
        visualCheck1_IPQC: item.visualCheck1_IPQC,
        visualCheck3_IPQC: item.visualCheck3_IPQC,
        visualCheck2_IPQC: item.visualCheck2_IPQC,
      }))
  : [],


    // Submit binListforQCinspection only if all treatments are false
    qcInspectionList: isAllTreatmentRequiredFalse ? [{
      shift: editFormData.qcInspectionList?.shift || editFormData.shift || '',  // Default shift handling
      jobStatus: editFormData.qcInspectionList?.jobStatus || editFormData.jobStatus || '',  // Default jobStatus handling
      binListforQCinspection: Array.isArray(editFormData.binDataB)
        ? editFormData.binDataB
          .filter(bin => bin.qcPass === 'Pass') // Submit only bins with QC Pass = "Pass"
          .map(bin => ({
            mappingId: String(editFormData.jobId),
            binMasterId: bin.binMasterId,
            binName: bin.binName,
            weight: bin.weight,
            qcPass: bin.qcPass,
            capacityMin: bin.capacityMin,
            capacityMax: bin.capacityMax,
            movement: 'Production',
            type: 'Production',
            productCode: String(editFormData.productCode),

            // Set these to empty values or adjust according to your logic
            dimensionCheck: '',
            functionalCheck: '',
            visualCheck1: '',
            visualCheck2: '',
            visualCheck3: '',
            room: ''
          }))
        : []
    }] : [], // If not all treatments are false, do not submit this list

    // Keeping the other lists as in your original code
    listMachines: editFormData.listMachines.map(machine => ({
      code: machine.code,
      type: machine.type,
      status: machine.status
    })),

    wetTreatmentList: [{
      shift: editFormData.wetTreatmentList?.shift || '',
      machineCode: editFormData.wetTreatmentList?.machineCode || '',
      processedWeight: editFormData.wetTreatmentList?.processedWeight || 0,
      waste: editFormData.wetTreatmentList?.waste || 0,
      whiteSlipId: String(editFormData.jobId)
    }],
    plasmaTreatmentList: [{
      shift: editFormData.plasmaTreatmentList?.shift || '',
      machineCode: editFormData.plasmaTreatmentList?.machineCode || '',
      processedWeight: editFormData.plasmaTreatmentList?.processedWeight || 0,
      waste: editFormData.plasmaTreatmentList?.waste || 0,
      whiteSlipId: String(editFormData.jobId)
    }],
    dedustingList: [{
      shift: editFormData.dedustingList?.shift || '',
      machineCode: editFormData.dedustingList?.machineCode || '',
      processedWeight: editFormData.dedustingList?.processedWeight || 0,
      waste: editFormData.dedustingList?.waste || 0,
      whiteSlipId: String(editFormData.jobId)
    }],
    deburringList: [{
      shift: editFormData.deburringList?.shift || '',
      machineCode: editFormData.deburringList?.machineCode || '',
      processedWeight: editFormData.deburringList?.processedWeight || 0,
      waste: editFormData.deburringList?.waste || 0,
      whiteSlipId: String(editFormData.jobId)
    }]
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
          fetchWeight(editFormData.jobId);
          fetchProductCodes();
          fetchMovement();
          fetchMachinePP();
          fetchMachineBlow();
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
  formData.listMachines = [];
};


const isJobStatusDisabled = computed(() => {
  const hasPendingOrSubmittedJobs = editFormData.machineJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );


  const hasIncompleteQC = editFormData.binDataB.some(bin => bin.qcPass === 'Pending');

  // Disable if there are pending/submitted jobs or if bins list is empty or QC is incomplete
  return hasPendingOrSubmittedJobs || hasIncompleteQC;
});


const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
};

const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
};

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
          <title>Machine Station</title>
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






watch(
  () => editFormData.binDataB, // Watch the binDataB array
  (newBins) => {
    const totalProcessedWeight = newBins.reduce((acc, bin) => acc + (bin.weight || 0), 0);
    editFormData.processedWeight = totalProcessedWeight; // Set processedWeight to the total bin weight
    editFormData.waste = editFormData.totalWeight - editFormData.processedWeight; // Update the waste value
  },
  { deep: true }
);

watch(
  () => viewData.binDataB, // Watch the binDataB array for viewData
  (newBins) => {
    const totalProcessedWeight = newBins.reduce((acc, bin) => acc + (bin.weight || 0), 0);
    viewData.processedWeight = totalProcessedWeight; // Set processedWeight to the total bin weight
    viewData.waste = viewData.totalWeight - viewData.processedWeight; // Update the waste value
  },
  { deep: true }
);


watch(
  () => editFormData.totalWeight,
  (newWeight) => {
    editFormData.waste = newWeight - editFormData.processedWeight; // Ensure waste is updated when totalWeight changes
  }
);


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
    <h2 class="mr-auto text-lg font-medium">Machine Station</h2>

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

  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="3xl" :open="editModal" @close="() => {
    seteditModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          Edit Machine Station
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

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Waste
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Weight</FormLabel>
                    <FormInput id="regular-form-8" v-model="editFormData.totalWeight" type="text"
                      placeholder="Total Weight" step="any" disabled />
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Waste</FormLabel>
                    <FormInput id="regular-form-8" v-model="editFormData.waste" type="text" placeholder="Waste" disabled
                      step="any" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Processed Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pending to be Processed Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pending to be Assigned Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.processedWeight }}
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.pendingToBeProcessedWeight }}
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.pendingToBeAssignedWeight }}
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


          <!-- Machine Job Rows Section -->
          <div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700">
            <div class="flex justify-between items-center mb-3">
              <h6 class="text-lg font-medium leading-none dark:text-gray-300">Machine Job Details</h6>
              <button type="button" @click="submitAllPendingMachineJobs"
                class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
                Submit All Pending
              </button>
            </div>

            <hr class="dark:border-gray-700">
            <div v-if="editFormData.machineJobRows.length > 0" class="mt-3">
              <table class="min-w-full border-collapse rounded-lg shadow-sm">
                <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
                  <tr>
                    <th class="py-2 px-4 border-b text-center rounded-tl-lg dark:border-gray-700">No.</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700"></th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Machine Name</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin ID</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Shift</th>
                    <!-- <th class="py-2 px-4 border-b text-center dark:border-gray-700">Capacity</th> -->
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Avg Time Taken</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Status</th>
                    <th class="py-2 px-4 border-b text-center dark:border-gray-700">Delete</th>
                    <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-600">Submit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.machineJobRows" :key="index"
                    class="hover:bg-gray-100 dark:hover:bg-gray-100">
                    <td class="px-4 py-2 text-center dark:text-gray-300">
                      {{index + 1}}
                    </td>
                    <td class="px-4 py-2 text-center dark:text-gray-300">
                      <FormCheck>
                        <FormCheck.Input type="checkbox" :value="index" :checked="selectedBinIndex === index"
                          @change="toggleBinSelection(index)" class="mx-auto dark:bg-gray-800 dark:border-gray-600" />
                      </FormCheck>
                    </td>
                    <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormInput v-model="row.subJobId" type="text"
                        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
                    </td>
                    <td class="py-2 px-4 border-b dark:border-gray-600">
  <div class="relative">
    <div @click="toggleMachineCodeDropdown(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.machineCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.machineCode || 'Select a Machine Name Option' }}
    </div>
    <div v-if="isMachineCodeDropdownOpen[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchMachineCodeQuery[index]" placeholder="Search Machine Code"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="machineCode in filteredMachineCodes(index)" :key="machineCode"
          @click="selectMachineCode(index, machineCode)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ machineCode }}
        </li>
        <li v-if="filteredMachineCodes(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.machineCode" class="text-red-500">Machine Name is required!</span>
</td>

<td class="py-2 px-4 border-b dark:border-gray-600">
  <div class="relative">
    <div @click="toggleBinCodeDropdown(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>
    <div v-if="isBinCodeDropdownOpen[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchBinCodeQuery[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForRow(index)" :key="bin.id"
          @click="selectBinCode(index, bin); updateCapacityValuesMachine(bin.id, row)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForRow(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>
                    <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormSelect v-model="row.shift"
                        class="sm:mr-2 form-select mt-1 block w-full dark:bg-gray-800 dark:text-gray-300"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'"
                        aria-label="Default select example">
                        <option disabled value="">Select a Shift Option</option>
                        <option v-for="name in editFormData.shifts" :key="name" :value="name">
                          {{ name }}
                        </option>
                      </FormSelect>
                    </td>
                    <!-- <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormInput v-model="row.maxCapacity" type="number"
                        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
                    </td> -->
                    <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormInput v-model="row.weight" type="number"
                        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
                    </td>
                    <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormInput v-model="row.avgTimeTaken" type="text"
                        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
                    </td>
                    <td class="py-2 px-4 border-b dark:border-gray-600">
                      <FormInput v-model="row.status" type="text"
                        class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
                    </td>
                    <td class="py-2 px-4 border-b text-center dark:border-gray-600">
                      <button @click="deleteMachineJobRow(index)"
                        :disabled="row.status === 'Completed' || row.status === 'Submitted'"
                        :class="{ 'text-gray-400': row.status === 'Completed' || row.status === 'Submitted', 'text-red-600 hover:text-red-800': row.status !== 'Completed' && row.status !== 'Submitted' }">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                    <td class="py-2 px-4 border-b text-center dark:border-gray-600">
                      <button type="button" @click="submitMachineJobRow(row)" :class="{
                        'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.status !== 'Completed' && row.status !== 'Submitted',
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
            <button type="button" @click="addMachineJobRow"
              class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
              Add Job Detail
            </button>
          </div>





          <!-- Show the filtered list of bins below the Job Status input -->
          <div v-if="editFormData.binDataB && editFormData.binDataB.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none dark:text-gray-300">List of Bins</h6>
            <hr class="dark:border-gray-700" />

            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
              <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto dark:border-gray-700">No.</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin Name</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Job ID</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">QC Pass</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bin, index) in editFormData.binDataB" :key="bin.id"
                  class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ index + 1 }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.binName }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.subJobId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.mappingId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.weight }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600" :class="{
                    'text-green-500 dark:text-green-400': bin.qcPass === 'Pass',
                    'text-red-500 dark:text-red-400': bin.qcPass === 'Fail',
                    'text-gray-500 dark:text-gray-400': bin.qcPass === 'Pending'
                  }">
                    {{ bin.qcPass }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600">
                    <button
                      class="bg-blue-700 text-white px-2 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 whitespace-nowrap"
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
        <Button type="button" variant="outline-secondary" @click="() => {
          seteditModal(false);
        }
          " class="w-20 mr-1">
          Close
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>

  <Slideover size="xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Machine Station
        </h2>
      </Slideover.Title>
      <Slideover.Description>

      </Slideover.Description>
      <Slideover.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
          setEditSlideOver(false);
        }
          " class="w-20 mr-1">
          Cancel
        </Button>


      </Slideover.Footer>
    </Slideover.Panel>
  </Slideover>



  <!-- BEGIN: Modal Content -->
  <Dialog
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
        <div ref="toPrint">
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div class="">
              <div>
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Job ID
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.jobId }}
                      </td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Part Number
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.productCode }}
                      </td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Time Taken for <br> Machine Station per KG
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.totalTimeTaken }}
                      </td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Weight
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.totalWeight }}
                      </td>
                    </tr>
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Waste
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.waste }}
                      </td>
                    </tr>

                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Job Status
                      </th>
                      <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ editFormData.jobStatus }}
                      </td>
                    </tr>
                  </tbody>
                </table>



              </div>
            </div>
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Processed Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pending to be Processed Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pending to be Assigned Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.processedWeight }}
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.pendingToBeProcessedWeight }}
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    {{ editFormData.pendingToBeAssignedWeight }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h6 class="mb-2 text-lg font-medium leading-none mt-10" v-if="editFormData.machineJobRows && editFormData.machineJobRows.length > 0">Machine Job Details</h6>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg "
            v-if="editFormData.machineJobRows && editFormData.machineJobRows.length > 0">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800 text-white">
                <tr>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    No.
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Sub Job ID
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Machine Name
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Bin ID
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Shift
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Capacity
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Weight
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Avg Time Taken
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.machineJobRows" :key="index"
                  class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ index + 1 }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.subJobId }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.machineCode || 'N/A' }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.binName || 'N/A' }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.shift || 'N/A' }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.maxCapacity }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.weight }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.avgTimeTaken }}
                  </td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                    {{ row.status }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <h6 class="mb-2 text-lg font-medium leading-none mt-5"  v-if="editFormData.binDataB && editFormData.binDataB.length > 0" >List of Bins</h6>

          <div v-if="editFormData.binDataB && editFormData.binDataB.length > 0"
            class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <hr />

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800 text-white">
                <tr>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    No.
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Bin Name
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Sub Job ID
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Job ID
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Weight
                  </th>
                  <th
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    QC Pass
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(bin, index) in editFormData.binDataB" :key="bin.id"
                  class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ index + 1 }}</td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ bin.binName }}</td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ bin.subJobId }}</td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ bin.mappingId }}</td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ bin.weight }}</td>
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ bin.qcPass }}</td>
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