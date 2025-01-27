<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, watch, computed } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import LoadingIcon from "../base-components/LoadingIcon";

interface Response {
    id?: string;
    name?: string;
    code?: string;
    remarks?: string;
    status?: string;
}

interface UserAccess {
    userId: string;
    vendorMaster?: string[];
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
                    title: "NAME",
                    field: "name",
                    minWidth: 300,
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
                    title: "CODE",
                    field: "code",
                    minWidth: 150,
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
                                    if (userAccess.vendorMaster && userAccess.vendorMaster.includes("Edit")) {
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
                                    if (userAccess.vendorMaster && userAccess.vendorMaster.includes("Delete")) {
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/VendorMaster/';

onMounted(() => {
    loading.value = true; // Start loading animation

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
            loading.value = false; // End loading animation
        });

    initTabulator();
    reInitOnResizeWindow();
    fetchItems();
    fetchPowderCodes();
});



const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/VendorMaster/GetVendorMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/VendorMaster/UpdateVendorMasterActive';
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

interface powderList {
    id: string;
    discrepencyWeight: number;
    powderCode: string;
    status: string;
}

// Form Data
const editFormData = reactive({
    id: null,
    name: "",
    code: "",
    remarks: "",
    status: "",
    powderList: [] as powderList[],
    productcodes: [] as string[],
});


const viewData = reactive({
    id: '',
    name: '',
    code: "",
    remarks: '',
    status: '',
    powderList: [] as powderList[],
    productcodes: [] as string[],
});


const addFormData = reactive({
    id: '',
    name: '',
    code: "",
    remarks: '',
    status: 'Active',
    powderList: [] as powderList[],
    productcodes: [] as string[],
});

const addRow = (formData: any) => {
    formData.powderList.push({
        powderCode: '',
        discrepencyWeight: '0',
    });
};

const deleteAddRow = (index: number) => {
    addFormData.powderList.splice(index, 1);
};

const DELETE_API_BASE_URL = 'http://10.87.0.33:8082/api/VendorMaster/DeletePowderListById/';

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
                        editFormData.powderList.splice(index, 1);
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
        editFormData.powderList.splice(index, 1);
    }
};


// Add row to addFormData
const addRowToAddForm = () => {
    addRow(addFormData);
};

// Add row to editFormData
const addRowToEditForm = () => {
    addRow(editFormData);
};

const isPowderDropdownOpen = ref<Record<number, boolean>>({});
const powderSearchQueries = ref<Record<number, string>>({});

const togglePowderDropdown = (index: number) => {
    isPowderDropdownOpen.value[index] = !isPowderDropdownOpen.value[index];
    powderSearchQueries.value[index] = ''; // Clear search query when dropdown is opened
};

const filteredPowderCodes = (searchQuery: string) => {
    if (!searchQuery) return addFormData.productcodes;
    return addFormData.productcodes.filter((powderCode: string) =>
        powderCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
};

const selectPowderCode = (powderCode: string, index: number) => {
    addFormData.powderList[index].powderCode = powderCode;
    isPowderDropdownOpen.value[index] = false; // Close the dropdown after selecting
};

const isEditPowderDropdownOpen = ref<Record<number, boolean>>({});
const editPowderSearchQueries = ref<Record<number, string>>({});
const toggleEditPowderDropdown = (index: number) => {
    isEditPowderDropdownOpen.value[index] = !isEditPowderDropdownOpen.value[index];
    editPowderSearchQueries.value[index] = ''; // Clear search query when dropdown is opened
};
const filteredEditPowderCodes = (searchQuery: string) => {
    if (!searchQuery) return editFormData.productcodes; // Use `editFormData.productcodes` here
    return editFormData.productcodes.filter((powderCode: string) =>
        powderCode.toLowerCase().includes(searchQuery.toLowerCase())
    );
};
const selectEditPowderCode = (powderCode: string, index: number) => {
    editFormData.powderList[index].powderCode = powderCode;
    isEditPowderDropdownOpen.value[index] = false; // Close the dropdown after selecting
};



const fetchPowderCodes = () => {
    axios.get('http://10.87.0.33:8082/api/ProductMaster')
        .then(response => {
            const powderData = response.data.result;

            if (Array.isArray(powderData)) {
                // Filter items where status is not "inactive" and productType is "powder" (case-insensitive)
                const activePowderData = powderData.filter(item =>
                    item.status.toLowerCase() !== 'inactive' && item.productType.toLowerCase() === 'powder'
                );

                // Use a Set to filter out duplicate powder codes
                const uniquePowderCodes = [...new Set(activePowderData.map(item => item.code))];

                // Assign the unique powder codes to both addFormData and editFormData
                addFormData.productcodes = uniquePowderCodes;
                editFormData.productcodes = uniquePowderCodes;
            } else {
                console.error('Invalid response format for powders:', powderData);
            }
        })
        .catch(error => {
            console.error('Error fetching powders:', error);
        });
};





// Define permission variables for vendorMaster
const canDeleteVendorMaster = ref(false);
const canEditVendorMaster = ref(false);
const canCreateVendorMaster = ref(false);

const fetchUserVendorPermissions = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'User ID not found in local storage',
        });
        return;
    }

    try {
        const userAccessResponse = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
        const userDetails = userAccessResponse.data.result.find((user: any) => user.userId === userId);

        if (userDetails) {
            const vendorMaster = userDetails.vendorMaster || '';

            // Update permissions reactively
            canCreateVendorMaster.value = vendorMaster.includes('Create');
            canDeleteVendorMaster.value = vendorMaster.includes('Delete');
            canEditVendorMaster.value = vendorMaster.includes('Edit');
            console.log('Can Edit:', canEditVendorMaster.value, 'Can Delete:', canDeleteVendorMaster.value);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'User details not found',
            });
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while fetching user details',
        });
    }
};


onMounted(async () => {
    await fetchUserVendorPermissions();


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
                    code: firstItem.code,
                    remarks: firstItem.remarks,
                    status: firstItem.status,
                    powderList: firstItem.vendorPowderList || [],
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


const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
    loading.value = true; // Start loading animation

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
            loading.value = false; // End loading animation
        });

    initTabulator();
    reInitOnResizeWindow();
    fetchItems();
    fetchPowderCodes();

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
  // Validate required fields in editFormData
  if (!editFormData.name || !editFormData.code || !editFormData.status) {
    Swal.fire({
      icon: "error",
      title: "Please complete all required fields",
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      position: "top-end",
      iconColor: "red",
      toast: true,
      background: "#fff",
      showClass: {
        popup: "animate__animated animate__fadeInUp",
      },
      hideClass: {
        popup: "animate__animated animate__fadeOutUp",
      },
    });
    return;
  }

  // Validate the powder list
  const isPowderListValid = editFormData.powderList.every(
    (row) => row.powderCode && row.discrepencyWeight !== undefined
  );

  if (!isPowderListValid) {
    Swal.fire({
      icon: "error",
      title: "Powder List is incomplete",
      text: "Ensure all rows in the Powder List have a Powder Code and Discrepancy Weight.",
    });
    return;
  }

  // Transform powder list to vendorPowderListtoAdd
  const vendorPowderListtoAdd = editFormData.powderList.map((row) => ({
    id: '',
    vendorMasterId: editFormData.id, // Assuming vendorMasterId is the `editFormData.id`
    powderCode: row.powderCode,
    discrepencyWeight: row.discrepencyWeight,
    status: row.status || "Active", // Default to Active if not set
  }));

  // Prepare data to send
  const payload = {
    name: editFormData.name,
    code: editFormData.code,
    remarks: editFormData.remarks,
    status: editFormData.status,
    vendorPowderListtoAdd, // Add the transformed powder list
  };

  // Confirm the update action
  Swal.fire({
    title: "Are you sure?",
    text: "This will update the data!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#1e40af",
    cancelButtonColor: "#d33",
    confirmButtonText: "Yes, update it!",
  }).then((result) => {
    if (result.isConfirmed && editFormData.id) {
      axios
        .put(`${API_BASE_URL}${editFormData.id}`, payload)
        .then((response) => {
          console.log("Successfully submitted data:", response.data);
          setEditSlideOver(false);
          updateTableData();
          updateTableDataDelete();
          fetchItems();
          Swal.fire({
            icon: "success",
            title: "Updated Successfully",
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: "top-end",
            iconColor: "green",
            toast: true,
            background: "#fff",
            showClass: {
              popup: "animate__animated animate__fadeInUp",
            },
            hideClass: {
              popup: "animate__animated animate__fadeOutUp",
            },
          });
        })
        .catch((error) => {
          console.error("Error updating data:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while updating the data.",
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

    // Validate required fields in addFormData
    if (formSubmitted.value && (!addFormData.name || !addFormData.code || !addFormData.status)) {
        Swal.fire({
            icon: "error",
            title: "Please complete all required fields",
            showConfirmButton: false,
            showCloseButton: true,
            timer: 5000,
            timerProgressBar: true,
            position: "top-end",
            iconColor: "red",
            toast: true,
            background: "#fff",
            showClass: {
                popup: "animate__animated animate__fadeInUp",
            },
            hideClass: {
                popup: "animate__animated animate__fadeOutUp",
            },
        });
        return;
    }

    // Validate the powder list
    const isPowderListValid = addFormData.powderList.every(
        (row) => row.powderCode && row.discrepencyWeight !== undefined
    );

    if (!isPowderListValid) {
        Swal.fire({
            icon: "error",
            title: "Powder List is incomplete",
            text: "Ensure all rows in the Powder List have a Powder Code and Discrepancy Weight.",
        });
        return;
    }

    // Transform powder list to vendorPowderListtoAdd
    const vendorPowderListtoAdd = addFormData.powderList.map((row) => ({
        powderCode: row.powderCode,
        discrepencyWeight: row.discrepencyWeight,
        status: row.status || "Active", // Default to Active if not set
    }));

    // Prepare data to send
    const payload = {
        name: addFormData.name,
        code: addFormData.code,
        remarks: addFormData.remarks,
        status: addFormData.status,
        vendorPowderListtoAdd, // Add the transformed powder list
    };

    // Check for duplicate name
    axios.post(API_BASE_URL, payload)
        .then(response => {
            if (response.data.message === `Unable to complete request. Vendor Master Data is already exist`) {
                Swal.fire({
                    icon: "error",
                    title: "Duplicate Name",
                    html: `<b>${addFormData.name}</b> already exists, please try another name`,
                    confirmButtonText: "Try Again",
                    confirmButtonColor: "#d33",
                });
            } else {
                // Show confirmation dialog
                Swal.fire({
                    title: "Confirmation",
                    text: "Are you sure you want to add this role?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#1e40af",
                    cancelButtonColor: "#d33",
                    confirmButtonText: "Yes, add it!",
                }).then(result => {
                    if (result.isConfirmed) {
                        // Send the final payload
                        axios.post(API_BASE_URL, payload)
                            .then(response => {
                                console.log("Successfully submitted data:", response.data);
                                setAddSlideover(false);
                                resetFormData(addFormData);
                                updateTableData();
                                updateTableDataDelete();
                                Swal.fire({
                                    icon: "success",
                                    title: "Role Added Successfully",
                                    showConfirmButton: false,
                                    showCloseButton: true,
                                    timer: 5000,
                                    timerProgressBar: true,
                                    position: "top-end",
                                    iconColor: "green",
                                    toast: true,
                                    background: "#fff",
                                    showClass: {
                                        popup: "animate__animated animate__fadeInUp",
                                    },
                                    hideClass: {
                                        popup: "animate__animated animate__fadeOutUp",
                                    },
                                });
                            })
                            .catch(error => handleError(error, "Error adding role"));
                    }
                    formSubmitted.value = false;
                });
            }
        })
        .catch(error => handleError(error, "Error adding role"));
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
    addFormData.powderList = [];
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
        <h2 class="mr-auto text-lg font-medium">Vendor Master</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if=canCreateVendorMaster>
            <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
                Add Vendor Master
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
                        <option value="code">Code</option>
                    </FormSelect>
                </div>
                <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0 " style="display:none">
                    <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                        Type
                    </label>
                    <FormSelect id="tabulator-html-filter-type" v-model="filter.type"
                        class="w-full mt-2 sm:mt-0 sm:w-auto">
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
                        Go
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
        <h2 class="mr-auto text-lg font-medium">Vendor Master - Deleted List</h2>

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
                        <option value="code">Code</option>
                    </FormSelect>
                </div>
                <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0 " style="display:none">
                    <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
                        Type
                    </label>
                    <FormSelect id="tabulator-html-filter-type" v-model="filter.type"
                        class="w-full mt-2 sm:mt-0 sm:w-auto">
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
                        Go
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
                    Add Vendor Master
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form" @submit.prevent="addRole">
                    <div>
                        <FormLabel htmlFor="regular-form-1">Name</FormLabel><span
                            class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.name }" id="regular-form-1"
                            v-model="addFormData.name" type="text" placeholder="Name" />
                        <span v-if="formSubmitted && !addFormData.name" class="text-red-500">Name is
                            required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Code</FormLabel><span
                            class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.code }" id="regular-form-1"
                            v-model="addFormData.code" type="text" placeholder="Code" />
                        <span v-if="formSubmitted && !addFormData.code" class="text-red-500">Code is
                            required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
                        <FormTextarea v-model="addFormData.remarks" id="validation-form-6" name="comment"
                            placeholder="Type your remarks">
                        </FormTextarea>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Status</FormLabel><span
                            class="text-red-500 pl-1 text-md">*</span>
                        <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.status }"
                            v-model="addFormData.status" class=" sm:mr-2" aria-label="Default select example">
                            <option disabled value="">Select a Status Option</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </FormSelect>
                        <span v-if="formSubmitted && addFormData.status === ''" class="text-red-500">Please choose a
                            Status!</span>
                    </div>
                    <div>
                        <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Powder List</h6>
                        <hr>
                        <button type="button" @click="addRowToAddForm"
                            class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add</button>
                        <div v-if="addFormData.powderList.length > 0">
                            <table class="min-w-full border-collapse rounded-lg  shadow-sm mt-2">
                                <thead class="bg-primary text-white">
                                    <tr>
                                        <th class="py-2 px-2 border-b text-left rounded-tl-lg" style="width: 50px;">No.</th>
                                        <th class="py-2 px-4 border-b text-left">Powder Code</th>
                                        <th class="py-2 px-16 border-b text-left">Discrepency Weight</th>
                                        <th class="py-2 px-4 border-b text-center rounded-tr-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, index) in addFormData.powderList" :key="index"
                                        class="hover:bg-gray-100">
                                        <td class="py-2 px-4 border-b">
                                            {{ index + 1 }}
                                        </td>
                                        <td class="py-2 px-2 border-b dark:border-gray-700">
    <div class="relative">
        <div
            :class="['border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.powderCode, 'border-gray-300 dark:border-gray-700': !formSubmitted || row.powderCode }]">
            <div class="relative cursor-pointer p-2"
                @click="togglePowderDropdown(index)">
                {{ row.powderCode || 'Select a Powder Code Option' }}
            </div>

            <div v-if="isPowderDropdownOpen[index]"
                class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
                <!-- Searchable input inside the dropdown, using powderSearchQueries[index] -->
                <input type="text" v-model="powderSearchQueries[index]"
                    placeholder="Search Powder Code"
                    class="border-b border-gray-300 dark:border-gray-700 p-2 w-full dark:bg-gray-800 dark:text-gray-300" />
                <!-- Filtered options using filteredPowderCodes with powderSearchQueries[index] -->
                <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
                    <li v-for="powderCode in filteredPowderCodes(powderSearchQueries[index])"
                        :key="powderCode"
                        @click="selectPowderCode(powderCode, index)"
                        class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
                        {{ powderCode }}
                    </li>
                    <li v-if="filteredPowderCodes(powderSearchQueries[index]).length === 0"
                        class="p-2 text-gray-500 dark:text-gray-400">
                        No results found
                    </li>
                </ul>
            </div>
        </div>
        <span v-if="formSubmitted && !row.powderCode"
            class="text-red-500 dark:text-red-400">Powder
            Code is required!</span>
    </div>
</td>



                                        <td class="py-2 px-2 border-b">
                                            <FormInput v-model="row.discrepencyWeight" id="discrepencyWeight"
                                                name="text" placeholder="Discrepency Weight">
                                            </FormInput>
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
                    Edit Vendor Master
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form" @submit.prevent="updateRole">
                    <div>
                        <FormLabel htmlFor="regular-form-1">Name</FormLabel>
                        <span class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': !editFormData.name }" id="regular-form-1"
                            v-model="editFormData.name" type="text" placeholder="Name" />
                        <span v-if="!editFormData.name" class="text-red-500">Name is required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Code</FormLabel>
                        <span class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': !editFormData.code }" id="regular-form-1"
                            v-model="editFormData.code" type="text" placeholder="Code" />
                        <span v-if="!editFormData.code" class="text-red-500">Code is required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
                        <FormTextarea id="validation-form-6" placeholder="Type your remarks"
                            v-model="editFormData.remarks">
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
                    <div>
                        <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Powder List</h6>
                        <hr>
                        <button type="button" @click="addRowToEditForm"
                            class="mt-5 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-900">Add</button>
                        <div v-if="editFormData.powderList.length > 0">
                            <table class="min-w-full border-collapse rounded-lg  shadow-sm mt-2">
                                <thead class="bg-primary text-white">
                                    <tr>
                                        <th class="py-2 px-2 border-b text-left rounded-tl-lg" style="width: 50px;">No.</th>
                                        <th class="py-2 px-4 border-b text-left">Powder Code</th>
                                        <th class="py-2 px-16 border-b text-left">Discrepency Weight</th>
                                        <th class="py-2 px-4 border-b text-center rounded-tR-lg">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(row, index) in editFormData.powderList" :key="index"
                                        class="hover:bg-gray-100">
                                        <td class="py-2 px-4 border-b">
                                            {{ index + 1 }}
                                        </td>

                                        <td class="py-2 px-2 border-b dark:border-gray-700">
    <div class="relative">
        <div
            :class="['border rounded dark:bg-gray-800 dark:text-gray-300', { 'border-red-500': formSubmitted && !row.powderCode, 'border-gray-300 dark:border-gray-700': !formSubmitted || row.powderCode }]">
            <div class="relative cursor-pointer p-2"
                @click="toggleEditPowderDropdown(index)">
                {{ row.powderCode || 'Select a Powder Code Option' }}
            </div>

            <!-- Dropdown -->
            <div v-if="isEditPowderDropdownOpen[index]"
                class="absolute left-0 top-full w-full bg-white dark:bg-gray-800 shadow-md z-10">
                <!-- Searchable input -->
                <input type="text" v-model="editPowderSearchQueries[index]"
                    placeholder="Search Powder Code"
                    class="border-b border-gray-300 dark:border-gray-700 p-2 w-full dark:bg-gray-800 dark:text-gray-300" />
                <!-- Filtered options -->
                <ul class="max-h-40 overflow-y-auto dark:bg-gray-800">
                    <li v-for="powderCode in filteredEditPowderCodes(editPowderSearchQueries[index])"
                        :key="powderCode"
                        @click="selectEditPowderCode(powderCode, index)"
                        class="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-gray-100 dark:text-gray-300">
                        {{ powderCode }}
                    </li>
                    <li v-if="filteredEditPowderCodes(editPowderSearchQueries[index]).length === 0"
                        class="p-2 text-gray-500 dark:text-gray-400">
                        No results found
                    </li>
                </ul>
            </div>
        </div>
        <span v-if="formSubmitted && !row.powderCode"
            class="text-red-500 dark:text-red-400">Powder Code is required!</span>
    </div>
</td>



                                        <td class="py-2 px-2 border-b">
                                            <FormInput v-model="row.discrepencyWeight" id="discrepencyWeight"
                                                name="text" placeholder="Discrepency Weight">
                                            </FormInput>
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
                    View Vendor Master
                </h2>
            </Dialog.Title>
            <Dialog.Description class="max-h-[70vh] overflow-y-auto">
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <div class="lg:flex lg:flex-row">
                        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <tbody class="w-[100%]">
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th scope="row"
                                        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                                        Name
                                    </th>
                                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                                        {{ viewData.name }}
                                    </td>
                                </tr>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th scope="row"
                                        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                                        Code
                                    </th>
                                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                                        {{ viewData.code }}
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
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.powderList.length > 0">
  <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
    <tbody class="w-[100%]">
      <tr class="border-b border-gray-200 dark:border-gray-700">
        <th scope="col" colspan="4"
          class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
          Powder List
        </th>
      </tr>
      <tr>
        <th class="px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          No.
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Powder Code
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Discrepency Weight
        </th>
        <th class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
          Action
        </th>
      </tr>
      <tr v-for="(row, index) in viewData.powderList" :key="index" class="hover:bg-gray-100">
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ index + 1 }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.powderCode || 'N/A' }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          {{ row.discrepencyWeight || 'N/A' }}
        </td>
        <td class="py-3 px-auto text-center text-gray-700 dark:text-white">
          <button type="button" @click="deleteAddRow(index)" class="text-red-600 hover:text-red-800 text-lg">
            <i class="fa-solid fa-trash-can"></i>
          </button>
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
<style></style>