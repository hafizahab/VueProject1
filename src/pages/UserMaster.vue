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
  username?: string;
  name?: string;
  email?: string;
  department?: string;
  division?: string;
  designation?: string;
  location?: string;
  password?: string;
  confirmPassword?: string;
  remarks?: string;
  status?: string;
  resetPasswordonFirstLogin?: any;
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
          title: "USERNAME",
          field: "username",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.username}</div>
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
          title: "EMAIL",
          field: "email",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.email}</div>
    </div>`;
          },
        },
        {
          title: "DEPARTMENT",
          field: "department",
          responsive: 0,
          vertAlign: "middle",
          formatter(cell) {
            const response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.department}</div>
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
const API_BASE_URL = 'http://10.87.0.33:8082/api/UserMaster/';

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
  fetchNamesLocation();
  fetchItems();
});

// Form Data
const editFormData = reactive({
  id: null,
  username: "",
  name: "",
  email: "",
  department: "",
  division: "",
  designation: "",
  location: "",
  password: "",
  confirmPassword: "",
  remarks: "",
  resetPasswordonFirstLogin: false,
  status: "",
  names: [] as string[],
});

const viewData = reactive({
  id: '',
  username: "",
  name: "",
  email: "",
  department: "",
  division: "",
  designation: "",
  location: "",
  password: "",
  confirmPassword: "",
  remarks: "",
  resetPasswordonFirstLogin: false,
  status: ""
});

const addFormData = reactive({
  id: '',
  username: "",
  name: "",
  email: "",
  department: "",
  division: "",
  designation: "",
  location: "",
  password: "",
  confirmPassword: "",
  remarks: "",
  resetPasswordonFirstLogin: false,
  status: "Active",
  names: [] as string[],
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
          username: firstItem.username,
          name: firstItem.name,
          email: firstItem.email,
          department: firstItem.department,
          division: firstItem.division,
          designation: firstItem.designation,
          location: firstItem.location,
          password: firstItem.password,
          confirmPassword: firstItem.confirmPassword,
          remarks: firstItem.remarks,
          resetPasswordonFirstLogin: firstItem.resetPasswordonFirstLogin,
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
  if (!editFormData.name || !editFormData.username || !editFormData.email || !editFormData.location || !editFormData.password || !editFormData.confirmPassword || !editFormData.status) {
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
    const filteredData = response.data.result.filter((item: any) => item.status !== 'deleted');
    items.value = filteredData;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

const fetchNamesLocation = () => {
  axios.get('http://10.87.0.33:8082/api/LocationMaster')
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


// Add Role
const addRole = () => {
  formSubmitted.value = true;

  if (!addFormData.name || !addFormData.username || !addFormData.email || !addFormData.location || !addFormData.password || !addFormData.confirmPassword || !addFormData.status || addFormData.password !== addFormData.confirmPassword) {
    // If form is submitted but any required field is empty, show an alert to complete the form
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
    // Check if the username already exists
    const existingUser = items.value.find(user => user.name === addFormData.name);

    if (existingUser) {
      Swal.fire({
        icon: 'error',
        title: 'Duplicate name',
        html: `<b>${addFormData.name}</b> already exists, please try another name`,
      });
      formSubmitted.value = false;
      return;
    }

    // Proceed with the API call to add the role
    axios.post(API_BASE_URL, { ...addFormData })
      .then(response => {
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
                fetchNamesLocation();
          fetchItems();
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
    <h2 class="mr-auto text-lg font-medium">User Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add User Master
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
          Add User Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="addRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Username</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.username }" id="regular-form-1"
              v-model="addFormData.username" type="text" placeholder="Username" />
            <span v-if="formSubmitted && !addFormData.username" class="text-red-500">Username is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Name</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.name }" id="regular-form-2"
              v-model="addFormData.name" type="text" placeholder="Name" />
            <span v-if="formSubmitted && !addFormData.name" class="text-red-500">Name is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Email</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.email }" id="regular-form-3"
              v-model="addFormData.email" type="email" placeholder="Email" />
            <span v-if="formSubmitted && !addFormData.email" class="text-red-500">Email is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Department</FormLabel>
            <FormInput id="regular-form-4" v-model="addFormData.department" type="text" placeholder="Department" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Division</FormLabel>
            <FormInput id="regular-form-5" v-model="addFormData.division" type="text" placeholder="Division" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-6">Designation</FormLabel>
            <FormInput id="regular-form-6" v-model="addFormData.designation" type="text" placeholder="Designation" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-7">Location</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.location }" v-model="addFormData.location"
              class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Location Option</option>
              <option v-for="name in addFormData.names" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !addFormData.location" class="text-red-500">Location is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Password</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.password }" id="regular-form-8"
              v-model="addFormData.password" type="text" placeholder="Password" />
            <span v-if="formSubmitted && !addFormData.password" class="text-red-500">Password is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-9">Confirm Password</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': formSubmitted && (!addFormData.confirmPassword || (addFormData.confirmPassword && addFormData.password !== addFormData.confirmPassword)) }"
              id="regular-form-9" v-model="addFormData.confirmPassword" type="text" placeholder="Confirm Password" />
            <span v-if="formSubmitted && !addFormData.confirmPassword" class="text-red-500">Confirm Password is
              required!</span>
            <span
              v-if="formSubmitted && addFormData.confirmPassword && addFormData.password !== addFormData.confirmPassword"
              class="text-red-500">Passwords do not match!</span>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-10">Remarks</FormLabel>
            <FormInput id="regular-form-10" v-model="addFormData.remarks" type="text" placeholder="Remarks" />
          </div>
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="pre-blend" class="mr-2 ml-[-2]">
                Reset Password on First Login
              </FormCheck.Label>
              <FormCheck.Input id="pre-blend" v-model="addFormData.resetPasswordonFirstLogin" type="checkbox"
                value="" />

            </FormCheck>
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
          Edit User Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <form class="validate-form" @submit.prevent="updateRole">
          <div>
            <FormLabel htmlFor="regular-form-1">Username</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.username }" id="regular-form-1"
              v-model="editFormData.username" type="text" placeholder="Username" />
            <span v-if="!editFormData.username" class="text-red-500">Username is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-2">Name</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.name }" id="regular-form-2" v-model="editFormData.name"
              type="text" placeholder="Name" />
            <span v-if="!editFormData.name" class="text-red-500">Name is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Email</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.email }" id="regular-form-3"
              v-model="editFormData.email" type="email" placeholder="Email" />
            <span v-if="!editFormData.email" class="text-red-500">Email is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-4">Department</FormLabel>
            <FormInput id="regular-form-4" v-model="editFormData.department" type="text" placeholder="Department" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Division</FormLabel>
            <FormInput id="regular-form-5" v-model="editFormData.division" type="text" placeholder="Division" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-6">Designation</FormLabel>
            <FormInput id="regular-form-6" v-model="editFormData.designation" type="text" placeholder="Designation" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-7">Location</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.location }" id="regular-form-7"
              v-model="editFormData.location" type="text" placeholder="Location" />
            <span v-if="!editFormData.location" class="text-red-500">Location is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-8">Password</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.password }" id="regular-form-8"
              v-model="editFormData.password" type="text" placeholder="Password" />
            <span v-if="!editFormData.password" class="text-red-500">Password is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-9">Confirm Password</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput
              :class="{ 'border-red-500': (!editFormData.confirmPassword || (editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword)) }"
              id="regular-form-9" v-model="editFormData.confirmPassword" type="text" placeholder="Confirm Password" />
            <span v-if="!editFormData.confirmPassword" class="text-red-500">Confirm Password is required!</span>
            <span v-if="editFormData.confirmPassword && editFormData.password !== editFormData.confirmPassword"
              class="text-red-500">Passwords do not match!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-10">Remarks</FormLabel>
            <FormInput id="regular-form-10" v-model="editFormData.remarks" type="text" placeholder="Remarks" />
          </div>
          <div class="mt-5">
            <FormCheck>
              <FormCheck.Label htmlFor="pre-blend" class="mr-2 ml-[-2]">
                Reset Password on First Login
              </FormCheck.Label>
              <FormCheck.Input id="pre-blend" v-model="editFormData.resetPasswordonFirstLogin" type="checkbox"
                value="" />
            </FormCheck>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Status</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
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
          View User Master
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
                    Username
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.username }}
                  </td>
                </tr>
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
                    Email
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.email }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Department
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.department ? viewData.department : 'N/A' }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Division
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.division ? viewData.division : 'N/A' }}
                  </td>
                </tr>

                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Designation
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.designation ? viewData.designation : 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Location
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.location }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Password
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.password }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Confirm Password
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.confirmPassword }}
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
