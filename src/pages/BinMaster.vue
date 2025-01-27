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
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";


const select = ref("1");
const select1 = ref("1");
const select2 = ref("1");

interface Response {
  id?: string;
  name?: string;
  type?: string;
  capacityMax?: string;
  capacityMin?: string;
  shift?: string;
  colour?: string;
  movement?: string;
  input?: string;
  output?: string;
  remarks?: string;
  status?: string;
}


interface UserAccess {
    userId: string;
    binMaster?: string[];
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
  field: "name",
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
          minWidth: 200,
          responsive: 0,
          field: "id",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.id}</div>
        </div>`;
          },
        },
        {
          title: "NAME",
          field: "name",
          responsive: 0,
          minWidth: 120,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.name}</div>
    </div>`;
          },
        },
        {
          title: "TYPE",
          field: "type",
          responsive: 0,
          minWidth: 200,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.type}</div>
    </div>`;
          },
        },
        {
          title: "CAPACITY MAX",
          field: "capacityMax",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.capacityMax}</div>
    </div>`;
          },
        },
        {
          title: "CAPACITY MIN",
          field: "capacityMin",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.capacityMin}</div>
    </div>`;
          },
        },
        //     {
        //       title: "SHIFT",
        //       field: "shift",
        //       responsive: 0,
        //       vertAlign: "middle",
        //       formatter(cell) {
        //         const response = cell.getData();
        //         return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.shift}</div>
        // </div>`;
        //       },
        //     },
        {
          title: "MOVEMENT",
          field: "movement",
          responsive: 0,
          visible: false,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.movement}</div>
    </div>`;
          },
        },
        {
          title: "INPUT",
          field: "input",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.input}</div>
    </div>`;
          },
        },
        {
          title: "OUTPUT",
          field: "output",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.output}</div>
    </div>`;
          },
        },
        {
          title: "REMARKS",
          field: "remarks",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.remarks}</div>
    </div>`;
          },
        },
        {
          title: "STATUS",
          maxWidth: 180,
          minWidth: 200,
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
                    if (userAccess.binMaster && userAccess.binMaster.includes("Edit") && response.status !== "Completed") {
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
                            editBin(response.id);
                        });
                        editLink.innerHTML = `<i class="fa-regular fa-pen-to-square mr-1"></i>Edit`;
                        container.appendChild(editLink);
                    }

                    // Conditionally render "Delete" link
                    if (userAccess.binMaster && userAccess.binMaster.includes("Delete")) {
                        const deleteLink = document.createElement("a");
                        deleteLink.classList.add(
                            "flex",
                            "items-center",
                            "text-danger",
                            "text-sm"
                        );
                        deleteLink.href = "javascript:;";
                        deleteLink.addEventListener("click", () => {
                            deleteBin(response.id);
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
                    viewBin(response.id);
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
    field: "name",
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
    field: "name",
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
          minWidth: 200,
          responsive: 0,
          field: "id",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.id}</div>
        </div>`;
          },
        },
        {
          title: "NAME",
          field: "name",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.name}</div>
    </div>`;
          },
        },
        {
          title: "TYPE",
          field: "type",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.type}</div>
    </div>`;
          },
        },
        {
          title: "CAPACITY MAX",
          field: "capacityMax",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.capacityMax}</div>
    </div>`;
          },
        },
        {
          title: "CAPACITY MIN",
          field: "capacityMin",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.capacityMin}</div>
    </div>`;
          },
        },
        //     {
        //       title: "SHIFT",
        //       field: "shift",
        //       responsive: 0,
        //       vertAlign: "middle",
        //       formatter(cell) {
        //         const response = cell.getData();
        //         return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.shift}</div>
        // </div>`;
        //       },
        //     },
        {
          title: "MOVEMENT",
          field: "movement",
          responsive: 0,
          visible: false,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.movement}</div>
    </div>`;
          },
        },
        {
          title: "INPUT",
          field: "input",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.input}</div>
    </div>`;
          },
        },
        {
          title: "OUTPUT",
          field: "output",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.output}</div>
    </div>`;
          },
        },
        {
          title: "REMARKS",
          field: "remarks",
          responsive: 0,
          vertAlign: "middle",
          visible: false,
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.remarks}</div>
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/BinMaster/';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "InActive"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');

      // Custom sorting function to sort by name alphabetically
      const sortedData = filteredData.sort((a: any, b: any) => {
        if (!a.name || !b.name) return 0; // Prevent sorting if name is missing
        return a.name.localeCompare(b.name); // Sort alphabetically
      });

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
      loading.value = false; // Hide loading modal after data is processed
    });

  // Initialize other functions that also require data to be fully loaded
  Promise.all([
    fetchNamesShift(),
    fetchNamesMovement(),
    fetchLocation(),
    fetchType(),
    fetchItems()
  ]).finally(() => {
    loading.value = false; // Ensure loading is disabled once all data has loaded
  });

  initTabulator();
  reInitOnResizeWindow();
});

const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/BinMaster/GetBinMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/BinMaster/UpdateBinMasterActive';
onMounted(() => {
  // Fetch data from API
  axios.get(API_BASE_URL_DELETE)
    .then(response => {
      // Populate the table with all the data without filtering
      console.log(response.data.result);
      if (tabulatorDelete.value) {
        tabulatorDelete.value.setData(response.data.result);
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
  type: select1.value,
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  colour: select2.value,
  movement: select.value,
  input: "",
  output: "",
  remarks: "",
  status: "",
  names: [] as string[],
  namesmovement: [] as string[],
  location: [] as string[],
  types: [] as string[],
});

const viewData = reactive({
  id: '',
  name: "",
  type: "",
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  colour: "",
  movement: "",
  input: "",
  output: "",
  remarks: "",
  status: ""
});

const addFormData = reactive({
  id: '',
  name: "",
  type: select1.value,
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  colour: select2.value,
  movement: select.value,
  input: "",
  output: "",
  remarks: "",
  status: "Active",
  names: [] as string[],
  namesmovement: [] as string[],
  location: [] as string[],
  types: [] as string[],
});

// Define permission variables for binMaster
let canEditBinMaster = false;
let canDeleteBinMaster = false;
const canCreateBinMaster = ref(false);

// Define the fetchUserBinPermissions function
const fetchUserBinPermissions = async () => {
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

      const binMaster = userDetails.binMaster || ''; // Ensure the value is a string

      // Check if the string contains "Create", "Delete", and "Edit" for binMaster
      canCreateBinMaster.value = binMaster.includes('Create');
      canDeleteBinMaster = binMaster.includes('Delete');
      canEditBinMaster = binMaster.includes('Edit');

      console.log('canCreateBinMaster:', canCreateBinMaster.value); // Debugging log
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

// Call the fetchUserBinPermissions function to get permissions
fetchUserBinPermissions();

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
  loading.value = true; // Start loading animation

  console.log(`Fetching data for ID: ${id}`); // Add log
  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      console.log(`Fetched data:`, data); // Add log
      if (data && data.length > 0) {
        console.log('Retrieved Data:', data);
        const [firstItem] = data;
        Object.assign(formData, {
          id: firstItem.id,
          name: firstItem.name,
          type: firstItem.type,
          capacityMax: firstItem.capacityMax,
          capacityMin: firstItem.capacityMin,
          shift: firstItem.shift,
          colour: firstItem.colour,
          movement: firstItem.movement,
          input: firstItem.input,
          output: firstItem.output,
          remarks: firstItem.remarks,
          status: firstItem.status
        });

        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'))
    .finally(() => {
      loading.value = false; // End loading animation
    });
};



const editBin = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewBin = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  // Fetch data from API
  axios.get(API_BASE_URL)
    .then(response => {
      // Filter out data with status "InActive"
      const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');

      // Custom sorting function to sort by name alphabetically
      const sortedData = filteredData.sort((a: any, b: any) => {
        if (!a.name || !b.name) return 0; // Prevent sorting if name is missing
        return a.name.localeCompare(b.name); // Sort alphabetically
      });

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
      loading.value = false; // Hide loading modal after data is processed
    });

  // Initialize other functions that also require data to be fully loaded
  Promise.all([
    fetchNamesShift(),
    fetchNamesMovement(),
    fetchLocation(),
    fetchType(),
    fetchItems()
  ]).finally(() => {
    loading.value = false; // Ensure loading is disabled once all data has loaded
  });

  initTabulator();
  reInitOnResizeWindow();
};
const updateTableDataDelete = () => {
  axios.get(API_BASE_URL_DELETE)
    .then(response => {
      // Populate the table with all the data without filtering
      console.log(response.data.result);
      if (tabulatorDelete.value) {
        tabulatorDelete.value.setData(response.data.result);
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
};

// Update Bin
const updateBin = () => {
  if (!editFormData.name || !editFormData.type || !editFormData.colour || !editFormData.status) {
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

  const existingUser = items.value.find(
    user => user.name === editFormData.name && user.id !== editFormData.id
  );

  if (existingUser) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Name',
      html: `<b>${editFormData.name}</b> already exists, please try another name`,
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
      axios.put(`${API_BASE_URL}${editFormData.id}`, { ...editFormData })
        .then(response => {
          console.log('Successfully submitted data:', response.data);
          setEditSlideOver(false);
          updateTableData();
          updateTableDataDelete();
          fetchItems();
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
          console.error('Error updating data:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating the data.',
          });
        });
    }
  });
};

const items = ref<Response[]>([]);


const fetchItems = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');
    items.value = filteredData;
  } catch (error) {
    console.error('Error fetching data:', error);
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
        addFormData.names = activeNameData.map(item => item.name);
        editFormData.names = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};


const fetchNamesMovement = () => {
  axios.get('http://10.87.0.33:8082/api/MovementMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.namesmovement = activeNameData.map(item => item.name);
        editFormData.namesmovement = activeNameData.map(item => item.name);
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
        addFormData.location = activeNameData.map(item => item.name);
        editFormData.location = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};
const fetchType = () => {
  axios.get('http://10.87.0.33:8082/api/MachineTypeMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.types = activeNameData.map(item => item.name);
        editFormData.types = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};




// Add Bin
const addBin = () => {
  formSubmitted.value = true;

  // Check for required fields
  if (!addFormData.name || addFormData.type === '1' || addFormData.colour === '1' || !addFormData.status) {
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

  // Check if a bin with the same name already exists
  const existingBin = items.value.find(bin => bin.name === addFormData.name);

  if (existingBin) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Name',
      html: `<b>${addFormData.name}</b> already exists, please try another name`,
      confirmButtonText: 'Try Again',
      confirmButtonColor: '#d33',
    });
    return;
  }

  // Show confirmation before adding the bin
  Swal.fire({
    title: 'Confirmation',
    text: 'Are you sure you want to add this Bin?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, add it!',
  }).then(result => {
    if (result.isConfirmed) {
      // Proceed with the API call to add the Bin
      axios.post(API_BASE_URL, { ...addFormData })
        .then(response => {
          console.log('Successfully submitted data:', response.data);
          setAddSlideover(false);
          updateTableData();
          updateTableDataDelete();
          fetchNamesShift();
          fetchNamesMovement();
          fetchLocation();
          fetchType();
          Swal.fire({
            icon: 'success',
            title: 'Bin Added Successfully',
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
        .catch(error => handleError(error, 'Error adding Bin'));
    }
    formSubmitted.value = false;
  });
};





// Delete Bin
const deleteBin = (id: string) => {
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
  Object.keys(formData).forEach(key => formData[key] = '');
  formData.capacityMin = 0;
  formData.capacityMax = 0;
  formData.status = 'Active';
};



const addSlideover = ref(false);
const setAddSlideover = (value: boolean) => {
  addSlideover.value = value;
  // Reset the editFormData when EditSlideOver is set to false
  if (!value) {
    resetAddFormData();
  }
};

const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;

  // Reset the editFormData when EditSlideOver is set to false
  if (!value) {
    resetEditFormData();
  }
};

const resetEditFormData = () => {
  editFormData.type = select1.value;
  editFormData.movement = select.value;
  editFormData.colour = select2.value;
};
const resetAddFormData = () => {
  addFormData.name = ''
  addFormData.type = select1.value;
  addFormData.movement = select.value;
  addFormData.colour = select2.value;
};
const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
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
    <h2 class="mr-auto text-lg font-medium">Bin Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreateBinMaster">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Bin Master
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
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto">
            <option value="name">Name</option>
            <option value="type">Type</option>
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
    <h2 class="mr-auto text-lg font-medium">Bin Master - Deleted List</h2>

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
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto">
            <option value="name">Name</option>
            <option value="type">Type</option>
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
          Add Bin Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addBin">
          <div>
            <FormLabel htmlFor="regular-form-1">Name</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.name }" id="regular-form-1"
              v-model="addFormData.name" type="text" placeholder="Name" />
            <span v-if="formSubmitted && !addFormData.name" class="text-red-500">Name is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="addFormData.type" :options="{
              placeholder: 'Select a Type Option',
            }" :class="{ 'border-red-500': formSubmitted && (addFormData.type === '1') }" class="w-full sm:mr-2"
              aria-label="Default select example">
              <option disabled value="1">Select a Type Option</option>
              <option v-for="type in addFormData.types" :key="type" :value="type">
                {{ type }}
              </option>
            </TomSelect>
          </div>
          <span v-if="formSubmitted && (addFormData.type === '1')" class="text-red-500">Type
            is required!</span>

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Movement</FormLabel>
            <TomSelect v-model="addFormData.movement" :options="{
              placeholder: 'Select a Movement Option',
            }" class="w-full">
              <option disabled value="1">Select a Movement Option</option>
              <option v-for="name in addFormData.namesmovement" :key="name" :value="name">
                {{ name }}
              </option>
            </TomSelect>

          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Capacity</FormLabel>
            <FormInput :class="{ 'border-red-500': false }" id="regular-form-3" v-model="addFormData.capacityMax"
              type="number" placeholder="Capacity" />
            <!-- Removed error messages -->
          </div>


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Capacity Min</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!addFormData.capacityMin || addFormData.capacityMin <= 0 || addFormData.capacityMin > addFormData.capacityMax) }"
              id="regular-form-4" v-model="addFormData.capacityMin" type="number" placeholder="Capacity Min" />
            <span v-if="formSubmitted && (!addFormData.capacityMin || addFormData.capacityMin <= 0)"
              class="text-red-500">
              Capacity Min is required!
            </span>
            <span
              v-else-if="formSubmitted && addFormData.capacityMax !== null && addFormData.capacityMin > addFormData.capacityMax"
              class="text-red-500">
              Capacity Min must be less than or equal to Capacity Max!
            </span>
          </div> -->


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="addFormData.shift"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in addFormData.names" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Colour</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.colour }" v-model="addFormData.colour"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Colour Option</option>
              <option>Yellow</option>
              <option>Green</option>
              <option>Red</option>
              <option>Blue</option>
              <option>Grey</option>
            </FormSelect>
            <span v-if="formSubmitted && !addFormData.colour" class="text-red-500">Colour is required!</span>
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Colour</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="addFormData.colour" :options="{
              placeholder: 'Select a Colour Option',
            }" class="w-full" :class="{ 'border-red-500': formSubmitted && (addFormData.colour === '1') }">
              <option disabled value="1">Select a Colour Option</option>
              <option>Yellow</option>
              <option>Green</option>
              <option>Red</option>
              <option>Blue</option>
              <option>Grey</option>
            </TomSelect>
          </div>
          <span v-if="formSubmitted && (addFormData.colour === '1')" class="text-red-500">Colour is required!</span>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Input</FormLabel>
            <FormInput id="regular-form-8" v-model="addFormData.input" type="text" placeholder="Input" />
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-9">Output</FormLabel>
            <FormInput id="regular-form-9" v-model="addFormData.output" type="text" placeholder="Output" />
          </div> -->
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
          Edit Bin Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateBin">
          <div>
            <FormLabel htmlFor="regular-form-1">Name</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.name }" id="regular-form-1" v-model="editFormData.name"
              type="text" placeholder="Name" />
            <span v-if="!editFormData.name" class="text-red-500">Name is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="editFormData.type" :options="{
              placeholder: 'Select a Type Option',
            }" :class="{ 'border-red-500': (!editFormData.type) }" class="w-full sm:mr-2"
              aria-label="Default select example">
              <option disabled value="1">Select a Type Option</option>
              <option v-for="type in editFormData.types" :key="type" :value="type">
                {{ type }}
              </option>
            </TomSelect>
          </div>
          <span v-if="!editFormData.type" class="text-red-500">Type is
            required!</span>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Capacity</FormLabel>
            <FormInput :class="{ 'border-red-500': false }" id="regular-form-3" v-model="editFormData.capacityMax"
              type="number" placeholder="Capacity" />
          </div>


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Capacity Min</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': (!editFormData.capacityMin || editFormData.capacityMin <= 0 || editFormData.capacityMin > editFormData.capacityMax) }"
              id="regular-form-4" v-model="editFormData.capacityMin" type="number" placeholder="Capacity Min" />
            <span v-if="!editFormData.capacityMin || editFormData.capacityMin <= 0" class="text-red-500">
              Capacity Min is required!
            </span>
            <span v-else-if="editFormData.capacityMax !== null && editFormData.capacityMin > editFormData.capacityMax"
              class="text-red-500">
              Capacity Min must be less than or equal to Capacity Max!
            </span>
          </div> -->

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect  v-model="editFormData.shift" class=" sm:mr-2"
              aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.names" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Colour</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="editFormData.colour" :options="{
              placeholder: 'Select a Colour Option',
            }" class="w-full" :class="{ 'border-red-500': !editFormData.colour }">
              <option disabled value="1">Select a Colour Option</option>
              <option>Yellow</option>
              <option>Green</option>
              <option>Red</option>
              <option>Blue</option>
              <option>Grey</option>
            </TomSelect>
          </div>
          <span v-if="!editFormData.colour" class="text-red-500">Colour is required!</span>


          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Movement</FormLabel>
            <TomSelect v-model="editFormData.movement" :options="{
              placeholder: 'Select a Movement Option',
            }" class="w-full">
              <option disabled value="1">Select a Movement Option</option>
              <option v-for="name in editFormData.namesmovement" :key="name" :value="name">
                {{ name }}
              </option>
            </TomSelect>

          </div> -->

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Input</FormLabel>
            <FormInput id="regular-form-8" v-model="editFormData.input" type="text" placeholder="Input" />
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-9">Output</FormLabel>
            <FormInput id="regular-form-9" v-model="editFormData.output" type="text" placeholder="Output" />
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
            <FormTextarea v-model="editFormData.remarks" id="validation-form-6" name="comment"
              placeholder="Type your remarks">
            </FormTextarea>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': !editFormData.status }" v-model="editFormData.status"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Status Option</option>
              <option>Active</option>
              <option>Inactive</option>
            </FormSelect>
            <span v-if="editFormData.status === ''" class="text-red-500">Please choose a Status!</span>
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
          View Bin Master
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Name
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.name }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Type
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.type }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.capacityMax }}
                  </td>
                </tr>
                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Min
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.capacityMin }}
                  </td>
                </tr> -->
                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.shift }}
                  </td>
                </tr> -->


              </tbody>
            </table>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Colour
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.colour }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Remarks
                  </th>
                  <td class="w-[50%] px-5 py-5 text-center text-gray-700 dark:text-white">
                    {{ viewData.remarks ? viewData.remarks : 'N/A' }}
                  </td>
                </tr>

                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span :class="{
                      'text-green-600 dark:text-green-500': viewData.status === 'Active',
                      'text-red-600 dark:text-red-500': viewData.status === 'Inactive',
                      'text-gray-600': !viewData.status || viewData.status === ''
                    }">
                      {{ viewData.status || 'N/A' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
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
