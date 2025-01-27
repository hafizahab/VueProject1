<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";


const selectedPlatforms = ref([]);
const selectOptions = {
  placeholder: 'Select platforms',
};

import Swal from 'sweetalert2';

interface Response {
  id?: string;
  code?: string;
  remarks?: string;
  status?: string;
  containsRecipe?: any;
}

interface UserAccess {
    userId: string;
    partNumberMaster?: string[];
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
const tableRefDelete = ref<HTMLDivElement>();
const tabulatorDelete = ref<Tabulator>();
const filter = reactive({
  field: "code",
  type: "like",
  value: "",
  whiteSlipId: "",
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
          minWidth: 230,
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
          title: "CODE",
          field: "code",
          minWidth: 250,
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.code}</div>
          </div>`;
          },
        },
        {
          title: "STATUS",
          maxWidth: 250,
          minWidth: 100,
          field: "status",
          responsive: 0,
          vertAlign: "middle",
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let statusClass = '';

            if (!status) {
              status = 'N/A';
              statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
            } else {
              switch (status) {
                case 'Active':
                  statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
                  break;
                case 'Inactive':
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
    maxWidth: 300,
    minWidth: 350,
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
                    // Conditionally render "Edit" link
                    if (userAccess.partNumberMaster && userAccess.partNumberMaster.includes("Edit")) {
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
                    if (userAccess.partNumberMaster && userAccess.partNumberMaster.includes("Delete")) {
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

// Filter function
const onFilter = () => {
  if (tabulator.value) {
    tabulator.value.setFilter(filter.field, filter.type, filter.value);
  }
};

// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    field: "code",
    type: "like",
    value: "",
  });
  onFilter();
};

const onFilterDelete = () => {
  if (tabulatorDelete.value) {
    tabulatorDelete.value.setFilter(filter.field, filter.type, filter.value);
  }
};

// On reset filter
const onResetFilterDelete = () => {
  setFilter({
    ...filter,
    field: "code",
    type: "like",
    value: "",
  });
  onFilterDelete();
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


// Print
const onPrint = () => {
  if (tabulator.value) {
    tabulator.value.print();
  }
};

const initTabulatorDelete = () => {
  if (tableRefDelete.value) {
    tabulatorDelete.value = new Tabulator(tableRefDelete.value, {
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
          minWidth: 230,
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
          title: "CODE",
          field: "code",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.code}</div>
          </div>`;
          },
        },
        {
          title: "STATUS",
          minWidth: 200,
          responsive: 0,
          field: "status",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: true,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let statusClass = '';

            if (!status) {
              status = 'N/A';
              statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
            } else {
              switch (status) {
                case 'Active':
                  statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
                  break;
                case 'Deleted':
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
          maxWidth: 200,
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
            // Render "Active" link
            const activeLink = document.createElement("a");
            activeLink.classList.add("flex", "items-center", "text-success");
            activeLink.href = "javascript:;";
            activeLink.addEventListener("click", function () {
              submitShiftMasterUpdate(response.id); // Call the delete function
            });

            const deleteIcon = document.createElement("i");
            deleteIcon.classList.add("fa-solid", "fa-check-to-slot", "pr-2");
            activeLink.appendChild(deleteIcon);
            activeLink.appendChild(document.createTextNode("Undelete"));
            container.appendChild(activeLink);

            return container;
          },
        },
      ],
    });
  }

  tabulatorDelete.value?.on("renderComplete", () => {
    createIcons({
      icons,
      attrs: {
        "stroke-width": 1.5,
      },
      nameAttr: "data-lucide",
    });
  });
};

const loading = ref(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/ProductMaster/';

onMounted(() => {
  loading.value = true; // Show loading animation

  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "InActive" and productType not equal to "Powder"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive' && item.productType === 'Product');

      // Custom sorting function to sort the code by number first and then alphabetically
      const customCodeSort = (a: any, b: any) => {
        const parseCode = (code: any) => {
          const num = code.match(/^\d+/);  // Get number part at the beginning
          const alpha = code.match(/[A-Za-z]+/);  // Get alphabetic part
          return { num: num ? parseInt(num[0], 10) : Infinity, alpha: alpha ? alpha[0] : "" };
        };

        const codeA = parseCode(a.code);
        const codeB = parseCode(b.code);

        // Compare the numeric part first
        if (codeA.num !== codeB.num) {
          return codeA.num - codeB.num;
        }

        // If the numeric part is the same, compare the alphabetic part
        return codeA.alpha.localeCompare(codeB.alpha);
      };

      // Sort the filtered data using the custom sort function
      const sortedData = filteredData.sort(customCodeSort);

      // Once sorted data is received, populate the table
      console.log(sortedData);
      if (tabulator.value) {
        tabulator.value.setData(sortedData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading animation once all data is fetched
    });

  // Additional data-fetching functions
  Promise.all([fetchItems(), fetchProductCodes(), fetchPlatform(), fetchCartontypes()])
    .finally(() => {
      loading.value = false; // Hide loading once all data-fetching is complete
    });

  initTabulator();
  reInitOnResizeWindow();
});



const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/ProductMaster/GetProductMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/ProductMaster/UpdateProductMasterActive';
onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL_DELETE)
    .then(response => {
      // Filter the data to include only items with productType 'Product'
      const filteredData = response.data.result.filter((item: any) => item.productType === 'Product');

      // Populate the table with the filtered data
      console.log(filteredData);
      if (tabulatorDelete.value) {
        tabulatorDelete.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });

  initTabulatorDelete();
  reInitOnResizeWindow();
  fetchItems();
});

const selectedIds = ref<string[]>([]);
// Submit function to update ShiftMaster

const submitShiftMasterUpdate = (id: string) => {
  if (!id) {
    console.error('No ID provided for update.');
    return;
  }

  // Show confirmation alert
  Swal.fire({
    title: 'Are you sure?',
    text: 'This will undelete the data!',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, undelete it!',
  }).then((result) => {
    if (result.isConfirmed) {
      // If confirmed, proceed with the API call
      const payload = {
        idList: [{ id }]
      };

      axios.post(API_BASE_URL_UPDATE, payload)
        .then(response => {
          console.log('Success:', response.data);

          // Call update functions
          updateTableData();
          updateTableDataDelete();

          // Show success alert after successful activation
          Swal.fire({
            icon: 'success',
            title: 'Undelete Data Successfully',
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
          console.error('Error:', error);
          // Handle error (e.g., show an error message)
        });
    }
  });
};


// Form Data
const editFormData = reactive({
  id: null,
  name: "",
  code: "",
  platform: [] as string[],
  remarks: "",
  status: "",
  containsRecipe: false,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  qualitycheckrequired: false,
  secondaryProcess: false,
  weightperpiece: '',
  productType: 'Product',
  cartonType: '',
  timeTakenforBlending: '',
  timeTakenperKgforBlending: '',
  timeTakenforMachineStation: '',
  timeTakenperKgforMachineStation: '',
  timeTakenforChemicalTreatment: '',
  timeTakenperKgforChemicalTreatment: '',
  timeTakenforBlow: '',
  timeTakenperKgforBlow: '',
  productcodes: [] as string[],
  platforms: [] as string[],
  hoursForBlending: 0,
  minutesForBlending: 0,
  secondsForBlending: 0,
  hoursForBlendingKG: 0,
  minutesForBlendingKG: 0,
  secondsForBlendingKG: 0,
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  hoursForMachineStationKG: 0,
  minutesForMachineStationKG: 0,
  secondsForMachineStationKG: 0,
  hoursForChemicalTreatment: 0,
  minutesForChemicalTreatment: 0,
  secondsForChemicalTreatment: 0,
  hoursForChemicalTreatmentKG: 0,
  minutesForChemicalTreatmentKG: 0,
  secondsForChemicalTreatmentKG: 0,
  hoursForBlow: 0,
  minutesForBlow: 0,
  secondsForBlow: 0,
  hoursForBlowKG: 0,
  minutesForBlowKG: 0,
  secondsForBlowKG: 0,
  discrepencyWeight: '',
  cartonTypes: [] as string[],
  productRecipe: [
    {
      id: '',
      productId: '',
      code: '',
      percentage: '',
    }
  ]
});


const viewData = reactive({
  id: '',
  code: "",
  remarks: '',
  status: '',
  containsRecipe: false,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  qualitycheckrequired: false,
  secondaryProcess: false,
  weightperpiece: '',
  productType: '',
  cartonType: '',
  platform: '',
  discrepencyWeight: 0,
  timeTakenforBlending: '',
  timeTakenperKgforBlending: '',
  timeTakenforMachineStation: '',
  timeTakenperKgforMachineStation: '',
  timeTakenforChemicalTreatment: '',
  timeTakenperKgforChemicalTreatment: '',
  timeTakenforBlow: '',
  timeTakenperKgforBlow: '',
  productRecipe: [
    {
      id: '',
      serialNumber: '',
      productId: '',
      productCode: 0,
      percentage: '',
    }
  ]
});

interface ProductRecipe {
  id: string;
  productId: string;
  code: string;
  percentage: string;
}


const addFormData = reactive({
  id: '',
  productId: '',
  code: "",
  platform: [] as string[],
  remarks: '',
  status: 'Active',
  containsRecipe: false,
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  dustingrequired: false,
  deburringrequired: false,
  qualitycheckrequired: false,
  secondaryProcess: false,
  weightperpiece: '',
  productType: 'Product',
  timeTakenforBlending: '',
  timeTakenperKgforBlending: '',
  cartonType: '',
  timeTakenforMachineStation: '',
  timeTakenperKgforMachineStation: '',
  timeTakenforChemicalTreatment: '',
  timeTakenperKgforChemicalTreatment: '',
  timeTakenforBlow: '',
  timeTakenperKgforBlow: '',
  productRecipe: [] as ProductRecipe[],
  productcodes: [] as string[],
  platforms: [] as string[],
  hoursForBlending: 0,
  minutesForBlending: 0,
  secondsForBlending: 0,
  hoursForBlendingKG: 0,
  minutesForBlendingKG: 0,
  secondsForBlendingKG: 0,
  hoursForMachineStation: 0,
  minutesForMachineStation: 0,
  secondsForMachineStation: 0,
  hoursForMachineStationKG: 0,
  minutesForMachineStationKG: 0,
  secondsForMachineStationKG: 0,
  hoursForChemicalTreatment: 0,
  minutesForChemicalTreatment: 0,
  secondsForChemicalTreatment: 0,
  hoursForChemicalTreatmentKG: 0,
  minutesForChemicalTreatmentKG: 0,
  secondsForChemicalTreatmentKG: 0,
  discrepencyWeight: 0,
  hoursForBlow: 0,
  minutesForBlow: 0,
  secondsForBlow: 0,
  hoursForBlowKG: 0,
  minutesForBlowKG: 0,
  secondsForBlowKG: 0,
  cartonTypes: [] as string[],
});

// Define reactive permission variables for partNumberMaster
const canEditPartNumberMaster = ref(false);
const canDeletePartNumberMaster = ref(false);
const canCreatePartNumberMaster = ref(false);

// Define the fetchUserPartNumberPermissions function
const fetchUserPartNumberPermissions = async () => {
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

            const partNumberMaster = userDetails.partNumberMaster || ''; // Ensure the value is a string

            // Check if the string contains "Create", "Delete", and "Edit" for partNumberMaster
            canCreatePartNumberMaster.value = partNumberMaster.includes('Create');
            canDeletePartNumberMaster.value = partNumberMaster.includes('Delete');
            canEditPartNumberMaster.value = partNumberMaster.includes('Edit');

            console.log('canCreatePartNumberMaster:', canCreatePartNumberMaster.value); // Debugging log
            console.log('canDeletePartNumberMaster:', canDeletePartNumberMaster.value); // Debugging log
            console.log('canEditPartNumberMaster:', canEditPartNumberMaster.value); // Debugging log
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

// Call the function on component mount
onMounted(async () => {
    await fetchUserPartNumberPermissions();
});


const toggleWetTreatment = (type: string) => {
  if (type === 'edit') {
    const newValue = !editFormData.wettreatmentrequired;
    editFormData.wettreatmentrequired = newValue;
    if (newValue) {
      editFormData.plasmatreatmentrequired = false;
    }
  } else if (type === 'add') {
    const newValue = !addFormData.wettreatmentrequired;
    addFormData.wettreatmentrequired = newValue;
    if (newValue) {
      addFormData.plasmatreatmentrequired = false;
    }
  }
};

const togglePlasmaTreatment = (type: string) => {
  if (type === 'edit') {
    const newValue = !editFormData.plasmatreatmentrequired;
    editFormData.plasmatreatmentrequired = newValue;
    if (newValue) {
      editFormData.wettreatmentrequired = false;
    }
  } else if (type === 'add') {
    const newValue = !addFormData.plasmatreatmentrequired;
    addFormData.plasmatreatmentrequired = newValue;
    if (newValue) {
      addFormData.wettreatmentrequired = false;
    }
  }
};

const handleWetTreatmentChange = () => {
  const newValue = !editFormData.wettreatmentrequired;
  editFormData.wettreatmentrequired = newValue;

  if (newValue) {
    editFormData.plasmatreatmentrequired = false;
  }
};

const handlePlasmaTreatmentChange = () => {
  const newValue = !editFormData.plasmatreatmentrequired;
  editFormData.plasmatreatmentrequired = newValue;

  if (newValue) {
    editFormData.wettreatmentrequired = false;
  }
};



// Add Carton Type dropdown state
const isCartonTypeDropdownOpen = ref(false);
const searchCartonTypeQuery = ref('');
const selectedCartonType = ref(addFormData.cartonType);

// Computed property to filter carton types based on search query
const filteredCartonTypes = computed(() => {
  if (!searchCartonTypeQuery.value) {
    return addFormData.cartonTypes;
  }
  return addFormData.cartonTypes.filter((cartonType) =>
    cartonType.toLowerCase().includes(searchCartonTypeQuery.value.toLowerCase())
  );
});

// Function to toggle dropdown open/close for Add Carton Type
const toggleCartonTypeDropdown = () => {
  isCartonTypeDropdownOpen.value = !isCartonTypeDropdownOpen.value;
  searchCartonTypeQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a Carton Type
const selectCartonType = (cartonType : string) => {
  selectedCartonType.value = cartonType;
  addFormData.cartonType = cartonType;
  isCartonTypeDropdownOpen.value = false; // Close the dropdown after selecting
};

// Edit Carton Type dropdown state
const isEditCartonTypeDropdownOpen = ref(false);
const searchEditCartonTypeQuery = ref('');
const selectedEditCartonType = ref(editFormData.cartonType);

// Computed property to filter carton types based on search query (for edit context)
const filteredEditCartonTypes = computed(() => {
  if (!searchEditCartonTypeQuery.value) {
    return editFormData.cartonTypes;
  }
  return editFormData.cartonTypes.filter((cartonType) =>
    cartonType.toLowerCase().includes(searchEditCartonTypeQuery.value.toLowerCase())
  );
});

// Function to toggle dropdown open/close for Edit Carton Type
const toggleEditCartonTypeDropdown = () => {
  isEditCartonTypeDropdownOpen.value = !isEditCartonTypeDropdownOpen.value;
  searchEditCartonTypeQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a Carton Type (for edit context)
const selectEditCartonType = (cartonType : string) => {
  selectedEditCartonType.value = cartonType;
  editFormData.cartonType = cartonType;
  isEditCartonTypeDropdownOpen.value = false; // Close the dropdown after selecting
};





const fetchCartontypes = () => {
  axios.get('http://10.87.0.33:8082/api/CartonMaster/GetCartonDDL')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Map the nameData array to extract the 'name' property without filtering
        addFormData.cartonTypes = nameData.map(item => item.name);
        editFormData.cartonTypes = nameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

// Explicitly define types for searchQueries and isDropdownOpen
const isDropdownOpen = ref<Record<number, boolean>>({});
const searchQueries = ref<Record<number, string>>({});

// Function to toggle dropdown open/close for a specific row
const toggleDropdown = (index: number) => {
  isDropdownOpen.value[index] = !isDropdownOpen.value[index];
  searchQueries.value[index] = ''; // Clear search query when dropdown is opened
};

// Function to filter product codes based on search query for each row
const filteredProductCodes = (searchQuery: string) => {
  if (!searchQuery) return addFormData.productcodes;
  return addFormData.productcodes.filter((productcode: string) =>
    productcode.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

// Function to select a product code for a specific row
const selectProductCode = (productcode: string, index: number) => {
  addFormData.productRecipe[index].code = productcode;
  isDropdownOpen.value[index] = false; // Close the dropdown after selecting
};

// Define state variables for editFormData dropdown and search
const isEditDropdownOpen = ref<Record<number, boolean>>({});
const editSearchQueries = ref<Record<number, string>>({});

// Function to toggle dropdown open/close for a specific row in editFormData
const toggleEditDropdown = (index: number) => {
  isEditDropdownOpen.value[index] = !isEditDropdownOpen.value[index];
  editSearchQueries.value[index] = ''; // Clear search query when dropdown is opened
};

// Function to filter product codes based on search query for each row in editFormData
const filteredEditProductCodes = (searchQuery: string) => {
  if (!searchQuery) return editFormData.productcodes;
  return editFormData.productcodes.filter((productcode: string) =>
    productcode.toLowerCase().includes(searchQuery.toLowerCase())
  );
};

// Function to select a product code for a specific row in editFormData
const selectEditProductCode = (productcode: string, index: number) => {
  editFormData.productRecipe[index].code = productcode;
  isEditDropdownOpen.value[index] = false; // Close the dropdown after selecting
};


const fetchProductCodes = () => {
  axios.get('http://10.87.0.33:8082/api/ProductMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter items with status "Inactive" or "InActive" and of type "Powder"
        const activeNameData = nameData.filter(
          item => item.status.toLowerCase() !== 'inactive' && item.productType === 'Powder'
        );

        // Use a Set to filter out duplicate codes
        const uniqueCodes = [...new Set(activeNameData.map(item => item.code))];

        // Assign the unique codes to both addFormData and editFormData
        addFormData.productcodes = uniqueCodes;
        editFormData.productcodes = uniqueCodes;
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const platforms = ref([]);

const fetchPlatform = async () => {
  axios.get('http://10.87.0.33:8082/api/PlatformMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive'
        );

        // Map the activeNameData array to extract the 'name' property
        addFormData.platforms = activeNameData.map(item => item.name);
        editFormData.platforms = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const generateUUID = () => {
  // Function to generate a simple UUID (GUID) for example purposes
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0,
      v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const addRow = (formData: any) => {
  formData.productRecipe.push({
    id: generateUUID(),
    productId: formData.id,
    code: '',
    percentage: '',
  });
};

// Add row to addFormData
const addRowToAddForm = () => {
  addRow(addFormData);
};

// Add row to editFormData
const addRowToEditForm = () => {
  addRow(editFormData);
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

// Helper function to parse and sort product codes
function generateSerialNumbers(sortedSubCodes: any[]) {
  const serialNumbers: { [key: string]: string } = {};

  const generateSerial = (code: string, parentSerial: string = ''): string => {
    if (!serialNumbers[code]) {
      const siblings = sortedSubCodes.filter((subCode: any) => {
        const subCodeParts = subCode.productCode.split('|');
        const codeParts = code.split('|');
        return (
          subCodeParts.length === codeParts.length &&
          subCodeParts.slice(0, -1).join('|') === codeParts.slice(0, -1).join('|')
        );
      });

      const siblingIndex = siblings.findIndex((subCode: any) => subCode.productCode === code) + 1;
      serialNumbers[code] = `${parentSerial}${siblingIndex}`;
    }
    return serialNumbers[code];
  };

  sortedSubCodes.forEach((subCode: any) => {
    const codeParts = subCode.productCode.split('|');
    let serial = '';
    codeParts.forEach((_part: any, index: number) => {
      const partialCode = codeParts.slice(0, index + 1).join('|');
      serial = generateSerial(partialCode, serial ? `${serial}.` : '');
    });
  });

  sortedSubCodes.forEach((subCode: any) => {
    subCode.serialNumber = serialNumbers[subCode.productCode].replace(/^0*(\.0*)?/, ''); // Remove leading zeros and '0.'
  });

  return sortedSubCodes;
}



function sortProductSubCodes(subCodes: any) {
  subCodes.sort((a: any, b: any) => {
    const aParts = parseProductCode(a.productCode);
    const bParts = parseProductCode(b.productCode);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] !== bParts[i]) {
        return (aParts[i] || 0) - (bParts[i] || 0);
      }
    }
    return 0;
  });

  return generateSerialNumbers(subCodes);
}

// Helper function to parse and sort product codes
function parseProductCode(code: string): number[] {
  return code.split('|').map((part) => {
    // Extract numeric parts only, removing any non-digit characters
    return parseInt(part.replace(/\D/g, ''), 10);
  });
}

// Helper function to format percentage without trailing zeros
const formatPercentage = (value : any) => {
  return parseFloat(value).toString(); // Removes unnecessary trailing zeros
};

// Fetch and Set Data for Edit/View
const fetchAndSetData = (id: string, formData: any, modalSetter: (value: boolean) => void, isView: boolean = false) => {
  console.log(`Fetching data for ID: ${id}`);
  loading.value = true; // Start loading animation

  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      console.log(`Fetched data:`, data);
      if (data && data.length > 0) {
        const [firstItem] = data;

        // Helper function to split time into hours, minutes, and seconds
        const splitTime = (timeString : any) => {
          if (!timeString) {
            return { hours: 0, minutes: 0, seconds: 0 };
          }
          const [hours, minutes, seconds] = timeString.split(':').map(Number);
          return { hours, minutes, seconds };
        };

        // Extract and split times
        const blendingTime = splitTime(firstItem.timeTakenforBlending);
        const blendingTimeKG = splitTime(firstItem.timeTakenperKgforBlending);
        const machineStationTime = splitTime(firstItem.timeTakenforMachineStation);
        const machineStationTimeKG = splitTime(firstItem.timeTakenperKgforMachineStation);
        const chemicalTreatmentTime = splitTime(firstItem.timeTakenforChemicalTreatment);
        const chemicalTreatmentTimeKG = splitTime(firstItem.timeTakenperKgforChemicalTreatment);
        const blowTime = splitTime(firstItem.timeTakenforBlow);
        const blowTimeKG = splitTime(firstItem.timeTakenperKgforBlow);

        // Populate formData
        Object.assign(formData, {
          id: firstItem.id,
          code: firstItem.code,
          remarks: firstItem.remarks,
          type: firstItem.type,
          status: firstItem.status,
          containsRecipe: firstItem.containsRecipe,
          wettreatmentrequired: firstItem.wettreatmentrequired,
          plasmatreatmentrequired: firstItem.plasmatreatmentrequired,
          dustingrequired: firstItem.dustingrequired,
          deburringrequired: firstItem.deburringrequired,
          qualitycheckrequired: firstItem.qualitycheckrequired,
          weightperpiece: firstItem.weightperpiece,
          discrepencyWeight: firstItem.discrepencyWeight,
          productType: firstItem.productType,
          cartonType: firstItem.cartonType,
          timeTakenforBlending: firstItem.timeTakenforBlending,
          timeTakenforMachineStation: firstItem.timeTakenforMachineStation,
          timeTakenforChemicalTreatment: firstItem.timeTakenforChemicalTreatment,
          timeTakenforBlow: firstItem.timeTakenforBlow,
          timeTakenperKgforBlending: firstItem.timeTakenperKgforBlending,
          timeTakenperKgforMachineStation: firstItem.timeTakenperKgforMachineStation,
          timeTakenperKgforChemicalTreatment: firstItem.timeTakenperKgforChemicalTreatment,
          timeTakenperKgforBlow: firstItem.timeTakenperKgforBlow,
          secondaryProcess: firstItem.secondaryProcess,
          platform: firstItem.platform ? firstItem.platform.split(',') : [],
          productRecipe: firstItem.productRecipe
            ? firstItem.productRecipe.map((item : any) => ({
                ...item,
                percentage: formatPercentage(item.percentage) // Format percentage values
              }))
            : [],
          // Time split into hours, minutes, and seconds
          hoursForBlending: blendingTime.hours,
          minutesForBlending: blendingTime.minutes,
          secondsForBlending: blendingTime.seconds,
          hoursForBlendingKG: blendingTimeKG.hours,
          minutesForBlendingKG: blendingTimeKG.minutes,
          secondsForBlendingKG: blendingTimeKG.seconds,
          hoursForMachineStation: machineStationTime.hours,
          minutesForMachineStation: machineStationTime.minutes,
          secondsForMachineStation: machineStationTime.seconds,
          hoursForMachineStationKG: machineStationTimeKG.hours,
          minutesForMachineStationKG: machineStationTimeKG.minutes,
          secondsForMachineStationKG: machineStationTimeKG.seconds,
          hoursForChemicalTreatment: chemicalTreatmentTime.hours,
          minutesForChemicalTreatment: chemicalTreatmentTime.minutes,
          secondsForChemicalTreatment: chemicalTreatmentTime.seconds,
          hoursForChemicalTreatmentKG: chemicalTreatmentTimeKG.hours,
          minutesForChemicalTreatmentKG: chemicalTreatmentTimeKG.minutes,
          secondsForChemicalTreatmentKG: chemicalTreatmentTimeKG.seconds,
          hoursForBlow: blowTime.hours,
          minutesForBlow: blowTime.minutes,
          secondsForBlow: blowTime.seconds,
          hoursForBlowKG: blowTimeKG.hours,
          minutesForBlowKG: blowTimeKG.minutes,
          secondsForBlowKG: blowTimeKG.seconds,
        });

        // Fetch product recipe data if viewing details
        if (isView) {
          axios.get(`${API_BASE_URL}GetProductReceiptdatabyProductCode/${firstItem.code}`)
            .then(recipeResponse => {
              let recipeData = recipeResponse.data.result;
              console.log(`Fetched recipe data:`, recipeData);
              recipeData = recipeData.map((item : any) => ({
                ...item,
                percentage: formatPercentage(item.percentage) // Format percentage values
              }));
              recipeData = sortProductSubCodes(recipeData);
              formData.productRecipe = recipeData || [];
              modalSetter(true);
            })
            .catch(error => handleError(error, 'Error fetching product recipe data'))
            .finally(() => {
              loading.value = false; // Stop loading animation after data is fetched
            });
        } else {
          modalSetter(true);
          loading.value = false; // Stop loading animation if no additional data fetch is required
        }
      } else {
        console.error('No data found for the specified ID:', id);
        loading.value = false; // Stop loading if no data is found
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'))
    .finally(() => {
      loading.value = false; // Ensure loading is disabled in case of an error
    });
};



const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);


// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading animation

axios.get(API_BASE_URL)
  .then(response => {
    // Filter out data with status "InActive" and productType not equal to "Powder"
    const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive' && item.productType === 'Product');

    // Custom sorting function to sort the code by number first and then alphabetically
    const customCodeSort = (a: any, b: any) => {
      const parseCode = (code: any) => {
        const num = code.match(/^\d+/);  // Get number part at the beginning
        const alpha = code.match(/[A-Za-z]+/);  // Get alphabetic part
        return { num: num ? parseInt(num[0], 10) : Infinity, alpha: alpha ? alpha[0] : "" };
      };

      const codeA = parseCode(a.code);
      const codeB = parseCode(b.code);

      // Compare the numeric part first
      if (codeA.num !== codeB.num) {
        return codeA.num - codeB.num;
      }

      // If the numeric part is the same, compare the alphabetic part
      return codeA.alpha.localeCompare(codeB.alpha);
    };

    // Sort the filtered data using the custom sort function
    const sortedData = filteredData.sort(customCodeSort);

    // Once sorted data is received, populate the table
    console.log(sortedData);
    if (tabulator.value) {
      tabulator.value.setData(sortedData);
    }
  })
  .catch(error => {
    console.error('Error fetching data:', error);
  })
  .finally(() => {
    loading.value = false; // Hide loading animation once all data is fetched
  });

// Additional data-fetching functions
Promise.all([fetchItems(), fetchProductCodes(), fetchPlatform(), fetchCartontypes()])
  .finally(() => {
    loading.value = false; // Hide loading once all data-fetching is complete
  });

initTabulator();
reInitOnResizeWindow();

};
const updateTableDataDelete = () => {
  axios.get(API_BASE_URL_DELETE)
    .then(response => {
      // Filter the data to include only items with productType 'Product'
      const filteredData = response.data.result.filter((item: any) => item.productType === 'Product');

      // Populate the table with the filtered data
      console.log(filteredData);
      if (tabulatorDelete.value) {
        tabulatorDelete.value.setData(filteredData);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });

};

const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};

const validatePayload = (formData : any) => {
  const formatTime = (time : any) => (time.includes("undefined") ? "0" : time);

  return {
    ...formData,
    timeTakenforBlending: formatTime(formData.timeTakenforBlending),
    timeTakenperKgforBlending: formatTime(formData.timeTakenperKgforBlending),
    timeTakenforMachineStation: formatTime(formData.timeTakenforMachineStation),
    timeTakenperKgforMachineStation: formatTime(formData.timeTakenperKgforMachineStation),
    timeTakenforChemicalTreatment: formatTime(formData.timeTakenforChemicalTreatment),
    timeTakenperKgforChemicalTreatment: formatTime(formData.timeTakenperKgforChemicalTreatment),
    timeTakenforBlow: formatTime(formData.timeTakenforBlow),
    timeTakenperKgforBlow: formatTime(formData.timeTakenperKgforBlow),
  };
};


// Update Role
const updateRole = () => {
  formSubmitted.value = true;

  // Combined validation for required fields and weightPerPiece
  if (!editFormData.code ||
    !editFormData.status ||
    (editFormData.containsRecipe && editFormData.productRecipe.length === 0) ||
    (!editFormData.weightperpiece || // Check if weightperpiece is empty
      isNaN(parseFloat(editFormData.weightperpiece)) || // Check if it's not a number
      editFormData.weightperpiece.toString().split('.')[1]?.length > 10)) { // Check if it has more than 4 decimal places

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

  // Check total percentage and decimals only if the "Contains Recipe" checkbox is checked
  if (editFormData.containsRecipe) {
    const totalPercentage = editFormData.productRecipe.reduce((sum, row) => {
      const percentage = parseFloat(row.percentage);
      if (isNaN(percentage)) return sum;
      return sum + parseFloat(percentage.toFixed(3));
    }, 0);

    const hasInvalidDecimals = editFormData.productRecipe.some(row => {
      const percentage = parseFloat(row.percentage);
      if (isNaN(percentage)) return false;
      const decimalPart = row.percentage.toString().split('.')[1];
      return decimalPart && decimalPart.length > 3;
    });

    const marginOfError = 0.001;

    if (Math.abs(totalPercentage - 100) > marginOfError || hasInvalidDecimals) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Product Recipe',
        text: totalPercentage !== 100
          ? 'The total percentage of the product recipe must be exactly 100%'
          : 'Percentage values must have at most 3 decimal places!',
        showConfirmButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Fix Errors',
      });
      return; // Stop further processing
    }
  }

  const existingUser = items.value.find(
    user => user.code === editFormData.code && user.id !== editFormData.id
  );

  if (existingUser) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Code',
      html: `<b>${editFormData.code}</b> already exists, please try another code name`,
      confirmButtonText: 'Try Again',
      confirmButtonColor: '#d33',
    });
    return;
  }

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
      editFormData.productRecipe = editFormData.productRecipe.map(recipe => {
        if (!recipe.id) {
          recipe.id = generateUUID();
        }
        return recipe;
      });

      // Ensure discrepencyWeight is a valid number or set to 0
      if (isNaN(parseFloat(editFormData.discrepencyWeight))) {
        editFormData.discrepencyWeight = '0';
      }

      // Convert platform array to comma-separated string
      let formData = {
        ...editFormData,
        platform: Array.isArray(editFormData.platform) ? editFormData.platform.join(',') : editFormData.platform,
      };

      // Validate and format payload
      formData = validatePayload(formData);

      console.log('Payload being sent:', formData);

      axios.put(`${API_BASE_URL}${formData.id}`, formData)
        .then(response => {
          console.log('API Response:', response); // Log the full response object
          console.log('Response Data:', response.data); // Log only the response data
          setEditSlideOver(false);
          updateTableData();
          updateTableDataDelete();
          fetchItems();
          fetchProductCodes();
          fetchPlatform();
          fetchCartontypes();
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
          console.error('Error updating data:', error); // Log the error object
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating the data.',
          });
        });
    }
  });
};






const totalEditPercentage = computed<number>(() => {
  const total = editFormData.productRecipe.reduce((sum, row) => {
    const percentage = Number(row.percentage) || 0;
    return sum + percentage;
  }, 0);
  return parseFloat(total.toFixed(3)); // Keeping it to 3 decimal places as a number
});


const items = ref<Response[]>([]);


const fetchItems = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
    items.value = filteredData;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};


const deleteAddRow = (index: number) => {
  addFormData.productRecipe.splice(index, 1);
};


const DELETE_API_BASE_URL = 'http://10.87.0.33:8082/api/ProductMaster/DeleteProductRecipeById/';

const deleteRow = (id: string, index: number) => {
  if (id) {
    // If the id exists, it means the row has been submitted to the server and needs an API call to delete it.
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the data from the server!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then(result => {
      if (result.isConfirmed) {
        axios.delete(`${DELETE_API_BASE_URL}${id}`)
          .then(() => {
            editFormData.productRecipe.splice(index, 1);
            Swal.fire({
              icon: 'success',
              title: 'Deleted Successfully',
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
          .catch(error => handleError(error, 'Error deleting sub-code'));
      }
    });
  } else {
    // If the id does not exist, it means the row is not yet submitted and can be deleted locally.
    editFormData.productRecipe.splice(index, 1);
  }
};

// Add Role
const addRole = () => {
  formSubmitted.value = true;

  // Combined validation for required fields and weightPerPiece
  if (formSubmitted.value &&
    (!addFormData.code ||
      !addFormData.status ||
      (addFormData.containsRecipe && addFormData.productRecipe.length === 0) ||
      (addFormData.weightperpiece === '' || // Check if weightperpiece is empty
        isNaN(parseFloat(addFormData.weightperpiece)) || // Check if it's not a number
        addFormData.weightperpiece.toString().split('.')[1]?.length > 10))) { // Check if it has more than 4 decimal places
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
    return; // Stop further processing
  }

  // Check total percentage and decimals only if the "Contains Recipe" checkbox is checked
  if (addFormData.containsRecipe) {
    const totalPercentage = addFormData.productRecipe.reduce((sum, row) => {
      const percentage = parseFloat(row.percentage);
      if (isNaN(percentage)) return sum;
      return sum + parseFloat(percentage.toFixed(3));
    }, 0);

    const hasInvalidDecimals = addFormData.productRecipe.some(row => {
      const percentage = parseFloat(row.percentage);
      if (isNaN(percentage)) return false;
      const decimalPart = row.percentage.toString().split('.')[1];
      return decimalPart && decimalPart.length > 3;
    });

    const marginOfError = 0.001;

    if (Math.abs(totalPercentage - 100) > marginOfError || hasInvalidDecimals) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Product Recipe',
        text: totalPercentage !== 100
          ? 'The total percentage of the product recipe must be exactly 100%'
          : 'Percentage values must have at most 3 decimal places!',
        showConfirmButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Fix Errors',
      });
      return; // Stop further processing
    }
  }

  const existingUser = items.value.find(user => user.code === addFormData.code);
  if (existingUser) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Code',
      html: `<b>${addFormData.code}</b> already exists, please try another code name`,
      confirmButtonText: 'Try Again',
      confirmButtonColor: '#d33',
    });
    formSubmitted.value = false;
    return;
  }

  // Validate and format the payload
  const formData = validatePayload({
  code: addFormData.code,
  remarks: addFormData.remarks || "Default Remarks",
  status: addFormData.status,
  containsRecipe: addFormData.containsRecipe,
  wettreatmentrequired: addFormData.wettreatmentrequired,
  plasmatreatmentrequired: addFormData.plasmatreatmentrequired,
  dustingrequired: addFormData.dustingrequired,
  deburringrequired: addFormData.deburringrequired,
  qualitycheckrequired: addFormData.qualitycheckrequired,
  weightperpiece: parseFloat(addFormData.weightperpiece) || 0,
  productType: addFormData.productType,
  platform: addFormData.platform.join(','), // Convert array to comma-separated string
  timeTakenforBlending: addFormData.timeTakenforBlending || "0",
  timeTakenforMachineStation: addFormData.timeTakenforMachineStation || "0",
  timeTakenforChemicalTreatment: addFormData.timeTakenforChemicalTreatment || "0",
  timeTakenforBlow: addFormData.timeTakenforBlow || "0",
  timeTakenforQCI:  "0",
  secondaryProcess: addFormData.secondaryProcess,
  cartonType: addFormData.cartonType || "Default Carton Type", // Provide a default value
  timeTakenperKgforBlending: addFormData.timeTakenperKgforBlending || "0",
  timeTakenperKgforMachineStation: addFormData.timeTakenperKgforMachineStation || "0",
  timeTakenperKgforChemicalTreatment: addFormData.timeTakenperKgforChemicalTreatment || "0",
  timeTakenperKgforBlow: addFormData.timeTakenperKgforBlow || "0",
  timeTakenperKgforQCI: "0",
  type: "Default Type", // New field `type`
  discrepencyWeight: addFormData.discrepencyWeight || 0,
  productRecipe: addFormData.containsRecipe
    ? addFormData.productRecipe.map(recipe => ({
        code: recipe.code,
        percentage: parseFloat(recipe.percentage) || 0,
      }))
    : [],
});


  console.log('Payload before submission:', formData);

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
      axios.post(API_BASE_URL, formData)
        .then(response => {
          if (response.data.message === `Unable to complete request. Product Master Data already exists`) {
            Swal.fire({
              icon: 'error',
              title: 'Duplicate Code',
              html: `<b>${addFormData.code}</b> already exists, please try another code name`,
              confirmButtonText: 'Try Again',
              confirmButtonColor: '#d33',
            });
          } else {
            Swal.fire({
              icon: 'success',
              title: 'Data Added Successfully',
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
            setAddSlideover(false);
            resetFormData(addFormData);
            updateTableData();
            updateTableDataDelete();
            fetchItems();
            fetchProductCodes();
            fetchPlatform();
            fetchCartontypes();
          }
        })
        .catch(error => handleError(error, 'Error adding role'));
    }
    formSubmitted.value = false;
  });
};







const totalPercentage = computed<number>(() => {
  const total = addFormData.productRecipe.reduce((sum, row) => {
    const percentage = Number(row.percentage) || 0;
    return sum + percentage;
  }, 0);
  return parseFloat(total.toFixed(3)); // Keeping it to 3 decimal places as a number
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
          updateTableDataDelete();
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
  Object.keys(formData).forEach(key => {
    if (Array.isArray(formData[key])) {
      formData[key] = [];
    } else if (typeof formData[key] === 'object' && formData[key] !== null) {
      formData[key] = {};
    } else {
      formData[key] = '';
    }
  });
  formData.status = 'Active';
  addFormData.code = '';
  addFormData.productType = 'Product';
  addFormData.containsRecipe = false;
  addFormData.secondaryProcess = false;
  addFormData.wettreatmentrequired = false;
  addFormData.plasmatreatmentrequired = false;
  addFormData.dustingrequired = false;
  addFormData.deburringrequired = false;
  addFormData.qualitycheckrequired = false;
  addFormData.weightperpiece = '';
  addFormData.hoursForBlending = 0;
  addFormData.minutesForBlending = 0;
  addFormData.secondsForBlending = 0;
  addFormData.hoursForMachineStation = 0;
  addFormData.minutesForMachineStation = 0;
  addFormData.secondsForMachineStation = 0;
  addFormData.hoursForChemicalTreatment = 0;
  addFormData.minutesForChemicalTreatment = 0;
  addFormData.secondsForChemicalTreatment = 0;
  addFormData.hoursForBlow = 0;
  addFormData.minutesForBlow = 0;
  addFormData.secondsForBlow = 0;
  addFormData.cartonType = ''
  addFormData.productRecipe = [];
  addFormData.discrepencyWeight = 0;
};



const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;

};

const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
  if (!value) {
    resetEditFormData();
  }

};

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

const resetEditFormData = () => {
  editFormData.platform = [];
  editFormData.cartonType = '';
};

// Watch to synchronize timeTakenforBlending with formatted time values
watch(
  () => [addFormData.hoursForBlending, addFormData.minutesForBlending, addFormData.secondsForBlending],
  () => {
    addFormData.timeTakenforBlending = `${formatNumber(addFormData.hoursForBlending)}:${formatNumber(addFormData.minutesForBlending)}:${formatNumber(addFormData.secondsForBlending)}`;
  },
  { immediate: true }
);
watch(
  () => [addFormData.hoursForBlendingKG, addFormData.minutesForBlendingKG, addFormData.secondsForBlendingKG],
  () => {
    addFormData.timeTakenperKgforBlending = `${formatNumber(addFormData.hoursForBlendingKG)}:${formatNumber(addFormData.minutesForBlendingKG)}:${formatNumber(addFormData.secondsForBlendingKG)}`;
  },
  { immediate: true }
);

watch(
  () => [addFormData.hoursForMachineStation, addFormData.minutesForMachineStation, addFormData.secondsForMachineStation],
  () => {
    addFormData.timeTakenforMachineStation = `${formatNumber(addFormData.hoursForMachineStation)}:${formatNumber(addFormData.minutesForMachineStation)}:${formatNumber(addFormData.secondsForMachineStation)}`;
  },
  { immediate: true }
);
watch(
  () => [addFormData.hoursForMachineStationKG, addFormData.minutesForMachineStationKG, addFormData.secondsForMachineStationKG],
  () => {
    addFormData.timeTakenperKgforMachineStation = `${formatNumber(addFormData.hoursForMachineStationKG)}:${formatNumber(addFormData.minutesForMachineStationKG)}:${formatNumber(addFormData.secondsForMachineStationKG)}`;
  },
  { immediate: true }
);

watch(
  () => [addFormData.hoursForChemicalTreatment, addFormData.minutesForChemicalTreatment, addFormData.secondsForChemicalTreatment],
  () => {
    addFormData.timeTakenforChemicalTreatment = `${formatNumber(addFormData.hoursForChemicalTreatment)}:${formatNumber(addFormData.minutesForChemicalTreatment)}:${formatNumber(addFormData.secondsForChemicalTreatment)}`;
  },
  { immediate: true }
);
watch(
  () => [addFormData.hoursForChemicalTreatmentKG, addFormData.minutesForChemicalTreatmentKG, addFormData.secondsForChemicalTreatmentKG],
  () => {
    addFormData.timeTakenperKgforChemicalTreatment = `${formatNumber(addFormData.hoursForChemicalTreatmentKG)}:${formatNumber(addFormData.minutesForChemicalTreatmentKG)}:${formatNumber(addFormData.secondsForChemicalTreatmentKG)}`;
  },
  { immediate: true }
);

watch(
  () => [addFormData.hoursForBlow, addFormData.minutesForBlow, addFormData.secondsForBlow],
  () => {
    addFormData.timeTakenforBlow = `${formatNumber(addFormData.hoursForBlow)}:${formatNumber(addFormData.minutesForBlow)}:${formatNumber(addFormData.secondsForBlow)}`;
  },
  { immediate: true }
);
watch(
  () => [addFormData.hoursForBlowKG, addFormData.minutesForBlowKG, addFormData.secondsForBlowKG],
  () => {
    addFormData.timeTakenperKgforBlow = `${formatNumber(addFormData.hoursForBlowKG)}:${formatNumber(addFormData.minutesForBlowKG)}:${formatNumber(addFormData.secondsForBlowKG)}`;
  },
  { immediate: true }
);


// Watch to synchronize timeTakenforBlending with formatted time values
watch(
  () => [editFormData.hoursForBlending, editFormData.minutesForBlending, editFormData.secondsForBlending],
  () => {
    editFormData.timeTakenforBlending = `${formatNumber(editFormData.hoursForBlending)}:${formatNumber(editFormData.minutesForBlending)}:${formatNumber(editFormData.secondsForBlending)}`;
  },
  { immediate: true }
);
watch(
  () => [editFormData.hoursForBlendingKG, editFormData.minutesForBlendingKG, editFormData.secondsForBlendingKG],
  () => {
    editFormData.timeTakenperKgforBlending = `${formatNumber(editFormData.hoursForBlendingKG)}:${formatNumber(editFormData.minutesForBlendingKG)}:${formatNumber(editFormData.secondsForBlendingKG)}`;
  },
  { immediate: true }
);

watch(
  () => [editFormData.hoursForMachineStation, editFormData.minutesForMachineStation, editFormData.secondsForMachineStation],
  () => {
    editFormData.timeTakenforMachineStation = `${formatNumber(editFormData.hoursForMachineStation)}:${formatNumber(editFormData.minutesForMachineStation)}:${formatNumber(editFormData.secondsForMachineStation)}`;
  },
  { immediate: true }
);
watch(
  () => [editFormData.hoursForMachineStationKG, editFormData.minutesForMachineStationKG, editFormData.secondsForMachineStationKG],
  () => {
    editFormData.timeTakenperKgforMachineStation = `${formatNumber(editFormData.hoursForMachineStationKG)}:${formatNumber(editFormData.minutesForMachineStationKG)}:${formatNumber(editFormData.secondsForMachineStationKG)}`;
  },
  { immediate: true }
);

watch(
  () => [editFormData.hoursForChemicalTreatment, editFormData.minutesForChemicalTreatment, editFormData.secondsForChemicalTreatment],
  () => {
    editFormData.timeTakenforChemicalTreatment = `${formatNumber(editFormData.hoursForChemicalTreatment)}:${formatNumber(editFormData.minutesForChemicalTreatment)}:${formatNumber(editFormData.secondsForChemicalTreatment)}`;
  },
  { immediate: true }
);
watch(
  () => [editFormData.hoursForChemicalTreatmentKG, editFormData.minutesForChemicalTreatmentKG, editFormData.secondsForChemicalTreatmentKG],
  () => {
    editFormData.timeTakenperKgforChemicalTreatment = `${formatNumber(editFormData.hoursForChemicalTreatmentKG)}:${formatNumber(editFormData.minutesForChemicalTreatmentKG)}:${formatNumber(editFormData.secondsForChemicalTreatmentKG)}`;
  },
  { immediate: true }
);

watch(
  () => [editFormData.hoursForBlow, editFormData.minutesForBlow, editFormData.secondsForBlow],
  () => {
    editFormData.timeTakenforBlow = `${formatNumber(editFormData.hoursForBlow)}:${formatNumber(editFormData.minutesForBlow)}:${formatNumber(editFormData.secondsForBlow)}`;
  },
  { immediate: true }
);
watch(
  () => [editFormData.hoursForBlowKG, editFormData.minutesForBlowKG, editFormData.secondsForBlowKG],
  () => {
    editFormData.timeTakenperKgforBlow = `${formatNumber(editFormData.hoursForBlowKG)}:${formatNumber(editFormData.minutesForBlowKG)}:${formatNumber(editFormData.secondsForBlowKG)}`;
  },
  { immediate: true }
);

function formatNumber(value: any) {
  return String(value).padStart(2, '0');
}
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
    <h2 class="mr-auto text-lg font-medium">Part Number Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreatePartNumberMaster">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Part Number Master
      </Button>

    </div>
  </div>
  <!-- BEGIN: HTML Table Data -->
  <div class="p-5 mt-5 intro-y box">
    <div class="flex flex-col sm:flex-row sm:items-end xl:items-start">
      <form id="tabulator-html-filter-form" class="xl:flex sm:mr-auto" @submit="(e) => {
        e.preventDefault();
        onFilter();
      }
        ">
        <div class="items-center sm:flex sm:mr-4">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Field
          </label>
          <FormSelect id="tabulator-html-filter-field" v-model="filter.field"
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto" disabled>
            <option value="code">Code</option>
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
            @click="onFilter">
            Search
          </Button>
          <Button id="tabulator-html-filter-reset" variant="secondary" type="button"
            class="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1" @click="onResetFilter">
            Reset
          </Button>
        </div>
      </form>

    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulator" ref="tableRef" class="mt-5"></div>
    </div>
  </div>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Part Number Master - Deleted List</h2>

  </div>
  <!-- BEGIN: HTML Table Data -->
  <div class="p-5 mt-5 intro-y box">
    <div class="flex flex-col sm:flex-row sm:items-end xl:items-start">
      <form id="tabulator-html-filter-form" class="xl:flex sm:mr-auto" @submit="(e) => {
        e.preventDefault();
        onFilterDelete();
      }
        ">
        <div class="items-center sm:flex sm:mr-4">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Field
          </label>
          <FormSelect id="tabulator-html-filter-field" v-model="filter.field"
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto" disabled>
            <option value="code">Code</option>
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
            @click="onFilterDelete">
            Search
          </Button>
          <Button id="tabulator-html-filter-reset" variant="secondary" type="button"
            class="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1" @click="onResetFilterDelete">
            Reset
          </Button>
        </div>
      </form>

    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulatorDelete" ref="tableRefDelete" class="mt-5"></div>
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
          Add Part Number Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Code</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.code }" id="regular-form-1"
              v-model="addFormData.code" type="text" placeholder="Code" />
            <span v-if="formSubmitted && !addFormData.code" class="text-red-500">Code is
              required!</span>
          </div>
          <div class="mt-5 hidden">
            <FormLabel htmlFor="regular-form-4">Product Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput type="text" v-model="addFormData.productType"
              :class="{ 'border-red-500': formSubmitted && !addFormData.productType }"
              class="form-input mt-1 block w-full" placeholder="Enter Product Type" disabled />
            <span v-if="formSubmitted && !addFormData.productType" class="text-red-500">Product Type is required!</span>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="addFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in addFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Carton Type</FormLabel>
            <FormSelect v-model="addFormData.cartonType" class="sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Carton Type Option</option>
              <option v-for="cartonType in addFormData.cartonTypes" :key="cartonType" :value="cartonType">
                {{ cartonType }}
              </option>
            </FormSelect>
          </div> -->
          <div class="mt-5 relative">
  <FormLabel htmlFor="regular-form-5">Carton Type</FormLabel>
  <span class="text-red-500 pl-1 text-md">*</span>

  <!-- Custom dropdown with search -->
  <div class="relative">
    <div
      :class="['border rounded', { 'border-red-500': formSubmitted && !addFormData.cartonType, 'border-gray-300': !(formSubmitted && !addFormData.cartonType) }]">
      <div class="relative">
        <!-- Dropdown trigger - clicking this opens the dropdown -->
        <div @click="toggleCartonTypeDropdown" class="cursor-pointer p-2">
          {{ selectedCartonType || 'Select a Carton Type Option' }}
        </div>
        <div v-if="isCartonTypeDropdownOpen" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
          <!-- Searchable input inside the dropdown -->
          <input type="text" v-model="searchCartonTypeQuery" placeholder="Search Carton Type"
            class="border-b border-gray-300 p-2 w-full" />
          <!-- Filtered options -->
          <ul class="max-h-40 overflow-y-auto">
            <li v-for="cartonType in filteredCartonTypes" :key="cartonType"
              @click="selectCartonType(cartonType)" class="cursor-pointer p-2 hover:bg-gray-100">
              {{ cartonType }}
            </li>
            <li v-if="filteredCartonTypes.length === 0" class="p-2 text-gray-500">No results found</li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <span v-if="formSubmitted && !addFormData.cartonType" class="text-red-500">
    Carton Type is required!
  </span>
</div>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="addFormData.productType === 'Product'">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Blending per KG (HH:MM:SS)
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Machine Station per KG (HH:MM:SS)
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Secondary Process per KG (HH:MM:SS)
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="addFormData.hoursForBlending" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.minutesForBlending" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.secondsForBlending" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="addFormData.hoursForMachineStation" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.minutesForMachineStation" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.secondsForMachineStation" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="addFormData.hoursForChemicalTreatment" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.minutesForChemicalTreatment" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="addFormData.secondsForChemicalTreatment" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                </tr>


              </tbody>
            </table>
          </div>


          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
            <FormTextarea v-model="addFormData.remarks" id="validation-form-6" name="comment"
              placeholder="Type your remarks">
            </FormTextarea>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.status }" v-model="addFormData.status"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Status Option</option>
              <option>Active</option>
              <option>Inactive</option>
            </FormSelect>
            <span v-if="formSubmitted && addFormData.status === ''" class="text-red-500">Please choose a
              Status!</span>
          </div>


          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Wet Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Plasma Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Dedusting<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Deburring<br>Required
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="wet-treatment-add" :checked="addFormData.wettreatmentrequired"
                        @change="toggleWetTreatment('add')" type="checkbox" class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="plasma-treatment-add" :checked="addFormData.plasmatreatmentrequired"
                        @change="togglePlasmaTreatment('add')" type="checkbox" class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="blow-required" v-model="addFormData.dustingrequired" type="checkbox"
                        class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="deburringrequired" v-model="addFormData.deburringrequired" type="checkbox"
                        class="mx-auto" />
                    </FormCheck>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="addFormData.productType === 'Powder'" class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="quality-check-required" class="mr-2 ml-[-2]">
                Quality Check Required
              </FormCheck.Label>
              <FormCheck.Input id="quality-check-required" v-model="addFormData.qualitycheckrequired" type="checkbox"
                value="" />
            </FormCheck>
          </div>

          <div v-if="addFormData.productType === 'Product'" class="mt-5">
            <FormLabel htmlFor="weight-per-piece">Weight Per Piece (in grams)</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput id="weight-per-piece" v-model="addFormData.weightperpiece" type="text" placeholder="Weight"
              :class="{
                'border-red-500': formSubmitted &&
                  (!addFormData.weightperpiece ||
                    (addFormData.weightperpiece && isNaN(parseFloat(addFormData.weightperpiece))) ||
                    (addFormData.weightperpiece && addFormData.weightperpiece.toString().split('.')[1]?.length > 10))
              }" />
            <!-- Check if Weight Per Piece is empty -->
            <span v-if="formSubmitted && !addFormData.weightperpiece" class="text-red-500">
              Weight Per Piece is required!
            </span>

            <!-- Check if input exists and is not a valid number -->
            <span v-if="formSubmitted && addFormData.weightperpiece && isNaN(parseFloat(addFormData.weightperpiece))"
              class="text-red-500">
              Weight Per Piece must be a valid number!
            </span>

            <!-- Check if decimal places are more than 4, only if input exists -->
            <span
              v-if="formSubmitted && addFormData.weightperpiece && addFormData.weightperpiece.toString().split('.')[1]?.length > 10"
              class="text-red-500">
              Weight Per Piece must have at most 4 decimal places!
            </span>
          </div>

          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="pre-blend" class="mr-2 ml-[-2]">
                Contains Recipe
              </FormCheck.Label>
              <FormCheck.Input id="pre-blend" v-model="addFormData.containsRecipe" type="checkbox" value="" />
            </FormCheck>
          </div>
          <!-- Product Recipe -->
          <div v-if="addFormData.containsRecipe">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Product Recipe</h6>
            <hr>
            <p class="text-md font-bold text-gray-700 dark:text-gray-300 mt-5">
              Total Percentage:
              <span :class="totalPercentage === 100 ? 'text-green-500' : 'text-red-500'">
                {{ totalPercentage }}%
              </span>
            </p>
            <p v-if="formSubmitted && addFormData.productRecipe.length === 0" class="text-red-500">
              Please add at least one product recipe.
            </p>
            <button type="button" @click="addRowToAddForm"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add</button>

            <div v-if="addFormData.productRecipe.length > 0">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th class="py-2 px-4 border-b text-left">Code</th>
                    <th class="py-2 px-4 border-b text-left">Percentage</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in addFormData.productRecipe" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">
          <!-- Custom searchable dropdown for the "Code" field -->
          <div class="relative">
            <div
              :class="['border rounded', { 'border-red-500': formSubmitted && !row.code, 'border-gray-300': !formSubmitted || row.code }]">
              <div class="relative cursor-pointer p-2" @click="toggleDropdown(index)">
                {{ row.code || 'Select a Product Code Option' }}
              </div>

              <div v-if="isDropdownOpen[index]" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                <!-- Searchable input inside the dropdown, using searchQueries[index] -->
                <input type="text" v-model="searchQueries[index]" placeholder="Search Product Code"
                  class="border-b border-gray-300 p-2 w-full" />
                <!-- Filtered options using filteredProductCodes with searchQueries[index] -->
                <ul class="max-h-40 overflow-y-auto">
                  <li v-for="productcode in filteredProductCodes(searchQueries[index])" :key="productcode"
                    @click="selectProductCode(productcode, index)" class="cursor-pointer p-2 hover:bg-gray-100">
                    {{ productcode }}
                  </li>
                  <li v-if="filteredProductCodes(searchQueries[index]).length === 0" class="p-2 text-gray-500">
                    No results found
                  </li>
                </ul>
              </div>
            </div>
            <span v-if="formSubmitted && !row.code" class="text-red-500">Product Code is required!</span>
          </div>
        </td>

                    <td class="py-2 px-4 border-b small-width">
                      <FormInput
                        :class="{ 'border-red-500': formSubmitted && (!row.percentage || !isNumeric(row.percentage) || row.percentage.toString().split('.')[1]?.length > 3) }"
                        v-model="row.percentage" type="text" class="w-full px-2 py-1 border rounded small-width" />
                      <span
                        v-if="formSubmitted && (!row.percentage || !isNumeric(row.percentage) || row.percentage.toString().split('.')[1]?.length > 3)"
                        class="text-red-500">
                        {{ !row.percentage ? 'Percentage is required!' : !isNumeric(row.percentage) ? 'Percentage must be a valid number!' : 'Percentage must be a valid number with up to 3 decimal points!' }}
                      </span>
                    </td>
                    <td class="py-2 px-4 border-b text-center">
                      <button type="button" @click="deleteAddRow(index)"
                        class="text-red-600 hover:text-red-800 text-lg">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
          Edit Part Number Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Code</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.code }" id="regular-form-1" v-model="editFormData.code"
              type="text" placeholder="Code" />
            <span v-if="!editFormData.code" class="text-red-500">Code is required!</span>
          </div>
          <div class="mt-5 hidden">
            <FormLabel htmlFor="regular-form-4">Product Type</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.productType }" id="regular-form-4"
              v-model="editFormData.productType" type="text" placeholder="Product Type" disabled />
            <span v-if="!editFormData.productType" class="text-red-500">Product Type is required!</span>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="editFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in editFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>
          <!-- <div class="mt-5" v-if="editFormData.productType === 'Product'">
            <FormLabel htmlFor="regular-form-1">Carton Type</FormLabel>
            <FormSelect v-model="editFormData.cartonType" class="sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Carton Type Option</option>
              <option v-for="cartonType in editFormData.cartonTypes" :key="cartonType" :value="cartonType">
                {{ cartonType }}
              </option>
            </FormSelect>
          </div> -->

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Carton Type</FormLabel>
            <TomSelect v-model="editFormData.cartonType" :options="{
              placeholder: 'Select a Carton Type Option',
            }" class="w-full">
              <option disabled value="1">Select a Carton Type Option</option>
              <option v-for="cartonType in editFormData.cartonTypes" :key="cartonType" :value="cartonType">
                {{ cartonType }}
              </option>

            </TomSelect>

          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="editFormData.productType === 'Product'">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <!-- First Row: Blending and Machine Station -->
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Blending per KG (HH:MM:SS)
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Machine Station per KG (HH:MM:SS)
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Time Taken for Secondary Process per KG (HH:MM:SS)
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="editFormData.hoursForBlending" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.minutesForBlending" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.secondsForBlending" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="editFormData.hoursForMachineStation" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.minutesForMachineStation" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.secondsForMachineStation" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <div class="time-picker flex items-center justify-center">
                      <FormSelect v-model="editFormData.hoursForChemicalTreatment" name="hours" class="mr-1">
                        <option v-for="n in 25" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.minutesForChemicalTreatment" name="minutes" class="mx-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                      :
                      <FormSelect v-model="editFormData.secondsForChemicalTreatment" name="seconds" class="ml-1">
                        <option v-for="n in 61" :key="n" :value="n - 1">{{ formatNumber(n - 1) }}</option>
                      </FormSelect>
                    </div>
                  </td>
                </tr>


              </tbody>
            </table>
          </div>


          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
            <FormTextarea id="validation-form-6" placeholder="Type your remarks" v-model="editFormData.remarks">
            </FormTextarea>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': !editFormData.status }" v-model="editFormData.status"
              class="sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Status Option</option>
              <option>Active</option>
              <option>Inactive</option>
            </FormSelect>
            <span v-if="editFormData.status === ''" class="text-red-500">Please choose a Status!</span>
          </div>
          <div v-if="editFormData.productType === 'Product'"
            class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Wet Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Plasma Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Dedusting<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Deburring<br>Required
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="wet-treatment-required" :checked="editFormData.wettreatmentrequired"
                        @change="handleWetTreatmentChange" type="checkbox" class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="plasma-treatment-required" :checked="editFormData.plasmatreatmentrequired"
                        @change="handlePlasmaTreatmentChange" type="checkbox" class="mx-auto" />
                    </FormCheck>
                  </td>

                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="dedusting-required" v-model="editFormData.dustingrequired" type="checkbox"
                        class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="deburring-required" v-model="editFormData.deburringrequired" type="checkbox"
                        class="mx-auto" />
                    </FormCheck>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="editFormData.productType === 'Powder'" class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="qualitycheckrequired" class="mr-2 ml-[-2]">
                Quality Check Required
              </FormCheck.Label>
              <FormCheck.Input id="qualitycheckrequired" v-model="editFormData.qualitycheckrequired" type="checkbox"
                value="" />
            </FormCheck>
          </div>
          <div v-if="editFormData.productType === 'Product'" class="mt-5">
            <FormLabel htmlFor="regular-form-4">Weight Per Piece (in grams)</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput id="regular-form-4" v-model="editFormData.weightperpiece" type="text" placeholder="Weight"
              :class="{
                'border-red-500':
                  (!editFormData.weightperpiece || // Empty check
                    isNaN(parseFloat(editFormData.weightperpiece)) || // Check if not a number
                    editFormData.weightperpiece.toString().split('.')[1]?.length > 10) // Check if decimal places > 10
              }" />
            <!-- Empty field validation -->
            <span v-if="!editFormData.weightperpiece" class="text-red-500">
              Weight Per Piece is required!
            </span>

            <!-- Invalid number validation -->
            <span v-if="editFormData.weightperpiece && isNaN(parseFloat(editFormData.weightperpiece))"
              class="text-red-500">
              Weight Per Piece must be a valid number!
            </span>

            <!-- Decimal places validation -->
            <span
              v-if="editFormData.weightperpiece && editFormData.weightperpiece.toString().split('.')[1]?.length > 10"
              class="text-red-500">
              Weight Per Piece must have at most 4 decimal places!
            </span>
          </div>


          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="pre-blend" class="mr-2 ml-[-2]">
                Contains Recipe
              </FormCheck.Label>
              <FormCheck.Input id="pre-blend" v-model="editFormData.containsRecipe" type="checkbox" value="" />
            </FormCheck>
          </div>

          <!-- Product Recipe -->
          <div v-if="editFormData.containsRecipe">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Product Recipe</h6>
            <hr>
            <p class="text-md font-bold text-gray-700 dark:text-gray-300 mt-5">
              Total Percentage:
              <span :class="totalEditPercentage === 100 ? 'text-green-500' : 'text-red-500'">
                {{ totalEditPercentage }}%
              </span>
            </p>
            <p v-if="formSubmitted && editFormData.productRecipe.length === 0" class="text-red-500">
              Please add at least one product recipe.
            </p>
            <button type="button" @click="addRowToEditForm"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add</button>

            <div v-if="editFormData.productRecipe.length > 0">
              <table class="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th class="py-2 px-4 border-b text-left">Code</th>
                    <th class="py-2 px-4 border-b text-left">Percentage</th>
                    <th class="py-2 px-4 border-b text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.productRecipe" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">
            <!-- Custom searchable dropdown for editFormData -->
            <div class="relative">
              <div
                :class="['border rounded', { 'border-red-500': formSubmitted && !row.code, 'border-gray-300': !formSubmitted || row.code }]">
                <div class="relative cursor-pointer p-2" @click="toggleEditDropdown(index)">
                  {{ row.code || 'Select a Product Code Option' }}
                </div>

                <div v-if="isEditDropdownOpen[index]" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                  <!-- Searchable input inside the dropdown, using editSearchQueries[index] -->
                  <input type="text" v-model="editSearchQueries[index]" placeholder="Search Product Code"
                    class="border-b border-gray-300 p-2 w-full" />
                  <!-- Filtered options using filteredEditProductCodes with editSearchQueries[index] -->
                  <ul class="max-h-40 overflow-y-auto">
                    <li v-for="productcode in filteredEditProductCodes(editSearchQueries[index])" :key="productcode"
                      @click="selectEditProductCode(productcode, index)" class="cursor-pointer p-2 hover:bg-gray-100">
                      {{ productcode }}
                    </li>
                    <li v-if="filteredEditProductCodes(editSearchQueries[index]).length === 0" class="p-2 text-gray-500">
                      No results found
                    </li>
                  </ul>
                </div>
              </div>
              <span v-if="formSubmitted && !row.code" class="text-red-500">Product Code is required!</span>
            </div>
          </td>

                    <td class="py-2 px-4 border-b small-width">
                      <FormInput
                        :class="{ 'border-red-500': formSubmitted && (!row.percentage || !isNumeric(row.percentage) || row.percentage.toString().split('.')[1]?.length > 3) }"
                        v-model="row.percentage" type="text" class="w-full px-2 py-1 border rounded small-width" />
                      <span
                        v-if="formSubmitted && (!row.percentage || !isNumeric(row.percentage) || row.percentage.toString().split('.')[1]?.length > 3)"
                        class="text-red-500">
                        {{ !row.percentage ? 'Percentage is required!' : !isNumeric(row.percentage) ? 'Percentage must be a valid number!' : 'Percentage must be a valid number with up to 3 decimal points!' }}
                      </span>
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
          View Part Number Master
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
  <div class="flex flex-col lg:flex-row">
    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed">
      <tbody>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Code
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.code }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Quality Check Required
          </th>
          <td :class="['w-1/2 px-auto text-center', viewData.qualitycheckrequired ? 'text-green-500' : 'text-red-500']">
            {{ viewData.qualitycheckrequired ? 'Required' : 'Not Required' }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Weight per Piece
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.weightperpiece }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Product Type
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.productType }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Platform
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            <div v-if="Array.isArray(viewData.platform)">
              <span v-for="(platform, index) in viewData.platform" :key="index">
                <span v-if="index > 0">, </span>{{ platform }}
              </span>
            </div>
            <div v-else>
              {{ viewData.platform }}
            </div>
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Carton Type
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.cartonType }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700" v-if="viewData.productType === 'Product'">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Time Taken for <br> Blending per KG
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.timeTakenforBlending }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700" v-if="viewData.productType === 'Product'">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Time Taken for <br> Machine Station per KG
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.timeTakenforMachineStation }}
          </td>
        </tr>
      </tbody>
    </table>

    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed" v-if="viewData.productType === 'Product'">
      <tbody>

        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Time Taken for <br> Secondary Process per KG
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.timeTakenforChemicalTreatment }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Wet Treatment
          </th>
          <td :class="['w-1/2 px-auto text-center', viewData.wettreatmentrequired ? 'text-green-500' : 'text-red-500']">
            {{ viewData.wettreatmentrequired ? 'Required' : 'Not Required' }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Plasma Treatment
          </th>
          <td :class="['w-1/2 px-auto text-center', viewData.plasmatreatmentrequired ? 'text-green-500' : 'text-red-500']">
            {{ viewData.plasmatreatmentrequired ? 'Required' : 'Not Required' }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Dedusting
          </th>
          <td :class="['w-1/2 px-auto text-center', viewData.dustingrequired ? 'text-green-500' : 'text-red-500']">
            {{ viewData.dustingrequired ? 'Required' : 'Not Required' }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Deburring
          </th>
          <td :class="['w-1/2 px-auto text-center', viewData.deburringrequired ? 'text-green-500' : 'text-red-500']">
            {{ viewData.deburringrequired ? 'Required' : 'Not Required' }}
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Job Status
          </th>
          <td class="w-1/2 px-auto text-center">
            <span :class="{
              'text-green-600 dark:text-green-500': viewData.status === 'Active',
              'text-red-600 dark:text-red-500': viewData.status === 'Inactive',
              'text-gray-600': !viewData.status || viewData.status === ''
            }">
              {{ viewData.status || 'N/A' }}
            </span>
          </td>
        </tr>
        <tr class="border-b border-gray-200 dark:border-gray-700">
          <th scope="row"
            class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
            Remarks
          </th>
          <td class="w-1/2 px-auto text-center text-gray-700 break-words">
            {{ viewData.remarks ? viewData.remarks : 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</div>

        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.productRecipe.length > 0">

          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="4"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Product Recipe
                </th>
              </tr>
              <tr>
                <th scope="row"
                  class=" px-4 py-4  font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  No.
                </th>
                <th scope="row"
                  class=" px-4 py-4  font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  Code
                </th>
                <th scope="row"
                  class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  Percentage
                </th>
              </tr>
              <tr v-for="(subCode, index) in viewData.productRecipe" :key="index"
                class="hover:bg-gray-100 dark:hover:bg-gray-100">
                <td class="py-3 px-3 text-gray-700 dark:text-white ">
                  {{ subCode.serialNumber }}
                </td>
                <td class="py-3 px-3 text-gray-700 dark:text-white ">
                  {{ subCode.productCode }}
                </td>
                <td class=" px-auto text-center text-gray-700 dark:text-white ">
                  {{ subCode.percentage }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Dialog.Description>
      <Dialog.Footer>
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
.time-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
  /* Adjust this value to increase/decrease space between items */
}
</style>