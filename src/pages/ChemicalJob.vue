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

interface Response {
  machineId?: string;
  status?: string;
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
    container.classList.add("flex", "items-center", "lg:justify-center", "flex-col");

    const response = cell.getData();
    const machineCode = response.machineId;

    // Check if the machine has any jobs
    if (response.status !== "No Jobs") {
      const editLink = document.createElement("a");
      editLink.classList.add("flex", "items-center", "mr-3", "text-blue-500");
      editLink.href = "#";
      editLink.addEventListener("click", (event) => {
        event.preventDefault();
        editRole(machineCode); // Pass machineId here
      });

      const editIcon = document.createElement("i");
      editIcon.classList.add("fa-regular", "fa-pen-to-square", "pr-2");
      editLink.appendChild(editIcon);
      editLink.appendChild(document.createTextNode("Edit"));
      container.appendChild(editLink);

      const viewLink = document.createElement("a");
      viewLink.classList.add("flex", "items-center", "mr-3");
      viewLink.href = "#";
      viewLink.addEventListener("click", (event) => {
        event.preventDefault();
        viewRole(machineCode); // Pass machineId here
      });

      const viewIcon = document.createElement("i");
      viewIcon.classList.add("fa-regular", "fa-eye", "pr-2");
      viewLink.appendChild(viewIcon);
      viewLink.appendChild(document.createTextNode("View"));
      container.appendChild(viewLink);
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
    tabulator.value.setFilter("status", 'like', filter.status);
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
  onFilter();
};

// Print
const onPrint = () => {
  if (tabulator.value) {
    tabulator.value.print();
  }
};


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/PostProdChemicalTreatment/GetChemicalTreatmentJobs';


onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Once data is received, populate the table
      console.log(filteredData);
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



const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};



interface JobItem {
  jobId: string;
  subJobId: string;
  machineCode: string;
  binCode: string;
  productCode: string;
  shift: string;
  weight: string;
  status: string;
}

const viewData = reactive<{
  jobs: JobItem[];

}>({
  jobs: [], // Initialize as an empty array of JobItem
});


const overallStatus = computed(() => {
  // Determine the overall status
  if (viewData.jobs.some(job => job.status === 'Submitted' || job.status === 'Pending')) {
    return 'Pending';
  } else if (viewData.jobs.every(job => job.status === 'Completed')) {
    return 'Completed';
  }
  return 'Unknown'; // In case no jobs or other statuses exist
});


const editFormStatus = computed(() => {
  // Determine the status of editFormData
  if (editFormData.jobs.some(job => job.status === 'Submitted' || job.status === 'Pending')) {
    return 'Pending';
  } else if (editFormData.jobs.every(job => job.status === 'Completed')) {
    return 'Completed';
  }
  return 'Unknown'; // In case no jobs or other statuses exist
});



// Form Data
const editFormData = reactive<{
  jobs: JobItem[];

}>({
  jobs: [], // Initialize as an empty array of JobItem
});


const formSubmitted = ref(false);

// Modal States
const viewModal = ref(false);
const setviewModal = (value: any) => { viewModal.value = value; };
const editModal = ref(false);
const seteditModal = (value: any) => { editModal.value = value; };

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
const fetchAndSetData = (machineCode: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  console.log(`Fetching data for Chem ID: ${machineCode}`); // Add log
  axios.get(`http://10.87.0.33:8082/api/PostProdChemicalTreatment/GetCTDetailsbyMachineCode/${machineCode}`)
    .then(response => {
      const data = response.data.result;
      console.log('Fetched data:', data); // Add log

      if (data && data.length > 0) {
        // Filter out items with status 'Completed'
        const filteredData = data.filter((item: JobItem) => item.status !== 'Completed');

        formData.jobs = filteredData as JobItem[]; // Assign the filtered array of jobs

        modalSetter(true);
      } else {
        console.error('No data found for the specified Machine ID:', machineCode);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'));
};






const editRole = (machineCode: string) => fetchAndSetData(machineCode, editFormData, seteditModal);
const viewRole = (machineCode: string) => fetchAndSetData(machineCode, viewData, setviewModal, true);




// Update Table Data
const updateTableData = () => {
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Once data is received, populate the table
      console.log(filteredData);
      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });


};






const updateJobStatus = (jobId: string, subJobId: string, machineCode: string) => {
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will update the data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, update it!',
  }).then((result) => {
    if (result.isConfirmed) {
      const payload = {
        jobId,
        subJobId,
        machineId: machineCode, // Rename machineCode to machineId
      };

      axios.post('http://10.87.0.33:8082/api/PostProdChemicalTreatment/UpdateChemicalTreatmentJobStatus', payload)
        .then(response => {
          console.log('Job status updated:', response.data);
          seteditModal(false);
          resetFormData(editFormData);
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
          console.error('Error updating job status:', error);
          // Optionally, you could handle the error (e.g., show a notification)
        });
    }
  });
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
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Post Production Chemical Treatment Job</h2>

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
                <option selected>Active</option>
                <option selected>SUCCESS</option>
                <option>PENDING</option>
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



  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="2xl" :open="editModal" @close="() => {
    seteditModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          Edit Post Production Chemical Treatment Job
        </h2>
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
            {{ editFormStatus }}
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
            Blending Bin ID
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
              {{ job.binCode }}
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
              <button @click="updateJobStatus(job.jobId, job.subJobId, job.machineCode)"
                class="bg-blue-700 hover:bg-blue-900 my-2 mx-2 px-4 py-2 text-white rounded">
                Completed
              </button>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</div>


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




  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="3xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Machine Station Job
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
            {{ viewData.jobs[0]?.machineCode }}
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
            Blending Bin ID
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
        <template v-for="(job, jobIndex) in viewData.jobs" :key="job.jobId">
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
              {{ job.binCode }}
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
              {{ overallStatus }}
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