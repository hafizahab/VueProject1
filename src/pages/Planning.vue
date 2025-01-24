<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea } from "../base-components/Form";
import * as xlsx from "xlsx";
import { onMounted, ref, reactive } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { stringToHTML } from "../utils/helper";
import axios from "axios";
import Swal from 'sweetalert2';

interface Response {
  id?: string;
  jobId?: string;
  finishedprodutcode?: string;
  quantity?: string;
  averagetime?: string;
  startdate?: string;
  enddate?: string;
  status?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  jobId: "",
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
      paginationSizeSelector: [5, 10, 20, 30, 40],
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
          title: "Date",
          minWidth: 200,
          responsive: 0,
          field: "created_date",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: false,
          formatter(cell) {
    const response = cell.getData();
    const fullDate = new Date(response.created_date);
    
    // Extracting date components
    const year = fullDate.getFullYear();
    const month = String(fullDate.getMonth() + 1).padStart(2, '0');
    const day = String(fullDate.getDate()).padStart(2, '0');

    // Formatted date string
    const formattedDate = `${year}-${month}-${day}`;

    return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
      </div>`;
  },
        },
        {
          title: "JOB ID",
          minWidth: 130,
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
          title: "FINISHED PRODUCT CODE",
          minWidth: 200,
          responsive: 0,
          field: "finishedprodutcode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.finishedprodutcode}</div>
              </div>`;
          },
        },
        {
          title: "QUANTITY",
          minWidth: 140,
          responsive: 0,
          field: "quantity",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.quantity}</div>
              </div>`;
          },
        },
        {
          title: "AVERAGETIM",
          minWidth: 160,
          responsive: 0,
          field: "averagetime",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.averagetime}</div>
              </div>`;
          },
        },
        {
          title: "Start Date",
          minWidth: 150,
          responsive: 0,
          field: "startdate",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.startdate);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');

            // Formatted date string
            const formattedDate = `${day}-${month}-${year}`;

            return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
      </div>`;
          },
        },
        {
          title: "End Date",
          minWidth: 150,
          responsive: 0,
          field: "enddate",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.enddate);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');

            // Formatted date string
            const formattedDate = `${day}-${month}-${year}`;

            return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
      </div>`;
          },
        },
        {
          title: "STATUS",
          minWidth: 200,
          field: "status",
          hozAlign: "center",
          headerHozAlign: "center",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter:
            function (cell, formatterParams, onRendered) {
              const status = cell.getValue();
              return `<div class="flex items-center lg:justify-center sm:text-center ${status === 'active' ? 'bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400' : 'bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400'
                }">
    ${status === 'active' ? 'Active' : 'Inactive'
                }
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
            const deleteLink = document.createElement("a");
            deleteLink.classList.add("flex", "items-center", "text-danger");
            deleteLink.href = "javascript:;";
            deleteLink.addEventListener("click", function () {
              deleteRole(response.id); // Call the delete function
            });

            const deleteIcon = document.createElement("i");
            deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
            deleteLink.appendChild(deleteIcon);
            deleteLink.appendChild(document.createTextNode("Delete"));
            container.appendChild(deleteLink);


            // Render "View" link

            return container;
          },
        },
        {
          title: "Job ID",
          field: "jobId",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Finished Product Code",
          field: "finishedprodutcode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Quantity",
          field: "quantity",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Averagetime",
          field: "averagetime",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Start Date",
          field: "startdate",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "End Date",
          field: "enddate",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "STATUS",
          field: "status",
          visible: false,
          print: true,
          download: true,
          formatter: function (cell, formatterParams, onRendered) {
            const status = cell.getValue();
            return `<div class="flex items-center lg:justify-center ${status === 'active' ? 'text-success' : 'text-danger'
              }">
      <i data-lucide="check-square" class="w-4 h-4 mr-2"></i> ${status === 'active' ? 'Active' : 'Inactive'
              }
    </div>`;
          },





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
    tabulator.value.setFilter(function (data) {
      // Parse dates from the data object
      const dateValue = new Date(data.startdate);
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;

      // Check if the date falls within the specified range or is exactly one of the dates
      const isStartDateMatch = !startDate || dateValue === startDate || dateValue.toDateString() === startDate.toDateString();
      const isEndDateMatch = !endDate || dateValue === endDate || dateValue.toDateString() === endDate.toDateString();

      return isStartDateMatch && isEndDateMatch;
    });
  }
};




const onId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("jobId", 'like', filter.jobId);
  }
};

// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    jobId: "",
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



onMounted(() => {
  // Fetch data from API
  axios.get('http://172.188.122.62:8085/api/PlanningDetails')
    .then(response => {
      // Filter out data with status "deleted"
      const filteredData = response.data.result.filter((item: any)=> item.status !== 'deleted');

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
  fetchMachineCodeDD();
  fetchResourceCodeDD();
  fetchShiftDetailsDD();
  fetchBlenderMachineCodeDD();
  fetchBlenderResourceCodeDD();
});

const editFormData = reactive({
  id: null,
  jobId: '',
  finishedprodutcode: '',
  quantity: '',
  averagetime: '',
  startdate: '',
  enddate: '',
  machinecode: '',
  resourcecode: '',
  shiftdetails: '',
  blendermachinecode: '',
  blenderresourcecode: '',
  blendershiftdetails: '',
  machinecodedd: [] as any[], 
  resourcecodedd: [] as any[], 
  shiftdetailsdd: [] as any[], 
  blendermachinecodedd: [] as any[], 
  blenderresourcecodedd: [] as any[], 
  blendershiftdetailsdd: [] as any[], 
  status: 'active',
});
const editRole = (id: string) => {
  // Fetch data for the specific ID
  axios.get(`http://172.188.122.62:8085/api/PlanningDetails/${id}`)
    .then(response => {
      const data = response.data.result;

      // Check if the array has at least one item
      if (data && data.length > 0) {
        // Log the retrieved data
        console.log('Retrieved Data:', data);

        // Set data to the editFormData
        const firstItem = data[0];
        editFormData.id = firstItem.id;
        editFormData.jobId = firstItem.jobId || '';
        editFormData.finishedprodutcode = firstItem.finishedprodutcode || '';
        editFormData.quantity = firstItem.quantity || '';
        editFormData.averagetime = firstItem.averagetime || '';
        editFormData.machinecode = firstItem.machinecode || '';
        editFormData.resourcecode = firstItem.resourcecode || '';
        editFormData.shiftdetails = firstItem.shiftdetails || '';
        editFormData.blendermachinecode = firstItem.blendermachinecode || '';
        editFormData.blenderresourcecode = firstItem.blenderresourcecode || '';
        editFormData.blendershiftdetails = firstItem.blendershiftdetails || '';


        // Format and set startdate
        editFormData.startdate = new Date(firstItem.startdate).toISOString().split('T')[0];

        // Format and set enddate
        editFormData.enddate = new Date(firstItem.enddate).toISOString().split('T')[0];

        editFormData.status = firstItem.status || 'active';

        // Open the edit slideover
        setEditSlideOver(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => {
      console.error('Error fetching data for editing:', error);
    });
};


const updateRole = () => {
  // Ask for confirmation before updating
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
      if (editFormData.id) {
        axios.put(`http://172.188.122.62:8085/api/PlanningDetails/${editFormData.id}`, {
          jobId: editFormData.jobId,
          finishedprodutcode: editFormData.finishedprodutcode,
          quantity: editFormData.quantity,
          averagetime: editFormData.averagetime,
          startdate: editFormData.startdate,
          enddate: editFormData.enddate,
          status: editFormData.status,
        })
          .then(response => {
            // Close the edit slideover
            setEditSlideOver(false);

            // Update table data
            updateTableData();

            Swal.fire({
              icon: 'success',
              title: 'Updated Successfully',
              showConfirmButton: false,
              showCloseButton: true, // Show close button (X)
              timer: 5000,
              timerProgressBar: true, // Display timer progress bar
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
            console.error('Error updating data:', error);
            Swal.fire({
              icon: 'error',
              title: 'Failed to Update',
              text: 'Please try again',
            });
          });
      }
    }
  });
};

const updateTableData = () => {
  axios.get(`http://172.188.122.62:8085/api/PlanningDetails`)
    .then(response => {
      // Filter out data with status "deleted"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      if (tabulator.value) {
        tabulator.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching updated data:', error);
    });
};



// Add Role



const addFormData = reactive({
  jobId: '',
  finishedprodutcode: '',
  quantity: '',
  averagetime: '',
  startdate: '',
  enddate: '',
  machinecode: '',
  resourcecode: '',
  shiftdetails: '',
  blendermachinecode: '',
  blenderresourcecode: '',
  blendershiftdetails: '',
  machinecodedd: [] as any[], 
  resourcecodedd: [] as any[], 
  shiftdetailsdd: [] as any[], 
  blendermachinecodedd: [] as any[], 
  blenderresourcecodedd: [] as any[], 
  blendershiftdetailsdd: [] as any[], 
  status: 'active',
});

const fetchMachineCodeDD = () => {
  // First API call
  axios.get('http://172.188.122.62:8085/api/MachineCodeMaster/GetMachineDetailsDDL/Production')
    .then(response => {
      const machineCodeData = response.data.result;
      handleMachineCodeData(machineCodeData);
    })
    .catch(error => {
      console.error('Error fetching machine codes from Production:', error);
    });

  // Second API call
  axios.get('http://172.188.122.62:8085/api/MachineCodeMaster/GetMachineDetailsDDL/Blending')
    .then(response => {
      const machineCodeData = response.data.result;
      handleMachineCodeData(machineCodeData);
    })
    .catch(error => {
      console.error('Error fetching machine codes from Blending:', error);
    });
};

// Function to handle machine code data and populate form data
const handleMachineCodeData = (machineCodeData:any) => {
  if (Array.isArray(machineCodeData)) {
    // If it's an array, use the first element or handle multiple machine codes as needed
    addFormData.machinecode = machineCodeData.length > 0 ? machineCodeData[0].machinecode : '';
    // Merge the new options with existing ones
    addFormData.machinecodedd = [...new Set([...addFormData.machinecodedd, ...machineCodeData.map(item => item.machinecode)])];
    editFormData.machinecode = machineCodeData.length > 0 ? machineCodeData[0].machinecode : '';
    // Merge the new options with existing ones
    editFormData.machinecodedd = [...new Set([...editFormData.machinecodedd, ...machineCodeData.map(item => item.machinecode)])];
  } else if (typeof machineCodeData === 'object') {
    // If it's an object, use its properties
    addFormData.machinecode = machineCodeData.machinecode || '';
    addFormData.machinecodedd.push(machineCodeData.machinecode); // Add the new option
    editFormData.machinecode = machineCodeData.machinecode || '';
    editFormData.machinecodedd.push(machineCodeData.machinecode); // Add the new option
  } else {
    console.error('Invalid response format for machine code data:', machineCodeData);
  }
};


const fetchResourceCodeDD = () => {
  // First API call
  axios.get('http://172.188.122.62:8085/api/ResourceDetails/GetResourceDetailsDDL/Production')
    .then(response => {
      const resourceCodeData = response.data.result;
      handleResourceCodeData(resourceCodeData);
    })
    .catch(error => {
      console.error('Error fetching resource codes from Production:', error);
    });

  // Second API call
  axios.get('http://172.188.122.62:8085/api/ResourceDetails/GetResourceDetailsDDL/Blending')
    .then(response => {
      const resourceCodeData = response.data.result;
      handleResourceCodeData(resourceCodeData);
    })
    .catch(error => {
      console.error('Error fetching resource codes from Blending:', error);
    });
};

// Function to handle resource code data and populate form data
const handleResourceCodeData = (resourceCodeData:any) => {
  if (Array.isArray(resourceCodeData)) {
    // If it's an array, use the first element or handle multiple resource codes as needed
    addFormData.resourcecode = resourceCodeData.length > 0 ? resourceCodeData[0].resourcecode : '';
    // Merge the new options with existing ones
    addFormData.resourcecodedd = [...new Set([...addFormData.resourcecodedd, ...resourceCodeData.map(item => item.resourcecode)])];
    editFormData.resourcecode = resourceCodeData.length > 0 ? resourceCodeData[0].resourcecode : '';
    // Merge the new options with existing ones
    editFormData.resourcecodedd = [...new Set([...editFormData.resourcecodedd, ...resourceCodeData.map(item => item.resourcecode)])];
  } else if (typeof resourceCodeData === 'object') {
    // If it's an object, use its properties
    addFormData.resourcecode = resourceCodeData.resourcecode || '';
    addFormData.resourcecodedd.push(resourceCodeData.resourcecode); // Add the new option
    editFormData.resourcecode = resourceCodeData.resourcecode || '';
    editFormData.resourcecodedd.push(resourceCodeData.resourcecode); // Add the new option
  } else {
    console.error('Invalid response format for resource code data:', resourceCodeData);
  }
};


const fetchShiftDetailsDD = () => { //dont have the api yet
  axios.get('http://172.188.122.62:8085/api/MachineCodeMaster/GetMachineDetailsDDL/')
    .then(response => {
      const shiftDetailsData = response.data.result;

      if (Array.isArray(shiftDetailsData)) {
        // If it's an array, use the first element or handle multiple shift details as needed
        addFormData.shiftdetails = shiftDetailsData.length > 0 ? shiftDetailsData[0].shiftdetails : '';
        // Assign the array to addFormData.shiftdetailsdd for rendering options in the dropdown
        addFormData.shiftdetailsdd = shiftDetailsData.map(item => item.shiftdetails);
        editFormData.shiftdetails = shiftDetailsData.length > 0 ? shiftDetailsData[0].shiftdetails : '';
        // Assign the array to editFormData.shiftdetailsdd for rendering options in the dropdown
        editFormData.shiftdetailsdd = shiftDetailsData.map(item => item.shiftdetails);
      } else if (typeof shiftDetailsData === 'object') {
        // If it's an object, use its properties
        addFormData.shiftdetails = shiftDetailsData.shiftdetails || '';
        addFormData.shiftdetailsdd = [shiftDetailsData.shiftdetails]; // Set an array with a single value
        editFormData.shiftdetails = shiftDetailsData.shiftdetails || '';
        editFormData.shiftdetailsdd = [shiftDetailsData.shiftdetails]; // Set an array with a single value
      } else {
        console.error('Invalid response format for shift details data:', shiftDetailsData);
      }
    })
    .catch(error => {
      console.error('Error fetching shift details:', error);
    });
};


const fetchBlenderMachineCodeDD = () => {
  axios.get('http://172.188.122.62:8085/api/BlenderMachineCodeMaster/GetBlenderMachineDetailsDDL')
    .then(response => {
      const blenderMachineCodeData = response.data.result;

      if (Array.isArray(blenderMachineCodeData)) {
        // If it's an array, use the first element or handle multiple machinecode as needed
        addFormData.blendermachinecode = blenderMachineCodeData.length > 0 ? blenderMachineCodeData[0].blendermachinecode : '';
        // Assign the array to addFormData.machinecodedd for rendering options in the dropdown
        addFormData.blendermachinecodedd = blenderMachineCodeData.map(item => item.blendermachinecode);
        editFormData.blendermachinecode = blenderMachineCodeData.length > 0 ? blenderMachineCodeData[0].blendermachinecode : '';
        // Assign the array to addFormData.machinecodedd for rendering options in the dropdown
        editFormData.blendermachinecodedd = blenderMachineCodeData.map(item => item.blendermachinecode);
      } else if (typeof blenderMachineCodeData === 'object') {
        // If it's an object, use its properties
        addFormData.blendermachinecode = blenderMachineCodeData.blendermachinecode || '';
        addFormData.blendermachinecodedd = [blenderMachineCodeData.blendermachinecode]; // Set an array with a single value
        editFormData.blendermachinecode = blenderMachineCodeData.blendermachinecode || '';
        editFormData.blendermachinecodedd = [blenderMachineCodeData.blendermachinecode]; // Set an array with a single value
      } else {
        console.error('Invalid response format for vendor data:', blenderMachineCodeData);
      }
    })
    .catch(error => {
      console.error('Error fetching vendor codes:', error);
    });
};

const fetchBlenderResourceCodeDD = () => {
  axios.get('http://172.188.122.62:8085/api/BlenderResourceDetails/GetBlenderResourceDetailsDDL')
    .then(response => {
      const blenderResourceCodeData = response.data.result;

      if (Array.isArray(blenderResourceCodeData)) {
        // If it's an array, use the first element or handle multiple blender resource codes as needed
        addFormData.blenderresourcecode = blenderResourceCodeData.length > 0 ? blenderResourceCodeData[0].blenderresourcecode : '';
        // Assign the array to addFormData.blenderresourcecodedd for rendering options in the dropdown
        addFormData.blenderresourcecodedd = blenderResourceCodeData.map(item => item.blenderresourcecode);
        editFormData.blenderresourcecode = blenderResourceCodeData.length > 0 ? blenderResourceCodeData[0].blenderresourcecode : '';
        // Assign the array to addFormData.blenderresourcecodedd for rendering options in the dropdown
        editFormData.blenderresourcecodedd = blenderResourceCodeData.map(item => item.blenderresourcecode);
      } else if (typeof blenderResourceCodeData === 'object') {
        // If it's an object, use its properties
        addFormData.blenderresourcecode = blenderResourceCodeData.blenderresourcecode || '';
        addFormData.blenderresourcecodedd = [blenderResourceCodeData.blenderresourcecode]; // Set an array with a single value
        editFormData.blenderresourcecode = blenderResourceCodeData.blenderresourcecode || '';
        editFormData.blenderresourcecodedd = [blenderResourceCodeData.blenderresourcecode]; // Set an array with a single value
      } else {
        console.error('Invalid response format for blender resource code data:', blenderResourceCodeData);
      }
    })
    .catch(error => {
      console.error('Error fetching blender resource codes:', error);
    });
};

const fetchBlenderShiftCodeDD = () => {
  axios.get('http://172.188.122.62:8085/api/MachineCodeMaster/GetMachineDetailsDDL')
    .then(response => {
      const blenderShiftCodeData = response.data.result;

      if (Array.isArray(blenderShiftCodeData)) {
        // If it's an array, use the first element or handle multiple shift codes as needed
        addFormData.shiftdetails = blenderShiftCodeData.length > 0 ? blenderShiftCodeData[0].shiftdetails : '';
        // Assign the array to addFormData.shiftdetailsdd for rendering options in the dropdown
        addFormData.shiftdetailsdd = blenderShiftCodeData.map(item => item.shiftdetails);
        editFormData.shiftdetails = blenderShiftCodeData.length > 0 ? blenderShiftCodeData[0].shiftdetails : '';
        // Assign the array to editFormData.shiftdetailsdd for rendering options in the dropdown
        editFormData.shiftdetailsdd = blenderShiftCodeData.map(item => item.shiftdetails);
      } else if (typeof blenderShiftCodeData === 'object') {
        // If it's an object, use its properties
        addFormData.shiftdetails = blenderShiftCodeData.shiftdetails || '';
        addFormData.shiftdetailsdd = [blenderShiftCodeData.shiftdetails]; // Set an array with a single value
        editFormData.shiftdetails = blenderShiftCodeData.shiftdetails || '';
        editFormData.shiftdetailsdd = [blenderShiftCodeData.shiftdetails]; // Set an array with a single value
      } else {
        console.error('Invalid response format for blender shift code data:', blenderShiftCodeData);
      }
    })
    .catch(error => {
      console.error('Error fetching blender shift codes:', error);
    });
};



// Function to add new role

const addRole = () => {
  // Show a confirmation dialog before making the API call
  Swal.fire({
    title: 'Confirmation',
    text: 'Are you sure you want to add this role?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, add it!',
  }).then((result) => {
    // If the user confirms, proceed with adding the role
    if (result.isConfirmed) {
      // Handle adding a new role (POST request)
      axios.post('http://172.188.122.62:8085/api/PlanningDetails', {
        jobId: addFormData.jobId,
        finishedprodutcode: addFormData.finishedprodutcode,
        quantity: addFormData.quantity,
        averagetime: addFormData.averagetime,
        startdate: addFormData.startdate,
        enddate: addFormData.enddate,
        machinecode: addFormData.machinecode,
        resourcecode: addFormData.resourcecode,
        shiftdetails: addFormData.shiftdetails,
        blendermachinecode: addFormData.blendermachinecode,
        blenderresourcecode: addFormData.blenderresourcecode,
        blendershiftdetails: addFormData.blendershiftdetails,
        status: addFormData.status,
      })
        .then(response => {
          // Close the add slideover
          setAddSlideover(false);

          addFormData.jobId = '';
          addFormData.finishedprodutcode = '';
          addFormData.quantity = '';
          addFormData.averagetime = '';
          addFormData.startdate = '';
          addFormData.enddate = '';
          addFormData.status = 'active';

          // Update table data after successful addition
          updateTableData(); // Function to update table data

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Role Added Successfully',
            showConfirmButton: false,
            showCloseButton: true, // Show close button (X)
            timer: 5000,
            timerProgressBar: true, // Display timer progress bar
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

          console.log('Role added successfully:', response.data.result);
        })
        .catch(error => {
          console.error('Error adding role:', error);
        });
    }
  });
};



const deleteRole = (id: string) => {
  // Ask for confirmation before deleting
  Swal.fire({
    title: 'Are you sure?',
    text: 'You will not be able to recover this data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then((result) => {
    if (result.isConfirmed) {
      // Make a DELETE request to remove data
      axios.delete(`http://172.188.122.62:8085/api/PlanningDetails/${id}`)
        .then(response => {
          // After successful deletion, update the table data
          updateTableData();
          console.log('Data deleted successfully:', response.data.result);
          Swal.fire({
            icon: 'success',
            title: 'Deleted Successfully',
            showConfirmButton: false,
            showCloseButton: true, // Show close button (X)
            timer: 5000,
            timerProgressBar: true, // Display timer progress bar
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
          console.error('Error deleting data:', error);
          Swal.fire({
            icon: 'error',
            title: 'Failed to Delete',
            text: 'Please try again',
          });
        });
    }
  });
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
</script>

<template>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Planning</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Planning
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
  <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
    <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
      ID
    </label>
    <FormInput id="tabulator-html-filter-id" v-model="filter.jobId" type="text"
      class="mt-2 sm:w-40 2xl:w-full sm:mt-0" placeholder="Search ID..." />
  </div>
  <Button id="tabulator-html-filter-go" variant="primary" type="button" class="me-3 w-[100%] whitespace-nowrap sm:w-16" @click="onId">
      ID
    </Button>
  <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
    <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
      Start Date
    </label>
    <FormInput id="tabulator-html-filter-startDate" v-model="filter.startDate" type="date"
      class="mt-2 sm:w-40 2xl:w-full sm:mt-0" />
  </div>
  <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
    <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
      End Date
    </label>
    <FormInput id="tabulator-html-filter-endDate" v-model="filter.endDate" type="date"
      class="mt-2 sm:w-40 2xl:w-full sm:mt-0" />
  </div>
  <div class="mt-2 xl:mt-0">
    <Button id="tabulator-html-filter-go" variant="primary" type="button" class="w-full sm:w-16" @click="onFilter">
      Date
    </Button>
    
    <Button id="tabulator-html-filter-reset" variant="secondary" type="button"
      class="w-full ml-10 mt-2 sm:w-16 sm:mt-0 sm:ml-1" @click="onResetFilter">
      Reset
    </Button>
  </div>
</form>
      <div class="flex mt-5 sm:mt-0">
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
          Add Good Receiving
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Job ID</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.jobId" type="text" placeholder="Job ID" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Finished Product Code</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.finishedprodutcode" type="text" placeholder="Finished Product Code" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Quantity</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.quantity" type="text" placeholder="Qantity" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Averagetime</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.averagetime" type="text" placeholder="Averagetime" />
          </div>
          <div class="mt-5">
            <label for="vendor-dropdown">Machine Code</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.machinecode">
              <option v-for="machinecodedd in addFormData.machinecodedd" :key="machinecodedd" :value="machinecodedd">
                {{ machinecodedd }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <label for="vendor-dropdown">Resource Code</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.resourcecode">
              <option v-for="resourcecodedd in addFormData.resourcecodedd" :key="resourcecodedd" :value="resourcecodedd">
                {{ resourcecodedd }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <label for="vendor-dropdown">Blender Machine Code</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.blendermachinecode">
              <option v-for="blendermachinecodedd in addFormData.blendermachinecodedd" :key="blendermachinecodedd" :value="blendermachinecodedd">
                {{ blendermachinecodedd }}
              </option>
            </FormSelect>
          </div>
          <div class="mt-5">
            <label for="vendor-dropdown">Blender Resource Code</label>
            <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.blenderresourcecode">
              <option v-for="blenderresourcecodedd in addFormData.blenderresourcecodedd" :key="blenderresourcecodedd" :value="blenderresourcecodedd">
                {{ blenderresourcecodedd }}
              </option>
            </FormSelect>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Start Date</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.startdate" type="text" placeholder="Start Date" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">End Date</FormLabel>
            <FormInput id="regular-form-1" v-model="addFormData.enddate" type="text" placeholder="End Date" />
          </div> -->


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel>
            <FormSelect class=" sm:mr-2" v-model="addFormData.status" aria-label="Default select example">
              <option>active</option>
            </FormSelect>
          </div> -->

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
          Edit Good Receiving
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Job ID</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.jobId" type="text" placeholder="Job ID" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Finished Product Code</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.finishedprodutcode" type="text" placeholder="Finished Product Code" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Quantity</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.quantity" type="text" placeholder="Quantity" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Averagetime</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.averagetime" type="text" placeholder="Averagetime" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Start Date</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.startdate" type="date" placeholder="Start Date" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">End Date</FormLabel>
            <FormInput id="regular-form-1" v-model="editFormData.enddate" type="date" placeholder="End Date" />
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="edit-form-status">Status</FormLabel>
            <FormSelect id="edit-form-status" v-model="editFormData.status" class="sm:mr-2"
              aria-label="Default select example">
              <option>active</option>
              <option>inactive</option>
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
</template>
