<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea } from "../base-components/Form";
import * as xlsx from "xlsx";
import { onMounted, ref, reactive } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import { stringToHTML } from "../utils/helper";
import axios from "axios";
import Swal from 'sweetalert2';

interface Response {
    vendorname?: string;
    vendorcode?: string;
    status?: string;
}

const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
    field: "name",
    type: "like",
    value: "",
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
                    title: "CODE",
                    minWidth: 200,
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
                    title: "NAME",
                    minWidth: 200,
                    responsive: 0,
                    field: "vendorname",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.vendorname}</div>
              </div>`;
                    },
                },
                {
                    title: "STATUS",
                    minWidth: 200,
                    field: "status",
                    hozAlign: "center",
                    headerHozAlign: "center",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    formatter:
                        function (cell, formatterParams, onRendered) {
                            const status = cell.getValue();
                            return `<div class="flex items-center  lg:justify-center ${status === 'active' ? 'bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400' : 'bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400'
                                }">
    ${status === 'active' ? 'Active' : 'Inactive'
                                }
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
                        const deleteLink = document.createElement("a");
                        deleteLink.classList.add("flex", "items-center", "text-danger");
                        deleteLink.href = "javascript:;";
                        deleteLink.addEventListener("click", function () {
                            deleteRole(response.id); // Call the delete function
                        });

                        const deleteIcon = document.createElement("i");
                        deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
                        deleteLink.appendChild(deleteIcon);
                        deleteLink.appendChild(document.createTextNode("Delete"));
                        container.appendChild(deleteLink);


                        // Render "View" link

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
        tabulator.value.setFilter(filter.field, filter.type, filter.value);
    }
};

onMounted(() => {
    // Fetch data from API
    axios.get('http://172.188.122.62:8085/api/VendorMaster')
        .then(response => {
            // Filter out data with status "deleted"
            const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');

            // Once data is received, populate the table
            console.log(response.data.result);
            if (tabulator.value) {
                tabulator.value.setData(filteredData);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });

    initTabulator();
    reInitOnResizeWindow();
});

const editFormData = reactive({
    id: null,
    vendorcode: '',
    vendorname: '',
    status: 'Active',
});

const editRole = (id: string) => {
    // Fetch data for the specific ID
    axios.get(`http://172.188.122.62:8085/api/VendorMaster/${id}`)
        .then(response => {
            const data = response.data.result;

            // Check if the array has at least one item
            if (data && data.length > 0) {
                // Log the retrieved data
                console.log('Retrieved Data:', data);

                // Set data to the editFormData
                const firstItem = data[0];
                editFormData.id = firstItem.id;
                editFormData.vendorcode = firstItem.vendorcode || '';
                editFormData.vendorname = firstItem.vendorname || '';
                editFormData.status = firstItem.status || 'Active';

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


const updateRole = () => {
    // Ask for confirmation before updating
    Swal.fire({
        title: 'Are you sure?',
        text: 'This will update the data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e40af',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
    }).then((result) => {
        if (result.isConfirmed) {
            if (editFormData.id) {
                axios.put(`http://172.188.122.62:8085/api/VendorMaster/${editFormData.id}`, {
                    vendorcode: editFormData.vendorcode,
                    vendorname: editFormData.vendorname,
                    status: editFormData.status,
                })
                    .then(response => {
                        // Close the edit slideover
                        setEditSlideOver(false);

                        // Update table data
                        updateTableData();

                        Swal.fire({
                            icon: 'success',
                            title: 'Updated Successfully',
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
                        console.error('Error updating data:', error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Failed to Update',
                            text: 'Please try again',
                        });
                    });
            }
        }
    });
};

const updateTableData = () => {
    axios.get(`http://172.188.122.62:8085/api/VendorMaster`)
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
    vendorcode: '',
    vendorname: '',
    status: 'active',
});

// Function to add new role

const addRole = () => {
    // Show a confirmation dialog before making the API call
    Swal.fire({
        title: 'Confirmation',
        text: 'Are you sure you want to add this role?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e40af',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, add it!',
    }).then((result) => {
        // If the user confirms, proceed with adding the role
        if (result.isConfirmed) {
            // Handle adding a new role (POST request)
            axios.post('http://172.188.122.62:8085/api/VendorMaster', {
                vendorcode: addFormData.vendorcode,
                vendorname: addFormData.vendorname,
                status: addFormData.status,
            })
                .then(response => {
                    // Close the add slideover
                    setAddSlideover(false);

                    addFormData.vendorcode = '';
                    addFormData.vendorname = '';
                    addFormData.status = 'active';

                    // Update table data after successful addition
                    updateTableData(); // Function to update table data

                    // Show success message
                    Swal.fire({
                        icon: 'success',
                        title: 'Role Added Successfully',
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

                    console.log('Role added successfully:', response.data.result);
                })
                .catch(error => {
                    console.error('Error adding role:', error);
                });
        }
    });
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
            axios.delete(`http://172.188.122.62:8085/api/VendorMaster/${id}`)
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

const handleAddClick = (event: MouseEvent) => {
  event.preventDefault();
  setAddSlideover(true);
};

</script>

<template>
    <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Vendor Master</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
            <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
                Add Vendor Master
            </Button>
        </div>
    </div>
    <!-- BEGIN: HTML Table Data -->
    <div class="p-5 mt-5 intro-y box mb-10">

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
                    Add Vendor Master
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form" @submit.prevent="addRole">
                    <div>
                        <FormLabel htmlFor="regular-form-1">Code</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.vendorcode" type="text"
                            placeholder="Code" />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Name</FormLabel>
                        <FormInput id="regular-form-1" v-model="addFormData.vendorname" type="text"
                            placeholder="Name" />
                    </div>

                    <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel>
            <FormSelect class=" sm:mr-2" v-model="addFormData.status" aria-label="Default select example">
              <option>active</option>
            </FormSelect>
          </div> -->

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
                        <FormLabel htmlFor="edit-form-code">Code</FormLabel>
                        <FormInput id="edit-form-code" v-model="editFormData.vendorcode" type="text"
                            placeholder="Code" />
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="edit-form-name">Name</FormLabel>
                        <FormInput id="edit-form-name" v-model="editFormData.vendorname" type="text"
                            placeholder="Name" />
                    </div>

                    <div class="mt-5">
                        <FormLabel htmlFor="edit-form-status">Status</FormLabel>
                        <FormSelect id="edit-form-status" v-model="editFormData.status" class="sm:mr-2"
                            aria-label="Default select example">
                            <option>active</option>
                            <option>inactive</option>
                        </FormSelect>
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
</template>
