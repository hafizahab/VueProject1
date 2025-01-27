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
  id?: string;
  jobId?: string;
  subJobId?: string;
  jobStatus?: string;
}

interface UserAccess {
    userId: string;
    packingJob?: string[];
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
          title: "ID",
          minWidth: 150,
          responsive: 0,
          field: "id",
          vertAlign: "middle",
          visible: false,
          print: false,
          download: false,
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
          title: "SUB JOB ID",
          minWidth: 150,
          responsive: 0,
          field: "subJobId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.subJobId}</div>
              </div>`;
          },
        },

        {
          title: "STATUS",
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
                case 'Active':
                  statusClass = 'bg-teal-100 text-teal-800 border-teal-400 dark:text-teal-500';
                  break;
                case 'No Jobs':
                  statusClass = 'bg-sky-100 text-sky-800 border-sky-400 dark:text-sky-500';
                  break;
                case 'Submitted':
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
        const packingCode = response.packingId;

        // Placeholder while data is being fetched
        container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

        getUserAccessData()
            .then((userAccessData) => {
                const loggedInUserId = localStorage.getItem("userId");
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";

                if (userAccess && response.status !== "No Jobs") {
                    // Conditionally render "Edit" link
                    if (userAccess.packingJob && userAccess.packingJob.includes("Edit")) {
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
                            console.log("Edit button clicked for jobId:", response.jobId); // Log jobId
                            editRole(response.id); // Pass jobId here
                        });
                        editLink.innerHTML = `<i class="fa-regular fa-pen-to-square mr-1"></i>Edit`;
                        container.appendChild(editLink);
                    }


                }

                // Always render the "View" link
                if (response.status !== "No Jobs") {
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
                        viewRole(response.id); // Pass packingId here
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
    if (filter.status === "Submitted") {
      // Apply 'like' filter for "Pending" to include all statuses with the word "Pending"
      tabulator.value.setFilter("jobStatus", 'like', "Submitted");
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/Packing/GetPackingJobs';


onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Define all necessary fetch promises
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');
      const sortedData = filteredData.sort((a: any, b: any) => a.jobId - b.jobId);
      console.log('Sorted Data:', sortedData);

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus !== 'Completed');
      }
    }),
    fetchListBins(),
    fetchWM(),
  ];

  // Wait for all fetch calls to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize other functions that don't require loading modal
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
  colour: string;
  capacityMax: number;
}

interface JobItem {
  jobId: string;
  subJobId: string;
  binName: string;
  binCode: string;
  noofCartons: string;
}

const viewData = reactive<{
  jobs: JobItem[];

}>({
  jobs: [], // Initialize as an empty array of JobItem
});

// Define the type for Bag Details
interface BagDetails {
  whiteSlipId: string;
  bagId: string;
  bagType: string;
  weight: number;
  sticker: string;
}

interface CartonDetails {
  whiteSlipId: string;
  cartonId: string;
  cartonType: string;
  noofBags: number;
  weight: number;
  manualWeightOverride: boolean;
  sticker: string;
  status: string;
  listofBagsDetailsList: BagDetails[];
}

interface HoldingBags {
  jobId: string;
  bagId: string;
  subJobId: string;
  partNumber: string;
  weight: number;
  status: string;
}


// Form Data
const editFormData = reactive({
  id: '', // Initialize as an empty string
  jobStatus: '', // Initialize as an empty string
  jobId: '', // Initialize as an empty string
  subJobId: '', // Initialize as an empty string
  binName: '', // Initialize as an empty string
  binCode: '', // Initialize as an empty string
  binMasterName: '', // Initialize as an empty string
  noofCartons: 0, // Initialize as a number
  weight: 0, // Initialize as a number
  productCode: 0, // Initialize as a number
  approvedWeight: 0, // Initialize as a number
  weightmachine: '', // Default value for weightmachine
  noofPieces: 0,
  weightsp: '0',
  kgperBag: '0',
  noofPiecesperBag: 0,
  isWeightMachineDisabled: false, // Initial state for disabling weight machine
  weightmachines: [] as string[], // Initialize as an empty array of strings
  cartonTypes: [] as string[], // Initialize as an empty array of strings
  cartonMasterData: [] as any[], // Initialize as an empty array of carton master data
  packetTypes: [] as string[], // Add packetTypes property as an array of strings
  listofCartonsDetailsList: [] as CartonDetails[], // Initialize listofCartonsDetailsList as an array of CartonDetails
  listofHoldingBagsList: [] as HoldingBags[], // Initialize listofCartonsDetailsList as an array of CartonDetails
});

const addHoldingBag = async (numberToAdd = 1) => {
  for (let i = 0; i < numberToAdd; i++) {
    const newSubJobId = `${editFormData.jobId}-${editFormData.subJobId}-${editFormData.listofHoldingBagsList.length + 1}`;
    const newRow = {
      jobId: editFormData.jobId || '',
      bagId: newSubJobId,
      subJobId: '',
      partNumber: '',
      weight: 0,
      status: 'Pending',
      listofBagsDetailsList: [],
    };

    editFormData.listofHoldingBagsList.push(newRow);
  }
};

// Function to delete a wet job row
const deleteHoldingBag = (index: any) => {
  editFormData.listofHoldingBagsList.splice(index, 1);

};


// Dropdown control for Carton Type and Bag Type
const isCartonDropdownOpen = ref<number | null>(null);
const cartonSearchQuery = ref('');
const selectedCartonType = ref(null);



// Computed property to filter carton types based on search query
const filteredCartonTypes = computed(() => {
  if (!cartonSearchQuery.value) {
    return editFormData.cartonTypes;
  }
  return editFormData.cartonTypes.filter((cartonType) =>
    cartonType.toLowerCase().includes(cartonSearchQuery.value.toLowerCase())
  );
});


// Function to toggle dropdown open/close, with carton-specific tracking
const toggleCartonDropdown = (index: number) => {
  isCartonDropdownOpen.value = isCartonDropdownOpen.value === index ? null : index; // Toggle specific carton dropdown
  cartonSearchQuery.value = ''; // Clear search query when dropdown is opened
};


// Function to select a carton type
const selectCartonType = (cartonType: any, index: any) => {
  editFormData.listofCartonsDetailsList[index].cartonType = cartonType; // Set the selected type for the specific carton
  isCartonDropdownOpen.value = null; // Close the dropdown after selecting
};


const isBagDropdownOpen = ref<string | null>(null); // Track open state per bag with carton and bag index
const bagSearchQuery = ref('');
// Dynamic bag types based on carton type
const filteredBagTypes = (cartonIndex: any) => {
  if (!bagSearchQuery.value) {
    return editFormData.packetTypes;
  }
  return editFormData.packetTypes.filter((bagType) =>
    bagType.toLowerCase().includes(bagSearchQuery.value.toLowerCase())
  );
};
// Function to toggle bag dropdown open/close, identified by a unique string identifier
const toggleBagDropdown = (cartonIndex: number, bagIndex: number) => {
  const dropdownId = `${cartonIndex}-${bagIndex}`; // Unique identifier for each bag's dropdown
  isBagDropdownOpen.value = isBagDropdownOpen.value === dropdownId ? null : dropdownId;
  bagSearchQuery.value = ''; // Clear search query when dropdown is opened
};


// Function to select a bag type
const selectBagType = (bagType: any, cartonIndex: any, bagIndex: any) => {
  editFormData.listofCartonsDetailsList[cartonIndex].listofBagsDetailsList[bagIndex].bagType = bagType;
  isBagDropdownOpen.value = null; // Close the dropdown after selecting
};
const fetchWM = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type.toLowerCase() === 'weighing machine' &&
          item.location.toLowerCase() === 'packing'
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

const syncWeight = async (type: 'carton' | 'bag' | 'sampling' | 'holding', rowIndex: number, bagIndex?: number | null) => {
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
        if (type === 'carton') {
          // Update the weight for the specific carton
          editFormData.listofCartonsDetailsList[rowIndex].weight = weight;
        } else if (type === 'bag' && bagIndex !== null && bagIndex !== undefined) {
          // Update the weight for the specific bag within the carton
          editFormData.listofCartonsDetailsList[rowIndex].listofBagsDetailsList[bagIndex].weight = weight;
        } else if (type === 'holding') {
          // Update the weight for the specific holding bag
          editFormData.listofHoldingBagsList[rowIndex].weight = weight;
        } else if (type === 'sampling') {
          // Update the weight for the sampling
          editFormData.weightsp = weight.toString();
        }

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





const fetchPacketTypes = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/PacketMaster/GetBagTypeDDL');
    const packets = response.data.result || [];

    // Return the list of packet names (bag types)
    return packets.map((packet: any) => packet.name);
  } catch (error) {
    console.error('Error fetching packet types:', error);
    return [];
  }
};




const fetchProductCodeByJobId = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/Packing');
    const packingJobs = response.data.result || [];

    // Find the job with the matching jobId
    const matchingJob = packingJobs.find((job: any) => job.jobId === editFormData.jobId);

    if (matchingJob) {
      // Store the productCode in the form data
      editFormData.productCode = matchingJob.productCode;
      console.log('Product Code found:', matchingJob.productCode);

      // Fetch the carton type using the productCode
      await fetchCartonTypeByProductCode(matchingJob.productCode);
    } else {
      console.error('No matching jobId found in the packing jobs');
    }
  } catch (error) {
    console.error('Error fetching packing jobs:', error);
  }
};

// Fetch carton type based on product code for each new carton
const fetchCartonTypeByProductCode = async (productCode: any) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/ProductMaster');
    const products = response.data.result || [];
    const matchingProduct = products.find((product: any) => product.code === productCode);

    if (matchingProduct) {
      const cartonType = matchingProduct.cartonType.split(',')[0].trim();
      const normalizedCartonType = cartonType.toLowerCase().replace(/\s+/g, '');

      const cartonMasterResponse = await axios.get('http://10.87.0.33:8082/api/CartonMaster');
      const cartonMasterData = cartonMasterResponse.data.result || [];

      const matchingCartonMaster = cartonMasterData.find(
        (carton: any) => carton.name.toLowerCase().replace(/\s+/g, '') === normalizedCartonType
      );

      if (matchingCartonMaster) {
        if (matchingCartonMaster.subCartonDetailsList?.length > 0) {
          const firstSubCarton = matchingCartonMaster.subCartonDetailsList[0];
          return `${matchingCartonMaster.name}, ${firstSubCarton.capacity}`;
        } else {
          return matchingCartonMaster.name;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching carton type:', error);
  }
  return '';
};



const fetchCartonTypes = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/CartonMaster');
    const cartonTypes: any[] = response.data.result || [];

    // Process CartonMaster data
    const processedCartonTypes: string[] = []; // Explicitly define as string[]

    cartonTypes.forEach((carton: any) => {
      if (carton.subCartonDetailsList && carton.subCartonDetailsList.length > 0) {
        // If subCartonDetailsList exists, create entries for each subCarton
        carton.subCartonDetailsList.forEach((subCarton: any) => {
          const cartonWithCapacity = `${carton.name}, ${subCarton.capacity}`;
          processedCartonTypes.push(cartonWithCapacity);
        });
      } else {
        // If no subCartonDetailsList, just push the carton name
        processedCartonTypes.push(carton.name);
      }
    });

    // Set the processed carton types to the dropdown options
    editFormData.cartonTypes = processedCartonTypes;
    console.log('Processed Carton Types:', editFormData.cartonTypes);

  } catch (error) {
    console.error('Error fetching carton types:', error);
  }
};


const fetchCartonDetailsByType = async (cartonType: any) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/CartonMaster');
    const cartons = response.data.result || [];

    // Find the matching carton type in the CartonMaster
    const matchingCarton = cartons.find((carton: any) => carton.name === cartonType);

    // Return the number of bags per carton, default to 0 if not found
    return matchingCarton ? matchingCarton.noofBagsperCarton : 0;
  } catch (error) {
    console.error('Error fetching carton details:', error);
    return 0;
  }
};


const addCarton = async (numberToAdd = 1) => {
  for (let i = 0; i < numberToAdd; i++) {
    const newSubJobId = `${editFormData.jobId}-${editFormData.subJobId}-${editFormData.listofCartonsDetailsList.length + 1}`;
    const newRow = {
      whiteSlipId: editFormData.jobId || '',
      cartonId: newSubJobId,
      cartonType: '',
      noofBags: 0,
      weight: 0,
      manualWeightOverride: false, // Track if weight is manually set
      sticker: '',
      status: 'Pending',
      listofBagsDetailsList: [],
    };

    editFormData.listofCartonsDetailsList.push(newRow);
  }

  // Manually set noofCartons to the current list length
  editFormData.noofCartons = editFormData.listofCartonsDetailsList.length;

  // Fetch carton types if a product code exists for the added carton rows
  const productCode = editFormData.productCode;
  if (productCode) {
    await Promise.all(
      editFormData.listofCartonsDetailsList.map(async (carton, index) => {
        const cartonType = await fetchCartonTypeByProductCode(productCode);
        if (cartonType) {
          editFormData.listofCartonsDetailsList.splice(index, 1, {
            ...carton,
            cartonType,
          });
        }
      })
    );
  }
};

const addBags = async (carton: any, numberOfBags: any) => {
  const existingBagsCount = carton.listofBagsDetailsList.length;

  // Add new bags if the new number is greater than the existing count
  for (let i = existingBagsCount; i < numberOfBags; i++) {
    const newBagId = `${carton.cartonId}-${i + 1}`;
    const newBagRow = {
      whiteSlipId: carton.whiteSlipId || '',
      bagId: newBagId,
      bagType: '',
      weight: 0,
      sticker: '',
    };
    carton.listofBagsDetailsList.push(newBagRow);
  }

  // Update noofBags based on the actual list length
  carton.noofBags = carton.listofBagsDetailsList.length;
  calculateCartonWeight(carton); // Recalculate weight after adding bags
  // Fetch the bag type based on carton type
  if (carton.cartonType) {
    const [name, capacity] = carton.cartonType.split(',').map((item: any) => item.trim());
    const { bagType } = await fetchCartonDetailsForBagType(name, capacity);
    carton.listofBagsDetailsList.forEach((bag: any) => {
      bag.bagType = bagType;
    });
  }
};

// Function to calculate the total weight of a carton based on its bags
const calculateCartonWeight = (carton: any) => {
  if (!carton.manualWeightOverride) {
    carton.weight = carton.listofBagsDetailsList.reduce((sum: any, bag: any) => sum + parseFloat(bag.weight || 0), 0);
  }
};

// Watcher for changes in bag weights to update carton weight
watch(
  () => editFormData.listofCartonsDetailsList.map(carton => carton.listofBagsDetailsList.map(bag => bag.weight)),
  (newWeights, oldWeights) => {
    editFormData.listofCartonsDetailsList.forEach((carton) => {
      calculateCartonWeight(carton);
    });
  },
  { deep: true }
);

// Fetch bag details based on carton type
const fetchCartonDetailsForBagType = async (name: any, capacity: any) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/CartonMaster');
    const cartons = response.data.result || [];
    const matchingCarton = cartons.find((carton: any) => carton.name === name);

    if (matchingCarton?.subCartonDetailsList) {
      const matchingSubCarton = matchingCarton.subCartonDetailsList.find(
        (subCarton: any) => subCarton.capacity === parseInt(capacity)
      );

      return {
        noofBagsperCarton: matchingSubCarton?.noofBagsperCarton || 0,
        bagType: matchingSubCarton?.bagType || '',
      };
    }
  } catch (error) {
    console.error('Error fetching carton details for bag type:', error);
  }
  return { noofBagsperCarton: 0, bagType: '' };
};

// Initialize packet types on component mount
const loadPacketTypes = async () => {
  editFormData.packetTypes = await fetchPacketTypes();
};
loadPacketTypes();




// Function to delete a wet job row
const deleteCarton = (index: any) => {
  editFormData.listofCartonsDetailsList.splice(index, 1);
  updateCartonIds(); // Re-fetch carton IDs after deletion

};

const deleteBag = (carton: any, bagIndex: number) => {
  carton.listofBagsDetailsList.splice(bagIndex, 1);
  updateBagIds(carton); // Re-fetch bag IDs for this carton after deletion
};

const updateCartonIds = () => {
  editFormData.listofCartonsDetailsList.forEach((carton, index) => {
    carton.cartonId = `${editFormData.jobId}-${editFormData.subJobId}-${index + 1}`;
    // Update bag IDs for each carton as well
    updateBagIds(carton);
  });
};

// Re-fetch bag IDs based on the current list order within each carton
const updateBagIds = (carton: any) => {
  carton.listofBagsDetailsList.forEach((bag: any, index: any) => {
    bag.bagId = `${carton.cartonId}-${index + 1}`;
  });
};



// Define permission variable for wetTreatmentJob
let canEditWetTreatmentJob = false;

// Define the fetchUserWetTreatmentPermissions function
const fetchUserWetTreatmentPermissions = async () => {
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

      const wetTreatmentJob = userDetails.packingJob || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for wetTreatmentJob
      canEditWetTreatmentJob = wetTreatmentJob.includes('Edit');

      console.log('canEditWetTreatmentJob:', canEditWetTreatmentJob); // Debugging log
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

// Call the fetchUserWetTreatmentPermissions function to get permissions
fetchUserWetTreatmentPermissions();



interface ListBin {
  binMasterId: string;
  subJobId: string;
  mappingId: string;
  colour: string;
  weight: number;
  capacityMax: number;
  type: string;
}

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









const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => {
  editModal.value = value;
};

// Watch for changes to editModal
watch(editModal, (newValue) => {
  if (!newValue) {
    // If the modal is closed, clear the listofHoldingBagsList
    editFormData.listofHoldingBagsList = [];
    editFormData.listofCartonsDetailsList = [];
    editFormData.noofPieces = 0;
    editFormData.weightsp = '0';
    editFormData.kgperBag = '0';
    editFormData.noofPiecesperBag = 0;
  }
});

watch(viewModal, (newValue) => {
  if (!newValue) {
    // If the modal is closed, clear the listofHoldingBagsList
    editFormData.listofHoldingBagsList = [];
    editFormData.listofCartonsDetailsList = [];
    editFormData.noofPieces = 0;
    editFormData.weightsp = '0';
    editFormData.kgperBag = '0';
    editFormData.noofPiecesperBag = 0;
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

const fetchCartonAndBagDetails = async () => {
  try {
    // Fetch the packing jobs data from the API
    const response = await axios.get('http://10.87.0.33:8082/api/Packing/GetPackingJobs');
    const packingJobs = response.data.result || [];

    console.log('Packing Jobs Data:', packingJobs); // Log the entire response for debugging

    // Find the job that matches both jobId and subJobId from editFormData
    const matchingJob = packingJobs.find(
      (job: any) => job.jobId === editFormData.jobId && job.subJobId === editFormData.subJobId
    );

    if (matchingJob) {
      console.log('Matching Job Found:', matchingJob); // Log the matching job for debugging

      // Set carton details
      if (matchingJob.listofCartonsDetailsList && Array.isArray(matchingJob.listofCartonsDetailsList)) {
        editFormData.listofCartonsDetailsList = matchingJob.listofCartonsDetailsList.map((carton: any) => ({
          ...carton,
          listofBagsDetailsList: carton.listofBagsListforPacking || [],
        }));

        console.log('Updated Carton Details:', editFormData.listofCartonsDetailsList); // Log updated carton details
      } else {
        console.warn('No listofCartonsDetailsList found or it is not an array.');
      }

      // Extract the last sampling detail from listofSamplingsforPacking
      if (matchingJob.listofSamplingsforPacking && Array.isArray(matchingJob.listofSamplingsforPacking)) {
        const samplingDetails = matchingJob.listofSamplingsforPacking.slice(-1)[0]; // Get the last element

        // Set the sampling details to editFormData
        if (samplingDetails) {
          editFormData.noofPieces = samplingDetails.noofPieces || 0;
          editFormData.weightsp = samplingDetails.weight || '';
          editFormData.noofPiecesperBag = samplingDetails.noofPiecesperBag || 0;
          editFormData.kgperBag = samplingDetails.kgperBag || '';
        }

        console.log('Updated Sampling Details (Last Entry):', samplingDetails); // Log the last sampling detail
      } else {
        console.warn('No listofSamplingsforPacking found or it is not an array.');
      }
    } else {
      console.error('No matching job found for the specified jobId and subJobId:', {
        jobId: editFormData.jobId,
        subJobId: editFormData.subJobId,
      });
    }
  } catch (error) {
    console.error('Error fetching carton and bag details:', error);
  }
};




// Usage: Call this function when you need to fetch and set carton and bag details
fetchCartonAndBagDetails();

const fetchBinHoldingDetails = async () => {
  try {
    // Fetch the holding bags data from the API
    const response = await axios.get('http://10.87.0.33:8082/api/HoldingBagList');
    const holdingBags = response.data.result || [];

    console.log('Holding Bags Data:', holdingBags); // Log the data for debugging

    // Filter to get the bags that match the jobId from editFormData and have weight > 0
    const matchingBags = holdingBags
      .filter((bag: any) => bag.jobId === editFormData.jobId && bag.weight > 0)
      .map((bag: any) => ({
        ...bag,
        status: bag.status && bag.status.trim() ? bag.status : "Active", // Default to "Active" if status is empty
      }))
      .sort((a: any, b: any) => {
        // Sort by bagId. If bagId is empty, place it at the end.
        if (!a.bagId) return 1;
        if (!b.bagId) return -1;
        return a.bagId.localeCompare(b.bagId, undefined, { numeric: true });
      });

    if (matchingBags.length > 0) {
      console.log('Matching Bags Found (Sorted):', matchingBags); // Log the matching and sorted bags for debugging

      // Set the matching bags to listofHoldingBagsList in editFormData
      editFormData.listofHoldingBagsList = matchingBags;
    } else {
      console.warn('No matching bags found for jobId:', editFormData.jobId);
    }
  } catch (error) {
    console.error('Error fetching bin holding details:', error);
  }
};




const fetchAndSetData = async (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false): Promise<void> => {
  loading.value = true; // Show loading animation

  try {
    console.log('Fetching data for jobId:', id);

    // Step 1: Fetch job data
    const response = await axios.get(API_BASE_URL);
    const data = response.data.result;

    if (data && data.length > 0) {
      console.log('Retrieved Data:', data);
      const item = data.find((item: any) => item.id === id);

      if (item) {
        // Step 2: Fetch ListBins to get binMasterId based on binCode
        const listBinsResponse = await axios.get('http://10.87.0.33:8082/api/ListBins');
        const listBinsData = listBinsResponse.data.result;
        const matchedBin = listBinsData.find((bin: any) => bin.id === item.binCode);

        let binMasterName = 'N/A'; // Default value for binMasterName

        if (matchedBin) {
          const binMasterId = matchedBin.binMasterId;

          // Step 3: Fetch BinMaster data to get the name
          const binMasterResponse = await axios.get('http://10.87.0.33:8082/api/BinMaster');
          const binMasterData = binMasterResponse.data.result;
          const binMaster = binMasterData.find((bin: any) => bin.id === binMasterId);

          // Set binMasterName to the found name or "N/A" if not found
          binMasterName = binMaster ? binMaster.name : 'N/A';

          console.log('Bin Name:', binMasterName);
        } else {
          console.warn('No matching bin found for binCode:', item.binCode);
        }

        // Step 4: Assign binMaster name and id to formData
        Object.assign(formData, {
          id: item.id,
          jobId: item.jobId,
          subJobId: item.subJobId,
          weight: item.weight,
          approvedWeight: item.approvedWeight,
          binCode: item.binCode,
          binMasterName: binMasterName,
          noofCartons: item.noofCartons,
          jobStatus: item.jobStatus,
        });

        // Open the modal immediately
        modalSetter(true);

        // Fetch additional data concurrently
        const fetchPromises = [
          fetchCartonAndBagDetails(),
          fetchProductCodeByJobId(),
          fetchCartonTypes(),
          fetchBinHoldingDetails(), // Fetch this concurrently
        ];

        // Wait for all data fetching promises to resolve
        await Promise.all(fetchPromises);
        console.log('Modal should be opened now.');
      } else {
        console.error('No data found for the specified jobId:', id);
        modalSetter(true); // Open the modal even if no item is found
      }
    } else {
      console.error('No data found.');
      modalSetter(true); // Open the modal even if no data is found
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    handleError(error, 'Error fetching data for editing');
    modalSetter(true); // Open the modal even if there is an error
  } finally {
    loading.value = false; // End loading animation
  }
};













const editRole = (id: string) => {
  console.log('Edit role clicked for jobId:', id);  // Log jobId passed to editRole
  fetchAndSetData(id, editFormData, seteditModal);
};

const viewRole = (jobId: string) => {
  console.log('viewRole triggered for jobId:', jobId);  // Debug log
  fetchAndSetData(jobId, editFormData, setviewModal, true);
};



// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  // Define all necessary fetch promises
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');
      const sortedData = filteredData.sort((a: any, b: any) => a.jobId - b.jobId);
      console.log('Sorted Data:', sortedData);

      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus !== 'Completed');
      }
    }),
    fetchListBins(),
    fetchWM(),
  ];

  // Wait for all fetch calls to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize other functions that don't require loading modal
  initTabulator();
  reInitOnResizeWindow();

};

// Computed property to calculate KG per Bag
// Computed property to calculate KG per Bag
const calculateKgPerBag = computed(() => {
  // Use the correct property name for weight
  const { weightsp, noofPieces, noofPiecesperBag } = editFormData;

  // Convert weightsp to a number using parseFloat
  const weight = parseFloat(weightsp);

  // Check if weight and noofPieces are greater than zero to avoid division by zero
  if (!isNaN(weight) && noofPieces > 0) {
    return (weight * noofPiecesperBag) / noofPieces;
  }
  return 0; // Return 0 if weight is NaN or noofPieces is zero
});

// Watch for changes in weightsp, noofPieces, and noofPiecesperBag
watch(
  () => [editFormData.weightsp, editFormData.noofPieces, editFormData.noofPiecesperBag],
  () => {
    // Calculate and round to four decimal places
    editFormData.kgperBag = parseFloat(calculateKgPerBag.value.toFixed(4)).toString();
  }
);



const updateJobStatus = async (event: Event) => {
  event.preventDefault(); // Prevent the form from actually submitting

  // Extract jobId, subJobId, binCode, weight, approvedWeight, and list details from form data
  const jobId = editFormData.jobId;
  const subJobId = editFormData.subJobId;
  const binCode = editFormData.binCode;
  const weight = editFormData.weight;
  const approvedWeight = editFormData.approvedWeight;

  // Prepare the payload for job details (to be submitted in the second API call)
  const updateJobDetailsPayload = {
    jobId: String(editFormData.jobId),
    subJobId: String(editFormData.subJobId),
    binCode: String(editFormData.binCode),
    weight: editFormData.weight,
    approvedWeight: editFormData.approvedWeight,
    noofCartons: editFormData.noofCartons,
    jobStatus: editFormData.jobStatus,
    listofCartonsDetailsList: editFormData.listofCartonsDetailsList.map(carton => ({
      whiteSlipId: String(editFormData.jobId),
      cartonId: carton.cartonId,
      cartonType: carton.cartonType,
      noofBags: carton.noofBags,
      weight: carton.weight,
      sticker: carton.sticker,
      status: "Active",
      listofBagsListforPacking: carton.listofBagsDetailsList.map(bag => ({
        whiteSlipId: String(editFormData.jobId),
        bagId: bag.bagId,
        bagType: bag.bagType,
        weight: bag.weight,
        sticker: bag.sticker,
        status: "Active",
      }))
    })),
    listofHoldingBagsList: [{
      jobId: '',
      bagId: '',
      subJobId: '',
      partNumber: '',
      weight: '',
      status: '',
    }],
    listofSamplingsList: [{
      jobId: String(editFormData.jobId),
      subJobId: String(editFormData.subJobId),
      noofPieces: editFormData.noofPieces,
      weight: editFormData.weightsp ? editFormData.weightsp : 0, // Set to 0 if weight is null or empty
      noofPiecesperBag: editFormData.noofPiecesperBag,
      kgperBag: editFormData.kgperBag
    }]
  };

  // Log the payload before submission
  console.log('Job Details Payload:', JSON.stringify(updateJobDetailsPayload, null, 2));

  // Ask for final confirmation after showing the payload in the console
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will update the data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, submit it!',
  });

  if (!result.isConfirmed) {
    return; // Exit if not confirmed
  }

  try {
    // Step 1: Update the job status
    const jobStatusResponse = await axios.post('http://10.87.0.33:8082/api/Packing/UpdatePackignJobStatus', { jobId, subJobId });
    if (jobStatusResponse.status === 200) {
      // Step 2: Send the second PUT request with the updated job details
      const updateJobDetailsResponse = await axios.put(`http://10.87.0.33:8082/api/Packing/UpdatePackingJobDetailsbyId/${editFormData.id}`, updateJobDetailsPayload);

      if (updateJobDetailsResponse.status === 200) {
        // Show a single success alert after both requests are completed
        Swal.fire({
          icon: 'success',
          title: 'Job Status and Details Updated Successfully',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          position: 'top-end',
          iconColor: 'green',
          toast: true,
          background: '#fff',
        });

        // Step 5: Refresh the list if needed
        updateTableData(); // Refresh job table after the update
        seteditModal(false);
      } else {
        console.error('Error updating job details:', updateJobDetailsResponse);
      }
    } else {
      console.error('Error updating job status:', jobStatusResponse);
    }
  } catch (error) {
    console.error('Error during job status or details update:', error);
    Swal.fire({
      icon: 'error',
      title: 'Failed!',
      text: 'There was an error updating the job status or job details. Please try again.',
    });
  }
};



// Method to release the weight of a holding bag
const releaseHoldingBag = async (index : any) => {
  // Get the specific holding bag data from the list
  const holdingBag = editFormData.listofHoldingBagsList[index];

  // Show a confirmation alert before proceeding
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: 'This will release the weight of the selected holding bag!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, release it!',
  });

  // If the user cancels, exit the function
  if (!result.isConfirmed) {
    return;
  }

  try {
    // Step 1: Fetch the job data to get the productCode
    const jobResponse = await axios.get('http://10.87.0.33:8082/api/Packing');
    const jobData = jobResponse.data.result || [];

    // Find the job that matches the jobId
    const jobMatch = jobData.find((job : any) => job.jobId === holdingBag.jobId);

    // If no matching job is found, show an error and exit
    if (!jobMatch) {
      Swal.fire({
        icon: 'error',
        title: 'No matching job found!',
        text: 'Please check the jobId.',
      });
      return;
    }

    // Extract the productCode and set it as partNumber
    const partNumber = jobMatch.productCode || '';

    // Prepare the updated payload with weight set to zero and the partNumber
    const payload = {
      jobId: String(holdingBag.jobId),
      bagId: holdingBag.bagId,
      subJobId: String(holdingBag.subJobId),
      partNumber, // Use the productCode from the job data as partNumber
      weight: 0, // Set weight to zero
      status: "Active" // Keep the status as "Active"
    };

    // Log the payload in JSON format
    console.log("Payload:", JSON.stringify(payload, null, 2));

    // Step 2: Fetch existing data to check for a match
    const response = await axios.get('http://10.87.0.33:8082/api/HoldingBagList');

    if (response.status === 200) {
      const existingData = response.data.result;

      // Check if there is a match for all fields in the payload
      const match = existingData.find((item : any) =>
        item.jobId === payload.jobId &&
        item.bagId === payload.bagId &&
        item.subJobId === payload.subJobId
      );

      if (match) {
        // Use PUT request to update the matching item
        const updateResponse = await axios.put(
          `http://10.87.0.33:8082/api/HoldingBagList/${match.id}`,
          payload
        );

        // Log the submitted response
        console.log("Submitted Response:", updateResponse);

        if (updateResponse.status === 200) {
          // Successfully updated, set the weight to zero in the local data
          editFormData.listofHoldingBagsList[index].weight = 0;

          // Show a success message
          Swal.fire({
            icon: 'success',
            title: 'Bag weight released successfully',
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: 'top-end',
            iconColor: 'green',
            toast: true,
            background: '#fff',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed to release the bag weight.',
            text: 'Please try again.',
          });
        }
      } else {
        // No match found
        Swal.fire({
          icon: 'error',
          title: 'No matching holding bag found!',
          text: 'Please check the data.',
        });
      }
    }
  } catch (error) {
    console.error('Error releasing bag weight:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: 'Failed to update the bag weight. Please check your connection and try again.',
    });
  }
};




const submitHoldingBags = async (event: Event) => {
  event.preventDefault(); // Prevent the form from actually submitting

  const { jobId, subJobId, listofHoldingBagsList } = editFormData;

  try {
    // Step 1: Fetch productCode from the Packing API
    const packingResponse = await axios.get('http://10.87.0.33:8082/api/Packing');

    if (packingResponse.status !== 200) {
      throw new Error('Failed to fetch product codes.');
    }

    const packingData = packingResponse.data.result || [];

    // Find the productCode for the current jobId
    const jobData = packingData.find((job: any) => job.jobId === jobId);
    const partNumber = jobData ? jobData.productCode : '';

    // Prepare payloads using the fetched partNumber
    const payloads = listofHoldingBagsList.map(holding => ({
      jobId: String(jobId),
      bagId: holding.bagId,
      subJobId: String(subJobId),
      partNumber: partNumber, // Use the fetched productCode as partNumber
      weight: holding.weight,
      status: "Active"
    }));

    // Log the payloads before submission
    console.log('Job Details Payloads:', JSON.stringify(payloads, null, 2));

    // Ask for confirmation before making requests
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will update or create the data for all holding bags!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit them!',
    });

    if (!result.isConfirmed) {
      return; // Exit if not confirmed
    }

    // Step 2: Fetch existing data to check for matches
    const response = await axios.get('http://10.87.0.33:8082/api/HoldingBagList');

    if (response.status === 200) {
      const existingData = response.data.result;

      // Step 3: Iterate over each payload and decide whether to use PUT or POST
      const requests = payloads.map(async (payload) => {
        const match = existingData.find((item: any) =>
          item.jobId === payload.jobId &&
          item.bagId === payload.bagId &&
          item.subJobId === payload.subJobId
        );

        if (match) {
          return axios.put(
            `http://10.87.0.33:8082/api/HoldingBagList/${match.id}`,
            payload
          );
        } else {
          return axios.post(
            'http://10.87.0.33:8082/api/HoldingBagList',
            payload
          );
        }
      });

      // Execute all requests (PUT or POST) in parallel
      const responses = await Promise.all(requests);

      // Check if all requests were successful
      if (responses.every(response => response.status === 200 || response.status === 201)) {
        // Update the status of all holding bags to "Active" in the local state
        editFormData.listofHoldingBagsList = editFormData.listofHoldingBagsList.map(bag => ({
          ...bag,
          status: "Active",
        }));

        Swal.fire({
          icon: 'success',
          title: 'All Job Details Updated or Created Successfully',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          position: 'top-end',
          iconColor: 'green',
          toast: true,
          background: '#fff',
        });

        // Refresh the job table and close the modal
        updateTableData();
      } else {
        console.error('Error updating or creating some job details:', responses);
        Swal.fire({
          icon: 'error',
          title: 'Failed to update or create some job details.',
          text: 'Please check the console for more details.',
        });
      }
    } else {
      console.error('Error fetching existing data:', response);
    }
  } catch (error) {
    console.error('Error during job status or details update:', error);
    Swal.fire({
      icon: 'error',
      title: 'Failed!',
      text: 'There was an error updating or creating the job details. Please try again.',
    });
  }
};







const updateRole = (job: any, bins: any[]) => {
  if (bins) {
    bins.forEach((bin, index) => {
      const binPayload = {
        mappingId: job.jobId,
        binMasterId: bin.binMasterId,
        subJobId: job.subJobId,
        type: 'Packing',
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

      axios.post('http://10.87.0.33:8082/api/ListBins/AddListBinsfromWetTreatmentJobs', binPayload)
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
    <h2 class="mr-auto text-lg font-medium">Packing Job</h2>

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
                <option value="Submitted">Submitted</option>
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
          Edit Packing Job
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
        <form class="validate-form" @submit.prevent="updateJobStatus">
          <div>
            <!-- Display Machine ID and Overall Status -->
            <div class="relative overflow-x-auto sm:rounded-lg">
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
                      Sub Job ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.subJobId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Bin Name
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.binMasterName }} <!-- Display binMaster.name here -->
                    </td>
                  </tr>

                  <tr class="border-b border-gray-200 dark:border-gray-700 hidden">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.weight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700 hidden">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Approved Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ editFormData.approvedWeight }}
                    </td>
                  </tr>


                </tbody>
              </table>
            </div>

            <div class="mt-5 flex justify-between items-center">
              <h6 class="mb-3 mt-2 text-lg font-medium leading-none">Sampling</h6>

            </div>
            <hr />
            <div class="mt-2 relative overflow-x-auto sm:rounded-lg">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-collapse">
                <!-- Table Header -->
                <thead>
                  <tr class="bg-primary text-white dark:bg-gray-800">
                    <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Number of Pieces</th>
                    <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Weight</th>
                    <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Number of Pieces per Bag</th>
                    <th class="px-6 py-3 text-center font-medium whitespace-nowrap">KG per Bag</th>
                  </tr>
                </thead>
                <!-- Table Body -->
                <tbody>
                  <tr class=" border-b">
                    <td class="px-6 py-4 text-center">
                      <FormInput id="regular-form-1" v-model="editFormData.noofPieces" type="number"
                        placeholder="Number of Pieces" class="w-full text-center  outline-none focus:ring-0" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <div class="flex items-center space-x-2">
                        <!-- Weight input with manual override flag -->
                        <FormInput id="regular-form-2" v-model="editFormData.weightsp" type="text" placeholder="Weight"
                          class="w-full text-center outline-none focus:ring-0" />
                        <button type="button" @click="syncWeight('sampling', 0)"
                          class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-1 text-white rounded">
                          <i class="fa fa-refresh"></i>
                        </button>
                      </div>
                    </td>

                    <td class="px-6 py-4 text-center border-b">
                      <FormInput id="regular-form-3" v-model="editFormData.noofPiecesperBag" type="text"
                        placeholder="Pieces per Bag" class="w-full text-center  outline-none focus:ring-0" />
                    </td>
                    <td class="px-6 py-4 text-center border-b">
                      <FormInput id="regular-form-4" v-model="editFormData.kgperBag" type="text"
                        placeholder="KG per Bag" class="w-full text-center outline-none focus:ring-0" disabled />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>



            <!-- Table for Jobs -->

          </div>

          <!-- No of Cartons input field -->

          <div class="mt-5 hidden">
            <FormLabel htmlFor="regular-form-8">No of Cartons</FormLabel>
            <FormInput id="regular-form-8" v-model="editFormData.noofCartons" type="number"
              placeholder="No of Cartons" />
          </div>

          <!-- Table for dynamically added cartons and bags -->


          <!-- Table for dynamically added cartons -->
          <div class="mt-5 flex justify-between items-center">
            <h6 class="mb-mt-2 text-lg font-medium leading-none">Carton and Bag Details</h6>
            <button type="button" @click="addCarton(1)"
              class="mt-2 mb-3 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">
              Add Carton
            </button>
          </div>
          <hr />

          <div v-if="editFormData.listofCartonsDetailsList.length > 0" class="mt-5 border py-5 px-3 rounded-lg ">
            <template v-for="(row, index) in editFormData.listofCartonsDetailsList" :key="index">
              <div class="mt-5 border py-5 px-3 rounded-lg ">
                <!-- Carton Table -->
                <table class="min-w-full border-collapse rounded-lg shadow-sm">
                  <thead class="bg-primary text-white">
                    <tr>
                      <th class="py-2 px-4 border-b text-center rounded-tl-lg">No.</th>
                      <th class="py-2 px-4 border-b text-center">Carton ID</th>
                      <th class="py-2 px-4 border-b text-center">Carton Type</th>
                      <th class="py-2 px-4 border-b text-center">Weight</th>
                      <th class="py-2 px-4 border-b text-center">Status</th>
                      <th class="py-2 px-4 border-b text-center">Bag</th>
                      <th class="py-2 px-4 border-b text-center rounded-tr-lg"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr class="hover:bg-gray-100">
                      <td class="py-2 px-4 border-b">
                      {{ index + 1 }}
                      </td>
                      <td class="py-2 px-4 border-b">
                        <FormInput v-model="row.cartonId" type="text" class="w-full px-2 py-1 border rounded"
                          disabled />
                      </td>
                      <td class="py-2 px-4 border-b">
                        <div class="relative">
                          <!-- Dropdown trigger -->
                          <div @click="toggleCartonDropdown(index)" class="cursor-pointer p-2 border rounded">
                            {{ editFormData.listofCartonsDetailsList[index].cartonType || 'Select a Carton Type' }}
                          </div>
                          <!-- Dropdown content -->
                          <div v-if="isCartonDropdownOpen === index"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <input type="text" v-model="cartonSearchQuery" placeholder="Search Carton Type"
                              class="border-b border-gray-300 p-2 w-full" />
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="cartonType in filteredCartonTypes" :key="cartonType"
                                @click="selectCartonType(cartonType, index)"
                                class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ cartonType }}
                              </li>
                              <li v-if="filteredCartonTypes.length === 0" class="p-2 text-gray-500">No results found
                              </li>
                            </ul>
                          </div>
                        </div>
                      </td>



                      <td class="py-2 px-4 border-b">
                        <div class="flex items-center space-x-2">
                          <!-- Weight input with manual override flag -->
                          <FormInput v-model="row.weight" type="text" class="w-full px-2 py-1 border rounded"
                            @input="row.manualWeightOverride = true" />
                          <button type="button" @click="syncWeight('carton', index)"
                            class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-1 text-white rounded">
                            <i class="fa fa-refresh"></i>
                          </button>
                        </div>
                      </td>
                      <td class="py-2 px-4 border-b">
                        <FormInput v-model="row.status" type="text" class="w-full px-2 py-1 border rounded" disabled />
                      </td>
                      <td class="py-2 px-4 border-b text-center">
                        <!-- Button to Add Bag -->
                        <button type="button" @click="addBags(row, row.noofBags + 1)"
                          class="mt-2 mb-3 px-2 py-2 bg-green-700 text-white rounded hover:bg-green-900">
                          Add Bag
                        </button>
                      </td>
                      <td class="py-2 px-4 border-b text-center">
                        <!-- Delete Carton Button -->
                        <button type="button" @click="deleteCarton(index)"
                          class="text-red-600 hover:text-red-800 text-lg px-2 py-1 rounded">
                          <i class="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>

                    <!-- Bags Details for the current carton -->
                    <tr v-if="row.listofBagsDetailsList.length > 0">
                      <td colspan="7" class="pt-4">
                        <h5 class="text-center text-md font-medium mb-2">Bags Details for Carton {{ row.cartonId }}</h5>
                        <table class="min-w-full border-collapse rounded-lg shadow-sm mt-2">
                          <thead class="bg-primary text-white">
                            <tr>
                              <th class="py-2 px-4 border-b text-center rounded-tl-lg">No.</th>
                              <th class="py-2 px-4 border-b text-center">Bag ID</th>
                              <th class="py-2 px-4 border-b text-center">Bag Type</th>
                              <th class="py-2 px-4 border-b text-center">Weight</th>
                              <th class="py-2 px-4 border-b text-center rounded-tr-lg"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="(bag, bagIndex) in row.listofBagsDetailsList" :key="bagIndex"
                              class="hover:bg-gray-100">
                              <td class="py-2 px-4 border-b">
                                {{bagIndex + 1}}
                              </td>
                              <td class="py-2 px-4 border-b">
                                <FormInput v-model="bag.bagId" type="text" class="w-full px-2 py-1 border rounded"
                                  disabled />
                              </td>
                              <td class="py-2 px-4 border-b">
                                <div class="relative">
                                  <!-- Dropdown trigger for Bag Type -->
                                  <div @click="toggleBagDropdown(index, bagIndex)"
                                    class="cursor-pointer p-2 border rounded">
                                    {{ bag.bagType || 'Select a Bag Type' }}
                                  </div>
                                  <!-- Dropdown content -->
                                  <div v-if="isBagDropdownOpen === `${index}-${bagIndex}`"
                                    class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                                    <input type="text" v-model="bagSearchQuery" placeholder="Search Bag Type"
                                      class="border-b border-gray-300 p-2 w-full" />
                                    <ul class="max-h-40 overflow-y-auto">
                                      <li v-for="bagType in filteredBagTypes(index)" :key="bagType"
                                        @click="selectBagType(bagType, index, bagIndex)"
                                        class="cursor-pointer p-2 hover:bg-gray-100">
                                        {{ bagType }}
                                      </li>
                                      <li v-if="filteredBagTypes(index).length === 0" class="p-2 text-gray-500">No
                                        results found</li>
                                    </ul>
                                  </div>
                                </div>
                              </td>

                              <td class="py-2 px-4 border-b">
                                <div class="flex items-center space-x-2">
                                  <FormInput v-model="bag.weight" type="text" class="w-full px-2 py-1 border rounded" />
                                  <button type="button" @click="syncWeight('bag', index, bagIndex)"
                                    class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-1 text-white rounded">
                                    <i class="fa fa-refresh"></i>
                                  </button>
                                </div>
                              </td>
                              <td class="py-2 px-4 border-b text-center">
                                <!-- Delete Carton Button -->
                                <button type="button" @click="deleteBag(row, bagIndex)"
                                  class="text-red-600 hover:text-red-800 text-lg px-2 py-1 rounded">
                                  <i class="fa-solid fa-trash-can"></i>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>
          </div>


          <div class="mt-7 flex items-center justify-between mb-2">
            <h6 class="text-lg font-medium leading-none">Holding Bags</h6>

            <!-- Button container aligned to the right -->
            <div class="flex space-x-2">
              <button type="button" @click="addHoldingBag(1)" class="bg-blue-600 text-white px-4 py-2 rounded">
                Add
              </button>
              <button @click="submitHoldingBags" type="button" class="px-4 py-2 rounded text-white" :class="{
                'bg-green-600 hover:bg-green-700': editFormData.listofHoldingBagsList.length > 0,  // Active state
                'bg-gray-400 cursor-not-allowed': editFormData.listofHoldingBagsList.length === 0  // Disabled state
              }" :disabled="editFormData.listofHoldingBagsList.length === 0">
                Submit
              </button>


            </div>
          </div>
          <hr>
          <hr />

          <div v-if="editFormData.listofHoldingBagsList.length > 0" class="mt-5 border py-5 px-3 rounded-lg">
            <!-- Single Table for All Bags -->
            <table class="min-w-full border-collapse rounded-lg shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center rounded-tl-lg">No.</th>
                  <th class="py-2 px-4 border-b text-center">Bag ID</th>
                  <th class="py-2 px-4 border-b text-center">Weight</th>
                  <th class="py-2 px-4 border-b text-center">Status</th>
                  <th class="py-2 px-4 border-b text-center"></th>
                  <th class="py-2 px-4 border-b text-center rounded-tr-lg"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.listofHoldingBagsList" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b">
                    {{index + 1}}
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormInput v-model="row.bagId" type="text" class="w-full px-2 py-1 border rounded" disabled />
                  </td>
                  <td class="py-2 px-4 border-b">
                    <div class="flex items-center space-x-2">
                      <!-- Weight input with manual override flag -->
                      <FormInput v-model="row.weight" type="text" class="w-full px-2 py-1 border rounded" />
                      <button type="button" @click="syncWeight('holding', index)"
                        class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-1 text-white rounded">
                        <i class="fa fa-refresh"></i>
                      </button>
                    </div>
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormInput v-model="row.status" type="text" class="w-full px-2 py-1 border rounded" disabled />
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    <button type="button" @click="releaseHoldingBag(index)"  class="bg-blue-700 text-white px-2 py-2 rounded-md hover:bg-blue-600 dark:bg-blue-500 whitespace-nowrap">
                      <i class="fa-solid fa-arrow-right-from-bracket pr-2"></i>Release
  </button>
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    <!-- Delete Holding Bag Button -->
                    <button type="button" @click="deleteHoldingBag(index)"
                      class="text-red-600 hover:text-red-800 text-lg px-2 py-1 rounded">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class="sm:mr-2" aria-label="Default select example"
              >
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>Submitted</option>
            </FormSelect>
          </div>
          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
            Submit
          </Button>

        </form>
        <!-- Carton Rows Section -->

      </Dialog.Description>
      <Dialog.Footer>
        <!-- <Button type="button" variant="primary" @click="refreshData" class="mr-2">
          Refresh
        </Button> -->
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
          View Packing Job
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">

        <div ref="toPrint">
          <!-- Display Machine ID and Overall Status -->
          <div>
  <!-- Display Job ID -->
  <div class="relative overflow-x-auto sm:rounded-lg">
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
      <tbody class="w-[100%]">
        <!-- Job ID Row -->
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
            Job ID
          </th>
          <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
            {{ editFormData.jobId }}
          </td>
        </tr>

        <!-- Sub Job ID Row -->
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
            Sub Job ID
          </th>
          <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
            {{ editFormData.subJobId }}
          </td>
        </tr>

        <!-- Bin Name Row -->
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
            Bin Name
          </th>
          <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
            {{ editFormData.binMasterName || 'N/A' }}
          </td>
        </tr>

        <!-- Weight Row -->
        <tr class="border-b border-gray-200 dark:border-gray-700 hidden">
          <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
            Weight
          </th>
          <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
            {{ editFormData.weight || 'N/A' }}
          </td>
        </tr>

        <!-- Approved Weight Row -->
        <tr class="border-b border-gray-200 dark:border-gray-700 hidden">
          <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
            Approved Weight
          </th>
          <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
            {{ editFormData.approvedWeight || 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Sampling Section -->
  <div class="mt-5 flex justify-between items-center">
    <h6 class="mb-3 mt-2 text-lg font-medium leading-none">Sampling</h6>
  </div>
  <hr />
  <div class="mt-2 relative overflow-x-auto sm:rounded-lg">
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 border-collapse">
      <!-- Table Header -->
      <thead>
        <tr class="bg-primary text-white dark:bg-gray-800">
          <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Number of Pieces</th>
          <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Weight</th>
          <th class="px-6 py-3 text-center font-medium whitespace-nowrap">Number of Pieces per Bag</th>
          <th class="px-6 py-3 text-center font-medium whitespace-nowrap">KG per Bag</th>
        </tr>
      </thead>
      <!-- Table Body -->
      <tbody>
        <tr class="border-b">
          <!-- Display Number of Pieces -->
          <td class="px-6 py-4 text-center">
            {{ editFormData.noofPieces || 'N/A' }}
          </td>

          <!-- Display Weight -->
          <td class="py-2 px-4 border-b">
            <div class="flex items-center space-x-2">
              <!-- Display Weight with manual override flag -->
              {{ editFormData.weightsp || 'N/A' }}
            </div>
          </td>

          <!-- Display Number of Pieces per Bag -->
          <td class="px-6 py-4 text-center border-b">
            {{ editFormData.noofPiecesperBag || 'N/A' }}
          </td>

          <!-- Display KG per Bag -->
          <td class="px-6 py-4 text-center border-b">
            {{ editFormData.kgperBag || 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>



  <!-- Carton and Bag Details Section -->
  <div class="mt-5 flex justify-between items-center">
    <h6 class="mb-3 mt-2 text-lg font-medium leading-none">Carton and Bag Details</h6>
  </div>
  <hr />
  <div v-if="editFormData.listofCartonsDetailsList.length > 0" class="mt-5 border py-5 px-3 rounded-lg ">
    <template v-for="(row, index) in editFormData.listofCartonsDetailsList" :key="index">
      <div class="mt-5 border py-5 px-3 rounded-lg ">
        <!-- Carton Table -->
        <table class="min-w-full border-collapse rounded-lg shadow-sm">
          <thead class="bg-primary text-white">
            <tr>
              <th class="py-2 px-4 border-b text-center rounded-tl-lg">Carton ID</th>
              <th class="py-2 px-4 border-b text-center">Carton Type</th>
              <th class="py-2 px-4 border-b text-center">Weight</th>
              <th class="py-2 px-4 border-b text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr class="hover:bg-gray-100">
              <!-- Display Carton ID -->
              <td class="py-2 px-4 border-b text-center">
                {{ row.cartonId || 'N/A' }}
              </td>

              <!-- Display Carton Type -->
              <td class="py-2 px-4 border-b text-center">
                {{ row.cartonType || 'N/A' }}
              </td>

              <!-- Display Carton Weight -->
              <td class="py-2 px-4 border-b text-center">
                {{ row.weight || 'N/A' }}
              </td>

              <!-- Display Carton Status -->
              <td class="py-2 px-4 border-b text-center">
                {{ row.status || 'N/A' }}
              </td>


            </tr>

            <!-- Display Bags Details for the current carton -->
            <tr v-if="row.listofBagsDetailsList.length > 0">
              <td colspan="6" class="pt-4">
                <h5 class="text-center text-md font-medium mb-2">Bags Details for Carton {{ row.cartonId }}</h5>
                <table class="min-w-full border-collapse rounded-lg shadow-sm mt-2">
                  <thead class="bg-primary text-white">
                    <tr>
                      <th class="py-2 px-4 border-b text-center">Bag ID</th>
                      <th class="py-2 px-4 border-b text-center">Bag Type</th>
                      <th class="py-2 px-4 border-b text-center">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(bag, bagIndex) in row.listofBagsDetailsList" :key="bagIndex" class="hover:bg-gray-100">
                      <!-- Display Bag ID -->
                      <td class="py-2 px-4 border-b text-center">
                        {{ bag.bagId || 'N/A' }}
                      </td>

                      <!-- Display Bag Type -->
                      <td class="py-2 px-4 border-b text-center">
                        {{ bag.bagType || 'N/A' }}
                      </td>

                      <!-- Display Bag Weight -->
                      <td class="py-2 px-4 border-b text-center">
                        {{ bag.weight || 'N/A' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</div>
<div class="mt-5 flex justify-between items-center">
    <h6 class="mb-3 mt-2 text-lg font-medium leading-none">Holding Bags</h6>
  </div>
<!-- Display Holding Bags List -->
<div v-if="editFormData.listofHoldingBagsList.length > 0" class="mt-5 border py-5 px-3 rounded-lg">
  <!-- Holding Bags Table -->
  <table class="min-w-full border-collapse rounded-lg shadow-sm">
    <thead class="bg-primary text-white">
      <tr>
        <th class="py-2 px-4 border-b text-center rounded-tl-lg">Bag ID</th>
        <th class="py-2 px-4 border-b text-center">Weight</th>
        <th class="py-2 px-4 border-b text-center rounded-tr-lg">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in editFormData.listofHoldingBagsList" :key="index" class="hover:bg-gray-100">
        <td class="py-2 px-4 border-b text-center">
          {{ row.bagId || 'N/A' }}
        </td>
        <td class="py-2 px-4 border-b text-center">
          {{ row.weight || 'N/A' }}
        </td>
        <td class="py-2 px-4 border-b text-center">
          {{ row.status || 'N/A' }}
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