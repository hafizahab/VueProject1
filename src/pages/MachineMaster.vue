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
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";

const select = ref("1");
const select1 = ref("1");

const selectedPlatforms = ref([]);
const selectOptions = {
  placeholder: 'Select platforms',
};

interface Response {
  id?: string;
  name?: string;
  type?: string;
  capacityMax?: string;
  capacityMin?: string;
  shift?: string;
  remarks?: string;
  status?: string;
}


interface UserAccess {
    userId: string;
    machineMaster?: string[];
}

let cachedUserAccess: UserAccess[] | null = null; // Use null initially to indicate no data is cached


function getUserAccessData(): Promise<UserAccess[]> {
    return new Promise((resolve, reject) => {
        if (cachedUserAccess) {
            resolve(cachedUserAccess); // Return cached data if available
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
                        resolve(cachedUserAccess); // Resolve the promise with fetched data
                    } else {
                        throw new Error("Unexpected response format");
                    }
                })
                .catch((error) => reject(error)) // Reject the promise on error
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
          title: "MACHINE ID",
          minWidth: 180,
          responsive: 0,
          field: "name",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: true,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.name}</div>
              </div>`;
          },
        },

        {
          title: "TYPE",
          minWidth: 180,
          responsive: 0,
          field: "type",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: true,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.type}</div>
        </div>`;
          },
        },



        {
          title: "STATUS",
          minWidth: 140,
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
                case 'Inactive':
                  statusClass = 'bg-red-100 text-red-800 border-red-400 dark:text-green-500';
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
                    if (userAccess.machineMaster && userAccess.machineMaster.includes("Edit")) {
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
                    if (userAccess.machineMaster && userAccess.machineMaster.includes("Delete")) {
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
          title: "MACHINE ID",
          minWidth: 180,
          responsive: 0,
          field: "name",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: true,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.name}</div>
              </div>`;
          },
        },

        {
          title: "TYPE",
          minWidth: 180,
          responsive: 0,
          field: "type",
          vertAlign: "middle",
          print: false,
          download: false,
          visible: true,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
            <div class="font-medium whitespace-nowrap">${response.type}</div>
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/MachineMaster/';

onMounted(() => {
  loading.value = true; // Show loading animation

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
      loading.value = false; // Hide loading animation after data is processed
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchNamesShift();
  fetchItems();
  fetchType();
  fetchPlatform();
  fetchLocation();
});


const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/MachineMaster/GetMachineMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/MachineMaster/UpdateMachineMasterActive';
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
  uom: "",
  type: select.value,
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  remarks: "",
  status: "",
  selectedSubLocation: '',
  location: computed({
    get: () => select1.value,
    set: (value: string) => { select1.value = value; }
  }),
  names: [] as string[],
  types: [] as string[],
  platform: [] as string[],
  platforms: [] as string[],
  locations: [] as string[],
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});


interface SubLocation {
  name: string;
}

const viewData = reactive({
  id: '',
  name: "",
  type: select.value,
  uom: "",
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  remarks: "",
  status: "Active",
  selectedSubLocation: '',
  location: computed({
    get: () => select1.value,
    set: (value: string) => { select1.value = value; }
  }),
  names: [] as string[],
  types: [] as string[],
  platforms: [] as string[],
  locations: [] as string[],
  platform: [] as string[],
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});


const addFormData = reactive({
  id: '',
  name: "",
  type: select.value,
  uom: "",
  capacityMax: 0,
  capacityMin: 0,
  shift: "",
  remarks: "",
  status: "Active",
  selectedSubLocation: '',
  location: computed({
    get: () => select1.value,
    set: (value: string) => { select1.value = value; }
  }),
  names: [] as string[],
  types: [] as string[],
  platforms: [] as string[],
  locations: [] as string[],
  platform: [] as string[],
  subLocList: [] as SubLocation[], // Use the SubLocation type here
});

const isEditSubLocationDropdownOpen = ref(false);
const editSubLocationSearchQuery = ref('');
const selectedEditSubLocation = ref(editFormData.selectedSubLocation);

// Computed property to filter sub-locations based on search query
const filteredEditSubLocations = computed(() => {
  if (!editSubLocationSearchQuery.value) {
    return editFormData.subLocList;
  }
  return editFormData.subLocList.filter((subloc) =>
    subloc.name.toLowerCase().includes(editSubLocationSearchQuery.value.toLowerCase())
  );
});

// Function to toggle sub-location dropdown open/close
const toggleEditSubLocationDropdown = () => {
  isEditSubLocationDropdownOpen.value = !isEditSubLocationDropdownOpen.value;
  editSubLocationSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a sub-location
const selectEditSubLocation = (subLocation : any) => {
  selectedEditSubLocation.value = subLocation;
  editFormData.selectedSubLocation = subLocation;
  isEditSubLocationDropdownOpen.value = false; // Close the dropdown after selecting
};


const isSubLocationDropdownOpen = ref(false);
const subLocationSearchQuery = ref('');
const selectedAddSubLocation = ref(addFormData.selectedSubLocation);

// Computed property to filter sub-locations based on search query
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
  isSubLocationDropdownOpen.value = !isSubLocationDropdownOpen.value;
  subLocationSearchQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a sub-location
const selectSubLocation = (subLocation : any) => {
  selectedAddSubLocation.value = subLocation;
  addFormData.selectedSubLocation = subLocation;
  isSubLocationDropdownOpen.value = false; // Close the dropdown after selecting
};


// Define reactive permission variables for machineMaster
const canEditMachineMaster = ref(false);
const canDeleteMachineMaster = ref(false);
const canCreateMachineMaster = ref(false);

// Define the fetchUserMachinePermissions function
const fetchUserMachinePermissions = async () => {
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

            const machineMaster = userDetails.machineMaster || ''; // Ensure the value is a string

            // Check if the string contains "Create", "Delete", and "Edit" for machineMaster
            canCreateMachineMaster.value = machineMaster.includes('Create');
            canDeleteMachineMaster.value = machineMaster.includes('Delete');
            canEditMachineMaster.value = machineMaster.includes('Edit');

            console.log('canCreateMachineMaster:', canCreateMachineMaster.value); // Debugging log
            console.log('canDeleteMachineMaster:', canDeleteMachineMaster.value); // Debugging log
            console.log('canEditMachineMaster:', canEditMachineMaster.value); // Debugging log
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
    await fetchUserMachinePermissions();
});


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
  loading.value = true; // Show loading animation
  console.log(`Fetching data for ID: ${id}`); // Add log

  axios.get(`${API_BASE_URL}${id}`)
    .then(response => {
      const data = response.data.result;
      console.log(`Fetched data:`, data); // Add log
      if (data && data.length > 0) {
        console.log('Retrieved Data:', data);
        const [firstItem] = data;

        // Update formData with fetched data
        Object.assign(formData, {
          id: firstItem.id,
          platform: firstItem.platform ? firstItem.platform.split(',') : [],
          name: firstItem.name,
          uom: firstItem.uom,
          type: firstItem.type,
          capacityMax: firstItem.capacityMax,
          capacityMin: firstItem.capacityMin,
          shift: firstItem.shift,
          remarks: firstItem.remarks,
          location: firstItem.location,
          status: firstItem.status,
          subLocList: firstItem.subLocationDetailsList || [],
        });

        // Set selected sub-location, if available
        if (firstItem.subLocationDetailsList && firstItem.subLocationDetailsList.length > 0) {
          const matchedSubLocation = firstItem.subLocationDetailsList.find(
            (subloc : any) => subloc.name === formData.selectedSubLocation
          );

          formData.selectedSubLocation = matchedSubLocation
            ? matchedSubLocation.name
            : firstItem.subLocationDetailsList[0].name;

          selectedEditSubLocation.value = formData.selectedSubLocation; // Synchronize selectedEditSubLocation
        } else {
          formData.selectedSubLocation = 'No Sub Location Selected';
          selectedEditSubLocation.value = 'No Sub Location Selected'; // Fallback
        }

        // Call fetchSubLocations to populate the sub-location list
        fetchSubLocations(firstItem.location, 'edit');

        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'))
    .finally(() => {
      loading.value = false; // Hide loading animation after data fetching completes
    });
};


const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);


// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading animation

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
      loading.value = false; // Hide loading animation after data is processed
    });

  initTabulator();
  reInitOnResizeWindow();
  fetchNamesShift();
  fetchItems();
  fetchType();
  fetchPlatform();
  fetchLocation();
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


// Update Role
const updateRole = () => {
  editFormData.location = select1.value;

  // Validate form fields
  if (
    !editFormData.name ||
    !editFormData.type ||
    !editFormData.capacityMax ||
    !editFormData.capacityMin ||
    !editFormData.status
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
      showClass: {
        popup: 'animate__animated animate__fadeInUp',
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp',
      },
    });
    return;
  }

  // Check for duplicate names
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

  // Confirmation dialog
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
      // Prepare formData object
      const formData = {
        ...editFormData,
        platform: Array.isArray(editFormData.platform) ? editFormData.platform.join(',') : editFormData.platform,
      };

      // Conditionally add the subLocList to formData
      if (editFormData.selectedSubLocation) {
        formData.subLocList = [
          {
            name: editFormData.selectedSubLocation, // Only the selected sublocation is included in the array
          }
        ];
      }

      // Send the updated data with correctly formatted platform
      axios.put(`${API_BASE_URL}${editFormData.id}`, formData)
        .then(response => {
          console.log('Successfully submitted data:', response.data);
          setEditSlideOver(false);
          resetEditFormData();
          fetchItems();
          updateTableData();
          updateTableDataDelete();
          fetchPlatform();
          fetchLocation();
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
    const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
    items.value = filteredData;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};



// Add Role
const addRole = () => {
  formSubmitted.value = true;
  addFormData.location = select1.value;

  // Validate if the selected type is not the placeholder or default value
  if (!addFormData.name || addFormData.type === select.value || addFormData.type === '1' || !addFormData.capacityMax || !addFormData.capacityMin || !addFormData.status) {
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

  // Check for duplicate names
  const existingUser = items.value.find(
    user => user.name === addFormData.name
  );

  if (existingUser) {
    Swal.fire({
      icon: 'error',
      title: 'Duplicate Name',
      html: `<b>${addFormData.name}</b> already exists, please try another name`,
      confirmButtonText: 'Try Again',
      confirmButtonColor: '#d33',
    });
    return;
  }

  // Ensure platform is formatted as a string before making the API call
  const formData = {
    ...addFormData,
    platform: addFormData.platform.join(','), // Convert array to comma-separated string
  };

  // Conditionally add the subLocList to formData
  if (addFormData.selectedSubLocation) {
    formData.subLocList = [
      {
        name: addFormData.selectedSubLocation, // Only the selected sublocation is included in the array
      }
    ];
  }

  // Show the confirmation dialog before making the API call
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
      // Make the API call only if the user confirms
      axios.post(API_BASE_URL, formData)
        .then(response => {
          if (response.data.message === `Unable to complete request. Machine data is with Name ${addFormData.name} already exist`) {
            Swal.fire({
              icon: 'error',
              title: 'Duplicate Name',
              html: `<b>${addFormData.name}</b> already exists, please try another name`,
              confirmButtonText: 'Try Again',
              confirmButtonColor: '#d33',
            });
          } else {
            console.log('Successfully submitted data:', response.data);
            setAddSlideover(false);
            resetAddFormData();
            fetchPlatform();
            fetchLocation();
            updateTableData();
            updateTableDataDelete();
            fetchNamesShift();
            fetchType();
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
          }
        })
        .catch(error => handleError(error, 'Error adding role'));
    }
    formSubmitted.value = false;
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
  formData.status = 'Active';
  addFormData.type = select.value;
  select1.value = "1";
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
  editFormData.id = null;
  editFormData.name = "";
  editFormData.type = select.value;
  editFormData.uom = "";
  editFormData.capacityMax = 0;
  editFormData.capacityMin = 0;
  editFormData.shift = "";
  editFormData.remarks = "";
  select1.value = "1";
  selectedEditSubLocation.value = '';
  editSubLocationSearchQuery.value = '';

};

const resetAddFormData = () => {
  addFormData.id = '';

  addFormData.name = "";
  addFormData.uom = "";
  addFormData.type = select.value;
  addFormData.capacityMax = 0;
  addFormData.capacityMin = 0;
  addFormData.shift = "";
  addFormData.remarks = "";
  select1.value = "1";
  selectedAddSubLocation.value = '';
  subLocationSearchQuery.value = ''
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
    <h2 class="mr-auto text-lg font-medium">Machine Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Machine Master
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
    <h2 class="mr-auto text-lg font-medium">Machine Master - Deleted List</h2>

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
          Add Machine Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Machine ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.name }" id="regular-form-1"
              v-model="addFormData.name" type="text" placeholder="Machine ID" />
            <span v-if="formSubmitted && !addFormData.name" class="text-red-500">Machine ID is
              required!</span>
          </div>
          <div class="mt-2">

          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="addFormData.type" ref="tomSelect" :options="{
              placeholder: 'Select a Type Option',
            }" class="w-full" :class="{ 'border-red-500': formSubmitted && (addFormData.type === '1') }">
              <option v-for="type in addFormData.types" :key="type" :value="type">
                {{ type }}
              </option>
            </TomSelect>

          </div>
          <span v-if="formSubmitted && (addFormData.type === '1')" class="text-red-500">Type is required!</span>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="addFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in addFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Main Location</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="select1" :options="{
              placeholder: 'Select a Location Option',
            }" class="w-full sm:mr-2" aria-label="Default select example">
              <option disabled value="1">Select a Main Location Option</option>
              <option v-for="location in addFormData.locations" :key="location" :value="location">
                {{ location }}
              </option>
            </TomSelect>
          </div>

          <div class="mt-5" v-if="addFormData.locations.length > 0">
  <FormLabel htmlFor="subloc-form-5">Sub Location</FormLabel>
  <span class="text-red-500 pl-1 text-md">*</span>

  <!-- Custom dropdown with search -->
  <div class="relative">
    <div
      :class="[
        'border rounded',
        {
          'border-gray-300 bg-gray-100 cursor-not-allowed': addFormData.subLocList.length === 0,
          'border-gray-300': addFormData.subLocList.length > 0,
        }
      ]">
      <div class="relative">
        <!-- Dropdown trigger - clicking this opens the dropdown, only if subLocList is not empty -->
        <div
          @click="addFormData.subLocList.length > 0 ? toggleSubLocationDropdown() : null"
          class="p-2"
          :class="{
            'cursor-pointer': addFormData.subLocList.length > 0,
            'text-gray-400': addFormData.subLocList.length === 0,
          }">
          {{ selectedAddSubLocation || 'Select a Sub Location' }}
        </div>

        <!-- Dropdown menu, only shown when open and subLocList is not empty -->
        <div v-if="isSubLocationDropdownOpen && addFormData.subLocList.length > 0"
          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
          <!-- Searchable input inside the dropdown -->
          <input
            type="text"
            v-model="subLocationSearchQuery"
            placeholder="Search Sub Location"
            class="border-b border-gray-300 p-2 w-full"
          />
          <!-- Filtered options -->
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
  </div>
</div>



          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">UOM</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="addFormData.uom" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a UOM Option</option>
              <option>KG</option>
              <option>L</option>
              <option>LB</option>
            </FormSelect>

          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Max
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Min
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-3" class="sr-only">Capacity Max</FormLabel>
                    <FormInput
                      :class="{ 'border-red-500': formSubmitted && (!addFormData.capacityMax || addFormData.capacityMax <= 0 || addFormData.capacityMax < addFormData.capacityMin) }"
                      id="regular-form-3" v-model="addFormData.capacityMax" type="number" placeholder="Capacity Max" />
                    <span v-if="formSubmitted && (!addFormData.capacityMax || addFormData.capacityMax <= 0)"
                      class="text-red-500">
                      Capacity Max is required!
                    </span>
                    <span
                      v-else-if="formSubmitted && addFormData.capacityMin !== null && addFormData.capacityMax < addFormData.capacityMin"
                      class="text-red-500">
                      Capacity Max must be greater than or equal to Capacity Min!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-4" class="sr-only">Capacity Min</FormLabel>
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
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
          Edit Machine Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Machine ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.name }" id="regular-form-1" v-model="editFormData.name"
              type="text" placeholder="Machine ID" />
            <span v-if="!editFormData.name" class="text-red-500">Machine ID is required!</span>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Type</FormLabel>
            <TomSelect v-model="editFormData.type" :options="{
              placeholder: 'Select a Type Option',
            }" class="w-full">
              <option disabled value="1">Select a Type Option</option>
              <option v-for="type in editFormData.types" :key="type" :value="type">
                {{ type }}
              </option>

            </TomSelect>

          </div>
          <span v-if="(!addFormData.type)" class="text-red-500">Type is required!</span>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="editFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in editFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Main Location</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <TomSelect v-model="select1" :options="{
              placeholder: 'Select a Location Option',
            }" class="w-full sm:mr-2" aria-label="Default select example">
              <option disabled value="1">Select a Main Location Option</option>
              <option v-for="location in editFormData.locations" :key="location" :value="location">
                {{ location }}
              </option>
            </TomSelect>
          </div>
          <div class="mt-5" v-if="editFormData.locations.length > 0">
  <FormLabel htmlFor="subloc-form-5">Sub Location</FormLabel>
  <span class="text-red-500 pl-1 text-md">*</span>

  <!-- Custom dropdown with search -->
  <div class="relative">
    <div
      :class="[
        'border rounded',
        {
          'border-gray-300 bg-gray-100 cursor-not-allowed': editFormData.subLocList.length === 0,
          'border-gray-300': editFormData.subLocList.length > 0,
        }
      ]">
      <div class="relative">
        <!-- Dropdown trigger - clicking this opens the dropdown, only if subLocList is not empty -->
        <div
          @click="editFormData.subLocList.length > 0 ? toggleEditSubLocationDropdown() : null"
          class="p-2"
          :class="{
            'cursor-pointer': editFormData.subLocList.length > 0,
            'text-gray-400': editFormData.subLocList.length === 0,
          }">
          {{ selectedEditSubLocation || 'Select a Sub Location' }}
        </div>

        <!-- Dropdown menu, only shown when open and subLocList is not empty -->
        <div v-if="isEditSubLocationDropdownOpen && editFormData.subLocList.length > 0"
          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
          <!-- Searchable input inside the dropdown -->
          <input
            type="text"
            v-model="editSubLocationSearchQuery"
            placeholder="Search Sub Location"
            class="border-b border-gray-300 p-2 w-full"
          />
          <!-- Filtered options -->
          <ul class="max-h-40 overflow-y-auto">
            <li v-for="subloc in filteredEditSubLocations" :key="subloc.name"
              @click="selectEditSubLocation(subloc.name)" class="cursor-pointer p-2 hover:bg-gray-100">
              {{ subloc.name }}
            </li>
            <li v-if="filteredEditSubLocations.length === 0" class="p-2 text-gray-500">No results found</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">UOM</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.uom" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a UOM Option</option>
              <option>KG</option>
              <option>L</option>
              <option>LB</option>
            </FormSelect>

          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Max
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Min
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-3" class="sr-only">Capacity Max</FormLabel>
                    <FormInput
                      :class="{ 'border-red-500': (!editFormData.capacityMax || editFormData.capacityMax <= 0 || editFormData.capacityMax < editFormData.capacityMin) }"
                      id="regular-form-3" v-model="editFormData.capacityMax" type="number" placeholder="Capacity Max" />
                    <span v-if="!editFormData.capacityMax || editFormData.capacityMax <= 0" class="text-red-500">
                      Capacity Max is required!
                    </span>
                    <span
                      v-else-if="editFormData.capacityMin !== null && editFormData.capacityMax < editFormData.capacityMin"
                      class="text-red-500">
                      Capacity Max must be greater than or equal to Capacity Min!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-4" class="sr-only">Capacity Min</FormLabel>
                    <FormInput
                      :class="{ 'border-red-500': (!editFormData.capacityMin || editFormData.capacityMin <= 0 || editFormData.capacityMin > editFormData.capacityMax) }"
                      id="regular-form-4" v-model="editFormData.capacityMin" type="number" placeholder="Capacity Min" />
                    <span v-if="!editFormData.capacityMin || editFormData.capacityMin <= 0" class="text-red-500">
                      Capacity Min is required!
                    </span>
                    <span
                      v-else-if="editFormData.capacityMax !== null && editFormData.capacityMin > editFormData.capacityMax"
                      class="text-red-500">
                      Capacity Min must be less than or equal to Capacity Max!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

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
          View Machine Master
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Machine ID
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.name }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Type
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.type }}
                  </td>
                </tr>

                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Platform
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    <!-- Check if platform data is an array -->
                    <div v-if="Array.isArray(viewData.platform)">
                      <!-- Loop through each platform -->
                      <span v-for="(platform, index) in viewData.platform" :key="index">
                        <!-- Add a comma before the platform name if it's not the first one -->
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
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Main Location
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.location }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
    <th scope="row"
        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
        Sub Location
    </th>
    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
        {{ viewData.selectedSubLocation }}
    </td>
</tr>


                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    UOM
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.uom }}
                  </td>
                </tr>
                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Shift
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.shift }}
                  </td>
                </tr> -->
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Max
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.capacityMax }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Capacity Min
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.capacityMin }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Remarks
                  </th>
                  <td class="w-[70%] px-5 py-5 text-center text-gray-700 dark:text-white">
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
