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
import LoadingIcon from "../base-components/LoadingIcon";

interface UserAccess {
    userId: string;
    warehouseRequest?: string[];
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

interface Response {
    id?: string;
    jobId?: string;
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
            // Add a title at the top of the print view
            printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Warehouse Request
                </h1>
            `,
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
                    title: "JOB ID",
                    minWidth: 150,
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
                    title: "STATUS",
                    minWidth: 150,
                    field: "status",
                    responsive: 0,
                    //   hozAlign: "center",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response = cell.getData();

                        const allApproved = response.whPowderDetailsList.every((item: any) => item.isApproved);

                        let status = allApproved ? 'Completed' : 'Pending';

                        let statusClass = '';
                        switch (status) {
                            case 'Completed':
                                statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
                                break;
                            case 'Pending':
                                statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:text-yellow-500';
                                break;
                            default:
                                statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
                        }

                        return `<div class="flex items-center lg:justify-center ${statusClass} text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:${status === 'submitted' ? 'text-green-400' : 'text-yellow-400'} border">
      ${status}
    </div>`;
                    },
                },

                {
                    title: "ACTIONS",
                    minWidth: 300,
                    maxWidth: 350,
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
                                    // Conditionally render "View & Edit" link based on Edit permission
                                    if (userAccess.warehouseRequest && userAccess.warehouseRequest.includes("Edit")) {
                                        const viewEditLink = document.createElement("a");
                                        viewEditLink.classList.add(
                                            "flex",
                                            "items-center",
                                            "text-primary",
                                            "text-sm"
                                        );
                                        viewEditLink.href = "#";
                                        viewEditLink.addEventListener("click", (event) => {
                                            event.preventDefault();
                                            viewRole(response.id); // Change to productcode
                                        });
                                        viewEditLink.innerHTML = `<i class="fa-solid fa-file-pen mr-1"></i>View & Edit`;
                                        container.appendChild(viewEditLink);
                                    }
                                }

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




                {
                    title: "<span class='text-xs font-bold text-center block'>Job ID</span>",
                    field: "jobId",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium text-center block break-words">${response.jobId}</div>`;
                    },
                },

                {
                    title: "<span class='text-xs font-bold text-center block'>Status</span>",
                    field: "status",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell, formatterParams, onRendered) {
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
                                case 'Pending':
                                    textColor = 'text-yellow-600';
                                    break;
                                case 'QC Rejected':
                                    textColor = 'text-red-600';
                                    break;
                                default:
                                    textColor = 'text-black'; // Default text color
                            }
                        }

                        return `<span class="text-xs font-medium text-center block ${textColor} break-words">${status}</span>`;
                    },
                }

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
const onFilter = () => {
    if (tabulator.value) {
        tabulator.value.setFilter((data) => {
            // Check if date is valid before parsing
            if (!data.date) {
                console.error("Date is undefined or null:", data);
                return false;
            }

            // Parse the date from the API data
            const dateValue = new Date(data.date);

            // Validate the dateValue
            if (isNaN(dateValue.getTime())) {
                console.error("Invalid Date:", data.date);
                return false; // Exclude entries with invalid dates
            }

            // Get start and end dates from the filters
            const startDate = filter.startDate ? new Date(filter.startDate) : null;
            const endDate = filter.endDate ? new Date(filter.endDate) : null;

            // Validate start and end dates
            if (startDate && isNaN(startDate.getTime())) {
                console.error("Invalid Start Date:", filter.startDate);
                return false;
            }
            if (endDate && isNaN(endDate.getTime())) {
                console.error("Invalid End Date:", filter.endDate);
                return false;
            }

            // Function to format a date to YYYY-MM-DD
            const formatDateToUTC = (date: Date) => {
                if (!date) return null;
                // Adjust the date to UTC and format it to YYYY-MM-DD
                const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                return utcDate.toISOString().split('T')[0];
            };

            // Format the date components to strings
            const formattedDateValue = formatDateToUTC(dateValue);
            const formattedStartDate = startDate ? formatDateToUTC(startDate) : null;
            const formattedEndDate = endDate ? formatDateToUTC(endDate) : null;

            // Debugging logs for formatted dates
            console.log(`Data Date: ${formattedDateValue}, Start Date: ${formattedStartDate}, End Date: ${formattedEndDate}`);

            // Filter logic
            if (formattedDateValue && formattedStartDate && !formattedEndDate) {
                // Only start date is specified
                return formattedDateValue === formattedStartDate;
            } else if (formattedDateValue && formattedStartDate && formattedEndDate) {
                // Both start and end dates are specified
                return formattedDateValue >= formattedStartDate && formattedDateValue <= formattedEndDate;
            } else if (formattedDateValue && !formattedStartDate && formattedEndDate) {
                // Only end date is specified, match date equals end date
                return formattedDateValue === formattedEndDate;
            } else {
                // Neither start nor end date is specified, include all data
                return true;
            }
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
        // Clear all filters first
        tabulator.value.clearFilter(true);

        // Apply filters based on the current state of the filter object
        if (filter.status) {
            // Show only "Completed" items if explicitly filtered by "Completed"
            if (filter.status === "Completed") {
                tabulator.value.setFilter("status", '=', filter.status);
            } else {
                // Otherwise, apply the filter for the selected status
                tabulator.value.setFilter("status", 'like', filter.status);
            }
        } else {
            // If no specific status is selected, return to the default filter view
            tabulator.value.setFilter((item) => item.status !== 'Completed');
        }

        if (filter.value) {
            tabulator.value.setFilter("value", 'like', filter.value);
        }
        // Add other filters as needed
    }
};

// On reset filter
const onResetFilter = () => {
    Object.assign(filter, {
        value: "",
        jobId: "",
        status: "",
    });

    // Reset to default view
    if (tabulator.value) {
        tabulator.value.clearFilter(true);
        tabulator.value.setFilter((item) => item.status !== 'Completed');
    }
};

// Print
const onPrint = () => {
    if (tabulator.value) {
        tabulator.value.print();
    }
};

const loading = ref(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/WarehouseRequest/';

onMounted(() => {
    loading.value = true; // Show loading modal at the start

    // Define an array of promises to fetch all necessary data
    const fetchPromises = [
        axios.get(API_BASE_URL).then(response => {
            const filteredData = response.data.result.filter((item: any) => item.status !== 'Draft');

            // Add status field based on whPowderDetailsList
            filteredData.forEach((item: any) => {
                const allApproved = item.whPowderDetailsList.every((powder: any) => powder.isApproved);
                item.status = allApproved ? 'Completed' : 'Pending';
            });

            // Sort the data based on the numeric part of the jobId (e.g., J001, J002)
            filteredData.sort((a: any, b: any) => {
                const numA = parseInt(a.jobId.replace('J', ''), 10);
                const numB = parseInt(b.jobId.replace('J', ''), 10);
                return numA - numB;
            });

            console.log('Filtered and Sorted Data:', filteredData);

            if (tabulator.value) {
                tabulator.value.setData(filteredData);
                tabulator.value.setFilter((item) => item.status !== 'Completed');
            }
        }),

        // Additional asynchronous initializations
        fetchWM()
    ];

    // Wait for all promises to complete
    Promise.all(fetchPromises)
        .then(() => {
            console.log("All data and initializations loaded successfully.");
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            loading.value = false; // Hide loading modal once all tasks are completed
        });

    // Initialize other required functions that don't need to be awaited
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

const viewData = reactive({
    id: '',
    jobId: '',
    weightmachine: '',
    isWeightMachineDisabled: false,
    weightmachines: [] as string[],
    whPowderDetailsList: [
        {
            id: '',
            jobId: '',
            powderCode: '',
            requestedWeight: 0,
            approvedWeight: 0,
            isApproved: false,
            isRecieved: false,
        }
    ],
});

// Define permission variables for warehouseRequest
let canEditWarehouseRequest = false;
const canCreateWarehouseRequest = ref(false);

// Define the fetchUserWarehousePermissions function
const fetchUserWarehousePermissions = async () => {
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

            const warehouseRequest = userDetails.warehouseRequest || ''; // Ensure the value is a string

            // Check if the string contains "Create" and "Edit" for warehouseRequest
            canCreateWarehouseRequest.value = warehouseRequest.includes('Create');
            canEditWarehouseRequest = warehouseRequest.includes('Edit');

            console.log('canEditWarehouseRequest:', canEditWarehouseRequest); // Debugging log
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

// Call the fetchUserWarehousePermissions function to get permissions
fetchUserWarehousePermissions();

const fetchWM = () => {
    axios.get('http://10.87.0.33:8082/api/MachineMaster')
        .then(response => {
            const nameData = response.data.result;

            if (Array.isArray(nameData)) {
                const activeNameData = nameData.filter(item =>
                    item.status.toLowerCase() !== 'inactive' &&
                    item.type.toLowerCase() === 'weighing machine' &&
                    item.location.toLowerCase() === 'warehouse'
                );

                const weightMachineNames = activeNameData.map(item => item.name);

                viewData.weightmachines = weightMachineNames;

                if (weightMachineNames.length === 1) {
                    // Only one item found
                    viewData.weightmachine = weightMachineNames[0]; // Set as default value for add form

                    viewData.isWeightMachineDisabled = true;   // Disable the FormSelect for add form
                } else if (weightMachineNames.length > 1) {
                    // More than one item found
                    viewData.weightmachine = weightMachineNames[0]; // Set the first item as default for add form

                    viewData.isWeightMachineDisabled = false;  // Enable the FormSelect for add form
                }


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
const setviewModal = (value: any) => {
    viewModal.value = value; if (!value) {
        // Modal is closed, so run updateTableData()
        updateTableData();
    }
};

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

    axios.get(`${API_BASE_URL}${id}`)
        .then(response => {
            const data = response.data.result;
            if (data && data.length > 0) {
                console.log('Retrieved Data:', data);
                const [firstItem] = data;

                formData.id = firstItem.id;
                formData.jobId = firstItem.jobId;
                formData.whPowderDetailsList = firstItem.whPowderDetailsList || [];

                // Open the modal once data is ready
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


const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
    loading.value = true; // Show loading modal at the start

    // Define an array of promises to fetch all necessary data
    const fetchPromises = [
        axios.get(API_BASE_URL).then(response => {
            const filteredData = response.data.result.filter((item: any) => item.status !== 'Draft');

            // Add status field based on whPowderDetailsList
            filteredData.forEach((item: any) => {
                const allApproved = item.whPowderDetailsList.every((powder: any) => powder.isApproved);
                item.status = allApproved ? 'Completed' : 'Pending';
            });

            // Sort the data based on the numeric part of the jobId (e.g., J001, J002)
            filteredData.sort((a: any, b: any) => {
                const numA = parseInt(a.jobId.replace('J', ''), 10);
                const numB = parseInt(b.jobId.replace('J', ''), 10);
                return numA - numB;
            });

            console.log('Filtered and Sorted Data:', filteredData);

            if (tabulator.value) {
                tabulator.value.setData(filteredData);
                tabulator.value.setFilter((item) => item.status !== 'Completed');
            }
        }),

        // Additional asynchronous initializations
        fetchWM()
    ];

    // Wait for all promises to complete
    Promise.all(fetchPromises)
        .then(() => {
            console.log("All data and initializations loaded successfully.");
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        })
        .finally(() => {
            loading.value = false; // Hide loading modal once all tasks are completed
        });

    // Initialize other required functions that don't need to be awaited
    initTabulator();
    reInitOnResizeWindow();

};

interface Payload {
    grnumber: string;
    productcode: string;
    date: string;
    resourcecode: string;
    shift: string;
    vendorname: string;
    vendorcode: string;
    ponumber: string;
    lotnumber: string;
    nett: number;
    gross: number;
    uom: string;
    qcrequired: boolean;
    qualityCheckList: {
        jobId: string;
        resourceCode: string;
        shift: string;
        qcPassed: string;
    }[];
}


// Update Role
const updateRole = () => {
    console.log('updateRole function called');

    // Validate that approvedWeight is not empty and doesn't have more than 4 decimal places
    let invalidWeight = false;
    let emptyWeight = false;

    viewData.whPowderDetailsList.forEach(powder => {
        const decimalPlaces = powder.approvedWeight?.toString().split('.')[1]?.length || 0;
        if (decimalPlaces > 4) {
            invalidWeight = true;
        }
        if (!powder.approvedWeight) {
            emptyWeight = true;
        }
    });

    // If any approvedWeight has more than 4 decimal places, show a SweetAlert error
    if (invalidWeight) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Approved Weight cannot have more than 4 decimal places!',
            confirmButtonColor: '#1e40af',
        });
        return; // Stop the function execution
    }

    // If any approvedWeight is missing, show a SweetAlert error
    if (emptyWeight) {
        Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: 'Approved Weight is required for all items!',
            confirmButtonColor: '#1e40af',
        });
        return; // Stop the function execution
    }

    formSubmitted.value = true;

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
            console.log('User confirmed the action');

            // Automatically set isApproved to true for all powders
            viewData.whPowderDetailsList.forEach(powder => {
                powder.isApproved = true;  // Automatically set isApproved to true
            });

            const payload = {
                jobId: String(viewData.jobId),
                whpowderList: viewData.whPowderDetailsList.map(powder => ({
                    jobId: viewData.jobId,  // Ensure jobId is correct
                    powderCode: powder.powderCode,
                    requestedWeight: powder.requestedWeight,
                    approvedWeight: powder.approvedWeight,  // The modified weight from the input field
                    isApproved: powder.isApproved,  // This is now set to true
                    isRecieved: powder.isRecieved,
                })),
            };

            // Log the payload to the console in JSON format before submitting
            console.log('Payload to be submitted:', JSON.stringify(payload, null, 2));

            // API call to update the data
            axios.put(`${API_BASE_URL}${viewData.id}`, payload)
                .then(response => {
                    console.log('Warehouse request updated:', response.data);

                    // Show success notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Warehouse request updated successfully!',
                        toast: true,
                        position: 'top-right',
                        showConfirmButton: false,
                        timer: 3000,
                    });
                    fetchWM();
                })

                .catch(error => {
                    console.error('Error updating warehouse request:', error);

                    // Show error notification
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: error.message || 'Something went wrong!',
                        toast: true,
                        position: 'top-right',
                        showConfirmButton: false,
                        timer: 3000,
                    });
                });
        } else {
            console.log('User cancelled the action');
        }
    });
};


const syncPowderWeight = async (powderIndex : number) => {
  try {
    // Fetch weight from the machine based on the selected machine ID
    const response = await fetch(`http://10.87.0.33:8082/api/WarehouseRequest/GetWeightbyMachineId?MachineId=${viewData.weightmachine}`);
    const data = await response.json();

    if (data.result === 'Table does not exist') {
      Swal.fire({
        icon: 'error',
        text: 'Table does not exist',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 5000,
        timerProgressBar: true,
        iconColor: 'red',
        background: '#fff',
      });
    } else if (response.ok) {
      // Parse the weight data
      const weight = parseFloat(data.result);
      if (!isNaN(weight)) {
        // Update the powder's approvedWeight for the specific index
        viewData.whPowderDetailsList[powderIndex].approvedWeight = weight;

        // Show success notification
        Swal.fire({
          icon: 'success',
          title: 'Weight Synced Successfully',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          showCloseButton: true,
          timer: 5000,
          timerProgressBar: true,
          iconColor: 'green',
          background: '#fff',
        });
      }
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to sync weight',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        showCloseButton: true,
        timer: 5000,
        timerProgressBar: true,
        iconColor: 'red',
        background: '#fff',
      });
    }
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'API request failed',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      showCloseButton: true,
      timer: 5000,
      timerProgressBar: true,
      iconColor: 'red',
      background: '#fff',
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
    Object.keys(formData).forEach((key) => {
        if (typeof formData[key] === 'boolean') {
            formData[key] = false;
        } else if (typeof formData[key] === 'number') {
            formData[key] = 0;
        } else {
            formData[key] = '';
        }
    });
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

/// Define the ref
const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
    const el = toPrint.value;
    if (el) {
        const newPrint = window.open("", "_blank");

        if (newPrint) {
            newPrint.document.write(`
        <html>
          <head>
            <title>Warehouse Request</title>
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
    <!-- Loading Modal Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="flex flex-col items-center">
            <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
            <p class="mt-2 text-white text-center text-lg">Loading...</p>
        </div>
    </div>
    <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Warehouse Request</h2>
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
                            <FormInput id="tabulator-html-filter-id" v-model="filter.jobId" type="text"
                                class="mt-2 w-full" placeholder="Search Job ID..." />
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
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
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
                                    <FormInput id="tabulator-html-filter-id" v-model="filter.startDate" type="date"
                                        class="mt-2 w-full" />
                                </div>

                            </div>

                        </div>
                        <div class="flex">
                            <div class="flex-1">
                                <label class="flex-none w-12 xl:w-auto xl:flex-initial">Start Date</label>
                                <div class="relative">
                                    <FormInput id="tabulator-html-filter-id" v-model="filter.endDate" type="date"
                                        class="mt-2 w-full" />
                                </div>

                            </div>

                        </div>
                    </div>

                    <div>

                        <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                            class="w-full top-0 right-0 mt-2" @click="onFilter">
                            Date</Button>
                    </div>
                </div>
            </form>
            <div class="flex mt-5 sm:mt-0">
                <Button id="tabulator-print" variant="outline-secondary" class="w-1/2 mr-2 sm:w-auto"
                    @click="onResetFilter">
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


    <div class="absolute top-0 left-0 w-full h-full" id="printJS-page" ref="toPrint" style="display: none;">
        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        JOB ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                        {{ viewData.jobId }}
                    </td>
                </tr>

            </tbody>
        </table>
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
            v-if="viewData.whPowderDetailsList.length > 0">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">

                    </tr>

                    <tr>
                        <th scope="row"
                            class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                            Powder ID
                        </th>
                        <th scope="row"
                            class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                            Requested Weight
                        </th>
                        <th scope="row"
                            class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800 ">
                            Approved Weight
                        </th>

                    </tr>
                    <tr v-for="(powder, index) in viewData.whPowderDetailsList" :key="index"
                        class="hover:bg-gray-100 dark:hover:bg-gray-100">
                        <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                            {{ powder.powderCode }}
                        </td>
                        <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                            {{ powder.requestedWeight }}
                        </td>
                        <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                            {{ powder.approvedWeight }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>


    </div>

    <!-- BEGIN: Modal Content -->
    <Dialog
:staticBackdrop="true" size="xl" :open="viewModal" @close="() => {
        setviewModal(false);
    }
        ">
        <Dialog.Panel>
            <Dialog.Title>
                <h2 class="w-100 mr-auto text-base font-medium">
                    View Warehouse Request
                </h2>
                <div>
                    <FormLabel htmlFor="regular-form-5">Weight Machine</FormLabel>
                    <FormSelect v-model="viewData.weightmachine" class="sm:mr-2" aria-label="Default select example"
                        :disabled="viewData.isWeightMachineDisabled">
                        <option disabled value="">Select a Weight Machine Option</option>
                        <option v-for="weightMachine in viewData.weightmachines" :key="weightMachine"
                            :value="weightMachine">
                            {{ weightMachine }}
                        </option>
                    </FormSelect>
                </div>
            </Dialog.Title>
            <Dialog.Description class="max-h-[70vh] overflow-y-auto">

                <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <div class="lg:flex lg:flex-row">
                        <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                            <tbody class="w-[100%]">
                                <tr class="border-b border-gray-200 dark:border-gray-700">
                                    <th scope="row"
                                        class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                        JOB ID
                                    </th>
                                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                                        {{ viewData.jobId }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                    v-if="viewData.whPowderDetailsList.length > 0">
                    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <thead>
                            <tr>
                                <th scope="row"
                                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Powder ID</th>
                                <th scope="row"
                                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Requested Weight</th>
                                <th scope="row"
                                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Approved Weight</th>
                                <th scope="row"
                                    class="title text-center px-4 py-4 font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Approved Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(powder, index) in viewData.whPowderDetailsList" :key="index"
                                class="hover:bg-gray-100 dark:hover:bg-gray-100">
                                <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                                    {{ powder.powderCode }}
                                </td>
                                <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                                    {{ powder.requestedWeight }}
                                </td>
                                <!-- ApprovedWeight input field with validation -->
                                <td class="title py-3 px-3 text-gray-700 dark:text-white text-center">
                                    <div class="flex items-center space-x-2">
                                        <!-- ApprovedWeight input field with validation -->
                                        <FormInput v-model="powder.approvedWeight" type="number"
                                            class="form-input w-full border rounded" placeholder="Enter Approved Weight"
                                            :class="{
                                                'border-red-500': ((formSubmitted && !powder.approvedWeight) || powder.approvedWeight.toString().split('.')[1]?.length > 4)
                                            }" :disabled="powder.isApproved" />

                                        <!-- Show error if approvedWeight is not present -->
                                        <span v-if="formSubmitted && !powder.approvedWeight" class="text-red-500">
                                            Approved Weight is required!
                                        </span>

                                        <!-- Show error if approvedWeight has more than 4 decimal places -->
                                        <span
                                            v-if="powder.approvedWeight && powder.approvedWeight.toString().split('.')[1]?.length > 4"
                                            class="text-red-500">
                                            Approved Weight must have at most 4 decimal places!
                                        </span>

                                        <!-- Sync Weight Button -->
                                        <button type="button" @click="syncPowderWeight(index)"
                                            class="bg-blue-500 hover:bg-blue-600 my-2 mx-2 px-2 py-2 text-white rounded">
                                            <i class="fa fa-refresh"></i>
                                        </button>
                                    </div>
                                </td>


                                <td class="title py-3 px-3 text-center">
                                    <span
                                        :class="powder.isApproved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
                                        {{ powder.isApproved ? 'Approved' : 'Pending' }}
                                    </span>
                                </td>
                                <td class="title py-3 px-3 text-center hidden">
                                    <span
                                        :class="powder.isRecieved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
                                        {{ powder.isRecieved ? 'Approved' : 'Pending' }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Button @click="updateRole" variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
                    Submit
                </Button>


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
    padding: 4px 2px;
    /* Reduced horizontal padding */
    text-align: center;
    /* Center align text horizontally */
    vertical-align: middle;
    /* Center align text vertically */
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