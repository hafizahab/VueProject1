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
import LoadingIcon from "../base-components/LoadingIcon";


interface Response {
  id?: string;
  jobId?: string;
  shift?: string;
  weight?: string;
  waste?: string;
  jobStatus?: string;
  qcPassed?: string;
}


interface UserAccess {
  userId: string;
  outgoingQualityCheck?: string[];
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
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.productCode || 'N/A'}</div>
    </div>`;
          },
        },

        // {
        //   title: "SHIFT",
        //   minWidth: 150,
        //   responsive: 0,
        //   field: "shift",
        //   vertAlign: "middle",
        //   print: false,
        //   download: false,
        //   formatter(cell) {
        //     const response: Response = cell.getData();
        //     return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.shift}</div>
        // </div>`;
        //   },
        // },

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
                case 'Rejected':
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
                    userAccess.outgoingQualityCheck &&
                    userAccess.outgoingQualityCheck.includes("Edit") &&
                    response.status !== "Completed"
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

// Define the structure of the job and bin data
interface Job {
  jobId: string;
  jobStatus: string;
  productCode?: string; // Product code will be added later
  status: string; // Add other relevant fields from your job API response
}

interface Bin {
  mappingId: string;
  productCode: string;
  // Add other fields if necessary
}

const loading = ref(false); // Controls loading animation modal

// API Base URLs
const API_BASE_URL = 'http://10.87.0.33:8082/api/QCInspection/';
const SECONDARY_PROCESS_URL = 'http://10.87.0.33:8082/api/SecondaryProcess';
const LIST_BINS_URL = 'http://10.87.0.33:8082/api/ListBins';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Fetch data from all required APIs
  Promise.all([
    axios.get(API_BASE_URL),          // Fetch job data
    axios.get(LIST_BINS_URL),         // Fetch bins data
    axios.get(SECONDARY_PROCESS_URL)  // Fetch secondary process data
  ])
    .then(([jobResponse, binsResponse, secondaryProcessResponse]) => {
      let jobData = jobResponse.data.result.filter((item: any) => item.status !== 'deleted');
      const binsData = binsResponse.data.result;
      const secondaryProcessData = secondaryProcessResponse.data.result;

      // Sort the job data, prioritize "Pending" jobs and then sort by jobId in ascending order
      jobData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') return -1;
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') return 1;

        const jobIdA = parseInt(a.jobId.replace(/\D/g, ''), 10);
        const jobIdB = parseInt(b.jobId.replace(/\D/g, ''), 10);
        return jobIdA - jobIdB;
      });

      // Map the jobData to include productCode from the secondaryProcessData
      jobData = jobData.map((job: any) => {
        const matchingSecondaryProcess = secondaryProcessData.find(
          (process: any) => process.whiteSlipId === job.jobId
        );

        const productCode = matchingSecondaryProcess?.productCode || 'N/A';

        return {
          ...job,
          productCode,
        };
      });

      // Populate the table with job data
      if (tabulator.value) {
        tabulator.value.setData(jobData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after all data is fetched
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchNamesShift();
  fetchBinId();
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
  jobId: '',
  subJobId: '',
  jobStatus: '',
  weight: '',
  shift: '',
  qcPassed: true,
  processedWeight: '',
  waste: 0,
  totalTimeTaken: '',
});

// Form Data
const editFormData = reactive({
  id: null,
  jobId: '',
  subJobId: '',
  productCode: '',
  weight: '',
  jobStatus: '',
  shift: '',
  qcPassed: true,
  processedWeight: '',
  waste: 0,
  totalTimeTaken: '',
  bins: [] as string[],
  binData: [] as any[],
  shifts: [] as any[],
  packingListforQCIList: [] as any[], // Add packingListforQCIList property here
});

// Toggle check functionality
const toggleCheck = (bin: any, field: any) => {
  if (bin[field] === 'Approve') {
    bin[field] = 'On-hold';
  } else if (bin[field] === 'On-hold') {
    bin[field] = ''; // Empty string for pending
  } else {
    bin[field] = 'Approve';
  }
};

// Reset all fields for a given bin to empty
const resetRow = (bin: any) => {
  bin.functionalCheck = '';
  bin.visualCheck1 = '';
};

// Define permission variables for outgoingQualityCheck
let canEditOutgoingQualityCheck = false;

// Define the fetchUserOutgoingQualityCheckPermissions function
const fetchUserOutgoingQualityCheckPermissions = async () => {
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

      const outgoingQualityCheck = userDetails.outgoingQualityCheck || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for outgoingQualityCheck
      canEditOutgoingQualityCheck = outgoingQualityCheck.includes('Edit');

      console.log('canEditOutgoingQualityCheck:', canEditOutgoingQualityCheck); // Debugging log
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

// Call the fetchUserOutgoingQualityCheckPermissions function to get permissions
fetchUserOutgoingQualityCheckPermissions();






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




const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };

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
  movement: string;
  weight: number;
  approvedWeight: number;
  startOQC: boolean;
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
      bin.weight > 0 && // weight must be greater than 0
      bin.mappingId === jobId && // mappingId must match jobId
      (
        (bin.type && ( // Check if type exists and matches conditions
          bin.type.toLowerCase() === 'waste' ||
          bin.type.toLowerCase() === 'wet treatment' ||
          bin.type.toLowerCase() === 'plasma treatment' ||
          bin.type.toLowerCase() === 'deburring' ||
          bin.type.toLowerCase() === 'dedusting'
        ))
      )
    );

    if (filteredBins.length > 0) {
      // Add bin name to each filtered bin
      filteredBins.forEach(bin => {
        bin.binName = binMasterMap[bin.binMasterId] || 'Unknown';

        // Only set approvedWeight to weight if approvedWeight is zero, null, or empty
        if (!bin.approvedWeight || bin.approvedWeight === 0) {
          bin.approvedWeight = bin.weight;
        }
      });

      // Calculate the total weight of the filtered bins
      const totalWeight = filteredBins.reduce((sum, bin) => sum + (bin.weight || 0), 0);
      editFormData.weight = totalWeight.toString();

      console.log('Filtered Bins with Names:', filteredBins);
      console.log('Total Weight:', totalWeight);

      editFormData.binData = filteredBins; // Set detailed bin data for display
    } else {
      // If no bins match, clear the bin data and reset weight
      console.warn(`No bins found matching the criteria for Job ID: ${jobId}`);
      editFormData.binData = []; // Clear the bin data to hide the list
      editFormData.weight = '0';   // Reset the weight to 0
    }
  } catch (error) {
    console.error('Error fetching bins or bin master data:', error);
  }
};



function getSelectValue(value: any) {
  return value === null || value === '' ? '' : value;
}


// Computed property for processedWeight (sum of bin weights)
/*
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
*/


// Function to reset editFormData
const resetEditFormData = () => {
  Object.assign(editFormData, {
    id: '',
    jobId: '',
    subJobId: '',
    shift: '',
    jobStatus: '',
    qcPassed: null,
    weight: '',
    processedWeight: '',
    waste: '',
    totalTimeTaken: '',
    productCode: '',
    binData: [], // Reset binData
    machineJobRows: [] // Reset machineJobRows
  });
};

// Fetch and Set Data for Edit/View
const fetchAndSetData = async (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  loading.value = true; // Start loading
  try {
    // Reset formData before fetching new data
    resetEditFormData();

    // First API call to fetch job data
    const response = await axios.get(`${API_BASE_URL}${id}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      console.log('Retrieved Data:', data);
      const [firstItem] = data;

      // Set form data
      Object.assign(formData, {
        id: firstItem.id,
        jobId: firstItem.jobId,
        subJobId: firstItem.subJobId,
        shift: firstItem.shift,
        jobStatus: firstItem.jobStatus,
        qcPassed: firstItem.qcPassed,
        weight: firstItem.weight,
        processedWeight: firstItem.processedWeight,
        waste: firstItem.waste,
        totalTimeTaken: firstItem.totalTimeTaken,
      });

      // Fetch bins related to the jobId
      await fetchBins(firstItem.jobId);

      // Fetch productCode from SecondaryProcess API
      const secondaryProcessResponse = await axios.get('http://10.87.0.33:8082/api/SecondaryProcess');
      const secondaryProcessData = secondaryProcessResponse.data.result;

      // Find the productCode by matching jobId with whiteSlipId
      const matchingProcess = secondaryProcessData.find((process: any) => process.whiteSlipId === firstItem.jobId);
      formData.productCode = matchingProcess?.productCode || 'N/A';

      // Open the modal once data is set
      modalSetter(true);
    } else {
      console.error('No data found for the specified ID:', id);
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    loading.value = false; // End loading after all operations
  }
};

// Function to open the edit modal
const editRole = (id: string) => {
  // Always reset the form data before fetching
  resetEditFormData();
  fetchAndSetData(id, editFormData, setEditSlideOver);
};

// Function to open the view modal
const viewRole = (id: string) => {
  resetEditFormData();
  fetchAndSetData(id, viewData, setviewModal, true);
};

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  // Fetch data from all required APIs
  Promise.all([
    axios.get(API_BASE_URL),          // Fetch job data
    axios.get(LIST_BINS_URL),         // Fetch bins data
    axios.get(SECONDARY_PROCESS_URL)  // Fetch secondary process data
  ])
    .then(([jobResponse, binsResponse, secondaryProcessResponse]) => {
      let jobData = jobResponse.data.result.filter((item: any) => item.status !== 'deleted');
      const binsData = binsResponse.data.result;
      const secondaryProcessData = secondaryProcessResponse.data.result;

      // Sort the job data, prioritize "Pending" jobs and then sort by jobId in ascending order
      jobData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') return -1;
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') return 1;

        const jobIdA = parseInt(a.jobId.replace(/\D/g, ''), 10);
        const jobIdB = parseInt(b.jobId.replace(/\D/g, ''), 10);
        return jobIdA - jobIdB;
      });

      // Map the jobData to include productCode from the secondaryProcessData
      jobData = jobData.map((job: any) => {
        const matchingSecondaryProcess = secondaryProcessData.find(
          (process: any) => process.whiteSlipId === job.jobId
        );

        const productCode = matchingSecondaryProcess?.productCode || 'N/A';

        return {
          ...job,
          productCode,
        };
      });

      // Populate the table with job data
      if (tabulator.value) {
        tabulator.value.setData(jobData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after all data is fetched
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchNamesShift();
  fetchBinId();

};


const newBins = reactive([] as Array<{
  id?: string;
  mappingId: string;
  binMasterId: string;
  weight: number;
  capacityMax: number;
  capacityMin: number;
  movement: string;
  reassignBinId: string;
  dimensionCheck: string;
  functionalCheck: string;
  visualCheck1: string;
  visualCheck2: string;
  visualCheck3: string;
}>);

const addNewBin = () => {
  newBins.push({
    id: '',
    mappingId: editFormData.jobId,
    binMasterId: '',
    capacityMin: 0,
    capacityMax: 0,
    weight: 0,
    movement: '',
    reassignBinId: '',
    dimensionCheck: '',
    functionalCheck: '',
    visualCheck1: '',
    visualCheck2: '',
    visualCheck3: '',
  });
  console.log('New Bins:', newBins);
};


// Computed property for summing bin.approvedWeight
const processedWeight = computed(() => {
  const totalApprovedWeight = editFormData.binData.reduce((sum, bin) => {
    const approvedWeight = parseFloat(bin.approvedWeight) || 0;
    return sum + approvedWeight;
  }, 0);

  // Convert total to a number and then to a string to remove trailing zeros
  return parseFloat(totalApprovedWeight.toFixed(4)).toString();
});

// Watcher to update editFormData.processedWeight whenever the sum changes
watch(processedWeight, (newValue) => {
  editFormData.processedWeight = newValue;
});

// Watch the binData and set approvedWeight to weight by default when binData is updated
watch(
  () => editFormData.binData,
  (newBinData) => {
    newBinData.forEach((bin) => {
      if (bin.approvedWeight === undefined || bin.approvedWeight === null) {
        bin.approvedWeight = bin.weight; // Set approvedWeight to weight by default
      }
    });
  },
  { deep: true } // Deep watch to track changes inside the array
);




const removeNewBin = (index: number) => {
  newBins.splice(index, 1);
};

const markBinAsChanged = (bin: any) => {
  bin.changed = true;
};

// Method to check if the value has more than 4 decimals
const hasMoreThanFourDecimals = (value: any) => {
  const decimalPart = value?.toString().split('.')[1];
  return decimalPart && decimalPart.length > 4;
};

// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  // Convert the values to numbers and validate them
  const weight = parseFloat(editFormData.weight);

  // Validation check for both weight and approvedWeight in each bin
  const hasInvalidApprovedWeight = editFormData.binData.some(bin =>
    isNaN(parseFloat(bin.approvedWeight)) || hasMoreThanFourDecimals(bin.approvedWeight)
  );

  if (!editFormData.weight || isNaN(weight) || hasInvalidApprovedWeight) {
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

    formSubmitted.value = false;
    return;
  }

  // Calculate the total weight of bins with QC Pass = "Pass"
  const totalPassedWeight = editFormData.binData
    .filter(bin => bin.functionalCheck?.toLowerCase() === 'approve' && bin.visualCheck1?.toLowerCase() === 'approve')
    .reduce((sum, bin) => sum + (Number(bin.weight) || 0), 0);

  // Prepare the payload for the main form submission
  const payload = {
    id: String(editFormData.id),  // Keeping the id field
    jobId: String(editFormData.jobId),
    shift: String(editFormData.shift),
    jobStatus: String(editFormData.jobStatus),
    qcPassed: true,
    weight: totalPassedWeight, // Use the calculated totalPassedWeight here
    processedWeight: Number(editFormData.processedWeight) || 0,
    waste: Number(editFormData.waste) || 0,
    totalTimeTaken: String(editFormData.totalTimeTaken),

    packingListforQCIList: [{
      whiteSlipId: String(editFormData.jobId),
      shift: String(editFormData.shift),
      weight: totalPassedWeight, // Use the totalPassedWeight for the packing list
      approvedWeight: Number(editFormData.processedWeight) || 0,
      productCode: editFormData.productCode || "",
      jobStatus: String(editFormData.jobStatus),
      packageholdingrequired: false,  // Assuming you track this value in editFormData

      // Filter bins where QC Pass is "Pass"
      listBinsListforPackingQCIList: editFormData.binData
        .filter(bin => bin.functionalCheck?.toLowerCase() === 'approve' && bin.visualCheck1?.toLowerCase() === 'approve')
        .map(bin => ({
          id: bin.id || "",  // Keeping the id for listBinsListforPackingQCIList
          mappingId: bin.mappingId || "",
          subJobId: bin.subJobId || "",
          binMasterId: bin.binMasterId || "",
          type: "Packing",  // Assuming type should be 'Packing'
          weight: Number(bin.weight) || 0,
          movement: "Packing",  // Defaulting movement to 'Packing' if not present
          colour: bin.colour || "",
          capacityMin: Number(bin.capacityMin) || 0,
          capacityMax: Number(bin.capacityMax) || 0,
          reassignBinId: bin.reassignBinId || "",
          status: bin.status || "",
          productCode: bin.productCode || "",
          approvedWeight: Number(bin.approvedWeight) || 0
        }))
    }]
  };

  // Log the payload in JSON format before showing the confirmation dialog
  console.log('Payload to be submitted:', JSON.stringify(payload, null, 2));

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

          // Submit each bin individually
          const binPromises = editFormData.binData.map(bin => {
            const binPayload = {
              ...bin,  // Keep all the other bin properties unchanged
              id: bin.id,  // Keep the bin id
              approvedWeight: bin.approvedWeight, // Update approvedWeight
              functionalCheck: bin.functionalCheck, // Update functionalCheck
              visualCheck1: bin.visualCheck1, // Update visualCheck1
              movement: 'OQC',  // Update movement, if any

            };

            // Log the payload for each bin
            console.log('Submitting bin:', JSON.stringify(binPayload, null, 2));

            return axios.put(`http://10.87.0.33:8082/api/ListBins/${bin.id}`, binPayload);
          });

          // Wait for all bin requests to finish
          Promise.all(binPromises).then(() => {
            setEditSlideOver(false);
            updateTableData();
            resetFormData(editFormData);
            fetchNamesShift();
            fetchBinId();

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

            formSubmitted.value = false;
          });
        })
        .catch(error => {
          handleError(error, 'Error updating data');
          formSubmitted.value = false;
        });
    } else {
      formSubmitted.value = false;
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
  if (!value) {
  }
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
    <h2 class="mr-auto text-lg font-medium">Outgoing Quality Check</h2>

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
:staticBackdrop="true" size="2xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Outgoing Quality Check
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form">
          <div>
            <FormLabel htmlFor="regular-form-gr">Job ID</FormLabel>
            <FormInput v-model="editFormData.jobId" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="flex flex-col md:flex-row md:space-x-4 mt-5">
            <!-- Weight field -->
            <div class="flex-1">
              <FormLabel htmlFor="regular-form-8">Weight</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
              <FormInput
                :class="{ 'border-red-500': formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight)) }"
                id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Weight" disabled
                step="any" />
              <span v-if="formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight))"
                class="text-red-500">
                {{
                  !editFormData.weight ? 'Weight is required!' : 'Weight must be a valid number!'
                }}
              </span>
            </div>

            <!-- Approved Weight field -->
            <div class="flex-1 mt-5 md:mt-0">
              <FormLabel htmlFor="approved-weight-form">Approved Weight</FormLabel><span
                class="text-red-500 pl-1 text-md">*</span>
              <FormInput :class="{
                'border-red-500': (editFormData.processedWeight &&
                  (!isNumeric(editFormData.processedWeight)) || hasMoreThanFourDecimals(editFormData.processedWeight))
              }" id="approved-weight-form" v-model="editFormData.processedWeight" type="text"
                placeholder="Approved Weight" step="any" disabled />

              <!-- Display validation message for non-numeric value -->
              <span v-if="editFormData.processedWeight && !isNumeric(editFormData.processedWeight)"
                class="text-red-500">
                Approved Weight must be a valid number!
              </span>


              <!-- Display validation message for more than 4 decimal places -->
              <span
                v-if="isNumeric(editFormData.processedWeight) && hasMoreThanFourDecimals(editFormData.processedWeight)"
                class="text-red-500">
                Approved Weight cannot have more than 4 decimal places!
              </span>
            </div>

          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-gr">Part Number</FormLabel>
            <FormInput v-model="editFormData.productCode" id="regular-form-gr" type="text" disabled />
          </div>


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Processed Weight</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight)) }"
              id="regular-form-8" v-model="editFormData.processedWeight" type="text" placeholder="Processed Weight"
              disabled step="any" />
            <span v-if="formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight))"
              class="text-red-500">
              {{ !editFormData.processedWeight ? 'Processed Weight is required!' : 'Processed Weight must be a valid number!' }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Waste</FormLabel>
            <FormInput id="regular-form-8" v-model="editFormData.waste" type="text" placeholder="Waste" disabled
              step="any" />
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>Pending</option>
            </FormSelect>
          </div>
          <!-- Show the filtered list of bins below the Job Status input -->
          <div v-if="editFormData.binData.length > 0" class="overflow-auto">
  <h6 class="mb-2 mt-8 text-lg font-medium leading-none dark:text-gray-300">List of Bins</h6>
  <hr class="dark:border-gray-700" />

  <table class="min-w-full border-collapse rounded-lg shadow-sm mt-4">
    <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-200">
      <tr>
        <th class="py-2 px-4 border-b text-center w-auto dark:border-gray-700">No.</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin Name</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
        <th class="py-2 px-4 border-b text-center dark:border-gray-700">Approved Weight</th>
        <th class="py-2 px-8 border-b text-center dark:border-gray-700">Functional Check</th>
        <th class="py-2 px-8 border-b text-center dark:border-gray-700">Visual Check</th>
        <th class="py-2 px-8 border-b text-center dark:border-gray-700">QC Pass</th>
        <th class="py-2 px-8 border-b text-center dark:border-gray-700"></th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(bin, index) in editFormData.binData" :key="bin.id" class="hover:bg-gray-100 dark:hover:bg-gray-100">
        <td class="py-2 px-4 border-b text-center dark:border-gray-700 dark:text-gray-200">
          {{ index + 1 }}
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700 dark:text-gray-200">
          {{ bin.binName }}
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700 dark:text-gray-200">
          {{ bin.weight }}
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700">
          <FormInput
            :class="{
              'border-red-500': (bin.approvedWeight &&
                (!isNumeric(bin.approvedWeight) || hasMoreThanFourDecimals(bin.approvedWeight)))
            }"
            id="approved-weight-form"
            v-model="bin.approvedWeight"
            type="text"
            placeholder="Approved Weight"
            step="any"
            class="w-20% dark:bg-gray-800 dark:text-gray-200"
          />
          <span v-if="bin.approvedWeight && !isNumeric(bin.approvedWeight)" class="text-red-500 dark:text-red-400">
            Approved Weight must be a valid number!
          </span>
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700">
          <FormInput
            v-model="bin.functionalCheck"
            :value="bin.functionalCheck || 'Pending'"
            readonly
            id="functionalCheck"
            @click="toggleCheck(bin, 'functionalCheck')"
            class="fake-dropdown-input dark:bg-gray-800 dark:text-gray-200"
          />
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700">
          <FormInput
            v-model="bin.visualCheck1"
            :value="bin.visualCheck1 || 'Pending'"
            readonly
            id="visualCheck1"
            @click="toggleCheck(bin, 'visualCheck1')"
            class="fake-dropdown-input dark:bg-gray-800 dark:text-gray-200"
          />
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700">
          <span
            v-if="bin.functionalCheck?.toLowerCase() === 'on-hold' || bin.visualCheck1?.toLowerCase() === 'on-hold'"
            class="text-red-500 dark:text-red-400"
          >
            Failed
          </span>
          <span v-else-if="!bin.functionalCheck || !bin.visualCheck1" class="text-gray-500 dark:text-gray-400">
            Pending
          </span>
          <span
            v-else-if="bin.functionalCheck?.toLowerCase() === 'approve' && bin.visualCheck1?.toLowerCase() === 'approve'"
            class="text-green-500 dark:text-green-400"
          >
            Pass
          </span>
        </td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-700">
          <button type="button" @click="resetRow(bin)" class="ml-2 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300">
            <i class="fa fa-refresh"></i>
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>






          <Button @click.prevent="updateRole" variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
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
          View Outgoing Quality Check
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div ref="toPrint">
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
            <div class="lg:flex lg:flex-row">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                      Job ID
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.jobId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700" v-if="editFormData.binData.length > 0">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Part Number
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.binData[0].productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Weight
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.weight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Approved Weight
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.processedWeight }}
                    </td>
                  </tr>



                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span :class="{
                        'text-green-600 dark:text-green-500': viewData.jobStatus === 'Completed',
                        'text-yellow-600 dark:text-yellow-500': viewData.jobStatus === 'Pending',
                        'text-gray-600': !viewData.jobStatus || viewData.jobStatus === ''
                      }">
                        {{ viewData.jobStatus || 'N/A' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

            </div>

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
<style scoped>
@media (max-width: 635px) {
  .responsive-table thead {
    display: none;
  }

  .responsive-table tbody tr {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
  }

  .responsive-table tbody td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #dddddd;
  }

  .responsive-table tbody td::before {
    content: attr(data-label);
    flex-basis: 50%;
    text-align: left;
    font-weight: bold;
  }
}
</style>