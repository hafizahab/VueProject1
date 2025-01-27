<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import printJS from 'print-js';
import LoadingIcon from "../base-components/LoadingIcon";


interface UserAccess {
    userId: string;
    goodsReceive?: string[];
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
  grnumber?: string;
  productcode?: string;
  date?: string;
  resourcecode?: string;
  shift?: string;
  vendorname?: string;
  vendorcode?: string;
  ponumber?: string;
  lotnumber?: string;
  nett?: string;
  gross?: string;
  uom?: string;
  qcrequired?: any;
  status?: string;
  receiveStatus?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  ponumber: "",
  productcode: "",
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
       // Add a title at the top of the print view
       printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Quality Check
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
          title: "PO NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "ponumber",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.ponumber}</div>
              </div>`;
          },
        },
        {
          title: "GR NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "grnumber",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.grnumber}</div>
              </div>`;
          },
        },
        {
          title: "PART NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "productcode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.productcode}</div>
              </div>`;
          },
        },
        {
          title: "Date",
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
          title: "STATUS",
          minWidth: 150,
          responsive: 0,
          field: "status",
          vertAlign: "middle",
          print: false,
          download: false,
          sorter: (a, b, aRow, bRow, column, dir, sorterParams) => {
            // Custom sorter to prioritize 'Pending QC'
            if (a === 'Pending QC' && b !== 'Pending QC') return -1;
            if (a !== 'Pending QC' && b === 'Pending QC') return 1;
            return 0;
          },
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
                case 'Pending QC':
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
          title: "WAREHOUSE STATUS",
          minWidth: 150,
          responsive: 0,
          field: "receiveStatus",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let statusClass = '';

            // Set status based on boolean value
            if (status === true) {
              status = 'Completed';
            } else if (status === false) {
              status = 'Pending';
            }

            // Assign classes based on the status
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
              default:
                status = 'N/A';
                statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
                break;
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
                    // Conditionally render "Edit" link
                    if (
                        userAccess.goodsReceive &&
                        userAccess.goodsReceive.includes("Edit") &&
                        response.status !== "Completed" &&
                        response.status !== "QC Rejected"
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
    title: "<span class='text-xs font-bold text-center block'>PO Number</span>",
    field: "ponumber",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.ponumber}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>GR Number</span>",
    field: "grnumber",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.grnumber}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Powder Number</span>",
    field: "productcode",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.productcode}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Employee ID</span>",
    field: "resourcecode",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.resourcecode}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Main Location</span>",
    field: "location",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      const location = response.location ? response.location : 'N/A';
      return `<div class="text-xs font-medium text-center block break-words">${location}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Vendor Name</span>",
    field: "vendorname",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.vendorname}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Vendor Code</span>",
    field: "vendorcode",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.vendorcode}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Lot Number</span>",
    field: "lotnumber",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.lotnumber}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Weight</span>",
    field: "nett",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.nett}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>UOM</span>",
    field: "uom",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.uom}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Status</span>",
    field: "status",
    visible: false,
    print: true,
    download: true,
    formatter(cell, formatterParams, onRendered) {
      let status = cell.getValue();
      let textColor;

      if (!status) {
        status = 'N/A';
        textColor = 'text-gray-600';
      } else {
        switch (status) {
          case 'Pending QC':
            textColor = 'text-yellow-600';
            break;
          case 'Completed':
            textColor = 'text-green-600';
            break;
          case 'Draft':
            textColor = 'text-orange-600';
            break;
          case 'QC Rejected':
            textColor = 'text-red-600';
            break;
          default:
            textColor = 'text-black';
        }
      }

      return `<span class="text-xs font-medium text-center block ${textColor} break-words">${status}</span>`;
    },
  }

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
const onFilter = () => {
  if (tabulator.value) {
    tabulator.value.setFilter((data) => {
      // Parse the date from the API data
      const dateValue = new Date(data.date);

      // Validate the dateValue
      if (isNaN(dateValue.getTime())) {
        console.error("Invalid Date:", data.date);
        return false; // Exclude entries with invalid dates
      }

      // Get start and end dates from the filters
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;

      // Validate start and end dates
      if (startDate && isNaN(startDate.getTime())) {
        console.error("Invalid Start Date:", filter.startDate);
        return false;
      }
      if (endDate && isNaN(endDate.getTime())) {
        console.error("Invalid End Date:", filter.endDate);
        return false;
      }

      // Function to format a date to YYYY-MM-DD
      const formatDateToUTC = (date: Date) => {
        if (!date) return null;
        // Adjust the date to UTC and format it to YYYY-MM-DD
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return utcDate.toISOString().split('T')[0];
      };

      // Format the date components to strings
      const formattedDateValue = formatDateToUTC(dateValue);
      const formattedStartDate = startDate ? formatDateToUTC(startDate) : null;
      const formattedEndDate = endDate ? formatDateToUTC(endDate) : null;

      // Debugging logs
      console.log(`Data Date: ${formattedDateValue}, Start Date: ${formattedStartDate}, End Date: ${formattedEndDate}`);

      // Check if the date falls within the specified range or matches the start date
      if (formattedDateValue && formattedStartDate && !formattedEndDate) {
        // Only start date is specified
        return formattedDateValue === formattedStartDate;
      } else if (formattedDateValue && formattedStartDate && formattedEndDate) {
        // Both start and end dates are specified
        return formattedDateValue >= formattedStartDate && formattedDateValue <= formattedEndDate;
      } else if (formattedDateValue && !formattedStartDate && formattedEndDate) {
        // Only end date is specified, match date equals end date
        return formattedDateValue === formattedEndDate;
      } else {
        // Neither start nor end date is specified
        return true; // Return all data
      }
    });
  }
};

const ponumber = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("ponumber", 'like', filter.ponumber);
  }
};
const productcode = () => {
  if (tabulator.value && filter.productcode) {
    console.log("Applying filter for productcode:", filter.productcode);
    tabulator.value.setFilter((data) => {
      const searchValue = filter.productcode.toLowerCase();
      const columnValue = data.productcode ? data.productcode.toLowerCase() : '';
      return columnValue.includes(searchValue);
    });
  } else {
    console.warn("Filter value is empty or Tabulator not initialized");
  }
};


const onStatus = () => {
  if (tabulator.value) {
    if (filter.status === "Completed") {
      // Show only rows with status "Completed" when filtered by "Completed"
      tabulator.value.setFilter("status", "=", "Completed");
    } else if (filter.status) {
      // Show other statuses if specified
      tabulator.value.setFilter("status", "like", filter.status);
    } else {
      // Clear the filter to return to the default view
      tabulator.value.clearFilter(true);
      tabulator.value.setFilter((item) => {
        return !(item.status === 'Completed' && item.receiveStatus === true);
      });
    }
  }
};


// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    ponumber: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  if (tabulator.value) {
    // Clear all filters
    tabulator.value.clearFilter(true);

    // Reapply the default filter to hide "Completed" items with receiveStatus: true
    tabulator.value.setFilter((item) => {
      return !(item.status === 'Completed' && item.receiveStatus === true);
    });
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/GRDetails/';


onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Define all data-fetching promises
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      const data = response.data.result;

      // Sort the data by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Populate the table and apply the filters
      if (tabulator.value) {
        tabulator.value.setData(data);

        // Apply filters to exclude completed items and those with qcrequired = false
        tabulator.value.setFilter((item) => {
          return !(
            (item.status === 'Completed' && item.receiveStatus === true) ||
            item.qcrequired === false
          );
        });
      }
    }).catch(error => {
      console.error('Error fetching main data:', error);
    }),

    // Other data-fetching functions
    fetchUOM(),
    fetchVendorName(),
    fetchGRDetails(),
    fetchVendorCode(),
    fetchNamesShift(),
    fetchLocation()
  ];

  // Wait for all data-fetching promises to complete
  Promise.all(fetchPromises)
    .finally(() => {
      loading.value = false; // Hide loading modal once all data is fetched
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
  productcode: '',
  date: formatDate(new Date()),
  resourcecode: '',
  shift: '',
  vendorname: '',
  vendorcode: '',
  ponumber: '',
  lotnumber: '',
  nett: '',
  gross: '',
  uom: '',
  qcrequired: true,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  vendornames: [] as string[],
  vendorcodes: [] as string[],
  locations: [] as string[],
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: string }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  selectedFile: null as File | null,
  formSubmitted: false,
  fileName: '',
  selectedSubLocation: '',
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});

interface SubLocation {
  name: string;
}


const editFormData = reactive({
  id: null,
  productcode: '',
  date: formatDate(new Date()),
  resourcecode: '',
  shift: '',
  vendorname: '',
  vendorcode: '',
  ponumber: '',
  lotnumber: '',
  nett: '',
  gross: '',
  uom: '',
  qcrequired: true,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  vendornames: [] as string[],
  vendorcodes: [] as string[],
  locations: [] as string[],
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: string }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  selectedFile: null as File | null,
  formSubmitted: false,
  fileName: '',
  selectedSubLocation: '',
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});

// Location dropdown control for edit form
const isEditLocationDropdownOpen = ref(false);
const editLocationSearchQuery = ref('');
const selectedEditLocation = ref(editFormData.location);

// Computed property to filter locations based on search query for edit form
const filteredEditLocations = computed(() => {
  if (!editLocationSearchQuery.value) {
    return editFormData.locations;
  }
  return editFormData.locations.filter((location) =>
    location.toLowerCase().includes(editLocationSearchQuery.value.toLowerCase())
  );
});

// Function to toggle location dropdown open/close for edit form
const toggleEditLocationDropdown = () => {
  isEditLocationDropdownOpen.value = !isEditLocationDropdownOpen.value;
  editLocationSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a location in edit form
const selectEditLocation = (location: any) => {
  selectedEditLocation.value = location;
  editFormData.location = location;
  isEditLocationDropdownOpen.value = false; // Close the dropdown after selecting
};

// Sub Location dropdown control for edit form
const isEditSubLocationDropdownOpen = ref(false);
const editSubLocationSearchQuery = ref('');
const selectedEditSubLocation = ref(editFormData.selectedSubLocation);

// Computed property to filter sub locations based on search query for edit form
const filteredEditSubLocations = computed(() => {
  if (!editSubLocationSearchQuery.value) {
    return editFormData.subLocList;
  }
  return editFormData.subLocList.filter((subloc) =>
    subloc.name.toLowerCase().includes(editSubLocationSearchQuery.value.toLowerCase())
  );
});

// Function to toggle sub-location dropdown open/close for edit form
const toggleEditSubLocationDropdown = () => {
  if (editFormData.location && editFormData.subLocList.length > 0) {
    isEditSubLocationDropdownOpen.value = !isEditSubLocationDropdownOpen.value;
    editSubLocationSearchQuery.value = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a sub location in edit form
const selectEditSubLocation = (subLocation: any) => {
  selectedEditSubLocation.value = subLocation;
  editFormData.selectedSubLocation = subLocation;
  isEditSubLocationDropdownOpen.value = false; // Close the dropdown after selecting
};

// Define permission variables for goodsReceive
let canEditGoodsReceive = false;

// Define the fetchUserGoodsReceivePermissions function
const fetchUserGoodsReceivePermissions = async () => {
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

      const goodsReceive = userDetails.goodsReceive || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for goodsReceive
      canEditGoodsReceive = goodsReceive.includes('Edit');

      console.log('canEditGoodsReceive:', canEditGoodsReceive); // Debugging log
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

// Call the fetchUserGoodsReceivePermissions function to get permissions
fetchUserGoodsReceivePermissions();

watch(() => editFormData.location, (newLocation) => {
  if (newLocation) {
    fetchSubLocations(newLocation); // Removed the second argument 'edit'
  }
});


const fetchSubLocations = (locationName: string) => {
  axios
    .get('http://10.87.0.33:8082/api/LocationMaster')
    .then(response => {
      const locationData = response.data.result.find((item: any) => item.name === locationName);

      if (locationData && locationData.subLocationDetailsList) {
        editFormData.subLocList = locationData.subLocationDetailsList;

        // Set the selected sublocation if it's not already set
        if (!editFormData.selectedSubLocation) {
          editFormData.selectedSubLocation = locationData.subLocationDetailsList.length > 0
            ? locationData.subLocationDetailsList[0].name
            : '';
        }
      } else {
        // Reset sublocation if no data found
        editFormData.subLocList = [];
        editFormData.selectedSubLocation = '';
      }
    })
    .catch(error => {
      console.error('Error fetching sub-locations:', error);
      // Reset sublocation on error
      editFormData.subLocList = [];
      editFormData.selectedSubLocation = '';
    });
};


const handleFileUpload = (event: any) => {
  const file = event.target.files[0];
  if (file) {
    editFormData.fileName = file.name; // Store the file name
    editFormData.selectedFile = file; // Store the actual file
    viewData.fileName = file.name; // Store the file name
    viewData.selectedFile = file; // Store the actual file
  }
};


const isUploadDisabled = computed(() => {
  return editFormData.status === 'Completed' || editFormData.status === 'QC Rejected';
});

const downloadFile = () => {
  // Construct the full API URL with parameters
  const apiUrl = 'http://10.87.0.33:8082/api/Files';
  const params = {
    ModuleName: 'GR',
    grnoorjobid: editFormData.grnumber,
  };
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${apiUrl}?${queryString}`;

  // Log the full API URL with parameters
  console.log('Opening API link in a new window:', fullUrl);

  // Open the API link in a new window
  window.open(fullUrl, '_blank');
};
const viewdownloadFile = () => {
  // Construct the full API URL with parameters
  const apiUrl = 'http://10.87.0.33:8082/api/Files';
  const params = {
    ModuleName: 'GR',
    grnoorjobid: viewData.grnumber,
  };
  const queryString = new URLSearchParams(params).toString();
  const fullUrl = `${apiUrl}?${queryString}`;

  // Log the full API URL with parameters
  console.log('Opening API link in a new window:', fullUrl);

  // Open the API link in a new window
  window.open(fullUrl, '_blank');
};

watch(() => editFormData.grnumber, async (newVal) => {
  if (newVal) {
    try {
      const response = await axios.get('http://10.87.0.33:8082/api/Files', {
        params: {
          ModuleName: 'GR',
          grnoorjobid: newVal,
        },
      });
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          const filename = matches[1];
          const fileExtension = filename.split('.').pop();
          editFormData.fileName = filename;
        }
      } else {
        editFormData.fileName = `${editFormData.grnumber}-QC`;
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  }
});
watch(() => viewData.grnumber, async (newVal) => {
  if (newVal) {
    try {
      const response = await axios.get('http://10.87.0.33:8082/api/Files', {
        params: {
          ModuleName: 'GR',
          grnoorjobid: newVal,
        },
      });
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          const filename = matches[1];
          const fileExtension = filename.split('.').pop();
          viewData.fileName = filename;
        }
      } else {
        viewData.fileName = `${viewData.grnumber}-QC`;
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    }
  }
});


const addFormData = reactive({
  productcode: '',
  date: formatDate(new Date()),
  resourcecode: '',
  shift: '',
  vendorname: '',
  vendorcode: '',
  ponumber: '',
  lotnumber: '',
  nett: '',
  gross: '',
  uom: '',
  qcrequired: false,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  vendornames: [] as string[],
  vendorcodes: [] as string[],
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: 'false' }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
});

const qcPassedValue = ref('true');

watch(
  () => [editFormData.grnumber, editFormData.resourcecode, editFormData.shift, qcPassedValue.value],
  () => {
    editFormData.qualityCheckList = [{
      jobId: editFormData.grnumber,
      resourceCode: editFormData.resourcecode,
      shift: editFormData.shift,
      qcPassed: qcPassedValue.value
    }];
  },
  { immediate: true }
);



const fetchNamesShift = () => {
  axios.get('http://10.87.0.33:8082/api/ShiftMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.shifts = activeNameData.map(item => item.name);
        editFormData.shifts = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchLocation = () => {
  axios.get('http://10.87.0.33:8082/api/LocationMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        editFormData.locations = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchVendorName = () => {
  axios.get('http://10.87.0.33:8082/api/VendorMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.vendornames = activeNameData.map(item => item.name);
        editFormData.vendornames = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchVendorCode = () => {
  axios.get('http://10.87.0.33:8082/api/VendorMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.vendorcodes = activeNameData.map(item => item.code);
        editFormData.vendorcodes = activeNameData.map(item => item.code);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

// Function to fetch GR number
const fetchGRDetails = () => {
  axios.get('http://10.87.0.33:8082/api/GRDetails/GetGRNo')
    .then(response => {
      console.log('GR Number Response:', response); // Debugging line
      const grNumber = response.data;

      if (typeof grNumber === 'string') {
        // Update grNumber in form data
        addFormData.grnumber = grNumber;
        console.log('Fetched GR Number:', grNumber); // Debugging line
      } else {
        console.error('Invalid response format for GR number:', grNumber);
      }
    })
    .catch(error => {
      console.error('Error fetching GR number:', error);
    });
};

const fetchUOM = () => {
  axios.get('http://10.87.0.33:8082/api/GRDetails/GetUOMDDL')
    .then(response => {
      const uomData = response.data.result;

      if (Array.isArray(uomData)) {
        // If it's an array, use the first element or handle multiple UOMs as needed
        addFormData.uom = uomData.length > 0 ? uomData[0].uomcode : '';
        // Assign the array to addFormData.uoms for rendering options in the dropdown
        addFormData.uoms = uomData.map(item => item.uomcode);
        editFormData.uom = uomData.length > 0 ? uomData[0].uomcode : '';
        // Assign the array to addFormData.uoms for rendering options in the dropdown
        editFormData.uoms = uomData.map(item => item.uomcode);
      } else if (typeof uomData === 'object') {
        // If it's an object, use its properties
        addFormData.uom = uomData.uomcode || '';
        addFormData.uoms = [uomData.uomcode]; // Set an array with a single value
        editFormData.uom = uomData.uomcode || '';
        editFormData.uoms = [uomData.uomcode]; // Set an array with a single value
      } else {
        console.error('Invalid response format for UOM:', uomData);
      }
    })
    .catch(error => {
      console.error('Error fetching UOM:', error);
    });
};



const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => {
  viewModal.value = value;
  if (!value) {
    viewData.fileName = '';
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


// Fetch and Set Data for Edit/View
let fetchedListBoxes: any[] = [];  // Store original fetched sub-lot numbers

const fetchAndSetData = (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  loading.value = true; // Start loading

  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      console.log('Fetched Data:', data);

      if (data && data.length > 0) {
        const [firstItem] = data;

        // Map data to formData properties
        formData.id = firstItem.id;
        formData.grnumber = firstItem.grnumber;
        formData.productcode = firstItem.productcode;
        formData.date = firstItem.date || formatDate(new Date());
        formData.resourcecode = firstItem.resourcecode || '';
        formData.shift = firstItem.shift || '';
        formData.vendorname = firstItem.vendorname || '';
        formData.vendorcode = firstItem.vendorcode || '';
        formData.location = firstItem.location || '';
        formData.ponumber = firstItem.ponumber || '';
        formData.lotnumber = firstItem.lotnumber || '';
        formData.noofBoxes = firstItem.noofBoxes || '';
        formData.nett = firstItem.nett || 0;
        formData.gross = firstItem.gross || 0;
        formData.discrepencyWeight = firstItem.discrepencyWeight || 0;
        formData.uom = firstItem.uom || '';
        formData.qcrequired = !!firstItem.qcrequired;
        formData.whrequired = !!firstItem.whrequired;
        formData.status = firstItem.status || '';
        formData.qualityCheckList = firstItem.qualityCheckList || [];
        formData.listBoxesList = firstItem.listBoxes || [];

        // Map subLocationDetailsList to subLocList and set the default Sub Location
        formData.subLocList = firstItem.subLocationDetailsList?.map((subLoc: any) => ({
          id: subLoc.id,
          name: subLoc.name
        })) || [];
        formData.selectedSubLocation = formData.subLocList[0]?.name || '';


        selectedEditLocation.value = formData.location;
        selectedEditSubLocation.value = formData.selectedSubLocation;

        // Store fetched lot number and sub-lot numbers
        fetchedListBoxes = JSON.parse(JSON.stringify(formData.listBoxesList));

        // Open modal after data is set
        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'))
    .finally(() => {
      loading.value = false; // End loading
    });
};




const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

// Define all data-fetching promises
const fetchPromises = [
  axios.get(API_BASE_URL).then(response => {
    const data = response.data.result;

    // Sort the data by date
    data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Populate the table and apply the filters
    if (tabulator.value) {
      tabulator.value.setData(data);

      // Apply filters to exclude completed items and those with qcrequired = false
      tabulator.value.setFilter((item) => {
        return !(
          (item.status === 'Completed' && item.receiveStatus === true) ||
          item.qcrequired === false
        );
      });
    }
  }).catch(error => {
    console.error('Error fetching main data:', error);
  }),

  // Other data-fetching functions
  fetchUOM(),
  fetchVendorName(),
  fetchGRDetails(),
  fetchVendorCode(),
  fetchNamesShift(),
  fetchLocation()
];

// Wait for all data-fetching promises to complete
Promise.all(fetchPromises)
  .finally(() => {
    loading.value = false; // Hide loading modal once all data is fetched
  });

initTabulator();
reInitOnResizeWindow();

};

interface Payload {
  grnumber: string;
  productcode: string;
  date: string;
  resourcecode: string;
  shift: string;
  vendorname: string;
  vendorcode: string;
  ponumber: string;
  lotnumber: string;
  nett: number;
  gross: number;
  uom: string;
  qcrequired: boolean;
  qualityCheckList: {
    jobId: string;
    resourceCode: string;
    shift: string;
    qcPassed: string;
  }[];
}


// Update Role
const updateRole = () => {
  console.log('updateRole function called');

  editFormData.formSubmitted = true;

  const payload = {
    grnumber: String(editFormData.grnumber),
    productcode: String(editFormData.productcode),
    date: String(editFormData.date),
    resourcecode: String(editFormData.resourcecode),
    shift: String(editFormData.shift),
    vendorname: String(editFormData.vendorname),
    vendorcode: String(editFormData.vendorcode),
    ponumber: String(editFormData.ponumber),
    lotnumber: String(editFormData.lotnumber),
    nett: parseFloat(editFormData.nett),
    gross: parseFloat(editFormData.gross),
    uom: String(editFormData.uom),
    location: String(editFormData.location),
    qcrequired: true,
    qualityCheckList: [{
      jobId: String(editFormData.grnumber),
      resourceCode: String(editFormData.resourcecode),
      shift: String(editFormData.shift),
      qcPassed: qcPassedValue.value
    }],
    listBoxesList: editFormData.listBoxesList.map(box => ({
      jobId: String(editFormData.grnumber),
      subLotNumber: String(box.subLotNumber),
      nettWeight: box.nettWeight,
      grossWeight: box.grossWeight,
    })),
    subLocList: [
      {
        name: editFormData.selectedSubLocation, // Only the selected sublocation is included in the array
      }
    ]
  };

  console.log('Payload prepared:', payload);

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
      console.log('User confirmed the action');

      axios.post(`http://10.87.0.33:8082/api/GRDetails/SubmitGRDetails`, payload)
        .then(() => {
          console.log('Payload submitted successfully');

          if (editFormData.selectedFile) {
            console.log('File selected:', editFormData.selectedFile);

            const formData = new FormData();
            formData.append('file', editFormData.selectedFile);

            axios.post(`http://10.87.0.33:8082/api/Files?ModuleName=GR&grnoorjobid=${editFormData.grnumber}`, formData)
              .then(() => {
                console.log('File uploaded successfully');
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
                console.error('Error uploading file:', error);
                handleError(error, 'Error uploading file');
              });
          } else {
            console.log('No file selected for upload');
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
          }
        })
        .catch(error => {
          console.error('Error updating data:', error);
          handleError(error, 'Error updating data');
        });
    } else {
      console.log('User cancelled the action');
    }
  });
};



// Add Role

// Method to handle form validation and display error messages
const validateForm = () => {
  formSubmitted.value = true;
  if (
    !addFormData.productcode ||
    !addFormData.resourcecode ||
    !addFormData.shift ||
    !addFormData.vendorname ||
    !addFormData.vendorcode ||
    !addFormData.ponumber ||
    !addFormData.lotnumber ||
    (!addFormData.nett || !isNumeric(addFormData.nett)) ||
    (!addFormData.gross || !isNumeric(addFormData.gross)) ||
    !addFormData.uom
  ) {
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
    });
    return false;
  }
  return true;
};

// Method to handle the Save button click event
// Method to handle the Save button click event
const saveRole = async () => {
  if (validateForm()) {
    const payload = {
      grnumber: addFormData.grnumber,
      productcode: addFormData.productcode,
      date: addFormData.date,
      resourcecode: addFormData.resourcecode,
      shift: addFormData.shift,
      vendorname: addFormData.vendorname,
      vendorcode: addFormData.vendorcode,
      ponumber: addFormData.ponumber,
      lotnumber: addFormData.lotnumber,
      nett: parseFloat(addFormData.nett), // Ensure numeric value
      gross: parseFloat(addFormData.gross), // Ensure numeric value
      uom: addFormData.uom
    };

    console.log('Payload for Save:', JSON.stringify(payload, null, 2)); // Log payload
    try {
      const response = await axios.post('http://10.87.0.33:8082/api/GRDetails/SaveGRDetails', payload);
      console.log('API Response:', response);
      if (response.status === 200 && response.data.result) {
        Swal.fire({
          icon: 'success',
          title: 'Data Saved Successfully',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          position: 'top-end',
          iconColor: 'green',
          toast: true,
          background: '#fff',
        });
        // Additional actions after successful save
        setAddSlideover(false);
        resetFormData(addFormData);
        updateTableData();
        fetchNamesShift();
        fetchVendorName();
        fetchVendorCode();
        fetchGRDetails();
        fetchUOM();
        formSubmitted.value = false;
      } else {
        Swal.fire({
          icon: 'warning',
          title: 'Unexpected response',
          text: 'The data was not saved as expected.',
          showConfirmButton: true,
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      handleError(error, 'Error deleting data');
    }
  }
};

// Method to handle the Submit button click event
const submitRole = () => {
  if (validateForm()) {
    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to submit this role?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!',
    }).then(result => {
      if (result.isConfirmed) {
        const payload = {
          grnumber: String(addFormData.grnumber),
          productcode: String(addFormData.productcode),
          date: String(addFormData.date),
          resourcecode: String(addFormData.resourcecode),
          shift: String(addFormData.shift),
          vendorname: String(addFormData.vendorname),
          vendorcode: String(addFormData.vendorcode),
          ponumber: String(addFormData.ponumber),
          lotnumber: String(addFormData.lotnumber),
          nett: String(addFormData.nett),
          gross: String(addFormData.gross),
          uom: String(addFormData.uom),
          qcrequired: Boolean(addFormData.qcrequired),
          qualityCheckList: addFormData.qualityCheckList.map(item => ({
            jobId: String(item.jobId),
            resourceCode: String(item.resourceCode),
            shift: String(item.shift),
            qcPassed: Boolean(item.qcPassed)
          })),
          listBoxesList: addFormData.listBoxesList.map(box => ({
            jobId: String(addFormData.grnumber),
            subLotNumber: String(box.subLotNumber),
            nettWeight: box.nettWeight || 0, // Direct assignment
            grossWeight: box.grossWeight || 0, // Direct assignment
          }))
        };
        axios.post('http://10.87.0.33:8082/api/GRDetails/SubmitGRDetails', payload)
          .then(response => {
            if (response.status === 200 && response.data.result) {
              Swal.fire({
                icon: 'success',
                title: 'Role Submitted Successfully',
                showConfirmButton: false,
                showCloseButton: true,
                timer: 5000,
                timerProgressBar: true,
                position: 'top-end',
                iconColor: 'green',
                toast: true,
                background: '#fff',
              });
              setAddSlideover(false);
              resetFormData(addFormData);
              updateTableData();
              fetchNamesShift();
              fetchVendorName();
              fetchVendorCode();
              fetchGRDetails();
              fetchUOM();
              formSubmitted.value = false;
            } else {
              Swal.fire({
                icon: 'warning',
                title: 'Unexpected response',
                text: 'The data was not submitted as expected.',
                showConfirmButton: true,
              });
            }
          })
          .catch(error => handleError(error, 'Error deleting data'));
      }
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
  Object.keys(formData).forEach((key) => {
    if (typeof formData[key] === 'boolean') {
      formData[key] = false;
    } else if (typeof formData[key] === 'number') {
      formData[key] = 0;
    } else {
      formData[key] = '';
    }
  });
  formData.date = formatDate(new Date());
  formData.status = '';
};



const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
};

const EditSlideOver = ref(false);

const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;

  if (!value) {
    // Reset sublocation when closing
    editFormData.subLocList = [];
    editFormData.selectedSubLocation = '';

    // Optionally refetch sublocations when closing
    if (editFormData.location) {
      fetchSubLocations(editFormData.location); // Removed the second argument 'edit'
    }
  } else {
    // When opening, refetch sublocations
    if (editFormData.location) {
      fetchSubLocations(editFormData.location); // Removed the second argument 'edit'
    }
  }
};

const resetFileInput = () => {
  editFormData.fileName = '';

};

watch(EditSlideOver, async (newVal) => {
  if (!newVal) {
    // Reset the file input when EditSlideOver is closed
    resetFileInput();
  } else {
    // Fetch the file details again when EditSlideOver is opened
    if (editFormData.grnumber) {
      try {
        const response = await axios.get('http://10.87.0.33:8082/api/Files', {
          params: {
            ModuleName: 'GR',
            grnoorjobid: editFormData.grnumber,
          },
        });
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
          const matches = /filename="([^"]+)"/.exec(contentDisposition);
          if (matches != null && matches[1]) {
            const filename = matches[1];
            const fileExtension = filename.split('.').pop();
            editFormData.fileName = filename;
          }
        } else {
          editFormData.fileName = `${editFormData.grnumber}-QC`;
        }
      } catch (error) {
        console.error('Error fetching file details:', error);
      }
    }
  }
});

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

/// Define the ref
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
    <h2 class="mr-auto text-lg font-medium">Quality Check</h2>
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
            <label class="flex-none w-full xl:w-auto xl:flex-initial">PO Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.ponumber" type="text" class="mt-2 w-full"
                placeholder="Search PO Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="ponumber">PO Number</Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Powder Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.productcode" type="text" class="mt-2 w-full"
                placeholder="Search Powder Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="productcode">Powder Number</Button>
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
                <option>Pending</option>
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
:staticBackdrop="true" size="xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Quality Check
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent="updateRole">

          <div>
            <FormLabel htmlFor="regular-form-1">PO Number</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.ponumber" type="text" placeholder="PO Number"
              disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-gr">GR Number</FormLabel>
            <FormInput v-model="editFormData.grnumber" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Powder Number</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.productcode" type="text" placeholder="Powder Number"
              disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Resource ID</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.resourcecode" type="text" placeholder="Resource ID"
              disabled />
          </div>
          <div class="relative  shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Vendor Name
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Vendor Code
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="vendor-name" class="sr-only">Vendor Name</FormLabel>
                    <FormInput id="vendor-name" v-model="editFormData.vendorname" type="text" placeholder="Vendor Name"
                      disabled />
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="vendor-code" class="sr-only">Vendor Code</FormLabel>
                    <FormInput id="vendor-code" v-model="editFormData.vendorcode" type="text" placeholder="Vendor Code"
                      disabled />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Lot Number</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.lotnumber" type="text" placeholder="Lot Number"
              disabled />
          </div>
          <div class="mt-5 hidden">
            <FormLabel htmlFor="regular-form-8">Weight</FormLabel>
            <FormInput id="regular-form-8" v-model="editFormData.nett" type="text" placeholder="Nett" disabled />
          </div>
          <div class="relative shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    UOM
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Weight</FormLabel>
                    <FormInput id="regular-form-8" v-model="editFormData.gross" type="text" placeholder="Gross"
                      disabled />
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-gr" class="sr-only">UOM</FormLabel>
                    <FormInput v-model="editFormData.uom" id="regular-form-gr" type="text" disabled />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5" v-if="editFormData.listBoxesList.length > 0">
            <h3 class="mb-2 mt-8 text-lg font-medium leading-none">Box Details</h3>
            <hr />
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">Sub Lot Number</th>
                  <th class="py-2 px-4 border-b text-center hidden">Nett Weight</th>
                  <th class="py-2 px-4 border-b text-center">Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(box, index) in editFormData.listBoxesList" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    {{ box.subLotNumber }}
                  </td>
                  <td class="py-2 px-4 border-b small-width hidden">
                    {{ box.nettWeight }}
                  </td>
                  <td class="py-2 px-4 border-b small-width text-center">
                    {{ box.grossWeight }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="relative  shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Main Location
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Location
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <!-- Main Location Dropdown -->
                    <FormLabel htmlFor="edit-form-5" class="sr-only">Main Location</FormLabel>
                    <div class="relative">
                      <div
                        :class="['border rounded', { 'border-red-500': formSubmitted && !editFormData.location, 'border-gray-300': !(formSubmitted && !editFormData.location) }]">
                        <div class="relative">
                          <div @click="toggleEditLocationDropdown" class="cursor-pointer p-2">
                            {{ selectedEditLocation || 'Select a Main Location Option' }}
                          </div>
                          <div v-if="isEditLocationDropdownOpen"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <input type="text" v-model="editLocationSearchQuery" placeholder="Search Location"
                              class="border-b border-gray-300 p-2 w-full" />
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="location in filteredEditLocations" :key="location"
                                @click="selectEditLocation(location)" class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ location }}
                              </li>
                              <li v-if="filteredEditLocations.length === 0" class="p-2 text-gray-500">No results found
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span v-if="formSubmitted && !editFormData.location" class="text-red-500">Main Location is
                      required!</span>
                  </td>

                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <!-- Sub Location Dropdown -->
                    <FormLabel htmlFor="subloc-form-5" class="sr-only">Sub Location</FormLabel>
                    <div class="relative" v-if="editFormData.locations.length > 0">
                      <div class="border border-gray-300 rounded">
                        <div class="relative">
                          <div @click="toggleEditSubLocationDropdown" class="cursor-pointer p-2"
                            :class="{ 'cursor-not-allowed': !editFormData.location || editFormData.subLocList.length === 0 }"
                            :style="{ opacity: !editFormData.location || editFormData.subLocList.length === 0 ? 0.6 : 1 }"
                            :disabled="!editFormData.location || editFormData.subLocList.length === 0">
                            {{ selectedEditSubLocation || 'Select a Sub Location' }}
                          </div>
                          <div v-if="isEditSubLocationDropdownOpen && editFormData.subLocList.length > 0"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <input type="text" v-model="editSubLocationSearchQuery" placeholder="Search Sub Location"
                              class="border-b border-gray-300 p-2 w-full" />
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="subloc in filteredEditSubLocations" :key="subloc.name"
                                @click="selectEditSubLocation(subloc.name)"
                                class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ subloc.name }}
                              </li>
                              <li v-if="filteredEditSubLocations.length === 0" class="p-2 text-gray-500">No results
                                found</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="file-upload">Upload File</FormLabel>
            <!-- <input type="file" id="file-upload" @change="handleFileUpload" />
      <span v-if="editFormData.fileName">Selected file: {{ editFormData.fileName }}</span> -->

            <label
              class="flex cursor-pointer appearance-none justify-center rounded-md border border-dashed border-gray-300 bg-white px-3 py-6 text-sm transition hover:border-gray-400 focus:border-solid focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
              :class="{ 'cursor-not-allowed': editFormData.status === 'Completed' || editFormData.status === 'QC Rejected' }"
              tabindex="0">
              <div>
                <span for="photo-dropbox" class="flex items-center space-x-2">
                  <svg class="h-6 w-6 stroke-gray-400" viewBox="0 0 256 256">
                    <path d="M96,208H72A56,56,0,0,1,72,96a57.5,57.5,0,0,1,13.9,1.7" fill="none" stroke-linecap="round"
                      stroke-linejoin="round" stroke-width="24"></path>
                    <path d="M80,128a80,80,0,1,1,144,48" fill="none" stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="24"></path>
                    <polyline points="118.1 161.9 152 128 185.9 161.9" fill="none" stroke-linecap="round"
                      stroke-linejoin="round" stroke-width="24"></polyline>
                    <line x1="152" y1="208" x2="152" y2="128" fill="none" stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="24"></line>
                  </svg>
                  <span class="text-md font-medium text-gray-600">
                    Click to Attach the Files <br>
                  </span>

                </span>

                <FormInput id="photo-dropbox" type="file" class="sr-only"
                  :disabled="editFormData.status === 'Completed' || editFormData.status === 'QC Rejected'"
                  @change="editFormData.status !== 'Completed' && editFormData.status !== 'QC Rejected' ? handleFileUpload($event) : null" />
                <div class="mt-2 flex flex-col " v-if="editFormData.fileName">
                  <div class="flex justify-center mt-2 text-xs font-medium text-gray-600">
                    <span>pdf, png ,jpg, jpeg, xls, docx</span>
                  </div>
                </div>
                <div class="mt-3 flex flex-col " v-if="editFormData.fileName">
                  <div class="flex flex-row justify-center">
                    <button @click.prevent="downloadFile"
                      class=" bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center">
                      <span>Download File</span>
                      <Lucide icon="Download" class="w-5 h-5 ml-2 " :stroke-width="2" />
                    </button>
                  </div>

                </div>

              </div>
            </label>
          </div>

          <!-- Add a button to trigger the file download -->


          <div class="mt-5">
            <FormLabel htmlFor="qcPassed">Quality Check Status</FormLabel>
            <FormSelect v-model="qcPassedValue" id="qcPassed" class="sm:mr-2">
              <option value="true">Approve</option>
              <option value="false">Reject</option>
            </FormSelect>
          </div>
          <div class="mt-5 hidden" v-if="editFormData.locations.length > 0">
            <!-- Sub Location Dropdown -->
            <FormLabel htmlFor="subloc-form-5">Sub Location</FormLabel>
            <FormSelect v-model="editFormData.selectedSubLocation" :disabled="editFormData.subLocList.length === 0"
              class="sm:mr-2 mt-2" aria-label="Select a sub location">
              <option disabled value="">Select a Sub Location</option>
              <option v-for="subloc in editFormData.subLocList" :key="subloc.name" :value="subloc.name">
                {{ subloc.name }}
              </option>
            </FormSelect>
          </div>
          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
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
          View Quality Check
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <div class="absolute top-0 left-0 w-full h-full" id="printJS-page" ref="toPrint" style="display: none;">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    PO Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.ponumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    GR Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.grnumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Powder Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productcode }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                    Employee ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.resourcecode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Main Location
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.location }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Sub Location
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.selectedSubLocation || 'No Sub Location Available' }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Vendor Name
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.vendorname }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Vendor Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.vendorcode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Lot Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.lotnumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.nett }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    UOM
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.uom }}
                  </td>
                </tr>
                  <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Warehouse
                    </th>
                    <td class="w-[50%] px-auto text-center ">
                      <span :class="{ 'text-red-600 ': !viewData.whrequired, 'text-green-600': viewData.whrequired }">
                        {{ viewData.whrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.whrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.whrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
                    </td>
                  </tr> -->
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span :class="{
                        'text-green-600': viewData.status === 'Completed',
                        'text-yellow-600': viewData.status === 'Pending',
                        'text-red-600': viewData.status === 'QC Rejected',
                        'text-orange-600': viewData.status === 'Draft',
                        'text-gray-600': !viewData.status || viewData.status === ''
                      }">
                        {{ viewData.status || 'N/A' }}
                      </span>
                    </td>
                  </tr>

                </tbody>
              </table>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.listBoxesList.length > 0">
                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="3"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Box Details
                      </th>
                    </tr>
                    <tr>
                      <th scope="row"
                        class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                        Sub Lot Number
                      </th>
                      <th scope="row"
                        class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                        Nett Weight
                      </th>
                      <th scope="row"
                        class="title px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Gross Weight
                      </th>
                    </tr>
                    <tr v-for="(box, index) in viewData.listBoxesList" :key="index"
                      class="hover:bg-gray-100 dark:hover:bg-gray-100">
                      <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                        {{ box.subLotNumber }}
                      </td>
                      <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                        {{ box.nettWeight }}
                      </td>
                      <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                        {{ box.grossWeight }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    PO Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.ponumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    GR Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.grnumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Powder Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productcode }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                    Employee ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.resourcecode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Main Location
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.location }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Sub Location
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.selectedSubLocation || 'No Sub Location Available' }}
                  </td>
                </tr>


              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Vendor Name
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.vendorname }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Vendor Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.vendorcode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Lot Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.lotnumber }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.nett }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    UOM
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.uom }}
                  </td>
                </tr>

                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:bg-gray-800">
                    Uploaded File
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white" v-if="viewData.fileName">
                    <div class="flex justify-center items-center"> <!-- Flex container to center the button -->
                      <button @click.prevent="viewdownloadFile"
                        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md shadow-md flex items-center">
                        <span>Download File</span>
                        <Lucide icon="Download" class="w-5 h-5 ml-2" :stroke-width="2" />
                      </button>
                    </div>
                  </td>
                </tr>


                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Warehouse
                  </th>
                  <td class="w-[50%] px-auto text-center ">
                    <span :class="{ 'text-red-600 ': !viewData.whrequired, 'text-green-600': viewData.whrequired }">
                      {{ viewData.whrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.whrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.whrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
                  </td>
                </tr> -->
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span :class="{
                      'text-green-600 dark:text-green-500': viewData.status === 'Completed',
                      'text-yellow-600 dark:text-yellow-500': viewData.status === 'Pending',
                      'text-red-600 dark:text-red-500': viewData.status === 'QC Rejected',
                      'text-orange-600 dark:text-orange-500': viewData.status === 'Draft',
                      'text-gray-600': !viewData.status || viewData.status === ''
                    }">
                      {{ viewData.status || 'N/A' }}
                    </span>
                  </td>
                </tr>

              </tbody>
            </table>

          </div>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.listBoxesList.length > 0">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="3"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    Box Details
                  </th>
                </tr>
                <tr>
                  <th scope="row"
                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Sub Lot Number
                  </th>
                  <th scope="row"
                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Nett Weight
                  </th>
                  <th scope="row"
                    class="title px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Gross Weight
                  </th>
                </tr>
                <tr v-for="(box, index) in viewData.listBoxesList" :key="index"
                  class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                    {{ box.subLotNumber }}
                  </td>
                  <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                    {{ box.nettWeight }}
                  </td>
                  <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                    {{ box.grossWeight }}
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
  padding: 4px 2px;
  /* Reduced horizontal padding */
  text-align: center;
  /* Center align text horizontally */
  vertical-align: middle;
  /* Center align text vertically */
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