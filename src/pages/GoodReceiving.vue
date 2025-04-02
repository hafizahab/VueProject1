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
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";

interface UserAccess {
    userId: string;
    goodsReceiving?: string[];
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
  grnumber: "",
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
      // Initial sort
 // Add a title at the top of the print view
 printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Goods Receiving
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
          title: "POWDER NUMBER",
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
          title: "EMP ID",
          minWidth: 150,
          responsive: 0,
          field: "resourcecode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.resourcecode}</div>
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
          title: "DATES",
          minWidth: 200,
          responsive: 0,
          field: "date",
          vertAlign: "middle",
          print: false,
          visible: true,
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
                    // Conditionally render "Edit" link
                    if (
                        userAccess.goodsReceiving &&
                        userAccess.goodsReceiving.includes("Edit") &&
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

                    // Conditionally render "Delete" link
                    if (userAccess.goodsReceiving && userAccess.goodsReceiving.includes("Delete")) {
                        const deleteLink = document.createElement("a");
                        deleteLink.classList.add(
                            "flex",
                            "items-center",
                            "text-danger",
                            "text-sm"
                        );
                        deleteLink.href = "javascript:;";
                        deleteLink.addEventListener("click", () => {
                            deleteRole(response.id);
                        });
                        deleteLink.innerHTML = `<i class="fa-regular fa-trash-can mr-1"></i>Delete`;
                        container.appendChild(deleteLink);
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
      return `<div class="text-xs text-center block break-words">${location}</div>`;
    },
  },
  {
  title: "<span class='text-xs font-bold text-center block'>Sub Location Name</span>",
  field: "subLocationDetailsList",
  visible: false,
  print: true,
  download: true,
  formatter(cell) {
    const response = cell.getData();
    const subLocationList = response.subLocationDetailsList;

    // Check if subLocationDetailsList is an array and has at least one element
    const subLocationName = Array.isArray(subLocationList) && subLocationList.length > 0
      ? subLocationList[0].name
      : 'N/A'; // Fallback if the array is empty or not provided

    return `<div class="text-xs text-center block break-words">${subLocationName}</div>`;
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
    title: "<span class='text-xs font-bold text-center block'>No. of Boxes</span>",
    field: "noofBoxes",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.noofBoxes}</div>`;
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
    title: "<span class='text-xs font-bold text-center block'>Discrepency Weight</span>",
    field: "discrepencyWeight",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.discrepencyWeight}</div>`;
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
    title: "<span class='text-xs font-bold text-center block'>Quality Check</span>",
    field: "qcrequired",
    visible: false,
    print: true,
    download: true,
    formatter: function (cell, formatterParams, onRendered) {
      let status = cell.getValue();
      let textColor;

      if (status === true) {
        status = 'Yes';
        textColor = 'text-green-600'; // Color for "Yes"
      } else {
        status = 'No';
        textColor = 'text-red-600'; // Color for "No"
      }

      return `<span class="text-xs ${textColor} text-center block">${status}</span>`;
    }
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Status</span>",
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

      return `<span class="text-xs ${textColor} text-center block">${status}</span>`;
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





const GRNumber = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("grnumber", 'like', filter.grnumber);
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
      // Remove the filter to return to the default view
      tabulator.value.clearFilter(true);
      tabulator.value.setFilter((item) => {
        return !(item.status === 'Completed' && item.receiveStatus === true);
      });
    }
  }
};

// On reset filter
const onResetFilter = () => {
  // Reset all filter fields to their default values
  setFilter({
    ...filter,
    value: "",
    grnumber: "",
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


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/GRDetails/';
const loading = ref(true); // Loading state for the modal

onMounted(() => {
  loading.value = true; // Show loading modal

  axios.get(API_BASE_URL)
    .then(response => {
      const data = response.data.result;
      console.log('Fetched Data:', data);

      // Sort the data by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Populate the table and apply default filter
      if (tabulator.value) {
        tabulator.value.setData(data);
        tabulator.value.setFilter((item) => !(item.status === 'Completed' && item.receiveStatus === true));
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after fetching
    });

  initTabulator();
  reInitOnResizeWindow();

  // Additional fetch calls
  Promise.all([
    fetchUOM(),
    fetchUserDetails(),
    fetchGRDetails(),
    fetchVendorData(),
    fetchProductCodes(),
    fetchNamesShift(),
    fetchQC(),
    fetchWM(),
    fetchLocation(),
    fetchUserDelete()
  ]).finally(() => {
    loading.value = false;
  });
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


interface SubLocation {
  name: string;
}


const viewData = reactive({
  id: '',
  productcode: '',
  date: formatDate(new Date()),
  resourcecode: '',
  shift: '',
  vendorname: '',
  vendorcode: '',
  ponumber: '',
  lotnumber: '',
  noofBoxes: '',
  nett: '',
  gross: '',
  uom: '',
  discrepencyWeight: '',
  selectedSubLocation: '',
  qcrequired: false,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  subLocList: [] as SubLocation[], // Use the SubLocation type here
  vendornames: [] as string[],
  vendorcodes: [] as string[],
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  listBoxes: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  qualityCheckList: [
    {
      jobId: '',
      resourceCode: '',
      shift: '',
      qualityCheck: '',
      qcPassed: ''
    }
  ],
});

// Form Data
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
  noofBoxes: '',
  nett: 0,
  gross: 0,
  discrepencyWeight: 0,
  uom: '',
  qcrequired: false,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  selectedSubLocation: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  vendornames: [] as string[],
  weightmachines: [] as string[],
  vendorcodes: [] as string[],
  productcodes: [] as string[],
  locations: [] as string[],
  productData: [] as Array<{ code: string; qualitycheckrequired: boolean }>,
  vendorMap: {} as { [key: string]: string },
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: '' }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  listBoxes: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  subLocList: [] as SubLocation[], // Use the SubLocation type here
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
  noofBoxes: '',
  nett: 0,
  gross: 0,
  discrepencyWeight: 0,
  uom: '',
  qcrequired: false,
  whrequired: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  selectedSubLocation: '',
  weightmachine: '',
  isWeightMachineDisabled: false,
  vendornames: [] as string[],
  weightmachines: [] as string[],
  vendorcodes: [] as string[],
  productcodes: [] as string[],
  locations: [] as string[],
  productData: [] as Array<{ code: string; qualitycheckrequired: boolean }>,
  vendorMap: {} as { [key: string]: string },
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: '' }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  listBoxes: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});

// Define reactive variables using ref
const canCreateGoodsReceiving = ref(false);
let canDeleteGoodsReceiving = false; // Variable to store delete permission
let canEditGoodsReceiving = false;   // Variable to store edit permission
// Define the fetchUserDelete function
const fetchUserDelete = async () => {
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

      const goodsReceiving = userDetails.goodsReceiving || ''; // Ensure the value is a string

      // Check if the string contains "Create", "Delete", and "Edit"
      canCreateGoodsReceiving.value = goodsReceiving.includes('Create');
      // Check if the string contains "Delete"
      canDeleteGoodsReceiving = goodsReceiving.includes('Delete');

      // Check if the string contains "Edit"
      canEditGoodsReceiving = goodsReceiving.includes('Edit');
      console.log('canCreateGoodsReceiving:', canCreateGoodsReceiving.value); // Debugging log
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

// Dropdown control
const isDropdownOpen = ref(false);
const searchQuery = ref('');
const selectedProductCode = ref(addFormData.productcode);

// Computed property to filter product codes based on search query
const filteredProductCodes = computed(() => {
  if (!searchQuery.value) {
    return addFormData.productcodes;
  }
  return addFormData.productcodes.filter((productcode) =>
    productcode.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Function to toggle dropdown open/close
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
  searchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a product code
const selectProductCode = (productcode: any) => {
  selectedProductCode.value = productcode;
  addFormData.productcode = productcode;
  isDropdownOpen.value = false; // Close the dropdown after selecting
};


// Location dropdown control
const isLocationDropdownOpen = ref(false);
const locationSearchQuery = ref('');
const selectedLocation = ref(addFormData.location);

// Computed property to filter locations based on search query
const filteredLocations = computed(() => {
  if (!locationSearchQuery.value) {
    return addFormData.locations;
  }
  return addFormData.locations.filter((location) =>
    location.toLowerCase().includes(locationSearchQuery.value.toLowerCase())
  );
});

// Function to toggle location dropdown open/close
const toggleLocationDropdown = () => {
  isLocationDropdownOpen.value = !isLocationDropdownOpen.value;
  locationSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a location
const selectLocation = (location: any) => {
  selectedLocation.value = location;
  addFormData.location = location;
  isLocationDropdownOpen.value = false; // Close the dropdown after selecting
};





// Sub Location dropdown control
const isSubLocationDropdownOpen = ref(false);
const subLocationSearchQuery = ref('');
const selectedSubLocation = ref(addFormData.selectedSubLocation);

// Computed property to filter sub locations based on search query
const filteredSubLocations = computed(() => {
  if (!subLocationSearchQuery.value) {
    return addFormData.subLocList;
  }
  return addFormData.subLocList.filter((subloc) =>
    subloc.name.toLowerCase().includes(subLocationSearchQuery.value.toLowerCase())
  );
});

// Function to toggle sub-location dropdown open/close
const toggleSubLocationDropdown = () => {
  if (addFormData.subLocList.length > 0) {
    isSubLocationDropdownOpen.value = !isSubLocationDropdownOpen.value;
    subLocationSearchQuery.value = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a sub location
const selectSubLocation = (subLocation: any) => {
  selectedSubLocation.value = subLocation;
  addFormData.selectedSubLocation = subLocation;
  isSubLocationDropdownOpen.value = false; // Close the dropdown after selecting
};


// Vendor Code and Name dropdown control
const isVendorCodeDropdownOpen = ref(false);
const vendorCodeSearchQuery = ref('');
const selectedVendorCode = ref(addFormData.vendorcode);

const isVendorNameDropdownOpen = ref(false);
const vendorNameSearchQuery = ref('');
const selectedVendorName = ref(addFormData.vendorname);

// Computed property to filter vendor codes based on search query
const filteredVendorCodes = computed(() => {
  if (!vendorCodeSearchQuery.value) {
    return addFormData.vendorcodes;
  }
  return addFormData.vendorcodes.filter((code) =>
    code.toLowerCase().includes(vendorCodeSearchQuery.value.toLowerCase())
  );
});

// Computed property to filter vendor names based on search query
const filteredVendorNames = computed(() => {
  if (!vendorNameSearchQuery.value) {
    return addFormData.vendornames;
  }
  return addFormData.vendornames.filter((name) =>
    name.toLowerCase().includes(vendorNameSearchQuery.value.toLowerCase())
  );
});

// Function to toggle vendor code dropdown open/close
const toggleVendorCodeDropdown = () => {
  isVendorCodeDropdownOpen.value = !isVendorCodeDropdownOpen.value;
  vendorCodeSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to toggle vendor name dropdown open/close
const toggleVendorNameDropdown = () => {
  isVendorNameDropdownOpen.value = !isVendorNameDropdownOpen.value;
  vendorNameSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a vendor code and update corresponding vendor name
const selectVendorCode = (code: any) => {
  selectedVendorCode.value = code;
  addFormData.vendorcode = code;
  addFormData.vendorname = addFormData.vendorMap[code]; // Automatically set the corresponding vendor name
  selectedVendorName.value = addFormData.vendorMap[code]; // Update the selected vendor name
  isVendorCodeDropdownOpen.value = false; // Close the dropdown after selecting
};

// Function to select a vendor name and update corresponding vendor code
const selectVendorName = (name: any) => {
  selectedVendorName.value = name;
  addFormData.vendorname = name;
  addFormData.vendorcode = addFormData.vendorMap[name]; // Automatically set the corresponding vendor code
  selectedVendorCode.value = addFormData.vendorMap[name]; // Update the selected vendor code
  isVendorNameDropdownOpen.value = false; // Close the dropdown after selecting
};

// EDIT FORM DATA DROPDOWN

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


// Vendor Code and Name dropdown control for edit form
const isEditVendorCodeDropdownOpen = ref(false);
const editVendorCodeSearchQuery = ref('');
const selectedEditVendorCode = ref(editFormData.vendorcode);

const isEditVendorNameDropdownOpen = ref(false);
const editVendorNameSearchQuery = ref('');
const selectedEditVendorName = ref(editFormData.vendorname);

// Computed property to filter vendor codes based on search query for edit form
const filteredEditVendorCodes = computed(() => {
  if (!editVendorCodeSearchQuery.value) {
    return editFormData.vendorcodes;
  }
  return editFormData.vendorcodes.filter((code) =>
    code.toLowerCase().includes(editVendorCodeSearchQuery.value.toLowerCase())
  );
});

// Computed property to filter vendor names based on search query for edit form
const filteredEditVendorNames = computed(() => {
  if (!editVendorNameSearchQuery.value) {
    return editFormData.vendornames;
  }
  return editFormData.vendornames.filter((name) =>
    name.toLowerCase().includes(editVendorNameSearchQuery.value.toLowerCase())
  );
});

// Function to toggle vendor code dropdown open/close for edit form
const toggleEditVendorCodeDropdown = () => {
  isEditVendorCodeDropdownOpen.value = !isEditVendorCodeDropdownOpen.value;
  editVendorCodeSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to toggle vendor name dropdown open/close for edit form
const toggleEditVendorNameDropdown = () => {
  isEditVendorNameDropdownOpen.value = !isEditVendorNameDropdownOpen.value;
  editVendorNameSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a vendor code and update corresponding vendor name in edit form
const selectEditVendorCode = (code: any) => {
  selectedEditVendorCode.value = code;
  editFormData.vendorcode = code;
  editFormData.vendorname = editFormData.vendorMap[code]; // Automatically set the corresponding vendor name
  selectedEditVendorName.value = editFormData.vendorMap[code]; // Update the selected vendor name
  isEditVendorCodeDropdownOpen.value = false; // Close the dropdown after selecting
};

// Function to select a vendor name and update corresponding vendor code in edit form
const selectEditVendorName = (name: any) => {
  selectedEditVendorName.value = name;
  editFormData.vendorname = name;
  editFormData.vendorcode = editFormData.vendorMap[name]; // Automatically set the corresponding vendor code
  selectedEditVendorCode.value = editFormData.vendorMap[name]; // Update the selected vendor code
  isEditVendorNameDropdownOpen.value = false; // Close the dropdown after selecting
};


// Watch for changes in each box's grossWeight and addFormData.discrepencyWeight
// Watch for changes in listBoxesList and discrepencyWeight for addFormData
watch(
  () => addFormData.listBoxesList,
  (newList) => {
    newList.forEach((box, index) => {
      // Calculate and round nettWeight to four decimal places, and convert to number
      box.nettWeight = parseFloat((box.grossWeight - addFormData.discrepencyWeight).toFixed(4));
    });
  },
  { deep: true }
);

// Watch specifically for discrepencyWeight changes and recalculate nettWeight for addFormData
watch(
  () => addFormData.discrepencyWeight,
  (newDiscrepencyWeight) => {
    addFormData.listBoxesList.forEach(box => {
      // Calculate and round nettWeight to four decimal places, and convert to number
      box.nettWeight = parseFloat((box.grossWeight - newDiscrepencyWeight).toFixed(4));
    });
  }
);

// Watch for changes in listBoxesList and discrepencyWeight for editFormData
watch(
  () => editFormData.listBoxesList,
  (newList) => {
    newList.forEach((box, index) => {
      // Calculate and round nettWeight to four decimal places, and convert to number
      box.nettWeight = parseFloat((box.grossWeight - editFormData.discrepencyWeight).toFixed(4));
    });
  },
  { deep: true }
);

// Watch specifically for discrepencyWeight changes and recalculate nettWeight for editFormData
watch(
  () => editFormData.discrepencyWeight,
  (newDiscrepencyWeight) => {
    editFormData.listBoxesList.forEach(box => {
      // Calculate and round nettWeight to four decimal places, and convert to number
      box.nettWeight = parseFloat((box.grossWeight - newDiscrepencyWeight).toFixed(4));
    });
  }
);



// To track the selected box index
const selectedBoxIndex = ref<number | null>(null);

// Watch for changes in the selectedBoxIndex to focus on the correct subLotNumber input
watch(selectedBoxIndex, async (newIndex) => {
  if (newIndex !== null) {
    await nextTick(); // Wait until the DOM is updated
    const input = document.querySelector(`#subLotInput-${newIndex}`) as HTMLInputElement | null;
    if (input) {
      input.focus();
    }
  }
});

// Function to call the API and update the weight for the specific row
const syncWeight = async (index: number) => {
  try {
    const response = await fetch(`http://10.87.0.33:8082/api/WarehouseRequest/GetWeightbyMachineId?MachineId=${editFormData.weightmachine}`);
    const data = await response.json();

    if (data.result === 'Table does not exist') {
      Swal.fire('Error', 'Table does not exist', 'error');
    } else if (response.ok) {
      // Convert the result to a number and update the weight in the specific row
      const weight = parseFloat(data.result);
      if (!isNaN(weight)) {
        editFormData.listBoxesList[index].grossWeight = weight;

        // Call updateNettAndGross after setting the gross weight
        updateNettAndGross();
      }
    } else {
      Swal.fire('Error', 'Failed to sync weight', 'error');
    }
  } catch (error) {
    Swal.fire('Error', 'API request failed', 'error');
  }
};

const AddsyncWeight = async (index: number) => {
  try {
    const response = await fetch(`http://10.87.0.33:8082/api/WarehouseRequest/GetWeightbyMachineId?MachineId=${addFormData.weightmachine}`);
    const data = await response.json();

    if (data.result === 'Table does not exist') {
      Swal.fire('Error', 'Table does not exist', 'error');
    } else if (response.ok) {
      // Convert the result to a number and update the weight in the specific row
      const weight = parseFloat(data.result);
      if (!isNaN(weight)) {
        addFormData.listBoxesList[index].grossWeight = weight;
      }
    } else {
      Swal.fire('Error', 'Failed to sync weight', 'error');
    }
  } catch (error) {
    Swal.fire('Error', 'API request failed', 'error');
  }
};

const formatDatePart = (part: number) => (part < 10 ? `0${part}` : part);

const generateLotNumber = (grnumber: string) => {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = formatDatePart(date.getMonth() + 1);
  const dd = formatDatePart(date.getDate());
  const grCode = grnumber.replace(/-/g, ''); // Remove dashes
  return `${grCode}${yy}${mm}${dd}`;
};

watch(
  () => addFormData.grnumber,
  (newGrnumber) => {
    if (newGrnumber) {
      addFormData.lotnumber = generateLotNumber(newGrnumber);
    } else {
      addFormData.lotnumber = '';
    }
  }
);

// watch(
//   () => editFormData.grnumber,
//   (newGrnumber) => {
//     if (newGrnumber) {
//       editFormData.lotnumber = generateLotNumber(newGrnumber);
//     } else {
//       editFormData.lotnumber = '';
//     }
//   }
// );



watch(() => addFormData.vendorname, (newName) => {
  if (newName) {
    addFormData.vendorcode = addFormData.vendorMap[newName] || '';
  }
});

watch(() => addFormData.vendorcode, (newCode) => {
  if (newCode) {
    addFormData.vendorname = addFormData.vendorMap[newCode] || '';
  }
});

watch(() => editFormData.vendorname, (newName) => {
  if (newName) {
    editFormData.vendorcode = editFormData.vendorMap[newName] || '';
  }
});

watch(() => editFormData.vendorcode, (newCode) => {
  if (newCode) {
    editFormData.vendorname = editFormData.vendorMap[newCode] || '';
  }
});

const fetchWM = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type.toLowerCase() === 'weighing machine' &&
          item.location.toLowerCase() === 'goods receiving'
        );

        const weightMachineNames = activeNameData.map(item => item.name);

        addFormData.weightmachines = weightMachineNames;
        editFormData.weightmachines = weightMachineNames;

        if (weightMachineNames.length === 1) {
          // Only one item found
          addFormData.weightmachine = weightMachineNames[0]; // Set as default value for add form
          editFormData.weightmachine = weightMachineNames[0]; // Set as default value for edit form

          addFormData.isWeightMachineDisabled = true;   // Disable the FormSelect for add form
          editFormData.isWeightMachineDisabled = true;  // Disable the FormSelect for edit form
        } else if (weightMachineNames.length > 1) {
          // More than one item found
          addFormData.weightmachine = weightMachineNames[0]; // Set the first item as default for add form
          editFormData.weightmachine = weightMachineNames[0]; // Set the first item as default for edit form

          addFormData.isWeightMachineDisabled = false;  // Enable the FormSelect for add form
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




const fetchQC = () => {
  axios.get('http://10.87.0.33:8082/api/ProductMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');
        // Store product data in addFormData.productData
        addFormData.productData = activeNameData;
        // Also store product codes for the dropdown
        addFormData.productcodes = activeNameData.map(item => item.code);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};


// Watch for changes in productcode
watch(() => addFormData.productcode, (newProductCode) => {
  if (newProductCode) {
    // Find the selected product in the productData array
    const selectedProduct = addFormData.productData.find(product => product.code === newProductCode);
    if (selectedProduct) {
      // Update qcrequired based on the selected product
      addFormData.qcrequired = selectedProduct.qualitycheckrequired;
    }
  }
});

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
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');
        addFormData.locations = activeNameData.map(item => item.name);
        editFormData.locations = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};




const fetchSubLocations = (locationName: string, formType: any) => {
  axios.get('http://10.87.0.33:8082/api/LocationMaster')
    .then(response => {
      const locationData = response.data.result.find((item: any) => item.name === locationName);

      if (locationData && locationData.subLocationDetailsList) {
        if (formType === 'add') {
          addFormData.subLocList = locationData.subLocationDetailsList;
          if (!addFormData.selectedSubLocation) {
            addFormData.selectedSubLocation = ''; // Reset sublocation when the main location changes
          }
        } else if (formType === 'edit') {
          editFormData.subLocList = locationData.subLocationDetailsList;

          // Keep the selected sublocation if it's already set
          if (!editFormData.selectedSubLocation) {
            editFormData.selectedSubLocation = locationData.subLocationDetailsList.length > 0
              ? locationData.subLocationDetailsList[0].name
              : '';
          }
        }
      } else {
        if (formType === 'add') {
          addFormData.subLocList = [];
          addFormData.selectedSubLocation = '';
        } else if (formType === 'edit') {
          editFormData.subLocList = [];
          editFormData.selectedSubLocation = '';
        }
      }
    })
    .catch(error => {
      console.error('Error fetching sub-locations:', error);
      if (formType === 'add') {
        addFormData.subLocList = [];
        addFormData.selectedSubLocation = '';
      } else if (formType === 'edit') {
        editFormData.subLocList = [];
        editFormData.selectedSubLocation = '';
      }
    });
};


// Watchers for location changes
watch(() => addFormData.location, (newLocation) => {
  if (newLocation) {
    fetchSubLocations(newLocation, 'add');
  }
});

watch(() => editFormData.location, (newLocation) => {
  if (newLocation) {
    fetchSubLocations(newLocation, 'edit');
  }
});



const fetchProductCodes = () => {
  axios.get('http://10.87.0.33:8082/api/ProductMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive' && item.productType === 'Powder'
        );

        // Store the complete product data
        const productData = activeNameData.map(item => ({
          code: item.code,
          qualitycheckrequired: item.qualitycheckrequired
        }));

        addFormData.productcodes = productData.map(item => item.code);
        editFormData.productcodes = productData.map(item => item.code);

        // Store the product data globally for later use
        addFormData.productData = productData;
        editFormData.productData = productData;
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

watch(
  () => addFormData.productcode,
  (newProductCode) => {
    if (newProductCode) {
      // Call API to fetch the product details
      axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
          const products = response.data.result;

          if (Array.isArray(products)) {
            // Find the product with the selected code
            const selectedProduct = products.find(product => product.code === newProductCode);

            if (selectedProduct) {
              // Fetch vendor data to determine discrepencyWeight
              axios.get('http://10.87.0.33:8082/api/VendorMaster')
                .then(vendorResponse => {
                  const vendorData = vendorResponse.data.result;

                  if (Array.isArray(vendorData)) {
                    // Find the vendor by selected vendor name
                    const selectedVendor = vendorData.find(vendor => vendor.name === addFormData.vendorname);

                    if (selectedVendor && Array.isArray(selectedVendor.vendorPowderList)) {
                      // Find the powder list entry that matches the selected product's powder code
                      const matchingPowder = selectedVendor.vendorPowderList.find(
                        (powder : any) => powder.powderCode === selectedProduct.code && powder.status.toLowerCase() === 'active'
                      );

                      if (matchingPowder) {
                        // Set discrepencyWeight based on the matching powder
                        addFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                        editFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                      } else {
                        // No matching powder found, set discrepencyWeight to 0
                        addFormData.discrepencyWeight = 0;
                        editFormData.discrepencyWeight = 0;
                      }
                    } else {
                      // Vendor or vendorPowderList not found, set discrepencyWeight to 0
                      addFormData.discrepencyWeight = 0;
                      editFormData.discrepencyWeight = 0;
                    }
                  } else {
                    console.error('Invalid response format for vendor data:', vendorData);
                  }
                })
                .catch(vendorError => {
                  console.error('Error fetching vendor data:', vendorError);
                  addFormData.discrepencyWeight = 0;
                  editFormData.discrepencyWeight = 0;
                });
            } else {
              console.error(`Product code ${newProductCode} not found`);
              addFormData.discrepencyWeight = 0;
              editFormData.discrepencyWeight = 0;
            }
          } else {
            console.error('Invalid response format for products:', products);
          }
        })
        .catch(error => {
          console.error('Error fetching product details:', error);
        });
    }
  }
);

watch(
  () => addFormData.vendorname,
  (newVendorName) => {
    if (newVendorName) {
      // Re-evaluate discrepencyWeight when vendor name changes
      const selectedProductCode = addFormData.productcode;

      if (selectedProductCode) {
        axios.get('http://10.87.0.33:8082/api/VendorMaster')
          .then(vendorResponse => {
            const vendorData = vendorResponse.data.result;

            if (Array.isArray(vendorData)) {
              const selectedVendor = vendorData.find(vendor => vendor.name === newVendorName);

              if (selectedVendor && Array.isArray(selectedVendor.vendorPowderList)) {
                const matchingPowder = selectedVendor.vendorPowderList.find(
                  (powder : any) => powder.powderCode === selectedProductCode && powder.status.toLowerCase() === 'active'
                );

                if (matchingPowder) {
                  addFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                  editFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                } else {
                  addFormData.discrepencyWeight = 0;
                  editFormData.discrepencyWeight = 0;
                }
              } else {
                addFormData.discrepencyWeight = 0;
                editFormData.discrepencyWeight = 0;
              }
            } else {
              console.error('Invalid response format for vendor data:', vendorData);
            }
          })
          .catch(error => {
            console.error('Error fetching vendor data:', error);
            addFormData.discrepencyWeight = 0;
            editFormData.discrepencyWeight = 0;
          });
      }
    }
  }
);

watch(
  () => editFormData.productcode,
  (newProductCode) => {
    if (newProductCode) {
      // Call API to fetch the product details
      axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
          const products = response.data.result;

          if (Array.isArray(products)) {
            // Find the product with the selected code
            const selectedProduct = products.find(product => product.code === newProductCode);

            if (selectedProduct) {
              // Fetch vendor data to determine discrepencyWeight
              axios.get('http://10.87.0.33:8082/api/VendorMaster')
                .then(vendorResponse => {
                  const vendorData = vendorResponse.data.result;

                  if (Array.isArray(vendorData)) {
                    // Find the vendor by selected vendor name
                    const selectedVendor = vendorData.find(vendor => vendor.name === editFormData.vendorname);

                    if (selectedVendor && Array.isArray(selectedVendor.vendorPowderList)) {
                      // Find the powder list entry that matches the selected product's powder code
                      const matchingPowder = selectedVendor.vendorPowderList.find(
                        (powder:any) => powder.powderCode === selectedProduct.code && powder.status.toLowerCase() === 'active'
                      );

                      if (matchingPowder) {
                        // Set discrepencyWeight based on the matching powder
                        editFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                      } else {
                        // No matching powder found, set discrepencyWeight to 0
                        editFormData.discrepencyWeight = 0;
                      }
                    } else {
                      // Vendor or vendorPowderList not found, set discrepencyWeight to 0
                      editFormData.discrepencyWeight = 0;
                    }
                  } else {
                    console.error('Invalid response format for vendor data:', vendorData);
                  }
                })
                .catch(vendorError => {
                  console.error('Error fetching vendor data:', vendorError);
                  editFormData.discrepencyWeight = 0;
                });
            } else {
              console.error(`Product code ${newProductCode} not found`);
              editFormData.discrepencyWeight = 0;
            }
          } else {
            console.error('Invalid response format for products:', products);
          }
        })
        .catch(error => {
          console.error('Error fetching product details:', error);
        });
    }
  }
);

watch(
  () => editFormData.vendorname,
  (newVendorName) => {
    if (newVendorName) {
      // Re-evaluate discrepencyWeight when vendor name changes
      const selectedProductCode = editFormData.productcode;

      if (selectedProductCode) {
        axios.get('http://10.87.0.33:8082/api/VendorMaster')
          .then(vendorResponse => {
            const vendorData = vendorResponse.data.result;

            if (Array.isArray(vendorData)) {
              const selectedVendor = vendorData.find(vendor => vendor.name === newVendorName);

              if (selectedVendor && Array.isArray(selectedVendor.vendorPowderList)) {
                const matchingPowder = selectedVendor.vendorPowderList.find(
                  (powder : any) => powder.powderCode === selectedProductCode && powder.status.toLowerCase() === 'active'
                );

                if (matchingPowder) {
                  editFormData.discrepencyWeight = matchingPowder.discrepencyWeight || 0;
                } else {
                  editFormData.discrepencyWeight = 0;
                }
              } else {
                editFormData.discrepencyWeight = 0;
              }
            } else {
              console.error('Invalid response format for vendor data:', vendorData);
            }
          })
          .catch(error => {
            console.error('Error fetching vendor data:', error);
            editFormData.discrepencyWeight = 0;
          });
      }
    }
  }
);



const fetchVendorData = () => {
  axios.get('http://10.87.0.33:8082/api/VendorMaster')
    .then(response => {
      const vendorData = response.data.result;

      if (Array.isArray(vendorData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeVendorData = vendorData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Set up arrays and mapping
        addFormData.vendornames = activeVendorData.map(item => item.name);
        addFormData.vendorcodes = activeVendorData.map(item => item.code);
        editFormData.vendornames = activeVendorData.map(item => item.name);
        editFormData.vendorcodes = activeVendorData.map(item => item.code);

        addFormData.vendorMap = activeVendorData.reduce((map, item) => {
          map[item.name] = item.code;
          map[item.code] = item.name;
          return map;
        }, {});
        editFormData.vendorMap = { ...addFormData.vendorMap };
      } else {
        console.error('Invalid response format for vendor data:', vendorData);
      }
    })
    .catch(error => {
      console.error('Error fetching vendor data:', error);
    });
};


const fetchUserDetails = async () => {
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

    // Fetch user details from the UserRegistration API
    const userRegistrationResponse = await axios.get('http://10.87.0.33:8082/api/UserRegistration');
    let userDetails = userRegistrationResponse.data.result.find((user: any) => user.id === userId);

    // If userDetails are not found in UserRegistration API, check the UserMaster API
    if (!userDetails) {
      console.log('User not found in UserRegistration API, checking UserMaster API'); // Debugging line

      const userMasterResponse = await axios.get('http://10.87.0.33:8082/api/UserMaster');
      userDetails = userMasterResponse.data.result.find((user: any) => user.id === userId && user.status === 'active');
    }

    // Check if userDetails are found and fetch the employeeId
    if (userDetails) {
      console.log('Fetched user details:', userDetails); // Debugging line
      const employeeId = userDetails.employeeid; // Get the employee ID
      console.log('Employee ID:', employeeId); // Debugging line
      addFormData.resourcecode = employeeId; // Set the employee ID in form data
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User details not found'
      });
    }
  } catch (error) {
    console.error('Error fetching user details:', error); // Debugging line
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while fetching user details'
    });
  }
};


watch(() => addFormData.productcode, (newCode) => {
  const selectedProduct = addFormData.productData.find(product => product.code === newCode);
  if (selectedProduct) {
    addFormData.qcrequired = selectedProduct.qualitycheckrequired;
  } else {
    addFormData.qcrequired = false;
  }
});






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


const updateTotalWeights = (formData: any) => {
  formData.nett = formData.listBoxesList.reduce((acc: any, box: any) => acc + (parseFloat(box.nettWeight) || 0), 0);
  formData.gross = formData.listBoxesList.reduce((acc: any, box: any) => acc + (parseFloat(box.grossWeight) || 0), 0);
};


const formSubmitted = ref(false);
const formSubmittedSave = ref(false);
const isSave = ref(false);

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

// Fetch and Set Data for Edit/View
// Create a new variable to store the fetched lotnumber
let fetchedLotNumber: string | null = null; // Store original fetched lot number
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

        if (formData.listBoxesList.length === 0) {
          updateListBoxesList(formData.noofBoxes); // Update listBoxesList if empty
        }

        // Set dropdown values
        selectedEditVendorCode.value = formData.vendorcode;
        selectedEditVendorName.value = formData.vendorname;
        selectedEditLocation.value = formData.location;
        selectedEditSubLocation.value = formData.selectedSubLocation;

        // Store fetched lot number and sub-lot numbers
        fetchedLotNumber = formData.lotnumber;
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
  loading.value = true; // Show loading modal

  axios.get(API_BASE_URL)
    .then(response => {
      const data = response.data.result;
      console.log('Fetched Data:', data);

      // Sort the data by date
      data.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Populate the table and apply default filter
      if (tabulator.value) {
        tabulator.value.setData(data);
        tabulator.value.setFilter((item) => !(item.status === 'Completed' && item.receiveStatus === true));
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after fetching
    });

  initTabulator();
  reInitOnResizeWindow();

  // Additional fetch calls
  Promise.all([
    fetchUOM(),
    fetchUserDetails(),
    fetchGRDetails(),
    fetchVendorData(),
    fetchProductCodes(),
    fetchNamesShift(),
    fetchQC(),
    fetchWM(),
    fetchLocation(),
    fetchUserDelete()
  ]).finally(() => {
    loading.value = false;
  });
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
  noofBoxes: number;
  nett: number;
  gross: number;
  discrepencyWeight: number;
  uom: string;
  location: string;
  qcrequired: boolean;
  qualityCheckList?: {
    jobId: string;
    resourceCode: string;
    shift: string;
    qcPassed: string;
  }[];
  listBoxesList?: {
    jobId: string;
    subLotNumber: string;
    nettWeight: number;
    grossWeight: number;
  }[];
  subLocList: {
    name: string;
  }[];
}


// Update Role
const updateRole = () => {
  formSubmitted.value = true;
  // Check if the main gross value has more than 4 decimal places
  const grossHasTooManyDecimals = editFormData.gross?.toString().split('.')[1]?.length > 4;

  // Check if any box has more than 4 decimal places for grossWeight or nettWeight
  const boxesHaveTooManyDecimals = editFormData.listBoxesList.some(box => {
    const grossWeightHasTooManyDecimals = box.grossWeight?.toString().split('.')[1]?.length > 4;
    const nettWeightHasTooManyDecimals = box.nettWeight?.toString().split('.')[1]?.length > 4;
    return grossWeightHasTooManyDecimals || nettWeightHasTooManyDecimals;
  });

  // Add unified validation logic
  if (!editFormData.grnumber ||
    !editFormData.location ||
    !editFormData.resourcecode ||
    !editFormData.vendorname ||
    !editFormData.vendorcode ||
    !editFormData.ponumber ||
    !editFormData.lotnumber ||
    (!editFormData.noofBoxes || !isNumeric(editFormData.noofBoxes)) ||
    (!editFormData.gross || !isNumeric(editFormData.gross)) ||
    grossHasTooManyDecimals ||  // Include check for the main gross field
    boxesHaveTooManyDecimals || // Include check for box-level grossWeight and nettWeight
    !editFormData.uom) {
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
  } else {
    // Populate listBoxesList based on the number of boxes


    const payload: Payload = {
      grnumber: String(editFormData.grnumber),
      productcode: String(editFormData.productcode),
      date: String(editFormData.date),
      resourcecode: String(editFormData.resourcecode),
      shift: String(editFormData.shift),
      vendorname: String(editFormData.vendorname),
      vendorcode: String(editFormData.vendorcode),
      ponumber: String(editFormData.ponumber),
      lotnumber: String(editFormData.lotnumber),
      noofBoxes: parseFloat(editFormData.noofBoxes),
      nett: editFormData.nett,
      gross: editFormData.gross,
      discrepencyWeight: editFormData.discrepencyWeight,
      uom: String(editFormData.uom),
      location: String(editFormData.location),
      qcrequired: Boolean(editFormData.qcrequired),
      qualityCheckList: [{
        jobId: String(addFormData.grnumber),
        resourceCode: String(addFormData.resourcecode),
        shift: String(addFormData.shift),
        qcPassed: ''
      }],
      listBoxesList: editFormData.listBoxesList.map(box => ({
        jobId: String(editFormData.grnumber),
        subLotNumber: String(box.subLotNumber),
        nettWeight: box.nettWeight, // Direct assignment
        grossWeight: box.grossWeight,
      })),
      subLocList: [
        {
          name: editFormData.selectedSubLocation, // Only the selected sublocation is included in the array
        }
      ]
    };
    console.log("Payload:", JSON.stringify(payload, null, 2)); // Add console log for payload
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
        axios.post(`http://10.87.0.33:8082/api/GRDetails/SubmitGRDetails`, payload)
          .then(() => {
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
          .catch(error => handleError(error, 'Error updating data'));
      }
    });
  }
};
const saveupdateRole = () => {
  formSubmitted.value = true;

  // Check if the main gross value has more than 4 decimal places
  const grossHasTooManyDecimals = editFormData.gross?.toString().split('.')[1]?.length > 4;

  // Check if any box has more than 4 decimal places for grossWeight or nettWeight
  const boxesHaveTooManyDecimals = editFormData.listBoxesList.some(box => {
    const grossWeightHasTooManyDecimals = box.grossWeight?.toString().split('.')[1]?.length > 4;
    const nettWeightHasTooManyDecimals = box.nettWeight?.toString().split('.')[1]?.length > 4;
    return grossWeightHasTooManyDecimals || nettWeightHasTooManyDecimals;
  });

  // Add unified validation logic
  if (grossHasTooManyDecimals ||  // Include check for the main gross field
    boxesHaveTooManyDecimals) {

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

    return; // Exit the function if validation fails
  }
  // Proceed directly without validation
  const payload: Payload = {
    grnumber: String(editFormData.grnumber),
    productcode: String(editFormData.productcode),
    date: String(editFormData.date),
    resourcecode: String(editFormData.resourcecode),
    shift: String(editFormData.shift),
    vendorname: String(editFormData.vendorname),
    vendorcode: String(editFormData.vendorcode),
    ponumber: String(editFormData.ponumber),
    lotnumber: String(editFormData.lotnumber),
    noofBoxes: parseFloat(editFormData.noofBoxes),
    nett: editFormData.nett,
    gross: editFormData.gross,
    discrepencyWeight: editFormData.discrepencyWeight,
    uom: String(editFormData.uom),
    location: String(editFormData.location),
    qcrequired: Boolean(editFormData.qcrequired),
    qualityCheckList: [{
      jobId: String(addFormData.grnumber),
      resourceCode: String(addFormData.resourcecode),
      shift: String(addFormData.shift),
      qcPassed: ''
    }],
    listBoxesList: editFormData.listBoxesList.map(box => ({
      jobId: String(editFormData.grnumber),
      subLotNumber: String(box.subLotNumber),
      nettWeight: box.nettWeight, // Direct assignment
      grossWeight: box.grossWeight,
    })),
    subLocList: [
      {
        name: editFormData.selectedSubLocation, // Only the selected sublocation is included in the array
      }
    ]
  };

  console.log("Payload:", JSON.stringify(payload, null, 2)); // Add console log for payload

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
      axios.post(`http://10.87.0.33:8082/api/GRDetails/SaveGRDetails`, payload)
        .then(() => {
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
        .catch(error => handleError(error, 'Error updating data'));
    }
  });
};




// Add Role

// Method to handle form validation and display error messages
const validateForm = () => {
  formSubmitted.value = true;

  if (!editFormData.discrepencyWeight) {
    editFormData.discrepencyWeight = 0;
  }

  if (
    !addFormData.productcode ||
    !addFormData.resourcecode ||
    !addFormData.ponumber ||
    !addFormData.lotnumber ||
    !addFormData.gross ||
    !addFormData.location ||
    (editFormData.discrepencyWeight !== null && editFormData.discrepencyWeight !== undefined &&
      (isNaN(editFormData.discrepencyWeight) || // Check if it's a valid number
        editFormData.discrepencyWeight.toString().split('.')[1]?.length > 4)) ||
    (isNaN(addFormData.gross) || addFormData.gross.toString().split('.')[1]?.length > 4) ||
    addFormData.listBoxesList.some(box =>
      isNaN(box.grossWeight) ||
      box.grossWeight.toString().split('.')[1]?.length > 4 ||
      isNaN(box.nettWeight) ||
      box.nettWeight.toString().split('.')[1]?.length > 4
    )
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




const isFormSaved = ref(false);

const handleClose = async () => {
  resetFormData(addFormData);
  updateTableData();
  fetchUOM();
  fetchUserDetails();
  fetchGRDetails();
  fetchVendorData();
  fetchProductCodes();
  fetchNamesShift();
  fetchLocation();
  fetchWM();
  checkGRExists();

  // Reset the selected product code and search query
  selectedProductCode.value = ''; // Reset selected product code
  searchQuery.value = ''; // Reset the search input
  selectedLocation.value = ''; // Reset selected product code
  locationSearchQuery.value = ''; // Reset the search input
  selectedSubLocation.value = ''; // Reset selected product code
  subLocationSearchQuery.value = ''; // Reset the search input
  selectedVendorCode.value = ''; // Reset selected product code
  vendorCodeSearchQuery.value = ''; // Reset the search input
  vendorNameSearchQuery.value = ''; // Reset selected product code
  selectedVendorName.value = ''; // Reset the search input

  addSlideover.value = false;
  isSave.value = false;
  isFormSaved.value = false;
  formSubmitted.value = false;
  addFormData.subLocList = [];
};



// Method to handle the Save button click event
const saveRole = async () => {
  formSubmittedSave.value = true;

  if (
    !addFormData.productcode ||
    (isNaN(addFormData.discrepencyWeight) || addFormData.discrepencyWeight.toString().split('.')[1]?.length > 4) ||
    (!isNaN(addFormData.discrepencyWeight) && addFormData.discrepencyWeight.toString().split('.')[1]?.length > 4) ||
    (isNaN(addFormData.gross) || addFormData.gross.toString().split('.')[1]?.length > 4) ||
    addFormData.listBoxesList.some(box =>
      isNaN(box.grossWeight) ||
      box.grossWeight.toString().split('.')[1]?.length > 4 ||
      isNaN(box.nettWeight) ||
      box.nettWeight.toString().split('.')[1]?.length > 4
    )
  ) {
    Swal.fire({
      icon: 'error',
      title: 'Please complete all required fields',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: 'top-end',
      iconColor: 'red',
      toast: true,
    });
    return;
  }


  // Fetch all GR details to check if the GR number already exists
  let existingGR = null;
  try {
    const existingGRResponse = await axios.get(`http://10.87.0.33:8082/api/GRDetails`);
    const existingGRData = existingGRResponse.data.result;

    // Check if GR number exists in the response
    existingGR = existingGRData.find((gr: any) => gr.grnumber === addFormData.grnumber);
  } catch (error) {
    console.error('Error fetching existing GR details:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error fetching GR details',
      showConfirmButton: true,
    });
    return;
  }

  // Check if the lotnumber has changed or not
  const lotNumberHasChanged = existingGR && addFormData.lotnumber !== existingGR.lotnumber;

  // Call checkLotNumberExists if the lotnumber has changed
  if (lotNumberHasChanged) {
    await checkLotNumberExists(); // Check the lotnumber only if it has changed
  }

  const confirmation = await Swal.fire({
    title: 'Confirmation',
    text: 'Are you sure you want to save this data?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, save it!',
  });

  if (confirmation.isConfirmed) {
    const payload: Payload = {
      grnumber: String(addFormData.grnumber),
      productcode: String(addFormData.productcode),
      date: String(addFormData.date),
      resourcecode: String(addFormData.resourcecode),
      shift: String(addFormData.shift),
      vendorname: String(addFormData.vendorname),
      vendorcode: String(addFormData.vendorcode),
      ponumber: String(addFormData.ponumber),
      lotnumber: String(addFormData.lotnumber),
      noofBoxes: parseFloat(addFormData.noofBoxes),
      nett: addFormData.nett,
      gross: addFormData.gross,
      discrepencyWeight: addFormData.discrepencyWeight,
      uom: String(addFormData.uom),
      location: String(addFormData.location),
      qcrequired: Boolean(addFormData.qcrequired),
      qualityCheckList: [{
        jobId: String(addFormData.grnumber),
        resourceCode: String(addFormData.resourcecode),
        shift: String(addFormData.shift),
        qcPassed: ''
      }],
      listBoxesList: addFormData.listBoxesList.map(box => ({
        jobId: String(addFormData.grnumber),
        subLotNumber: String(box.subLotNumber), // Keep sub-lot number unchanged unless lotnumber has changed
        nettWeight: box.nettWeight || 0, // Direct assignment
        grossWeight: box.grossWeight || 0, // Direct assignment
      })),
      subLocList: [
        {
          name: addFormData.selectedSubLocation, // Only the selected sublocation is included in the array
        }
      ]
    };

    try {
      const response = await axios.post('http://10.87.0.33:8082/api/GRDetails/SaveGRDetails', payload);
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
        });
        isSave.value = true;

        // If saved successfully, you can check the lot number again if needed
        if (lotNumberHasChanged) {
          await checkLotNumberExists();
        }
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
      Swal.fire({
        icon: 'error',
        title: 'Error saving data',
        showConfirmButton: true,
      });
    }
  }
};



// Watch the noofBoxes field and update the listBoxesList accordingly
// Watch the noofBoxes field and update the listBoxesList accordingly
watch(
  () => addFormData.noofBoxes,
  (newValue) => {
    const noofBoxes = parseInt(newValue, 10);
    if (!isNaN(noofBoxes) && noofBoxes > 0) {
      const grnumberWithoutDashes = addFormData.grnumber.replace(/-/g, '');
      const currentDate = new Date();
      const yy = String(currentDate.getFullYear()).slice(-2);
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const dateStr = `${yy}${mm}${dd}`;

      const newListBoxesList = [];
      for (let i = 0; i < noofBoxes; i++) {
        newListBoxesList.push({
          jobId: addFormData.grnumber,
          subLotNumber: `${grnumberWithoutDashes}${dateStr}-${i + 1}`,
          nettWeight: 0,
          grossWeight: 0,
        });
      }
      addFormData.listBoxesList = newListBoxesList;
    } else {
      addFormData.listBoxesList = [];
    }
  }
);

// Watch the listBoxesList field and update the nett and gross accordingly
// Watch for changes in the listBoxesList for addFormData and update nett and gross
watch(
  () => addFormData.listBoxesList,
  (newList) => {
    const nettSum = newList.reduce((sum, box) => sum + (box.nettWeight || 0), 0);
    const grossSum = newList.reduce((sum, box) => sum + (box.grossWeight || 0), 0);
    addFormData.nett = nettSum;
    addFormData.gross = parseFloat(grossSum.toFixed(4)); // Ensure the sum is rounded to four decimal places
  },
  { deep: true }
);

watch(
  () => editFormData.listBoxesList,
  (newList) => {
    const nettSum = newList.reduce((sum, box) => sum + (box.nettWeight || 0), 0);
    const grossSum = newList.reduce((sum, box) => sum + (box.grossWeight || 0), 0);
    editFormData.nett = nettSum;
    editFormData.gross = parseFloat(grossSum.toFixed(4)); // Ensure the sum is rounded to four decimal places
  },
  { deep: true }
);


// Round to four decimal places and assign as a number
watch(() => editFormData.gross, (newGross) => {
  if (isNumeric(newGross)) {
    // Ensure the number has no more than 4 decimal places
    const roundedGross = parseFloat(newGross.toFixed(4));

    // Check if the original number has more than 4 decimal places
    const decimalPart = (newGross.toString().split('.')[1] || '').length;

    if (decimalPart <= 4) {
      editFormData.gross = roundedGross;
    } else {

    }
  }
});

const updateNettAndGross = () => {
  const nettSum = editFormData.listBoxesList.reduce((sum, box) => sum + (box.nettWeight || 0), 0);
  const grossSum = editFormData.listBoxesList.reduce((sum, box) => sum + (box.grossWeight || 0), 0);

  // Round both sums to 4 decimal places and assign them
  editFormData.nett = parseFloat(nettSum.toFixed(4));
  editFormData.gross = parseFloat(grossSum.toFixed(4));
};



// Function to generate Sub Lot Number
const generateSubLotNumber = (lotnumber: string, index: number) => {
  return `${lotnumber}-${index + 1}`;
};

// Updating SubLotNumbers for addFormData
const updateSubLotNumbers = (startNumber: any) => {
  addFormData.listBoxesList.forEach((box, index) => {
    const subLotNumber = startNumber + index;
    box.subLotNumber = `${addFormData.lotnumber}-${subLotNumber}`;
  });
};

// Updating SubLotNumbers for editFormData
const updateEditSubLotNumbers = (startNumber: any) => {
  editFormData.listBoxesList.forEach((box, index) => {
    const subLotNumber = startNumber + index;
    box.subLotNumber = `${editFormData.lotnumber}-${subLotNumber}`;
  });
};

// Check if lotnumber exists for addFormData
// This function checks if the LotNumber exists based on the GRDetails API
const checkLotNumberExists = async () => {
  try {
    // API call to check the subLotNumber for the given lotnumber in addFormData
    const response = await axios.get(`http://10.87.0.33:8082/api/GRDetails/GetSubLotNumber/${addFormData.lotnumber}`);
    const responseText = response.data;

    if (responseText === 'SubLotNumber not exists.') {
      // Start subLotNumbers from 1 if no sub-lot exists
      updateSubLotNumbers(1);
    } else {
      const lastSubLot = responseText.split('-').pop();  // Get the last sub-lot number
      const nextSubLotNumber = parseInt(lastSubLot, 10); // Convert to integer

      if (!isNaN(nextSubLotNumber)) {
        // Update sub-lot numbers based on the last sub-lot found
        updateSubLotNumbers((nextSubLotNumber + 1) - 1);
      } else {
        updateSubLotNumbers(1);  // In case parsing fails, start from 1
      }
    }
  } catch (error) {
  }
};

// This function will keep checking if the GR number exists
const checkGRExists = async () => {
  try {
    // Make a request to get all GR details
    const response = await axios.get(`http://10.87.0.33:8082/api/GRDetails`);
    const allGRDetails = response.data.result;

    // Check if the current GR number exists in the list
    const existingGR = allGRDetails.find((gr: any) => gr.grnumber === addFormData.grnumber);

    if (existingGR) {
      // If the GR number exists and the lot number matches
      if (existingGR.lotnumber === addFormData.lotnumber) {
        return; // Exit the function since the lot number is already registered
      }
    } else {
      // GR number doesn't exist, so check if the lotnumber exists or start from 1
      await checkLotNumberExists(); // Check and update sub-lot numbers
    }

    // Keep retrying every 5 seconds if GRNumber doesn't exist
    setTimeout(checkGRExists, 1000); // Retry after 5 seconds
  } catch (error) {
    console.error('Error checking GR number:', error);
    // Retry on error after a delay
    setTimeout(checkGRExists, 1000);
  }
};

// Start the continuous check when new GR is created
checkGRExists();


// Check if lotnumber exists for editFormData
// Check if lotnumber exists for editFormData
const checkEditLotNumberExists = async () => {
  try {
    const response = await axios.get(`http://10.87.0.33:8082/api/GRDetails/GetSubLotNumber/${editFormData.lotnumber}`);
    const responseText = response.data;

    if (responseText === 'SubLotNumber not exists.') {
      updateEditSubLotNumbers(1); // Start from 1
    } else {
      const lastSubLot = responseText.split('-').pop();
      const nextSubLotNumber = parseInt(lastSubLot, 10);

      if (!isNaN(nextSubLotNumber)) {
        updateEditSubLotNumbers((nextSubLotNumber + 1) - 1);
      } else {
        updateEditSubLotNumbers(1);
      }
    }
  } catch (error) {

  }
};


// Watch for changes to addFormData.lotnumber
watch(
  () => addFormData.lotnumber,
  async (newLotNumber) => {
    if (newLotNumber) {
      await checkLotNumberExists(); // Call the API when lotnumber changes
    }
  }
);

// Watch for changes to editFormData.lotnumber
watch(
  () => editFormData.lotnumber,
  (newLotNumber) => {
    // Check if the new lot number is different from the fetched lot number
    if (newLotNumber && newLotNumber !== fetchedLotNumber) {
      checkEditLotNumberExists();  // Call to regenerate sub-lot numbers if the lot number is different
    }
    // If the new lot number is the same as the fetched one, restore the original sub-lot numbers
    else if (newLotNumber === fetchedLotNumber) {
      editFormData.listBoxesList = [...fetchedListBoxes];  // Restore the original fetched sub-lot numbers
    }
  }
);


watch(
  () => addFormData.lotnumber,
  (newLotNumber) => {
    if (newLotNumber && addFormData.listBoxesList.length > 0) {
      // Map over the listBoxesList and update subLotNumber immutably
      addFormData.listBoxesList = addFormData.listBoxesList.map((box, index) => ({
        ...box,  // Spread the original box object
        subLotNumber: generateSubLotNumber(newLotNumber, index)  // Generate new subLotNumber based on lotnumber and index
      }));
    }
  }
);

watch(
  () => editFormData.lotnumber,
  (newLotNumber) => {
    if (newLotNumber && editFormData.listBoxesList.length > 0) {
      // Only generate sub-lot numbers if they don't already exist
      editFormData.listBoxesList = editFormData.listBoxesList.map((box, index) => ({
        ...box,  // Spread the original box object
        subLotNumber: box.subLotNumber || generateSubLotNumber(newLotNumber, index)  // Generate new sub-lot number only if missing
      }));
    }
  }
);


// Watching the number of boxes and creating new sub-lot numbers accordingly
watch(
  () => addFormData.noofBoxes,
  (newValue) => {
    const noofBoxes = parseInt(newValue, 10);
    if (!isNaN(noofBoxes) && noofBoxes > 0) {
      const newListBoxesList = Array.from({ length: noofBoxes }, (_, index) => ({
        jobId: addFormData.grnumber,
        subLotNumber: generateSubLotNumber(addFormData.lotnumber, index),
        nettWeight: 0,
        grossWeight: 0,
      }));
      addFormData.listBoxesList = newListBoxesList;
    } else {
      addFormData.listBoxesList = [];
    }
  }
);

const updateListBoxesList = (noofBoxes: any) => {
  const noOfBoxes = parseInt(noofBoxes, 10);
  const currentLength = editFormData.listBoxesList.length;

  if (!isNaN(noOfBoxes) && noOfBoxes > 0) {
    if (noOfBoxes > currentLength) {
      editFormData.listBoxesList = [
        ...editFormData.listBoxesList,
        ...Array.from({ length: noOfBoxes - currentLength }, (_, index) => ({
          jobId: editFormData.grnumber,
          subLotNumber: editFormData.lotnumber && currentLength + index < editFormData.listBoxesList.length
            ? editFormData.listBoxesList[currentLength + index].subLotNumber  // Retain existing sub-lot numbers if they exist
            : generateSubLotNumber(editFormData.lotnumber, currentLength + index),  // Generate new sub-lot number if needed
          nettWeight: 0,
          grossWeight: 0,
        }))
      ];
    } else if (noOfBoxes < currentLength) {
      editFormData.listBoxesList = editFormData.listBoxesList.slice(0, noOfBoxes);
    }
    updateNettAndGross(); // Call to update nett and gross weights
  } else {
    editFormData.listBoxesList = [];
  }
};





// Method to handle the Submit button click event
const submitRole = async () => {  // Mark the function as async
  if (validateForm()) {
    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to submit this data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!',
    }).then(async result => { // Mark the callback as async as well
      if (result.isConfirmed) {
        // Populate listBoxesList based on the number of boxes
        const payload: Payload = {
          grnumber: String(addFormData.grnumber),
          productcode: String(addFormData.productcode),
          date: String(addFormData.date),
          resourcecode: String(addFormData.resourcecode),
          shift: String(addFormData.shift),
          vendorname: String(addFormData.vendorname),
          vendorcode: String(addFormData.vendorcode),
          ponumber: String(addFormData.ponumber),
          lotnumber: String(addFormData.lotnumber),
          noofBoxes: parseFloat(addFormData.noofBoxes),
          nett: addFormData.nett,
          gross: addFormData.gross,
          discrepencyWeight: addFormData.discrepencyWeight,
          uom: String(addFormData.uom),
          location: String(addFormData.location),
          qcrequired: Boolean(addFormData.qcrequired),
          qualityCheckList: [{
            jobId: String(addFormData.grnumber),
            resourceCode: String(addFormData.resourcecode),
            shift: String(addFormData.shift),
            qcPassed: ''
          }],
          listBoxesList: addFormData.listBoxesList.map(box => ({
            jobId: String(addFormData.grnumber),
            subLotNumber: String(box.subLotNumber),
            nettWeight: box.nettWeight || 0, // Direct assignment
            grossWeight: box.grossWeight || 0, // Direct assignment
          })),
          subLocList: [
            {
              name: addFormData.selectedSubLocation, // Only the selected sublocation is included in the array
            }
          ]
        };

        console.log("Payload:", JSON.stringify(payload, null, 2)); // Add console log for payload

        try {
          const response = await axios.post('http://10.87.0.33:8082/api/GRDetails/SubmitGRDetails', payload); // await axios call
          console.log("Response:", response); // Add console log for response
          if (response.status === 200 && response.data.result) {
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
            });
            handleClose();
            await checkLotNumberExists();  // Await the checkLotNumberExists call
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Unexpected response',
              text: 'The data was not submitted as expected.',
              showConfirmButton: true,
            });
          }
        } catch (error) {
          handleError(error, 'Error submitting data');
        }
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
    } else if (Array.isArray(formData[key])) {
      formData[key] = []; // Reset arrays to empty arrays
    } else {
      formData[key] = '';
    }
  });
  formData.date = formatDate(new Date());
  formData.status = '';
  addFormData.productcode = '';
};




const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
  if (value) {
    fetchProductCodes();
  } else {
    fetchProductCodes();
  }
};

const EditSlideOver = ref(false);

const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
  if (!value) {
    // Reset sublocation when closing
    editFormData.subLocList = [];
    editFormData.selectedSubLocation = '';
    selectedEditLocation.value = ''; // Reset selected product code
    editLocationSearchQuery.value = ''; // Reset the search input
    selectedEditSubLocation.value = ''; // Reset selected product code
    editSubLocationSearchQuery.value = ''; // Reset the search input
    selectedEditVendorCode.value = ''; // Reset selected product code
    editVendorCodeSearchQuery.value = ''; // Reset the search input
    editVendorNameSearchQuery.value = ''; // Reset selected product code
    selectedEditVendorName.value = ''; // Reset the search input


    // Optionally refetch sublocations when closing
    if (editFormData.location) {
      fetchSubLocations(editFormData.location, 'edit');
    }
  } else {
    // When opening, refetch sublocations
    if (editFormData.location) {
      fetchSubLocations(editFormData.location, 'edit');
    }
  }
};


const handleAddClick = async (event: MouseEvent) => {
  event.preventDefault();
  loading.value = true; // Start loading animation

  try {
    // Perform the API call to save temporary GR No
    const response = await axios.get('http://10.87.0.33:8082/api/GRDetails/SavetempGRNo');

    // Check the API response for success or error
    if (response.status === 200 && response.data) {
      console.log('Temporary GR No saved successfully:', response.data);

      // Open the Add Slideover after successful API call
      setAddSlideover(true);
    } else {
      console.error('Failed to save temporary GR No:', response.data);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save Temporary GR No',
        text: 'Please try again later.',
        confirmButtonColor: '#d33',
      });
    }
    fetchGRDetails();
  } catch (error) {
    console.error('Error during API call to save temporary GR No:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while saving temporary GR No. Please try again.',
      confirmButtonColor: '#d33',
    });
  } finally {
    loading.value = false; // End loading animation
  }
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
    <h2 class="mr-auto text-lg font-medium">Good Receiving</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreateGoodsReceiving">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Good Receiving
      </Button>

    </div>
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
            <label class="flex-none w-full xl:w-auto xl:flex-initial">GR Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.grnumber" type="text" class="mt-2 w-full"
                placeholder="Search GR Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="GRNumber">GR Number</Button>
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
                <option selected>Draft</option>
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
                <label class="flex-none w-12 xl:w-auto xl:flex-initial">End Date</label>
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
  <!-- END: HTML Table Data -->
  <Dialog
:staticBackdrop="true" size="xl" :open="addSlideover" @close="handleClose">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Add Good Receiving
        </h2>
        <div>
          <FormLabel htmlFor="regular-form-5">Weight Machine</FormLabel>
          <FormSelect v-model="addFormData.weightmachine" class="sm:mr-2" aria-label="Default select example"
            :class="{ 'border-red-500': formSubmitted && !addFormData.weightmachines }"
            :disabled="addFormData.isWeightMachineDisabled">
            <option disabled value="">Select a Weight Machine Option</option>
            <option v-for="weightMachine in addFormData.weightmachines" :key="weightMachine" :value="weightMachine">
              {{ weightMachine }}
            </option>
          </FormSelect>
        </div>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent>
          <div>
            <FormLabel htmlFor="regular-form-gr">GR Number</FormLabel>
            <FormInput v-model="addFormData.grnumber" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5 relative">
            <FormLabel htmlFor="regular-form-5">Powder Number</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>

            <!-- Custom dropdown with search -->
            <div class="relative">
              <div
                :class="['border rounded', { 'border-red-500': (formSubmittedSave || formSubmitted) && !addFormData.productcode, 'border-gray-300': !((formSubmittedSave || formSubmitted) && !addFormData.productcode) }]">
                <div class="relative">
                  <!-- Dropdown trigger - clicking this opens the dropdown -->
                  <div @click="toggleDropdown" class="cursor-pointer p-2">
                    {{ selectedProductCode || 'Select a Powder Number Option' }}
                  </div>
                  <div v-if="isDropdownOpen" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                    <!-- Searchable input inside the dropdown -->
                    <input type="text" v-model="searchQuery" placeholder="Search Powder Number"
                      class="border-b border-gray-300 p-2 w-full" />
                    <!-- Filtered options -->
                    <ul class="max-h-40 overflow-y-auto">
                      <li v-for="productcode in filteredProductCodes" :key="productcode"
                        @click="selectProductCode(productcode)" class="cursor-pointer p-2 hover:bg-gray-100">
                        {{ productcode }}
                      </li>
                      <li v-if="filteredProductCodes.length === 0" class="p-2 text-gray-500">No results found</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <span v-if="(formSubmittedSave || formSubmitted) && !addFormData.productcode" class="text-red-500">
              Powder Number is required!
            </span>
          </div>


          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.resourcecode }" id="regular-form-1"
              v-model="addFormData.resourcecode" type="text" placeholder="Employee ID" />
            <span v-if="formSubmitted && !addFormData.resourcecode" class="text-red-500">Employee ID is
              required!</span>
          </div>
          <div class="relative  shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <!-- Table Header for Main Location and Sub Location -->
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
                <!-- Main Location Dropdown -->
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="relative">
                      <FormLabel htmlFor="regular-form-5" class="sr-only">Main Location</FormLabel>
                      <div
                        :class="['border rounded', { 'border-red-500': formSubmitted && !addFormData.location, 'border-gray-300': !(formSubmitted && !addFormData.location) }]">
                        <div @click="toggleLocationDropdown" class="cursor-pointer p-2">
                          {{ selectedLocation || 'Select a Location Option' }}
                        </div>
                        <div v-if="isLocationDropdownOpen"
                          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                          <input type="text" v-model="locationSearchQuery" placeholder="Search Location"
                            class="border-b border-gray-300 p-2 w-full" />
                          <ul class="max-h-40 overflow-y-auto">
                            <li v-for="location in filteredLocations" :key="location" @click="selectLocation(location)"
                              class="cursor-pointer p-2 hover:bg-gray-100">
                              {{ location }}
                            </li>
                            <li v-if="filteredLocations.length === 0" class="p-2 text-gray-500">No results found</li>
                          </ul>
                        </div>
                      </div>
                      <span v-if="formSubmitted && !addFormData.location" class="text-red-500">Main Location is
                        required!</span>
                    </div>
                  </td>

                  <!-- Sub Location Dropdown -->
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div v-if="addFormData.locations.length > 0" class="relative">
                      <FormLabel htmlFor="subloc-form-5" class="sr-only">Sub Location</FormLabel>
                      <div
                        :class="['border rounded', { 'border-gray-300': addFormData.subLocList.length > 0, 'border-gray-200': addFormData.subLocList.length === 0 }]">
                        <div @click="toggleSubLocationDropdown" class="cursor-pointer p-2"
                          :class="{ 'cursor-not-allowed': addFormData.subLocList.length === 0 }"
                          :style="{ opacity: addFormData.subLocList.length === 0 ? 0.6 : 1 }"
                          :disabled="addFormData.subLocList.length === 0">
                          {{ selectedSubLocation || 'Select a Sub Location' }}
                        </div>
                        <div v-if="isSubLocationDropdownOpen && addFormData.subLocList.length > 0"
                          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                          <input type="text" v-model="subLocationSearchQuery" placeholder="Search Sub Location"
                            class="border-b border-gray-300 p-2 w-full" />
                          <ul class="max-h-40 overflow-y-auto">
                            <li v-for="subloc in filteredSubLocations" :key="subloc.name"
                              @click="selectSubLocation(subloc.name)" class="cursor-pointer p-2 hover:bg-gray-100">
                              {{ subloc.name }}
                            </li>
                            <li v-if="filteredSubLocations.length === 0" class="p-2 text-gray-500">No results found</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>



          <!-- <div class="mt-5" v-if="addFormData.locations.length > 0">
  sublocation with validation
    <FormLabel htmlFor="subloc-form-5">Sub Location</FormLabel>
    <FormSelect
      v-model="addFormData.selectedSubLocation"
      :disabled="addFormData.subLocList.length === 0"
      class="sm:mr-2 mt-2"
      aria-label="Select a sub location"
      :class="{ 'border-red-500': formSubmitted && !addFormData.selectedSubLocation && addFormData.subLocList.length > 0 }"
    >
      <option disabled value="">Select a Sub Location</option>
      <option v-for="subloc in addFormData.subLocList" :key="subloc.name" :value="subloc.name">
        {{ subloc.name }}
      </option>
    </FormSelect>
    <span
      v-if="formSubmitted && !addFormData.selectedSubLocation && addFormData.subLocList.length > 0"
      class="text-red-500"
    >
      Sub Location is required!
    </span>
  </div> -->

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="addFormData.shift" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in addFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->
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
                    <div class="relative">
                      <div class="border border-gray-300 rounded">
                        <div class="relative">
                          <!-- Dropdown trigger - clicking this opens the dropdown -->
                          <div @click="toggleVendorNameDropdown" class="cursor-pointer p-2">
                            {{ selectedVendorName || 'Select a Vendor Name Option' }}
                          </div>
                          <div v-if="isVendorNameDropdownOpen"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <!-- Searchable input inside the dropdown -->
                            <input type="text" v-model="vendorNameSearchQuery" placeholder="Search Vendor Name"
                              class="border-b border-gray-300 p-2 w-full" />
                            <!-- Filtered options -->
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="name in filteredVendorNames" :key="name" @click="selectVendorName(name)"
                                class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ name }}
                              </li>
                              <li v-if="filteredVendorNames.length === 0" class="p-2 text-gray-500">No results found
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="relative">
                      <div class="border border-gray-300 rounded">
                        <div class="relative">
                          <!-- Dropdown trigger - clicking this opens the dropdown -->
                          <div @click="toggleVendorCodeDropdown" class="cursor-pointer p-2">
                            {{ selectedVendorCode || 'Select a Vendor Code Option' }}
                          </div>
                          <div v-if="isVendorCodeDropdownOpen"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <!-- Searchable input inside the dropdown -->
                            <input type="text" v-model="vendorCodeSearchQuery" placeholder="Search Vendor Code"
                              class="border-b border-gray-300 p-2 w-full" />
                            <!-- Filtered options -->
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="code in filteredVendorCodes" :key="code" @click="selectVendorCode(code)"
                                class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ code }}
                              </li>
                              <li v-if="filteredVendorCodes.length === 0" class="p-2 text-gray-500">No results found
                              </li>
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
            <FormLabel htmlFor="regular-form-1">PO Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.ponumber }" id="regular-form-1"
              v-model="addFormData.ponumber" type="text" placeholder="PO Number" />
            <span v-if="formSubmitted && !addFormData.ponumber" class="text-red-500">PO Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Lot Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.lotnumber }" id="regular-form-1"
              v-model="addFormData.lotnumber" type="text" placeholder="Lot Number" />
            <span v-if="formSubmitted && !addFormData.lotnumber" class="text-red-500">Lot Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">No. of Boxes</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!addFormData.noofBoxes || !isNumeric(addFormData.noofBoxes)) }"
              id="regular-form-8" v-model="addFormData.noofBoxes" type="number" placeholder="No. of Boxes" />
            <span v-if="formSubmitted && (!addFormData.noofBoxes || !isNumeric(addFormData.noofBoxes))"
              class="text-red-500">{{
                !addFormData.noofBoxes ? 'No. of Boxes is required!' : 'No. of Boxes must be a valid number!'
              }}</span>
          </div>
          <!-- <div class="mt-5" v-if="isFormSaved">
            <FormLabel htmlFor="regular-form-8">Nett</FormLabel><span class="text-red-500 pl-1 text-md"
              v-if="isFormSaved">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!addFormData.nett || !isNumeric(addFormData.nett)) }"
              id="regular-form-8" v-model="addFormData.nett" type="number" placeholder="Nett" step="any" />
            <span v-if="formSubmitted && (!addFormData.nett || !isNumeric(addFormData.nett))" class="text-red-500">{{
              !addFormData.nett ? 'Nett is required!' : 'Nett must be a valid number!'
            }}</span>
          </div> -->
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
                    Discrepancy Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Weight</FormLabel>
                    <FormInput
                      :class="{ 'border-red-500': (formSubmitted && (!addFormData.gross || !isNumeric(addFormData.gross))) || addFormData.gross.toString().split('.')[1]?.length > 4 }"
                      id="regular-form-8" v-model="addFormData.gross" type="number" placeholder="Weight" step="any" />
                    <span v-if="formSubmitted && (!addFormData.gross || !isNumeric(addFormData.gross))"
                      class="text-red-500">
                      {{ !addFormData.gross ? 'Weight is required!' : 'Weight must be a valid number!' }}
                    </span>
                    <span v-if="!isNaN(addFormData.gross) && addFormData.gross.toString().split('.')[1]?.length > 4"
                      class="text-red-500">
                      Weight must have at most 4 decimal places!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="discrepencyWeight" class="sr-only">Discrepancy Weight</FormLabel>
                    <FormInput
                      :class="{ 'border-red-500': (isNaN(addFormData.discrepencyWeight) || addFormData.discrepencyWeight.toString().split('.')[1]?.length > 4) }"
                      id="discrepencyWeight" v-model="addFormData.discrepencyWeight" type="text"
                      placeholder="Discrepancy Weight" />
                    <span v-if="isNaN(addFormData.discrepencyWeight)" class="text-red-500">
                      Discrepancy Weight must be a valid number!
                    </span>
                    <span
                      v-if="!isNaN(addFormData.discrepencyWeight) && addFormData.discrepencyWeight.toString().split('.')[1]?.length > 4"
                      class="text-red-500">
                      Discrepancy Weight must have at most 4 decimal places!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5">
            <label for="vendor-dropdown">UOM</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.uom">
              <option disabled value="">Select a UOM Option</option>
              <option>KG</option>
              <option>Pieces</option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="qcrequired" class="mr-2  ml-[-2]">
                Quality Check Required
              </FormCheck.Label>
              <FormCheck.Input id="qcrequired" v-model="addFormData.qcrequired" type="checkbox" disabled />
            </FormCheck>
          </div>
          <div class="mt-5" v-if="addFormData.listBoxesList.length > 0">
            <h3 class="mb-2 mt-8 text-lg font-medium leading-none">Box Details</h3>
            <hr />
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto"></th>
                  <th class="py-2 px-4 border-b text-center w-auto">Sub Lot Number</th>
                  <th class="py-2 px-4 border-b text-center">Gross Weight</th>
                  <th class="py-2 px-4 border-b text-center">Nett Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(box, index) in addFormData.listBoxesList" :key="index" class="hover:bg-gray-100">
                  <td class="px-4 py-2 text-center border-b">
                    <FormCheck>
                      <FormCheck.Input type="checkbox" :checked="selectedBoxIndex === index"
                        @change="selectedBoxIndex = index" class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="py-2 px-4 border-b text-center">
                    <FormInput v-model="box.subLotNumber" type="text" :id="`subLotInput-${index}`"
                      class="form-input mt-1 block w-full" />
                  </td>
                  <td class="py-2 px-4 border-b w-[30%]">
                    <div class="flex items-center space-x-2">
                      <FormInput v-model.number="box.grossWeight" type="number" class="form-input mt-1 block w-full"
                        step="any"
                        :class="{ 'border-red-500': box.grossWeight?.toString().split('.')[1]?.length > 4 }" />

                      <button type="button" @click="AddsyncWeight(index)"
                        class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-2 text-white rounded">
                        <i class="px-1 fa-solid fa-rotate"></i>
                      </button>
                    </div>
                    <span v-if="box.grossWeight?.toString().split('.')[1]?.length > 4" class="text-red-500">
                      Gross Weight must have at most 4 decimal places!
                    </span>
                  </td>
                  <td class="py-2 px-4 border-b w-[20%]">
                    <FormInput v-model.number="box.nettWeight" type="number" class="form-input mt-1 block w-full"
                      step="any" :class="{ 'border-red-500': box.nettWeight?.toString().split('.')[1]?.length > 4 }" />
                    <span v-if="box.nettWeight?.toString().split('.')[1]?.length > 4" class="text-red-500">
                      Nett Weight must have at most 4 decimal places!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div class="mt-5 flex justify-between">
            <Button @click="saveRole" variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
              Save
            </Button>
            <Button v-if="isSave" @click="submitRole" variant="primary" class="w-[100%] ml-2 mt-10 shadow-md">
              Submit
            </Button>
          </div>
        </form>
      </Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline-secondary" type="button" @click="handleClose" class="w-20 mr-1">
          Cancel
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>
  <Dialog
:staticBackdrop="true" size="xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Good Receiving
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
        <form class="validate-form" @submit.prevent>
          <div>
            <FormLabel htmlFor="regular-form-gr">GR Number</FormLabel>
            <FormInput v-model="editFormData.grnumber" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Powder Number</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.productcode }" id="regular-form-1"
              v-model="editFormData.productcode" type="text" placeholder="Powder Number" disabled />
            <span v-if="formSubmitted && !editFormData.productcode" class="text-red-500">Powder Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.resourcecode }" id="regular-form-1"
              v-model="editFormData.resourcecode" type="text" placeholder="Employee ID" />
            <span v-if="formSubmitted && !editFormData.resourcecode" class="text-red-500">Employee ID is
              required!</span>
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



          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="editFormData.shift" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->
          <div class="relative  shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <!-- Header Row -->
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
                <!-- Vendor Name and Vendor Code Dropdown Row -->
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="edit-vendorname-form-5" class="sr-only">Vendor Name</FormLabel>
                    <!-- Vendor Name Dropdown -->
                    <div class="relative">
                      <div class="border border-gray-300 rounded">
                        <div class="relative">
                          <div @click="toggleEditVendorNameDropdown" class="cursor-pointer p-2">
                            {{ selectedEditVendorName || 'Select a Vendor Name Option' }}
                          </div>
                          <div v-if="isEditVendorNameDropdownOpen"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <!-- Searchable input inside the dropdown -->
                            <input type="text" v-model="editVendorNameSearchQuery" placeholder="Search Vendor Name"
                              class="border-b border-gray-300 p-2 w-full" />
                            <!-- Filtered options -->
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="name in filteredEditVendorNames" :key="name"
                                @click="selectEditVendorName(name)" class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ name }}
                              </li>
                              <li v-if="filteredEditVendorNames.length === 0" class="p-2 text-gray-500">No results found
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="edit-vendorcode-form-5" class="sr-only">Vendor Code</FormLabel>
                    <!-- Vendor Code Dropdown -->
                    <div class="relative">
                      <div class="border border-gray-300 rounded">
                        <div class="relative">
                          <div @click="toggleEditVendorCodeDropdown" class="cursor-pointer p-2">
                            {{ selectedEditVendorCode || 'Select a Vendor Code Option' }}
                          </div>
                          <div v-if="isEditVendorCodeDropdownOpen"
                            class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                            <!-- Searchable input inside the dropdown -->
                            <input type="text" v-model="editVendorCodeSearchQuery" placeholder="Search Vendor Code"
                              class="border-b border-gray-300 p-2 w-full" />
                            <!-- Filtered options -->
                            <ul class="max-h-40 overflow-y-auto">
                              <li v-for="code in filteredEditVendorCodes" :key="code"
                                @click="selectEditVendorCode(code)" class="cursor-pointer p-2 hover:bg-gray-100">
                                {{ code }}
                              </li>
                              <li v-if="filteredEditVendorCodes.length === 0" class="p-2 text-gray-500">No results found
                              </li>
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
            <FormLabel htmlFor="regular-form-1">PO Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !editFormData.ponumber }" id="regular-form-1"
              v-model="editFormData.ponumber" type="text" placeholder="PO Number" />
            <span v-if="formSubmitted && !editFormData.ponumber" class="text-red-500">PO Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Lot Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !editFormData.lotnumber }" id="regular-form-1"
              v-model="editFormData.lotnumber" type="text" placeholder="Lot Number" />
            <span v-if="formSubmitted && !editFormData.lotnumber" class="text-red-500">Lot Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">No. of Boxes</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': (!editFormData.noofBoxes || !isNumeric(editFormData.noofBoxes)) }"
              id="regular-form-8" v-model="editFormData.noofBoxes" type="number" placeholder="No. of Boxes"
              @input="updateListBoxesList(editFormData.noofBoxes)" />
            <span v-if="formSubmitted && (!editFormData.noofBoxes || !isNumeric(editFormData.noofBoxes))"
              class="text-red-500">{{
                !editFormData.noofBoxes ? 'No. of Boxes is required!' : 'No. of Boxes must be a valid number!'
              }}</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Nett</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': (!editFormData.nett || !isNumeric(editFormData.nett)) }"
              id="regular-form-8" v-model="editFormData.nett" type="number" placeholder="Nett" step="any" />
            <span v-if="formSubmitted && (!editFormData.nett || !isNumeric(editFormData.nett))" class="text-red-500">{{
              !editFormData.nett ? 'Nett is required!' : 'Nett must be a valid number!'
            }}</span>
          </div> -->
          <div class="relative  shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Discrepancy Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Weight</FormLabel>
                    <FormInput :class="{
                      'border-red-500': ((!editFormData.gross || !isNumeric(editFormData.gross))) || editFormData.gross.toString().split('.')[1]?.length > 4
                    }" id="regular-form-8" v-model="editFormData.gross" type="number" placeholder="Weight" step="any" />
                    <span v-if="(!editFormData.gross || !isNumeric(editFormData.gross))" class="text-red-500">
                      {{ !editFormData.gross ? 'Weight is required!' : 'Weight must be a valid number!' }}
                    </span>
                    <span v-if="!isNaN(editFormData.gross) && editFormData.gross.toString().split('.')[1]?.length > 4"
                      class="text-red-500">
                      Weight must have at most 4 decimal places!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="discrepencyWeight" class="sr-only">Discrepancy Weight</FormLabel>
                    <FormInput id="discrepencyWeight" v-model="editFormData.discrepencyWeight" type="text"
                      placeholder="Discrepancy Weight" :class="{
                        'border-red-500': editFormData.discrepencyWeight !== null && editFormData.discrepencyWeight !== undefined &&
                          (isNaN(editFormData.discrepencyWeight) || editFormData.discrepencyWeight.toString().split('.')[1]?.length > 4)
                      }" />
                    <span
                      v-if="editFormData.discrepencyWeight !== null && editFormData.discrepencyWeight !== undefined && isNaN(editFormData.discrepencyWeight)"
                      class="text-red-500">
                      Discrepancy Weight must be a valid number!
                    </span>
                    <span
                      v-if="editFormData.discrepencyWeight !== null && editFormData.discrepencyWeight !== undefined && !isNaN(editFormData.discrepencyWeight) && editFormData.discrepencyWeight.toString().split('.')[1]?.length > 4"
                      class="text-red-500">
                      Discrepancy Weight must have at most 4 decimal places!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div class="mt-5">
            <label for="vendor-dropdown">UOM</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="editFormData.uom">
              <option disabled value="">Select a UOM Option</option>
              <option>KG</option>
              <option>Pieces</option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="qcrequired" class="mr-2  ml-[-2]">
                Quality Check Required
              </FormCheck.Label>
              <FormCheck.Input id="qcrequired" v-model="editFormData.qcrequired" type="checkbox" disabled />
            </FormCheck>
          </div>
          <div class="mt-5" v-if="editFormData.listBoxesList.length > 0">
            <h3 class="mb-2 mt-8 text-lg font-medium leading-none">Box Details</h3>
            <hr />
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto"></th>
                  <th class="py-2 px-4 border-b text-center w-auto">Sub Lot Number</th>
                  <th class="py-2 px-4 border-b text-center">Gross Weight</th>
                  <th class="py-2 px-4 border-b text-center">Nett Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(box, index) in editFormData.listBoxesList" :key="index" class="hover:bg-gray-100">
                  <!-- Checkbox Column -->
                  <td class="px-4 py-2 text-center border-b">
                    <FormCheck>
                      <FormCheck.Input type="checkbox" :checked="selectedBoxIndex === index"
                        @change="selectedBoxIndex = index" class="mx-auto" />
                    </FormCheck>
                  </td>

                  <!-- Sub Lot Number Input Column -->
                  <td class="py-2 px-4 border-b text-center">
                    <FormInput v-model="box.subLotNumber" type="text" :id="`subLotInput-${index}`"
                      class="form-input mt-1 block w-full" />
                  </td>

                  <!-- Gross Weight Input Column -->
                  <td class="py-2 px-4 border-b w-[30%]">
                    <div class="flex items-center space-x-2">
                      <FormInput v-model.number="box.grossWeight" type="number" class="form-input mt-1 block w-full"
                        step="any"
                        :class="{ 'border-red-500': box.grossWeight?.toString().split('.')[1]?.length > 4 }" />
                      <button type="button" @click="syncWeight(index)"
                        class="bg-blue-500 hover:bg-blue-600 px-2 py-2 text-white rounded">
                        <i class="fa-solid fa-rotate"></i>
                      </button>
                    </div>
                    <span v-if="box.grossWeight?.toString().split('.')[1]?.length > 4" class="text-red-500">
                      Gross Weight must have at most 4 decimal places!
                    </span>
                  </td>

                  <!-- Nett Weight Input Column -->
                  <td class="py-2 px-4 border-b w-[20%]">
                    <FormInput v-model.number="box.nettWeight" type="number" class="form-input mt-1 block w-full"
                      step="any" :class="{ 'border-red-500': box.nettWeight?.toString().split('.')[1]?.length > 4 }" />
                    <span v-if="box.nettWeight?.toString().split('.')[1]?.length > 4" class="text-red-500">
                      Nett Weight must have at most 4 decimal places!
                    </span>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5 flex justify-between">
            <Button @click="saveupdateRole" variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
              Save
            </Button>
            <Button @click="updateRole" variant="primary" class="w-[100%] ml-2 mt-10 shadow-md">
              Submit
            </Button>
          </div>
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
          View Good Receiving
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
                      PO Number
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.ponumber }}
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
                      No. of Boxes
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.noofBoxes }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                      Discrepency Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.discrepencyWeight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                      Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.gross }}
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
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Quality Check
                    </th>
                    <td class="w-[50%] px-auto text-center ">
                      <span :class="{ 'text-red-600 ': !viewData.qcrequired, 'text-green-600': viewData.qcrequired }">
                        {{ viewData.qcrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.qcrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.qcrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
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
                        class="title px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                        Sub Lot Number
                      </th>
                      <th scope="row"
                        class="title px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
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
                    PO Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.ponumber }}
                  </td>
                </tr>

                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                    Shift
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.shift }}
                  </td>
                </tr> -->


              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">


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
                    No. of Boxes
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.noofBoxes }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Discrepency Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.discrepencyWeight }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.gross }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Quality Check
                  </th>
                  <td class="w-[50%] px-auto text-center ">
                    <span
                      :class="{ 'text-red-600 dark:text-red-500': !viewData.qcrequired, 'text-green-600 dark:text-green-500': viewData.qcrequired }">
                      {{ viewData.qcrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.qcrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.qcrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
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
                      'text-gray-600 ': !viewData.status || viewData.status === ''
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
                    class="title text-center px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
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

<style>
.cursor-not-allowed {
  cursor: not-allowed;
  /* Change cursor to not-allowed */
  opacity: 0.6;
  /* Optional: reduce opacity to make it look disabled */
}

/* CSS for print styles */
@media print {
  /* Portrait mode settings */
  body {
    width: 100%;
    font-size: 10px; /* Reduce font size for better fit */
  }

  /* Table adjustments for wrapping */
  .print-table {
    table-layout: fixed; /* Make table cells wrap */
    word-wrap: break-word;
  }

  /* Landscape mode settings */
  @media (orientation: landscape) {
    .print-table {
      table-layout: auto; /* Expand table cells */
    }
  }
}

</style>