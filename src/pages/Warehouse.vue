<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea } from "../base-components/Form";
import { onMounted, ref, reactive, computed } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';

interface Response {
    id?: string;
    grnumber?: string;
    powdercode?: string;
    vendorcode?: string;
    ponumber?: string;
    lotnumber?: string;
    gross?: string;
    uom?: string;
    receivedweight?: string;
    warehouselocation?: string;
    status?: string;
    created_date?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
    field: "name",
    type: "like",
    value: "",
    id: "",
    grnumber: "",
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
                    title: "GR NUMBER",
                    minWidth: 150,
                    responsive: 0,
                    field: "grnumber",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.grnumber}</div>
              </div>`;
                    },
                },
                {
                    title: "POWDER CODE",
                    minWidth: 150,
                    responsive: 0,
                    field: "powdercode",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.powdercode}</div>
              </div>`;
                    },
                },
                {
                    title: "VENDOR CODE",
                    minWidth: 150,
                    responsive: 0,
                    field: "vendorcode",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.vendorcode}</div>
              </div>`;
                    },
                },
                {
                    title: "PO NUMBER",
                    minWidth: 150,
                    responsive: 0,
                    field: "ponumber",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.ponumber}</div>
              </div>`;
                    },
                },
                {
                    title: "LOT NUMBER",
                    minWidth: 200,
                    responsive: 0,
                    field: "lotnumber",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.lotnumber}</div>
              </div>`;
                    },
                },
                {
                    title: "GROSS",
                    minWidth: 150,
                    responsive: 0,
                    field: "gross",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.gross}</div>
              </div>`;
                    },
                },
                {
                    title: "UOM",
                    minWidth: 150,
                    responsive: 0,
                    field: "uom",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.uom}</div>
              </div>`;
                    },
                },
                {
                    title: "WEIGHT",
                    minWidth: 150,
                    responsive: 0,
                    field: "receivedweight",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.receivedweight}</div>
              </div>`;
                    },
                },
                {
                    title: "WAREHOUSE LOCATION",
                    minWidth: 200,
                    responsive: 0,
                    field: "warehouselocation",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.warehouselocation}</div>
              </div>`;
                    },
                },
                {
                    title: "STATUS",
                    minWidth: 100,
                    field: "status",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter: function (cell, formatterParams, onRendered) {
                        const status = cell.getValue();
                        let statusClass = '';
                        let statusText = '';

                        switch (status) {
                            case 'submitted':
                                statusClass = 'bg-green-100 text-green-800 border-green-400';
                                statusText = 'Submitted';
                                break;
                            case 'draft':
                                statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-700';
                                statusText = 'Draft';
                                break;
                            case 'WHApprove':
                                statusClass = 'bg-green-100 text-green-800 border-green-400';
                                statusText = 'WH Approved';
                                break;
                            case 'WHReject':
                                statusClass = 'bg-red-100 text-red-800 border-red-400';
                                statusText = 'WH Reject';
                                break;
                            case 'QCApprove':
                                statusClass = 'bg-green-100 text-green-800 border-green-400';
                                statusText = 'QC Approved';
                                break;
                            case 'QCReject':
                                statusClass = 'bg-red-100 text-red-800 border-red-400';
                                statusText = 'QC Rejected';
                                break;
                            default:
                                statusClass = 'bg-gray-100 text-gray-800';
                                statusText = 'Unknown';
                        }

                        return `<div class="flex items-center lg:justify-center ${statusClass} text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:${status === 'submitted' ? 'text-green-400' : 'text-yellow-400'} border">
      ${statusText}
    </div>`;
                    },
                },
                {
                    title: "ACTIONS",
                    minWidth: 150,
                    field: "actions",
                    responsive: 1,
                    hozAlign: "center",
                    headerHozAlign: "center",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const container = document.createElement("div");
                        container.classList.add("flex", "lg:justify-center", "flex-col"); // Added flex-col class for vertical stacking

                        const response = cell.getData();
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

                        // Check the status before rendering "Edit" and "Delete" links

                        // Render "Edit" link
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
                        editLink.appendChild(document.createTextNode("Update"));
                        container.appendChild(editLink);

                        // Render "Delete" link
                        // const deleteLink = document.createElement("a");
                        // deleteLink.classList.add("flex", "items-center", "text-danger");
                        // deleteLink.href = "javascript:;";
                        // deleteLink.addEventListener("click", function () {
                        //     deleteRole(response.id); // Call the delete function
                        // });

                        // const deleteIcon = document.createElement("i");
                        // deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
                        // deleteLink.appendChild(deleteIcon);
                        // deleteLink.appendChild(document.createTextNode("Delete"));
                        // container.appendChild(deleteLink);




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
                    title: "Powder Code",
                    field: "powdercode",
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
                    title: "Weight",
                    field: "receivedweight",
                    visible: false,
                    print: true,
                    download: true,
                },
                {
                    title: "Warehouse Location",
                    field: "warehouselocation",
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
                        let statusText, statusColor;

                        switch (status) {
                            case 'submitted':
                                statusText = 'Submitted';
                                statusColor = 'text-success';
                                break;
                            case 'draft':
                                statusText = 'Draft';
                                statusColor = 'text-yellow-500'; // Use Tailwind CSS yellow color class
                                break;
                            case 'WHApprove':
                                statusText = 'Warehouse Approved';
                                statusColor = 'text-success';
                                break;
                            case 'WHReject':
                                statusText = 'Warehouse Rejected';
                                statusColor = 'text-danger';
                                break;
                            case 'QCApprove':
                                statusText = 'QC Approved';
                                statusColor = 'text-success';
                                break;
                            case 'QCReject':
                                statusText = 'QC Rejected';
                                statusColor = 'text-danger';
                                break;
                            default:
                                statusText = 'Unknown';
                                statusColor = 'text-warning';
                        }

                        return `<div class="flex items-center lg:justify-center ${statusColor}">
      <i data-lucide="${status === 'submitted' ? 'check-square' : 'x-square'}" class="w-4 h-4 mr-2"></i> ${statusText}
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


const onGRNumber = () => {
    if (tabulator.value) {
        tabulator.value.setFilter("grnumber", 'like', filter.grnumber);
    }
};

// On reset filter
const onResetFilter = () => {
    setFilter({
        ...filter,
        value: "",
        id: "",
        grnumber: "",
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
    axios.get('http://172.188.122.62:8085/api/GRDetails')
        .then(response => {
            // Filter out data with status "deleted" and "draft"
            const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted' && item.status !== 'draft');

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
    fetchGRNumber();
    fetchVendorCode();
    fetchUOM();
    fetchWarehouseLocations();
});


const editFormData = reactive({
    id: null,
    grnumber: '',
    powdercode: '',
    vendorcode: '',
    ponumber: '',
    lotnumber: '',
    gross: '',
    uom: '',
    receivedweight: '',
    actualweight: '',
    warehouselocation: '',
    powderparticlesize: '', 
    mv: '', 
    d10: '', 
    d50: '', 
    d90: '', 
    bulkdensity: '',  
    status: 'submitted',
    vendorCodes: [] as any[], // Use a separate property for rendering the options in the dropdown
    uoms: [] as string[], // Use a separate property for rendering the options in the dropdown
    warehouseCodes: [] as string[], // Use a separate property for rendering the options in the dropdown
});

const editRole = (id: string) => {
    // Fetch data for the specific ID
    axios.get(`http://172.188.122.62:8085/api/GRDetails/${id}`)
        .then(response => {
            const data = response.data.result;

            // Check if the array has at least one item
            if (data && data.length > 0) {
                // Log the retrieved data
                console.log('Retrieved Data:', data);

                // Set data to the editFormData
                const firstItem = data[0];
                editFormData.id = firstItem.id;
                editFormData.grnumber = firstItem.grnumber || '';
                editFormData.powdercode = firstItem.powdercode || '';
                editFormData.vendorcode = firstItem.vendorcode || '';
                editFormData.ponumber = firstItem.ponumber || '';
                editFormData.lotnumber = firstItem.lotnumber || '';
                editFormData.gross = firstItem.gross || '';
                editFormData.uom = firstItem.uom || '';
                editFormData.receivedweight = firstItem.receivedweight || '';
                editFormData.actualweight = firstItem.actualweight || '';
                editFormData.warehouselocation = firstItem.warehouselocation || '';
                editFormData.powderparticlesize = firstItem.powderparticlesize || '';
                editFormData.mv = firstItem.mv || '';
                editFormData.d10 = firstItem.d10 || '';
                editFormData.d50 = firstItem.d50 || '';
                editFormData.d90 = firstItem.d90 || '';
                editFormData.bulkdensity = firstItem.bulkdensity || '';
                editFormData.status = firstItem.status || 'submitted';

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



const viewData = reactive({
    id: '',
    grnumber: '',
    powdercode: '',
    vendorcode: '',
    ponumber: '',
    lotnumber: '',
    gross: '',
    uom: '',
    receivedweight: '',
    warehouselocation: '',
    status: 'submitted',

});

const viewRole = (id: string) => {
    // Fetch data for the specific ID
    axios.get(`http://172.188.122.62:8085/api/GRDetails/${id}`)
        .then(response => {
            const data = response.data.result;

            // Check if the array has at least one item
            if (data && data.length > 0) {
                // Log the retrieved data
                console.log('Retrieved Data:', data);

                // Set data to the viewData
                const firstItem = data[0];
                viewData.id = firstItem.id;
                viewData.grnumber = firstItem.grnumber || '';
                viewData.powdercode = firstItem.powdercode || '';
                viewData.vendorcode = firstItem.vendorcode || '';
                viewData.ponumber = firstItem.ponumber || '';
                viewData.lotnumber = firstItem.lotnumber || '';
                viewData.gross = firstItem.gross || '';
                viewData.uom = firstItem.uom || '';
                viewData.receivedweight = firstItem.receivedweight || '';
                viewData.warehouselocation = firstItem.warehouselocation || '';
                viewData.status = firstItem.status || 'submitted';

                // Open the edit slideover
                setviewModal(true);
            } else {
                console.error('No data found for the specified ID:', id);
            }
        })
        .catch(error => {
            console.error('Error fetching data for editing:', error);
        });
};


const viewModal = ref(false);
const setviewModal = (value: boolean) => {
    viewModal.value = value;
};


const updateRole = (status: 'WHReject' | 'WHApprove') => {
    // Show a confirmation dialog before making the API call
    Swal.fire({
        title: 'Confirmation',
        text: `Are you sure you want to ${status === 'WHReject' ? 'reject' : 'approve'} this role?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e40af',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${status === 'WHReject' ? 'reject' : 'approve'} it!`,
    }).then((result) => {
        // If the user confirms, proceed with adding or saving the role
        if (result.isConfirmed && editFormData.id) {
            // Set the status based on the button clicked
            editFormData.status = status;
            // Handle adding or saving a role (PUT request)
            axios.put(`http://172.188.122.62:8085/api/GRDetails/${editFormData.id}`, {
                grnumber: editFormData.grnumber,
                powdercode: editFormData.powdercode,
                vendorcode: editFormData.vendorcode,
                ponumber: editFormData.ponumber,
                lotnumber: editFormData.lotnumber,
                gross: editFormData.gross,
                uom: editFormData.uom,
                receivedweight: editFormData.receivedweight,
                actualweight: editFormData.actualweight,
                warehouselocation: editFormData.warehouselocation,
                status: editFormData.status,
            })
                .then(response => {
                    // Close the edit slideover
                    setEditSlideOver(false);

                    // Refetch filtered data after successful update
                    axios.get('http://172.188.122.62:8085/api/GRDetails')
                        .then(response => {
                            // Filter out data with status "deleted" and "draft"
                            const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted' && item.status !== 'draft');

                            // Update table data after successful update
                            console.log(filteredData);
                            if (tabulator.value) {
                                tabulator.value.setData(filteredData);
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching data:', error);
                        });

                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: `GR ${status === 'WHReject' ? 'Reject' : 'Approve'} Successfully`,
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

                    console.log(`Role ${status === 'WHReject' ? 'reject' : 'approve'} successfully:`, response.data.result);
                })
                .catch(error => {
                    console.error(`Error ${status === 'WHReject' ? 'reject' : 'approve'} role:`, error);
                });
        }
    });
};


const updateTableData = () => {
    axios.get(`http://172.188.122.62:8085/api/GRDetails`)
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
    grnumber: '',
    powdercode: '',
    vendorcode: '', // Use a separate property for storing the selected vendor code
    ponumber: '',
    lotnumber: '',
    gross: '',
    uom: '',
    receivedweight: '',
    warehouselocation: '',
    status: 'WHApprove',
    vendorCodes: [] as any[], // Use a separate property for rendering the options in the dropdown
    uoms: [] as string[], // Use a separate property for rendering the options in the dropdown
    warehouseCodes: [] as string[], // Use a separate property for rendering the options in the dropdown
    // Use a separate property for rendering the options in the dropdown
});


// Function to add new role

const addRole = (status: 'draft' | 'submitted') => {
    // Show a confirmation dialog before making the API call
    Swal.fire({
        title: 'Confirmation',
        text: `Are you sure you want to ${status === 'draft' ? 'save' : 'submit'} this role?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e40af',
        cancelButtonColor: '#d33',
        confirmButtonText: `Yes, ${status === 'draft' ? 'save' : 'submit'} it!`,
    }).then((result) => {
        // If the user confirms, proceed with adding or saving the role
        if (result.isConfirmed) {
            // Set the status based on the button clicked
            addFormData.status = status; // Set the status here

            // Handle adding or saving a role (POST request)
            axios.post('http://172.188.122.62:8085/api/GRDetails', {
                grnumber: addFormData.grnumber,
                powdercode: addFormData.powdercode,
                vendorcode: addFormData.vendorcode,
                ponumber: addFormData.ponumber,
                lotnumber: addFormData.lotnumber,
                gross: addFormData.gross,
                uom: addFormData.uom,
                receivedweight: addFormData.receivedweight,
                warehouselocation: addFormData.warehouselocation,
                status: addFormData.status,
            })
                .then(response => {
                    // Close the add slideover
                    setAddSlideover(false);

                    // Reset form data
                    resetFormData();

                    // Update table data after successful addition or save
                    updateTableData(); // Function to update table data

                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: `Role ${status === 'draft' ? 'Saved' : 'Submitted'} Successfully`,
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

                    console.log(`Role ${status === 'draft' ? 'saved' : 'submitted'} successfully:`, response.data.result);
                })
                .catch(error => {
                    console.error(`Error ${status === 'draft' ? 'saving' : 'submitting'} role:`, error);
                });
        }
    });
};

const fetchGRNumber = () => {
    axios.get('http://172.188.122.62:8085/api/GRDetails/GetGRNo')
        .then(response => {
            // Assuming the response body contains the GR number as a string
            addFormData.grnumber = response.data;
        })
        .catch(error => {
            console.error('Error fetching GR number:', error);
        });
};

const fetchVendorCode = () => {
    axios.get('http://172.188.122.62:8085/api/VendorMaster/GetVendorDDL')
        .then(response => {
            const vendorData = response.data.result;

            if (Array.isArray(vendorData)) {
                // If it's an array, use the first element or handle multiple vendors as needed
                addFormData.vendorcode = vendorData.length > 0 ? vendorData[0].vendorcode : '';
                // Assign the array to addFormData.vendorCodes for rendering options in the dropdown
                addFormData.vendorCodes = vendorData.map(item => item.vendorcode);
                editFormData.vendorcode = vendorData.length > 0 ? vendorData[0].vendorcode : '';
                // Assign the array to addFormData.vendorCodes for rendering options in the dropdown
                editFormData.vendorCodes = vendorData.map(item => item.vendorcode);
            } else if (typeof vendorData === 'object') {
                // If it's an object, use its properties
                addFormData.vendorcode = vendorData.vendorcode || '';
                addFormData.vendorCodes = [vendorData.vendorcode]; // Set an array with a single value
                editFormData.vendorcode = vendorData.vendorcode || '';
                editFormData.vendorCodes = [vendorData.vendorcode]; // Set an array with a single value
            } else {
                console.error('Invalid response format for vendor data:', vendorData);
            }
        })
        .catch(error => {
            console.error('Error fetching vendor codes:', error);
        });
};


const fetchWarehouseLocations = () => {
    axios.get('http://172.188.122.62:8085/api/WarehouseLocation/GetWarehouseDDL')
        .then(response => {
            const warehouseData = response.data.result;

            if (Array.isArray(warehouseData)) {
                // If it's an array, use the first element or handle multiple warehouses as needed
                addFormData.warehouselocation = warehouseData.length > 0 ? warehouseData[0].warehousecode : '';
                // Assign the array to addFormData.warehouseCodes for rendering options in the dropdown
                addFormData.warehouseCodes = warehouseData.map(item => item.warehousecode);
                editFormData.warehouselocation = warehouseData.length > 0 ? warehouseData[0].warehousecode : '';
                // Assign the array to addFormData.warehouseCodes for rendering options in the dropdown
                editFormData.warehouseCodes = warehouseData.map(item => item.warehousecode);
            } else if (typeof warehouseData === 'object') {
                // If it's an object, use its properties
                addFormData.warehouselocation = warehouseData.warehousecode || '';
                addFormData.warehouseCodes = [warehouseData.warehousecode]; // Set an array with a single value
                editFormData.warehouselocation = warehouseData.warehousecode || '';
                editFormData.warehouseCodes = [warehouseData.warehousecode]; // Set an array with a single value
            } else {
                console.error('Invalid response format for warehouse data:', warehouseData);
            }
        })
        .catch(error => {
            console.error('Error fetching warehouse locations:', error);
        });
};


const fetchUOM = () => {
    axios.get('http://172.188.122.62:8085/api/GRDetails/GetUOMDDL')
        .then(response => {
            const uomData = response.data.result;

            if (Array.isArray(uomData)) {
                // If it's an array, use the first element or handle multiple UOMs as needed
                addFormData.uom = uomData.length > 0 ? uomData[0].uomcode : '';
                // Assign the array to addFormData.uoms for rendering options in the dropdown
                addFormData.uoms = uomData.map(item => item.uomcode);
                editFormData.uom = uomData.length > 0 ? uomData[0].uomcode : '';
                // Assign the array to addFormData.uoms for rendering options in the dropdown
                editFormData.uoms = uomData.map(item => item.uomcode);
            } else if (typeof uomData === 'object') {
                // If it's an object, use its properties
                addFormData.uom = uomData.uomcode || '';
                addFormData.uoms = [uomData.uomcode]; // Set an array with a single value
                editFormData.uom = uomData.uomcode || '';
                editFormData.uoms = [uomData.uomcode]; // Set an array with a single value
            } else {
                console.error('Invalid response format for UOM:', uomData);
            }
        })
        .catch(error => {
            console.error('Error fetching UOM:', error);
        });
};






const resetFormData = () => {
    // Reset form data
    addFormData.grnumber = '';
    addFormData.vendorCodes = [] as any;
    addFormData.powdercode = '';
    addFormData.vendorcode = '';
    addFormData.ponumber = '';
    addFormData.lotnumber = '';
    addFormData.gross = '';
    addFormData.uom = '';
    addFormData.receivedweight = '';
    addFormData.warehouselocation = '';
    addFormData.status = 'active';
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
            axios.delete(`http://172.188.122.62:8085/api/GRDetails/${id}`)
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


const weightDifference = computed(() => {
    const enteredWeight = parseFloat(editFormData.receivedweight || '0');
    const actualWeightValue = parseFloat(editFormData.actualweight || '0');
    return enteredWeight - actualWeightValue;
});


const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

</script>

<template>
    <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Warehouse</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
            <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
                Add Warehouse
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
                        GR
                    </label>
                    <FormInput id="tabulator-html-filter-id" v-model="filter.grnumber" type="text"
                        class="mt-2 sm:w-40 2xl:w-full sm:mt-0" placeholder="Search GR Number..." />
                </div>
                <Button id="tabulator-html-filter-go" variant="primary" type="button"
                class="w-full ml-10 mt-2 mr-2 sm: ml-0 sm:w-16 sm:mt-0 sm:ml-1" @click="onGRNumber">
                    GR
                </Button>
                <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
                    <label class="flex-none w-12 mr-1 xl:w-auto xl:flex-initial">
                        Start Date
                    </label>
                    <FormInput id="tabulator-html-filter-startDate" v-model="filter.startDate" type="date"
                        class="mt-2 sm:w-40 2xl:w-full sm:mt-0" />
                </div>
                <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
                    <label class="flex-none w-12 mr-1 xl:w-auto xl:flex-initial">
                        End Date
                    </label>
                    <FormInput id="tabulator-html-filter-endDate" v-model="filter.endDate" type="date"
                        class="mt-2 sm:w-40 2xl:w-full sm:mt-0" />
                </div>
                <div class="mt-2 xl:mt-0">
                    <Button id="tabulator-html-filter-go" variant="primary" type="button" class="w-full sm:w-16"
                        @click="onFilter">
                        Date
                    </Button>

                    <Button id="tabulator-html-filter-reset" variant="secondary" type="button"
                        class="w-full ml-10 mt-2 sm: ml-0 sm:w-16 sm:mt-0 sm:ml-1" @click="onResetFilter">
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
                    Add Warehouse
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form">

                    <div>
                        <FormLabel htmlFor="regular-form-1">GR Number</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.grnumber" type="text"
                            placeholder="GR Number" disabled />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Powder Code</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.powdercode" type="text"
                            placeholder="Powder Code" />
                    </div>
                    <div class="mt-5">
                        <label for="vendor-dropdown">Vendor</label>
                        <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.vendorcode">
                            <option v-for="vendorCode in addFormData.vendorCodes" :key="vendorCode" :value="vendorCode">
                                {{ vendorCode }}
                            </option>
                        </FormSelect>
                    </div>

                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">PO Number</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.ponumber" type="text"
                            placeholder="PO Number" />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Lot Number</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.lotnumber" type="text"
                            placeholder="Lot Number" />
                    </div>
                    <div class="mt-5">
                        <label for="vendor-dropdown">UOM</label>
                        <FormSelect class="mt-2" id="vendor-dropdown" v-model="addFormData.uom">
                            <option v-for="uoms in addFormData.uoms" :key="uoms" :value="uoms">
                                {{ uoms }}
                            </option>
                        </FormSelect>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Gross</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.gross" type="text" placeholder="Gross" />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Weight</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.receivedweight" type="text" placeholder="Weight" />
                    </div>
                    <div class="mt-5">
                        <label for="warehouse-dropdown">Warehouse</label>
                        <FormSelect class="mt-2" id="warehouse-dropdown" v-model="addFormData.warehouselocation">
                            <option v-for="warehouseCode in addFormData.warehouseCodes" :key="warehouseCode"
                                :value="warehouseCode">
                                {{ warehouseCode }}
                            </option>
                        </FormSelect>
                    </div>
                    <Button variant="primary" class="w-[100%] mt-10 shadow-md"
                        @click.prevent="() => addRole('submitted')">
                        Submit
                    </Button>

                    <Button variant="outline-primary" class="w-[100%] mr-2 mt-2 shadow-md"
                        @click.prevent="() => addRole('draft')">
                        Save
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
                    Edit Warehouse
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form">

                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Received Weight</FormLabel>
                        <FormInput id="regular-form-1" v-model="editFormData.receivedweight" type="text" placeholder="Weight"
                            disabled />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="actual-weight-form-1">Actual Weight</FormLabel>
                        <FormInput id="actual-weight-form-1" v-model="editFormData.actualweight" type="text"
                            placeholder="Actual Weight" />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="weight-difference-form-1">Weight Difference (Received Weight - Actual
                            Weight)</FormLabel>
                        <FormInput id="weight-difference-form-1" :value="weightDifference" type="text" disabled />
                    </div>

                    <Button variant="primary" class="w-[100%] mt-10 shadow-md"
                        @click.prevent="() => updateRole('WHApprove')">
                        Approve
                    </Button>

                    <Button variant="outline-primary" class="w-[100%] mr-2 mt-2 shadow-md"
                        @click.prevent="() => updateRole('WHReject')">
                        Reject
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
    <Dialog size="lg" :open="viewModal" @close="() => {
                setviewModal(false);
            }
                ">
        <Dialog.Panel>
            <Dialog.Title>
                <h2 class="mr-auto text-base font-medium">
                    View Warehouse
                </h2>
            </Dialog.Title>
            <Dialog.Description>
                <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
                    <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                        <tbody class="w-[100%]">
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    GR Number
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.grnumber }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Powder Code
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.powdercode }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Vendor Code
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.vendorcode }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    PO Number
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.ponumber }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Gross
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.gross }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    UOM
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.uom }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Weight
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.receivedweight }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Warehouse Location
                                </th>
                                <td class="w-[50%] px-auto text-center text-gray-700">
                                    {{ viewData.warehouselocation }}
                                </td>
                            </tr>
                            <tr class="border-b border-gray-200 dark:border-gray-700">
                                <th scope="row"
                                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                                    Status
                                </th>
                                <td class="w-[50%] px-auto text-center">
                                    <span :class="{
                'text-green-700': viewData.status === 'submitted' || viewData.status === 'WHApprove' || viewData.status === 'QCApprove',
                'text-red-700': viewData.status === 'WHReject' || viewData.status === 'QCReject'
            }">
                                        {{
                viewData.status === 'submitted' ? 'Submitted' :
                    viewData.status === 'draft' ? 'Draft' :
                        viewData.status === 'WHApprove' ? 'WH Approved' :
                            viewData.status === 'WHReject' ? 'WH Rejected' :
                                viewData.status === 'QCApprove' ? 'QC Approved' :
                                        viewData.status === 'QCReject' ? 'QC Rejected' : 'Unknown'
                                        }}
                                    </span>
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
