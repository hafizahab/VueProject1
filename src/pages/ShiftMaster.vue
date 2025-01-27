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
    name?: string;
    remarks?: string;
    status?: string;
}

interface UserAccess {
    userId: string;
    shiftMaster: string[];
}


let cachedUserAccess: UserAccess[] | null = null; // Use null initially to indicate no data is cached



function getUserAccessData(): Promise<UserAccess[]> {
    return new Promise((resolve, reject) => {
        if (cachedUserAccess) {
            resolve(cachedUserAccess);
        } else {
            loading.value = true; // Show the loading modal
            fetch('http://10.87.0.33:8082/api/UserAccessManagement')
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    // Ensure the data structure matches expectations
                    if (data && Array.isArray(data.result)) {
                        cachedUserAccess = data.result as UserAccess[]; // Explicitly cast data.result
                        resolve(cachedUserAccess);
                    } else {
                        throw new Error("Unexpected response format");
                    }
                })
                .catch(error => reject(error))
                .finally(() => {
                    loading.value = false; // Hide the loading modal
                });
        }
    });
}

const tableRef = ref<HTMLDivElement>();
const tableRefDelete = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
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
      responsiveLayoutCollapseStartOpen: true,
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
                //         {
                //     title: "NO.",
                //     maxWidth: 100,
                //     responsive: 0,
                //     field: "index",
                //     vertAlign: "middle",
                //     print: true,
                //     download: true,
                //     formatter(cell) {
                //         const position = cell.getRow().getPosition();
                //         const index = typeof position === 'number' ? position : 'N/A';
                //         return `<div>
                //             <div class="font-medium whitespace-nowrap">${index}</div>
                //         </div>`;
                //     }
                // },
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
                    minWidth: 180,
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
                    title: "STATUS",
                    maxWidth: 180,
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
    responsive: 3,
    hozAlign: "center",
    headerHozAlign: "center",
    vertAlign: "middle",
    print: false,
    download: false,
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

        // Placeholder for initial rendering
        container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

        getUserAccessData()
            .then((userAccessData) => {
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";

                if (userAccess) {
                    // Conditionally render "Edit" link
                    if (userAccess.shiftMaster && userAccess.shiftMaster.includes("Edit")) {
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
                    if (userAccess.shiftMaster && userAccess.shiftMaster.includes("Delete")) {
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

                // Force row height normalization
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
                //         {
                //     title: "NO.",
                //     maxWidth: 100,
                //     responsive: 0,
                //     field: "index",
                //     vertAlign: "middle",
                //     print: true,
                //     download: true,
                //     formatter(cell) {
                //         const position = cell.getRow().getPosition();
                //         const index = typeof position === 'number' ? position : 'N/A';
                //         return `<div>
                //             <div class="font-medium whitespace-nowrap">${index}</div>
                //         </div>`;
                //     }
                // },
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
                    title: "STATUS",
                    maxWidth: 180,
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

const loading = ref<boolean>(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/ShiftMaster/';

onMounted(() => {
    loading.value = true; // Show loading modal at the start

    axios.get(API_BASE_URL)
        .then(response => {
            const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
            console.log('Filtered Data:', filteredData);

            if (tabulator.value) {
                tabulator.value.setData(filteredData);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            loading.value = false; // Hide loading modal after data is processed
        });

    initTabulator();
    reInitOnResizeWindow();
    fetchItems();
});

const API_BASE_URL_DELETE = 'http://10.87.0.33:8082/api/ShiftMaster/GetShiftMasterDeletedList/';
const API_BASE_URL_UPDATE = 'http://10.87.0.33:8082/api/ShiftMaster/UpdateShiftMasterActive';
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


// Form Data
const editFormData = reactive({
    id: null,
    name: "",
    remarks: "",
    startTime: "",
    endTime: "",
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    status: ""
});


const viewData = reactive({
    id: '',
    name: '',
    remarks: '',
    startTime: "",
    endTime: "",
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    status: '',
});


const addFormData = reactive({
    id: '',
    name: '',
    remarks: '',
    startTime: "",
    endTime: "",
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    status: 'Active'
});

// Define reactive permission variables for shiftMaster
const canEditShiftMaster = ref(false);
const canDeleteShiftMaster = ref(false);
const canCreateShiftMaster = ref(false);

// Define the fetchUserShiftPermissions function
const fetchUserShiftPermissions = async () => {
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

            const shiftMaster = userDetails.shiftMaster || ''; // Ensure the value is a string

            // Check if the string contains "Create", "Delete", and "Edit" for shiftMaster
            canCreateShiftMaster.value = shiftMaster.includes('Create');
            canDeleteShiftMaster.value = shiftMaster.includes('Delete');
            canEditShiftMaster.value = shiftMaster.includes('Edit');

            console.log('canCreateShiftMaster:', canCreateShiftMaster.value); // Debugging log
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


onMounted(async () => {
    await fetchUserShiftPermissions();
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
                        title: 'Data Undelete Successfully',
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
    console.log(`Fetching data for ID: ${id}`); // Log the ID being fetched

    loading.value = true; // Show loading animation

    axios.get(`${API_BASE_URL}${id}`)
        .then(response => {
            const data = response.data.result;
            console.log('Fetched Data:', data); // Log the fetched data for debugging

            if (data && data.length > 0) {
                const [firstItem] = data;
                Object.assign(formData, {
                    id: firstItem.id,
                    name: firstItem.name,
                    remarks: firstItem.remarks,
                    startTime: firstItem.startTime,
                    endTime: firstItem.endTime,
                    monday: !!firstItem.monday,
                    tuesday: !!firstItem.tuesday,
                    wednesday: !!firstItem.wednesday,
                    thursday: !!firstItem.thursday,
                    friday: !!firstItem.friday,
                    saturday: !!firstItem.saturday,
                    sunday: !!firstItem.sunday,
                    status: firstItem.status
                });

                modalSetter(true); // Open the modal after setting the data
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
            const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
            console.log('Filtered Data:', filteredData);

            if (tabulator.value) {
                tabulator.value.setData(filteredData);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            loading.value = false; // Hide loading modal after data is processed
        });

    initTabulator();
    reInitOnResizeWindow();
    fetchItems();
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
    if (!editFormData.name || !editFormData.status) {
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
        const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
        items.value = filteredData;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};


// Add Role
const addRole = () => {
    formSubmitted.value = true;

    // Ensure all day fields are boolean values, defaulting to false if not selected
    const preparedFormData = {
        ...addFormData,
        monday: !!addFormData.monday,
        tuesday: !!addFormData.tuesday,
        wednesday: !!addFormData.wednesday,
        thursday: !!addFormData.thursday,
        friday: !!addFormData.friday,
        saturday: !!addFormData.saturday,
        sunday: !!addFormData.sunday,
    };

    if (formSubmitted.value && (!preparedFormData.name || !preparedFormData.status)) {
        Swal.fire({
            icon: 'error',
            title: 'Please complete the required fields',
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
        // Proceed with the API call to add the role
        axios.post(API_BASE_URL, preparedFormData)
            .then(response => {
                if (response.data.message === `Unable to complete request. Shift data with Name ${addFormData.name} already exists`) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Duplicate Name',
                        html: `<b>${addFormData.name}</b> already exists, please try another name`,
                        confirmButtonText: 'Try Again',
                        confirmButtonColor: '#d33',
                    });
                } else {
                    // Show confirmation dialog if no duplicate
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
                            axios.post(API_BASE_URL, preparedFormData)
                                .then(response => {
                                    console.log('Successfully submitted data:', response.data);
                                    setAddSlideover(false);
                                    resetFormData(addFormData);
                                    updateTableData();
                                    updateTableDataDelete();
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


function formatTime(time: any) {
    if (!time) return 'N/A'; // Handle cases where the time is not available

    // Split the time string into hours and minutes
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);

    // Determine AM or PM
    const ampm = hours >= 12 ? 'PM' : 'AM';

    // Convert hours to 12-hour format
    hours = hours % 12 || 12; // Convert '0' hour to '12'

    // Return formatted time
    return `${hours}:${minutes} ${ampm}`;
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
        <h2 class="mr-auto text-lg font-medium">Shift Master</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreateShiftMaster">
            <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
                Add Shift Master
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
        <h2 class="mr-auto text-lg font-medium">Shift Master - Deleted List</h2>

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
                    Add Shift Master
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
                        <FormLabel htmlFor="time-input-1">Start Time</FormLabel>
                        <FormInput type="time" v-model="addFormData.startTime" id="time-input-1" name="time" step="1"
                            placeholder="Select time">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="time-input-1">End Time</FormLabel>
                        <FormInput type="time" v-model="addFormData.endTime" id="time-input-1" name="time" step="1"
                            placeholder="Select time">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <label>Days of a Week</label>
                        <div class="flex flex-col mt-2 sm:flex-row">
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="sunday" type="checkbox" value="" v-model="addFormData.sunday" />
                                <FormCheck.Label htmlFor="sunday">
                                    S
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="monday" type="checkbox" value="" v-model="addFormData.monday" />
                                <FormCheck.Label htmlFor="monday">
                                    M
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="tuesday" type="checkbox" value="" v-model="addFormData.tuesday" />
                                <FormCheck.Label htmlFor="tuesday">
                                    T
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="wednesday" type="checkbox" value=""
                                    v-model="addFormData.wednesday" />
                                <FormCheck.Label htmlFor="wednesday">
                                    W
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="thursday" type="checkbox" value=""
                                    v-model="addFormData.thursday" />
                                <FormCheck.Label htmlFor="thursday">
                                    T
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="friday" type="checkbox" value="" v-model="addFormData.friday" />
                                <FormCheck.Label htmlFor="friday">
                                    F
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="saturday" type="checkbox" value=""
                                    v-model="addFormData.saturday" />
                                <FormCheck.Label htmlFor="saturday">
                                    S
                                </FormCheck.Label>
                            </FormCheck>
                        </div>
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
                    Edit Shift Master
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
                        <FormLabel htmlFor="time-input-1">Start Time</FormLabel>
                        <FormInput type="time" v-model="editFormData.startTime" id="time-input-1" name="time" step="1"
                            placeholder="Select time">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="time-input-1">End Time</FormLabel>
                        <FormInput type="time" v-model="editFormData.endTime" id="time-input-1" name="time" step="1"
                            placeholder="Select time">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <label>Days of a Week</label>
                        <div class="flex flex-col mt-2 sm:flex-row">
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="sunday" type="checkbox" value="" v-model="editFormData.sunday" />
                                <FormCheck.Label htmlFor="sunday">
                                    S
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="monday" type="checkbox" value="" v-model="editFormData.monday" />
                                <FormCheck.Label htmlFor="monday">
                                    M
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="tuesday" type="checkbox" value="" v-model="editFormData.tuesday" />
                                <FormCheck.Label htmlFor="tuesday">
                                    T
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="wednesday" type="checkbox" value=""
                                    v-model="editFormData.wednesday" />
                                <FormCheck.Label htmlFor="wednesday">
                                    W
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="thursday" type="checkbox" value=""
                                    v-model="editFormData.thursday" />
                                <FormCheck.Label htmlFor="thursday">
                                    T
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="friday" type="checkbox" value="" v-model="editFormData.friday" />
                                <FormCheck.Label htmlFor="friday">
                                    F
                                </FormCheck.Label>
                            </FormCheck>
                            <FormCheck class="mr-2">
                                <FormCheck.Input id="saturday" type="checkbox" value=""
                                    v-model="editFormData.saturday" />
                                <FormCheck.Label htmlFor="saturday">
                                    S
                                </FormCheck.Label>
                            </FormCheck>
                        </div>
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
                    View Shift Master
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
                                        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                        Start Time
                                    </th>
                                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                                        {{ formatTime(viewData.startTime) }}
                                    </td>
                                </tr>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th scope="row"
                                        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                        End Time
                                    </th>
                                    <td class="w-[70%] px-auto text-center text-gray-700 dark:text-white">
                                        {{ formatTime(viewData.endTime) }}
                                    </td>
                                </tr>
                                <tr class="border-b border-gray-200 dark:border-gray-700">
    <th scope="row"
        class="w-[30%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
        Days of a week
    </th>
    <td class="w-[70%] px-5 py-5 text-center text-gray-700 dark:text-white">
        <div class="flex flex-col sm:flex-row justify-center">
            <span class="mr-2" :class="{'text-green-500': viewData.sunday, 'text-red-500': !viewData.sunday}">
                S
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.monday, 'text-red-500': !viewData.monday}">
                M
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.tuesday, 'text-red-500': !viewData.tuesday}">
                T
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.wednesday, 'text-red-500': !viewData.wednesday}">
                W
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.thursday, 'text-red-500': !viewData.thursday}">
                T
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.friday, 'text-red-500': !viewData.friday}">
                F
            </span>
            <span class="mr-2" :class="{'text-green-500': viewData.saturday, 'text-red-500': !viewData.saturday}">
                S
            </span>
        </div>
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
