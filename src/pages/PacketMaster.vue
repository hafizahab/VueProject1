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

const select = ref("*");


interface Response {
  id?: string;
  name?: string;
  capacityMax?: string;
  capacityMin?: string;
  remarks?: string;
  status?: string;
}

interface UserAccess {
    userId: string;
    bagMaster?: string[];
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
          minWidth: 200,
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
          title: "Remarks",
          field: "remarks",
          visible: false,
          responsive: 0,
          vertAlign: "middle",
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
                    if (userAccess.bagMaster && userAccess.bagMaster.includes("Edit") && response.status !== "Completed") {
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
                    if (userAccess.bagMaster && userAccess.bagMaster.includes("Delete")) {
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
          title: "Remarks",
          field: "remarks",
          visible: false,
          responsive: 0,
          vertAlign: "middle",
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

const loading = ref(false); // Loading state for modal control
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/PacketMaster/';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

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

  // Initialize other required functions
  initTabulator();
  reInitOnResizeWindow();
  fetchItems();
  fetchinnerStickerTemplate();
});

const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/PacketMaster/GetPacketMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/PacketMaster/UpdatePacketMasterActive';
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


interface subPacketList {
  id: string;
  capacity: string;
  bagSize: string;
  noofPiecesperBag: number;
  stickerTemplate: string;
  status: string;
}

// Form Data
const editFormData = reactive({
  id: null,
  name: "",
  capacityMax: 0,
  capacityMin: 0,
  remarks: "",
  status: "",
  size: "",
  noofPiecesperPacket: 0,
  stickerTemplate: "",
  names: [] as string[],
  stickerTemplates: [] as string[],
  subPacketList: [] as subPacketList[] // Use the subPacketList type here
});



const viewData = reactive({
  id: '',
  name: "",
  capacityMax: 0,
  capacityMin: 0,
  remarks: "",
  status: "",
  size: "",
  noofPiecesperPacket: 0,
  stickerTemplate: "",
  subPacketList: [] as subPacketList[] // Use the subPacketList type here
});


const addFormData = reactive({
  id: '',
  name: "",
  capacityMax: 0,
  capacityMin: 0,
  remarks: "",
  size: "",
  noofPiecesperPacket: 0,
  stickerTemplate: "",
  status: "Active",
  stickerTemplates: [] as string[],
  names: [] as string[],
  subPacketList: [] as subPacketList[] // Use the subPacketList type here
});

// Define permission variables for bagMaster
let canEditBagMaster = false;
let canDeleteBagMaster = false;
const canCreateBagMaster = ref(false);

// Define the fetchUserBagPermissions function
const fetchUserBagPermissions = async () => {
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

      const bagMaster = userDetails.bagMaster || ''; // Ensure the value is a string

      // Check if the string contains "Create", "Delete", and "Edit" for bagMaster
      canCreateBagMaster.value = bagMaster.includes('Create');
      canDeleteBagMaster = bagMaster.includes('Delete');
      canEditBagMaster = bagMaster.includes('Edit');

      console.log('canCreateBagMaster:', canCreateBagMaster.value); // Debugging log
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

// Call the fetchUserBagPermissions function to get permissions
fetchUserBagPermissions();


const addRow = (formData: any) => {
  formData.subPacketList.push({
    capacity: '',
    bagSize: '',
    noofPiecesperBag: 0,
    stickerTemplate: select.value,
    status: 'Active',
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

const deleteAddRow = (index: number) => {
  addFormData.subPacketList.splice(index, 1);
};

const fetchinnerStickerTemplate = () => {
  axios.get('http://10.87.0.33:8082/api/PacketStickerMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive'
        );

        // Map the activeNameData array to extract the 'name' property
        addFormData.stickerTemplates = activeNameData.map(item => item.code);
        editFormData.stickerTemplates = activeNameData.map(item => item.code);
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
        Object.assign(formData, {
          id: firstItem.id,
          name: firstItem.name,
          capacityMax: firstItem.capacityMax,
          capacityMin: firstItem.capacityMin,
          remarks: firstItem.remarks,
          size: firstItem.size,
          noofPiecesperPacket: firstItem.noofPiecesperPacket,
          stickerTemplate: firstItem.stickerTemplate,
          status: firstItem.status,
          subPacketList: firstItem.status === 'Active'
            ? firstItem.subPacketDetails?.filter((subPacket: any) => subPacket.status === 'Active') || []
            : [],
        });

        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    })
    .catch(error => handleError(error, 'Error fetching data for editing'))
    .finally(() => {
      loading.value = false; // Hide loading animation
    });
};


const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

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

  // Initialize other required functions
  initTabulator();
  reInitOnResizeWindow();
  fetchItems();
  fetchinnerStickerTemplate();
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
const DELETE_API_BASE_URL = 'http://10.87.0.33:8082/api/PacketMaster/DeleteSubPacketById/';

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
            editFormData.subPacketList.splice(index, 1);
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
    editFormData.subPacketList.splice(index, 1);
  }
};

// Update Role
const updateRole = () => {
  if (!editFormData.name) {
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
          fetchinnerStickerTemplate();
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
  if (!addFormData.name) {
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
    // Log the payload to the console before making the API call
    console.log('Payload being sent:', addFormData);

    // Proceed with the API call to add the role
    axios.post(API_BASE_URL, { ...addFormData })
      .then(response => {
        if (response.data.message === `Unable to complete request. Packet data is with Name ${addFormData.name} already exist`) {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate Name',
            html: `<b>${addFormData.name}</b> already exists, please try another name`,
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#d33',
          });
        } else {
          // If no duplicate, show the confirmation dialog
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
              console.log('Payload being sent in the confirmation step:', addFormData);
              axios.post(API_BASE_URL, { ...addFormData })
                .then(response => {
                  console.log('Successfully submitted data:', response.data);
                  setAddSlideover(false);
                  resetFormData(addFormData);
                  updateTableData();
                  updateTableDataDelete();
                  fetchinnerStickerTemplate();
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
      })
      .catch(error => handleError(error, 'Error adding role'));
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
  addFormData.subPacketList = [];
  addFormData.capacityMax = 0;
  addFormData.capacityMin = 0;
  addFormData.noofPiecesperPacket = 0;
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
  <!-- Loading Modal Overlay -->
  <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Bag Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreateBagMaster">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Bag Master
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
            <option value="name">Name</option>
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
    <h2 class="mr-auto text-lg font-medium">Bag Master - Deleted List</h2>

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
            <option value="name">Name</option>
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
          Add Bag Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Name</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.name }" id="regular-form-1"
              v-model="addFormData.name" type="text" placeholder="Name" />
            <span v-if="formSubmitted && !addFormData.name" class="text-red-500">Name is
              required!</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Capacity Max</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
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
          </div>

          <div class="mt-5">
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
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="size">Bag Size</FormLabel>
            <FormInput v-model="addFormData.size" id="size" name="text" placeholder="Bag Size">
            </FormInput>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="noofPiecesperPacket">Number of Pieces per Bag</FormLabel>
            <FormInput v-model="addFormData.noofPiecesperPacket" id="noofPiecesperPacket" type="number"
              placeholder="Number of Pieces per Bag">
            </FormInput>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Sticker Template</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="addFormData.stickerTemplate" class="sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Sticker Template Option</option>
              <option v-for="stickerTemplate in addFormData.stickerTemplates" :key="stickerTemplate"
                :value="stickerTemplate">
                {{ stickerTemplate }}
              </option>
            </FormSelect>
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
          </div> -->
          <div>
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Sub Packet List</h6>
            <hr>
            <button type="button" @click="addRowToAddForm"
              class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add</button>

            <div v-if="addFormData.subPacketList.length > 0" class="table-container">
              <table class="min-w-full border-collapse rounded-lg overflow-x-auto shadow-sm mt-2">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-left rounded-tl-lg" style="width: 50px;">No.</th>
                    <!-- Set the width here -->
                    <th class="py-2 px-4 border-b text-left">Capacity</th>
                    <th class="py-2 px-4 border-b text-left">Bag Size</th>
                    <th class="py-2 px-4 border-b text-center">No of Pieces per Bag</th>
                    <th class="py-2 px-4 border-b text-center">Sticker Template</th>
                    <th class="py-2 px-4 border-b text-center">Status</th>
                    <th class="py-2 px-4 border-b text-center rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in addFormData.subPacketList" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.capacity" type="number" placeholder="Capacity" />
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.bagSize" type="text" placeholder="Bag Size" />
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.noofPiecesperBag" type="number"
                        placeholder="No of Pieces per Bag" />
                    </td>

                    <td class="py-2 px-2 border-b">
                      <!-- <FormSelect v-model="row.stickerTemplate" class="sm:mr-2" aria-label="Default select example">
                        <option disabled value="">Select a Sticker Template Option</option>
                        <option v-for="stickerTemplate in addFormData.stickerTemplates" :key="stickerTemplate"
                          :value="stickerTemplate">
                          {{ stickerTemplate }}
                        </option>
                      </FormSelect> -->
                      <TomSelect v-model="row.stickerTemplate" :options="{ placeholder: 'Select a Sticker Template' }"
                        autocomplete="off" :clearable="true" :allowEmptyOption="true"
                        class="w-full tom-select custom-tom-select">
                        <option disabled value="*">Select a Sticker Template</option>

                        <option v-for="stickerTemplate in addFormData.stickerTemplates" :key="stickerTemplate"
                          :value="stickerTemplate">
                          {{ stickerTemplate }}
                        </option>
                      </TomSelect>


                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormSelect v-model="row.status" class="sm:mr-2" aria-label="Default select example">
                        <option disabled value="">Select a Status Option</option>
                        <option>Active</option>
                        <option>Inactive</option>

                      </FormSelect>
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
          Edit Bag Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Name</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.name }" id="regular-form-1" v-model="editFormData.name"
              type="text" placeholder="Name" />
            <span v-if="!editFormData.name" class="text-red-500">Name is required!</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Capacity Max</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': (!editFormData.capacityMax || editFormData.capacityMax <= 0 || editFormData.capacityMax < editFormData.capacityMin) }"
              id="regular-form-3" v-model="editFormData.capacityMax" type="number" placeholder="Capacity Max" />
            <span v-if="!editFormData.capacityMax || editFormData.capacityMax <= 0" class="text-red-500">
              Capacity Max is required!
            </span>
            <span v-else-if="editFormData.capacityMin !== null && editFormData.capacityMax < editFormData.capacityMin"
              class="text-red-500">
              Capacity Max must be greater than or equal to Capacity Min!
            </span>
          </div>

          <div class="mt-5">
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
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="size">Bag Size</FormLabel>
            <FormInput v-model="editFormData.size" id="size" name="text" placeholder="Bag Size">
            </FormInput>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="noofPiecesperPacket">Number of Pieces per Bag</FormLabel>
            <FormInput v-model="editFormData.noofPiecesperPacket" id="noofPiecesperPacket" type="number"
              placeholder="Number of Pieces per Bag">
            </FormInput>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Sticker Template</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="editFormData.stickerTemplate" class="sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Sticker Template Option</option>
              <option v-for="stickerTemplate in editFormData.stickerTemplates" :key="stickerTemplate"
                :value="stickerTemplate">
                {{ stickerTemplate }}
              </option>
            </FormSelect>
          </div>
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
          </div> -->
          <div>
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Sub Packet List</h6>
            <hr>
            <button type="button" @click="addRowToEditForm"
              class="mt-5 px-4 py-2 bg-blue-700 text-white overflow-x-auto rounded hover:bg-blue-900">Add</button>

            <div v-if="editFormData.subPacketList.length > 0">
              <table class="min-w-full border-collapse rounded-lg  shadow-sm mt-2">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-left rounded-tl-lg" style="width: 50px;">No.</th>
                    <!-- Set the width here -->
                    <th class="py-2 px-4 border-b text-left ">Capacity</th>
                    <th class="py-2 px-4 border-b text-left">Bag Size</th>
                    <th class="py-2 px-4 border-b text-center">No of Pieces per Bag</th>
                    <th class="py-2 px-4 border-b text-center">Sticker Template</th>
                    <th class="py-2 px-4 border-b text-center">Status</th>
                    <th class="py-2 px-4 border-b text-center rounded-tr-lg">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.subPacketList" :key="index" class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.capacity" type="number" placeholder="Capacity" />
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.bagSize" type="text" placeholder="Bag Size" />
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormInput id="regular-form-1" v-model="row.noofPiecesperBag" type="number"
                        placeholder="No of Pieces per Bag" />
                    </td>
                    <td class="py-2 px-2 border-b">
                      <TomSelect v-model="row.stickerTemplate" :options="{ placeholder: 'Select a Sticker Template' }"
                        autocomplete="off" :clearable="true" :allowEmptyOption="true"
                        class="w-full tom-select custom-tom-select">
                        <option disabled value="*">Select a Sticker Template</option>

                        <option v-for="stickerTemplate in editFormData.stickerTemplates" :key="stickerTemplate"
                          :value="stickerTemplate">
                          {{ stickerTemplate }}
                        </option>
                      </TomSelect>
                    </td>
                    <td class="py-2 px-2 border-b">
                      <FormSelect v-model="row.status" class="sm:mr-2" aria-label="Default select example">
                        <option disabled value="">Select a Status Option</option>
                        <option>Active</option>
                        <option>Inactive</option>

                      </FormSelect>
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
:staticBackdrop="true" size="3xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Bag Master
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
                    Name
                  </th>
                  <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.name }}
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
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.subPacketList.length > 0">
  <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
    <tbody class="w-[100%]">
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <th scope="col" colspan="7"
          class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
          Sub Packet List
        </th>
      </tr>
      <tr>
        <th class="px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          No.
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Capacity
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Bag Size
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          No of Pieces per Bag
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Sticker Template
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Status
        </th>

      </tr>
      <tr v-for="(row, index) in viewData.subPacketList" :key="index" class="hover:bg-gray-100">
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ index + 1 }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.capacity }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.bagSize }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.noofPiecesperBag }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.stickerTemplate }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.status }}
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
.custom-tom-select .ts-control {
  height: 38px;
  /* Adjust to match other inputs' height */
  line-height: 1.25;
  /* Adjust to vertically center the text */
  padding: 6px 12px;
  /* Adjust padding to match other inputs */
  white-space: nowrap;
  /* Prevent text from wrapping */
  overflow: hidden;
  /* Hide overflow */
  text-overflow: ellipsis;
  /* Show ellipsis if text is too long */
}

.custom-tom-select .ts-control .ts-wrapper {
  height: 100%;
  /* Ensure the wrapper takes up the full height */
  display: flex;
  align-items: center;
  /* Vertically center the text */
}

.custom-tom-select .ts-dropdown {
  margin-top: 4px;
  /* Adjust if there's an overlap or gap with the dropdown */
}
</style>