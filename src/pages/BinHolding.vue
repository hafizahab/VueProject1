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


function replaceNullWithEmptyString(obj: any) {
    for (let key in obj) {
        if (obj[key] === null) {
            obj[key] = "";
        }
    }
    return obj;
}


interface Response {
    id?: string;
    mappingId?: string;
    binMasterId?: string;
    type?: string;
    weight?: string;
    productCode?: string;
    movement?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
    field: "mappingId",
    type: "like",
    value: "",
    mappingId: "",
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
                    minWidth: 120,
                    responsive: 0,
                    field: "mappingId",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: true,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.mappingId}</div>
              </div>`;
                    },
                },
                {
                    title: "BIN NAME",
                    minWidth: 150,
                    responsive: 0,
                    field: "binMasterId",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response = cell.getData();
                        const binMasterId = response.binMasterId;

                        // Get the bin name from the binMasterMap using the binMasterId
                        const binName = binMasterMap.get(binMasterId) || 'Unknown'; // Fallback to 'Unknown' if not found

                        return `<div>
              <div class="font-medium whitespace-nowrap">${binName}</div>
            </div>`;
                    },
                },


                {
                    title: "PART NUMBER",
                    minWidth: 150,
                    responsive: 0,
                    field: "productCode",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response = cell.getData();
                        const productCode = response.productCode ? response.productCode : 'N/A';
                        return `<div>
                  <div class="font-medium whitespace-nowrap">${productCode}</div>
                </div>`;
                    },
                },

                {
                    title: "TYPE",
                    minWidth: 150,
                    responsive: 0,
                    field: "type",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.type}</div>
              </div>`;
                    },
                },
                {
                    title: "WEIGHT",
                    minWidth: 150,
                    responsive: 0,
                    field: "weight",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.weight}</div>
              </div>`;
                    },
                },
                {
                    title: "MOVEMENT",
                    minWidth: 150,
                    responsive: 0,
                    field: "movement",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.movement}</div>
              </div>`;
                    },
                },

                {
                    title: "ACTIONS",
                    minWidth: 200,
                    field: "actions",
                    responsive: 0,
                    hozAlign: "center",
                    headerHozAlign: "center",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const container = document.createElement("div");
                        container.classList.add("flex", "items-center", "lg:justify-center", "flex-col");

                        const response = cell.getData();

                        // Check if the user has Edit permission for binHolding
                        if (canEditBinHolding) {  // Assuming you have defined canEditBinHolding elsewhere based on user's binHolding permissions
                            // "Release" Button
                            const releaseButton = document.createElement("button");
                            releaseButton.classList.add("flex", "items-center", "mr-3", "text-blue-700", "dark:text-blue-400", "font-normal", "rounded");

                            // Create the icon for "Release" similar to the "View" icon
                            const releaseIcon = document.createElement("i");
                            releaseIcon.classList.add("fa-solid", "fa-right-to-bracket", "pr-2"); // Use appropriate icon classes

                            releaseButton.appendChild(releaseIcon);
                            releaseButton.appendChild(document.createTextNode("Release"));

                            releaseButton.addEventListener("click", async (event) => {
                                event.preventDefault();

                                // Show confirmation alert
                                Swal.fire({
                                    title: 'Are you sure?',
                                    text: 'This will update the bin!',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#1e40af',
                                    cancelButtonColor: '#d33',
                                    confirmButtonText: 'Yes, release it!',
                                }).then(async (result) => {
                                    if (result.isConfirmed) {
                                        try {
                                            // Step 1: Fetch the ListBin details using the GET API
                                            let getResponse = await axios.get(`${API_BASE_URL}${response.id}`);
                                            let listBinData = getResponse.data.result;

                                            // Ensure that you are working with a single object (not an array)
                                            if (Array.isArray(listBinData)) {
                                                listBinData = listBinData[0];  // Extract the first object from the array
                                            }

                                            // Step 2: Modify the weight field to 0
                                            listBinData.weight = 0;

                                            // Step 3: Replace null values with empty strings
                                            listBinData = replaceNullWithEmptyString(listBinData);

                                            // Log the payload in JSON format before updating the data
                                            console.log("Payload to be sent:", JSON.stringify(listBinData, null, 2));

                                            // Step 4: Send the updated data using the PUT API
                                            await axios.put(`${API_BASE_URL}${response.id}`, listBinData);

                                            // Step 5: Show success alert
                                            Swal.fire({
                                                icon: 'success',
                                                title: 'Bin Released Successfully',
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

                                            updateTableData();

                                        } catch (error) {
                                            console.error("Error releasing bin:", error);
                                            Swal.fire({
                                                icon: 'error',
                                                title: 'Failed!',
                                                text: 'There was an error releasing the bin.',
                                                confirmButtonColor: '#d33',
                                            });
                                        }
                                    }
                                });
                            });

                            container.appendChild(releaseButton);
                        }

                        return container;
                    },
                },



                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>GR Number</span>",
                    field: "grnumber",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.grnumber}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Part Number</span>",
                    field: "productcode",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.productcode}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Resource Code</span>",
                    field: "resourcecode",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.resourcecode}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Shift</span>",
                    field: "shift",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.shift}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Vendor Name</span>",
                    field: "vendorname",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.vendorname}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Vendor Code</span>",
                    field: "vendorcode",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.vendorcode}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>PO Number</span>",
                    field: "ponumber",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.ponumber}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Lot Number</span>",
                    field: "lotnumber",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.lotnumber}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Nett</span>",
                    field: "nett",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.nett}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Gross</span>",
                    field: "gross",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.gross}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>UOM</span>",
                    field: "uom",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${response.uom}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Location</span>",
                    field: "location",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell) {
                        const response = cell.getData();
                        // Check if location is null or undefined
                        const location = response.location ? response.location : 'N/A';
                        return `<div class="text-xs font-medium whitespace-nowrap text-center">${location}</div>`;
                    },
                },
                {
                    title: "<span class='text-xs font-bold whitespace-nowrap text-center'>Status</span>",
                    field: "status",
                    visible: false,
                    print: true,
                    download: true,
                    formatter(cell, formatterParams, onRendered) {
                        let status = cell.getValue();
                        let textColor;

                        if (!status) {
                            status = 'N/A';
                            textColor = 'text-gray-600';
                        } else {
                            switch (status) {
                                case 'Pending QC':
                                    textColor = 'text-yellow-600';
                                    break;
                                case 'Completed':
                                    textColor = 'text-green-600';
                                    break;
                                case 'Draft':
                                    textColor = 'text-orange-600';
                                    break;
                                case 'QC Rejected':
                                    textColor = 'text-red-600';
                                    break;
                                default:
                                    textColor = 'text-black';
                            }
                        }

                        return `<span class="text-xs font-medium whitespace-nowrap text-center ${textColor}">${status}</span>`;
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
const onFilter = () => {
    if (tabulator.value) {
        if (filter.field === 'binName') {
            // Convert filter.value to match binMasterId based on bin name
            const filteredBinMasterIds = [...binMasterMap.entries()]
                .filter(([id, name]) => name.toLowerCase().includes(filter.value.toLowerCase()))
                .map(([id]) => id);

            // Apply the filter to the table based on binMasterId
            tabulator.value.setFilter((data) => filteredBinMasterIds.includes(data.binMasterId));
        } else {
            // Apply filter for type, weight, and movement fields directly
            tabulator.value.setFilter(filter.field, "like", filter.value);
        }
    }
};


// On reset filter
const onResetFilter = () => {
    setFilter({
        ...filter,
        field: "mappingId",
        type: "like",
        value: "",
    });
    onFilter();
};


// Print
const onPrint = () => {
    if (tabulator.value) {
        tabulator.value.print();
    }
};

const loading = ref(false); // Loading state for modal control

// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/ListBins/';
const API_BASE_URL_BIN_MASTER = 'http://10.87.0.33:8082/api/BinMaster';

let binMasterMap = new Map(); // This will store the id -> name mapping from BinMaster API

onMounted(() => {
    loading.value = true; // Show loading animation at the start

    // Fetch both BinMaster and ListBins data together
    Promise.all([
        axios.get(API_BASE_URL_BIN_MASTER),
        axios.get(API_BASE_URL)
    ])
        .then(([binMasterResponse, listBinsResponse]) => {
            // Populate binMasterMap
            binMasterResponse.data.result.forEach((bin: any) => {
                binMasterMap.set(bin.id, bin.name); // Mapping binMasterId to name
            });

            // Filter the ListBins data
            const filteredData = listBinsResponse.data.result.filter((item: any) => item.status !== 'Draft' && item.weight > 0);

            // Once data is received, populate the table
            if (tabulator.value) {
                tabulator.value.setData(filteredData);
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



// Define the permission variable for binHolding Edit permission
let canEditBinHolding = false;

// Fetch user permissions for binHolding
const fetchUserBinHoldingPermissions = async () => {
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
        // Fetch user details from the UserAccessManagement API
        const userAccessResponse = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
        const userDetails = userAccessResponse.data.result.find((user: any) => user.userId === userId);

        if (userDetails) {
            const binHolding = userDetails.binHolding || ''; // Ensure the value is a string

            // Check if the string contains "Edit" for binHolding
            canEditBinHolding = binHolding.includes('Delete');

            console.log('canEditBinHolding:', canEditBinHolding); // Debugging log
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

// Call the fetchUserBinHoldingPermissions function to get permissions
fetchUserBinHoldingPermissions();

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

                formData.id = firstItem.id;
                formData.jobId = firstItem.jobId;
                formData.whPowderDetailsList = firstItem.whPowderDetailsList || [];




                modalSetter(true);
            } else {
                console.error('No data found for the specified ID:', id);
            }
        })
        .catch(error => handleError(error, 'Error fetching data for editing'));
};


const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
    loading.value = true; // Show loading animation at the start

// Fetch both BinMaster and ListBins data together
Promise.all([
    axios.get(API_BASE_URL_BIN_MASTER),
    axios.get(API_BASE_URL)
])
.then(([binMasterResponse, listBinsResponse]) => {
    // Populate binMasterMap
    binMasterResponse.data.result.forEach((bin: any) => {
        binMasterMap.set(bin.id, bin.name); // Mapping binMasterId to name
    });

    // Filter the ListBins data
    const filteredData = listBinsResponse.data.result.filter((item: any) => item.status !== 'Draft' && item.weight > 0);

    // Once data is received, populate the table
    if (tabulator.value) {
        tabulator.value.setData(filteredData);
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

    const payload = {
        jobId: String(viewData.jobId),
        whpowderList: viewData.whPowderDetailsList.map(powder => ({
            jobId: viewData.jobId,  // Ensure jobId is correct
            powderCode: powder.powderCode,
            requestedWeight: powder.requestedWeight,
            approvedWeight: powder.approvedWeight,  // The modified weight from the input field
            isApproved: true,
            isReceived: false,
        })),
    };

    console.log('Payload prepared:', payload);

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

            // API call to update the data
            axios.put(`${API_BASE_URL}${viewData.id}`, payload)
                .then(response => {
                    console.log('Bin Holding updated:', response.data);

                    // Show success notification
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: 'Bin Holding updated successfully!',
                        toast: true,
                        position: 'top-right',
                        showConfirmButton: false,
                        timer: 3000,
                    });
                })
                .catch(error => {
                    console.error('Error updating Bin Holding:', error);

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
            <title>Bin Holding</title>
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
  </div
    <!-- Loading Modal Overlay -->
    <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div class="flex flex-col items-center">
            <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
            <p class="mt-2 text-white text-center text-lg">Loading...</p>
        </div>
    </div>
    <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Bin Holding</h2>
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
                        <option value="mappingId">Job ID</option>
                        <option value="binName">Bin Name</option>
                        <option value="productCode">Part Number</option>
                        <option value="type">Type</option>
                        <option value="movement">Movement</option>
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
                    View Bin Holding
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
                                    <FormInput v-model="powder.approvedWeight" type="number"
                                        class="form-input w-full border rounded" placeholder="Enter Approved Weight"
                                        :class="{ 'border-red-500': ((formSubmitted && !powder.approvedWeight) || powder.approvedWeight.toString().split('.')[1]?.length > 4) }"
                                        :disabled="powder.isApproved" />

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
                                </td>

                                <td class="title py-3 px-3 text-center">
                                    <span
                                        :class="powder.isApproved ? 'inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20' : 'inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20'">
                                        {{ powder.isApproved ? 'Approved' : 'Pending' }}
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