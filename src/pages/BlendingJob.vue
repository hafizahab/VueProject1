<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, nextTick, Ref } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import printJS from 'print-js';
import { QrcodeStream } from 'vue-qrcode-reader';
import LoadingIcon from "../base-components/LoadingIcon";

interface Response {
  machineId?: string;
  status?: string;
}

interface UserAccess {
  userId: string;
  blendingJobs?: string[];
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
            const machineId = response.machineId;

            // Placeholder while data is being fetched
            container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

            getUserAccessData()
              .then((userAccessData) => {
                const loggedInUserId = localStorage.getItem("userId");
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";

                if (response.status !== "No Jobs" && userAccess?.blendingJobs?.includes("Edit")) {
                  // Conditionally render "Edit" link
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
                    editRole(machineId); // Pass machineId here
                  });
                  editLink.innerHTML = `<i class="fa-regular fa-pen-to-square mr-1"></i>Edit`;
                  container.appendChild(editLink);
                }

                if (response.status !== "No Jobs") {
                  // Always render "View" link
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
                    viewRole(machineId); // Pass machineId here
                  });
                  viewLink.innerHTML = `<i class="fa-regular fa-eye mr-1"></i>View`;
                  container.appendChild(viewLink);
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

const loading = ref(false); // Controls the loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/Blending/GetBlendingJobs';


onMounted(() => {
  loading.value = true; // Show loading modal at the start

  axios.get(API_BASE_URL)
    .then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      const sortedData = filteredData.sort((a: any, b: any) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;

        const machineIdA = a.machineId.match(/\d+|\D+/g);
        const machineIdB = b.machineId.match(/\d+|\D+/g);

        for (let i = 0; i < Math.max(machineIdA.length, machineIdB.length); i++) {
          const partA = machineIdA[i] || '';
          const partB = machineIdB[i] || '';

          if (!isNaN(partA) && !isNaN(partB)) {
            const numA = parseInt(partA, 10);
            const numB = parseInt(partB, 10);
            if (numA !== numB) return numA - numB;
          }

          if (partA !== partB) return partA.localeCompare(partB);
        }

        return 0;
      });

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once data is fetched
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchBinOptions();
  fetchWM();
  fetchBinMasterData();
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

interface RecipeItem {
  productCode: string;
  powderId: string;
  percentage: number;
  weight: number;
}

interface BinItem {
  id: string; // Add the missing 'id' property
  binMasterId: string;
  weight: number;
  type: string;
  colour: string;
  capacityMax: number;
  mappingId: string;
  subJobId: string;
}
interface listBin {
  mappingId: string;
  type: string;
  subJobId: string;
  weight: number;
}




interface JobItem {
  jobId: string;
  subJobId: string;
  machineId: string;
  status: string;
  selectedBinIndex: number | null;
  recipe: RecipeItem[];
  bins: BinItem[];  // Add this line
}

interface BinOption {
  id: string;
  name: string;
  type: string;
  capacityMax: number;
  colour: string;
  // Add other fields from the API response if necessary
}

// Form Data
const editFormData = reactive<{
  jobs: JobItem[]; // The jobs array
  weightmachine: string; // The selected weight machine
  isWeightMachineDisabled: boolean; // Boolean flag for disabling weight machine input
  weightmachines: string[]; // Array of weight machine options
  listBin: listBin[]; // Array of weight machine options
}>({
  jobs: [], // Initialize as an empty array of JobItem
  weightmachine: '', // Default value for weightmachine
  isWeightMachineDisabled: false, // Initial state for disabling weight machine
  weightmachines: [] as string[], // Initialize as an empty array of string
  listBin: [], // Initialize as an empty array of string
});

const isBinDropdownOpenMap = ref<{ [key: string]: boolean }>({});
const binSearchQuery = ref('');
const selectedBinMasterId = ref(null);

// Update `toggleBinDropdown` to open only the clicked dropdown
const toggleBinDropdown = (jobIndex: any, binIndex: any) => {
  const dropdownId = `${jobIndex}-${binIndex}`;
  isBinDropdownOpenMap.value = { [dropdownId]: !isBinDropdownOpenMap.value[dropdownId] };
  binSearchQuery.value = ''; // Clear search query when opening the dropdown
};



// Function to select a bin from the dropdown
const selectBin = (jobIndex: any, binIndex: any, binId: any) => {
  const selectedBin = editFormData.jobs[jobIndex].bins[binIndex];
  selectedBin.binMasterId = binId;
  updateBinDetails(jobIndex, binIndex); // Update bin details based on selection
  isBinDropdownOpenMap.value = {}; // Close all dropdowns
};

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




// Define binOptions with the correct type
const binOptions = ref<BinOption[]>([]);


const viewData = reactive<{
  jobs: JobItem[];

}>({
  jobs: [], // Initialize as an empty array of JobItem
});

// Define permission variable for blendingJobs
let canEditBlendingJobs = false;

// Define the fetchUserBlendingJobsPermissions function
const fetchUserBlendingJobsPermissions = async () => {
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

      const blendingJobs = userDetails.blendingJobs || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for blendingJobs
      canEditBlendingJobs = blendingJobs.includes('Edit');

      console.log('canEditBlendingJobs:', canEditBlendingJobs); // Debugging log
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

// Call the fetchUserBlendingJobsPermissions function to get permissions
fetchUserBlendingJobsPermissions();

const fetchBinOptions = async () => {
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
        .filter((bin: any) => bin.weight > 0) // Filter only bins with weight greater than 0
        .map((bin: any) => [bin.binMasterId, bin.weight]) // Create a map with binMasterId as key
    );

    // Filter the bin master data to include only those with type "Blending"
    // and exclude those with a matching binMasterId from the map where weight > 0
    binOptions.value = binMasterData.filter((bin: any) => {
      return (
        bin.type.toLowerCase() === 'blending' &&  // Filter type as "blending"
        !listBinsMap.has(bin.id) // Exclude bins that have a weight > 0
      );
    });

    console.log('Filtered Bin Options:', binOptions.value);
  } catch (error) {
    console.error('Error fetching bin options:', error);
  }
};

interface BinMaster {
  id: string;
  name: string;
}

const binMasterList = ref<BinMaster[]>([]);

// Method to fetch the BinMaster data from the API
const fetchBinMasterData = async () => {
  try {
    const response = await fetch('http://10.87.0.33:8082/api/BinMaster');
    const data = await response.json();
    binMasterList.value = data.result; // Assign the result from API to binMasterList
  } catch (error) {
    console.error('Error fetching BinMaster data:', error);
  }
};



// Method to find the bin name based on binMasterId
const getBinName = (binMasterId: any) => {
  const matchedBin = binMasterList.value.find((bin: any) => bin.id === binMasterId);
  return matchedBin ? matchedBin.name : '';
};


const totalBinWeight = (jobIndex: number) => {
  return computed(() => {
    const weight = editFormData.jobs[jobIndex].bins.reduce((sum, bin) => {
      const binWeight = Number(bin.weight) || 0; // Ensure it's a number
      return sum + binWeight;
    }, 0);
    return parseFloat(weight.toFixed(4)); // Round to 4 decimal places
  });
};


const totalRecipeWeight = (jobIndex: number) => {
  const weight = editFormData.jobs[jobIndex].recipe.reduce((sum, recipe) => {
    const recipeWeight = recipe.weight || 0; // recipe.weight is already a number
    return sum + recipeWeight;
  }, 0);
  return parseFloat(weight.toFixed(4)); // Round to 4 decimal places
};


const remainingWeight = (jobIndex: number) => {
  return computed(() => {
    const remaining = totalRecipeWeight(jobIndex) - totalBinWeight(jobIndex).value;
    return parseFloat(remaining.toFixed(4)); // Round to 4 decimal places
  });
};


// Update bin details when binMasterId changes
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


// Computed property to get all selected binMasterIds
const selectedBins = computed(() => {
  return editFormData.jobs.flatMap(job => job.bins.map(bin => bin.binMasterId)).filter(Boolean);
});

// Filtered bin options for each row to exclude already selected binMasterIds
// Filtered bin options for each row to exclude already selected binMasterIds
const filteredBinOptions = (jobIndex: number, binIndex: number) => {
  const selectedBinId = editFormData.jobs[jobIndex].bins[binIndex].binMasterId;
  const selectedBins = editFormData.jobs.flatMap(job => job.bins.map(bin => bin.binMasterId)).filter(Boolean);

  return binOptions.value
    .filter(
      (option) =>
        (!selectedBins.includes(option.id) || option.id === selectedBinId) &&
        (!binSearchQuery.value || option.name.toLowerCase().includes(binSearchQuery.value.toLowerCase()))
    );
};




// Method to add a bin field to a job
const addBinField = (jobIndex: any) => {
  // Ensure the bins array is initialized if it doesn't exist
  if (!editFormData.jobs[jobIndex].bins) {
    editFormData.jobs[jobIndex].bins = [];
  }

  // Add a default bin item to the bins array
  editFormData.jobs[jobIndex].bins.push({
    id: '',
    binMasterId: '',
    mappingId: '',
    subJobId: editFormData.jobs[jobIndex].subJobId,
    weight: 0,
    type: 'Blending',
    colour: '',
    capacityMax: 0,
  });
};

const deletedBinIds = new Set<string>(); // To track deleted bin IDs

const deleteBinField = async (jobIndex: number, binIndex: number): Promise<void> => {
  const job = editFormData.jobs[jobIndex];
  const binToDelete = job.bins[binIndex];

  if (!binToDelete) {
    console.error('Invalid bin index provided.');
    return;
  }

  // Check if the bin has an existing ID (fetched from the server) or is newly added
  if (!binToDelete.id) {
    // If the bin is newly added, delete it immediately without confirmation
    job.bins.splice(binIndex, 1);
    editFormData.jobs[jobIndex].bins = [...job.bins]; // Force state update

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
    return;
  }

  // Show confirmation dialog before deleting a bin fetched from the server
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'You will not be able to recover this data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  });

  if (!result.isConfirmed) {
    return; // Exit the function if the user cancels
  }

  try {
    // Fetch the list of bins from the server to get the correct ID
    const listBinsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const listBins = listBinsResponse.data.result;

    // Find the bin in the fetched data using subJobId and binMasterId
    const matchedBin = listBins.find(
      (serverBin: any) =>
        serverBin.subJobId === binToDelete.subJobId &&
        serverBin.binMasterId === binToDelete.binMasterId
    );

    if (matchedBin && matchedBin.id) {
      // If a matching bin is found, delete it from the server using the correct ID
      await axios.delete(`http://10.87.0.33:8082/api/ListBins/${matchedBin.id}`);
      console.log(`Bin with ID ${matchedBin.id} deleted successfully from the server.`);
    }

    // Remove the bin from the local bins array
    job.bins.splice(binIndex, 1);

    // Force Vue to detect the change by creating a new array reference
    editFormData.jobs[jobIndex].bins = [...job.bins];

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
  } catch (error) {
    console.error('Error deleting bin:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error Deleting Bin',
      text: 'There was an issue deleting the bin. Please try again later.',
      confirmButtonColor: '#d33',
    });
  }
};





const deleteBinFieldRelease = (jobIndex: number, binIndex: number): void => {
  // Remove the bin at the given index from the bins array
  if (editFormData.jobs[jobIndex].bins && editFormData.jobs[jobIndex].bins.length > 0) {
    editFormData.jobs[jobIndex].bins.splice(binIndex, 1);
  }
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

const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => { editModal.value = value; };
// Watch for changes to editModal
watch(editModal, (newValue, oldValue) => {
  if (!newValue) { // If editModal becomes false
    fetchBinOptions(); // Run fetchBinOptions again
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

// Fetch and Set Data for Edit/View without using ID directly in the URL
const fetchAndSetData = async (
  machineId: string,
  formData: any,
  modalSetter: (value: boolean) => void,
  isView: boolean = false
) => {
  console.log(`Fetching data for Machine ID: ${machineId}`);
  loading.value = true; // Show loading animation

  try {
    const response = await axios.get(`http://10.87.0.33:8082/api/Blending/${machineId}`);
    const data = response.data.result;
    console.log('Fetched data:', data);

    if (data && data.length > 0) {
      data.sort((a: any, b: any) => b.subJobId.localeCompare(a.subJobId));

      for (const job of data) {
        if (!job.bins) {
          job.bins = [];
        }

        // Populate bins from listBin if available
        if (job.listBin && job.listBin.length > 0) {
          job.bins = job.listBin.map((bin: any) => ({
            id: bin.mappingId,
            binMasterId: bin.binMasterId,
            mappingId: bin.mappingId,
            subJobId: bin.subJobId,
            weight: bin.weight || 0,
            type: bin.type || 'Blending',
            colour: '', // Add colour logic if needed
            capacityMax: 0, // Add capacity logic if needed
          }));
        }

        // Fetch related bins dynamically and filter for type 'blending'
        const relatedBins = await fetchRelatedBins(job.jobId, job.subJobId);
        const filteredRelatedBins = relatedBins.filter(
          (bin: any) => bin.type.toLowerCase() === 'blending'
        );

        // Deduplicate bins based on binMasterId
        const mergedBins = [...job.bins, ...filteredRelatedBins].filter(
          (bin, index, self) =>
            index === self.findIndex((b) => b.binMasterId === bin.binMasterId)
        );

        job.bins = mergedBins;
      }

      formData.jobs = data;
      modalSetter(true);
    } else {
      console.error('No data found for the specified Machine ID:', machineId);
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    loading.value = false; // Hide loading animation
  }
};



const fetchRelatedBins = async (jobId: string, currentSubJobId: string) => {
  try {
    const response = await axios.get(`http://10.87.0.33:8082/api/ListBins`);
    const allBins = response.data.result;

    // Filter bins based on jobId, ensure subJobId is different from the current one, and weight is greater than 0
    const relatedBins = allBins.filter((bin: any) =>
      bin.mappingId === jobId &&
      bin.subJobId !== currentSubJobId &&
      bin.weight > 0
    );

    return reactive(relatedBins); // Ensure the related bins are reactive
  } catch (error) {
    console.error('Error fetching related bins:', error);
    return reactive([]); // Return an empty reactive array on error
  }
};



const isRelatedBin = (bin: BinItem, jobId: string, currentSubJobId: string) => {
  return (
    bin.mappingId === jobId &&
    bin.subJobId !== currentSubJobId &&
    bin.type.toLowerCase() === 'blending'
  );
};

const releaseBin = async (
  jobId: string,
  currentSubJobId: string,
  binId: string,
  jobIndex: number,
  binIndex: number
): Promise<void> => {
  try {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will release the bin!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, release it!',
    });

    if (!result.isConfirmed) {
      return;
    }

    // Fetch bin data
    const binResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binData = binResponse.data.result;

    // Find the specific bin by its ID
    const binToRelease = binData.find((bin: BinItem) => bin.id === binId);

    if (!binToRelease || binToRelease.weight <= 0) {
      Swal.fire('Error', 'No related bin found with a valid weight!', 'error');
      return;
    }

    // Set weight to 0 and update the bin via the API
    binToRelease.weight = 0;
    binToRelease.movement = 'Blending';
    const apiUrl = `http://10.87.0.33:8082/api/ListBins/${binToRelease.id}`;
    await axios.put(apiUrl, binToRelease);

    // Remove the bin from the local list after successful API call
    deleteBinFieldRelease(jobIndex, binIndex);

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
    });

    // Refresh bin options and filtered options after bin release
    // await fetchBinOptions();
    // filteredBinOptions(jobIndex, binIndex);

  } catch (error) {
    console.error('Error releasing the bin:', error);
    Swal.fire('Failed!', 'There was an error releasing the bin. Please try again.', 'error');
  }
};
















// The refreshData method will re-fetch the data
const refreshData = () => {
  // Re-fetch the data and update the modal content
  fetchAndSetData(editFormData.jobs[0]?.machineId, editFormData, seteditModal);

  // Also run fetchBinOptions to refresh bin options
  fetchBinOptions();
};




const editRole = (machineId: string) => fetchAndSetData(machineId, editFormData, seteditModal);
const viewRole = (machineId: string) => fetchAndSetData(machineId, viewData, setviewModal, true);




// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  axios.get(API_BASE_URL)
    .then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      const sortedData = filteredData.sort((a: any, b: any) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;

        const machineIdA = a.machineId.match(/\d+|\D+/g);
        const machineIdB = b.machineId.match(/\d+|\D+/g);

        for (let i = 0; i < Math.max(machineIdA.length, machineIdB.length); i++) {
          const partA = machineIdA[i] || '';
          const partB = machineIdB[i] || '';

          if (!isNaN(partA) && !isNaN(partB)) {
            const numA = parseInt(partA, 10);
            const numB = parseInt(partB, 10);
            if (numA !== numB) return numA - numB;
          }

          if (partA !== partB) return partA.localeCompare(partB);
        }

        return 0;
      });

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once data is fetched
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchBinOptions();
  fetchWM();
  fetchBinMasterData();

};


const updateJobStatus = async (jobId: string, subJobId: string, machineId: string, jobIndex: number) => {
  const job = editFormData.jobs[jobIndex];

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

  // Validation: Check if all bin names and weights are filled
  const hasEmptyBinNameOrWeight = job.bins.some((bin) => !getBinName(bin.binMasterId) || !bin.weight);
  if (hasEmptyBinNameOrWeight) {
    Swal.fire({
      icon: 'warning',
      title: 'Bin Name and Weight Required',
      text: 'All bins must have a bin name and a weight before completing the job.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  // Log bins to check weights before submission
  console.log('Bins before submission:', JSON.stringify(job.bins, null, 2));

  // Force state update
  job.bins = [...job.bins];

  // Show confirmation dialog before updating the job status
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will update the data!',
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
    const payload = {
      jobId: job.jobId,
      subJobId: job.subJobId,
      machineId: job.machineId,
    };

    await axios.post('http://10.87.0.33:8082/api/Blending/UpdateBlendingJobStatus', payload);

    job.status = 'Completed';
    updateTableData(); // Refresh the UI after update

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
    addBinsToJob(jobId, jobIndex);
  } catch (error) {
    console.error('Error updating job status:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error Updating Job Status',
      text: 'There was an issue updating the job status. Please try again later.',
      confirmButtonColor: '#d33',
    });
  }
};

const refetchSpecificJob = async (
  machineId: string,
  jobId: string,
  subJobId: string,
  jobIndex: number
) => {
  try {
    // Fetch all jobs for the machine
    const response = await axios.get(`http://10.87.0.33:8082/api/Blending/${machineId}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      // Find the updated job in the fetched data
      const updatedJob = data.find((job: any) => job.jobId === jobId && job.subJobId === subJobId);

      if (updatedJob) {
        if (!updatedJob.bins) {
          updatedJob.bins = [];
        }

        // Populate bins from listBin if available
        if (updatedJob.listBin && updatedJob.listBin.length > 0) {
          updatedJob.bins = updatedJob.listBin.map((bin: any) => ({
            id: bin.mappingId,
            binMasterId: bin.binMasterId,
            mappingId: bin.mappingId,
            subJobId: bin.subJobId,
            weight: bin.weight || 0,
            type: bin.type || 'Blending',
            colour: '', // Add colour logic if needed
            capacityMax: 0, // Add capacity logic if needed
          }));
        }

        // Fetch related bins dynamically and filter for type 'blending'
        const relatedBins = await fetchRelatedBins(jobId, subJobId);
        const filteredRelatedBins = relatedBins.filter(
          (bin: any) => bin.type.toLowerCase() === 'blending'
        );

        // Deduplicate bins based on binMasterId
        const mergedBins = [...updatedJob.bins, ...filteredRelatedBins].filter(
          (bin, index, self) =>
            index === self.findIndex((b) => b.binMasterId === bin.binMasterId)
        );

        updatedJob.bins = mergedBins;

        // Update the specific job in editFormData.jobs
        editFormData.jobs[jobIndex] = updatedJob;

        console.log(`Updated job data for jobId=${jobId}, subJobId=${subJobId}:`, updatedJob);
      } else {
        console.warn(`No data found for jobId=${jobId}, subJobId=${subJobId}`);
      }
    }
  } catch (error) {
    console.error('Error fetching data for specific job:', error);
  }
};




const saveTempListBins = async (
  jobId: string,
  subJobId: string,
  machineId: string,
  jobIndex: number
) => {
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

  // Validation: Check if all bin names are filled
  const hasEmptyBinName = job.bins.some((bin) => !getBinName(bin.binMasterId));
  if (hasEmptyBinName) {
    Swal.fire({
      icon: 'warning',
      title: 'Bin Name Required',
      text: 'All bins must have a bin name before saving.',
      confirmButtonColor: '#1e40af',
    });
    return;
  }

  // Filter out bins where isRelatedBin is true
  const filteredBins = job.bins.filter((bin) => !isRelatedBin(bin, job.jobId, job.subJobId));

  // Show confirmation dialog before saving
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
    return; // If the user cancels, exit the function
  }

  try {
    // Deduplicate bins based on unique identifiers
    const uniqueBins = filteredBins.reduce((unique: any[], bin: any) => {
      const isDuplicate = unique.some(
        (uBin) =>
          uBin.binMasterId === bin.binMasterId &&
          uBin.mappingId === bin.mappingId
      );
      if (!isDuplicate) {
        unique.push(bin);
      }
      return unique;
    }, []);

    console.log(`Deduplicated bins for subJobId ${subJobId}:`, uniqueBins);

    // Submit each unique bin separately
    for (const bin of uniqueBins) {
      const binPayload = {
        mappingId: jobId,
        subJobId: job.subJobId,
        binMasterId: bin.binMasterId,
        type: bin.type || 'Blending',
        weight: bin.weight || 0,
      };

      console.log('Submitting bin payload:', JSON.stringify(binPayload, null, 2));

      await axios.post(
        'http://10.87.0.33:8082/api/ListBins/SaveTempListBinsfromJobs',
        binPayload
      );
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
    // Refetch data for the machine and update only the specific job
    await refetchSpecificJob(machineId, jobId, subJobId, jobIndex);
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





const addBinsToJob = async (jobId: string, jobIndex: number): Promise<void> => {
  const job = editFormData.jobs[jobIndex]; // Get the correct job using jobIndex

  if (job && job.bins) {
    // Filter out bins where isRelatedBin is true
    const filteredBins = job.bins.filter((bin) => !isRelatedBin(bin, job.jobId, job.subJobId));

    for (const bin of filteredBins) {
      const binPayload = {
        mappingId: jobId,
        subJobId: job.subJobId,
        binMasterId: bin.binMasterId,
        type: bin.type || 'Blending',
        weight: bin.weight || 0,
      };

      try {
        // First, save the bin
        console.log('Submitting bin payload for saving:', JSON.stringify(binPayload, null, 2));
        await axios.post(
          'http://10.87.0.33:8082/api/ListBins/SaveTempListBinsfromJobs',
          binPayload
        );

        console.log('Bin saved successfully:', binPayload);

        // Now, add the bin
        const addBinPayload = {
          mappingId: jobId,
          binMasterId: bin.binMasterId,
          type: 'Blending',
          subJobId: job.subJobId,
          weight: bin.weight,
          movement: bin.type,
          colour: bin.colour,
          capacityMin: 0,
          capacityMax: bin.capacityMax,
          reassignBinId: '',
          productCode: '',
          dimensionCheck: '',
          functionalCheck: '',
          visualCheck1: '',
          visualCheck2: '',
          visualCheck3: '',
          room: '',
        };

        console.log('Submitting bin payload for adding:', addBinPayload);
        await axios.post(
          'http://10.87.0.33:8082/api/ListBins/AddListBinsfromBlendingJobs',
          addBinPayload
        );

        console.log('Bin added successfully:', addBinPayload);

      } catch (error) {
        console.error('Error in saving or adding bin:', error);
      }
    }
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
    <h2 class="mr-auto text-lg font-medium">Blending Job</h2>

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

        <!-- <Button id="tabulator-print" variant="outline-primary" class="w-1/2 mr-2 sm:w-auto" @click="onPrint">
          <Lucide icon="Printer" class="w-4 h-4 mr-2" /> Print
        </Button> -->


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
          Edit Blending Job
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
                    {{ editFormData.jobs[0]?.machineId }}
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

          <!-- Table for Jobs and Recipe Details -->
          <div class="relative overflow-x-auto sm:rounded-lg mt-8">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List of Jobs</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Job ID</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Recipe</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Powder ID</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Percentage</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Action</th>
                </tr>
              </thead>
              <tbody>
                <!-- Loop through jobs -->
                <template v-for="(job, jobIndex) in editFormData.jobs" :key="job.jobId">
                  <!-- Loop through each recipe within a job -->
                  <tr v-for="(recipe, index) in job.recipe" :key="index" class="group">
                    <!-- Display Job ID and Sub Job ID only on the first row of the recipe -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ jobIndex + 1 }}</td>
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ job.jobId }}</td>
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ job.subJobId }}</td>
                    <!-- Recipe Details -->
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.productCode }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.powderId }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.percentage }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.weight }}</td>
                    <!-- Display Status only on the first row of the recipe -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">
                      {{ job.status === 'Submitted' ? 'Pending' : job.status }}
                    </td>

                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0 && job.status !== 'Completed'">
                      <button @click="addBinField(jobIndex)"
                        class="bg-green-500 hover:bg-green-700 my-2 mx-2 px-4 py-2 text-white rounded">
                        Add Bin
                      </button>
                      <button @click="saveTempListBins(job.jobId, job.subJobId, job.machineId, jobIndex)"
                        class="bg-orange-500 hover:bg-orange-700 my-2 mx-2 px-4 py-2 text-white rounded">
                        Save
                      </button>
                      <button @click="updateJobStatus(job.jobId, job.subJobId, job.machineId, jobIndex)"
                        class="bg-blue-700 hover:bg-blue-900 my-2 mx-2 px-4 py-2 text-white rounded">
                        Completed
                      </button>
                    </td>

                  </tr>
                  <!-- Display additional bin fields in a table -->
                  <!-- List Bin Section -->
                  <tr v-if="job.bins && job.bins.length > 0">
                    <td colspan="9">
                      <h3 class="text-lg font-bold mt-4 mb-2 flex items-center">
                        <span class="pr-10">List Bin</span>

                        <span :class="remainingWeight(jobIndex).value === 0 ? 'text-green-500' : 'text-red-500'"
                          class="text-sm font-normal">
                          Total Weight: {{ totalBinWeight(jobIndex).value }}
                        </span>

                        <span
                          :class="remainingWeight(jobIndex).value === 0 ? 'pl-3 text-green-500' : 'pl-3 text-red-500'"
                          class="text-sm font-normal">
                          Remaining Weight: {{ remainingWeight(jobIndex).value }}kg
                        </span>
                      </h3>


                      <table class="w-full text-sm text-left text-gray-500 dark:text-gray-400 border">
                        <thead class="bg-gray-200 dark:bg-gray-700">
                          <tr>
                            <th class="px-4 py-2">No.</th>
                            <th class="px-4 py-2"></th>
                            <th class="px-4 py-2">Bin Name</th>
                            <th class="px-4 py-2 medium-width">Weight</th>
                            <th class="px-4 py-2 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(bin, binIndex) in job.bins" :key="binIndex">
                            <td class="text-center">
                              {{ binIndex + 1 }}
                            </td>
                            <td class="px-4 py-2 text-center">
                              <FormCheck>
                                <FormCheck.Input type="checkbox" :value="binIndex"
                                  :checked="job.selectedBinIndex === binIndex"
                                  @change="toggleBinSelection(jobIndex, binIndex)" class="mx-auto" />
                              </FormCheck>
                            </td>

                            <!-- Conditionally Render Select or Input based on isRelatedBin -->
                            <td class="px-4 py-2">
                              <!-- Check if the bin is related and display text input, else show searchable dropdown -->
                              <input v-if="isRelatedBin(bin, job.jobId, job.subJobId)" type="text"
                                :value="getBinName(bin.binMasterId)" disabled
                                class="w-full p-2 rounded border-gray-300" />

                              <!-- Searchable dropdown for bin selection -->
                              <div v-else class="relative">
                                <div @click="toggleBinDropdown(jobIndex, binIndex)"
                                  :class="['border rounded p-2 cursor-pointer', { 'border-gray-300': true }]">
                                  {{ getBinName(bin.binMasterId) || 'Select a Bin Name' }}
                                </div>

                                <!-- Dropdown list, only visible when the dropdown is open for the specific bin -->
                                <div v-if="isBinDropdownOpenMap[`${jobIndex}-${binIndex}`]"
                                  class="absolute left-0 top-full w-full bg-white shadow-md z-10">

                                  <!-- Searchable input inside dropdown -->
                                  <input type="text" v-model="binSearchQuery" placeholder="Search Bin Name"
                                    class="border-b border-gray-300 p-2 w-full" />

                                  <!-- Filtered options list -->
                                  <ul class="max-h-40 overflow-y-auto">
                                    <li v-for="binOption in filteredBinOptions(jobIndex, binIndex)" :key="binOption.id"
                                      @click="selectBin(jobIndex, binIndex, binOption.id)"
                                      class="cursor-pointer p-2 hover:bg-gray-100">
                                      {{ binOption.name }}
                                    </li>
                                    <li v-if="filteredBinOptions(jobIndex, binIndex).length === 0"
                                      class="p-2 text-gray-500">No results found</li>
                                  </ul>
                                </div>
                              </div>
                            </td>



                            <!-- Disable weight input if the bin is related -->
                            <td class="px-4 py-2">
                              <div class="flex items-center space-x-2">
                                <input type="number" v-model="bin.weight"
                                  :disabled="isRelatedBin(bin, job.jobId, job.subJobId)"
                                  class="w-full p-2 rounded border-gray-300" placeholder="Weight" />
                                <button type="button" @click="syncWeight(jobIndex, binIndex)"
                                  class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-2 text-white rounded">
                                  <i class="fa fa-refresh"></i>
                                </button>
                              </div>
                            </td>


                            <td class="px-4 py-2 hidden">{{ bin.type }}</td>
                            <td class="px-4 py-2 hidden">{{ bin.colour }}</td>
                            <td class="px-4 py-2 hidden">{{ bin.capacityMax }}</td>

                            <td class="px-4 py-2 text-center">
                              <!-- Show Release Button for bins from the same job but different sub-job -->
                              <button v-if="isRelatedBin(bin, job.jobId, job.subJobId)"
                                @click="releaseBin(job.jobId, job.subJobId, bin.id, jobIndex, binIndex)"
                                class="bg-blue-700 text-white px-2 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-500 whitespace-nowrap">
                                <i class="fa-solid fa-arrow-right-from-bracket pr-2"></i>Release
                              </button>


                              <!-- Show Delete Button for bins added in this sub-job -->
                              <button v-else @click="deleteBinField(jobIndex, binIndex)"
                                :disabled="job.status === 'Completed'"
                                :class="{ 'text-gray-400': job.status === 'Completed', 'text-red-600  bg-red-700 text-white px-2 py-2 rounded-md hover:bg-red-600 dark:bg-red-500 whitespace-nowrap': job.status !== 'Completed' }">
                                <i class="fa-solid fa-trash-can pr-1"></i> Delete
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
          View Blending
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
                    {{ viewData.jobs[0]?.machineId }}
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

          <!-- Table for Jobs and Recipe Details -->
          <div class="relative overflow-x-auto sm:rounded-lg mt-8">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List of Jobs</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Job ID</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Recipe</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Powder ID</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Percentage</th>
                  <th scope="col"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight</th>
                  <th scope="col"
                    class="align-top px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status</th>
                </tr>
              </thead>
              <tbody>
                <!-- Loop through jobs -->
                <template v-for="(job, jobIndex) in viewData.jobs" :key="job.jobId">
                  <!-- Loop through each recipe within a job -->
                  <tr v-for="(recipe, index) in job.recipe" :key="index" class="group">
                    <!-- Display Job ID and Sub Job ID only on the first row of the recipe -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ jobIndex + 1 }}</td>
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ job.jobId }}</td>
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">{{ job.subJobId }}</td>
                    <!-- Recipe Details -->
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.productCode }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.powderId }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.percentage }}</td>
                    <td
                      class="px-4 py-2 text-center text-gray-700 dark:text-white border-b group-hover:bg-gray-100 dark:group-hover:bg-gray-100">
                      {{ recipe.weight }}</td>
                    <!-- Display Status only on the first row of the recipe -->
                    <td class="align-top px-4 py-2 text-center text-gray-700 dark:text-white border-b"
                      :rowspan="job.recipe.length" v-if="index === 0">
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