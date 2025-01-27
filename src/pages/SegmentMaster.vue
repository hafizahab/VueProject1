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


const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
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
                    title: "REMARKS",
                    field: "remarks",
                    responsive: 0,
                    vertAlign: "middle",
                    formatter(cell) {
                        const response = cell.getData();
                        const remarks = response.remarks ? response.remarks : "N/A";
                        return `<div>
            <div class="font-medium whitespace-nowrap">${remarks}</div>
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
                                    statusClass = 'bg-green-100 text-green-800 border-green-400';
                                    break;
                                case 'Inactive':
                                    statusClass = 'bg-red-100 text-red-800 border-red-400';
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


// Print
const onPrint = () => {
    if (tabulator.value) {
        tabulator.value.print();
    }
};


// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/PlatformMaster/';

onMounted(() => {
    // Fetch data from API
    axios.get(API_BASE_URL)
        .then(response => {
            // Filter out data with status "deleted"
            const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');

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
    fetchItems();
});

// Form Data
const editFormData = reactive({
    id: null,
    name: "",
    remarks: "",
    status: ""
});


const viewData = reactive({
    id: '',
    name: '',
    remarks: '',
    status: '',
});


const addFormData = reactive({
    id: '',
    name: '',
    remarks: '',
    status: 'Active'
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
                    remarks: firstItem.remarks,
                    status: firstItem.status
                });

                modalSetter(true);
            } else {
                console.error('No data found for the specified ID:', id);
            }
        })
        .catch(error => handleError(error, 'Error fetching data for editing'));
};


const editRole = (id: string) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
    axios.get(API_BASE_URL)
        .then(response => {
            const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
            if (tabulator.value) {
                tabulator.value.setData(filteredData);
            }
        })
        .catch(error => handleError(error, 'Error fetching updated data'));
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
    if (formSubmitted.value && (!addFormData.name || !addFormData.status)) {
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
    // Proceed with the API call to add the role
    axios.post(API_BASE_URL, { ...addFormData })
      .then(response => {
        if (response.data.message === `Unable to complete request. Platform data is with Name ${addFormData.name} already exist`) {
          Swal.fire({
            icon: 'error',
            title: 'Duplicate Name',
            html: `<b>${addFormData.name}</b> already exists, please try another name`,
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
              axios.post(API_BASE_URL, { ...addFormData })
                .then(response => {
                  console.log('Successfully submitted data:', response.data);
                  setAddSlideover(false);
                  resetFormData(addFormData);
                  updateTableData();
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


</script>

<template>
    <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Platform Master</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
            <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
                Add Platform Master
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
                    Add Platform Master
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
                    Edit Platform Master
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
                    View Platform Master
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
                                            'text-green-600': viewData.status === 'Active',
                                            'text-red-600': viewData.status === 'Inactive',
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
