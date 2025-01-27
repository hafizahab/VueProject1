<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, toRefs } from "vue";
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
    inProcessQualityCheck?: string[];
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
                        userAccess.inProcessQualityCheck &&
                        userAccess.inProcessQualityCheck.includes("Edit") &&
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


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/IPQC/';
const loading = ref(false); // Loading state

onMounted(() => {
  // Start the loading animation modal
  loading.value = true;

  // Fetch data from all three APIs: Job data, Bins data, and Machine Station data
  Promise.all([
    axios.get(API_BASE_URL),                              // Fetch job data
    axios.get("http://10.87.0.33:8082/api/ListBins"),     // Fetch bins data
    axios.get("http://10.87.0.33:8082/api/MachineStation") // Fetch machine station data
  ])
    .then(([jobResponse, binsResponse, machineStationResponse]) => {
      let jobData = jobResponse.data.result.filter(
        (item: any) => item.status !== 'deleted' // Exclude 'deleted' status but keep 'Completed' for filtering in Tabulator
      );

      // Sort job data, prioritize "Pending" jobs, then by jobId in ascending order
      jobData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') return -1;
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') return 1;
        const jobIdA = parseInt(a.jobId.replace(/\D/g, ''), 10);
        const jobIdB = parseInt(b.jobId.replace(/\D/g, ''), 10);
        return jobIdA - jobIdB;
      });

      const binsData = binsResponse.data.result;
      const machineStationData = machineStationResponse.data.result;

      // Map jobData to include productCode from machineStationData based on jobId
      jobData = jobData.map((job: any) => {
        const matchingMachineStation = machineStationData.find(
          (station: any) => station.jobId === job.jobId
        );
        const productCode = matchingMachineStation?.productCode || 'N/A';
        return { ...job, productCode };
      });

      // Populate table with data
      if (tabulator.value) {
        tabulator.value.setData(jobData);

        // Apply a default filter to exclude "Completed" jobs
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      // Hide loading modal after all data is fetched
      loading.value = false;
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
  partNumber: '',
  qcPassed: false,
  processedWeight: '',
  waste: 0,
  totalTimeTaken: '',
});

// Form Data
const editFormData = reactive({
  id: null,
  jobId: '',
  subJobId: '',
  weight: '',
  jobStatus: '',
  shift: '',
  partNumber: '',
  qcPassed: false,
  processedWeight: '',
  waste: 0,
  totalTimeTaken: '',
  bins: [] as string[],
  binData: [] as any[],
  shifts: [] as any[],
});

// Define permission variable for inProcessQualityCheck
let canEditInProcessQualityCheck = false;

// Define the fetchUserInProcessQualityCheckPermissions function
const fetchUserInProcessQualityCheckPermissions = async () => {
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

      const inProcessQualityCheck = userDetails.inProcessQualityCheck || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for inProcessQualityCheck
      canEditInProcessQualityCheck = inProcessQualityCheck.includes('Edit');

      console.log('canEditInProcessQualityCheck:', canEditInProcessQualityCheck); // Debugging log
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

// Call the fetchUserInProcessQualityCheckPermissions function to get permissions
fetchUserInProcessQualityCheckPermissions();


const fetchJobDetails = () => {
  return new Promise((resolve, reject) => {
    console.log(`Fetching details for Job ID: ${editFormData.jobId}`); // Log the jobId being used

    // Fetch job details from the PlanningDetails API
    axios.get('http://10.87.0.33:8082/api/Blending')
      .then(response => {
        const nameData = response.data.result;

        console.log('Fetched PlanningDetails data:', nameData); // Log the entire response

        if (Array.isArray(nameData)) {
          // Filter out items with jobStatus as "deleted" (if that's the intent, adjust based on your real data)
          const activeNameData = nameData.filter(item => item.jobStatus && item.jobStatus.toLowerCase() !== 'deleted');

          // Find the item with the matching jobId (Ensure both are strings)
          const matchingItem = activeNameData.find(item => item.jobId === String(editFormData.jobId));

          if (matchingItem) {
            // Set the part number (productCode) and weight in editFormData
            editFormData.partNumber = matchingItem.productCode || 'N/A';
            console.log('Part Number found and set:', matchingItem.productCode); // Log the productCode

            // Set the weight in editFormData
            // editFormData.weight = matchingItem.totalWeight || 0;
            // viewData.weight = matchingItem.totalWeight || 0;
            // console.log('Weight found and set:', matchingItem.totalWeight);

            resolve(true);  // Resolve the promise when fetching is successful
          } else {
            console.error('No matching jobId found in active data');
            reject('No matching jobId found');
          }
        } else {
          console.error('Invalid response format for PlanningDetails:', nameData);
          reject('Invalid response format');
        }
      })
      .catch(error => {
        console.error('Error fetching job details:', error);
        reject(error);  // Reject the promise if there was an error
      });
  });
};

const totalWeight = computed(() => {
  return editFormData.binData.reduce((sum, bin) => {
    return sum + (bin.weight || 0);  // Sum bin weights, handling missing weights
  }, 0);
});

// Watch totalWeight and update editFormData.weight whenever totalWeight changes
watch(totalWeight, (newWeight) => {
  editFormData.weight = newWeight;  // Automatically set the weight to totalWeight
});

// Watcher for jobId changes
watch(() => editFormData.jobId, (newJobId) => {
  if (newJobId) {
    console.log(`Job ID changed: ${newJobId}`); // Log the new jobId
    fetchJobDetails(); // Fetch both part number and weight when jobId changes
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
const setviewModal = (value: any) => { viewModal.value = value;
  if (!value) {
    editFormData.weight = '';
    editFormData.partNumber = '';
    fetchJobDetails();
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
    // Fetch bin and bin master data
    const binResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
    const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');

    // Define the result arrays with their types
    const bins: Bin[] = binResponse.data.result;
    const binMasters: BinMaster[] = binMasterResponse.data.result;

    // Define binMasterMap with explicit typing
    const binMasterMap: { [key: string]: string } = {}; // Correct typing for binMasterMap

    // Map binMasterId to bin names
    binMasters.forEach((binMaster: BinMaster) => {
      binMasterMap[binMaster.id] = binMaster.name;
    });

    // Filter bins based on conditions
    const filteredBins = bins.filter((bin: Bin) =>
      bin.startIPQC &&                  // startIPQC must be true
      bin.weight > 0 &&                 // weight must be greater than 0
      (bin.type === 'Machine Station' || bin.type === 'Production' || bin.type === 'Waste') &&  // type can be 'Machine Station' or 'Waste'
      bin.mappingId === jobId            // mappingId must match jobId
    );

    if (filteredBins.length > 0) {
      // Add bin name to each filtered bin using binMasterId
      filteredBins.forEach((bin: Bin) => {
        bin.binName = binMasterMap[bin.binMasterId] || 'Unknown'; // Add bin name from the map
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

const toggleCheck = (bin : any, field : any) => {
  if (bin[field] === 'Approve') {
    bin[field] = 'Reject';
  } else if (bin[field] === 'Reject') {
    bin[field] = ''; // Empty string for pending
  } else {
    bin[field] = 'Approve';
  }
};

// Reset all fields for a given bin to empty
const resetRow = (bin : any) => {
  bin.dimensionCheck_IPQC = '';
  bin.functionalCheck_IPQC = '';
  bin.visualCheck1_IPQC = '';
  bin.visualCheck2_IPQC = '';
  bin.visualCheck3_IPQC = '';
};

// Calculate QC Pass status
const calculateQCPass = (bin: any) => {
  const { dimensionCheck_IPQC, functionalCheck_IPQC, visualCheck1_IPQC, visualCheck2_IPQC, visualCheck3_IPQC } = bin;

  // If Dimension Check is Rejected OR Functional Check is Rejected = Fail
  if (dimensionCheck_IPQC === 'Reject' || functionalCheck_IPQC === 'Reject') {
    return 'Fail';
  }

  // Else If Dimension Check is empty OR Functional Check is empty = Pending
  if (!dimensionCheck_IPQC || !functionalCheck_IPQC) {
    return 'Pending';
  }

  // Else
  if (!visualCheck1_IPQC && !visualCheck2_IPQC && !visualCheck3_IPQC) {
    // If VC1, VC2, VC3 are all empty = Pending
    return 'Pending';
  }

  // Check VC3
  if (visualCheck3_IPQC === 'Approve') {
    return 'Pass'; // VC3 is Approved = Pass
  }
  if (visualCheck3_IPQC === 'Reject') {
    return 'Fail'; // VC3 is Rejected = Fail
  }

  // Check VC2
  if (visualCheck2_IPQC === 'Approve') {
    return 'Pass'; // VC2 is Approved = Pass
  }
  if (visualCheck2_IPQC === 'Reject') {
    return 'Fail'; // VC2 is Rejected = Fail
  }

  // Check VC1
  if (visualCheck1_IPQC === 'Approve') {
    return 'Pass'; // VC1 is Approved = Pass
  }
  if (visualCheck1_IPQC === 'Reject') {
    return 'Fail'; // VC1 is Rejected = Fail
  }

  // Default case if none of the above matches
  return 'Pending';
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

let isLoading = ref(false);
const calculateTotalBinWeight = () => {
  if (editFormData.binData) {
    editFormData.weight = editFormData.binData.reduce((total, bin) => total + (bin.weight || 0), 0);
    viewData.weight = editFormData.binData.reduce((total, bin) => total + (bin.weight || 0), 0);
  }
};


// Fetch and Set Data for Edit/View
const fetchAndSetData = async  (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  isLoading.value = true; // Start loading

  try {
    // Fetch primary data
    const response = await axios.get(`${API_BASE_URL}${id}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      const [firstItem] = data;
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

      // Fetch bins and wait until the fetch is complete
      await fetchBins(firstItem.jobId);

      // Calculate the total bin weight after bins are fetched
      calculateTotalBinWeight();

      // Open the modal after all data has been fetched and calculated
      modalSetter(true);
    } else {
      console.error('No data found for the specified ID:', id);
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    isLoading.value = false; // End loading after all operations
  }
};





const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, editFormData, setviewModal, true);
// Update Table Data
const updateTableData = () => {
  // Start the loading animation modal
  loading.value = true;

  // Fetch data from all three APIs: Job data, Bins data, and Machine Station data
  Promise.all([
    axios.get(API_BASE_URL),                              // Fetch job data
    axios.get("http://10.87.0.33:8082/api/ListBins"),     // Fetch bins data
    axios.get("http://10.87.0.33:8082/api/MachineStation") // Fetch machine station data
  ])
    .then(([jobResponse, binsResponse, machineStationResponse]) => {
      let jobData = jobResponse.data.result.filter(
        (item: any) => item.status !== 'deleted' // Exclude 'deleted' status but keep 'Completed' for filtering in Tabulator
      );

      // Sort job data, prioritize "Pending" jobs, then by jobId in ascending order
      jobData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') return -1;
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') return 1;
        const jobIdA = parseInt(a.jobId.replace(/\D/g, ''), 10);
        const jobIdB = parseInt(b.jobId.replace(/\D/g, ''), 10);
        return jobIdA - jobIdB;
      });

      const binsData = binsResponse.data.result;
      const machineStationData = machineStationResponse.data.result;

      // Map jobData to include productCode from machineStationData based on jobId
      jobData = jobData.map((job: any) => {
        const matchingMachineStation = machineStationData.find(
          (station: any) => station.jobId === job.jobId
        );
        const productCode = matchingMachineStation?.productCode || 'N/A';
        return { ...job, productCode };
      });

      // Populate table with data
      if (tabulator.value) {
        tabulator.value.setData(jobData);

        // Apply a default filter to exclude "Completed" jobs
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      // Hide loading modal after all data is fetched
      loading.value = false;
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



const removeNewBin = (index: number) => {
  newBins.splice(index, 1);
};

const markBinAsChanged = (bin: any) => {
  bin.changed = true;
};



// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  // Prepare the payload for the main form submission
  const payload = {
    id: String(editFormData.id),
    jobId: String(editFormData.jobId),
    subJobId: String(editFormData.subJobId),
    shift: String(editFormData.shift),
    qcPassed: editFormData.qcPassed,
    jobStatus: String(editFormData.jobStatus),
    weight: editFormData.weight,
    processedWeight: editFormData.processedWeight,
    waste: editFormData.waste,
    totalTimeTaken: editFormData.totalTimeTaken,
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
      // Submit the main form data
      axios.put(`${API_BASE_URL}${editFormData.id}`, payload)
        .then(response => {
          console.log('API Response:', JSON.stringify(response.data, null, 2));

          // Now iterate over each bin and submit updates for each bin
          const binPromises = editFormData.binData.map(bin => {
            const binPayload = {
              mappingId: bin.mappingId,
              binMasterId: bin.binMasterId,
              type: bin.type,
              weight: bin.weight,
              dimensionCheck_IPQC: bin.dimensionCheck_IPQC,
              functionalCheck_IPQC: bin.functionalCheck_IPQC,
              visualCheck1_IPQC: bin.visualCheck1_IPQC,
              visualCheck2_IPQC: bin.visualCheck2_IPQC,
              visualCheck3_IPQC: bin.visualCheck3_IPQC,
              dimensionCheck: bin.dimensionCheck || '',
              functionalCheck: bin.functionalCheck || '',
              visualCheck1: bin.visualCheck1 || '',
              visualCheck2: bin.visualCheck2 || '',
              visualCheck3: bin.visualCheck3 || '',
              movement: bin.movement || '', // Example default value
              colour: bin.colour || '', // Example default value
              capacityMin: bin.capacityMin || 0,
              capacityMax: bin.capacityMax || 0,
              reassignBinId: bin.reassignBinId || '',
              productCode: bin.productCode || '',
              room: bin.room || ''
            };

            // Send the PUT request for each bin
            return axios.put(`http://10.87.0.33:8082/api/ListBins/${bin.id}`, binPayload)
              .then(binResponse => {
                console.log(`Bin ${bin.id} Updated:`, binResponse.data);
              })
              .catch(binError => {
                console.error(`Error updating bin ${bin.id}:`, binError);
              });
          });

          // Execute all bin updates
          Promise.all(binPromises).then(() => {
            // Perform other UI updates after success
            setEditSlideOver(false);
            updateTableData();
            resetFormData(editFormData);
            fetchNamesShift();
            fetchBinId();
            fetchJobDetails();

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

            formSubmitted.value = false; // Reset formSubmitted state after success
          });
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
  if (value) {

  }
};

const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
  if (!value) {
    editFormData.weight = '';
    editFormData.partNumber = '';
    fetchJobDetails();
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
  <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">In Progress Quality Check</h2>

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
  <div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>

<!-- Modal Trigger -->
<div v-else>
  <Dialog
:staticBackdrop="true" size="2xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit In Progress Quality Check
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form">
          <div>
            <FormLabel htmlFor="regular-form-gr">Job ID</FormLabel>
            <FormInput v-model="editFormData.jobId" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="part-number">Part Number</FormLabel>
            <FormInput v-model="editFormData.partNumber" id="part-number" type="text" disabled />
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



          <!-- Show the filtered list of bins below the Job Status input -->
          <div v-if="editFormData.binData.length > 0" class="overflow-auto">
    <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List of Bins</h6>
    <hr />

    <table class="min-w-full border-collapse rounded-lg shadow-sm mt-4">
      <thead class="bg-primary text-white">
        <tr>
          <th class="py-2 px-4 border-b text-center w-auto">No.</th>
          <th class="py-2 px-4 border-b text-center">Bin Name</th>
          <th class="py-2 px-4 border-b text-center">Weight</th>
          <th class="py-2 px-8 border-b text-center">Dimension Check</th>
          <th class="py-2 px-8 border-b text-center">Functional Check</th>
          <th class="py-2 px-8 border-b text-center">Visual Check 1</th>
          <th class="py-2 px-8 border-b text-center">Visual Check 2</th>
          <th class="py-2 px-8 border-b text-center">Visual Check 3</th>
          <th class="py-2 px-8 border-b text-center">QC Pass</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(bin, index) in editFormData.binData" :key="bin.id" class="hover:bg-gray-100">
          <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>
          <td class="py-2 px-4 border-b text-center">{{ bin.binName }}</td>
          <td class="py-2 px-4 border-b text-center">{{ bin.weight }}</td>

          <!-- Use FormInput fields that look like dropdowns -->
          <td class="py-2 px-4 border-b text-center">
            <FormInput
              v-model="bin.dimensionCheck_IPQC"
              :value="bin.dimensionCheck_IPQC || 'Pending'"
              readonly
              id="dimensionCheck"
              @click="toggleCheck(bin, 'dimensionCheck_IPQC')"
              class="fake-dropdown-input"
            />
          </td>

          <td class="py-2 px-4 border-b text-center">
            <FormInput
              v-model="bin.functionalCheck_IPQC"
              :value="bin.functionalCheck_IPQC || 'Pending'"
              readonly
              id="functionalCheck"
              @click="toggleCheck(bin, 'functionalCheck_IPQC')"
              class="fake-dropdown-input"
            />
          </td>

          <td class="py-2 px-4 border-b text-center">
            <FormInput
              v-model="bin.visualCheck1_IPQC"
              :value="bin.visualCheck1_IPQC || 'Pending'"
              readonly
              id="visualCheck1"
              @click="toggleCheck(bin, 'visualCheck1_IPQC')"
              class="fake-dropdown-input"
            />
          </td>

          <td class="py-2 px-4 border-b text-center">
            <FormInput
              v-model="bin.visualCheck2_IPQC"
              :value="bin.visualCheck2_IPQC || 'Pending'"
              readonly
              id="visualCheck2"
              @click="toggleCheck(bin, 'visualCheck2_IPQC')"
              class="fake-dropdown-input"
            />
          </td>

          <td class="py-2 px-4 border-b text-center">
            <FormInput
              v-model="bin.visualCheck3_IPQC"
              :value="bin.visualCheck3_IPQC || 'Pending'"
              readonly
              id="visualCheck3"
              @click="toggleCheck(bin, 'visualCheck3_IPQC')"
              class="fake-dropdown-input"
            />
          </td>

          <!-- QC Pass Column with Refresh Button -->
          <td class="py-2 px-4 border-b text-center">
            {{ calculateQCPass(bin) }}

            <!-- Refresh button to reset inputs -->
            <button type="button" @click="resetRow(bin)" class="ml-2 text-blue-500 hover:text-blue-700">
    <i class="fa fa-refresh"></i> <!-- Font Awesome icon for refresh -->
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
</div>
<div v-if="isLoading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>

<!-- Modal Trigger -->
<div v-else>
  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View In Progress Quality Check
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
                      {{ editFormData.jobId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Part Number
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.partNumber }}
                    </td>
                  </tr>

                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Weight
                    </th>
                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.weight }}
                    </td>
                  </tr>



                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span :class="{
                        'text-green-600 dark:text-green-500': editFormData.jobStatus === 'Completed',
                        'text-yellow-600 dark:text-yellow-500': editFormData.jobStatus === 'Pending',
                        'text-gray-600': !editFormData.jobStatus || editFormData.jobStatus === ''
                      }">
                        {{ editFormData.jobStatus || 'N/A' }}
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
</div>
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

.fixed {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5); /* Dark overlay */
  z-index: 9999; /* Ensures overlay is on top */
}
</style>