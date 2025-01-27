<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, nextTick } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import printJS from 'print-js';
import LoadingIcon from "../base-components/LoadingIcon";


interface Response {
  machineId?: string;
  status?: string;
}

interface UserAccess {
  userId: string;
  deburringJob?: string[];
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
  machineId: "",
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
          title: "MACHINE ID",
          minWidth: 150,
          responsive: 0,
          field: "machineId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.machineId}</div>
              </div>`;
          },
        },

        {
          title: "STATUS",
          minWidth: 150,
          responsive: 0,
          field: "status",
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
                case 'Active':
                  statusClass = 'bg-teal-100 text-teal-800 border-teal-400 dark:text-teal-500';
                  break;
                case 'No Jobs':
                  statusClass = 'bg-sky-100 text-sky-800 border-sky-400 dark:text-sky-500';
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
            const machineCode = response.machineId;

            // Placeholder while data is being fetched
            container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

            getUserAccessData()
              .then((userAccessData) => {
                const loggedInUserId = localStorage.getItem("userId");
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";

                if (response.status !== "No Jobs" && userAccess) {
                  // Conditionally render "Edit" link
                  if (userAccess.deburringJob && userAccess.deburringJob.includes("Edit")) {
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
                      editRole(machineCode); // Pass machineId here
                    });
                    editLink.innerHTML = `<i class="fa-regular fa-pen-to-square mr-1"></i>Edit`;
                    container.appendChild(editLink);
                  }

                  // Conditionally render "View" link
                  if (userAccess.deburringJob && userAccess.deburringJob.includes("View")) {
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
                      viewRole(machineCode); // Pass machineId here
                    });
                    viewLink.innerHTML = `<i class="fa-regular fa-eye mr-1"></i>View`;
                    container.appendChild(viewLink);
                  }

                  // Conditionally render "Delete" link
                  if (userAccess.deburringJob && userAccess.deburringJob.includes("Delete")) {
                    const deleteLink = document.createElement("a");
                    deleteLink.classList.add(
                      "flex",
                      "items-center",
                      "text-danger",
                      "text-sm"
                    );
                    deleteLink.href = "javascript:;";
                    deleteLink.addEventListener("click", () => {
                      deleteRole(machineCode); // Pass machineId here
                    });
                    deleteLink.innerHTML = `<i class="fa-regular fa-trash-can mr-1"></i>Delete`;
                    container.appendChild(deleteLink);
                  }
                }

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

const machineId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("machineId", 'like', filter.machineId);
  }
};

const onStatus = () => {
  if (tabulator.value) {
    // Clear all filters first
    tabulator.value.clearFilter(true);

    // Apply filters based on the current state of the filter object
    if (filter.status) {
      tabulator.value.setFilter("status", '=', filter.status);
    }
    if (filter.value) {
      tabulator.value.setFilter("value", 'like', filter.value);
    }
    // Add other filters as needed
  }
};

// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    machineId: "",
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

const loading = ref(false); // Controls the visibility of the loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/Deburring/GetDeburringJobs';


onMounted(() => {
  loading.value = true; // Start loading animation

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: "Pending" status first, then by machineId in ascending order
      const sortedData = filteredData.sort((a: any, b: any) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;

        // Sort by machineId (numeric and alphabetical sorting)
        const machineIdA = a.machineId.match(/\d+|\D+/g);
        const machineIdB = b.machineId.match(/\d+|\D+/g);

        for (let i = 0; i < Math.max(machineIdA.length, machineIdB.length); i++) {
          const partA = machineIdA[i] || '';
          const partB = machineIdB[i] || '';

          if (!isNaN(parseInt(partA)) && !isNaN(parseInt(partB))) {
            const numA = parseInt(partA, 10);
            const numB = parseInt(partB, 10);
            if (numA !== numB) return numA - numB;
          }

          if (partA !== partB) return partA.localeCompare(partB);
        }

        return 0;
      });

      console.log(sortedData);
      if (tabulator.value) {
        tabulator.value.setData(sortedData);
      }
    }),

    // Additional async initialization functions
    fetchBinOptions(editFormData),
    fetchListBins(),
    fetchWM()
  ];

  // Wait for all promises to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading animation once all tasks are completed
    });

  // Initialize other synchronous functions if necessary
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



const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};

// Define binOptions with the correct type
const binOptions = ref<BinOption[]>([]);
interface BinOption {
  id: string;
  name: string;
  type: string;
  capacityMax: number;
  colour: string;
  // Add other fields from the API response if necessary
}

interface BinItem {
  binMasterId: string;
  weight: number;
  type: string;
  binName?: string;
  colour: string;
  capacityMax: number;
}

interface JobItem {
  jobId: string;
  subJobId: string;
  machineCode: string;
  binName: string;
  binMasterId?: string;
  binCode: string;
  productCode: string;
  shift: string;
  weight: string;
  status: string;
  bins: BinItem[];  // Add this line
  ipqcStarted: false // Add this flag for each job
  selectedBinIndex: number | null;
}

const viewData = reactive<{
  jobs: JobItem[];

}>({
  jobs: [], // Initialize as an empty array of JobItem
});

// Form Data
const editFormData = reactive<{
  jobs: JobItem[]; // The jobs array
  weightmachine: string; // The selected weight machine
  isWeightMachineDisabled: boolean; // Boolean flag for disabling weight machine input
  weightmachines: string[]; // Array of weight machine options
}>({
  jobs: [], // Initialize as an empty array of JobItem
  weightmachine: '', // Default value for weightmachine
  isWeightMachineDisabled: false, // Initial state for disabling weight machine
  weightmachines: [] as string[], // Initialize as an empty array of string
});

const isBinDropdownOpenMap = ref<{ [key: string]: boolean }>({});
const binSearchQueryMap = ref<{ [key: string]: string }>({}); // Track search query for each dropdown

// Toggle dropdown open/close
const toggleBinDropdown = (jobIndex: number, binIndex: number) => {
  const dropdownId = `${jobIndex}-${binIndex}`;
  isBinDropdownOpenMap.value[dropdownId] = !isBinDropdownOpenMap.value[dropdownId];
  binSearchQueryMap.value[dropdownId] = ''; // Reset search query when opening
};

// Helper function to select a bin option and close the dropdown
const selectBinOption = (jobIndex: number, binIndex: number, binId: string) => {
  const selectedBin = editFormData.jobs[jobIndex].bins[binIndex];
  selectedBin.binMasterId = binId; // Set the selected binMasterId
  updateBinDetails(jobIndex, binIndex); // Update details based on selection
  isBinDropdownOpenMap.value[`${jobIndex}-${binIndex}`] = false; // Close dropdown
};


const getBinName = (binMasterId: any) => {
  const matchedBin = binOptions.value.find((bin) => bin.id === binMasterId);
  return matchedBin ? matchedBin.name : 'Select a Bin Name'; // Default text if no match is found
};

// Define permission variables for deburringJob
let canEditDeburringJob = false;

// Define the fetchUserDeburringPermissions function
const fetchUserDeburringPermissions = async () => {
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

      const deburringJob = userDetails.deburringJob || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for deburringJob
      canEditDeburringJob = deburringJob.includes('Edit');

      console.log('canEditDeburringJob:', canEditDeburringJob); // Debugging log
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

// Call the fetchUserDeburringPermissions function to get permissions
fetchUserDeburringPermissions();

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

const syncWeight = async (jobIndex: any, binIndex: any) => {
  try {
    // Fetch weight from the machine based on the selected machine ID
    const response = await fetch(`http://10.87.0.33:8082/api/WarehouseRequest/GetWeightbyMachineId?MachineId=${editFormData.weightmachine}`);
    const data = await response.json();

    if (data.result === 'Table does not exist') {
      Swal.fire({
        icon: 'error',
        text: 'Table does not exist',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 5000,
        timerProgressBar: true,
        iconColor: 'red',
        background: '#fff',
      });
    } else if (response.ok) {
      // Parse the weight data
      const weight = parseFloat(data.result);
      if (!isNaN(weight)) {
        // Update the bin's weight for the specific job and bin index
        editFormData.jobs[jobIndex].bins[binIndex].weight = weight;

        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Weight Synced Successfully',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          iconColor: 'green',
          background: '#fff',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to sync weight',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 5000,
        timerProgressBar: true,
        iconColor: 'red',
        background: '#fff',
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'API request failed',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      iconColor: 'red',
      background: '#fff',
    });
  }
};

interface ListBin {
  binMasterId: string;
  subJobId: string;
  mappingId: string;
  colour: string;
  weight: number;
  capacityMax: number;
  type: string;
}

// Method to toggle bin selection for a specific job
const toggleBinSelection = (jobIndex: number, binIndex: number) => {
  const job = editFormData.jobs[jobIndex];

  if (job.selectedBinIndex === binIndex) {
    job.selectedBinIndex = null; // Unselect if already selected
    isBinDropdownOpenMap.value = {}; // Close all dropdowns
  } else {
    job.selectedBinIndex = binIndex; // Select the bin
    toggleBinDropdown(jobIndex, binIndex); // Open the bin dropdown
    focusBinSelect(jobIndex, binIndex); // Focus the bin select element
  }
};

// Focus the <select> element
const focusBinSelect = async (jobIndex: number, binIndex: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelect-${jobIndex}-${binIndex}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};


const fetchBinOptions = async (formData: any) => {
  try {
    // Fetch the bin master data
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const binMasterData = binMasterResponse.data.result;

    // Fetch the list bins data
    const listBinsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const listBinsData = listBinsResponse.data.result;

    // Create a map of binMasterId to weight for bins with weight > 0
    const listBinsMap = new Map(
      listBinsData
      .filter((bin: any) => bin.weight > 0 || bin.status === 'Save')
        .map((bin: any) => [bin.binMasterId, bin.weight])
    );

    // Collect all binMasterIds from listBinforWT in formData.jobs
    const submittedBinMasterIds = new Set(
      formData.jobs.flatMap((job: any) =>
        job.bins.map((bin: any) => bin.binMasterId)
      )
    );

    // Filter the bin master data to include:
    // 1. Bins of type 'Wet Treatment'
    // 2. Bins not in listBinsMap (i.e., weight <= 0) OR bins that were previously submitted
    binOptions.value = binMasterData.filter((bin: any) => {
      return (
        bin.type.toLowerCase() === 'deburring' &&
        (!listBinsMap.has(bin.id) || submittedBinMasterIds.has(bin.id)) // Include submitted bins
      );
    });

    console.log('Filtered Bin Options:', binOptions.value);
  } catch (error) {
    console.error('Error fetching bin options:', error);
  }
};


const listBins = ref<ListBin[]>([]);

// Fetch data from ListBins API
const fetchListBins = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/ListBins');

    // Only include bins with type 'Machine Station'
    listBins.value = response.data.result.filter((bin: ListBin) => bin.type === 'Machine Station' || bin.type === 'Production');

  } catch (error) {
    console.error('Error fetching ListBins data:', error);
  }
};

const updateBinsForJob = (jobIndex: number) => {
  const job = editFormData.jobs[jobIndex];

  // Filter the listBins to find bins matching the jobId (mappingId matches job.jobId)
  const matchingBins = listBins.value.filter(bin => bin.mappingId === job.jobId && bin.subJobId === job.subJobId);

  // Ensure bins array is initialized if it's not present
  if (!job.bins) {
    job.bins = [];
  }

  // Iterate over the matching bins and add/update them in the job's bins array
  matchingBins.forEach(binData => {
    // Check if this bin is already present in the bins array by binMasterId
    const existingBin = job.bins.find(bin => bin.binMasterId === binData.binMasterId);

    if (existingBin) {
      // Update the existing bin's weight and other details
      existingBin.weight = binData.weight;
      existingBin.type = 'Machine Station';  // Assuming the type is always 'Machine Station'
    } else {
      // Add the new bin to the bins array
      job.bins.push({
        binMasterId: binData.binMasterId,
        weight: binData.weight,
        type: 'Machine Station',
        colour: binData.colour || '',  // Assign colour if available
        capacityMax: binData.capacityMax || 0,  // Assign capacityMax if available
      });
    }
  });
};

const totalBinWeight = (jobIndex: number) => {
  // Ensure bin.weight is parsed as a float and handle any invalid values (e.g., NaN)
  const totalWeight = editFormData.jobs[jobIndex].bins.reduce((sum, bin) => {
    const weight = parseFloat(String(bin.weight)) || 0; // Convert weight to float, default to 0 if invalid
    return sum + weight;
  }, 0);

  return parseFloat(totalWeight.toFixed(4)); // Apply toFixed after summing up
};

const remainingWeight = (jobIndex: number) => {
  const jobWeight = parseFloat(editFormData.jobs[jobIndex].weight) || 0; // Ensure job weight is a valid float
  const totalBinWeightValue = totalBinWeight(jobIndex);
  return parseFloat((jobWeight - totalBinWeightValue).toFixed(4)); // Return the remaining weight rounded to 4 decimals
};



// Method to add a bin field to a job
const addBinField = (jobIndex: number) => {
  if (!editFormData.jobs[jobIndex]) {
    console.error(`Job at index ${jobIndex} not found`);
    return;
  }

  if (!editFormData.jobs[jobIndex].bins) {
    editFormData.jobs[jobIndex].bins = [];
  }

  // Check if this is the first bin being added
  const isFirstBin = editFormData.jobs[jobIndex].bins.length === 0;

  editFormData.jobs[jobIndex].bins.push({
    binMasterId: isFirstBin ? editFormData.jobs[jobIndex].binMasterId || '' : '',
    binName: isFirstBin ? editFormData.jobs[jobIndex].binName || '' : '', // Default to job's binName if first bin
    weight: isFirstBin ? Number(editFormData.jobs[jobIndex].weight) || 0 : 0, // Ensure weight is a number
    type: 'Deburring', // Default type
    colour: '', // Default empty value
    capacityMax: 0, // Default empty value
  });

  // Update bins based on the jobId if needed
  updateBinsForJob(jobIndex);
};




const deleteBinField = (jobIndex: number, binIndex: number): void => {
  const job = editFormData.jobs[jobIndex];
  if (!job || !job.bins || job.bins.length <= binIndex) {
    console.error(`Invalid job or bin index: jobIndex=${jobIndex}, binIndex=${binIndex}`);
    return;
  }

  const bin = job.bins[binIndex];

  // Check if the bin has a binMasterId and subJobId
  const isFetchedBin = bin.binMasterId && job.subJobId;

  if (isFetchedBin) {
    console.log(`Attempting to delete fetched bin with binMasterId=${bin.binMasterId} and subJobId=${job.subJobId}`);

    // Fetch ListBins to find the matching bin ID for deletion
    axios.get('http://10.87.0.33:8082/api/ListBins')
      .then(response => {
        const listBins = response.data.result || [];

        const matchedBin = listBins.find((fetchedBin: any) =>
          fetchedBin.binMasterId === bin.binMasterId &&
          fetchedBin.subJobId === job.subJobId
        );

        if (matchedBin) {
          console.log(`Matched Bin ID: ${matchedBin.id}`);

          // Show confirmation alert before deleting the matched bin
          Swal.fire({
            title: 'Are you sure?',
            text: 'You will not be able to recover this data!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e40af',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
          }).then((result) => {
            if (result.isConfirmed) {
              // Delete the bin using the API
              axios.delete(`http://10.87.0.33:8082/api/ListBins/${matchedBin.id}`)
                .then(() => {
                  console.log(`Bin with ID ${matchedBin.id} deleted successfully`);
                  // Remove the bin from the local array after successful deletion
                  job.bins.splice(binIndex, 1);
                  // Refresh the fetched data to reflect changes
                  fetchAndSetData(job.machineCode, editFormData, () => {}, false);

                  // Show success toast alert for API-based deletion
                  Swal.fire({
                    icon: 'success',
                    title: 'Bin Deleted Successfully',
                    showConfirmButton: false,
                    timer: 3000,
                    position: 'top-end',
                    iconColor: 'green',
                    toast: true,
                    background: '#fff',
                  });
                })
                .catch(error => {
                  console.error(`Error deleting bin with ID ${matchedBin.id}:`, error);
                });
            }
          });
        } else {
          // No matching bin found, delete it directly from the row without showing a success toast
          console.warn(`No matching bin found for binMasterId=${bin.binMasterId} and subJobId=${job.subJobId}`);
          job.bins.splice(binIndex, 1);
          console.log(`Deleted locally as no match was found.`);
        }
      })
      .catch(error => {
        console.error('Error fetching bins for deletion:', error);
        // In case of error fetching bins, allow direct deletion without showing a success toast
        job.bins.splice(binIndex, 1);
        console.log(`Deleted locally due to error fetching bins.`);
      });
  } else {
    // If the bin is locally added or missing binMasterId/subJobId, delete it directly without showing a success toast
    console.log(`Deleting locally added bin at index ${binIndex}`);
    job.bins.splice(binIndex, 1);
  }
};




// Method to update bin details based on selected binMasterId
const updateBinDetails = (jobIndex: number, binIndex: number) => {
  const selectedBin = editFormData.jobs[jobIndex].bins[binIndex];

  // Use the BinOption type or undefined if the item isn't found
  const binDetail = binOptions.value.find(bin => bin.id === selectedBin.binMasterId);

  if (binDetail) {
    selectedBin.type = binDetail.type;
    selectedBin.colour = binDetail.colour;
    selectedBin.capacityMax = binDetail.capacityMax;
  }
};


// Filtered bin options for each row to exclude already selected binMasterIds
// Adjust `filteredBinOptions` to add `job.binName` and search filter
const filteredBinOptions = (jobIndex: number, binIndex: number) => {
  const job = editFormData.jobs[jobIndex];
  const bin = job.bins[binIndex];
  const selectedBinId = bin.binMasterId;
  const selectedBins = editFormData.jobs.flatMap(job => job.bins.map(bin => bin.binMasterId)).filter(Boolean);

  // Filter options, and ensure the current selection is always included
  let options = binOptions.value.filter(
    (option) =>
      (!selectedBins.includes(option.id) || option.id === selectedBinId) &&
      (!binSearchQueryMap.value[`${jobIndex}-${binIndex}`] ||
        option.name.toLowerCase().includes(binSearchQueryMap.value[`${jobIndex}-${binIndex}`].toLowerCase()))
  );

  // Include `job.binMasterId` as value and `job.binName` as display name
  if (job.binMasterId && job.binName && !options.some(option => option.id === job.binMasterId)) {
    options.unshift({
      id: job.binMasterId,   // Use binMasterId as the actual value
      name: job.binName,     // Display name from BinMaster
      type: 'Default Type',        // Placeholder or actual value
      capacityMax: 0,              // Placeholder or actual value
      colour: 'Default Colour'     // Placeholder or actual value
    });
  }

  return options;
};
// Computed method to check if the Start IPQC button should be disabled for that row only
const isRowIPQCDisabled = (jobIndex: number, binIndex: number) => {
  const job = editFormData.jobs[jobIndex];
  const bin = job.bins[binIndex];

  // Disable if binMasterId or weight is missing
  if (!bin.binMasterId || bin.weight <= 0) {
    return true;
  }

  // Check if both conditions are met:
  // 1. binMasterId from ListBins matches binMasterId from this row
  // 2. mappingId from ListBins matches job.jobId
  return listBins.value.some(listBin => listBin.binMasterId === bin.binMasterId && listBin.subJobId === job.subJobId && listBin.mappingId === job.jobId);
};

const isBinSubmitted = (jobIndex: number, binIndex: number) => {
  const job = editFormData.jobs[jobIndex];
  const bin = job.bins[binIndex];

  // Check if binMasterId from ListBins matches binMasterId from this row
  // and if mappingId from ListBins matches job.jobId
  return listBins.value.some(listBin => listBin.binMasterId === bin.binMasterId && listBin.subJobId === job.subJobId && listBin.mappingId === job.jobId);
};



const viewStatus = computed(() => {
  // Determine the status for viewData
  if (viewData.jobs.some(job => job.status === 'Submitted' || job.status === 'Pending')) {
    return 'Pending';
  } else if (viewData.jobs.every(job => job.status === 'Completed')) {
    return 'Completed';
  }
  return 'Unknown';
});

const editStatus = computed(() => {
  // Determine the status for editFormData
  if (editFormData.jobs.some(job => job.status === 'Submitted' || job.status === 'Pending')) {
    return 'Pending';
  } else if (editFormData.jobs.every(job => job.status === 'Completed')) {
    return 'Completed';
  }
  return 'Unknown';
});

const overallStatus = computed(() => {
  // Combine the statuses
  if (viewStatus.value === 'Pending' || editStatus.value === 'Pending') {
    return 'Pending';
  } else if (viewStatus.value === 'Completed' && editStatus.value === 'Completed') {
    return 'Completed';
  }
  return 'Unknown';
});






const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => { editModal.value = value; };
// Watch for changes to editModal
watch(editModal, (newValue, oldValue) => {
  if (!newValue) { // If editModal becomes false
    fetchBinOptions(editFormData); // Run fetchBinOptions again
  }
});

// Utility function for error handling
const handleError = (error: any, message: any) => {
  console.error(message, error);
  Swal.fire({
    icon: 'error',
    title: 'Operation Failed',
    text: message,
  });
};
const setJobBinNameFromListBins = (jobs: any, listBins: any, binMaster: any) => {
  jobs.forEach((job: any) => {
    // Find the matching bin in listBins using job.binCode to get binMasterId
    const matchedBin = listBins.find((bin: any) => bin.id === job.binCode);

    if (matchedBin) {
      job.binMasterId = matchedBin.binMasterId; // Store binMasterId as value

      // Find the corresponding name in BinMaster using binMasterId
      const matchedBinMaster = binMaster.find((master: any) => master.id === matchedBin.binMasterId);

      if (matchedBinMaster) {
        job.binName = matchedBinMaster.name; // Display the name from BinMaster
      }
    }
  });
};


// Fetch and Set Data for Edit/View without using ID directly in the URL
const fetchAndSetData = (machineCode: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  loading.value = true; // Show loading animation

  axios.get(`http://10.87.0.33:8082/api/Deburring/GetDeburringDetailsbyMachineCode/${machineCode}`)
    .then(response => {
      const data = response.data.result;

      if (data && data.length > 0) {
        const filteredData = data.filter((item: JobItem) => item.status !== 'Completed');

        const initializedJobs = filteredData.map((job: any) => ({
          ...job,
          bins: job.listBinforDB || [], // Replace listBinforWT with listBinforDB
        }));

        formData.jobs = initializedJobs as JobItem[];

        // Fetch ListBins and BinMaster data in parallel
        axios.all([
          axios.get('http://10.87.0.33:8082/api/ListBins'),
          axios.get('http://10.87.0.33:8082/api/BinMaster')
        ]).then(axios.spread((listBinsResponse, binMasterResponse) => {
          const listBins = listBinsResponse.data.result;
          const binMaster = binMasterResponse.data.result;

          // Map binMasterId to bin names
          const binMasterMap = new Map(binMaster.map((bin: any) => [bin.id, bin.name]));

          // Update bins with bin names
          formData.jobs.forEach((job: any) => {
            job.bins.forEach((bin: any) => {
              bin.binName = binMasterMap.get(bin.binMasterId) || 'Unknown Bin';
            });
          });

          setJobBinNameFromListBins(formData.jobs, listBins, binMaster);

          fetchBinOptions(formData);
          modalSetter(true); // Open modal after data is loaded
        })).catch(error => {
          console.error('Error fetching ListBins or BinMaster data:', error);
        }).finally(() => {
          loading.value = false; // Hide loading animation once all nested API calls are completed
        });
      } else {
        console.error('No data found for the specified Machine ID:', machineCode);
        loading.value = false; // Hide loading animation if no data is found
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      loading.value = false; // Hide loading animation if error occurs
    });
};







const editRole = (machineCode: string) => fetchAndSetData(machineCode, editFormData, seteditModal);
const viewRole = (machineCode: string) => fetchAndSetData(machineCode, editFormData, setviewModal, true);


// The refreshData method will re-fetch the data
const refreshData = () => {
  // Re-fetch the data and update the modal content
  fetchAndSetData(editFormData.jobs[0]?.machineCode, editFormData, seteditModal);

  // Also run fetchBinOptions to refresh bin options
  fetchBinOptions(editFormData);
};

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Start loading animation

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: "Pending" status first, then by machineId in ascending order
      const sortedData = filteredData.sort((a: any, b: any) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;

        // Sort by machineId (numeric and alphabetical sorting)
        const machineIdA = a.machineId.match(/\d+|\D+/g);
        const machineIdB = b.machineId.match(/\d+|\D+/g);

        for (let i = 0; i < Math.max(machineIdA.length, machineIdB.length); i++) {
          const partA = machineIdA[i] || '';
          const partB = machineIdB[i] || '';

          if (!isNaN(parseInt(partA)) && !isNaN(parseInt(partB))) {
            const numA = parseInt(partA, 10);
            const numB = parseInt(partB, 10);
            if (numA !== numB) return numA - numB;
          }

          if (partA !== partB) return partA.localeCompare(partB);
        }

        return 0;
      });

      console.log(sortedData);
      if (tabulator.value) {
        tabulator.value.setData(sortedData);
      }
    }),

    // Additional async initialization functions
    fetchBinOptions(editFormData),
    fetchListBins(),
    fetchWM()
  ];

  // Wait for all promises to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading animation once all tasks are completed
    });

  // Initialize other synchronous functions if necessary
  initTabulator();
  reInitOnResizeWindow();
};






const updateJobStatus = async (jobId: string, subJobId: string, machineId: string) => {
  const job = editFormData.jobs.find(j => j.jobId === jobId && j.subJobId === subJobId);

  // Ensure at least one bin is added
  if (!job || !job.bins || job.bins.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Add at least one bin',
      text: 'You need to add at least one bin before completing the job.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  const hasInvalidBin = job.bins.some(
  bin =>
    (!getBinName(bin.binMasterId) || getBinName(bin.binMasterId) === 'Select a Bin Name' || !bin.weight) &&
    (!job.binName || job.binName === 'Select a Bin Name')
);
  if (hasInvalidBin) {
    Swal.fire({
      icon: 'warning',
      title: 'Bin Name and Weight Required',
      text: 'All bins must have a bin name and a weight before completing the job.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  const payload = {
    jobId,
    subJobId,
    machineId,
  };

  console.log('Job Status Payload:', JSON.stringify(payload, null, 2));

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will update the job status and add bins!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, update it!',
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    // Step 1: Submit each unique bin using SaveTempListBinsfromJobs API
    for (const bin of job.bins) {
      const binPayload = {
        mappingId: jobId,
        subJobId,
        binMasterId: bin.binMasterId,
        type: bin.type || 'Deburring',
        weight: bin.weight || 0,
      };

      console.log('Submitting bin payload to SaveTempListBinsfromJobs:', JSON.stringify(binPayload, null, 2));

      await axios.post(
        'http://10.87.0.33:8082/api/ListBins/SaveTempListBinsfromJobs',
        binPayload
      ).then(response => {
        console.log(`Bin saved successfully: ${response.data}`);
      }).catch(error => {
        console.error('Error saving bin:', error);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Save Bin',
          text: 'There was an error saving the bin. Please try again.',
        });
        return;
      });
    }

    // Step 2: Update the job status
    const jobStatusResponse = await axios.post('http://10.87.0.33:8082/api/Deburring/UpdateDeburringJobStatus', payload);
    if (jobStatusResponse.status === 200) {
      job.status = 'Completed';

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
      });

      // Step 3: Fetch existing bins using the job.binCode
      const listBinResponse = await axios.get(`http://10.87.0.33:8082/api/ListBins/${job.binCode}`);
      const existingBins = listBinResponse.data.result;

      console.log('Fetched bin data for binCode:', job.binCode, existingBins);

      // Step 4: Update each fetched bin with weight set to 0
      for (const bin of existingBins) {
        const updatedBin = {
          ...bin,
          weight: 0, // Set weight to 0
          movement: 'Deburring' // Set movement to Deburring
        };

        console.log('Updating Bin Payload with weight 0:', JSON.stringify(updatedBin, null, 2));

        await axios.put(`http://10.87.0.33:8082/api/ListBins/${bin.id}`, updatedBin)
          .then(response => {
            console.log(`Bin with ID ${bin.id} updated successfully with weight 0`, response.data);
          })
          .catch(error => {
            console.error(`Error updating bin with ID ${bin.id}:`, error);
          });
      }

      addBinsToJob(job, job.bins);
      fetchListBins(); // Refresh bin list
      updateTableData(); // Refresh job table
    } else {
      console.error('Error updating job status:', jobStatusResponse);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Update Job Status',
        text: 'There was an error updating the job status. Please try again.',
      });
    }
  } catch (error) {
    console.error('Error during job status update:', error);
    Swal.fire({
      icon: 'error',
      title: 'Failed!',
      text: 'There was an error updating the job status or bins. Please try again.',
    });
  }
};

const saveTempListBins = async (jobId: string, subJobId: string, machineId: string, jobIndex: number) => {
  const job = editFormData.jobs[jobIndex];

  // Ensure there are bins to save
  if (!job || !job.bins || job.bins.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Add at least one bin',
      text: 'You need to add at least one bin before saving.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  // Validation: Check if all bin names are filled and not 'Select a Bin Name'
   // Validation: Check if all bin names are filled
   const hasInvalidBinName = job.bins.some(
  bin =>
    (!getBinName(bin.binMasterId) || getBinName(bin.binMasterId) === 'Select a Bin Name' || !bin.weight) &&
    (!job.binName || job.binName === 'Select a Bin Name')
);
  if (hasInvalidBinName) {
    Swal.fire({
      icon: 'warning',
      title: 'Bin Name Required',
      text: 'All bins must have a valid bin name before saving.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will save the bins data.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, save it!',
  });

  if (!result.isConfirmed) {
    return;
  }

  try {
    const uniqueBins = job.bins.reduce((unique: any[], bin: any) => {
      const isDuplicate = unique.some(uBin => uBin.binMasterId === bin.binMasterId && uBin.mappingId === bin.mappingId);
      if (!isDuplicate) {
        unique.push(bin);
      }
      return unique;
    }, []);

    console.log(`Deduplicated bins for subJobId ${subJobId}:`, uniqueBins);

    for (const bin of uniqueBins) {
      const binPayload = {
        mappingId: jobId,
        subJobId: job.subJobId,
        binMasterId: bin.binMasterId,
        type: bin.type || 'Deburring',
        weight: bin.weight || 0,
      };

      console.log('Submitting bin payload:', JSON.stringify(binPayload, null, 2));

      await axios.post('http://10.87.0.33:8082/api/ListBins/SaveTempListBinsfromJobs', binPayload);
    }

    Swal.fire({
      icon: 'success',
      title: 'Saved Successfully',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: 'top-end',
      iconColor: 'green',
      toast: true,
      background: '#fff',
    });

    updateTableData(); // Refresh the UI after save
  } catch (error) {
    console.error('Error saving bins:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error Saving Bins',
      text: 'There was an issue saving the bins. Please try again later.',
      confirmButtonColor: '#d33',
    });
  }
};



const addBinsToJob = (job: any, bins: any[]) => {
  if (bins) {
    bins.forEach((bin, index) => {
      const binPayload = {
        mappingId: job.jobId,
        binMasterId: bin.binMasterId,
        subJobId: job.subJobId,
        type: 'Deburring',
        weight: bin.weight,
        movement: bin.type,
        colour: bin.colour,
        capacityMin: 0, // Adjust if necessary
        capacityMax: bin.capacityMax,
        reassignBinId: '',
        productCode: job.productCode,
        dimensionCheck: '',
        functionalCheck: '',
        visualCheck1: '',
        visualCheck2: '',
        visualCheck3: '',
        room: ''
      };

      // Log the payload before sending the request
      console.log('Submitting payload for adding bin:', binPayload);

      axios.post('http://10.87.0.33:8082/api/ListBins/AddListBinsfromDeburringJobs', binPayload)
        .then(response => {
          console.log('Bin added:', response.data);
          // Fetch the updated ListBins to disable the Start IPQC button
          fetchListBins();
        })
        .catch(error => {
          console.error('Error adding bin:', error);
        });
    });
  }
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
      machineCode: subJobDetail.machineCode,
    };

    const response = await axios.post('http://10.87.0.33:8082/api/Production/SubmitJob', payload);
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
};

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
  const el = toPrint.value;
  if (el) {
    const newPrint = window.open("", "_blank");

    if (newPrint) {
      newPrint.document.write(`
        <html>
          <head>
            <title>Goods Receiving Quality Check</title>
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
                .text-green-700 {
                  color: #166534;
                }
                .text-cyan-600 {
                  color: #155e75;
                }
                .text-red-600 {
                  color: #991b1b;
                }
                .text-red-700 {
                  color: #991b1b;
                }
                .text-orange-600 {
                  color: #9a3412;
                }
                .text-yellow-700 {
                  color: #a16207;
                }
                .action {
                  display: none;
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
    <h2 class="mr-auto text-lg font-medium">Deburring Job</h2>

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
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Machine ID</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.machineId" type="text" class="mt-2 w-full"
                placeholder="Search Machine ID..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="machineId">Machine ID</Button>
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
:staticBackdrop="true" size="2xl" :open="editModal" @close="() => {
    seteditModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          Edit Deburring Job
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

        <div>
          <!-- Display Machine ID and Overall Status -->
          <div class="relative overflow-x-auto sm:rounded-lg">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Machine ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ editFormData.jobs[0]?.machineCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ overallStatus }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table for Jobs -->
          <div class="relative overflow-x-auto sm:rounded-lg mt-8">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List of Jobs
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Job ID
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Powder ID
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Bin Name
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Loop through jobs -->
                <template v-for="(job, jobIndex) in editFormData.jobs" :key="job.jobId">
                  <tr class="group">
                    <!-- Display Job Index -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ jobIndex + 1 }}
                    </td>
                    <!-- Display Job ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.jobId }}
                    </td>
                    <!-- Display Sub Job ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.subJobId }}
                    </td>
                    <!-- Display Sub Job ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.productCode }}
                    </td>
                    <!-- Display Bin Code -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.binName || 'N/A' }}
                    </td>
                    <!-- Display Shift -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.shift }}
                    </td>
                    <!-- Display Weight -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.weight }}
                    </td>
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.status === 'Submitted' ? 'Pending' : job.status }}
                    </td>
                    <!-- Update Job Status Button -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      <button v-if="job.status !== 'Completed'" @click="addBinField(jobIndex)"
                        class="bg-green-500 hover:bg-green-700 my-2 mx-2 px-4 py-2 text-white rounded">
                        Add Bin
                      </button>
                      <button v-if="job.status !== 'Completed'" @click="saveTempListBins(job.jobId, job.subJobId, job.machineCode, jobIndex)"
                        class="bg-orange-500 hover:bg-orange-700 my-2 mx-2 px-4 py-2 text-white rounded">
                        Save
                      </button>
                      <button v-if="job.status !== 'Completed'"
                        @click="updateJobStatus(job.jobId, job.subJobId, job.machineCode)"
                        class="bg-blue-700 hover:bg-blue-900 my-2 mx-2 px-4 py-2 text-white rounded">
                        Completed
                      </button>
                    </td>
                  </tr>
                  <!-- Display additional bin fields in a table -->
                  <tr v-if="job.bins && job.bins.length > 0">
                    <td colspan="9">
                      <h3 class="text-lg font-bold mt-4 mb-2 flex items-center">
                        <span class="pr-10">List Bin</span>
                        <span :class="remainingWeight(jobIndex) === 0 ? 'text-green-500' : 'text-red-500'"
                          class="text-sm font-normal">
                          Total Weight: {{ totalBinWeight(jobIndex) }}
                        </span>
                        <span :class="remainingWeight(jobIndex) === 0 ? 'pl-3 text-green-500' : 'pl-3 text-red-500'"
                          class="text-sm font-normal">
                          Remaining Weight: {{ remainingWeight(jobIndex) }}kg
                        </span>
                      </h3>

                      <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400 border">
                        <thead class="bg-gray-200 dark:bg-gray-700">
                          <tr>
                            <th class="px-4 py-2">No.</th>
                            <th class="px-4 py-2"></th>
                            <th class="px-4 py-2">Bin Name</th>
                            <th class="px-4 py-2 medium-width">Weight</th>
                            <th class="px-4 py-2 hidden">Type</th>
                            <th class="px-4 py-2 hidden">Colour</th>
                            <th class="px-4 py-2 hidden">Capacity Max</th>
                            <th class="px-4 py-2 text-center">Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(bin, binIndex) in job.bins" :key="binIndex">
                            <td class="px-4 py-2 text-center">
                              {{ binIndex + 1 }}
                            </td>
                            <td class="px-4 py-2 text-center">
                              <FormCheck>
                                <FormCheck.Input type="checkbox" :value="binIndex"
                                  :checked="job.selectedBinIndex === binIndex"
                                  @change="toggleBinSelection(jobIndex, binIndex)" class="mx-auto" />
                              </FormCheck>
                            </td>
                            <td class="px-4 py-2">
                              <div class="relative">
                                <!-- Dropdown trigger, disabled when isBinSubmitted is true -->
                                <div
                                  @click="!isBinSubmitted(jobIndex, binIndex) && toggleBinDropdown(jobIndex, binIndex)"
                                  :class="['border rounded p-2 cursor-pointer', { 'border-gray-300': true, 'cursor-not-allowed opacity-50': isBinSubmitted(jobIndex, binIndex) }]"
                                  :disabled="isBinSubmitted(jobIndex, binIndex)">
                                  <!-- Display `job.binName` if binMasterId matches, else show current bin name -->
                                  {{ bin.binMasterId === job.binMasterId ? job.binName : getBinName(bin.binMasterId) ||
                                  'Select a Bin Name' }}
                                </div>

                                <!-- Dropdown list with search input, visible only when open and not disabled -->
                                <div
                                  v-if="isBinDropdownOpenMap[`${jobIndex}-${binIndex}`] && !isBinSubmitted(jobIndex, binIndex)"
                                  class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                                  <!-- Search input inside dropdown -->
                                  <input type="text" v-model="binSearchQueryMap[`${jobIndex}-${binIndex}`]"
                                    placeholder="Search Bin Name" class="border-b border-gray-300 p-2 w-full"
                                    :disabled="isBinSubmitted(jobIndex, binIndex)" />

                                  <!-- Filtered bin options -->
                                  <ul class="max-h-40 overflow-y-auto">
                                    <li v-for="binOption in filteredBinOptions(jobIndex, binIndex)" :key="binOption.id"
                                      @click="selectBinOption(jobIndex, binIndex, binOption.id)"
                                      class="cursor-pointer p-2 hover:bg-gray-100">
                                      {{ binOption.name }}
                                    </li>
                                    <li v-if="filteredBinOptions(jobIndex, binIndex).length === 0"
                                      class="p-2 text-gray-500">
                                      No results found
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </td>

                            <td class="px-4 py-2">
                              <div class="flex items-center space-x-2">
                                <input type="number" v-model="bin.weight" class="w-full p-2 rounded border-gray-300"
                                  placeholder="Weight" :disabled="isBinSubmitted(jobIndex, binIndex)" />
                                <button type="button" @click="syncWeight(jobIndex, binIndex)"
                                  class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-2 text-white rounded">
                                  <i class="fa fa-refresh"></i>
                                </button>
                              </div>
                            </td>
                            <td class="px-4 py-2 hidden">{{ bin.type }}</td>
                            <td class="px-4 py-2 hidden">{{ bin.colour }}</td>
                            <td class="px-4 py-2 hidden">{{ bin.capacityMax }}</td>
                            <td class="px-2 py-2 small-width text-center">
                              <button @click="deleteBinField(jobIndex, binIndex)" :disabled="job.status === 'Completed'"
                                :class="{ 'text-gray-400': job.status === 'Completed', 'text-red-600 hover:text-red-800': job.status !== 'Completed' }">
                                <i class="fa-solid fa-trash-can"></i>
                              </button>

                            </td>


                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>


      </Dialog.Description>
      <Dialog.Footer>
        <Button type="button" variant="primary" @click="refreshData" class="mr-2">
          Refresh
        </Button>
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
  <Dialog
:staticBackdrop="true" size="3xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Deburring Job
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div ref="toPrint">
          <!-- Display Machine ID and Overall Status -->
          <div class="relative overflow-x-auto sm:rounded-lg">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Machine ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ editFormData.jobs[0]?.machineCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ overallStatus }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Table for Jobs -->
          <div class="relative overflow-x-auto sm:rounded-lg mt-8">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List of Jobs
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Job ID
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Powder ID
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Bin Name
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                <!-- Loop through jobs -->
                <template v-for="(job, jobIndex) in editFormData.jobs" :key="job.jobId">
                  <tr class="group">
                    <!-- Display Job Index -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ jobIndex + 1 }}
                    </td>
                    <!-- Display Job ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.jobId }}
                    </td>
                    <!-- Display Sub Job ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.subJobId }}
                    </td>
                    <!-- Display Powder ID -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.productCode }}
                    </td>
                    <!-- Display Bin Code -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.binName }}
                    </td>
                    <!-- Display Shift -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.shift }}
                    </td>
                    <!-- Display Weight -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.weight }}
                    </td>
                    <!-- Display Status -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b">
                      {{ job.status === 'Submitted' ? 'Pending' : job.status }}
                    </td>
                  </tr>
                </template>
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
/* Styles specifically for the printable area */
#printJS-page table {
  border-collapse: collapse;
  width: 100%;
  font-family: Arial, Helvetica, sans-serif;
}

#printJS-page th,
#printJS-page td {
  border: 1px solid #000;
  padding-bottom: 4px 2px;
  /* Reduced horizontal padding */
}

#printJS-page th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #000;
}

#printJS-page td {
  color: #000;
}

#printJS-page .title {
  text-align: center;
}

/* Status colors */
#printJS-page .text-green-600 {
  color: #166534;
}

#printJS-page .text-cyan-600 {
  color: #155e75;
}

#printJS-page .text-red-600 {
  color: #991b1b;
}

#printJS-page .text-orange-600 {
  color: #9a3412;
}
</style>