<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';

interface Response {
  id?: string;
  holdingBagId?: string;
  date?: string;
  resourceCode?: string;
  shift?: string;
  sku?: string;
  weight?: any;
  status?: string;
  jobStatus?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  holdingBagId: "",
  jobStatus: "",
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
          title: "Holding Bag ID",
          minWidth: 160,
          responsive: 0,
          field: "holdingBagId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.holdingBagId}</div>
              </div>`;
          },
        },
        {
          title: "Package Holding Date",
          minWidth: 240,
          responsive: 0,
          field: "date",
          vertAlign: "middle",
          visible: false,
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.date);

            const pad = (n: any) => (n < 10 ? '0' + n : n);

            const day = pad(fullDate.getDate());
            const month = pad(fullDate.getMonth() + 1);
            const year = fullDate.getFullYear();
            const hours = fullDate.getHours() % 12 || 12;
            const minutes = pad(fullDate.getMinutes());
            const seconds = pad(fullDate.getSeconds());
            const ampm = fullDate.getHours() >= 12 ? 'PM' : 'AM';

            const formattedDate = `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;

            return `<div>
            <div class="font-medium whitespace-nowrap">${formattedDate}</div>
        </div>`;
          },
        },
        {
          title: "Resource ID",
          minWidth: 150,
          responsive: 0,
          field: "resourceCode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.resourceCode}</div>
              </div>`;
          },
        },
        {
          title: "Shift",
          minWidth: 120,
          responsive: 0,
          field: "shift",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.shift}</div>
              </div>`;
          },
        },
        {
          title: "SKU",
          minWidth: 120,
          responsive: 0,
          field: "sku",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.sku}</div>
              </div>`;
          },
        },
        {
          title: "Weight",
          minWidth: 120,
          responsive: 0,
          field: "weight",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
    const response = cell.getData();
    const weight = response.weight ? response.weight : 'N/A';
    return `<div>
              <div class="font-medium whitespace-nowrap">${weight}</div>
            </div>`;
  },
        },
        {
          title: "Status",
          minWidth: 150,
          responsive: 0,
          field: "status",
          vertAlign: "middle",
          visible: false,
          print: false,
          download: false,
          formatter: function (cell, formatterParams, onRendered) {
            const status = cell.getValue();
            let statusClass = '';

            switch (status) {
              case 'Completed':
                statusClass = 'bg-green-100 text-green-800 border-green-400';
                break;
              case 'In Progress':
                statusClass = 'bg-cyan-100 text-cyan-800 border-cyan-700';
                break;
              case 'Faulted':
                statusClass = 'bg-red-100 text-red-800 border-red-400';
                break;
              case 'Not Started':
                statusClass = 'bg-orange-100 text-orange-800 border-orange-400';
                break;
            }

            return `<div class="flex items-center lg:justify-center ${statusClass} text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:${status === 'submitted' ? 'text-green-400' : 'text-yellow-400'} border">
      ${status}
    </div>`;
          },
        },
        {
          title: "Job Status",
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
                  statusClass = 'bg-green-100 text-green-800 border-green-400';
                  break;
                case 'In Progress':
                  statusClass = 'bg-cyan-100 text-cyan-800 border-cyan-700';
                  break;
                case 'Faulted':
                  statusClass = 'bg-red-100 text-red-800 border-red-400';
                  break;
                case 'Not Started':
                  statusClass = 'bg-orange-100 text-orange-800 border-orange-400';
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
            container.classList.add("flex", "items-center", "lg:justify-center", "flex-col"); // Added flex-col class for vertical stacking

            const response = cell.getData();
            const editLink = document.createElement("a");
            editLink.classList.add("flex", "items-center", "mr-3", "text-blue-500");
            editLink.href = "#";
            editLink.addEventListener("click", (event) => {
              event.preventDefault();
              editRole(response.id);
            });

            const editIcon = document.createElement("i");
            editIcon.classList.add("fa-regular", "fa-pen-to-square", "pr-2");
            editLink.appendChild(editIcon);
            editLink.appendChild(document.createTextNode("Edit"));
            container.appendChild(editLink);

            // Render "Delete" link
            // const deleteLink = document.createElement("a");
            // deleteLink.classList.add("flex", "items-center", "text-danger");
            // deleteLink.href = "javascript:;";
            // deleteLink.addEventListener("click", function () {
            //   deleteRole(response.id); // Call the delete function
            // });

            // const deleteIcon = document.createElement("i");
            // deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
            // deleteLink.appendChild(deleteIcon);
            // deleteLink.appendChild(document.createTextNode("Delete"));
            // container.appendChild(deleteLink);


            const viewLink = document.createElement("a");
            viewLink.classList.add("flex", "items-center", "mr-3");
            viewLink.href = "#";
            viewLink.addEventListener("click", (event) => {
              event.preventDefault();
              viewRole(response.id);
            });

            const viewIcon = document.createElement("i");
            viewIcon.classList.add("fa-regular", "fa-eye", "pr-2");
            viewLink.appendChild(viewIcon);
            viewLink.appendChild(document.createTextNode("View"));
            container.appendChild(viewLink);
            // Render "View" link

            return container;
          },
        },


        {
          title: "Holding Bag ID",
          field: "holdingBagId",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Package Holding Date",
          field: "date",
          visible: false,
          print: true,
          download: true,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.date);

            const pad = (n: any) => (n < 10 ? '0' + n : n);

            const day = pad(fullDate.getDate());
            const month = pad(fullDate.getMonth() + 1);
            const year = fullDate.getFullYear();
            const hours = fullDate.getHours() % 12 || 12;
            const minutes = pad(fullDate.getMinutes());
            const seconds = pad(fullDate.getSeconds());
            const ampm = fullDate.getHours() >= 12 ? 'PM' : 'AM';

            const formattedDate = `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;

            return `<div>
            <div class="font-medium whitespace-nowrap">${formattedDate}</div>
        </div>`;
          },
        },
        {
          title: "Resource ID",
          field: "resourceCode",
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
          title: "SKU",
          field: "sku",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Weight",
          field: "weight",
          visible: false,
          print: true,
          download: true,
          formatter(cell) {
    const weight = cell.getValue() ? cell.getValue() : 'N/A';
    return `<div class="font-medium whitespace-nowrap">${weight}</div>`;
  },
        },
        {
          title: "Job Status",
          field: "jobStatus",
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
                case 'In Progress':
                  textColor = 'text-cyan-600';
                  break;
                case 'Faulted':
                  textColor = 'text-red-600';
                  break;
                case 'Not Started':
                  textColor = 'text-orange-600';
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


const onHoldingBagId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("holdingBagId", 'like', filter.holdingBagId);
  }
};

const onStatus = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("jobStatus", 'like', filter.jobStatus);
  }
};

// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    holdingBagId: "",
    jobStatus: "",
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


const API_BASE_URL = 'http://10.87.0.33:8082/api/PackageHolding/';

onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Once data is received, populate the table
      console.log(response.data.result);
      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
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



// Form Data
const editFormData = reactive({
  id: null,
  holdingBagId: '',
  packageHoldingDate: '',
  resourceCode: '',
  shift: '',
  sku: '',
  weight: '',
  jobStatus: '',
  status: '',
});

const viewData = reactive({
  id: '',
  holdingBagId: '',
  date: formatDateView(new Date()),
  resourceCode: '',
  shift: '',
  sku: '',
  weight: '',
  jobStatus: '',
  status: '',
});

const addFormData = reactive({
  holdingBagId: '',
  date: formatDate(new Date()),
  resourceCode: '',
  shift: '',
  sku: '',
  weight: '',
  jobStatus: '',
  status: '',
});

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
const fetchAndSetData = (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      if (data && data.length > 0) {
        console.log('Retrieved Data:', data);
        const [firstItem] = data;
        Object.assign(formData, {
          id: firstItem.id,
          holdingBagId: firstItem.holdingBagId,
          date: firstItem.date || formatDate(new Date()),
          shift: firstItem.shift || '',
          resourceCode: firstItem.resourceCode || '',
          productCode: firstItem.productCode || '',
          sku: firstItem.sku || '',
          weight: firstItem.weight || '',
          status: firstItem.status || '',
          jobStatus: firstItem.jobStatus || '',
          preBlendweight: firstItem.preBlendweight || '',
        });
        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'));
};

const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
  axios.get(API_BASE_URL)
    .then(response => {
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');
      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => handleError(error, 'Error fetching updated data'));
};

const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};


// Update Role
const updateRole = () => {
  if (!editFormData.holdingBagId || !editFormData.sku || (!editFormData.resourceCode || !editFormData.shift || ( editFormData.weight && !isNumeric(editFormData.weight)))) {
    // If form is submitted but jobId is empty, show an alert to complete the form
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
    // Otherwise, proceed with the normal flow
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will update the data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
    }).then(result => {
      if (result.isConfirmed && editFormData.id) {
        axios.put(`${API_BASE_URL}${editFormData.id}`, { ...editFormData })
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


// Add Role
const addRole = () => {
  formSubmitted.value = true;
  if (formSubmitted.value && (!addFormData.holdingBagId || !addFormData.sku || !addFormData.resourceCode || !addFormData.shift || ( addFormData.weight && !isNumeric(addFormData.weight)))) {
    // If form is submitted but jobId is empty, show an alert to complete the form
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
    // Otherwise, proceed with the normal flow
    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to add this role?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, add it!',
    }).then(result => {
      if (result.isConfirmed) {
        axios.post(API_BASE_URL, { ...addFormData })
          .then(() => {
            setAddSlideover(false);
            resetFormData(addFormData);
            updateTableData();
            Swal.fire({
              icon: 'success',
              title: 'Role Added Successfully',
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
          .catch(error => handleError(error, 'Error adding role'));
      }
      formSubmitted.value = false;
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
  Object.keys(formData).forEach(key => formData[key] = '');
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
};

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

// Print

const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
  const el = toPrint.value;
  if (el) {
    const newPrint = window.open("");
    newPrint?.document.write(`
      <html>
        <head>
          <title>Package Holding</title>
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
</script>

<template>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Package Holding</h2>
    <!-- <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Package Holding
      </Button>

    </div> -->
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
              <FormInput id="tabulator-html-filter-id" v-model="filter.holdingBagId" type="text" class="mt-2 w-full"
                placeholder="Search Job ID..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="onHoldingBagId">Job ID</Button>
            </div>
          </div>
        </div>


        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-12 xl:w-auto xl:flex-initial">Status</label>
            <div class="relative">
              <FormSelect id="tabulator-html-filter-id" v-model="filter.jobStatus" class="mt-2 w-full"
                aria-label="Default select example">
                <option disabled value="">Select a Job Status Option</option>
                <option selected>Completed</option>
                <option>In Progress</option>
                <option>Faulted</option>
                <option>Not Started</option>

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
  <!-- END: HTML Table Data -->
  <Slideover :open="addSlideover" @close="() => {
    setAddSlideover(false);
  }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Add Package Holding
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Holding Bag ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.holdingBagId }" id="regular-form-1" v-model="addFormData.holdingBagId" type="text" placeholder="Holding Bag ID" />
            <span v-if="formSubmitted && !addFormData.holdingBagId" class="text-red-500">Holding Bag ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Resource ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.resourceCode }" id="regular-form-1" v-model="addFormData.resourceCode" type="text" placeholder="Resource ID" />
            <span v-if="formSubmitted && !addFormData.resourceCode" class="text-red-500">Resource ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Shift</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.shift }" v-model="addFormData.shift"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option>shift1</option>
              <option>shift2</option>
              <option>shift3</option>
              <option>shift4</option>
            </FormSelect>
            <span v-if="formSubmitted && addFormData.shift === ''" class="text-red-500">Please choose a Shift!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">SKU</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.sku }" id="regular-form-1" v-model="addFormData.sku" type="text" placeholder="SKU" />
            <span v-if="formSubmitted && !addFormData.sku" class="text-red-500">SKU is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="weight">Weight</FormLabel>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && addFormData.weight && !isNumeric(addFormData.weight) }"
              id="weight" v-model="addFormData.weight" type="text" placeholder="Weight" />
            <!-- Display error message if weight is provided but not numeric -->
            <span v-if="formSubmitted && addFormData.weight && !isNumeric(addFormData.weight)"
              class="text-red-500">Weight must be a valid number!</span>
          </div>
            <!-- Job Status -->
            <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Job Status</FormLabel>
            <FormSelect v-model="addFormData.jobStatus" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Faulted</option>
              <option>Not Started</option>
            </FormSelect>
          </div>
          <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
            Submit
          </Button>
        </form>
      </Slideover.Description>
      <Slideover.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
          setAddSlideover(false);
        }
          " class="w-20 mr-1">
          Cancel
        </Button>

      </Slideover.Footer>
    </Slideover.Panel>
  </Slideover>
  <Slideover :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Package Holding
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Holding Bag ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500':  !editFormData.holdingBagId }" id="regular-form-1" v-model="editFormData.holdingBagId" type="text" placeholder="Holding Bag ID" />
            <span v-if="!editFormData.holdingBagId" class="text-red-500">Holding Bag ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Resource ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500':  !editFormData.resourceCode }" id="regular-form-1" v-model="editFormData.resourceCode" type="text" placeholder="Resource ID" />
            <span v-if=" !editFormData.resourceCode" class="text-red-500">Resource ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Shift</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500':  !editFormData.shift }" v-model="editFormData.shift"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option>shift1</option>
              <option>shift2</option>
              <option>shift3</option>
              <option>shift4</option>
            </FormSelect>
            <span v-if=" editFormData.shift === ''" class="text-red-500">Please choose a Shift!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">SKU</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500':  !editFormData.sku }" id="regular-form-1" v-model="editFormData.sku" type="text" placeholder="SKU" />
            <span v-if=" !editFormData.sku" class="text-red-500">SKU is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="weight">Weight</FormLabel>
            <FormInput
              :class="{ 'border-red-500':  editFormData.weight && !isNumeric(editFormData.weight) }"
              id="weight" v-model="editFormData.weight" type="text" placeholder="Weight" />
            <!-- Display error message if weight is provided but not numeric -->
            <span v-if=" editFormData.weight && !isNumeric(editFormData.weight)"
              class="text-red-500">Weight must be a valid number!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>In Progress</option>
              <option>Faulted</option>
              <option>Not Started</option>
            </FormSelect>
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
          View Packgage Holding
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg" ref="toPrint">
          <div class="lg:flex lg:flex-row">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Holding Bag ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.holdingBagId }}
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
                   Shift
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.shift }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                    Resource ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.resourceCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                    SKU
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white dark:text-white ">
                    {{ viewData.sku }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary  dark:bg-gray-800">
                    Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.weight }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span :class="{
                        'text-green-600': viewData.jobStatus === 'Completed',
                        'text-cyan-600': viewData.jobStatus === 'In Progress',
                        'text-red-600': viewData.jobStatus === 'Faulted',
                        'text-orange-600': viewData.jobStatus === 'Not Started',
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
