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

interface Response {
  id?: string;
  whiteSlipId?: string;
  shift?: string;
  productCode?: string;
  machineCode?: string;
  weight?: any;
  waste?: any;
  wettreatmentrequired?: any;
  blowrequired?: any;
  jobStatus?: string;
}

interface UserAccess {
  userId: string;
  secondaryProcess?: string[];
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

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  whiteSlipId: "",
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
          title: "PART NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "whiteSlipId",
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
                  // Only show the "Edit" link if the job status is not "Completed" and the user has edit permissions for secondaryProcess
                  if (response.jobStatus !== "Completed" && userAccess.secondaryProcess?.includes("Edit")) {
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


const whiteSlipId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("whiteSlipId", 'like', filter.whiteSlipId);
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
    whiteSlipId: "",
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

const loading = ref(false); // Controls the loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/SecondaryProcess/';

onMounted(() => {
  loading.value = true; // Show loading animation at the start

  const fetchPromises = [
    axios.get(API_BASE_URL)
      .then(response => {
        const filteredData = response.data.result.filter((item: any) =>
          item.status !== 'deleted'
        );

        // Sort data: "Pending" status first, then by whiteSlipId in ascending order
        const sortedData = filteredData.sort((a: any, b: any) => {
          const aJobStatus = a.jobStatus.toUpperCase();
          const bJobStatus = b.jobStatus.toUpperCase();

          if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
          if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

          const whiteSlipIdA = parseInt(a.whiteSlipId.substring(1));
          const whiteSlipIdB = parseInt(b.whiteSlipId.substring(1));

          return whiteSlipIdA - whiteSlipIdB;
        });

        console.log('Sorted Data:', sortedData);

        if (tabulator.value) {
          tabulator.value.setData(sortedData);
          tabulator.value.setFilter((item: any) => item.jobStatus.toUpperCase() !== 'COMPLETED');
        }
      }),

    // Additional async functions
    fetchNamesShift(),
    fetchMachineId(),
    fetchMachineIdPlasma(),
    fetchMachineIdDeburring(),
    fetchMachineIdDusting(),
    fetchWeight(),
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
  whiteSlipId: '',
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
  weight: 0,
  waste: 0,
  processedWeight: 0,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  jobStatus: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  times: [] as string[],
  shifts: [] as string[],
  machineCodes: [] as string[],
  machineCodesPlasma: [] as string[],
  machineCodesDeburring: [] as string[],
  machineCodesDusting: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  binDataBin: [] as any[],
  binData: [] as any[],
  binDataB: [] as any[],
  binDataDB: [] as any[],
  binDataDD: [] as any[],
  productSubCodesofRecipe: [] as Array<{ jobId: string; productCode: string; percentage: ''; weight: number; status: string }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; type: string; movement: string; status: string }>,

  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      binMasterId: string;
      weight: number;
      type: string;
      reassignBinId: string;
      movement: string;
      capacityMin: number;
      capacityMax: number;
    }>
  },
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
  wetJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  plasmaJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  deburringJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  dustingJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  },
  wetWeight: 0, // weight for wet treatment
  plasmaWeight: 0, // weight for plasma treatment
  deburringWeight: 0, // weight for deburring
  dustingWeight: 0, // weight for dusting
});

// Form Data
const editFormData = reactive({
  id: null,
  whiteSlipId: '',
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
  weight: 0,
  waste: 0,
  processedWeight: 0,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  jobStatus: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  weightmachines: [] as string[],
  times: [] as string[],
  shifts: [] as string[],
  machineCodes: [] as string[],
  machineCodesPlasma: [] as string[],
  machineCodesDeburring: [] as string[],
  machineCodesDusting: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  bins: [] as string[],
  movements: [] as string[],
  binDataBin: [] as any[],
  binData: [] as any[],
  binDataB: [] as any[],
  binDataDB: [] as any[],
  binDataDD: [] as any[],
  productSubCodesofRecipe: [] as Array<{ jobId: string; productCode: string; percentage: ''; weight: number; status: string }>,
  listBinsList: [] as Array<{ id: string; binMasterId: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; subJobId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; type: string; movement: string; status: string }>,

  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      binMasterId: string;
      weight: number;
      type: string;
      reassignBinId: string;
      movement: string;
      capacityMin: number;
      capacityMax: number;
    }>
  },
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
  wetJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  plasmaJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  deburringJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  dustingJobRows: [] as Array<{
    whiteSlipId: string;
    binName: string;
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
  },
  wetWeight: 0, // weight for wet treatment
  plasmaWeight: 0, // weight for plasma treatment
  deburringWeight: 0, // weight for deburring
  dustingWeight: 0, // weight for dusting
});

// Define permission variables for secondaryProcess
let canEditSecondaryProcess = false;

// Define the fetchUserSecondaryProcessPermissions function
const fetchUserSecondaryProcessPermissions = async () => {
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

      const secondaryProcess = userDetails.secondaryProcess || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for secondaryProcess
      canEditSecondaryProcess = secondaryProcess.includes('Edit');

      console.log('canEditSecondaryProcess:', canEditSecondaryProcess); // Debugging log
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

// Call the fetchUserSecondaryProcessPermissions function to get permissions
fetchUserSecondaryProcessPermissions();

const fetchWM = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type.toLowerCase() === 'weighing machine' &&
          item.location.toLowerCase() === 'secondary process'
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

// Define a reactive property to keep track of the selected bin index for Wet
const selectedBinIndexWet = ref<number | null>(null);

// Method to handle bin selection and focus on the bin select dropdown for Wet
const toggleBinSelectionWet = (index: number) => {
  if (selectedBinIndexWet.value === index) {
    selectedBinIndexWet.value = null; // Unselect if already selected
  } else {
    selectedBinIndexWet.value = index; // Select the bin
    focusBinSelectForWet(index); // Focus the bin select dropdown
  }
};

// Focus the <select> element for the Wet row
const focusBinSelectForWet = async (index: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelectWet-${index}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};

// Define a reactive property to keep track of the selected bin index
// Define a reactive property to keep track of the selected bin index for Plasma
const selectedBinIndexPlasma = ref<number | null>(null);

// Method to handle bin selection and focus on the bin select dropdown for Plasma
const toggleBinSelectionPlasma = (index: number) => {
  if (selectedBinIndexPlasma.value === index) {
    selectedBinIndexPlasma.value = null; // Unselect if already selected
  } else {
    selectedBinIndexPlasma.value = index; // Select the bin
    focusBinSelectForPlasma(index); // Focus the bin select dropdown
  }
};

// Focus the <select> element for the Plasma row
const focusBinSelectForPlasma = async (index: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelectPlasma-${index}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};

// Define a reactive property to keep track of the selected bin index for Deburring
const selectedBinIndexDeburring = ref<number | null>(null);

// Method to handle bin selection and focus on the bin select dropdown for Deburring
const toggleBinSelectionDeburring = (index: number) => {
  if (selectedBinIndexDeburring.value === index) {
    selectedBinIndexDeburring.value = null; // Unselect if already selected
  } else {
    selectedBinIndexDeburring.value = index; // Select the bin
    focusBinSelectForDeburring(index); // Focus the bin select dropdown
  }
};

// Focus the <select> element for the Deburring row
const focusBinSelectForDeburring = async (index: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelectDeburring-${index}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};

// Define a reactive property to keep track of the selected bin index for Dusting
const selectedBinIndexDusting = ref<number | null>(null);

// Method to handle bin selection and focus on the bin select dropdown for Dusting
const toggleBinSelectionDusting = (index: number) => {
  if (selectedBinIndexDusting.value === index) {
    selectedBinIndexDusting.value = null; // Unselect if already selected
  } else {
    selectedBinIndexDusting.value = index; // Select the bin
    focusBinSelectForDusting(index); // Focus the bin select dropdown
  }
};

// Focus the <select> element for the Dusting row
const focusBinSelectForDusting = async (index: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelectDusting-${index}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};

// Flow logic to distribute weight to each step
const applyWeightToFlow = () => {
  if (editFormData.wettreatmentrequired) {
    // Apply total weight to wet treatment step
    editFormData.wetWeight = editFormData.weight;
    calculateWeightForNextStep(editFormData.wetJobRows, 'wet');
  } else if (editFormData.plasmatreatmentrequired) {
    // If wet treatment is not required, go to plasma
    editFormData.plasmaWeight = editFormData.weight;
    calculateWeightForNextStep(editFormData.plasmaJobRows, 'plasma');
  } else if (editFormData.deburringrequired) {
    // If neither wet nor plasma, go to deburring
    editFormData.deburringWeight = editFormData.weight;
    calculateWeightForNextStep(editFormData.deburringJobRows, 'deburring');
  } else if (editFormData.dustingrequired) {
    // If none of the above, go to dusting
    editFormData.dustingWeight = editFormData.weight;
    calculateWeightForNextStep(editFormData.dustingJobRows, 'dusting');
  }
};

// Helper to calculate remaining weight for next step based on completed job rows
const calculateWeightForNextStep = (jobRows: any, step: any) => {
  let totalCompletedWeight = 0;

  // Sum completed job weights from the current step
  jobRows.forEach((row: any) => {
    if (row.status === 'Completed') {
      totalCompletedWeight += row.weight;
    }
  });

  // Adjust weights based on the current step
  if (step === 'wet') {
    editFormData.wetWeight = Math.max(0, editFormData.wetWeight - totalCompletedWeight);
 // Deduct the completed weight from Wet Treatment

    // If Plasma is required, pass to Plasma, otherwise check for Deburring or Dusting
    if (editFormData.plasmatreatmentrequired) {
      editFormData.plasmaWeight = totalCompletedWeight; // Pass to Plasma Treatment
      calculateWeightForNextStep(editFormData.plasmaJobRows, 'plasma');
    } else if (editFormData.deburringrequired) {
      editFormData.deburringWeight = totalCompletedWeight; // Pass to Deburring
      calculateWeightForNextStep(editFormData.deburringJobRows, 'deburring');
    } else if (editFormData.dustingrequired) {
      editFormData.dustingWeight = totalCompletedWeight; // Pass to Dusting
      calculateWeightForNextStep(editFormData.dustingJobRows, 'dusting');
    }
  } else if (step === 'plasma') {
    editFormData.plasmaWeight = Math.max(0, editFormData.plasmaWeight - totalCompletedWeight); // Deduct completed weight from Plasma Treatment

    // If Deburring is required, pass to Deburring, otherwise check for Dusting
    if (editFormData.deburringrequired) {
      editFormData.deburringWeight = totalCompletedWeight; // Pass to Deburring
      calculateWeightForNextStep(editFormData.deburringJobRows, 'deburring');
    } else if (editFormData.dustingrequired) {
      editFormData.dustingWeight = totalCompletedWeight; // Pass to Dusting
      calculateWeightForNextStep(editFormData.dustingJobRows, 'dusting');
    }
  } else if (step === 'deburring') {
    editFormData.deburringWeight -= totalCompletedWeight; // Deduct completed weight from Deburring

    // If Dusting is required, pass to Dusting
    if (editFormData.dustingrequired) {
      editFormData.dustingWeight = totalCompletedWeight; // Pass to Dusting
      calculateWeightForNextStep(editFormData.dustingJobRows, 'dusting');
    }
  } else if (step === 'dusting') {
    // Final step: adjust Dusting weight
    editFormData.dustingWeight -= totalCompletedWeight;
  }
};




// Computed property to calculate the processed weight (status = 'Completed')
const processedWeight = computed(() => {
  return editFormData.wetJobRows
    .filter(row => row.status === 'Completed')
    .reduce((total, row) => total + (row.weight || 0), 0);
});

// Computed property to calculate the pending to be processed weight (status = 'Submitted')
const pendingToBeProcessedWeight = computed(() => {
  return editFormData.wetJobRows
    .filter(row => row.status === 'Submitted')
    .reduce((total, row) => total + (row.weight || 0), 0);
});

// Computed property to calculate the pending to be assigned weight
const pendingToBeAssignedWeight = computed(() => {
  const totalWeightFromPlanning = editFormData.weight || 0; // Assuming weight is from planning
  const assignedWeight = editFormData.wetJobRows
    .reduce((total, row) => total + (row.weight || 0), 0); // Sum of all weights in the sub job list
  return totalWeightFromPlanning - assignedWeight;
});



// Watch the computed properties and assign their values to editFormData
watchEffect(() => {
  editFormData.processedWeight = processedWeight.value;
  editFormData.pendingToBeProcessedWeight = pendingToBeProcessedWeight.value;
  editFormData.pendingToBeAssignedWeight = pendingToBeAssignedWeight.value;
});



const fetchBinId = async (jobId: string) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const nameData = response.data.result;

    if (Array.isArray(nameData)) {
      // Filter bins by jobId and ensure weight > 0
      const filteredBins = nameData.filter(item =>
        item.mappingId === jobId && item.weight > 0 && item.status.toLowerCase() !==
        'inactive'
        && item.type.toLowerCase() === 'machine station'
      );

      // Update formData.bins and binData with filtered results
      editFormData.bins = filteredBins.map(item => item.id);
      editFormData.binData = filteredBins;
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
const getBinDetailsMachineDB = (binCode: any) => {
  return editFormData.binDataDB.find(bin => bin.id === binCode) || {};
};


const updateCapacityValuesMachineDB = (binCode: any, row: any) => {
  const binDetails = getBinDetailsMachineDB(binCode);
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
const getBinDetailsMachineDD = (binCode: any) => {
  return editFormData.binDataDD.find(bin => bin.id === binCode) || {};
};


const updateCapacityValuesMachineDD = (binCode: any, row: any) => {
  const binDetails = getBinDetailsMachineDD(binCode);
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



const fetchWeight = () => {
  axios.get('http://10.87.0.33:8082/api/Blending')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "deleted"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'deleted');

        // Find the item with the matching jobId
        const matchingItem = activeNameData.find(item => item.jobId === editFormData.whiteSlipId);

        if (matchingItem) {
          // Set the weight in editFormData
          editFormData.weight = matchingItem.weight;
          viewData.weight = matchingItem.weight;
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
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'wet treatment')
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
const fetchMachineIdPlasma = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'plasma treatment')
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodesPlasma = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};
const fetchMachineIdDeburring = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'deburring')
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodesDeburring = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};
const fetchMachineIdDusting = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'dedusting')
        );

        // Map the activeNameData array to extract the 'name' property
        editFormData.machineCodesDusting = activeNameData.map(item => item.name);
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
          item.status.toLowerCase() !== 'inactive' && (item.type.toLowerCase() === 'wet treatment')
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
  () => editFormData.wetJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.wetJobRows.forEach((row, index) => {
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
watch(
  () => editFormData.dustingJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.dustingJobRows.forEach((row, index) => {
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
watch(
  () => editFormData.plasmaJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.plasmaJobRows.forEach((row, index) => {
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
watch(
  () => editFormData.deburringJobRows.map(row => ({ weight: row.weight, subJobId: row.subJobId })),
  (newRows) => {
    editFormData.deburringJobRows.forEach((row, index) => {
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

// Method to fetch both ListBins and BinMaster data
const fetchBinsAndBinMaster = async (whiteSlipId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    if (Array.isArray(binsData) && Array.isArray(binMasterData)) {
      // Filter bins by whiteSlipId, weight > 0, and type is 'Blending'
      const filteredBins = binsData.filter(
        bin => bin.mappingId === whiteSlipId && bin.weight > 0 && bin.type.toLowerCase() === 'machine station'
      );

      // Add bin names from BinMaster data by matching `binMasterId` with `BinMaster`'s `id`
      const enrichedBins = filteredBins.map(bin => {
        const matchedBinMaster = binMasterData.find(bm => bm.id === bin.binMasterId);
        return {
          ...bin,
          binName: matchedBinMaster ? matchedBinMaster.name : 'Unknown' // Add the bin name
        };
      });

      // Update the form data
      editFormData.bins = enrichedBins.map(bin => bin.id);
      editFormData.binData = enrichedBins;
    } else {
      console.error('Unexpected response format from API');
    }
  } catch (error) {
    console.error('Error fetching bins or bin master data:', error);
  }
};
const fetchBinsAndBinMasterDB = async (whiteSlipId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    if (Array.isArray(binsData) && Array.isArray(binMasterData)) {
      // Determine the movement type based on wettreatmentrequired and plasmatreatmentrequired
      let targetMovement = 'machine station'; // Default movement

      if (editFormData.wettreatmentrequired) {
        targetMovement = 'wet treatment';
      } else if (editFormData.plasmatreatmentrequired) {
        targetMovement = 'plasma treatment';
      }

      // Filter bins by whiteSlipId, weight > 0, and the specific movement
      const filteredBins = binsData.filter(
        bin => bin.mappingId === whiteSlipId && bin.weight > 0 && bin.type.toLowerCase() === targetMovement
      );

      // Add bin names from BinMaster data by matching `binMasterId` with `BinMaster`'s `id`
      const enrichedBins = filteredBins.map(bin => {
        const matchedBinMaster = binMasterData.find(bm => bm.id === bin.binMasterId);
        return {
          ...bin,
          binName: matchedBinMaster ? matchedBinMaster.name : 'Unknown' // Add the bin name
        };
      });

      // Update the form data with the filtered and enriched bins
      editFormData.bins = enrichedBins.map(bin => bin.id);
      editFormData.binDataDB = enrichedBins;
    } else {
      console.error('Unexpected response format from API');
    }
  } catch (error) {
    console.error('Error fetching bins or bin master data:', error);
  }
};

const fetchBinsAndBinMasterDD = async (whiteSlipId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    if (Array.isArray(binsData) && Array.isArray(binMasterData)) {
      // Determine the movement type based on wettreatmentrequired, plasmatreatmentrequired, and deburringrequired
      let targetMovement = 'machine station'; // Default movement

      // Priority logic: deburring > wet treatment > plasma treatment
      if (editFormData.deburringrequired) {
        // If deburring is required, it overrides wet and plasma treatment
        targetMovement = 'deburring';
      } else if (editFormData.wettreatmentrequired) {
        // If deburring is not required and wet treatment is required
        targetMovement = 'wet treatment';
      } else if (editFormData.plasmatreatmentrequired) {
        // If neither deburring nor wet treatment are required but plasma treatment is
        targetMovement = 'plasma treatment';
      }

      // Filter bins by whiteSlipId, weight > 0, and the specific movement
      const filteredBins = binsData.filter(
        bin => bin.mappingId === whiteSlipId && bin.weight > 0 && bin.type.toLowerCase() === targetMovement
      );

      // Add bin names from BinMaster data by matching `binMasterId` with `BinMaster`'s `id`
      const enrichedBins = filteredBins.map(bin => {
        const matchedBinMaster = binMasterData.find(bm => bm.id === bin.binMasterId);
        return {
          ...bin,
          binName: matchedBinMaster ? matchedBinMaster.name : 'Unknown' // Add the bin name
        };
      });

      // Update the form data with the filtered and enriched bins
      editFormData.bins = enrichedBins.map(bin => bin.id);
      editFormData.binDataDD = enrichedBins;
    } else {
      console.error('Unexpected response format from API');
    }
  } catch (error) {
    console.error('Error fetching bins or bin master data:', error);
  }
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

    // Correct the filtering logic for multiple types
    const filteredBins = bins.filter(bin =>
      bin.weight > 0 && // weight must be greater than 0
      (
        bin.type.toLowerCase() === 'plasma treatment' ||
        bin.type.toLowerCase() === 'wet treatment' ||
        bin.type.toLowerCase() === 'dedusting' ||
        bin.type.toLowerCase() === 'deburring' ||
        bin.type.toLowerCase() === 'waste'
      ) &&
      bin.mappingId === jobId // mappingId must match jobId
    );

    if (filteredBins.length > 0) {
      // Add bin name to each filtered bin
      filteredBins.forEach(bin => {
        bin.binName = binMasterMap[bin.binMasterId] || 'Unknown';
      });

      console.log('Filtered Bins with Names:', filteredBins);
      editFormData.binDataBin = filteredBins; // Set detailed bin data for display
    } else {
      // If no bins match, clear the bin data
      console.warn(`No bins found matching the criteria for Job ID: ${jobId}`);
      editFormData.binDataBin = []; // Clear the bin data to hide the list
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
      await fetchBins(editFormData.whiteSlipId);
    } else {
      console.log('Release action cancelled.');
    }
  } catch (error) {
    console.error("Error releasing bin:", error);
    Swal.fire('Failed!', 'There was an error releasing the bin. Please try again.', 'error');
  }
};




const fetchBinsAndBinMasterProd = async (whiteSlipId: string) => {
  try {
    // Fetch ListBins API data
    const binsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binsData = binsResponse.data.result;

    // Fetch BinMaster API data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    if (Array.isArray(binsData) && Array.isArray(binMasterData)) {
      // Filter bins by whiteSlipId, weight > 0, and type is 'Production' or 'production'
      const filteredBins = binsData.filter(
        bin => bin.mappingId === whiteSlipId && bin.weight > 0 && (bin.type.toLowerCase() === 'plasma treatment' && bin.type.toLowerCase() === 'wet treatment' && bin.type.toLowerCase() === 'dedusting' && bin.type.toLowerCase() === 'deburring')
      );

      // Add bin names from BinMaster data by matching `binMasterId` with `BinMaster`'s `id`
      const enrichedBins = filteredBins.map(bin => {
        const matchedBinMaster = binMasterData.find(bm => bm.id === bin.binMasterId);

        // Determine QC Pass status
        const allChecks = [
          bin.dimensionCheck_IPQC,
          bin.functionalCheck_IPQC,
          bin.visualCheck1_IPQC,
          bin.visualCheck2_IPQC,
          bin.visualCheck3_IPQC
        ];

        // Check if all fields are 'Approve' or any is 'Reject'
        const qcPass = allChecks.every(check => check === 'Approve') || allChecks.includes('Reject') ? 'Completed' : 'Pending';

        return {
          ...bin,
          binName: matchedBinMaster ? matchedBinMaster.name : 'Unknown', // Add the bin name
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


const filteredBinOptionsForRow = (currentIndex: number, jobType: 'wet' | 'plasma') => {
  // Collect all selected bin IDs from wetJobRows and plasmaJobRows, excluding the current row
  const selectedBins = [
    ...editFormData.wetJobRows
      .filter((row, index) => jobType === 'wet' && index !== currentIndex) // Exclude the current row in wetJobRows if jobType is 'wet'
      .map(row => row.binCode) // Collect selected bin codes from wetJobRows
      .filter(Boolean), // Remove null or undefined values

    ...editFormData.plasmaJobRows
      .filter((row, index) => jobType === 'plasma' && index !== currentIndex) // Exclude the current row in plasmaJobRows if jobType is 'plasma'
      .map(row => row.binCode) // Collect selected bin codes from plasmaJobRows
      .filter(Boolean) // Remove null or undefined values
  ];

  // Filter out bins that are already selected in other rows
  return editFormData.binData.filter(bin => !selectedBins.includes(bin.id));
};

const filteredBinOptionsForDeburringRow = (currentIndex: number) => {
  // Collect all selected bin IDs from deburringJobRows, excluding the current row
  const selectedBins = editFormData.deburringJobRows
    .filter((row, index) => index !== currentIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin codes from deburringJobRows
    .filter(Boolean); // Remove null or undefined values

  // Filter out bins that are already selected in other rows (using binDataDB)
  return editFormData.binDataDB.filter(bin => !selectedBins.includes(bin.id));
};

const filteredBinOptionsForDustingRow = (currentIndex: number) => {
  // Collect all selected bin IDs from dustingJobRows, excluding the current row
  const selectedBins = editFormData.dustingJobRows
    .filter((row, index) => index !== currentIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin codes from dustingJobRows
    .filter(Boolean); // Remove null or undefined values

  // Filter out bins that are already selected in other rows
  let availableBins = editFormData.binDataDD.filter(bin => !selectedBins.includes(bin.id));

  // Further filter based on search query if there's input
  if (searchBinCodeQueryDusting.value[currentIndex]) {
    availableBins = availableBins.filter(bin =>
      bin.binName.toLowerCase().includes(searchBinCodeQueryDusting.value[currentIndex].toLowerCase())
    );
  }

  return availableBins;
};



// Watch for changes in whiteSlipId and fetch bins and bin master data accordingly
watch(() => editFormData.whiteSlipId, (newJobId) => {
  if (newJobId) {
    fetchBinsAndBinMaster(newJobId);
    fetchBinsAndBinMasterProd(newJobId);
    fetchBinsAndBinMasterDB(newJobId);
    fetchBinsAndBinMasterDD(newJobId);
  }
});




const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => {
  editModal.value = value;
  if (!value) {
    viewData.waste = 0;
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

let fetchedSubJobIds = new Set();


const fetchAndSetMachineJobs = async (jobId: any, targetData: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  try {
    const response = await axios.get('http://10.87.0.33:8082/api/WetTreatmentJobs');
    const machineJobsData = response.data.result || [];
    console.log('Fetched Machine Jobs Data:', machineJobsData);

    // Filter machine jobs based on job ID
    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
    console.log('Filtered Machine Jobs based on Job ID:', filteredMachineJobs);

    // Update fetchedSubJobIds
    fetchedSubJobIds = new Set(filteredMachineJobs.map((job: any) => job.subJobId));

    // Map machine jobs with corresponding bin names from bin data
    targetData.wetJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = editFormData.binData.find(bin => bin.id === job.binCode);
      return {
        jobId: job.jobId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released', // Include binName if available
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      };
    });

    console.log('Updated Machine Job Rows in Target Data with Bin Names:', targetData.wetJobRows);

    if (targetData.wetJobRows.length === 0) {
      console.warn('No machine jobs found for the specified Job ID:', jobId);
    }
  } catch (error) {
    console.error('Error fetching machine jobs:', error);
  }
};

// Dropdown control for each Machine Code and Bin Code in wetJobRows
const isMachineCodeDropdownOpenWet: Ref<boolean[]> = ref([]); // Tracks open/close state for machine code dropdown
const searchMachineCodeQueryWet: Ref<string[]> = ref([]); // Tracks the search query for each wet job row's machine code

const isBinCodeDropdownOpenWet: Ref<boolean[]> = ref([]); // Tracks open/close state for bin code dropdown
const searchBinCodeQueryWet: Ref<string[]> = ref([]); // Tracks the search query for each wet job row's bin code

// Function to filter machine codes for a specific row in wetJobRows based on search query
const filteredMachineOptionsForRowWet = (rowIndex: number) => {
  if (!searchMachineCodeQueryWet.value[rowIndex]) {
    return editFormData.machineCodes; // Show all machine codes if no search query
  }
  return editFormData.machineCodes.filter(machineCode =>
    machineCode.toLowerCase().includes(searchMachineCodeQueryWet.value[rowIndex].toLowerCase())
  );
};

// Function to filter bin codes for a specific row in wetJobRows based on search query
const filteredBinOptionsForRowWet = (rowIndex: number) => {
  const row = editFormData.wetJobRows[rowIndex];
  if (!row) return [];

  let availableBins = editFormData.binData.filter(bin => bin.mappingId === row.whiteSlipId);

  if (searchBinCodeQueryWet.value[rowIndex]) {
    availableBins = availableBins.filter(bin =>
      bin.binName.toLowerCase().includes(searchBinCodeQueryWet.value[rowIndex].toLowerCase())
    );
  }

  return availableBins;
};

// Function to toggle dropdown open/close for Machine Code and Bin Code in Wet Job rows
const toggleMachineCodeDropdownWet = (rowIndex: number) => {
  if (!editFormData.wetJobRows[rowIndex].status.includes('Completed') && !editFormData.wetJobRows[rowIndex].status.includes('Submitted')) {
    isMachineCodeDropdownOpenWet.value[rowIndex] = !isMachineCodeDropdownOpenWet.value[rowIndex];
    searchMachineCodeQueryWet.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

const toggleBinCodeDropdownWet = (rowIndex: number) => {
  if (!editFormData.wetJobRows[rowIndex].status.includes('Completed') && !editFormData.wetJobRows[rowIndex].status.includes('Submitted')) {
    isBinCodeDropdownOpenWet.value[rowIndex] = !isBinCodeDropdownOpenWet.value[rowIndex];
    searchBinCodeQueryWet.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Machine Code for Wet Job row
const selectMachineCodeWet = (rowIndex: number, machineCode: string) => {
  editFormData.wetJobRows[rowIndex].machineCode = machineCode;
  isMachineCodeDropdownOpenWet.value[rowIndex] = false; // Close dropdown after selection
};

// Function to select a Bin Code for Wet Job row
const selectBinCodeWet = (rowIndex: number, bin: { id: string; binName: string }) => {
  const row = editFormData.wetJobRows[rowIndex];
  row.binCode = bin.id;       // Store bin ID as the value
  row.binName = bin.binName;   // Store bin name to display
  isBinCodeDropdownOpenWet.value[rowIndex] = false; // Close dropdown after selection

  // Update capacity values based on the selected bin
  updateCapacityValuesMachine(bin.id, row);
};

const fetchAndSetDustingJobs = async (jobId: any, targetData: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  try {
    const response = await axios.get('http://10.87.0.33:8082/api/DedustingJobs');
    const machineJobsData = response.data.result || [];
    console.log('Fetched Machine Jobs Data:', machineJobsData);

    // Filter machine jobs based on job ID
    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
    console.log('Filtered Machine Jobs based on Job ID:', filteredMachineJobs);

    // Update fetchedSubJobIds
    fetchedSubJobIds = new Set(filteredMachineJobs.map((job: any) => job.subJobId));

    // Map machine jobs with corresponding bin names from bin data
    targetData.dustingJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = editFormData.binDataDD.find(bin => bin.id === job.binCode);
      return {
        jobId: job.whiteSlipId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released', // Include binName if available
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      };
    });

    console.log('Updated Machine Job Rows in Target Data with Bin Names:', targetData.dustingJobRows);

    if (targetData.dustingJobRows.length === 0) {
      console.warn('No machine jobs found for the specified Job ID:', jobId);
    }
  } catch (error) {
    console.error('Error fetching machine jobs:', error);
  }
};


const isMachineCodeDropdownOpenDusting: Ref<boolean[]> = ref([]); // Tracks open/close state for each machine code dropdown in dustingJobRows
const searchMachineCodeQueryDusting: Ref<string[]> = ref([]); // Tracks search query for each row’s machine code
// Function to toggle dropdown open/close for Machine Code in Dusting Job rows
const toggleMachineCodeDropdownDusting = (rowIndex: number) => {
  if (!editFormData.dustingJobRows[rowIndex].status.includes('Completed') && !editFormData.dustingJobRows[rowIndex].status.includes('Submitted')) {
    isMachineCodeDropdownOpenDusting.value[rowIndex] = !isMachineCodeDropdownOpenDusting.value[rowIndex];
    searchMachineCodeQueryDusting.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Machine Code for Dusting Job row
const selectMachineCodeDusting = (rowIndex: number, machineCode: string) => {
  editFormData.dustingJobRows[rowIndex].machineCode = machineCode;
  isMachineCodeDropdownOpenDusting.value[rowIndex] = false; // Close dropdown after selection
};
const filteredMachineOptionsForDustingRow = (rowIndex: number) => {
  if (!searchMachineCodeQueryDusting.value[rowIndex]) {
    return editFormData.machineCodesDusting; // Show all machine codes if no search query
  }
  return editFormData.machineCodesDusting.filter(machineCode =>
    machineCode.toLowerCase().includes(searchMachineCodeQueryDusting.value[rowIndex].toLowerCase())
  );
};


// Dropdown control for each Machine Code and Bin Code in dustingJobRows
const isBinCodeDropdownOpenDusting: Ref<boolean[]> = ref([]); // Tracks open/close state of the bin code dropdown
const searchBinCodeQueryDusting: Ref<string[]> = ref([]); // Tracks search query for bin code

// Function to toggle dropdown open/close for Bin Code in Dusting Job rows
const toggleBinCodeDropdownDusting = (rowIndex: number) => {
  if (!editFormData.dustingJobRows[rowIndex].status.includes('Completed') && !editFormData.dustingJobRows[rowIndex].status.includes('Submitted')) {
    isBinCodeDropdownOpenDusting.value[rowIndex] = !isBinCodeDropdownOpenDusting.value[rowIndex];
    searchBinCodeQueryDusting.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};



// Function to select a Bin Code for Dusting Job row and store both binCode (ID) and binName
const selectBinCodeDusting = (rowIndex: number, bin: { id: string; binName: string }) => {
  const row = editFormData.dustingJobRows[rowIndex];
  row.binCode = bin.id;       // Store bin ID as the value
  row.binName = bin.binName;   // Store bin name to display
  isBinCodeDropdownOpenDusting.value[rowIndex] = false; // Close dropdown after selection

  // Update capacity values based on the selected bin
  updateCapacityValuesMachineDD(bin.id, row);
};

const fetchAndSetDeburringJobs = async (jobId: any, targetData: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  try {
    const response = await axios.get('http://10.87.0.33:8082/api/DeburringJobs');
    const machineJobsData = response.data.result || [];
    console.log('Fetched Machine Jobs Data:', machineJobsData);

    // Filter machine jobs based on job ID
    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
    console.log('Filtered Machine Jobs based on Job ID:', filteredMachineJobs);

    // Update fetchedSubJobIds
    fetchedSubJobIds = new Set(filteredMachineJobs.map((job: any) => job.subJobId));

    // Map machine jobs with corresponding bin names from bin data
    targetData.deburringJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = editFormData.binDataDB.find(bin => bin.id === job.binCode);
      return {
        jobId: job.whiteSlipId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released', // Include binName if available
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      };
    });

    console.log('Updated Machine Job Rows in Target Data with Bin Names:', targetData.deburringJobRows);

    if (targetData.deburringJobRows.length === 0) {
      console.warn('No machine jobs found for the specified Job ID:', jobId);
    }
  } catch (error) {
    console.error('Error fetching machine jobs:', error);
  }
};


// Dropdown control for each Machine Code and Bin Code in deburringJobRows
const isMachineCodeDropdownOpenDeburring: Ref<boolean[]> = ref([]); // Tracks open/close state of the machine code dropdown
const searchMachineCodeQueryDeburring: Ref<string[]> = ref([]); // Tracks search query for machine code

const isBinCodeDropdownOpenDeburring: Ref<boolean[]> = ref([]); // Tracks open/close state of the bin code dropdown
const searchBinCodeQueryDeburring: Ref<string[]> = ref([]); // Tracks search query for bin code

// Function to toggle dropdown open/close for Machine Code in Deburring Job rows
const toggleMachineCodeDropdownDeburring = (rowIndex: number) => {
  if (!editFormData.deburringJobRows[rowIndex].status.includes('Completed') && !editFormData.deburringJobRows[rowIndex].status.includes('Submitted')) {
    isMachineCodeDropdownOpenDeburring.value[rowIndex] = !isMachineCodeDropdownOpenDeburring.value[rowIndex];
    searchMachineCodeQueryDeburring.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to toggle dropdown open/close for Bin Code in Deburring Job rows
const toggleBinCodeDropdownDeburring = (rowIndex: number) => {
  if (!editFormData.deburringJobRows[rowIndex].status.includes('Completed') && !editFormData.deburringJobRows[rowIndex].status.includes('Submitted')) {
    isBinCodeDropdownOpenDeburring.value[rowIndex] = !isBinCodeDropdownOpenDeburring.value[rowIndex];
    searchBinCodeQueryDeburring.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Machine Code for Deburring Job row
const selectMachineCodeDeburring = (rowIndex: number, machineCode: string) => {
  editFormData.deburringJobRows[rowIndex].machineCode = machineCode;
  isMachineCodeDropdownOpenDeburring.value[rowIndex] = false; // Close dropdown after selection
};

// Function to select a Bin Code for Deburring Job row and store both binCode (ID) and binName
const selectBinCodeDeburring = (rowIndex: number, bin: { id: string; binName: string }) => {
  const row = editFormData.deburringJobRows[rowIndex];
  row.binCode = bin.id;       // Store bin ID as the value
  row.binName = bin.binName;   // Store bin name to display
  isBinCodeDropdownOpenDeburring.value[rowIndex] = false; // Close dropdown after selection

  // Update capacity values based on the selected bin
  updateCapacityValuesMachineDB(bin.id, row);
};

const filteredMachineOptionsForDeburringRow = (rowIndex: number) => {
  if (!searchMachineCodeQueryDeburring.value[rowIndex]) {
    return editFormData.machineCodesDeburring; // Show all machine codes if no search query
  }
  return editFormData.machineCodesDeburring.filter(machineCode =>
    machineCode.toLowerCase().includes(searchMachineCodeQueryDeburring.value[rowIndex].toLowerCase())
  );
};


const fetchAndSetPlasmaJobs = async (jobId: any, targetData: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch plasma jobs.');
    return;
  }

  try {
    const response = await axios.get('http://10.87.0.33:8082/api/PlasmaTreatmentJobs');
    const machineJobsData = response.data.result || [];
    console.log('Fetched Plasma Jobs Data:', machineJobsData);

    // Filter plasma jobs based on job ID
    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);
    console.log('Filtered Plasma Jobs based on Job ID:', filteredMachineJobs);

    // Update fetchedSubJobIds
    fetchedSubJobIds = new Set(filteredMachineJobs.map((job: any) => job.subJobId));

    // Map plasma jobs with corresponding bin names from bin data
    targetData.plasmaJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = editFormData.binData.find(bin => bin.id === job.binCode);
      return {
        jobId: job.whiteSlipId,
        subJobId: job.subJobId,
        productCode: job.productCode,
        machineCode: job.machineCode,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released', // Include binName if available
        shift: job.shift,
        minCapacity: job.minCapacity,
        maxCapacity: job.maxCapacity,
        weight: job.weight,
        avgTimeTaken: job.avgTimeTaken || '00:00:00',
        status: job.status || 'Pending',
      };
    });

    console.log('Updated Plasma Job Rows in Target Data with Bin Names:', targetData.plasmaJobRows);

    if (targetData.plasmaJobRows.length === 0) {
      console.warn('No plasma jobs found for the specified Job ID:', jobId);
    }
  } catch (error) {
    console.error('Error fetching plasma jobs:', error);
  }
};

// Dropdown control for each Machine Code and Bin Code in plasmaJobRows
const isMachineCodeDropdownOpenPlasma: Ref<boolean[]> = ref([]);
const searchMachineCodeQueryPlasma: Ref<string[]> = ref([]);

const isBinCodeDropdownOpenPlasma: Ref<boolean[]> = ref([]);
const searchBinCodeQueryPlasma: Ref<string[]> = ref([]);
const filteredMachineOptionsForRowPlasma = (rowIndex: number) => {
  if (!searchMachineCodeQueryPlasma.value[rowIndex]) {
    return editFormData.machineCodesPlasma; // Show all machine codes if no search query
  }
  return editFormData.machineCodesPlasma.filter(machineCode =>
    machineCode.toLowerCase().includes(searchMachineCodeQueryPlasma.value[rowIndex].toLowerCase())
  );
};
const filteredBinOptionsForRowPlasma = (rowIndex: number) => {
  const row = editFormData.plasmaJobRows[rowIndex];
  if (!row) return [];

  // Collect all selected bin IDs from plasmaJobRows, excluding the current row
  const selectedBins = editFormData.plasmaJobRows
    .filter((_, index) => index !== rowIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin codes
    .filter(Boolean); // Remove null or undefined values

  // Filter binData to exclude bins that are already selected in other rows
  let availableBins = editFormData.binData.filter(bin => !selectedBins.includes(bin.id) && bin.mappingId === row.whiteSlipId);

  // Further filter based on the search query, if there's input
  if (searchBinCodeQueryPlasma.value[rowIndex]) {
    availableBins = availableBins.filter(bin =>
      bin.binName.toLowerCase().includes(searchBinCodeQueryPlasma.value[rowIndex].toLowerCase())
    );
  }

  return availableBins;
};

// Function to toggle Machine Code dropdown for Plasma Job rows
const toggleMachineCodeDropdownPlasma = (rowIndex: number) => {
  if (!editFormData.plasmaJobRows[rowIndex].status.includes('Completed') && !editFormData.plasmaJobRows[rowIndex].status.includes('Submitted')) {
    isMachineCodeDropdownOpenPlasma.value[rowIndex] = !isMachineCodeDropdownOpenPlasma.value[rowIndex];
    searchMachineCodeQueryPlasma.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to toggle Bin Code dropdown for Plasma Job rows
const toggleBinCodeDropdownPlasma = (rowIndex: number) => {
  if (!editFormData.plasmaJobRows[rowIndex].status.includes('Completed') && !editFormData.plasmaJobRows[rowIndex].status.includes('Submitted')) {
    isBinCodeDropdownOpenPlasma.value[rowIndex] = !isBinCodeDropdownOpenPlasma.value[rowIndex];
    searchBinCodeQueryPlasma.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Machine Code
const selectMachineCodePlasma = (rowIndex: number, machineCode: string) => {
  editFormData.plasmaJobRows[rowIndex].machineCode = machineCode;
  isMachineCodeDropdownOpenPlasma.value[rowIndex] = false; // Close dropdown after selection
};

// Function to select a Bin Code and update capacity values
const selectBinCodePlasma = (rowIndex: number, bin: { id: string; binName: string }) => {
  const row = editFormData.plasmaJobRows[rowIndex];
  row.binCode = bin.id;       // Store bin ID as the value
  row.binName = bin.binName;   // Store bin name to display
  isBinCodeDropdownOpenPlasma.value[rowIndex] = false; // Close dropdown after selection

  // Update capacity values based on the selected bin
  updateCapacityValuesMachine(bin.id, row);
};


const fetchAndFilterBins = (whiteSlipId: string) => {
  axios.get('http://10.87.0.33:8082/api/ListBins')
    .then(response => {
      const binsData = response.data.result || [];
      console.log('Fetched Bins Data:', binsData);

      // Filter bins based on the provided conditions
      const filteredBins = binsData.filter((bin: any) =>
        bin.weight > 0 &&
        bin.type === 'Blending' &&
        bin.mappingId === whiteSlipId
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
        wettreatmentrequired: firstItem.wettreatmentrequired,
        plasmatreatmentrequired: firstItem.plasmatreatmentrequired,
        dustingrequired: firstItem.dustingrequired,
        deburringrequired: firstItem.deburringrequired,
        jobStatus: firstItem.jobStatus,
        listBinsList: firstItem.listBinsList || [],
        listBins: filteredBins,
        listMachines: firstItem.listMachines || [],
      });

      if (firstItem.weight !== null && firstItem.weight !== undefined && firstItem.weight !== 0) {
        formData.weight = firstItem.weight;
      }

      // Fetch related bins and machine jobs, ensuring all are completed before continuing
      await fetchBinId(firstItem.whiteSlipId);
      await fetchBins(firstItem.whiteSlipId);
      await fetchAndSetMachineJobs(firstItem.whiteSlipId, formData);
      await fetchAndSetPlasmaJobs(firstItem.whiteSlipId, formData);
      await fetchAndSetDeburringJobs(firstItem.whiteSlipId, formData);
      await fetchAndSetDustingJobs(firstItem.whiteSlipId, formData);
      await Promise.all([
        fetchWeight() // Pass isView to fetchWeight to fetch the weight for viewData or editFormData
      ]);
      // Calculate waste manually after all data is loaded
      calculateWaste(formData);
      applyWeightToFlow();

      modalSetter(true); // Open modal once all data is loaded and processed
    } else {
      console.error('No data found for the specified ID:', id);
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    loading.value = false; // Hide loading animation after all data is processed
  }
};







const editRole = (machineId: string) => {
  resetEditFormData(); // Reset the form before fetching new data
  fetchAndSetData(machineId, editFormData, seteditModal);
};

const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

const resetEditFormData = () => {
  Object.assign(editFormData, {
    id: null,
    whiteSlipId: '',
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
  () => [editFormData.hoursForMachineStation, editFormData.minutesForMachineStation, editFormData.secondsForMachineStation],
  () => {
    editFormData.totalTimeTaken = `${formatNumber(editFormData.hoursForMachineStation)}:${formatNumber(editFormData.minutesForMachineStation)}:${formatNumber(editFormData.secondsForMachineStation)}`;
  },
  { immediate: true }
);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading animation at the start

  const fetchPromises = [
    axios.get(API_BASE_URL)
      .then(response => {
        const filteredData = response.data.result.filter((item: any) =>
          item.status !== 'deleted'
        );

        // Sort data: "Pending" status first, then by whiteSlipId in ascending order
        const sortedData = filteredData.sort((a: any, b: any) => {
          const aJobStatus = a.jobStatus.toUpperCase();
          const bJobStatus = b.jobStatus.toUpperCase();

          if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
          if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

          const whiteSlipIdA = parseInt(a.whiteSlipId.substring(1));
          const whiteSlipIdB = parseInt(b.whiteSlipId.substring(1));

          return whiteSlipIdA - whiteSlipIdB;
        });

        console.log('Sorted Data:', sortedData);

        if (tabulator.value) {
          tabulator.value.setData(sortedData);
          tabulator.value.setFilter((item: any) => item.jobStatus.toUpperCase() !== 'COMPLETED');
        }
      }),

    // Additional async functions
    fetchNamesShift(),
    fetchMachineId(),
    fetchMachineIdPlasma(),
    fetchMachineIdDeburring(),
    fetchMachineIdDusting(),
    fetchWeight(),
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




const addWetJobRow = () => {
  // The first part of the subJobId, which is fixed at 1 for all jobs.
  const firstSubJobIdPart = 1;

  // Second part will be incremented for each new row
  const secondSubJobIdPart = editFormData.wetJobRows.length + 1;

  // Construct the subJobId based on the jobId and the parts
  const newSubJobId = `${editFormData.whiteSlipId}-${firstSubJobIdPart}-${secondSubJobIdPart}`;

  // Create the new row with the generated subJobId
  const newRow = {
    whiteSlipId: editFormData.whiteSlipId || '',
    subJobId: newSubJobId,
    productCode: '',
    binName: '',
    machineCode: '',
    binCode: '',
    shift: 'Day shift',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  // Add the new row to the wetJobRows array
  editFormData.wetJobRows.push(newRow);

  // Calculate avgTimeTaken based on weight if greater than 0
  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};

// Function to delete a wet job row
const deleteWetJobRow = (index: number) => {
  editFormData.wetJobRows.splice(index, 1);
};


const addDustingJobRow = () => {
  // The first part of the subJobId, which is fixed at 1 for all jobs.
  const firstSubJobIdPart = 3;

  // Second part will be incremented for each new row
  const secondSubJobIdPart = editFormData.dustingJobRows.length + 1;

  // Construct the subJobId based on the jobId and the parts
  const newSubJobId = `${editFormData.whiteSlipId}-${firstSubJobIdPart}-${secondSubJobIdPart}`;

  // Create the new row with the generated subJobId
  const newRow = {
    whiteSlipId: editFormData.whiteSlipId || '',
    subJobId: newSubJobId,
    productCode: '',
    binName: '',
    machineCode: '',
    binCode: '',
    shift: 'Day shift',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  // Add the new row to the dustingJobRows array
  editFormData.dustingJobRows.push(newRow);

  // Calculate avgTimeTaken based on weight if greater than 0
  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};

// Function to delete a dusting job row
const deleteDustingJobRow = (index: number) => {
  editFormData.dustingJobRows.splice(index, 1);
};

const addDeburringJobRow = () => {
  // The first part of the subJobId, which is fixed at 1 for all jobs.
  const firstSubJobIdPart = 2;

  // Second part will be incremented for each new row
  const secondSubJobIdPart = editFormData.deburringJobRows.length + 1;

  // Construct the subJobId based on the jobId and the parts
  const newSubJobId = `${editFormData.whiteSlipId}-${firstSubJobIdPart}-${secondSubJobIdPart}`;

  // Create the new row with the generated subJobId
  const newRow = {
    whiteSlipId: editFormData.whiteSlipId || '',
    subJobId: newSubJobId,
    productCode: '',
    binName: '',
    machineCode: '',
    binCode: '',
    shift: 'Day shift',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  // Add the new row to the deburringJobRowsdeburringJobRows array
  editFormData.deburringJobRows.push(newRow);

  // Calculate avgTimeTaken based on weight if greater than 0
  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};

// Function to delete a deburring job row
const deleteDeburringJobRow = (index: number) => {
  editFormData.deburringJobRows.splice(index, 1);
};


const addPlasmaJobRow = () => {
  // The first part of the subJobId, which is fixed at 1 for all jobs.
  const firstSubJobIdPart = 1;

  // Second part will be incremented for each new row
  const secondSubJobIdPart = editFormData.plasmaJobRows.length + 1;

  // Construct the subJobId based on the jobId and the parts
  const newSubJobId = `${editFormData.whiteSlipId}-${firstSubJobIdPart}-${secondSubJobIdPart}`;

  // Create the new row with the generated subJobId
  const newRow = {
    whiteSlipId: editFormData.whiteSlipId || '',
    subJobId: newSubJobId,
    productCode: '',
    binName: '',
    machineCode: '',
    binCode: '',
    shift: 'Day shift',
    minCapacity: 0,
    maxCapacity: 0,
    weight: 0,
    avgTimeTaken: '',
    status: 'Pending',
  };

  // Add the new row to the plasmaJobRows array
  editFormData.plasmaJobRows.push(newRow);

  // Calculate avgTimeTaken based on weight if greater than 0
  if (newRow.weight > 0) {
    const timePerKg = timeStringToSeconds(editFormData.totalTimeTaken);
    const totalSeconds = timePerKg * newRow.weight;
    newRow.avgTimeTaken = secondsToTimeString(totalSeconds);
  }
};

// Function to delete a deburring job row
const deletePlasmaJobRow = (index: number) => {
  editFormData.plasmaJobRows.splice(index, 1);
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

const submitAllPendingWetJobs = async () => {
  formSubmitted.value = true; // Mark form as submitted for validation

  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.wetJobRows.filter(row => row.status === 'Pending');

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
        jobId: editFormData.whiteSlipId,
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

      return axios.post(`http://10.87.0.33:8082/api/WetTreatment/SubmitWetTreatmentJob`, jobPayload)
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

    // Show error message
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the pending jobs. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};



const submitWetJobRow = async (row: any) => {
  formSubmitted.value = true; // Mark form as submitted for validation

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
      jobId: editFormData.whiteSlipId,
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
    const jobResponse = await axios.post(`http://10.87.0.33:8082/api/WetTreatment/SubmitWetTreatmentJob`, jobPayload);
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
    console.error('Error submitting machine job details:', error);

    // Show error message
    await Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the job details. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};

const submitAllPendingDustingJobs = async () => {
  formSubmitted.value = true;

  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.dustingJobRows.filter(row => row.status === 'Pending');

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
        jobId: editFormData.whiteSlipId,
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

      return axios.post(`http://10.87.0.33:8082/api/Dedusting/SubmitDedustingJob`, jobPayload)
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

    // Show error message
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the pending jobs. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};


const submitDustingJobRow = async (row: any) => {
  formSubmitted.value = true;

  // Validate Machine Name and Bin Name
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
      jobId: editFormData.whiteSlipId,
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
    const jobResponse = await axios.post(`http://10.87.0.33:8082/api/Dedusting/SubmitDedustingJob`, jobPayload);
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
    console.error('Error submitting machine job details:', error);

    // Show error message
    await Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the job details. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};

const submitAllPendingDeburringJobs = async () => {
  formSubmitted.value = true;

  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.deburringJobRows.filter(row => row.status === 'Pending');

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
        jobId: editFormData.whiteSlipId,
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

      return axios.post(`http://10.87.0.33:8082/api/Deburring/SubmitDeburringJob`, jobPayload)
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

    // Show error message
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the pending jobs. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};


const submitDeburringJobRow = async (row: any) => {
  formSubmitted.value = true;

  // Validate Machine Name and Bin Name
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
      jobId: editFormData.whiteSlipId,
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
    const jobResponse = await axios.post(`http://10.87.0.33:8082/api/Deburring/SubmitDeburringJob`, jobPayload);
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

  } catch (error) {
    console.error('Error submitting machine job details:', error);

    // Show error message
    await Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the job details. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};

const submitAllPendingPlasmaJobs = async () => {
  formSubmitted.value = true;

  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.plasmaJobRows.filter(row => row.status === 'Pending');

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
        jobId: editFormData.whiteSlipId,
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

      return axios.post(`http://10.87.0.33:8082/api/PlasmaTreatment/SubmitPlasmaTreatmentJob`, jobPayload)
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

    // Show error message
    Swal.fire({
      icon: 'error',
      title: 'Submission Failed',
      text: 'There was an error submitting the pending jobs. Please try again.',
      confirmButtonColor: '#d33',
    });
  }
};


const submitPlasmaJobRow = async (row: any) => {
  formSubmitted.value = true;

  // Validate Machine Name and Bin Name
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
      jobId: editFormData.whiteSlipId,
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
    const jobResponse = await axios.post(`http://10.87.0.33:8082/api/PlasmaTreatment/SubmitPlasmaTreatmentJob`, jobPayload);
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

  } catch (error) {
    console.error('Error submitting machine job details:', error);

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

  // If the job status is 'Completed', sum the weights of the bins and update editFormData.weight
  if (editFormData.jobStatus === 'Completed') {
    const totalBinWeight = Array.isArray(editFormData.listBins)
      ? editFormData.listBins.reduce((sum, bin) => sum + (bin.weight || 0), 0)
      : 0;
    editFormData.weight = totalBinWeight; // Set the total bin weight as the weight
  }

  const payload = {
    whiteSlipId: String(editFormData.whiteSlipId),
    shift: String(editFormData.shift),
    machineCode: String(editFormData.machineCode),
    productCode: String(editFormData.productCode),
    weight: editFormData.weight, // This will now be the sum of bin weights if jobStatus is 'Completed'
    waste: editFormData.waste,
    processedWeight: editFormData.processedWeight,
    wettreatmentrequired: Boolean(editFormData.wettreatmentrequired),
    plasmatreatmentrequired: Boolean(editFormData.plasmatreatmentrequired),
    dustingrequired: Boolean(editFormData.dustingrequired),
    deburringrequired: Boolean(editFormData.deburringrequired),
    jobStatus: String(editFormData.jobStatus),
    listBinsList: Array.isArray(editFormData.listBins) ? editFormData.listBins.map(item => ({
      mappingId: String(editFormData.whiteSlipId),
      binMasterId: item.binMasterId,
      subJobId: item.subJobId,
      type: item.type,
      weight: item.weight,
      capacityMin: item.capacityMin,
      capacityMax: item.capacityMax,
      reassignBinId: item.reassignBinId,
      movement: 'Secondary Process',
      status: item.status
    })) : [],

    // Filter bins based on movement types 'WET TREATMENT', 'PLASMA TREATMENT', 'DEDUSTING', 'DEBURRING'
    qcInspectionList: [{
      shift: editFormData.qcInspectionList?.shift || editFormData.shift || '',  // Default shift handling
      jobId: String(editFormData.whiteSlipId),
      jobStatus: editFormData.qcInspectionList?.jobStatus || editFormData.jobStatus || '',  // Default jobStatus handling
      binListforQCinspection: Array.isArray(editFormData.listBins) ? editFormData.listBins.map(bin => ({
        mappingId: String(editFormData.whiteSlipId),  // Use the whiteSlipId from the main object
        binMasterId: bin.binMasterId,
        subJobId: bin.subJobId,
        weight: bin.weight,  // Copy from binDataB
        capacityMin: bin.capacityMin,  // Copy capacityMin
        type: bin.type,  // Copy capacityMin
        capacityMax: bin.capacityMax,  // Copy capacityMax
        movement: 'Secondary Process',  // Use movement as is
        productCode: String(editFormData.productCode),  // Add productCode from the main object
      })) : []
    }],

    // Keeping the other lists as in your original code
    listMachinesList: editFormData.listMachines.map(machine => ({
      code: machine.code,
      type: machine.type,
      status: machine.status
    })),

    // Treatment lists
    wetTreatmentList: [{
      shift: editFormData.wetTreatmentList.shift,
      machineCode: editFormData.wetTreatmentList.machineCode,
      processedWeight: editFormData.wetTreatmentList.processedWeight,
      waste: editFormData.wetTreatmentList.waste,
      whiteSlipId: String(editFormData.whiteSlipId)
    }],
    plasmaTreatmentList: [{
      shift: editFormData.plasmaTreatmentList.shift,
      machineCode: editFormData.plasmaTreatmentList.machineCode,
      processedWeight: editFormData.plasmaTreatmentList.processedWeight,
      waste: editFormData.plasmaTreatmentList.waste,
      whiteSlipId: String(editFormData.whiteSlipId)
    }],
    dedustingList: [{
      shift: editFormData.dedustingList.shift,
      machineCode: editFormData.dedustingList.machineCode,
      processedWeight: editFormData.dedustingList.processedWeight,
      waste: editFormData.dedustingList.waste,
      whiteSlipId: String(editFormData.whiteSlipId)
    }],
    deburringList: [{
      shift: editFormData.deburringList.shift,
      machineCode: editFormData.deburringList.machineCode,
      processedWeight: editFormData.deburringList.processedWeight,
      waste: editFormData.deburringList.waste,
      whiteSlipId: String(editFormData.whiteSlipId)
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
          fetchMachineIdPlasma();
          fetchMachineIdDeburring();
          fetchMachineIdDusting();
          fetchWeight();
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
  const hasPendingOrSubmittedJobs = editFormData.wetJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );
  const hasPendingOrSubmittedJobsPlasma = editFormData.plasmaJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );
  const hasPendingOrSubmittedJobsDeburring = editFormData.deburringJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );
  const hasPendingOrSubmittedJobsDusting = editFormData.dustingJobRows.some(
    row => row.status === 'Pending' || row.status === 'Submitted'
  );



  // Disable if there are pending/submitted jobs or if bins list is empty or QC is incomplete
  return hasPendingOrSubmittedJobs || hasPendingOrSubmittedJobsPlasma || hasPendingOrSubmittedJobsDeburring || hasPendingOrSubmittedJobsDusting;
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
          <title>Secondary Process</title>
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




function calculateWaste(formData: any) {
  if (!formData.weight || !Array.isArray(formData.binDataBin)) {
    formData.waste = 0; // Default if data is missing
    return;
  }
  const totalBinWeight = formData.binDataBin.reduce((sum: any, bin: any) => sum + (bin.weight || 0), 0);
  formData.waste = formData.weight - totalBinWeight;
}


// Watch editFormData for changes in binDataBin or weight and recalculate waste
watch(
  () => [editFormData.weight, editFormData.binDataBin],
  () => calculateWaste(editFormData),
  { immediate: true, deep: true }
);

// Watch viewData for changes in binDataBin or weight and recalculate waste
watch(
  () => [viewData.weight, viewData.binDataBin],
  () => calculateWaste(viewData),
  { immediate: true, deep: true }
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
    <h2 class="mr-auto text-lg font-medium">Secondary Process</h2>

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
              <FormInput id="tabulator-html-filter-id" v-model="filter.whiteSlipId" type="text" class="mt-2 w-full"
                placeholder="Search Job ID..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="whiteSlipId">Job ID</Button>
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
          Edit Secondary Process
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
            <FormLabel htmlFor="time-picker-machine">Time Taken for Secondary Process per KG (HH:MM:SS)</FormLabel>
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
                    Weight<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Waste<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Weight</FormLabel>
                    <FormInput id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Total Weight"
                      step="any" disabled />

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
          <div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700" v-if="editFormData.wettreatmentrequired">
            <div class="flex justify-between items-center mb-3">
  <h6 class="text-lg font-medium leading-none dark:text-gray-300">Wet Treatment Job Details</h6>
  <button
    type="button"
    @click="submitAllPendingWetJobs"
    class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
  >
    Submit All Pending
  </button>
</div>
<hr class="dark:border-gray-700 mb-3">
  <div>
    <label class="dark:text-gray-300" for="wetWeight">Wet Treatment Weight:</label>
    <FormInput v-model="editFormData.wetWeight" type="number" disabled class="dark:bg-gray-800 dark:text-gray-300" />
  </div>
  <hr class="dark:border-gray-700" />
  <div v-if="editFormData.wetJobRows.length > 0" class="mt-3">
    <table class="min-w-full border-collapse rounded-lg shadow-sm">
      <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
        <tr>
          <th class="py-2 px-4 border-b text-center rounded-tl-lg dark:border-gray-700">No.</th>
          <th class="py-2 px-4 border-b text-center  dark:border-gray-700"></th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Machine Name</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Shift</th>
          <!-- <th class="py-2 px-4 border-b text-center dark:border-gray-700">Capacity</th> -->
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Avg Time Taken</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Status</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Delete</th>
          <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Submit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in editFormData.wetJobRows" :key="index"
          class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <td class="px-4 py-2 text-center dark:text-gray-300">
            {{index + 1}}
          </td>
          <td class="px-4 py-2 text-center dark:text-gray-300">
            <FormCheck>
              <FormCheck.Input type="checkbox" :value="index" :checked="selectedBinIndexWet === index"
                @change="toggleBinSelectionWet(index)" class="mx-auto dark:bg-gray-800 dark:border-gray-600" />
            </FormCheck>
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.subJobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleMachineCodeDropdownWet(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.machineCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.machineCode || 'Select a Machine Name' }}
    </div>
    <div v-if="isMachineCodeDropdownOpenWet[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchMachineCodeQueryWet[index]" placeholder="Search Machine Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="machineCode in filteredMachineOptionsForRowWet(index)" :key="machineCode"
          @click="selectMachineCodeWet(index, machineCode)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ machineCode }}
        </li>
        <li v-if="filteredMachineOptionsForRowWet(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.machineCode" class="text-red-500">Machine Name is required!</span>
</td>

<td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleBinCodeDropdownWet(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>
    <div v-if="isBinCodeDropdownOpenWet[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchBinCodeQueryWet[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForRow(index, 'wet')" :key="bin.id"
          @click="selectBinCodeWet(index, bin)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForRow(index, 'wet').length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormSelect v-model="row.shift"
              class="sm:mr-2 form-select mt-1 block w-full dark:bg-gray-800 dark:text-gray-300"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </td>
          <!-- <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.maxCapacity" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td> -->
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.weight" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.avgTimeTaken" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.status" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button @click="deleteWetJobRow(index)"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'"
              :class="{ 'text-gray-400': row.status === 'Completed' || row.status === 'Submitted', 'text-red-600 hover:text-red-800 dark:hover:text-red-400': row.status !== 'Completed' && row.status !== 'Submitted' }">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button type="button" @click="submitWetJobRow(row)"
              :class="{
                'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.status !== 'Completed' && row.status !== 'Submitted',
                'bg-gray-400 cursor-not-allowed': row.status === 'Completed' || row.status === 'Submitted'
              }" class="my-2 mx-2 px-4 py-2 text-white rounded" :disabled="row.status === 'Completed' || row.status === 'Submitted'">
              Submit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <button type="button" @click="addWetJobRow"
    class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
    Add Job Detail
  </button>
</div>


<div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700" v-if="editFormData.plasmatreatmentrequired">
  <div class="flex justify-between items-center mb-3">
  <h6 class="text-lg font-medium leading-none dark:text-gray-300">Plasma Treatment Job Details</h6>
  <button
    type="button"
    @click="submitAllPendingPlasmaJobs"
    class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
  >
    Submit All Pending
  </button>
</div>
<hr class="dark:border-gray-700 mb-3">
  <div>
    <label class="dark:text-gray-300" for="plasmaWeight">Plasma Treatment Weight:</label>
    <FormInput v-model="editFormData.plasmaWeight" type="number" disabled
      class="dark:bg-gray-800 dark:text-gray-300" />
  </div>
  <hr class="dark:border-gray-700" />
  <div v-if="editFormData.plasmaJobRows.length > 0" class="mt-3">
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
          <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Submit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in editFormData.plasmaJobRows" :key="index"
          class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <td class="px-4 py-2 text-center dark:text-gray-300">
            {{index + 1}}
          </td>
          <td class="px-4 py-2 text-center dark:text-gray-300">
            <FormCheck>
              <FormCheck.Input type="checkbox" :value="index" :checked="selectedBinIndexPlasma === index"
                @change="toggleBinSelectionPlasma(index)" class="mx-auto dark:bg-gray-800 dark:border-gray-600" />
            </FormCheck>
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.subJobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleMachineCodeDropdownPlasma(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.machineCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.machineCode || 'Select a Machine Name' }}
    </div>
    <div v-if="isMachineCodeDropdownOpenPlasma[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchMachineCodeQueryPlasma[index]" placeholder="Search Machine Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="machineCode in filteredMachineOptionsForRowPlasma(index)" :key="machineCode"
          @click="selectMachineCodePlasma(index, machineCode)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ machineCode }}
        </li>
        <li v-if="filteredMachineOptionsForRowPlasma(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.machineCode" class="text-red-500">Machine Name is required!</span>
</td>

<td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleBinCodeDropdownPlasma(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>
    <div v-if="isBinCodeDropdownOpenPlasma[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchBinCodeQueryPlasma[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForRowPlasma(index)" :key="bin.id"
          @click="selectBinCodePlasma(index, bin)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForRowPlasma(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormSelect v-model="row.shift"
              class="sm:mr-2 form-select mt-1 block w-full dark:bg-gray-800 dark:text-gray-300"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </td>
          <!-- <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.maxCapacity" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td> -->
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.weight" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.avgTimeTaken" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.status" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button @click="deletePlasmaJobRow(index)"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'"
              :class="{ 'text-gray-400': row.status === 'Completed' || row.status === 'Submitted', 'text-red-600 hover:text-red-800 dark:hover:text-red-400': row.status !== 'Completed' && row.status !== 'Submitted' }">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button type="button" @click="submitPlasmaJobRow(row)"
              :class="{
                'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.status !== 'Completed' && row.status !== 'Submitted',
                'bg-gray-400 cursor-not-allowed': row.status === 'Completed' || row.status === 'Submitted'
              }" class="my-2 mx-2 px-4 py-2 text-white rounded" :disabled="row.status === 'Completed' || row.status === 'Submitted'">
              Submit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <button type="button" @click="addPlasmaJobRow"
    class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
    Add Job Detail
  </button>
</div>


<div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700" v-if="editFormData.deburringrequired">
  <div class="flex justify-between items-center mb-3">
  <h6 class="text-lg font-medium leading-none dark:text-gray-300">Deburring Job Details</h6>
  <button
    type="button"
    @click="submitAllPendingDeburringJobs"
    class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
  >
    Submit All Pending
  </button>
</div>
<hr class="dark:border-gray-700 mb-3">
  <div>
    <label class="dark:text-gray-300" for="deburringWeight">Deburring Weight:</label>
    <FormInput v-model="editFormData.deburringWeight" type="number" disabled
      class="dark:bg-gray-800 dark:text-gray-300" />
  </div>
  <hr class="dark:border-gray-700" />
  <div v-if="editFormData.deburringJobRows.length > 0" class="mt-3">
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
          <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Submit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in editFormData.deburringJobRows" :key="index"
          class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <td class="px-4 py-2 text-center dark:text-gray-300">
            {{index + 1}}
          </td>
          <td class="px-4 py-2 text-center dark:text-gray-300">
            <FormCheck>
              <FormCheck.Input type="checkbox" :value="index" :checked="selectedBinIndexDeburring === index"
                @change="toggleBinSelectionDeburring(index)" class="mx-auto dark:bg-gray-800 dark:border-gray-600" />
            </FormCheck>
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.subJobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleMachineCodeDropdownDeburring(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.machineCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.machineCode || 'Select a Machine Name' }}
    </div>
    <div v-if="isMachineCodeDropdownOpenDeburring[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchMachineCodeQueryDeburring[index]" placeholder="Search Machine Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="machineCode in filteredMachineOptionsForDeburringRow(index)" :key="machineCode"
          @click="selectMachineCodeDeburring(index, machineCode)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ machineCode }}
        </li>
        <li v-if="filteredMachineOptionsForDeburringRow(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.machineCode" class="text-red-500">Machine Name is required!</span>
</td>

<td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleBinCodeDropdownDeburring(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>
    <div v-if="isBinCodeDropdownOpenDeburring[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchBinCodeQueryDeburring[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForDeburringRow(index)" :key="bin.id"
          @click="selectBinCodeDeburring(index, bin)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForDeburringRow(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormSelect v-model="row.shift"
              class="sm:mr-2 form-select mt-1 block w-full dark:bg-gray-800 dark:text-gray-300"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </td>
          <!-- <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.maxCapacity" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td> -->
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.weight" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.avgTimeTaken" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.status" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button @click="deleteDeburringJobRow(index)"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'"
              :class="{ 'text-gray-400': row.status === 'Completed' || row.status === 'Submitted', 'text-red-600 hover:text-red-800 dark:hover:text-red-400': row.status !== 'Completed' && row.status !== 'Submitted' }">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button type="button" @click="submitDeburringJobRow(row)"
              :class="{
                'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.status !== 'Completed' && row.status !== 'Submitted',
                'bg-gray-400 cursor-not-allowed': row.status === 'Completed' || row.status === 'Submitted'
              }" class="my-2 mx-2 px-4 py-2 text-white rounded" :disabled="row.status === 'Completed' || row.status === 'Submitted'">
              Submit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <button type="button" @click="addDeburringJobRow"
    class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
    Add Job Detail
  </button>
</div>

<div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700" v-if="editFormData.dustingrequired">
  <div class="flex justify-between items-center mb-3">
  <h6 class="text-lg font-medium leading-none dark:text-gray-300">Dedusting Job Details</h6>
  <button
    type="button"
    @click="submitAllPendingDustingJobs"
    class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
  >
    Submit All Pending
  </button>
</div>
<hr class="dark:border-gray-700 mb-3">
  <div>
    <label class="dark:text-gray-300" for="dustingWeight">Dedusting Weight:</label>
    <FormInput v-model="editFormData.dustingWeight" type="number" disabled
      class="dark:bg-gray-800 dark:text-gray-300" />
  </div>
  <hr class="dark:border-gray-700" />
  <div v-if="editFormData.dustingJobRows.length > 0" class="mt-3">
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
          <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Submit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in editFormData.dustingJobRows" :key="index"
          class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <td class="px-4 py-2 text-center dark:text-gray-300">
           {{ index + 1 }}
          </td>
          <td class="px-4 py-2 text-center dark:text-gray-300">
            <FormCheck>
              <FormCheck.Input type="checkbox" :value="index" :checked="selectedBinIndexDusting === index"
                @change="toggleBinSelectionDusting(index)" class="mx-auto dark:bg-gray-800 dark:border-gray-600" />
            </FormCheck>
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.subJobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleMachineCodeDropdownDusting(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.machineCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.machineCode || 'Select a Machine Name' }}
    </div>
    <div v-if="isMachineCodeDropdownOpenDusting[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchMachineCodeQueryDusting[index]" placeholder="Search Machine Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="machineCode in filteredMachineOptionsForDustingRow(index)" :key="machineCode"
          @click="selectMachineCodeDusting(index, machineCode)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ machineCode }}
        </li>
        <li v-if="filteredMachineOptionsForDustingRow(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.machineCode" class="text-red-500">Machine Name is required!</span>
</td>

<td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <div @click="toggleBinCodeDropdownDusting(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.status === 'Completed' || row.status === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>
    <div v-if="isBinCodeDropdownOpenDusting[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <input type="text" v-model="searchBinCodeQueryDusting[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForDustingRow(index)" :key="bin.id"
          @click="selectBinCodeDusting(index, bin)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForDustingRow(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormSelect v-model="row.shift"
              class="sm:mr-2 form-select mt-1 block w-full dark:bg-gray-800 dark:text-gray-300"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </td>
          <!-- <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.maxCapacity" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td> -->
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.weight" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.avgTimeTaken" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.status" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button @click="deleteDustingJobRow(index)"
              :disabled="row.status === 'Completed' || row.status === 'Submitted'"
              :class="{ 'text-gray-400': row.status === 'Completed' || row.status === 'Submitted', 'text-red-600 hover:text-red-800 dark:hover:text-red-400': row.status !== 'Completed' && row.status !== 'Submitted' }">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button type="button" @click="submitDustingJobRow(row)"
              :class="{
                'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.status !== 'Completed' && row.status !== 'Submitted',
                'bg-gray-400 cursor-not-allowed': row.status === 'Completed' || row.status === 'Submitted'
              }" class="my-2 mx-2 px-4 py-2 text-white rounded" :disabled="row.status === 'Completed' || row.status === 'Submitted'">
              Submit
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <button type="button" @click="addDustingJobRow"
    class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500">
    Add Job Detail
  </button>
</div>




          <!-- Show the filtered list of bins below the Job Status input -->


          <div v-if="editFormData.binDataBin && editFormData.binDataBin.length > 0">
  <h6 class="mb-2 mt-8 text-lg font-medium leading-none dark:text-gray-300">List of Bins</h6>
  <hr class="dark:border-gray-700" />

  <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
    <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
      <tr>
        <th class="py-2 px-4 border-b text-center w-auto dark:border-gray-700">No.</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin Name</th> <!-- Add Bin Name Column -->
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Job ID</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Action</th> <!-- New Action Column -->
      </tr>
    </thead>
    <tbody>
      <tr v-for="(bin, index) in editFormData.binDataBin" :key="bin.id"
        class="hover:bg-gray-100 dark:hover:bg-gray-100">
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ index + 1 }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.binName }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.subJobId }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.mappingId }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-200">{{ bin.weight }}</td>
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
          Edit Secondary Process
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
          View Secondary Process
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
                      Product Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Time Taken per KG
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
                      Waste
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.waste }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center" :class="{
                      'text-yellow-600': viewData.jobStatus === 'Pending',
                      'text-green-600': viewData.jobStatus === 'Completed',
                      'text-gray-700 dark:text-white': viewData.jobStatus !== 'Pending' && viewData.jobStatus !== 'Completed'
                    }">
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
                v-if="viewData.listBinsList.length > 0">

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

                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.wetJobRows.length > 0">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <!-- Title Row -->
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="9"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Wet Treatment Job Details
                      </th>
                    </tr>
                    <!-- Header Row -->
                    <tr>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Bin Name
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Sub Job ID
                      </th>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Shift
                      </th>
                      <!-- <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Capacity
                      </th> -->
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Weight
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Avg Time Taken
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Status
                      </th>
                    </tr>
                    <!-- Data Rows -->
                    <tr v-for="(row, index) in viewData.wetJobRows" :key="index"
                      class="hover:bg-gray-100 hover:dark:bg-gray-700">

                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.machineCode }}
                      </td>

                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                        {{ row.subJobId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.shift }}
                      </td>
                      <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.maxCapacity }}
                      </td> -->
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.avgTimeTaken }}
                      </td>
                      <td class="px-auto pr-3 text-center" :class="{
                        'text-yellow-500': row.status === 'Submitted',
                        'text-green-500': row.status === 'Completed',
                        'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                      }">
                        {{ row.status }}
                      </td>

                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.plasmaJobRows.length > 0">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <!-- Title Row -->
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="9"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Plasma Treatment Job Details
                      </th>
                    </tr>
                    <!-- Header Row -->
                    <tr>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Bin Name
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Sub Job ID
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Shift
                      </th>
                      <!-- <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Capacity
                      </th> -->
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Weight
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Avg Time Taken
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Status
                      </th>
                    </tr>
                    <!-- Data Rows -->
                    <tr v-for="(row, index) in viewData.plasmaJobRows" :key="index"
                      class="hover:bg-gray-100 hover:dark:bg-gray-700">
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.machineCode }}
                      </td>
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                        {{ row.subJobId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.shift }}
                      </td>
                      <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.maxCapacity }}
                      </td> -->
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.avgTimeTaken }}
                      </td>
                      <td class="px-auto pr-3 text-center" :class="{
                        'text-yellow-500': row.status === 'Submitted',
                        'text-green-500': row.status === 'Completed',
                        'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                      }">
                        {{ row.status }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.deburringJobRows.length > 0">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <!-- Title Row -->
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="9"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Deburring Job Details
                      </th>
                    </tr>
                    <!-- Header Row -->
                    <tr>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Bin Name
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Sub Job ID
                      </th>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Shift
                      </th>
                      <!-- <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Capacity
                      </th> -->
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Weight
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Avg Time Taken
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Status
                      </th>
                    </tr>
                    <!-- Data Rows -->
                    <tr v-for="(row, index) in viewData.deburringJobRows" :key="index"
                      class="hover:bg-gray-100 hover:dark:bg-gray-700">

                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.machineCode }}
                      </td>
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                        {{ row.subJobId }}
                      </td>

                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.shift }}
                      </td>
                      <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.maxCapacity }}
                      </td> -->
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.avgTimeTaken }}
                      </td>
                      <td class="px-auto pr-3 text-center" :class="{
                        'text-yellow-600': row.status === 'Submitted',
                        'text-green-600': row.status === 'Completed',
                        'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                      }">
                        {{ row.status }}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.dustingJobRows.length > 0">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <!-- Title Row -->
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="9"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Dusting Job Details
                      </th>
                    </tr>
                    <!-- Header Row -->
                    <tr>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Bin Name
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Sub Job ID
                      </th>

                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Shift
                      </th>
                      <!-- <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Capacity
                      </th> -->
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Weight
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Avg Time Taken
                      </th>
                      <th scope="row"
                        class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Status
                      </th>
                    </tr>
                    <!-- Data Rows -->
                    <tr v-for="(row, index) in viewData.dustingJobRows" :key="index"
                      class="hover:bg-gray-100 hover:dark:bg-gray-700">
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.machineCode }}
                      </td>
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                        {{ row.subJobId }}
                      </td>


                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.shift }}
                      </td>
                      <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.maxCapacity }}
                      </td> -->
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.avgTimeTaken }}
                      </td>
                      <td class="px-auto pr-3 text-center" :class="{
                        'text-yellow-600': row.status === 'Submitted',
                        'text-green-600': row.status === 'Completed',
                        'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                      }">
                        {{ row.status }}
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
                    Product Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken per KG
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.totalTimeTaken }}
                  </td>
                </tr>
              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
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
                    Waste
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.waste }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center" :class="{
                    'text-yellow-600': viewData.jobStatus === 'Pending',
                    'text-green-600': viewData.jobStatus === 'Completed',
                    'text-gray-700 dark:text-white': viewData.jobStatus !== 'Pending' && viewData.jobStatus !== 'Completed'
                  }">
                    {{ viewData.jobStatus }}
                  </td>
                </tr>



              </tbody>
            </table>

          </div>



        </div>

        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.wetJobRows.length > 0">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <!-- Title Row -->
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="9"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Wet Treatment Job Details
                </th>
              </tr>
              <!-- Header Row -->
              <tr>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Bin Name
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Sub Job ID
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Shift
                </th>
                <!-- <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Capacity
                </th> -->
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Weight
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Avg Time Taken
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Status
                </th>
              </tr>
              <!-- Data Rows -->
              <tr v-for="(row, index) in viewData.wetJobRows" :key="index"
                class="hover:bg-gray-100 hover:dark:bg-gray-700">

                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.machineCode }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                  {{ row.subJobId }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.shift }}
                </td>
                <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.maxCapacity }}
                </td> -->
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.weight }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.avgTimeTaken }}
                </td>
                <td class="px-auto pr-3 text-center" :class="{
                  'text-yellow-500': row.status === 'Submitted',
                  'text-green-500': row.status === 'Completed',
                  'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                }">
                  {{ row.status }}
                </td>

              </tr>
            </tbody>
          </table>
        </div>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.plasmaJobRows.length > 0">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <!-- Title Row -->
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="9"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Plasma Treatment Job Details
                </th>
              </tr>
              <!-- Header Row -->
              <tr>

                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Bin Name
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Sub Job ID
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Shift
                </th>
                <!-- <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Capacity
                </th> -->
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Weight
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Avg Time Taken
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Status
                </th>
              </tr>
              <!-- Data Rows -->
              <tr v-for="(row, index) in viewData.plasmaJobRows" :key="index"
                class="hover:bg-gray-100 hover:dark:bg-gray-700">
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.machineCode }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                  {{ row.subJobId }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.shift }}
                </td>
                <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.maxCapacity }}
                </td> -->
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.weight }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.avgTimeTaken }}
                </td>
                <td class="px-auto pr-3 text-center" :class="{
                  'text-yellow-500': row.status === 'Submitted',
                  'text-green-500': row.status === 'Completed',
                  'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                }">
                  {{ row.status }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.deburringJobRows.length > 0">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <!-- Title Row -->
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="9"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Deburring Job Details
                </th>
              </tr>
              <!-- Header Row -->
              <tr>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Bin Name
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Sub Job ID
                </th>


                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Shift
                </th>
                <!-- <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Capacity
                </th> -->
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Weight
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Avg Time Taken
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Status
                </th>
              </tr>
              <!-- Data Rows -->
              <tr v-for="(row, index) in viewData.deburringJobRows" :key="index"
                class="hover:bg-gray-100 hover:dark:bg-gray-700">

                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.machineCode }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                  {{ row.subJobId }}
                </td>

                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.shift }}
                </td>
                <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.maxCapacity }}
                </td> -->
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.weight }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.avgTimeTaken }}
                </td>
                <td class="px-auto pr-3 text-center" :class="{
                  'text-yellow-600': row.status === 'Submitted',
                  'text-green-600': row.status === 'Completed',
                  'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                }">
                  {{ row.status }}
                </td>
              </tr>

            </tbody>
          </table>
        </div>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.dustingJobRows.length > 0">
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <!-- Title Row -->
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="9"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Dusting Job Details
                </th>
              </tr>
              <!-- Header Row -->
              <tr>

                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Bin Name
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Sub Job ID
                </th>

                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Shift
                </th>
                <!-- <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Capacity
                </th> -->
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Weight
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Avg Time Taken
                </th>
                <th scope="row"
                  class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                  Status
                </th>
              </tr>
              <!-- Data Rows -->
              <tr v-for="(row, index) in viewData.dustingJobRows" :key="index"
                class="hover:bg-gray-100 hover:dark:bg-gray-700">
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.machineCode }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
                  {{ row.subJobId }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.shift }}
                </td>
                <!-- <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.maxCapacity }}
                </td> -->
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.weight }}
                </td>
                <td class="px-auto text-center text-gray-700 dark:text-white">
                  {{ row.avgTimeTaken }}
                </td>
                <td class="px-auto pr-3 text-center" :class="{
                  'text-yellow-600': row.status === 'Submitted',
                  'text-green-600': row.status === 'Completed',
                  'text-gray-700 dark:text-white': row.status !== 'Submitted' && row.status !== 'Completed'
                }">
                  {{ row.status }}
                </td>
              </tr>
            </tbody>
          </table>
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