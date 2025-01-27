<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, watchEffect } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import printJS from 'print-js';
import QRCode from 'qrcode';
import LoadingIcon from "../base-components/LoadingIcon";


interface UserAccess {
    userId: string;
    warehouse?: string[];
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
  nett?: string;
  gross?: string;
  approvedWeight?: string;
  qcrequired?: any;
  status?: string;
  rejectedWeight?: string;
}

const tableRef = ref<HTMLDivElement>();
const tableRefComplete = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const tabulatorComplete = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
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
      initialSort: [
        { column: "date", dir: "desc" }, // Sort by date in descending order
      ],
 // Add a title at the top of the print view
 printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Warehouse
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
          title: "APPROVED WEIGHT",
          minWidth: 150,
          responsive: 0,
          field: "nett",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();

            // Ensure the approvedWeight is rounded to 4 decimal places but without trailing zeros
            let approvedWeight = response.approvedWeight;

            if (!isNaN(approvedWeight)) {
              // Parse the number and remove unnecessary trailing zeros
              approvedWeight = Number(parseFloat(approvedWeight).toFixed(4));
            }

            return `<div>
      <div class="font-medium whitespace-nowrap">${approvedWeight}</div>
    </div>`;
          },
        },

        {
          title: "REJECTED WEIGHT",
          field: "rejectedWeight",
          minWidth: 150,
          responsive: 0,
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();

            // Ensure the rejectedWeight is rounded to 4 decimal places but without trailing zeros
            let rejectedWeight = response.rejectedWeight;

            if (!isNaN(rejectedWeight)) {
              // Parse the number and remove unnecessary trailing zeros
              rejectedWeight = Number(parseFloat(rejectedWeight).toFixed(4));
            }

            return `<div>
      <div class="font-medium whitespace-nowrap">${rejectedWeight}</div>
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
                case 'Pending':
                  statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:text-yellow-500';
                  break;
                case 'QC Rejected':
                  statusClass = 'bg-red-100 text-red-800 border-red-400 dark:text-red-500';
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
    maxWidth: 350,
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
                    // Conditionally render "View & Edit" link based on Edit permission
                    if (userAccess.warehouse && userAccess.warehouse.includes("Edit")) {
                        const viewEditLink = document.createElement("a");
                        viewEditLink.classList.add(
                            "flex",
                            "items-center",
                            "text-primary",
                            "text-sm"
                        );
                        viewEditLink.href = "#";
                        viewEditLink.addEventListener("click", (event) => {
                            event.preventDefault();
                            viewRole(response.productcode); // Change to productcode
                        });
                        viewEditLink.innerHTML = `<i class="fa-solid fa-file-pen mr-1"></i>View & Edit`;
                        container.appendChild(viewEditLink);
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
    title: "<span class='text-xs font-bold text-center block'>Part Number</span>",
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
    title: "<span class='text-xs font-bold text-center block'>Approved Weight</span>",
    field: "approvedWeight",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.approvedWeight}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Rejected Weight</span>",
    field: "rejectedWeight",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.rejectedWeight}</div>`;
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
const initTabulatorComplete = () => {
  if (tableRefComplete.value) {
    tabulatorComplete.value = new Tabulator(tableRefComplete.value, {
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
 // Add a title at the top of the print view
 printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Warehouse
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
          title: "APPROVED WEIGHT",
          minWidth: 150,
          responsive: 0,
          field: "nett",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();

            // Ensure the approvedWeight is rounded to 4 decimal places but without trailing zeros
            let approvedWeight = response.approvedWeight;

            if (!isNaN(approvedWeight)) {
              // Parse the number and remove unnecessary trailing zeros
              approvedWeight = Number(parseFloat(approvedWeight).toFixed(4));
            }

            return `<div>
      <div class="font-medium whitespace-nowrap">${approvedWeight}</div>
    </div>`;
          },
        },

        {
          title: "REJECTED WEIGHT",
          field: "rejectedWeight",
          minWidth: 150,
          responsive: 0,
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();

            // Ensure the rejectedWeight is rounded to 4 decimal places but without trailing zeros
            let rejectedWeight = response.rejectedWeight;

            if (!isNaN(rejectedWeight)) {
              // Parse the number and remove unnecessary trailing zeros
              rejectedWeight = Number(parseFloat(rejectedWeight).toFixed(4));
            }

            return `<div>
      <div class="font-medium whitespace-nowrap">${rejectedWeight}</div>
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
                case 'Pending':
                  statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:text-yellow-500';
                  break;
                case 'QC Rejected':
                  statusClass = 'bg-red-100 text-red-800 border-red-400 dark:text-red-500';
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
    maxWidth: 350,
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
                    // Conditionally render "View & Edit" link based on Edit permission
                    if (userAccess.warehouse && userAccess.warehouse.includes("Edit")) {
                        const viewEditLink = document.createElement("a");
                        viewEditLink.classList.add(
                            "flex",
                            "items-center",
                            "text-primary",
                            "text-sm"
                        );
                        viewEditLink.href = "#";
                        viewEditLink.addEventListener("click", (event) => {
                            event.preventDefault();
                            viewRole(response.productcode); // Change to productcode
                        });
                        viewEditLink.innerHTML = `<i class="fa-solid fa-file-pen mr-1"></i>View & Edit`;
                        container.appendChild(viewEditLink);
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
    title: "<span class='text-xs font-bold text-center block'>Part Number</span>",
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
    title: "<span class='text-xs font-bold text-center block'>Approved Weight</span>",
    field: "approvedWeight",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.approvedWeight}</div>`;
    },
  },
  {
    title: "<span class='text-xs font-bold text-center block'>Rejected Weight</span>",
    field: "rejectedWeight",
    visible: false,
    print: true,
    download: true,
    formatter(cell) {
      const response = cell.getData();
      return `<div class="text-xs font-medium text-center block break-words">${response.rejectedWeight}</div>`;
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

      return `<span class="text-xs font-medium text-center block ${textColor} break-words">${status}</span>`;
    },
  }

      ],
    });
  }

  tabulatorComplete.value?.on("renderComplete", () => {
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
      // No specific status filter, revert to default filter
      tabulator.value.clearFilter(true);
      tabulator.value.setFilter((item) => item.status !== 'Completed');
    }
  }
};


// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    productcode: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  if (tabulator.value) {
    tabulator.value.clearFilter(true);
    // Reapply default filter to exclude "Completed" items
    tabulator.value.setFilter((item) => item.status !== 'Completed');
  }
};



// Print
const onPrint = () => {
  if (tabulator.value) {
    tabulator.value.print();
  }
};

interface ConsolidatedDataItem {
  productcode: string;
  grNumber: string;
  date: string;
  approvedWeight: number;
  rejectedWeight: number;
  status: string;
}

const loading = ref<boolean>(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/GRDetails/';
const API_PRODUCT_CODE_URL = 'http://10.87.0.33:8082/api/GRDetails/GetGRDetailsbyProductCode/';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

  axios
    .get(API_BASE_URL)
    .then(async (response) => {
      const data = response.data.result;
      const productCodes = [...new Set(data.map((item: any) => item.productcode))];

      // Fetch product details for all product codes
      const fetchProductDetailsPromises = productCodes.map((productcode) =>
        axios
          .get(API_PRODUCT_CODE_URL + encodeURIComponent(productcode as string)) // Use encodeURIComponent
          .then((response) => (response.data?.result?.length ? response : null))
          .catch((error) => {
            console.error(`Error fetching product code ${productcode}:`, error);
            return null;
          })
      );

      const productDetailsResponses = await Promise.all(fetchProductDetailsPromises);

      // Filter out null responses and consolidate the data
      const validResponses = productDetailsResponses.filter((response) => response !== null);

      const consolidatedData: ConsolidatedDataItem[] = validResponses.flatMap((response) => {
        const productData = response?.data?.result;
        return productData.map((item: any) => {
          const matchedGRDetail = data.find((grItem: any) => grItem.grnumber === item.grNumber);
          const allReceived = productData.every((productItem: any) => productItem.receiveStatus === true);
          const status = allReceived ? 'Completed' : 'Pending';

          return {
            productcode: item.productCode,
            grNumber: item.grNumber,
            date: matchedGRDetail ? matchedGRDetail.date : 'Unknown Date',
            approvedWeight: item.nettWeight - item.rejectedQCWeight,
            rejectedWeight: item.rejectedQCWeight,
            status: status,
          };
        });
      });

      // Remove duplicates by product code
      const uniqueConsolidatedData: ConsolidatedDataItem[] = [];
      const productCodeSet = new Set<string>();

      consolidatedData.forEach((item) => {
        if (!productCodeSet.has(item.productcode)) {
          productCodeSet.add(item.productcode);
          uniqueConsolidatedData.push(item);
        }
      });

      // Populate the table with unique consolidated data
      if (tabulator.value) {
        tabulator.value.setData(uniqueConsolidatedData);
        tabulator.value.setFilter((item: any) => item.status !== 'Completed'); // Apply default filter to exclude "Completed" items
      }
    })
    .catch((error) => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once data is fully loaded
    });

  // Initialize tabulator and other necessary functions
  initTabulator();
  reInitOnResizeWindow();
  fetchProductCodes();
  fetchNamesShift();
  fetchLocation();
  fetchWM();
  fetchGRDetails();
});



const filterComplete = reactive({
  productcode: "",
  status: "",
  startDate: null,
  endDate: null,
});

// Filter function for tabulatorComplete
const onFilterComplete = () => {
  if (tabulatorComplete.value) {
    tabulatorComplete.value.setFilter((data) => {
      const dateValue = new Date(data.date);

      if (isNaN(dateValue.getTime())) {
        console.error("Invalid Date:", data.date);
        return false;
      }

      const startDate = filterComplete.startDate ? new Date(filterComplete.startDate) : null;
      const endDate = filterComplete.endDate ? new Date(filterComplete.endDate) : null;

      if (startDate && isNaN(startDate.getTime())) {
        console.error("Invalid Start Date:", filterComplete.startDate);
        return false;
      }
      if (endDate && isNaN(endDate.getTime())) {
        console.error("Invalid End Date:", filterComplete.endDate);
        return false;
      }

      const formatDateToUTC = (date: Date) => {
        if (!date) return null;
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return utcDate.toISOString().split("T")[0];
      };

      const formattedDateValue = formatDateToUTC(dateValue);
      const formattedStartDate = startDate ? formatDateToUTC(startDate) : null;
      const formattedEndDate = endDate ? formatDateToUTC(endDate) : null;

      if (formattedDateValue && formattedStartDate && !formattedEndDate) {
        return formattedDateValue === formattedStartDate;
      } else if (formattedDateValue && formattedStartDate && formattedEndDate) {
        return formattedDateValue >= formattedStartDate && formattedDateValue <= formattedEndDate;
      } else if (formattedDateValue && !formattedStartDate && formattedEndDate) {
        return formattedDateValue === formattedEndDate;
      } else {
        return true;
      }
    });
  }
};

const productcodeComplete = () => {
  if (tabulatorComplete.value) {
    tabulatorComplete.value.setFilter("productcode", "like", filterComplete.productcode);
  }
};

const onStatusComplete = () => {
  if (tabulatorComplete.value) {
    if (filterComplete.status === "Completed") {
      tabulatorComplete.value.setFilter("status", "=", "Completed");
    } else if (filterComplete.status) {
      tabulatorComplete.value.setFilter("status", "like", filterComplete.status);
    } else {
      tabulatorComplete.value.clearFilter(true);
    }
  }
};

// Reset filters for tabulatorComplete
const onResetFilterComplete = () => {
  Object.assign(filterComplete, {
    productcode: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  if (tabulatorComplete.value) {
    tabulatorComplete.value.clearFilter(true);
    tabulatorComplete.value.setFilter("status", "=", "Completed");
  }
};

// Load data into tabulatorComplete
onMounted(() => {
  axios
    .get(API_BASE_URL)
    .then(async (response) => {
      const data = response.data.result;
      const productCodes = [...new Set(data.map((item: any) => item.productcode))];

      const fetchProductDetailsPromises = productCodes.map((productcode) =>
        axios
          .get(API_PRODUCT_CODE_URL + encodeURIComponent(productcode as string))
          .then((response) => (response.data?.result?.length ? response : null))
          .catch((error) => {
            console.error(`Error fetching product code ${productcode}:`, error);
            return null;
          })
      );

      const productDetailsResponses = await Promise.all(fetchProductDetailsPromises);

      const validResponses = productDetailsResponses.filter((response) => response !== null);

      const consolidatedData: ConsolidatedDataItem[] = validResponses.flatMap((response) => {
        const productData = response?.data?.result;
        return productData.map((item: any) => {
          const matchedGRDetail = data.find((grItem: any) => grItem.grnumber === item.grNumber);
          const allReceived = productData.every((productItem: any) => productItem.receiveStatus === true);
          const status = allReceived ? "Completed" : "Pending";

          return {
            productcode: item.productCode,
            grNumber: item.grNumber,
            date: matchedGRDetail ? matchedGRDetail.date : "Unknown Date",
            approvedWeight: item.nettWeight - item.rejectedQCWeight,
            rejectedWeight: item.rejectedQCWeight,
            status: status,
          };
        });
      });

      const uniqueConsolidatedData: ConsolidatedDataItem[] = [];
      const productCodeSet = new Set<string>();

      consolidatedData.forEach((item) => {
        if (!productCodeSet.has(item.productcode)) {
          productCodeSet.add(item.productcode);
          uniqueConsolidatedData.push(item);
        }
      });

      if (tabulatorComplete.value) {
        tabulatorComplete.value.setData(uniqueConsolidatedData);
        tabulatorComplete.value.setFilter("status", "=", "Completed");
      }
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
    initTabulatorComplete();
    reInitOnResizeWindow();
});





// Define the ProductDetail interface
interface ProductDetail {
  ponumber: string;
  grNumber: string;
  productCode: string;
  lotNumber: string;
  nettWeight: number;
  grossWeight: number;
  location: string | null;
  subLocation: string | null; // Add subLocation field here
  status: string;
  receiveStatus: string;
  expanded?: boolean; // Field to track expansion state
  subDetails?: SubDetail[]; // Field to store sub-lot details
}

// SubDetail interface remains unchanged
interface SubDetail {
  subLotNumber: string;
  nettWeight: number;
  grossWeight: number;
}

const viewData = reactive<{
  id: string;
  availableProductWeight: string;
  grNumber: string;
  grossWeight: string;
  location: string | null;
  lotNumber: string;
  nettWeight: string;
  productCode: string;
  receiveStatus: boolean;
  rejectedQCWeight: string;
  status: string;
  totalNettWeight: number;
  totalRejectedQCWeight: number;
  adjustedWeight: number;
  productDetails: ProductDetail[];
}>({
  id: '',
  availableProductWeight: '',
  grNumber: '',
  grossWeight: '',
  location: null,
  lotNumber: '',
  nettWeight: '',
  productCode: '',
  receiveStatus: false,
  rejectedQCWeight: '',
  status: '',
  totalNettWeight: 0,
  totalRejectedQCWeight: 0,
  adjustedWeight: 0,
  productDetails: [],
});

interface SubLocation {
  name: string;
}

// Form Data
const editFormData = reactive({
  id: null,
  productcode: '',
  resourcecode: '',
  shift: '',
  vendorname: '',
  vendorcode: '',
  ponumber: '',
  lotnumber: '',
  noofBoxes: '',
  nett: 0,
  gross: 0,
  uom: '',
  qcrequired: false,
  whrequired: false,
  isWeightMachineDisabled: false,
  grnumber: '',
  powdercode: '',
  status: '',
  location: '',
  weightmachine: '',
  receiveStatus: false,
  weightmachines: [] as string[],
  vendornames: [] as string[],
  vendorcodes: [] as string[],
  productcodes: [] as string[],
  locations: [] as string[],
  productData: [] as Array<{ code: string; qualitycheckrequired: boolean }>,
  vendorMap: {} as { [key: string]: string },
  shifts: [] as string[],
  grNumber: [] as string[],
  uoms: [] as string[],
  warehouseCodes: [] as string[],
  qualityCheckList: [] as Array<{ jobId: string; resourceCode: string; shift: string; qcPassed: string }>,
  listBoxesList: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  listBoxes: [] as Array<{ jobId: string; subLotNumber: string; nettWeight: number; grossWeight: number }>,
  selectedSubLocation: '',
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});

// Define permission variables for warehouse
let canEditWarehouse = false;

// Define the fetchUserWarehousePermissions function
const fetchUserWarehousePermissions = async () => {
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
        const userDetails = userAccessResponse.data.result.find((user : any) => user.userId === userId);

        if (userDetails) {
            console.log('Fetched user details:', userDetails); // Debugging line

            const warehouse = userDetails.warehouse || ''; // Ensure the value is a string

            // Check if the string contains "Edit" for warehouse
            canEditWarehouse = warehouse.includes('Edit');

            console.log('canEditWarehouse:', canEditWarehouse); // Debugging log
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

// Call the fetchUserWarehousePermissions function to get permissions
fetchUserWarehousePermissions();


// Function to fetch and toggle the sub-details for a specific row
const toggleExpandRow = (detail: ProductDetail) => {
  if (detail.expanded) {
    // If already expanded, collapse it
    detail.expanded = false;
  } else {
    // Expand and fetch sub-lot details if not fetched yet
    detail.expanded = true;
    if (!detail.subDetails) {
      fetchSubLotDetails(detail);
    }
  }
};

// Function to fetch sub-lot details based on lotNumber and grNumber
const fetchSubLotDetails = (detail: ProductDetail) => {
  axios
    .get(`${API_BASE_URL}GetSubLotDetails/${detail.lotNumber}/${detail.grNumber}`)
    .then((response) => {
      const data = response.data.result;
      detail.subDetails = data.map((item: any) => ({
        subLotNumber: item.subLotNumber,
        nettWeight: item.nettWeight,
        grossWeight: item.grossWeight,
      }));
    })
    .catch((error) => {
      console.error("Error fetching sub-lot details:", error);
    });
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
  () => editFormData.grnumber,
  (newGrnumber) => {
    if (newGrnumber) {
      editFormData.lotnumber = generateLotNumber(newGrnumber);
    } else {
      editFormData.lotnumber = '';
    }
  }
);



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
          item.location.toLowerCase() === 'warehouse'
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

        editFormData.productcodes = productData.map(item => item.code);

        // Store the product data globally for later use
        editFormData.productData = productData;
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

// Fetch and Set Data for Edit/View
const fetchAndSetData = (productCode: string, formData: any, modalSetter: (value: boolean) => void) => {
  loading.value = true; // Start loading animation

  // Use encodeURIComponent to ensure the productCode is URL-safe
  axios.get(`${API_BASE_URL}GetGRDetailsbyProductCode/${encodeURIComponent(productCode)}`)
    .then(response => {
      const data = response.data.result;
      if (data && data.length > 0) {
        console.log("Retrieved Data:", data);

        // Initialize total variables
        let totalNettWeight = 0;
        let totalRejectedQCWeight = 0;

        // Access the first item in the data array
        const firstItem = data[0];

        // Populate productDetails array without ensuring unique GR Numbers
        formData.productDetails = data.map((item: any) => ({
          ponumber: item.ponumber,
          grNumber: item.grNumber,
          productCode: item.productCode,
          lotNumber: item.lotNumber,
          nettWeight: item.nettWeight,
          grossWeight: item.grossWeight,
          location: item.location,
          subLocation: null, // Initialize as null, to be updated later
          receiveStatus: item.receiveStatus,
          status: item.status,
        }));

        // Fetch sub-location details by matching GR number
        fetchGRDetailsAndSetSubLocations(formData.productDetails);

        // Calculate totals based on all data
        data.forEach((item: any) => {
          totalNettWeight += item.nettWeight || 0;
          totalRejectedQCWeight += item.rejectedQCWeight || 0;
        });

        // Calculate the adjusted weight
        const adjustedWeight = totalNettWeight - totalRejectedQCWeight;

        // Set the values in formData
        formData.productCode = productCode;
        formData.totalNettWeight = totalNettWeight;
        formData.totalRejectedQCWeight = totalRejectedQCWeight;
        formData.adjustedWeight = adjustedWeight;

        // Map subLocationDetailsList to subLocList if the first item exists
        formData.subLocList = firstItem?.subLocationDetailsList?.map((subLoc: any) => ({
          id: subLoc.id,
          name: subLoc.name
        })) || [];

        // Set the selected sublocation
        if (formData.subLocList.length > 0) {
          formData.selectedSubLocation = formData.subLocList[0].name;
        }

        // Open the modal
        if (modalSetter && typeof modalSetter === "function") {
          modalSetter(true);
        }
      } else {
        console.error("No data found for the specified Product Code:", productCode);
      }
    })
    .catch(error => handleError(error, "Error fetching data for editing"))
    .finally(() => {
      loading.value = false; // End loading animation
    });
};




// Fetch the GR details and match sub-location based on GR number
const fetchGRDetailsAndSetSubLocations = async (productDetails: any[]) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');

    if (response.data && response.data.result) {
      const grDetails = response.data.result;

      // Map sub-locations to productDetails based on grNumber
      productDetails.forEach((detail: any) => {
        const matchingGR = grDetails.find((gr: any) => gr.grnumber === detail.grNumber);
        if (matchingGR && matchingGR.subLocationDetailsList) {
          detail.subLocation = matchingGR.subLocationDetailsList
            .map((subLoc: any) => subLoc.name)
            .join(", "); // Join multiple sub-locations if present
        }
      });

      // Log success message and the matched product details with sub-locations
      console.log('Successfully fetched and set sub-locations:', productDetails);
    }
  } catch (error) {
    console.error('Error fetching GR details:', error);
  }
};


const handleReceive = (grNumber: any) => {
  fetchAndReceive(grNumber, () => {
    fetchAndSetData(viewData.productCode, viewData, setviewModal);
  });
};

const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

axios.get(API_BASE_URL)
  .then(response => {
    const data = response.data.result;
    const productCodes = [...new Set(data.map((item: any) => item.productcode))];

    const fetchProductDetailsPromises = productCodes.map((productcode) =>
      axios.get(`${API_PRODUCT_CODE_URL}${productcode}`)
        .then((response) => (response.data?.result?.length ? response : null))
        .catch((error) => {
          console.error(`Error fetching product code ${productcode}:`, error);
          return null;
        })
    );

    return Promise.all(fetchProductDetailsPromises).then((productDetailsResponses) => {
      const validResponses = productDetailsResponses.filter(response => response !== null);

      const consolidatedData: ConsolidatedDataItem[] = validResponses.flatMap((response) => {
        const productData = response?.data?.result;
        return productData.map((item: any) => {
          const matchedGRDetail = data.find((grItem: any) => grItem.grnumber === item.grNumber);
          const allReceived = productData.every((productItem: any) => productItem.receiveStatus === true);
          const status = allReceived ? 'Completed' : 'Pending';

          return {
            productcode: item.productCode,
            grNumber: item.grNumber,
            date: matchedGRDetail ? matchedGRDetail.date : 'Unknown Date',
            approvedWeight: item.nettWeight - item.rejectedQCWeight,
            rejectedWeight: item.rejectedQCWeight,
            status: status,
          };
        });
      });

      // Remove duplicates by product code, keeping the first occurrence of each unique product code
      const uniqueConsolidatedData: ConsolidatedDataItem[] = [];
      const productCodeSet = new Set<string>();

      consolidatedData.forEach((item) => {
        if (!productCodeSet.has(item.productcode)) {
          productCodeSet.add(item.productcode);
          uniqueConsolidatedData.push(item);
        }
      });

      // Populate the table with unique consolidated data
      if (tabulator.value) {
        tabulator.value.setData(uniqueConsolidatedData);
        tabulator.value.setFilter((item: any) => item.status !== 'Completed'); // Apply default filter to exclude "Completed" items
      }
    });
  })
  .catch((error) => {
    console.error('Error fetching data:', error);
  })
  .finally(() => {
    loading.value = false; // Hide loading modal once data is fully loaded
  });

initTabulator();
reInitOnResizeWindow();
fetchProductCodes();
fetchNamesShift();
fetchLocation();
fetchWM();
fetchGRDetails();
};

interface Payload {
  grnumber: string;
  productcode: string;
  resourcecode: string;
  shift: string;
  vendorname: string;
  vendorcode: string;
  ponumber: string;
  lotnumber: string;
  noofBoxes: number;
  nett: number;
  gross: number;
  uom: string;
  qcrequired: boolean;
  location: boolean;
  receiveStatus: boolean;
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
}

const fetchAndReceive = async (grNumber: any, callback: any) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');
    const data = response.data.result.find((item: any) => item.grnumber === grNumber);
    if (data) {
      confirmAndReceive(data, callback);
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'GR Number not found!',
      });
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to fetch data!',
    });
  }
};

const confirmAndReceive = (response: any, callback: any) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will mark the item as received!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, receive it!',
  }).then(result => {
    if (result.isConfirmed) {
      editFormData.receiveStatus = true;
      editFormData.grnumber = response.grnumber;
      editFormData.productcode = response.productcode;
      editFormData.resourcecode = response.resourcecode || '';
      editFormData.shift = response.shift || '';
      editFormData.vendorname = response.vendorname || '';
      editFormData.vendorcode = response.vendorcode || '';
      editFormData.ponumber = response.ponumber || '';
      editFormData.lotnumber = response.lotnumber || '';
      editFormData.noofBoxes = response.noofBoxes || '';
      editFormData.nett = response.nett || 0;
      editFormData.location = 'Warehouse';
      editFormData.gross = response.gross || 0;
      editFormData.uom = response.uom || '';
      editFormData.qcrequired = !!response.qcrequired;
      editFormData.status = response.status || '';
      editFormData.qualityCheckList = response.qualityCheckList || [];
      editFormData.listBoxesList = response.listBoxes || [];

      // Set qcPassed based on status
      if (response.status === 'Completed') {
        editFormData.qualityCheckList = [{
          jobId: String(response.grnumber),
          resourceCode: String(response.resourcecode),
          shift: String(response.shift),
          qcPassed: "true"
        }];
      } else if (response.status === 'QC Rejected') {
        editFormData.qualityCheckList = [{
          jobId: String(response.grnumber),
          resourceCode: String(response.resourcecode),
          shift: String(response.shift),
          qcPassed: "false"
        }];
      }

      updateRole(callback);
    }
  });
};

// Update Role
const updateRole = (callback: any) => {
  formSubmitted.value = true;

  // Fetch GR details from API to get sub-location for the given GR number
  const matchingGR = grDetails.value.find(gr => gr.grnumber === editFormData.grnumber);

  if (!matchingGR) {
    console.error('No matching GR details found for the given GR number.');
    return;
  }

  // Get the sub-location from the matching GR detail
  const subLocationDetailsList = matchingGR.subLocationDetailsList || [];

  // Use the first sub-location name from the list, if available
  const selectedSubLocation = subLocationDetailsList.length > 0 ? subLocationDetailsList[0].name : 'N/A';

  const payload = {
    grnumber: String(editFormData.grnumber),
    productcode: String(editFormData.productcode),
    resourcecode: String(editFormData.resourcecode),
    shift: String(editFormData.shift),
    vendorname: String(editFormData.vendorname),
    vendorcode: String(editFormData.vendorcode),
    ponumber: String(editFormData.ponumber),
    lotnumber: String(editFormData.lotnumber),
    noofBoxes: parseFloat(editFormData.noofBoxes),
    nett: editFormData.nett,
    gross: editFormData.gross,
    uom: String(editFormData.uom),
    location: String(editFormData.location),
    qcrequired: Boolean(editFormData.qcrequired),
    receiveStatus: Boolean(editFormData.receiveStatus),
    qualityCheckList: editFormData.qualityCheckList,
    listBoxesList: editFormData.listBoxesList.map(box => ({
      jobId: String(editFormData.grnumber),
      subLotNumber: String(box.subLotNumber),
      nettWeight: box.nettWeight,
      grossWeight: box.grossWeight,
    })),
    subLocList: [
      {
        name: selectedSubLocation, // Fetch sub-location name from API based on GR number
      }
    ]
  };

  // Log payload in JSON format for debugging
  console.log('Payload:', JSON.stringify(payload, null, 2));

  axios.post('http://10.87.0.33:8082/api/GRDetails/SubmitGRDetails', payload)
    .then(() => {
      callback();  // Call the callback to refresh data
      updateTableData();
      fetchWM();
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
};




const updateNettAndGross = () => {
  const nettSum = editFormData.listBoxesList.reduce((sum, box) => sum + (box.nettWeight || 0), 0);
  const grossSum = editFormData.listBoxesList.reduce((sum, box) => sum + (box.grossWeight || 0), 0);
  editFormData.nett = nettSum;
  editFormData.gross = grossSum;
};

const updateListBoxesList = () => {
  console.log('updateListBoxesList called'); // Add this line to verify the method is being called
  const noofBoxes = parseInt(editFormData.noofBoxes, 10);
  const currentLength = editFormData.listBoxesList.length;
  const grnumberWithoutDashes = editFormData.grnumber.replace(/-/g, '');
  const currentDate = new Date();
  const yy = String(currentDate.getFullYear()).slice(-2);
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
  const dd = String(currentDate.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  if (!isNaN(noofBoxes) && noofBoxes > 0) {
    if (noofBoxes > currentLength) {
      for (let i = currentLength; i < noofBoxes; i++) {
        editFormData.listBoxesList.push({
          jobId: editFormData.grnumber,
          subLotNumber: `${grnumberWithoutDashes}${dateStr}-${i + 1}`,
          nettWeight: 0,
          grossWeight: 0,
        });
      }
    } else if (noofBoxes < currentLength) {
      editFormData.listBoxesList.splice(noofBoxes);
    }
    updateNettAndGross(); // Update nett and gross after changing listBoxesList
  } else {
    editFormData.listBoxesList = [];
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
  formData.status = '';
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
            <title>GR Warehouse</title>
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

// Filters
const filters = ref({
  poNumber: '',
  lotNumber: ''
});

// Computed property to filter the product details based on PO Number and Lot Number
const filteredProductDetails = computed(() => {
  return viewData.productDetails.filter((detail) => {
    const matchesPoNumber = filters.value.poNumber === '' || detail.ponumber.toLowerCase().includes(filters.value.poNumber.toLowerCase());
    const matchesLotNumber = filters.value.lotNumber === '' || detail.lotNumber.toLowerCase().includes(filters.value.lotNumber.toLowerCase());
    return matchesPoNumber && matchesLotNumber;
  });
});

// Reset Filters
const resetFilters = () => {
  filters.value.poNumber = '';
  filters.value.lotNumber = '';
};

interface GRDetail {
  grnumber: string;
  productcode: string;
  date: string;
  resourcecode: string;
  vendorname: string;
  vendorcode: string;
  ponumber: string;
  lotnumber: string;
  nett: number;
  gross: number;
  location: string;
  qcrequired: boolean;
  status: string;
  listBoxes: { subLotNumber: string; nettWeight: number; grossWeight: number }[];
  subLocationDetailsList?: Array<{  // Add this to the type definition
    id: string;
    name: string;
  }>;
}

const grDetails = ref<GRDetail[]>([]);

const fetchGRDetails = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/GRDetails');
    if (response.data && response.data.result) {
      grDetails.value = response.data.result;  // Store the GR details
    }
  } catch (error) {
    console.error('Error fetching GR details:', error);
  }
};




// Function to print the specific sub-detail row
const printSubDetailRow = (subDetail: any): void => {
  // Find the corresponding GR entry by matching the sub-detail's subLotNumber
  const matchingGR: GRDetail | undefined = grDetails.value.find((gr: GRDetail) =>
    gr.listBoxes && gr.listBoxes.some((box: any) => box.subLotNumber === subDetail.subLotNumber)
  );

  // Handle the case where matchingGR is undefined or listBoxes is missing
  if (!matchingGR || !matchingGR.listBoxes) {
    alert("GR details or list boxes not found for the sub lot number.");
    return;
  }

  // Find the sub-location from subLocationDetailsList, if available
  const subLocationName = matchingGR.subLocationDetailsList?.[0]?.name || "N/A";

  // Create a printable window
  const newPrint = window.open("", "_blank");

  if (newPrint) {
    // Generate the QR code for the subLotNumber
    QRCode.toDataURL(subDetail.subLotNumber, { width: 450, margin: 1 }, (err, url) => {
      if (err) {
        console.error(err);
        return;
      }

      newPrint.document.write(`
        <html>
          <head>
            <title>Sub Lot Details - ${subDetail.subLotNumber}</title>
            <style>
              @media print {
                table {
                  border-collapse: collapse;
                  width: 100%;
                  font-family: Arial, Helvetica, sans-serif;
                }
                th, td {
                  border: 1px solid #000;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f2f2f2;
                  font-weight: bold;
                }
                td {
                  color: #000;
                }
                .title {
                  text-align: center;
                }
              }
            </style>
          </head>
          <body>
            <h2>GR Warehouse</h2>
            <table class="w-full">
              <tbody>
                <tr><td><strong>GR Number:</strong></td><td>${matchingGR.grnumber}</td></tr>
                <tr><td><strong>Product Code:</strong></td><td>${matchingGR.productcode || 'N/A'}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${new Date(matchingGR.date).toLocaleString()}</td></tr>
                <tr><td><strong>Resource Code:</strong></td><td>${matchingGR.resourcecode || 'N/A'}</td></tr>
                <tr><td><strong>Vendor Name:</strong></td><td>${matchingGR.vendorname || 'N/A'}</td></tr>
                <tr><td><strong>Vendor Code:</strong></td><td>${matchingGR.vendorcode || 'N/A'}</td></tr>
                <tr><td><strong>PO Number:</strong></td><td>${matchingGR.ponumber || 'N/A'}</td></tr>
                <tr><td><strong>Lot Number:</strong></td><td>${matchingGR.lotnumber}</td></tr>
                <tr><td><strong>Location:</strong></td><td>${matchingGR.location || 'N/A'}</td></tr>
                <tr><td><strong>Sub Location:</strong></td><td>${subLocationName}</td></tr>
              </tbody>
            </table>
            <table class="w-full">
              <thead>
                <tr>
                  <th>Sub Lot Number</th>
                  <th>Nett Weight</th>
                  <th>Gross Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${subDetail.subLotNumber}</td>
                  <td>${subDetail.nettWeight.toFixed(4)} KG</td>
                  <td>${subDetail.grossWeight.toFixed(4)} KG</td>
                </tr>
              </tbody>
            </table>

            <div style="text-align: center; margin-top:6px">
              <img src="${url}" alt="QR Code for Sub Lot" />
            </div>
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
    });
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
    <h2 class="mr-auto text-lg font-medium">Warehouse - Goods Receiving</h2>

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
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Completed</h2>

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
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Powder Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filterComplete.productcode" type="text" class="mt-2 w-full"
                placeholder="Search Powder Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="productcodeComplete">Powder Number</Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-12 xl:w-auto xl:flex-initial">Status</label>
            <div class="relative">
              <FormSelect id="tabulator-html-filter-id" v-model="filterComplete.status" class="mt-2 w-full"
                aria-label="Default select example">
                <option disabled value="">Select a Status Option</option>
                <option selected>Completed</option>
                <option>Pending</option>
              </FormSelect>
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="onStatusComplete">Status</Button>
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
              @click="onFilterComplete">
              Date</Button>
          </div>
        </div>
      </form>
      <div class="flex mt-5 sm:mt-0">
        <Button id="tabulator-print" variant="outline-secondary" class="w-1/2 mr-2 sm:w-auto" @click="onResetFilterComplete ">
          Reset
        </Button>

        <Button id="tabulator-print" variant="outline-primary" class="w-1/2 mr-2 sm:w-auto" @click="onPrint">
          <Lucide icon="Printer" class="w-4 h-4 mr-2" /> Print
        </Button>


      </div>
    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulatorComplete" ref="tableRefComplete" class="mt-5"></div>
    </div>
  </div>

  <!-- <Slideover :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Warehouse - Goods Receiving
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-gr">GR Number</FormLabel>
            <FormInput v-model="editFormData.grnumber" id="regular-form-gr" type="text" disabled />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Product Code</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.productcode }" id="regular-form-1"
              v-model="editFormData.productcode" type="text" placeholder="Product Code" />
            <span v-if="formSubmitted && !editFormData.productcode" class="text-red-500">Product Code is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.resourcecode }" id="regular-form-1"
              v-model="editFormData.resourcecode" type="text" placeholder="Employee ID" />
            <span v-if="formSubmitted && !editFormData.resourcecode" class="text-red-500">Employee ID is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="editFormData.shift" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Vendor Name</FormLabel>
            <FormSelect v-model="editFormData.vendorname" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Vendor Name Option</option>
              <option v-for="name in editFormData.vendornames" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Vendor Code</FormLabel>
            <FormSelect v-model="editFormData.vendorcode" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Vendor Code Option</option>
              <option v-for="code in editFormData.vendorcodes" :key="code" :value="code">
                {{ code }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">PO Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.ponumber }" id="regular-form-1"
              v-model="editFormData.ponumber" type="text" placeholder="PO Number" />
            <span v-if="formSubmitted && !editFormData.ponumber" class="text-red-500">PO Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Lot Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.lotnumber }" id="regular-form-1"
              v-model="editFormData.lotnumber" type="text" placeholder="Lot Number" />
            <span v-if="formSubmitted && !editFormData.lotnumber" class="text-red-500">Lot Number is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">No. of Boxes</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': (!editFormData.noofBoxes || !isNumeric(editFormData.noofBoxes)) }"
              id="regular-form-8" v-model="editFormData.noofBoxes" type="number" placeholder="No. of Boxes"
              @input="updateListBoxesList" />
            <span v-if="formSubmitted && (!editFormData.noofBoxes || !isNumeric(editFormData.noofBoxes))"
              class="text-red-500">{{
                !editFormData.noofBoxes ? 'No. of Boxes is required!' : 'No. of Boxes must be a valid number!'
              }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Nett</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': (!editFormData.nett || !isNumeric(editFormData.nett)) }"
              id="regular-form-8" v-model="editFormData.nett" type="number" placeholder="Nett" step="any" />
            <span v-if="formSubmitted && (!editFormData.nett || !isNumeric(editFormData.nett))" class="text-red-500">{{
              !editFormData.nett ? 'Nett is required!' : 'Nett must be a valid number!'
            }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Gross</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': (!editFormData.gross || !isNumeric(editFormData.gross)) }"
              id="regular-form-8" v-model="editFormData.gross" type="number" placeholder="Gross" step="any" />
            <span v-if="formSubmitted && (!editFormData.gross || !isNumeric(editFormData.gross))"
              class="text-red-500">{{
                !editFormData.gross ? 'Gross is required!' : 'Gross must be a valid number!'
              }}</span>
          </div>

          <div class="mt-5">
            <label for="vendor-dropdown">UOM</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="editFormData.uom">
              <option v-for="uoms in editFormData.uoms" :key="uoms" :value="uoms">
                {{ uoms }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="qcrequired" class="mr-2  ml-[-2]">
                Quality Check Required
              </FormCheck.Label>
              <FormCheck.Input id="qcrequired" v-model="editFormData.qcrequired" type="checkbox" />
            </FormCheck>
          </div>
          <div class="mt-5" v-if="editFormData.listBoxesList.length > 0">
            <h3 class="mb-2 mt-8 text-lg font-medium leading-none">Box Details</h3>
            <hr />
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">Sub Lot Number</th>
                  <th class="py-2 px-4 border-b text-center">Nett Weight</th>
                  <th class="py-2 px-4 border-b text-center">Gross Weight</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(box, index) in editFormData.listBoxesList" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    <FormInput v-model="box.subLotNumber" type="text" class="form-input mt-1 block w-full" />
                  </td>
                  <td class="py-2 px-4 border-b small-width">
                    <FormInput v-model.number="box.nettWeight" type="number" class="form-input mt-1 block w-full"
                      @input="updateNettAndGross" step="any" />
                  </td>
                  <td class="py-2 px-4 border-b small-width">
                    <FormInput v-model.number="box.grossWeight" type="number" class="form-input mt-1 block w-full"
                      @input="updateNettAndGross" step="any" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
            Submit
          </Button>
        </form>
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
  </Slideover> -->


  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="3xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Warehouse - Goods Receiving
        </h2>
        <div>

          <FormLabel htmlFor="regular-form-5">Weight Machine</FormLabel>
          <FormSelect v-model="editFormData.weightmachine" class="sm:mr-2" aria-label="Default select example"
            :class="{ 'border-red-500': formSubmitted && !editFormData.location }"
            :disabled="editFormData.isWeightMachineDisabled">
            <option disabled value="">Select a Weight Machine Option</option>
            <option v-for="weightMachine in editFormData.weightmachines" :key="weightMachine" :value="weightMachine">
              {{ weightMachine }}
            </option>
          </FormSelect>
        </div>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div ref="toPrint">
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg">

            <div>
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                      Product Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Total Accepted Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ Number(viewData.adjustedWeight.toFixed(4)) }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Total Rejected Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ Number(viewData.totalRejectedQCWeight.toFixed(4)) }}
                    </td>
                  </tr>

                </tbody>
              </table>

            </div>


          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10">
            <!-- Filter Section -->
            <div class="flex space-x-4 p-4 bg-gray-100 action">
              <div>
                <label for="poNumber" class="block text-sm font-medium text-gray-700">Filter by PO Number</label>
                <input v-model="filters.poNumber" id="poNumber" type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter PO Number" />
              </div>
              <div>
                <label for="lotNumber" class="block text-sm font-medium text-gray-700">Filter by Lot Number</label>
                <input v-model="filters.lotNumber" id="lotNumber" type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter Lot Number" />
              </div>
              <div class="flex items-end action">
                <button @click="resetFilters" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-100">Reset
                  Filters</button>
              </div>
            </div>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th colspan="10" class="title px-6 py-4 text-center font-medium text-white bg-blue-900">
                    List of GR
                  </th>
                </tr>
                <tr>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">PO Number</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">GR Number</th>
                  <th class="px-4 py-4 text-center font-medium text-white bg-primary">Lot Number</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">Weight</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">Main Location</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">Sub Location</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">WH Status</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary">Received Status</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary action">Action</th>
                  <th class="px-4 py-2 text-center font-medium text-white bg-primary action"></th>
                </tr>

                <!-- Main Table Body with Filtering -->
                <template v-for="detail in filteredProductDetails" :key="detail.grNumber">
                  <!-- Main Row -->
                  <tr class="hover:bg-gray-100">
                    <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ detail.ponumber }}</td>
                    <td class="py-3 px-auto text-center text-gray-700 dark:text-white">{{ detail.grNumber }}</td>
                    <td class="px-auto text-center text-gray-700 dark:text-white">{{ detail.lotNumber }}</td>
                    <td class="px-auto text-center text-gray-700 dark:text-white">
                      {{ Number(detail.nettWeight.toFixed(4)) }}
                    </td>

                    <td class="px-auto text-center text-gray-700 dark:text-white">{{ detail.location }}</td>
                    <td class="px-auto text-center text-gray-700 dark:text-white">{{ detail.subLocation || 'N/A' }}</td>
                    <!-- Display Sub Location -->
                    <td class="px-auto text-center text-gray-700 dark:text-white">
                      <span v-if="detail.receiveStatus" class="inline-flex bg-green-50 text-green-700">Completed</span>
                      <span v-else class="inline-flex bg-yellow-50 text-yellow-700">Pending</span>
                    </td>
                    <td class="px-auto text-center text-gray-700 dark:text-white">
                      <span v-if="detail.receiveStatus" class="inline-flex bg-green-50 text-green-700">
                        <i class="fa-regular fa-circle-check mr-2"></i>Received
                      </span>
                      <span v-else class="inline-flex bg-red-50 text-red-700">
                        <i class="fa-regular fa-circle-xmark mr-2"></i>Not Received
                      </span>
                    </td>
                    <td class="px-auto text-center action text-gray-700 dark:text-white">

                      <button @click="handleReceive(detail.grNumber)" type="button" :disabled="!!detail.receiveStatus"
                        class="my-2 mx-2 px-4 py-2 text-white rounded"
                        :class="detail.receiveStatus ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-900'">
                        Receive
                      </button>
                    </td>
                    <td class="px-auto text-center action text-gray-700 dark:text-white">

                      <button @click="toggleExpandRow(detail)" class="my-2 mx-2 px-4 py-2 text-white rounded"
                        :class="detail.expanded ? 'bg-blue-500' : 'bg-blue-700 hover:bg-blue-900'">
                        <i v-if="detail.expanded" class="fa-solid fa-caret-up"></i>
                        <i v-else class="fa-solid fa-caret-down"></i>
                      </button>

                    </td>
                  </tr>

                  <!-- Sub-Details Row (Expanded) -->
                  <tr v-if="detail.expanded">
                    <td colspan="10" class="border-b border-gray-300"> <!-- Add the border here -->
                      <table class="w-full">
                        <thead>
                          <tr class="text-gray-700 dark:text-white bg-gray-200 dark:bg-gray-700">
                            <th class="px-4 py-2 text-center">Sub Lot Number</th>
                            <th class="px-4 py-2 text-center">Nett Weight</th>
                            <th class="px-4 py-2 text-center">Gross Weight</th>
                            <th class="px-4 py-2 text-center">Print</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="subDetail in detail.subDetails" :key="subDetail.subLotNumber">
                            <td class="px-4 py-2 text-center">{{ subDetail.subLotNumber }}</td>
                            <td class="px-4 py-2 text-center">{{ Number(subDetail.nettWeight.toFixed(4)) }}</td>
                            <td class="px-4 py-2 text-center">{{ Number(subDetail.grossWeight.toFixed(4)) }}</td>
                            <td class="px-4 py-2 text-center">
                              <button @click="printSubDetailRow(subDetail)"
                                class="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">
                                <i class="fa-solid fa-print"></i> Print
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