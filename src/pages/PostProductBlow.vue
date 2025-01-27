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

interface Response {
  id?: string;
  whiteSlipId?: string;
  shift?: string;
  machineCode?: string;
  jobStatus?: string;
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
          field: "whiteSlipId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.whiteSlipId}</div>
              </div>`;
          },
        },
        {
          title: "DATE",
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
          title: "SHIFT",
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
          title: "MACHINE CODE",
          minWidth: 270,
          responsive: 0,
          field: "machineCode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
        <div class="font-medium whitespace-nowrap">${response.machineCode}</div>
      </div>`;
          },
        },
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/PostProductionBlow/';

onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "deleted"
      let filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: first by job status (Pending at the top), then by job ID in ascending order
      filteredData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') {
          return -1;
        }
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') {
          return 1;
        }
        return a.whiteSlipId.localeCompare(b.whiteSlipId);
      });

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
  fetchNamesShift();
  fetchMachineId();
  fetchProductCodes();
  fetchMachinePP();
  fetchMachineBlow();
  fetchBinId();
  fetchWeight();
  fetchMovement();
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
  whiteSlipId: '',
  shift: '',
  machineCode: '',
  reassignedBinId: '',
  jobStatus: '',
});

// Form Data
const editFormData = reactive({
  id: null,
  whiteSlipId: '',
  shift: '',
  machineCode: '',
  reassignedBinId: '',
  jobStatus: '',
  weight: 0,
  processedWeight: 0,
  waste: 0,
  shifts: [] as string[],
  machineCodes: [] as string[],
  productcodes: [] as string[],
  machineCodesPP: [] as string[],
  machineCodesBlow: [] as string[],
  movements: [] as string[],
  bins: [] as string[],
  binData: [] as any[],
  listBinsList: [] as Array<{ id: string; binMasterId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  listBins: [] as Array<{ id: string; binMasterId: string; mappingId: string; capacityMin: number; capacityMax: number; weight: number; reassignBinId: string; movement: string; status: string }>,
  qcInspectionList: {
    shift: '',
    jobStatus: '',
    binListforQCinspection: [] as Array<{
      mappingId: string;
      type: string;
      weight: number;
      reassignBinId: string;
      status: string;
      productCode: string;
      dimensionCheck: string;
      functionalCheck: string;
      visualCheck1: string;
      visualCheck2: string;
      visualCheck3: string;
      room: string;
    }>
  },
  listMachinesList: [] as Array<{ code: string; type: string; status: string }>,
  listMachines: [] as Array<{ code: string; type: string; status: string }>,
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


const fetchWeight = () => {
  axios.get('http://10.87.0.33:8082/api/PlanningDetails')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "deleted"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'deleted');

        // Find the item with the matching jobId
        const matchingItem = activeNameData.find(item => item.jobId === editFormData.whiteSlipId);

        if (matchingItem) {
          // Set the weight in editFormData
          editFormData.weight = matchingItem.quantity;
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

watch(() => editFormData.whiteSlipId, (newJobId) => {
  if (newJobId) {
    fetchWeight();
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
const fetchMachineId = () => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and type equal to "Blending"
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'chemical treatment'
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
          item.status.toLowerCase() !== 'inactive' && item.type.toLowerCase() === 'chemical treatment'
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
          whiteSlipId: firstItem.whiteSlipId,
          shift: firstItem.shift,
          machineCode: firstItem.machineCode,
          jobStatus: firstItem.jobStatus,
          listBinsList: firstItem.listBinsList || [],
          listBins: firstItem.listBins || [],
          processedWeight: firstItem.processedWeight,
          waste: firstItem.waste,
          // ppChemicalTreatmentList: firstItem.ppChemicalTreatmentList || [],
          // ppBlowList: firstItem.ppBlowList || [],
          // qcInspectionList: firstItem.qcInspectionList || [],
          listMachinesList: firstItem.listMachinesList || [],
          listMachines: firstItem.listMachines || [],
        });
          // Check and set totalWeight only if it's not null, undefined, or zero
          if (firstItem.weight !== null && firstItem.weight !== undefined && firstItem.weight !== 0) {
          formData.weight = firstItem.weight;
        }
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
      // Filter out data with status "deleted"
      let filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

      // Sort data: first by job status (Pending at the top), then by job ID in ascending order
      filteredData.sort((a: any, b: any) => {
        if (a.jobStatus === 'Pending' && b.jobStatus !== 'Pending') {
          return -1;
        }
        if (a.jobStatus !== 'Pending' && b.jobStatus === 'Pending') {
          return 1;
        }
        return a.whiteSlipId.localeCompare(b.whiteSlipId);
      });

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


const deleteRow = async (id: string, index: number) => {
  if (id) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://10.87.0.33:8082/api/ListBins/${id}`);
          editFormData.listBins.splice(index, 1);
          Swal.fire({
            icon: 'success',
            title: 'Bin Deleted Successfully',
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
          console.error('Error deleting bin:', error);
          Swal.fire(
            'Error!',
            'There was an error deleting the bin.',
            'error'
          );
        }
      }
    });
  } else {
    editFormData.listBins.splice(index, 1);
  }
};

const validBins = computed(() => editFormData.listBins.filter(row => row.status !== 'deleted'));


const addRow = () => {
  editFormData.listBins.push({
    id: '',
    binMasterId: '',
    mappingId: '',
    weight: 0,
    capacityMin: 0,
    capacityMax: 0,
    movement: '',
    reassignBinId: '',
    status: '',
  });
};



// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  if (!editFormData.machineCode || !editFormData.shift) {
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
    }).then(() => {
      formSubmitted.value = false; // Reset formSubmitted state after showing the error
    });
    return; // Exit the function if required fields are missing
  }

  const payload = {
    id: String(editFormData.id),
    whiteSlipId: String(editFormData.whiteSlipId),
    shift: String(editFormData.shift),
    machineCode: String(editFormData.machineCode),
    jobStatus: String(editFormData.jobStatus),
    weight: editFormData.weight,
    processedWeight: editFormData.processedWeight,
    waste: editFormData.waste,
    listBinsList: Array.isArray(editFormData.listBins) ? editFormData.listBins.map(item => ({
      mappingId: String(editFormData.whiteSlipId),
      binMasterId: item.binMasterId,
      weight: item.weight,
      capacityMin: item.capacityMin,
      capacityMax: item.capacityMax,
      reassignBinId: item.reassignBinId,
      movement: item.movement,
      status: item.status
    })) : [],
    qcInspectionList: [{
      shift: editFormData.qcInspectionList.shift,
      jobStatus: editFormData.qcInspectionList.jobStatus,
      binListforQCinspection: editFormData.qcInspectionList.binListforQCinspection.map(bin => ({
        mappingId: String(editFormData.whiteSlipId),
        type: bin.type,
        weight: bin.weight,
        reassignBinId: bin.reassignBinId,
        status: bin.status,
        productCode: bin.productCode,
        dimensionCheck: bin.dimensionCheck,
        functionalCheck: bin.functionalCheck,
        visualCheck1: bin.visualCheck1,
        visualCheck2: bin.visualCheck2,
        visualCheck3: bin.visualCheck3,
        room: bin.room
      }))
    }],
    listMachinesList: editFormData.listMachines.map(machine => ({
      code: machine.code,
      type: machine.type,
      status: machine.status
    })),
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
          setEditSlideOver(false);
          updateTableData();
          resetFormData(editFormData);
          fetchNamesShift();
          fetchMachineId();
          fetchProductCodes();
          fetchMachinePP();
          fetchMachineBlow();
          fetchBinId();
          fetchWeight();
          fetchMovement();
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
          <title>Post Production Blow</title>
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


function addRowQC(listName: 'binListforQCinspection') {
  if (listName === 'binListforQCinspection') {
    editFormData.qcInspectionList.binListforQCinspection.push({
      mappingId: '',
      type: '',
      weight: 0,
      reassignBinId: '',
      status: '',
      productCode: '',
      dimensionCheck: '',
      functionalCheck: '',
      visualCheck1: '',
      visualCheck2: '',
      visualCheck3: '',
      room: ''
    });
  }
}

function removeRowQC(listName: 'binListforQCinspection', index: number) {
  if (listName === 'binListforQCinspection') {
    editFormData.qcInspectionList.binListforQCinspection.splice(index, 1);
  }
}


watch(
  () => editFormData.listBins,
  (newBins) => {
    const totalProcessedWeight = newBins.reduce((acc, bin) => acc + (bin.weight || 0), 0);
    editFormData.processedWeight = totalProcessedWeight;
    editFormData.waste = editFormData.weight - editFormData.processedWeight;
  },
  { deep: true }
);

watch(
  () => editFormData.weight,
  (newWeight) => {
    editFormData.waste = newWeight - editFormData.processedWeight;
  }
);


</script>

<template>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Post Production Blow</h2>

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
                <option selected>Completed</option>
                <option selected>Draft</option>
                <option>Pending QC</option>
                <option>QC Rejected</option>
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

  <Slideover size="xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Post Production Blow
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-gr">Job ID</FormLabel>
            <FormInput v-model="editFormData.whiteSlipId" id="regular-form-gr" type="text" disabled />
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Sub Job ID</FormLabel>
            <FormInput v-model="editFormData.subJobId" id="regular-form-4" type="text" placeholder="Sub Job ID" />
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.shift" class="sm:mr-2 form-select mt-1 block w-full"
              aria-label="Default select example" :class="{ 'border-red-500': formSubmitted && !editFormData.shift }">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.shift" class="text-red-500">Shift is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5"> Machine ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.machineCode" class="sm:mr-2 form-select mt-1 block w-full"
              aria-label="Default select example"
              :class="{ 'border-red-500': formSubmitted && !editFormData.machineCode }">
              <option disabled value="">Select a Machine ID Option</option>
              <option v-for="machineCode in editFormData.machineCodes" :key="machineCode" :value="machineCode">
                {{ machineCode }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !editFormData.machineCode" class="text-red-500">Machine ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Weight</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight)) }"
              id="regular-form-8" v-model="editFormData.weight" type="text" placeholder="Weight" disabled step="any"/>
            <span v-if="formSubmitted && (!editFormData.weight || !isNumeric(editFormData.weight))"
              class="text-red-500">{{
                !editFormData.weight ? 'Weight is required!' : 'Weight must be a valid number!'
              }}</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Processed Weight</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight)) }"
              id="regular-form-8" v-model="editFormData.processedWeight" type="text" placeholder="Processed Weight" disabled step="any"/>
            <span v-if="formSubmitted && (!editFormData.processedWeight || !isNumeric(editFormData.processedWeight))"
              class="text-red-500">{{
                !editFormData.processedWeight ? 'Processed Weight is required!' : 'Processed Weight must be a valid number!'
              }}</span>
          </div>
          <div class="mt-5">
  <FormLabel htmlFor="regular-form-8">Waste</FormLabel>
  <FormInput
    id="regular-form-8"
    v-model="editFormData.waste"
    type="text"
    placeholder="Waste"
    disabled
    step="any"
  />
</div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Status</FormLabel>
            <FormSelect v-model="editFormData.jobStatus" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Job Status Option</option>
              <option>Completed</option>
              <option>Pending</option>
            </FormSelect>
          </div>

         <!-- List Bins -->
         <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 mt-2 text-lg font-medium leading-none">List Bins</h6>
            <hr>
            <div v-if="validBins.length === 0" class="mt-3 text-red-600 text-center">
              At least one bin needs to be added.
            </div>
            <div v-else class="overflow-x-auto mt-3">
              <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Capacity Min</th>
                    <th class="py-2 px-4 border-b text-center">Capacity Max</th>
                    <th class="py-2 px-4 border-b text-center">Movement</th>
                    <th class="py-2 px-4 border-b text-center">Reassign Bin Id</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.listBins" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b text-center">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b w-full">
                      <FormSelect v-model="row.binMasterId" class="sm:mr-2 w-32" aria-label="Default select example"
                        @change="updateCapacityValues(row.binMasterId, row)">
                        <option disabled value="">Select a Bin ID Option</option>
                        <option v-for="binMasterId in editFormData.bins" :key="binMasterId" :value="binMasterId">
                          {{ binMasterId }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.weight" type="number"
                        class="w-full px-2 py-1 border rounded large-width" step="any"/>
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.capacityMin" type="number"
                        class="w-full px-2 py-1 border rounded large-width" />
                    </td>
                    <td class="py-2 px-4 border-b ">
                      <FormInput v-model="row.capacityMax" type="number"
                        class="w-full px-2 py-1 border rounded large-width" />
                    </td>
                    <td class="py-2 px-4 border-b w-full">
                      <FormSelect v-model="row.movement" class="sm:mr-2 " aria-label="Default select example">
                        <option disabled value="">Select a Movement Option</option>
                        <option v-for="movement in editFormData.movements" :key="movement" :value="movement">
                          {{ movement }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-">
                      <FormInput v-model="row.reassignBinId" type="text"
                        class="w-full px-2 py-1 border rounded small-width" />
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button type="button" @click="deleteRow(row.id, index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addRow"
              class="mt-2 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">
              Add Bin
            </button>
          </div>
          <!-- List Machine -->
          <div v-if="editFormData.listMachines.length > 0" class="mt-5 border py-5 px-3 rounded-lg overflow-hidden">
            <h6 class="mb-2 text-lg font-medium leading-none">List Machines</h6>
            <hr>
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-3">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">No.</th>
                  <th class="py-2 px-4 border-b text-center">Code</th>
                  <th class="py-2 px-4 border-b text-center">Type</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.listMachines" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    {{ index + 1 }}
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormInput type="text" v-model="row.code" class="form-input mt-1 block w-full" />
                  </td>
                  <td class="py-2 px-4 border-b">
                    <FormSelect v-model="row.type" id="blendingRequired" class="sm:mr-2">
                      <option disabled value="">Select a Type Option</option>
                      <option>Blending</option>
                      <option>Production</option>
                      <option>Blower</option>
                      <option>Chemical Treatment</option>
                    </FormSelect>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <!-- QC Inspection List -->
          <div class="mt-5 border py-5 px-3 rounded-lg overflow-hidden hidden">
            <h6 class="mb-2 text-lg font-medium leading-none">Bin List (Quality Control Inspection) </h6>
            <hr>
            <div>
    <!-- <div class="mt-5">
      <FormLabel class="block mb-2">Shift</FormLabel>
      <FormSelect v-model="editFormData.qcInspectionList.shift"
        class="sm:mr-2 form-select block w-full" aria-label="Default select example">
        <option disabled value="">Select a Shift Option</option>
        <option v-for="name in editFormData.shifts" :key="name" :value="name">
          {{ name }}
        </option>
      </FormSelect>
    </div> -->
    <!-- <div class="mt-5">
      <FormLabel class="block mb-2">Job Status</FormLabel>
      <FormInput v-model="editFormData.qcInspectionList.jobStatus" type="text" />
    </div> -->
  </div>

            <!-- Bin List for QC Inspection Table -->
            <!-- <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Bin List for QC Inspection</h6>
            <hr> -->
            <div v-if="editFormData.qcInspectionList.binListforQCinspection.length > 0" class="overflow-x-auto">
              <table class="mt-5 min-w-full border-collapse rounded-lg overflow-hidden shadow-sm">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center">No.</th>
                    <th class="py-2 px-4 border-b text-center">Type</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Reassign Bin ID</th>
                    <th class="py-2 px-4 border-b text-center">Product Code</th>
                    <th class="py-2 px-4 border-b text-center">Dimension Check</th>
                    <th class="py-2 px-4 border-b text-center">Functional Check</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 1</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 2</th>
                    <th class="py-2 px-4 border-b text-center">Visual Check 3</th>
                    <th class="py-2 px-4 border-b text-center">Room</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(bin, index) in editFormData.qcInspectionList.binListforQCinspection" :key="index">
                    <td class="py-2 px-4 border-b text-center small-width">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.type" class="form-input mt-1 block w-full min-w-[150px]">
                        <option disabled value="">Select a Type Option</option>
                        <option>Blending</option>
                        <option>Production</option>
                        <option>Blower</option>
                        <option>Chemical Treatment</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b small-width">
                      <FormInput v-model="bin.weight" type="number"
                        class="w-full px-2 py-1 border rounded min-w-[80px]" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormInput v-model="bin.reassignBinId" type="text"
                        class="w-full px-2 py-1 border rounded min-w-[150px]" />
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.productCode" class="sm:mr-2 min-w-[100px]"
                        aria-label="Default select example">
                        <option disabled value="">Select a Product Code Option</option>
                        <option v-for="productcode in editFormData.productcodes" :key="productcode"
                          :value="productcode">
                          {{ productcode }}
                        </option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.dimensionCheck" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.functionalCheck" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck1" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck2" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.visualCheck3" class="form-input mt-1 block w-full min-w-[120px]">
                        <option disabled value="">Select an Option</option>
                        <option>Approve</option>
                        <option>Reject</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b">
                      <FormSelect v-model="bin.room" class="form-input mt-1 block w-full min-w-[100px]">
                        <option disabled value="">Select an Option</option>
                        <option>Clean</option>
                        <option>Non Clean</option>
                      </FormSelect>
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button @click="removeRowQC('binListforQCinspection', index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button type="button" @click="addRowQC('binListforQCinspection')"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add Bin</button>
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
    <!-- <Dialog
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
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <div class="hidden" ref="toPrint">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.whiteSlipId }}
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
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Resource Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.resourceCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Shift
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.shift }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.status }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Product Code
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productCode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Required
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendRequired }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Weight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendweight }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Collected
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.collected }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Pre-Blend Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.preBlendStatus }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      List Bins
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.listBins }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Reassigned Bin ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.reassignedBinId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.jobStatus }}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.productSubCodesofRecipe.length > 0">

                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="7"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        Product Sub Codes of Recipe
                      </th>
                    </tr>
                    <tr>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Job ID
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Product Code
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Percentage
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Weight
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Status
                      </th>
                    </tr>
                    <tr v-for="(row, index) in viewData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.jobId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.productCode }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.percentage }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.status }}
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.listBinsforBlend.length > 0">

                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="7"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        List Machines
                      </th>
                    </tr>
                    <tr>

                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Type
                      </th>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Weight
                      </th>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Reassign Bin ID
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Product Code
                      </th>

                    </tr>
                    <tr v-for="(row, index) in viewData.listBinsforBlend" :key="index" class="hover:bg-gray-100">
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.type }}
                      </td>
                      <td class=" px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.weight }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.reassignBinId }}
                      </td>
                      <td class="px-auto text-center text-gray-700 dark:text-white">
                        {{ row.productCode }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobId }}
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
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Resource Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.resourceCode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.shift }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.status }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Product Code
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productCode }}
                  </td>
                </tr>

              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Required
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendRequired }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Weight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendweight }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Collected
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.collected }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Pre-Blend Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.preBlendStatus }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    List Bins
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.listBins }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Reassigned Bin ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.reassignedBinId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobStatus }}
                  </td>
                </tr>


              </tbody>
            </table>

          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.productSubCodesofRecipe.length > 0">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    Product Sub Codes of Recipe
                  </th>
                </tr>
                <tr>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Job ID
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Product Code
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Percentage
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Weight
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Status
                  </th>
                </tr>
                <tr v-for="(row, index) in viewData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.jobId }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.productCode }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.percentage }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.weight }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.status }}
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.listBinsforBlend.length > 0">

            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="col" colspan="7"
                    class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                    List Machines
                  </th>
                </tr>
                <tr>

                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Type
                  </th>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Weight
                  </th>
                  <th scope="row"
                    class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Reassign Bin ID
                  </th>
                  <th scope="row"
                    class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                    Product Code
                  </th>

                </tr>
                <tr v-for="(row, index) in viewData.listBinsforBlend" :key="index" class="hover:bg-gray-100">
                  <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.type }}
                  </td>
                  <td class=" px-auto text-center text-gray-700 dark:text-white ">
                    {{ row.weight }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.reassignBinId }}
                  </td>
                  <td class="px-auto text-center text-gray-700 dark:text-white">
                    {{ row.productCode }}
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
  </Dialog> -->
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