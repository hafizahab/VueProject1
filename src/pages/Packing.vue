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
  jobId?: string;
  shift?: string;
  machineCode?: string;
  productCode?: string;
  totalWeight?: any;
  waste?: any;
  wettreatmentrequired?: any;
  blowrequired?: any;
  jobStatus?: string;
  bagId?: string;
  subJobId?: string;
  partNumber?: string;
  weight?: string;
}

interface UserAccess {
  userId: string;
  packing?: string[];
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
const tableRefHolding = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const tabulatorHolding = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  bagId: "",
  jobId: "",
  status: "",
  startDate: null,
  endDate: null,
});
const filterHolding = reactive({
  field: "bagId",
  type: "like",
  value: "",
  bagId: "",
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
                  // Conditionally render "Edit" link if user has "Edit" permission for packing and jobStatus is not "Completed"
                  if (
                    userAccess.packing &&
                    userAccess.packing.includes("Edit") &&
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


const initTabulatorHolding = () => {
  if (tableRefHolding.value) {
    tabulatorHolding.value = new Tabulator(tableRefHolding.value, {
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
          title: "BAG ID",
          minWidth: 150,
          responsive: 0,
          field: "bagId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.bagId}</div>
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
          title: "PART NUMBER",
          minWidth: 150,
          responsive: 0,
          field: "partNumber",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.partNumber}</div>
    </div>`;
          },
        },
        {
          title: "WEIGHT",
          minWidth: 150,
          responsive: 0,
          field: "weight",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.weight}</div>
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
          title: "ACTIONS",
          minWidth: 200,
          field: "actions",
          responsive: 0,
          hozAlign: "center",
          headerHozAlign: "center",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const container = document.createElement("div");
            container.classList.add("flex", "items-center", "lg:justify-center", "flex-col");

            const response = cell.getData();

            // Check if the user has Edit permission for binHolding
            if (canEditMachineStationProduction) { // Assuming you have defined canEditBinHolding elsewhere
              // "Release" Button
              const releaseButton = document.createElement("button");
              releaseButton.classList.add("flex", "items-center", "mr-3", "text-blue-700", "dark:text-blue-400", "font-normal", "rounded");

              // Create the icon for "Release"
              const releaseIcon = document.createElement("i");
              releaseIcon.classList.add("fa-solid", "fa-right-to-bracket", "pr-2"); // Use appropriate icon classes

              releaseButton.appendChild(releaseIcon);
              releaseButton.appendChild(document.createTextNode("Release"));

              releaseButton.addEventListener("click", async (event) => {
                event.preventDefault();

                // Show confirmation alert
                Swal.fire({
                  title: 'Are you sure?',
                  text: 'This will release the weight of the Bag!',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#1e40af',
                  cancelButtonColor: '#d33',
                  confirmButtonText: 'Yes, release it!',
                }).then(async (result) => {
                  if (result.isConfirmed) {
                    try {
                      // Step 1: Fetch the HoldingBag details using the GET API with the ID
                      const getResponse = await axios.get(`http://10.87.0.33:8082/api/HoldingBagList/${response.id}`);
                      let holdingBagData = getResponse.data.result;

                      // Ensure that holdingBagData is an object (not an array)
                      if (Array.isArray(holdingBagData)) {
                        holdingBagData = holdingBagData[0]; // Take the first object if it's an array
                      }

                      // Step 2: Modify the weight field to 0
                      holdingBagData.weight = 0;

                      // Step 3: Replace null values with empty strings
                      for (let key in holdingBagData) {
                        if (holdingBagData[key] === null) {
                          holdingBagData[key] = ""; // Replace null values with empty strings
                        }
                      }

                      // Log the payload in JSON format before updating
                      console.log("Payload to be sent:", JSON.stringify(holdingBagData, null, 2));

                      // Step 4: Send the updated data using the PUT API
                      await axios.put(`http://10.87.0.33:8082/api/HoldingBagList/${response.id}`, holdingBagData);

                      // Step 5: Show success alert
                      Swal.fire({
                        icon: 'success',
                        title: 'Bag Released Successfully',
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

                      // Refresh the table data
                      updateTableDataHolding();

                    } catch (error) {
                      console.error("Error releasing bin:", error);
                      Swal.fire({
                        icon: 'error',
                        title: 'Failed!',
                        text: 'There was an error releasing the bin. Please try again.',
                        confirmButtonColor: '#d33',
                      });
                    }
                  }
                });
              });

              container.appendChild(releaseButton);
            }

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

  tabulatorHolding.value?.on("renderComplete", () => {
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



const jobIdHolding = () => {
  if (tabulatorHolding.value) {
    tabulatorHolding.value.setFilter("bagId", 'like', filter.bagId);
  }
};

const onFilterHolding = () => {
  if (tabulatorHolding.value) {
    tabulatorHolding.value.setFilter(filter.field, filter.type, filter.value);
  }
};

// On reset filter
const onResetFilterHolding = () => {
  setFilter({
    ...filter,
    field: "bagId",
    type: "like",
    value: "",
  });
  onFilterHolding();
};


// Print
const onPrintHolding = () => {
  if (tabulatorHolding.value) {
    tabulatorHolding.value.print();
  }
};

const loading = ref<boolean>(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/Packing/';
const API_BASE_URL_HOLDING = 'http://10.87.0.33:8082/api/HoldingBagList/';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises: Promise<any>[] = [
    axios.get(API_BASE_URL).then(response => {
      // Filter out data with status "deleted" but keep "Completed" jobs for filtering in Tabulator
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: "Pending" status first, then by jobId in ascending order (smallest jobId first)
      const sortedData = filteredData.sort((a: any, b: any) => {
        const aJobStatus = a.jobStatus.toUpperCase();
        const bJobStatus = b.jobStatus.toUpperCase();

        // Move "Pending" jobs to the top
        if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
        if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

        // Sort by jobId numerically (smallest to largest)
        const jobIdA = parseInt(a.jobId.substring(1)); // Assuming jobId format starts with a letter (e.g., "J123")
        const jobIdB = parseInt(b.jobId.substring(1));

        return jobIdA - jobIdB;
      });

      console.log(sortedData);

      // Populate the table with sorted data
      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED'); // Exclude "Completed" jobs
      }
    }),

    // Wrap non-promise functions with `Promise.resolve()` to make them promises
    Promise.resolve(fetchNamesShift()),
    Promise.resolve(fetchMachineId()),
    Promise.resolve(fetchWeight()),
    Promise.resolve(fetchMovement()),
    Promise.resolve(fetchProductCodes()),
    Promise.resolve(fetchMachinePP()),
    Promise.resolve(fetchMachineBlow()),
    Promise.resolve(fetchWM())
  ];

  // Wait for all promises to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize Tabulator and other non-async functions
  initTabulator();
  reInitOnResizeWindow();
});
onMounted(() => {
  loading.value = true; // Show loading modal at the start

  axios.get(API_BASE_URL_HOLDING)
    .then(response => {
      // Filter out items where the status is 'InActive' or the weight is less than or equal to 0
      let filteredData = response.data.result.filter((item : any) =>
        item.status !== 'InActive' && item.weight > 0
      );

      // Sort the filtered data by bagId
      filteredData = filteredData.sort((a : any, b : any) => {
        // Handle empty bagId values by placing them at the end
        if (!a.bagId) return 1;
        if (!b.bagId) return -1;
        return a.bagId.localeCompare(b.bagId, undefined, { numeric: true });
      });

      console.log('Filtered and Sorted Data:', filteredData);

      if (tabulatorHolding.value) {
        tabulatorHolding.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after data is processed
    });

  initTabulatorHolding();
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
  id: '',
  jobId: '',
  date: formatDate(new Date()),
  resourceCode: '',
  subJobId: '',
  machineId: '',
  weight: '',
  shift: '',
  status: '',
  productCode: '',
  preBlendRequired: false,
  preBlendweight: 0,
  collected: false,
  preBlendStatus: '',
  listBins: '',
  reassignedBinId: '',
  jobStatus: '',
  shifts: [] as string[],
  productSubCodesofRecipe: [] as Array<{ jobId: string; productCode: string; percentage: ''; weight: number; status: string }>,
  listBinsList: [] as Array<{ type: string; weight: number; reassignBinId: string; productCode: string }>,
  listBinsforBlend: [] as Array<{ type: string; weight: number; reassignBinId: string; productCode: string }>,
});

const editFormData = reactive({
  id: null,
  jobId: '',
  shift: '',
  weight: 0,
  approvedWeight: 0,
  productCode: "",
  jobStatus: "",
  weightmachine: '',
  isWeightMachineDisabled: false,
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
  weightmachines: [] as string[],
  machineJobRows: [] as Array<{
    jobId: string;
    subJobId: string;
    binCode: string;
    binName: string;
    weight: number;
    approvedWeight: number;
    noofCartons: number;
    jobStatus: string;
    listofCartonsDetailsList: Array<{
      cartonId: string;
      cartonType: string;
      noofBags: number;
      weight: number;
      sticker: string;
      status: string;
      listofBagsListforPacking: Array<{
        bagId: string;
        bagType: string;
        weight: number;
        sticker: string;
      }>
    }>
  }>,
  holdingBagRows: [] as Array<{
    id: string;
    jobId: string;
    bagId: string;
    subJobId: string;
    partNumber: string;
    weight: number;
    status: string | null;
    createdDate: string;
    updatedDate: string | null;
  }>, // Added holdingBagRows here
});


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


// Define permission variable for packing
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

      const machineStationProduction = userDetails.packing || ''; // Ensure the value is a string

      // Check if the string contains "Edit" for packing
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


// Define a reactive property to keep track of the selected bin index
const selectedBinIndex = ref<number | null>(null);  // Track the selected bin index

// Toggle the bin selection and focus on the bin select dropdown
const toggleBinSelection = (index: number) => {
  if (selectedBinIndex.value === index) {
    selectedBinIndex.value = null; // Unselect if already selected
  } else {
    selectedBinIndex.value = index; // Select the bin
    focusBinSelectForRow(index); // Focus the bin select dropdown
  }
};

// Focus the <select> element for the row
const focusBinSelectForRow = async (index: number) => {
  await nextTick(); // Wait for DOM update
  const selectElement = document.querySelector(`#binSelect-${index}`) as HTMLSelectElement | null;

  if (selectElement) {
    selectElement.focus(); // Focus the select
    // Simulate a dropdown opening by triggering the keydown event
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    selectElement.dispatchEvent(event);
  }
};


const fetchBinId = async (jobId: string) => {
  try {
    console.log('Fetching bins for jobId:', jobId); // Log the jobId being used

    const response = await axios.get('http://10.87.0.33:8082/api/ListBins');
    console.log('API Response:', response); // Log the full API response

    const nameData = response.data.result;
    console.log('nameData:', nameData); // Log the data extracted from the response

    if (Array.isArray(nameData)) {
      // Filter bins by jobId and ensure weight > 0 and other conditions
      const filteredBins = nameData.filter(item => {
        const isJobIdMatch = item.mappingId === jobId;
        const isWeightValid = item.weight > 0;
        const isStatusValid = item.status !== 'inactive'; // Case-sensitive check
        const isOqcTrue = item.oqc === true;
        const isStartPackingTrue = item.startPacking === true;


        // Return true if all conditions pass
        return isJobIdMatch && isWeightValid && isStatusValid && isOqcTrue && isStartPackingTrue;
      });

      console.log('Filtered bins:', filteredBins); // Log the filtered bins

      // Update formData.bins and binData with filtered results
      editFormData.bins = [...filteredBins.map(item => item.id)]; // Spread into a new array for reactivity
      editFormData.binData = [...filteredBins]; // Same for binData

      console.log('Updated formData.bins:', editFormData.bins); // Log the updated bins in formData
      console.log('Updated formData.binData:', editFormData.binData); // Log the updated binData in formData
    } else {
      console.error('Invalid response format for nameData:', nameData);
    }
  } catch (error) {
    console.error('Error fetching bins by jobId:', error); // Log the error if the API call fails
  }
};




// Method to find bin details by id
const getBinDetails = (binMasterId: any) => {
  const bin = editFormData.binData.find(bin => bin.id === binMasterId);
  return bin || {};
};


const getBinDetailsMachine = (binCode: any) => {
  return editFormData.binData.find(bin => bin.id === binCode) || {};
};


const updateCapacityValuesMachine = (binCode: any, row: any) => {
  const binDetails = getBinDetailsMachine(binCode);
  if (binDetails) {
    row.minCapacity = binDetails.capacityMin || 0;
    row.maxCapacity = binDetails.capacityMax || 0;
    row.weight = binDetails.weight || 0; // Populate weight as well
    row.approvedWeight = binDetails.approvedWeight || 0; // Populate weight as well
  } else {
    row.minCapacity = 0;
    row.maxCapacity = 0;
    row.weight = 0;
    row.approvedWeight = 0;
  }
};



const fetchWeight = () => {
  axios.get('http://10.87.0.33:8082/api/SecondaryProcess')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "deleted"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'deleted');

        // Find the item with the matching jobId
        const matchingItem = activeNameData.find(item => item.jobId === editFormData.jobId);

        if (matchingItem) {
          // Set the weight in editFormData
          editFormData.weight = matchingItem.weight;
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

watch(() => editFormData.jobId, (newJobId) => {
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



const filteredBinOptionsForRow = (currentIndex: number) => {
  // Collect all selected bin IDs except for the current row
  const selectedBins = editFormData.machineJobRows
    .filter((row, index) => index !== currentIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin IDs
    .filter(Boolean); // Remove null or undefined values

  // Filter out bins that are already selected in other rows
  return editFormData.binData.filter(bin => !selectedBins.includes(bin.id));
};


const fetchBinsAndBinMaster = async (jobId: any) => {
  try {
    const [binsResponse, binMasterResponse] = await Promise.all([
      axios.get('http://10.87.0.33:8082/api/ListBins'),
      axios.get('http://10.87.0.33:8082/api/BinMaster'),
    ]);

    const binsData = binsResponse.data.result || [];
    const binMasterData = binMasterResponse.data.result || [];

    // Filter bins based on jobId, weight > 0, movement === 'OQC',
    // functionalCheck === 'Approve', and visualCheck1 === 'Approve'
    const filteredBins = binsData.filter(
      (bin: any) =>
        bin.mappingId === jobId &&
        bin.weight > 0 &&
        bin.movement === 'OQC' &&
        bin.functionalCheck?.toLowerCase() === 'approve' &&
        bin.visualCheck1?.toLowerCase() === 'approve'
    );

    // Log the filtered bins to the console
    console.log('Filtered Bins:', filteredBins);

    // Enrich bins with bin names from BinMaster data
    const enrichedBins = filteredBins.map((bin: any) => {
      const matchedBinMaster = binMasterData.find((bm: any) => bm.id === bin.binMasterId);
      return {
        ...bin,
        binName: matchedBinMaster ? matchedBinMaster.name : 'Bin Released',
      };
    });

    // Update the form data
    editFormData.bins = enrichedBins.map((bin: any) => bin.id);
    editFormData.binData = enrichedBins;
  } catch (error) {
    console.error('Error fetching bin data:', error);
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
        bin => bin.mappingId === jobId && bin.weight > 0 && (bin.type.lowecase() === 'packing')
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

        // Check if any field is empty or null
        const hasEmptyCheck = allChecks.some(check => check === null || check === undefined || check === '');

        let qcPass = 'Pending'; // Default to 'Pending'

        if (!hasEmptyCheck) {
          // If none of the fields are empty or null
          if (allChecks.every(check => check === 'Approve')) {
            qcPass = 'Pass'; // All checks are 'Approve'
          } else if (allChecks.includes('Reject')) {
            qcPass = 'Failed'; // At least one check is 'Reject'
          }
        }

        return {
          ...bin,
          binName: matchedBinMaster ? matchedBinMaster.name : 'Bin Released', // Add the bin name
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
const seteditModal = (value: any) => { editModal.value = value;



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


const fetchAndSetMachineJobs = async (jobId: any) => {
  if (!jobId) {
    console.error('Job ID is required to fetch machine jobs.');
    return;
  }

  try {
    editFormData.machineJobRows = [];
    editFormData.holdingBagRows = []; // Add a new array for holding bag rows

    // Ensure bins are loaded first
    if (!editFormData.binData || editFormData.binData.length === 0) {
      console.warn('Bin Data is empty. Fetching bins...');
      await fetchBinsAndBinMaster(jobId); // Ensure bins are fetched first
    }

    // Fetch machine jobs
    const machineJobsResponse = await axios.get('http://10.87.0.33:8082/api/Packing/GetPackingJobs');
    const machineJobsData = machineJobsResponse.data.result || [];
    const filteredMachineJobs = machineJobsData.filter((job: any) => job.jobId === jobId);

    const machineJobRows = filteredMachineJobs.map((job: any) => {
      const matchedBin = editFormData.binData.find(bin => bin.id === job.binCode);

      return {
        jobId: job.jobId,
        subJobId: job.subJobId,
        binCode: job.binCode,
        binName: matchedBin ? matchedBin.binName : 'Bin Released', // Map binName
        approvedWeight: job.approvedWeight,
        weight: job.weight,
        noofCartons: job.noofCartons,
        jobStatus: job.jobStatus,
        listofCartonsDetailsList: job.listofCartonsDetailsList || [],
      };
    });

    // Sort machine job rows by subJobId
    machineJobRows.sort((a: any, b: any) => {
      const aSubJobNumber = parseInt(a.subJobId.split('-')[1], 10);
      const bSubJobNumber = parseInt(b.subJobId.split('-')[1], 10);
      return aSubJobNumber - bSubJobNumber;
    });

    editFormData.machineJobRows = [...machineJobRows];

    // Fetch holding bags
    const holdingBagResponse = await axios.get('http://10.87.0.33:8082/api/HoldingBagList');
    const holdingBagData = holdingBagResponse.data.result || [];

    // Filter and sort the holding bags by bagId and subJobId
    const filteredHoldingBags = holdingBagData
      .filter((bag: any) => bag.jobId === jobId && bag.weight > 0) // Filter by jobId and weight > 0
      .sort((a: any, b: any) => {
        // Sort by subJobId first
        const aSubJobNumber = parseInt(a.subJobId.split('-')[1], 10);
        const bSubJobNumber = parseInt(b.subJobId.split('-')[1], 10);
        if (aSubJobNumber !== bSubJobNumber) {
          return aSubJobNumber - bSubJobNumber;
        }
        // Then sort by bagId as a secondary criteria
        if (!a.bagId) return 1; // Place items with empty bagId at the end
        if (!b.bagId) return -1;
        return a.bagId.localeCompare(b.bagId, undefined, { numeric: true });
      })
      .map((bag: any) => ({
        id: bag.id,
        jobId: bag.jobId,
        bagId: bag.bagId,
        subJobId: bag.subJobId,
        partNumber: bag.partNumber,
        weight: bag.weight,
        status: bag.status,
        createdDate: bag.created_date,
        updatedDate: bag.updated_date,
      }));

    editFormData.holdingBagRows = [...filteredHoldingBags]; // Add the filtered and sorted holding bags to the state
  } catch (error) {
    console.error('Error fetching machine jobs or holding bags:', error);
  }
};





const isBinCodeDropdownOpenPacking: Ref<boolean[]> = ref([]); // Tracks open/close state of each bin code dropdown in machineJobRows
const searchBinCodeQueryPacking: Ref<string[]> = ref([]); // Tracks search query for each row’s bin code



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

// Function to toggle dropdown open/close for Bin Code in Packing Job rows
const toggleBinCodeDropdownPacking = (rowIndex: number) => {
  if (!editFormData.machineJobRows[rowIndex].jobStatus.includes('Completed') && !editFormData.machineJobRows[rowIndex].jobStatus.includes('Submitted')) {
    isBinCodeDropdownOpenPacking.value[rowIndex] = !isBinCodeDropdownOpenPacking.value[rowIndex];
    searchBinCodeQueryPacking.value[rowIndex] = ''; // Clear search query when dropdown is opened
  }
};

// Function to select a Bin Code for Packing Job row
const selectBinCodePacking = (rowIndex: number, bin: { id: string; binName: string }) => {
  const row = editFormData.machineJobRows[rowIndex];
  row.binCode = bin.id; // Store bin ID as the value
  row.binName = bin.binName; // Store bin name to display
  isBinCodeDropdownOpenPacking.value[rowIndex] = false; // Close dropdown after selection

  // Update capacity values based on the selected bin
  updateCapacityValuesMachine(bin.id, row);
};

const filteredBinOptionsForRowPacking = (rowIndex: number) => {
  const selectedBins = editFormData.machineJobRows
    .filter((_, index) => index !== rowIndex) // Exclude the current row
    .map(row => row.binCode) // Collect selected bin codes
    .filter(Boolean); // Remove null or undefined values

  // Filter binData to exclude bins that are already selected in other rows
  let availableBins = editFormData.binData.filter(bin => !selectedBins.includes(bin.id));

  // Further filter based on the search query, if there’s input
  if (searchBinCodeQueryPacking.value[rowIndex]) {
    availableBins = availableBins.filter(bin =>
      bin.binName.toLowerCase().includes(searchBinCodeQueryPacking.value[rowIndex].toLowerCase())
    );
  }

  return availableBins;
};


// Fetch and Set Data for Edit/View
// Updated fetchAndSetData to wait for fetchBinId to complete before setting machine jobs
const fetchAndSetData = async (
  id: string,
  formData: any,
  modalSetter: (value: boolean) => void,
  isView: boolean = false
): Promise<void> => {
  loading.value = true; // Start loading animation

  try {
    const response = await axios.get(`${API_BASE_URL}${id}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      const [firstItem] = data;
      const filteredBins = firstItem.listBins
        ? firstItem.listBins.filter((bin: any) => bin.status !== 'deleted')
        : [];

      // Update formData with the fetched data
      Object.assign(formData, {
        id: firstItem.id,
        jobId: firstItem.jobId,
        shift: firstItem.shift,
        productCode: firstItem.productCode,
        weight: firstItem.weight,
        approvedWeight: firstItem.approvedWeight,
        jobStatus: firstItem.jobStatus,
        totalWeight: firstItem.totalWeight || formData.totalWeight,
      });

      // Fetch bins and machine jobs in sequence
      await fetchBinsAndBinMaster(firstItem.jobId); // Fetch and update binData
      await fetchAndSetMachineJobs(firstItem.jobId); // Fetch machine jobs and map bin names

      modalSetter(true); // Open the modal
    } else {
      console.error('No data found for the specified ID:', id);
    }
  } catch (error) {
    handleError(error, 'Error fetching data for editing');
  } finally {
    loading.value = false; // End loading animation
  }
};







const editRole = (machineId: string) => {
  resetEditFormData(); // Reset the form before fetching new data
  fetchAndSetData(machineId, editFormData, seteditModal);

};

const viewRole = async (id: string) => {
  resetEditFormData(); // Clear previous data
  await fetchAndSetData(id, editFormData, setviewModal, true); // Fetch and set data
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
    binData: [], // Reset bin data
    machineJobRows: [], // Reset machine job rows
    bins: [], // Reset selected bin IDs
  });
};


function formatNumber(value: any) {
  return String(value).padStart(2, '0');
}


// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises: Promise<any>[] = [
    axios.get(API_BASE_URL).then(response => {
      // Filter out data with status "deleted" but keep "Completed" jobs for filtering in Tabulator
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: "Pending" status first, then by jobId in ascending order (smallest jobId first)
      const sortedData = filteredData.sort((a: any, b: any) => {
        const aJobStatus = a.jobStatus.toUpperCase();
        const bJobStatus = b.jobStatus.toUpperCase();

        // Move "Pending" jobs to the top
        if (aJobStatus === 'PENDING' && bJobStatus !== 'PENDING') return -1;
        if (aJobStatus !== 'PENDING' && bJobStatus === 'PENDING') return 1;

        // Sort by jobId numerically (smallest to largest)
        const jobIdA = parseInt(a.jobId.substring(1)); // Assuming jobId format starts with a letter (e.g., "J123")
        const jobIdB = parseInt(b.jobId.substring(1));

        return jobIdA - jobIdB;
      });

      console.log(sortedData);

      // Populate the table with sorted data
      if (tabulator.value) {
        tabulator.value.setData(sortedData);
        tabulator.value.setFilter((item) => item.jobStatus.toUpperCase() !== 'COMPLETED'); // Exclude "Completed" jobs
      }
    }),

    // Wrap non-promise functions with `Promise.resolve()` to make them promises
    Promise.resolve(fetchNamesShift()),
    Promise.resolve(fetchMachineId()),
    Promise.resolve(fetchWeight()),
    Promise.resolve(fetchMovement()),
    Promise.resolve(fetchProductCodes()),
    Promise.resolve(fetchMachinePP()),
    Promise.resolve(fetchMachineBlow()),
    Promise.resolve(fetchWM())
  ];

  // Wait for all promises to complete
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize Tabulator and other non-async functions
  initTabulator();
  reInitOnResizeWindow();
};

const updateTableDataHolding = () => {
  loading.value = true; // Show loading modal at the start

  axios.get(API_BASE_URL_HOLDING)
    .then(response => {
      // Filter out items where the status is 'InActive' or the weight is less than or equal to 0
      const filteredData = response.data.result.filter((item: any) =>
        item.status !== 'InActive' && item.weight > 0
      );

      console.log('Filtered Data:', filteredData);

      if (tabulatorHolding.value) {
        tabulatorHolding.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal after data is processed
    });

  initTabulatorHolding();
  reInitOnResizeWindow();
};




const addMachineJobRow = () => {
  const newSubJobId = `${editFormData.jobId}-${editFormData.machineJobRows.length + 1}`;

  const newRow = {
    jobId: editFormData.jobId || '',
    subJobId: newSubJobId,
    binCode: '',
    binName: '',
    weight: 0,
    approvedWeight: 0,
    noofCartons: 0,
    jobStatus: 'Pending',
    listofCartonsDetailsList: [], // Initialize empty list of cartons
  };

  editFormData.machineJobRows.push(newRow);
};


// Function to delete a wet job row
const deleteMachineJobRow = (index: number) => {
  editFormData.machineJobRows.splice(index, 1);
};


const submitAllPendingPackingJobs = async () => {
  formSubmitted.value = true;

  // Filter rows with a status of "Pending"
  const pendingRows = editFormData.machineJobRows.filter(row => row.jobStatus === 'Pending');

  // Validate Bin Name
  const invalidRows = pendingRows.filter(row => !row.binCode);

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
        binCode: row.binCode,
        weight: row.weight,
        approvedWeight: row.approvedWeight,
        noofCartons: row.noofCartons,
        status: row.jobStatus,
      };

      // Log the payload
      console.log('Submitting Job Payload:', JSON.stringify(jobPayload, null, 2));

      return axios.post(`${API_BASE_URL}SubmitPackingJob`, jobPayload)
        .then(response => {
          console.log('Job Submission Response:', response.data);
          row.jobStatus = 'Submitted'; // Update status to "Submitted"
        })
        .catch(error => {
          console.error('Error submitting job:', error);
          row.jobStatus = 'Error'; // Mark the row as "Error" if submission fails
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

const submitMachineJobRow = async (row: any) => {
  formSubmitted.value = true;

  // Validate Bin Name
  if (!row.binCode) {
    Swal.fire({
      icon: 'error',
      title: 'Please complete the field',
      text: 'Bin Name is required.',
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
    binCode: row.binCode,
    weight: row.weight,
    approvedWeight: row.approvedWeight,
    noofCartons: row.noofCartons,
    status: row.jobStatus,
  };

  // Log the payload JSON to the console
  console.log('Payload to be submitted:', JSON.stringify(jobPayload, null, 2));

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
    const jobResponse = await axios.post(`${API_BASE_URL}SubmitPackingJob`, jobPayload);
    console.log('Job Submission Response:', jobResponse.data);

    // Update the status of the row to "Submitted" directly
    row.jobStatus = 'Submitted';

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


  const payload = {
    id: String(editFormData.id || ''),  // Assuming 'id' comes from the form data
    whiteSlipId: String(editFormData.jobId),  // Use the jobId as whiteSlipId
    shift: String(editFormData.shift),  // Shift as string
    weight: editFormData.weight,  // Assuming totalWeight corresponds to weight
    approvedWeight: editFormData.approvedWeight,  // Approved weight
    productCode: String(editFormData.productCode),  // Product code
    jobStatus: String(editFormData.jobStatus),  // Job status

    // Update listBinsListforPackingList
    listBinsListforPackingList: [{
      movement: 'Packing',
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




// Define the computed property using Vue's Composition API
const hasValidCartons = computed(() => {
  return editFormData.machineJobRows.some(row => row.listofCartonsDetailsList && row.listofCartonsDetailsList.length > 0);
});


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
    row => row.jobStatus === 'Pending' || row.jobStatus === 'Submitted'
  );


  // Disable if there are pending/submitted jobs or if bins list is empty or QC is incomplete
  return hasPendingOrSubmittedJobs
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






// watch(
//   () => editFormData.listBins,
//   (newBins) => {
//     const totalProcessedWeight = newBins.reduce((acc, bin) => acc + (bin.weight || 0), 0);
//     editFormData.processedWeight = totalProcessedWeight;
//     editFormData.waste = editFormData.totalWeight - editFormData.processedWeight;
//   },
//   { deep: true }
// );

// watch(
//   () => editFormData.totalWeight,
//   (newWeight) => {
//     editFormData.waste = newWeight - editFormData.processedWeight;
//   }
// );

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
    <h2 class="mr-auto text-lg font-medium">Packing</h2>

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
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Holding Bag List</h2>

  </div>
  <!-- BEGIN: HTML Table Data -->
  <div class="p-5 mt-5 intro-y box">
    <div class="flex flex-col sm:flex-row sm:items-end xl:items-start">
      <form id="tabulator-html-filter-form" class="xl:flex sm:mr-auto" @submit="(e) => {
        e.preventDefault();
        onFilterHolding();
      }
        ">
        <div class="items-center sm:flex sm:mr-4">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Field
          </label>
          <FormSelect id="tabulator-html-filter-field" v-model="filter.field"
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto">
            <option value="bagId">Bag ID</option>
            <option value="jobId">Job ID</option>
            <option value="subJobId">Sub Job ID</option>
            <option value="partNumber">Part Number</option>
          </FormSelect>
        </div>
        <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0 " style="display:none">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Type
          </label>
          <FormSelect id="tabulator-html-filter-type" v-model="filter.type" class="w-full mt-2 sm:mt-0 sm:w-auto">
            <option value="like">like</option>

          </FormSelect>
        </div>
        <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Value
          </label>
          <FormInput id="tabulator-html-filter-value" v-model="filter.value" type="text"
            class="mt-2 sm:w-40 2xl:w-full sm:mt-0" placeholder="Search..." />
        </div>
        <div class="mt-2 xl:mt-0">
          <Button id="tabulator-html-filter-go" variant="primary" type="button" class="w-full sm:w-16"
            @click="onFilterHolding">
            Go
          </Button>
          <Button id="tabulator-html-filter-reset" variant="secondary" type="button"
            class="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1" @click="onResetFilterHolding">
            Reset
          </Button>
        </div>
      </form>

    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulatorHolding" ref="tableRefHolding" class="mt-5"></div>
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
          Edit Packing
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
            <FormLabel htmlFor="regular-form-8">Weight</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Weight" step="any"
              disabled />
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
  <h6 class="text-lg font-medium leading-none dark:text-gray-300">Packing Job Details</h6>
  <button
    type="button"
    @click="submitAllPendingPackingJobs"
    class="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500"
  >
    Submit All Pending
  </button>
</div>

  <hr class="dark:border-gray-700" />
  <div v-if="editFormData.machineJobRows.length > 0" class="mt-3">
    <table class="min-w-full border-collapse rounded-lg shadow-sm">
      <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
        <tr>
          <th class="py-2 px-4 border-b text-center rounded-tl-lg dark:border-gray-700">No.</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700"></th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bin ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Status</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Delete</th>
          <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Submit</th>
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
          <td class="py-2 px-4 border-b hidden dark:border-gray-700">
            <FormInput v-model="row.jobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.subJobId" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>
          <td class="py-2 px-4 border-b dark:border-gray-700">
  <div class="relative">
    <!-- Dropdown Trigger for Bin Code -->
    <div @click="toggleBinCodeDropdownPacking(index)"
      :class="['cursor-pointer p-2 border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.binCode, 'cursor-not-allowed opacity-50': row.jobStatus === 'Completed' || row.jobStatus === 'Submitted' }]">
      {{ row.binName || 'Select a Bin Name' }}
    </div>

    <!-- Dropdown Content for Bin Code -->
    <div v-if="isBinCodeDropdownOpenPacking[index]"
      class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
      <!-- Searchable Input for Bin Code -->
      <input type="text" v-model="searchBinCodeQueryPacking[index]" placeholder="Search Bin Name"
        class="border-b border-gray-300 p-2 w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300" />

      <!-- Filtered Bin Code Options -->
      <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
        <li v-for="bin in filteredBinOptionsForRowPacking(index)" :key="bin.id"
          @click="selectBinCodePacking(index, bin)"
          class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
          {{ bin.binName }}
        </li>
        <li v-if="filteredBinOptionsForRowPacking(index).length === 0"
          class="p-2 text-gray-500 dark:text-gray-400">No results found</li>
      </ul>
    </div>
  </div>
  <span v-if="formSubmitted && !row.binCode" class="text-red-500">Bin Name is required!</span>
</td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.weight" type="number"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>

          <td class="py-2 px-4 border-b dark:border-gray-700">
            <FormInput v-model="row.jobStatus" type="text"
              class="w-full px-2 py-1 border rounded dark:bg-gray-800 dark:text-gray-300" disabled />
          </td>

          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button @click="deleteMachineJobRow(index)"
              :disabled="row.jobStatus === 'Completed' || row.jobStatus === 'Submitted'"
              :class="{ 'text-gray-400': row.jobStatus === 'Completed' || row.jobStatus === 'Submitted', 'text-red-600 hover:text-red-800 dark:hover:text-red-400': row.jobStatus !== 'Completed' && row.jobStatus !== 'Submitted' }">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-700">
            <button type="button" @click="submitMachineJobRow(row)"
              :class="{
                'bg-blue-700 hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-500': row.jobStatus !== 'Completed' && row.jobStatus !== 'Submitted',
                'bg-gray-400 cursor-not-allowed': row.jobStatus === 'Completed' || row.jobStatus === 'Submitted'
              }" class="my-2 mx-2 px-4 py-2 text-white rounded" :disabled="row.jobStatus === 'Completed' || row.jobStatus === 'Submitted'">
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


<div v-if="hasValidCartons" >
  <div v-for="(row, index) in editFormData.machineJobRows" :key="index">
    <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden dark:border-gray-700" v-if="row.listofCartonsDetailsList && row.listofCartonsDetailsList.length > 0">
      <h6 class="mb-2 mt-2 text-lg font-medium leading-none dark:text-gray-300">
        Carton and Bag Details for Sub Job: {{ row.subJobId }}
      </h6>
      <hr class="dark:border-gray-700" />

      <!-- Show only if listofCartonsDetailsList is not null and has items -->
      <template v-if="row.listofCartonsDetailsList && row.listofCartonsDetailsList.length > 0">
        <template v-for="(carton, cartonIndex) in row.listofCartonsDetailsList" :key="cartonIndex">
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden dark:border-gray-700">
            <!-- Table for each individual carton and its bags -->
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
              <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  <th class="py-2 px-4 border-b text-center rounded-tl-lg dark:border-gray-700">No.</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Carton ID</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Carton Type</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">No of Bags</th>
                  <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
                  <th class="py-2 px-4 border-b text-center rounded-tr-lg dark:border-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                <!-- Carton Row -->
                <tr class="hover:bg-gray-100 dark:hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ cartonIndex + 1 }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ carton.cartonId }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ carton.cartonType }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ carton.noofBags }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ carton.weight }}
                  </td>
                  <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                    {{ carton.status }}
                  </td>
                </tr>

                <!-- Bags Details for the current carton -->
                <tr v-if="carton.listofBagsListforPacking.length > 0">
                  <td colspan="6" class="pt-4">
                    <!-- Title for Bags -->
                    <h5 class="text-center text-md font-medium mb-2 dark:text-gray-300">
                      Bags Details for Carton {{ carton.cartonId }}
                    </h5>

                    <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-2">
                      <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
                        <tr>
                          <th class="py-2 px-4 border-b text-center dark:border-gray-700">No</th>
                          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bag ID</th>
                          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bag Type</th>
                          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(bag, bagIndex) in carton.listofBagsListforPacking" :key="bagIndex"
                          class="hover:bg-gray-100 dark:hover:bg-gray-100">
                          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                            {{ bagIndex + 1 }}
                          </td>
                          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                            {{ bag.bagId }}
                          </td>
                          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                            {{ bag.bagType }}
                          </td>
                          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
                            {{ bag.weight }}
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
      </template>
    </div>
  </div>
</div>



<div class="mt-5 border py-5 px-3 rounded-lg dark:border-gray-700" v-if="editFormData.holdingBagRows.length > 0">
  <h6 class="mb-2 mt-2 text-lg font-medium leading-none dark:text-gray-300">Holding Bag List</h6>
  <hr class="dark:border-gray-700" />
  <div class="mt-3">
    <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
      <thead class="bg-primary text-white dark:bg-gray-800 dark:text-gray-300">
        <tr>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">No.</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Bag ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Sub Job ID</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Part Number</th>
          <th class="py-2 px-4 border-b text-center dark:border-gray-700">Weight</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(bag, index) in editFormData.holdingBagRows" :key="bag.id"
          class="hover:bg-gray-100 dark:hover:bg-gray-100">
          <!-- Bag ID -->
          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
            {{ index + 1}}
          </td>
          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
            {{ bag.bagId || 'N/A' }}
          </td>

          <!-- Sub Job ID -->
          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
            {{ bag.subJobId || 'N/A' }}
          </td>

          <!-- Part Number -->
          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
            {{ bag.partNumber || 'N/A' }}
          </td>

          <!-- Weight -->
          <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">
            {{ bag.weight }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
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
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ index + 1 }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ bin.binName }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ bin.subJobId }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ bin.mappingId }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ bin.weight }}</td>
        <td class="py-2 px-4 border-b text-center dark:border-gray-600 dark:text-gray-300">{{ bin.qcPass }}</td>
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
          <!-- Display Machine ID and Overall Status -->
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

      <!-- Product Code Row -->
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Product Code
        </th>
        <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
          {{ editFormData.productCode || 'N/A' }}
        </td>
      </tr>

      <!-- Weight Row -->
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Weight
        </th>
        <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
          {{ editFormData.weight || 'N/A' }}
        </td>
      </tr>

      <!-- Job Status Row -->
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <th scope="row" class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Job Status
        </th>
        <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
          {{ editFormData.jobStatus || 'N/A' }}
        </td>
      </tr>
    </tbody>
  </table>
</div>

<!-- Machine Job Rows Section -->
<div class="mt-5 border py-5 px-3 rounded-lg">
  <h6 class="mb-2 mt-2 text-lg font-medium leading-none">Packing Job Details</h6>
  <hr>
  <div v-if="editFormData.machineJobRows.length > 0" class="mt-3">
    <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
      <thead class="bg-primary text-white">
        <tr>
          <th class="py-2 px-4 border-b text-center">Sub Job ID</th>
          <th class="py-2 px-4 border-b text-center">Bin ID</th>
          <th class="py-2 px-4 border-b text-center">Weight</th>
          <th class="py-2 px-4 border-b text-center">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, index) in editFormData.machineJobRows" :key="index" class="hover:bg-gray-100">
          <!-- Sub Job ID Row -->
          <td class="py-2 px-4 border-b text-center">
            {{ row.subJobId }}
          </td>

          <!-- Bin ID Row -->
          <td class="py-2 px-4 border-b text-center">
            {{ row.binName || 'N/A' }}
          </td>

          <!-- Weight Row -->
          <td class="py-2 px-4 border-b text-center">
            {{ row.weight || 'N/A' }}
          </td>

          <!-- Status Row -->
          <td class="py-2 px-4 border-b text-center">
            {{ row.jobStatus || 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
<div v-if="hasValidCartons">

<div v-for="(row, index) in editFormData.machineJobRows" :key="index">
  <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden" v-if="row.listofCartonsDetailsList && row.listofCartonsDetailsList.length > 0">
    <h6 class="mb-2 mt-2 text-lg font-medium leading-none">Carton and Bag Details for Sub Job: {{
      row.subJobId }}</h6>
    <hr />

    <!-- Show only if listofCartonsDetailsList is not null and has items -->
    <template v-if="row.listofCartonsDetailsList && row.listofCartonsDetailsList.length > 0">
      <template v-for="(carton, cartonIndex) in row.listofCartonsDetailsList" :key="cartonIndex">
        <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
          <!-- Table for each individual carton and its bags -->
          <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
            <thead class="bg-primary text-white">
              <tr>
                <th class="py-2 px-4 border-b text-center rounded-tl-lg">Carton ID</th>
                <th class="py-2 px-4 border-b text-center">Carton Type</th>
                <th class="py-2 px-4 border-b text-center">No of Bags</th>
                <th class="py-2 px-4 border-b text-center">Weight</th>
                <!-- <th class="py-2 px-4 border-b text-center">Sticker</th> -->
                <th class="py-2 px-4 border-b text-center rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              <!-- Carton Row -->
              <tr class="hover:bg-gray-100">
                <td class="py-2 px-4 border-b text-center">{{ carton.cartonId }}</td>
                <td class="py-2 px-4 border-b text-center">{{ carton.cartonType }}</td>
                <td class="py-2 px-4 border-b text-center">{{ carton.noofBags }}</td>
                <td class="py-2 px-4 border-b text-center">{{ carton.weight }}</td>
                <!-- <td class="py-2 px-4 border-b text-center">{{ carton.sticker }}</td> -->
                <td class="py-2 px-4 border-b text-center">{{ carton.status }}</td>
              </tr>

              <!-- Bags Details for the current carton -->
              <tr v-if="carton.listofBagsListforPacking.length > 0">
                <td colspan="6" class="pt-4">
                  <!-- Title for Bags -->
                  <h5 class="text-center text-md font-medium mb-2">Bags Details for Carton {{
                    carton.cartonId }}</h5>

                  <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-2">
                    <thead class="bg-primary text-white">
                      <tr>
                        <th class="py-2 px-4 border-b text-center">Bag ID</th>
                        <th class="py-2 px-4 border-b text-center">Bag Type</th>
                        <th class="py-2 px-4 border-b text-center">Weight</th>
                        <!-- <th class="py-2 px-4 border-b text-center">Sticker</th> -->
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(bag, bagIndex) in carton.listofBagsListforPacking" :key="bagIndex"
                        class="hover:bg-gray-100">
                        <td class="py-2 px-4 border-b text-center">{{ bag.bagId }}</td>
                        <td class="py-2 px-4 border-b text-center">{{ bag.bagType }}</td>
                        <td class="py-2 px-4 border-b text-center">{{ bag.weight }}</td>
                        <!-- <td class="py-2 px-4 border-b text-center">{{ bag.sticker }}</td> -->
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </div>
</div>
</div>

<div class="mt-5 border py-5 px-3 rounded-lg" v-if="editFormData.holdingBagRows.length > 0" >
  <h6 class="mb-2 mt-2 text-lg font-medium leading-none">Holding Bag List</h6>
  <hr>
  <div v-if="editFormData.holdingBagRows.length > 0" class="mt-3">
    <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
      <thead class="bg-primary text-white">
        <tr>
          <th class="py-2 px-4 border-b text-center">Bag ID</th>
          <th class="py-2 px-4 border-b text-center">Sub Job ID</th>
          <th class="py-2 px-4 border-b text-center">Part Number</th>
          <th class="py-2 px-4 border-b text-center">Weight</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(bag, index) in editFormData.holdingBagRows" :key="bag.id" class="hover:bg-gray-100">
          <!-- Bag ID -->
          <td class="py-2 px-4 border-b text-center">
            {{ bag.bagId || 'N/A' }}
          </td>

          <!-- Sub Job ID -->
          <td class="py-2 px-4 border-b text-center">
            {{ bag.subJobId || 'N/A' }}
          </td>

          <!-- Part Number -->
          <td class="py-2 px-4 border-b text-center">
            {{ bag.partNumber || 'N/A' }}
          </td>

          <!-- Weight -->
          <td class="py-2 px-4 border-b text-center">
            {{ bag.weight }}
          </td>


        </tr>
      </tbody>
    </table>
  </div>
</div>

<!-- List of Bins Section -->
<div v-if="editFormData.binDataB && editFormData.binDataB.length > 0" class="mt-5">
  <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List of Bins</h6>
  <hr />
  <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-4">
    <thead class="bg-primary text-white">
      <tr>
        <th class="py-2 px-4 border-b text-center">No.</th>
        <th class="py-2 px-4 border-b text-center">Bin Name</th>
        <th class="py-2 px-4 border-b text-center">Sub Job ID</th>
        <th class="py-2 px-4 border-b text-center">Job ID</th>
        <th class="py-2 px-4 border-b text-center">Weight</th>
        <th class="py-2 px-4 border-b text-center">QC Pass</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(bin, index) in editFormData.binDataB" :key="bin.id" class="hover:bg-gray-100">
        <td class="py-2 px-4 border-b text-center">{{ index + 1 }}</td>
        <td class="py-2 px-4 border-b text-center">{{ bin.binName || 'N/A' }}</td>
        <td class="py-2 px-4 border-b text-center">{{ bin.subJobId || 'N/A' }}</td>
        <td class="py-2 px-4 border-b text-center">{{ bin.mappingId || 'N/A' }}</td>
        <td class="py-2 px-4 border-b text-center">{{ bin.weight || 'N/A' }}</td>
        <td class="py-2 px-4 border-b text-center">{{ bin.qcPass || 'N/A' }}</td>
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