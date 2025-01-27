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
    rolecode?: string;
    rolename?: string;
    roleId?: string;
    admin?: string;
    goodsReceiving?: string;
    planning?: string;
    qualityCheck?: string;
    blending?: string;
    machineStation_Production?: string;
    qcInspection?: string;
    postProductionChemicalTreatment?: string;
    postProductionBlow?: string;
    packing?: string;
    packageHolding?: string;
}

interface UserAccess {
    userId: string;
    roleAccessManagements?: string[];
}



let cachedUserAccess: UserAccess[] | null = null;

function getUserAccessData(): Promise<UserAccess[]> {
    return new Promise((resolve, reject) => {
        if (cachedUserAccess) {
            resolve(cachedUserAccess); // Return cached data
        } else {
            fetch("http://10.87.0.33:8082/api/UserAccessManagement")
                .then((response) => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.json();
                })
                .then((data) => {
                    if (data && Array.isArray(data.result)) {
                        cachedUserAccess = data.result as UserAccess[];
                        resolve(cachedUserAccess);
                    } else {
                        throw new Error("Unexpected response format");
                    }
                })
                .catch((error) => reject(error));
        }
    });
}



const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
    field: "rolecode",
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
                    title: "User ID",
                    minWidth: 230,
                    responsive: 0,
                    field: "userId",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: false,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.roleId}</div>
              </div>`;
                    },
                },
                {
                    title: "ROLE CODE",
                    minWidth: 200,
                    responsive: 0,
                    field: "rolecode",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: true,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.rolecode}</div>
              </div>`;
                    },
                },
                {
                    title: "ROLE NAME",
                    minWidth: 200,
                    responsive: 0,
                    field: "rolename",
                    vertAlign: "middle",
                    print: false,
                    download: false,
                    visible: true,
                    formatter(cell) {
                        const response: Response = cell.getData();
                        return `<div>
                <div class="font-medium whitespace-nowrap">${response.rolename}</div>
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
    print: false,
    download: false,
    formatter(cell) {
        const container = document.createElement("div");
        container.classList.add(
            "flex",
            "items-center",
            "gap-3",
            "justify-center",
            "flex-nowrap", // Prevent wrapping
            "overflow-x-auto", // Enable horizontal scrolling
            "whitespace-nowrap" // Prevent text wrapping
        );

        const response = cell.getData();
        const loggedInUserId = localStorage.getItem("userId");

        // Placeholder for loading
        container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

        getUserAccessData()
            .then((userAccessData) => {
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear the placeholder
                container.innerHTML = "";

                if (userAccess) {
                    // Conditionally render "Edit" link
                    if (userAccess.roleAccessManagements?.includes("Edit")) {
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
    field: "rolecode",
    type: "like",
    value: "",
  });
  onFilter();
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

const loading = ref<boolean>(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/RoleAccessManagement/';

onMounted(() => {
    loading.value = true; // Show loading modal at the start

    axios.get(API_BASE_URL)
        .then(response => {
            // Filter out data with status "InActive"
            const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
            console.log(filteredData);

            // Populate the table with filtered data
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

    // Initialize other functions that don’t need loading control
    initTabulator();
    reInitOnResizeWindow();
    fetchItems();
});


// Form Data
const editFormData = reactive({
  id: null,
  userId: "",
  accessUserId: "",
  accessManagementId: "",
  admin: "",
  userAccessManagements: "",
  roleAccessManagements: "",
  roleMaster: "",
  locationMaster: "",
  shiftMaster: "",
  vendorMaster: "",
  movementMaster: "",
  machineMaster: "",
  machineTypeMaster: "",
  machineLocationMaster: "",
  platformMaster: "",
  partNumberMaster: "",
  powderMaster: "",
  productGroupMaster: "",
  binMaster: "",
  cartonMaster: "",
  cartonStickerMaster: "",
  bagMaster: "",
  bagStickerMaster: "",
  valueStreamMaster: "",
  holdingBagMaster: "",
  goodsReceiving: "",
  goodsReceive: "",
  binHolding: "",
  planning: "",
  qualityCheck: "",
  warehouse: "",
  warehouseRequest: "",
  blendingJobs: "",
  machineStationJobs: "",
  inProcessQualityCheck: "",
  plasmaTreatmentJob: "",
  deburringJob: "",
  dedustingJob: "",
  wetTreatmentJob: "",
  secondaryProcess: "",
  chemicalTreatmentJobs: "",
  blowerJobs: "",
  outgoingQualityCheck: "",
  packingJob: "",
  blending: "",
  machineStation_Production: "",
  qcInspection: "",
  postProductionChemicalTreatment: "",
  postProductionBlow: "",
  deleteGoodsReceiving: false,
  deletePlanning: false,
  packing: "",
  packageHolding: "",
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  division: "",
  designation: "",
  location: "",
  remarks: "",
  roleId: "",
  employeeid: "",
  password: "",
  confirmPassword: "",
  isRegisteredUser: false,
  isPwdEdit: false,
  names: [] as string[],
});



const viewData = reactive({
  id: '',
  userId: "",
  admin: "",
  userAccessManagements: "",
  roleAccessManagements: "",
  roleMaster: "",
  locationMaster: "",
  shiftMaster: "",
  vendorMaster: "",
  movementMaster: "",
  machineMaster: "",
  machineTypeMaster: "",
  machineLocationMaster: "",
  platformMaster: "",
  partNumberMaster: "",
  powderMaster: "",
  productGroupMaster: "",
  binMaster: "",
  cartonMaster: "",
  cartonStickerMaster: "",
  bagMaster: "",
  bagStickerMaster: "",
  valueStreamMaster: "",
  holdingBagMaster: "",
  goodsReceiving: "",
  goodsReceive: "",
  binHolding: "",
  warehouse: "",
  warehouseRequest: "",
  planning: "",
  qualityCheck: "",
  blending: "",
  machineStation_Production: "",
  qcInspection: "",
  blendingJobs: "",
  machineStationJobs: "",
  inProcessQualityCheck: "",
  plasmaTreatmentJob: "",
  deburringJob: "",
  dedustingJob: "",
  wetTreatmentJob: "",
  secondaryProcess: "",
  chemicalTreatmentJobs: "",
  blowerJobs: "",
  outgoingQualityCheck: "",
  packingJob: "",
  postProductionChemicalTreatment: "",
  postProductionBlow: "",
  packing: "",
  packageHolding: "",
  firstName: "",
  lastName: "",
  email: "",
  department: "",
  division: "",
  designation: "",
  location: "",
  remarks: "",
  roleId: "",
  employeeid: "",
  password: "",
  roleName: "",
  confirmPassword: "",
  deleteGoodsReceiving: false,
  deletePlanning: false,
});

// Define a type for the allowed actions
type GRAccess = 'View' | 'Edit' | 'Create' | 'Delete';
type RoleAccessAction = 'View' | 'Edit' | 'Create' | 'Delete';

const adminChecked = computed({
  get() {
    return editFormData.admin === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.admin = checked ? 'View,Create,Edit,Delete' : 'Delete';
  }
});

// Define a type for the allowed actions
type UserAccessManagementsAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createUserAccessManagementsCheckboxComputed(action: UserAccessManagementsAction) {
  return computed({
    get() {
      return editFormData.userAccessManagements.includes(action);
    },
    set(checked) {
      updateUserAccessManagements(checked, action);
    }
  });
}

// Create computed properties for each action
const viewUserAccessManagementsChecked = createUserAccessManagementsCheckboxComputed('View');
const editUserAccessManagementsChecked = createUserAccessManagementsCheckboxComputed('Edit');
const createUserAccessManagementsChecked = createUserAccessManagementsCheckboxComputed('Create');
const deleteUserAccessManagementsChecked = createUserAccessManagementsCheckboxComputed('Delete');

// Update the userAccessManagements string based on checkbox selections
function updateUserAccessManagements(checked: boolean, action: UserAccessManagementsAction) {
  const actions = editFormData.userAccessManagements.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.userAccessManagements = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewUserAccessManagementsChecked.value) {
    editFormData.userAccessManagements = '';  // Reset the whole string
  }
}




// Helper function to generate computed properties for each action
function createRoleAccessCheckboxComputed(action: RoleAccessAction) {
  return computed({
    get() {
      return editFormData.roleAccessManagements.includes(action);
    },
    set(checked) {
      updateRoleAccessManagement(checked, action);
    }
  });
}

// Create computed properties for each action
const viewRoleAccessChecked = createRoleAccessCheckboxComputed('View');
const editRoleAccessChecked = createRoleAccessCheckboxComputed('Edit');
const createRoleAccessChecked = createRoleAccessCheckboxComputed('Create');
const deleteRoleAccessChecked = createRoleAccessCheckboxComputed('Delete');

// Update the roleAccessManagements string based on checkbox selections
function updateRoleAccessManagement(checked: boolean, action: RoleAccessAction) {
  const actions = editFormData.roleAccessManagements.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.roleAccessManagements = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewRoleAccessChecked.value) {
    editFormData.roleAccessManagements = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type RoleMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createRoleMasterCheckboxComputed(action: RoleMasterAction) {
  return computed({
    get() {
      return editFormData.roleMaster.includes(action);
    },
    set(checked) {
      updateRoleMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewRoleMasterChecked = createRoleMasterCheckboxComputed('View');
const editRoleMasterChecked = createRoleMasterCheckboxComputed('Edit');
const createRoleMasterChecked = createRoleMasterCheckboxComputed('Create');
const deleteRoleMasterChecked = createRoleMasterCheckboxComputed('Delete');

// Update the roleMaster string based on checkbox selections
function updateRoleMaster(checked: boolean, action: RoleMasterAction) {
  const actions = editFormData.roleMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.roleMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewRoleMasterChecked.value) {
    editFormData.roleMaster = ''; // Reset the whole string
  }
}

// Define a type for the allowed actions
type LocationMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createLocationMasterCheckboxComputed(action: LocationMasterAction) {
  return computed({
    get() {
      return editFormData.locationMaster.includes(action);
    },
    set(checked) {
      updateLocationMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewLocationMasterChecked = createLocationMasterCheckboxComputed('View');
const editLocationMasterChecked = createLocationMasterCheckboxComputed('Edit');
const createLocationMasterChecked = createLocationMasterCheckboxComputed('Create');
const deleteLocationMasterChecked = createLocationMasterCheckboxComputed('Delete');

// Update the locationMaster string based on checkbox selections
function updateLocationMaster(checked: boolean, action: LocationMasterAction) {
  const actions = editFormData.locationMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.locationMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewLocationMasterChecked.value) {
    editFormData.locationMaster = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type ShiftMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createShiftMasterCheckboxComputed(action: ShiftMasterAction) {
  return computed({
    get() {
      return editFormData.shiftMaster.includes(action);
    },
    set(checked) {
      updateShiftMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewShiftMasterChecked = createShiftMasterCheckboxComputed('View');
const editShiftMasterChecked = createShiftMasterCheckboxComputed('Edit');
const createShiftMasterChecked = createShiftMasterCheckboxComputed('Create');
const deleteShiftMasterChecked = createShiftMasterCheckboxComputed('Delete');

// Update the shiftMaster string based on checkbox selections
function updateShiftMaster(checked: boolean, action: ShiftMasterAction) {
  const actions = editFormData.shiftMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.shiftMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewShiftMasterChecked.value) {
    editFormData.shiftMaster = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type VendorMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createVendorMasterCheckboxComputed(action: VendorMasterAction) {
  return computed({
    get() {
      return editFormData.vendorMaster.includes(action);
    },
    set(checked) {
      updateVendorMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewVendorMasterChecked = createVendorMasterCheckboxComputed('View');
const editVendorMasterChecked = createVendorMasterCheckboxComputed('Edit');
const createVendorMasterChecked = createVendorMasterCheckboxComputed('Create');
const deleteVendorMasterChecked = createVendorMasterCheckboxComputed('Delete');

// Update the vendorMaster string based on checkbox selections
function updateVendorMaster(checked: boolean, action: VendorMasterAction) {
  const actions = editFormData.vendorMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.vendorMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewVendorMasterChecked.value) {
    editFormData.vendorMaster = '';  // Reset the whole string
  }
}



// Define a type for the allowed actions
type MachineMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createMachineMasterCheckboxComputed(action: MachineMasterAction) {
  return computed({
    get() {
      return editFormData.machineMaster.includes(action);
    },
    set(checked) {
      updateMachineMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewMachineMasterChecked = createMachineMasterCheckboxComputed('View');
const editMachineMasterChecked = createMachineMasterCheckboxComputed('Edit');
const createMachineMasterChecked = createMachineMasterCheckboxComputed('Create');
const deleteMachineMasterChecked = createMachineMasterCheckboxComputed('Delete');

// Update the machineMaster string based on checkbox selections
function updateMachineMaster(checked: boolean, action: MachineMasterAction) {
  const actions = editFormData.machineMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.machineMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewMachineMasterChecked.value) {
    editFormData.machineMaster = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type MachineTypeMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createMachineTypeMasterCheckboxComputed(action: MachineTypeMasterAction) {
  return computed({
    get() {
      return editFormData.machineTypeMaster.includes(action);
    },
    set(checked) {
      updateMachineTypeMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewMachineTypeMasterChecked = createMachineTypeMasterCheckboxComputed('View');
const editMachineTypeMasterChecked = createMachineTypeMasterCheckboxComputed('Edit');
const createMachineTypeMasterChecked = createMachineTypeMasterCheckboxComputed('Create');
const deleteMachineTypeMasterChecked = createMachineTypeMasterCheckboxComputed('Delete');

// Update the machineTypeMaster string based on checkbox selections
function updateMachineTypeMaster(checked: boolean, action: MachineTypeMasterAction) {
  const actions = editFormData.machineTypeMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.machineTypeMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewMachineTypeMasterChecked.value) {
    editFormData.machineTypeMaster = '';  // Reset the whole string
  }
}



// Define a type for the allowed actions
type PlatformMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPlatformMasterCheckboxComputed(action: PlatformMasterAction) {
  return computed({
    get() {
      return editFormData.platformMaster.includes(action);
    },
    set(checked) {
      updatePlatformMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPlatformMasterChecked = createPlatformMasterCheckboxComputed('View');
const editPlatformMasterChecked = createPlatformMasterCheckboxComputed('Edit');
const createPlatformMasterChecked = createPlatformMasterCheckboxComputed('Create');
const deletePlatformMasterChecked = createPlatformMasterCheckboxComputed('Delete');

// Update the platformMaster string based on checkbox selections
function updatePlatformMaster(checked: boolean, action: PlatformMasterAction) {
  const actions = editFormData.platformMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.platformMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPlatformMasterChecked.value) {
    editFormData.platformMaster = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type ProductMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createProductMasterCheckboxComputed(action: ProductMasterAction) {
  return computed({
    get() {
      return editFormData.partNumberMaster.includes(action);
    },
    set(checked) {
      updateProductMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewProductMasterChecked = createProductMasterCheckboxComputed('View');
const editProductMasterChecked = createProductMasterCheckboxComputed('Edit');
const createProductMasterChecked = createProductMasterCheckboxComputed('Create');
const deleteProductMasterChecked = createProductMasterCheckboxComputed('Delete');

// Update the productMaster string based on checkbox selections
function updateProductMaster(checked: boolean, action: ProductMasterAction) {
  const actions = editFormData.partNumberMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.partNumberMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewProductMasterChecked.value) {
    editFormData.partNumberMaster = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type PowderMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPowderMasterCheckboxComputed(action: PowderMasterAction) {
  return computed({
    get() {
      return editFormData.powderMaster.includes(action);
    },
    set(checked) {
      updatePowderMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPowderMasterChecked = createPowderMasterCheckboxComputed('View');
const editPowderMasterChecked = createPowderMasterCheckboxComputed('Edit');
const createPowderMasterChecked = createPowderMasterCheckboxComputed('Create');
const deletePowderMasterChecked = createPowderMasterCheckboxComputed('Delete');

// Update the cartonStickerMaster (Powder Master) string based on checkbox selections
function updatePowderMaster(checked: boolean, action: PowderMasterAction) {
  const actions = editFormData.powderMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.powderMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPowderMasterChecked.value) {
    editFormData.powderMaster = '';  // Reset the whole string
  }
}




// Define a type for the allowed actions
type BinMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createBinMasterCheckboxComputed(action: BinMasterAction) {
  return computed({
    get() {
      return editFormData.binMaster.includes(action);
    },
    set(checked) {
      updateBinMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewBinMasterChecked = createBinMasterCheckboxComputed('View');
const editBinMasterChecked = createBinMasterCheckboxComputed('Edit');
const createBinMasterChecked = createBinMasterCheckboxComputed('Create');
const deleteBinMasterChecked = createBinMasterCheckboxComputed('Delete');

// Update the binMaster string based on checkbox selections
function updateBinMaster(checked: boolean, action: BinMasterAction) {
  const actions = editFormData.binMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.binMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewBinMasterChecked.value) {
    editFormData.binMaster = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type SecondaryProcessAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createSecondaryProcessCheckboxComputed(action: SecondaryProcessAction) {
  return computed({
    get() {
      return editFormData.secondaryProcess.includes(action);
    },
    set(checked) {
      updateSecondaryProcess(checked, action);
    }
  });
}

// Create computed properties for each action
const viewSecondaryProcessChecked = createSecondaryProcessCheckboxComputed('View');
const editSecondaryProcessChecked = createSecondaryProcessCheckboxComputed('Edit');
const createSecondaryProcessChecked = createSecondaryProcessCheckboxComputed('Create');
const deleteSecondaryProcessChecked = createSecondaryProcessCheckboxComputed('Delete');

// Update the secondaryProcess string based on checkbox selections
function updateSecondaryProcess(checked: boolean, action: SecondaryProcessAction) {
  const actions = editFormData.secondaryProcess.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.secondaryProcess = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewSecondaryProcessChecked.value) {
    editFormData.secondaryProcess = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type CartonMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createCartonMasterCheckboxComputed(action: CartonMasterAction) {
  return computed({
    get() {
      return editFormData.cartonMaster.includes(action);
    },
    set(checked) {
      updateCartonMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewCartonMasterChecked = createCartonMasterCheckboxComputed('View');
const editCartonMasterChecked = createCartonMasterCheckboxComputed('Edit');
const createCartonMasterChecked = createCartonMasterCheckboxComputed('Create');
const deleteCartonMasterChecked = createCartonMasterCheckboxComputed('Delete');

// Update the cartonMaster string based on checkbox selections
function updateCartonMaster(checked: boolean, action: CartonMasterAction) {
  const actions = editFormData.cartonMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.cartonMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewCartonMasterChecked.value) {
    editFormData.cartonMaster = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type BagMasterAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createBagMasterCheckboxComputed(action: BagMasterAction) {
  return computed({
    get() {
      return editFormData.bagMaster.includes(action);
    },
    set(checked) {
      updateBagMaster(checked, action);
    }
  });
}

// Create computed properties for each action
const viewBagMasterChecked = createBagMasterCheckboxComputed('View');
const editBagMasterChecked = createBagMasterCheckboxComputed('Edit');
const createBagMasterChecked = createBagMasterCheckboxComputed('Create');
const deleteBagMasterChecked = createBagMasterCheckboxComputed('Delete');

// Update the bagMaster string based on checkbox selections
function updateBagMaster(checked: boolean, action: BagMasterAction) {
  const actions = editFormData.bagMaster.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.bagMaster = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewBagMasterChecked.value) {
    editFormData.bagMaster = '';  // Reset the whole string
  }
}


const bagStickerMasterChecked = computed({
  get() {
    return editFormData.bagStickerMaster === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.bagStickerMaster = checked ? 'View,Create,Edit,Delete' : '';
  }
});

const valueStreamMasterChecked = computed({
  get() {
    return editFormData.valueStreamMaster === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.valueStreamMaster = checked ? 'View,Create,Edit,Delete' : '';
  }
});

const binholding = computed({
  get() {
    return editFormData.binHolding === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.binHolding = checked ? 'View,Create,Edit,Delete' : '';
  }
});


// Helper function to generate computed properties for each action
function createCheckboxComputed(action: GRAccess) {
  return computed({
    get() {
      return editFormData.goodsReceiving.includes(action);
    },
    set(checked) {
      updateGoodsReceiving(checked, action);
    }
  });
}

// Create computed properties for each action
const viewChecked = createCheckboxComputed('View');
const editChecked = createCheckboxComputed('Edit');
const createChecked = createCheckboxComputed('Create');
const deleteChecked = createCheckboxComputed('Delete');

// Update the goodsReceiving string based on checkbox selections
function updateGoodsReceiving(checked: boolean, action: GRAccess) {
  const actions = editFormData.goodsReceiving.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.goodsReceiving = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewChecked.value) {
    editFormData.goodsReceiving = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type BinHoldingAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createBinHoldingCheckboxComputed(action: BinHoldingAction) {
  return computed({
    get() {
      return editFormData.binHolding.includes(action);
    },
    set(checked) {
      updateBinHolding(checked, action);
    }
  });
}

// Create computed properties for each action
const viewBinHoldingChecked = createBinHoldingCheckboxComputed('View');
const editBinHoldingChecked = createBinHoldingCheckboxComputed('Edit');
const createBinHoldingChecked = createBinHoldingCheckboxComputed('Create');
const deleteBinHoldingChecked = createBinHoldingCheckboxComputed('Delete');

// Update the binHolding string based on checkbox selections
function updateBinHolding(checked: boolean, action: BinHoldingAction) {
  const actions = editFormData.binHolding.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.binHolding = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewBinHoldingChecked.value) {
    editFormData.binHolding = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type WarehouseAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createWarehouseCheckboxComputed(action: WarehouseAction) {
  return computed({
    get() {
      return editFormData.warehouse.includes(action);
    },
    set(checked) {
      updateWarehouse(checked, action);
    }
  });
}

// Create computed properties for each action
const viewWarehouseChecked = createWarehouseCheckboxComputed('View');
const editWarehouseChecked = createWarehouseCheckboxComputed('Edit');
const createWarehouseChecked = createWarehouseCheckboxComputed('Create');
const deleteWarehouseChecked = createWarehouseCheckboxComputed('Delete');

// Update the warehouse string based on checkbox selections
function updateWarehouse(checked: boolean, action: WarehouseAction) {
  const actions = editFormData.warehouse.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.warehouse = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewWarehouseChecked.value) {
    editFormData.warehouse = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type PlanningAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPlanningCheckboxComputed(action: PlanningAction) {
  return computed({
    get() {
      return editFormData.planning.includes(action);
    },
    set(checked) {
      updatePlanning(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPlanningChecked = createPlanningCheckboxComputed('View');
const editPlanningChecked = createPlanningCheckboxComputed('Edit');
const createPlanningChecked = createPlanningCheckboxComputed('Create');
const deletePlanningChecked = createPlanningCheckboxComputed('Delete');

// Update the planning string based on checkbox selections
function updatePlanning(checked: boolean, action: PlanningAction) {
  const actions = editFormData.planning.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.planning = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPlanningChecked.value) {
    editFormData.planning = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type GoodsReceiveAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createGoodsReceiveCheckboxComputed(action: GoodsReceiveAction) {
  return computed({
    get() {
      return editFormData.goodsReceive.includes(action);
    },
    set(checked) {
      updateGoodsReceive(checked, action);
    }
  });
}

// Create computed properties for each action
const viewGoodsReceiveChecked = createGoodsReceiveCheckboxComputed('View');
const editGoodsReceiveChecked = createGoodsReceiveCheckboxComputed('Edit');
const createGoodsReceiveChecked = createGoodsReceiveCheckboxComputed('Create');
const deleteGoodsReceiveChecked = createGoodsReceiveCheckboxComputed('Delete');

// Update the goodsReceive string based on checkbox selections
function updateGoodsReceive(checked: boolean, action: GoodsReceiveAction) {
  const actions = editFormData.goodsReceive.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.goodsReceive = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewGoodsReceiveChecked.value) {
    editFormData.goodsReceive = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type WarehouseRequestAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createWarehouseRequestCheckboxComputed(action: WarehouseRequestAction) {
  return computed({
    get() {
      return editFormData.warehouseRequest.includes(action);
    },
    set(checked) {
      updateWarehouseRequest(checked, action);
    }
  });
}

// Create computed properties for each action
const viewWarehouseRequestChecked = createWarehouseRequestCheckboxComputed('View');
const editWarehouseRequestChecked = createWarehouseRequestCheckboxComputed('Edit');
const createWarehouseRequestChecked = createWarehouseRequestCheckboxComputed('Create');
const deleteWarehouseRequestChecked = createWarehouseRequestCheckboxComputed('Delete');

// Update the warehouseRequest string based on checkbox selections
function updateWarehouseRequest(checked: boolean, action: WarehouseRequestAction) {
  const actions = editFormData.warehouseRequest.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.warehouseRequest = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewWarehouseRequestChecked.value) {
    editFormData.warehouseRequest = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type BlendingAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createBlendingCheckboxComputed(action: BlendingAction) {
  return computed({
    get() {
      return editFormData.blending.includes(action);
    },
    set(checked) {
      updateBlending(checked, action);
    }
  });
}

// Create computed properties for each action
const viewBlendingChecked = createBlendingCheckboxComputed('View');
const editBlendingChecked = createBlendingCheckboxComputed('Edit');
const createBlendingChecked = createBlendingCheckboxComputed('Create');
const deleteBlendingChecked = createBlendingCheckboxComputed('Delete');

// Update the blending string based on checkbox selections
function updateBlending(checked: boolean, action: BlendingAction) {
  const actions = editFormData.blending.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.blending = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewBlendingChecked.value) {
    editFormData.blending = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type BlendingJobsAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createBlendingJobsCheckboxComputed(action: BlendingJobsAction) {
  return computed({
    get() {
      return editFormData.blendingJobs.includes(action);
    },
    set(checked) {
      updateBlendingJobs(checked, action);
    }
  });
}

// Create computed properties for each action
const viewBlendingJobsChecked = createBlendingJobsCheckboxComputed('View');
const editBlendingJobsChecked = createBlendingJobsCheckboxComputed('Edit');
const createBlendingJobsChecked = createBlendingJobsCheckboxComputed('Create');
const deleteBlendingJobsChecked = createBlendingJobsCheckboxComputed('Delete');

// Update the blendingJobs string based on checkbox selections
function updateBlendingJobs(checked: boolean, action: BlendingJobsAction) {
  const actions = editFormData.blendingJobs.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.blendingJobs = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewBlendingJobsChecked.value) {
    editFormData.blendingJobs = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type MachineStationJobsAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createMachineStationJobsCheckboxComputed(action: MachineStationJobsAction) {
  return computed({
    get() {
      return editFormData.machineStationJobs.includes(action);
    },
    set(checked) {
      updateMachineStationJobs(checked, action);
    }
  });
}

// Create computed properties for each action
const viewMachineStationJobsChecked = createMachineStationJobsCheckboxComputed('View');
const editMachineStationJobsChecked = createMachineStationJobsCheckboxComputed('Edit');
const createMachineStationJobsChecked = createMachineStationJobsCheckboxComputed('Create');
const deleteMachineStationJobsChecked = createMachineStationJobsCheckboxComputed('Delete');

// Update the machineStationJobs string based on checkbox selections
function updateMachineStationJobs(checked: boolean, action: MachineStationJobsAction) {
  const actions = editFormData.machineStationJobs.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.machineStationJobs = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewMachineStationJobsChecked.value) {
    editFormData.machineStationJobs = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type InProcessQualityCheckAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createInProcessQualityCheckCheckboxComputed(action: InProcessQualityCheckAction) {
  return computed({
    get() {
      return editFormData.inProcessQualityCheck.includes(action);
    },
    set(checked) {
      updateInProcessQualityCheck(checked, action);
    }
  });
}

// Create computed properties for each action
const viewInProcessQualityCheckChecked = createInProcessQualityCheckCheckboxComputed('View');
const editInProcessQualityCheckChecked = createInProcessQualityCheckCheckboxComputed('Edit');
const createInProcessQualityCheckChecked = createInProcessQualityCheckCheckboxComputed('Create');
const deleteInProcessQualityCheckChecked = createInProcessQualityCheckCheckboxComputed('Delete');

// Update the inProcessQualityCheck string based on checkbox selections
function updateInProcessQualityCheck(checked: boolean, action: InProcessQualityCheckAction) {
  const actions = editFormData.inProcessQualityCheck.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.inProcessQualityCheck = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewInProcessQualityCheckChecked.value) {
    editFormData.inProcessQualityCheck = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type WetTreatmentJobAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createWetTreatmentJobCheckboxComputed(action: WetTreatmentJobAction) {
  return computed({
    get() {
      return editFormData.wetTreatmentJob.includes(action);
    },
    set(checked) {
      updateWetTreatmentJob(checked, action);
    }
  });
}

// Create computed properties for each action
const viewWetTreatmentJobChecked = createWetTreatmentJobCheckboxComputed('View');
const editWetTreatmentJobChecked = createWetTreatmentJobCheckboxComputed('Edit');
const createWetTreatmentJobChecked = createWetTreatmentJobCheckboxComputed('Create');
const deleteWetTreatmentJobChecked = createWetTreatmentJobCheckboxComputed('Delete');

// Update the wetTreatmentJob string based on checkbox selections
function updateWetTreatmentJob(checked: boolean, action: WetTreatmentJobAction) {
  const actions = editFormData.wetTreatmentJob.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.wetTreatmentJob = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewWetTreatmentJobChecked.value) {
    editFormData.wetTreatmentJob = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type PlasmaTreatmentJobAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPlasmaTreatmentJobCheckboxComputed(action: PlasmaTreatmentJobAction) {
  return computed({
    get() {
      return editFormData.plasmaTreatmentJob.includes(action);
    },
    set(checked) {
      updatePlasmaTreatmentJob(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPlasmaTreatmentJobChecked = createPlasmaTreatmentJobCheckboxComputed('View');
const editPlasmaTreatmentJobChecked = createPlasmaTreatmentJobCheckboxComputed('Edit');
const createPlasmaTreatmentJobChecked = createPlasmaTreatmentJobCheckboxComputed('Create');
const deletePlasmaTreatmentJobChecked = createPlasmaTreatmentJobCheckboxComputed('Delete');

// Update the plasmaTreatmentJob string based on checkbox selections
function updatePlasmaTreatmentJob(checked: boolean, action: PlasmaTreatmentJobAction) {
  const actions = editFormData.plasmaTreatmentJob.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.plasmaTreatmentJob = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPlasmaTreatmentJobChecked.value) {
    editFormData.plasmaTreatmentJob = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type DeburringJobAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createDeburringJobCheckboxComputed(action: DeburringJobAction) {
  return computed({
    get() {
      return editFormData.deburringJob.includes(action);
    },
    set(checked) {
      updateDeburringJob(checked, action);
    }
  });
}

// Create computed properties for each action
const viewDeburringJobChecked = createDeburringJobCheckboxComputed('View');
const editDeburringJobChecked = createDeburringJobCheckboxComputed('Edit');
const createDeburringJobChecked = createDeburringJobCheckboxComputed('Create');
const deleteDeburringJobChecked = createDeburringJobCheckboxComputed('Delete');

// Update the deburringJob string based on checkbox selections
function updateDeburringJob(checked: boolean, action: DeburringJobAction) {
  const actions = editFormData.deburringJob.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.deburringJob = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewDeburringJobChecked.value) {
    editFormData.deburringJob = '';  // Reset the whole string
  }
}

// Define a type for the allowed actions
type DedustingJobAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createDedustingJobCheckboxComputed(action: DedustingJobAction) {
  return computed({
    get() {
      return editFormData.dedustingJob.includes(action);
    },
    set(checked) {
      updateDedustingJob(checked, action);
    }
  });
}

// Create computed properties for each action
const viewDedustingJobChecked = createDedustingJobCheckboxComputed('View');
const editDedustingJobChecked = createDedustingJobCheckboxComputed('Edit');
const createDedustingJobChecked = createDedustingJobCheckboxComputed('Create');
const deleteDedustingJobChecked = createDedustingJobCheckboxComputed('Delete');

// Update the dedustingJob string based on checkbox selections
function updateDedustingJob(checked: boolean, action: DedustingJobAction) {
  const actions = editFormData.dedustingJob.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.dedustingJob = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewDedustingJobChecked.value) {
    editFormData.dedustingJob = '';  // Reset the whole string
  }
}


const chemicalTreatmentJobs = computed({
  get() {
    return editFormData.chemicalTreatmentJobs === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.chemicalTreatmentJobs = checked ? 'View,Create,Edit,Delete' : '';
  }
});

const blowerJobs = computed({
  get() {
    return editFormData.blowerJobs === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.blowerJobs = checked ? 'View,Create,Edit,Delete' : '';
  }
});

// Define a type for the allowed actions
type OutgoingQualityCheckAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createOutgoingQualityCheckCheckboxComputed(action: OutgoingQualityCheckAction) {
  return computed({
    get() {
      return editFormData.outgoingQualityCheck.includes(action);
    },
    set(checked) {
      updateOutgoingQualityCheck(checked, action);
    }
  });
}

// Create computed properties for each action
const viewOutgoingQualityCheckChecked = createOutgoingQualityCheckCheckboxComputed('View');
const editOutgoingQualityCheckChecked = createOutgoingQualityCheckCheckboxComputed('Edit');
const createOutgoingQualityCheckChecked = createOutgoingQualityCheckCheckboxComputed('Create');
const deleteOutgoingQualityCheckChecked = createOutgoingQualityCheckCheckboxComputed('Delete');

// Update the outgoingQualityCheck string based on checkbox selections
function updateOutgoingQualityCheck(checked: boolean, action: OutgoingQualityCheckAction) {
  const actions = editFormData.outgoingQualityCheck.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.outgoingQualityCheck = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewOutgoingQualityCheckChecked.value) {
    editFormData.outgoingQualityCheck = '';  // Reset the whole string
  }
}


// Define a type for the allowed actions
type PackingJobAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPackingJobCheckboxComputed(action: PackingJobAction) {
  return computed({
    get() {
      return editFormData.packingJob.includes(action);
    },
    set(checked) {
      updatePackingJob(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPackingJobChecked = createPackingJobCheckboxComputed('View');
const editPackingJobChecked = createPackingJobCheckboxComputed('Edit');
const createPackingJobChecked = createPackingJobCheckboxComputed('Create');
const deletePackingJobChecked = createPackingJobCheckboxComputed('Delete');

// Update the packingJob string based on checkbox selections
function updatePackingJob(checked: boolean, action: PackingJobAction) {
  const actions = editFormData.packingJob.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.packingJob = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPackingJobChecked.value) {
    editFormData.packingJob = '';  // Reset the whole string
  }
}



// Define a type for the allowed actions
type MachineStationProductionAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createMachineStationProductionCheckboxComputed(action: MachineStationProductionAction) {
  return computed({
    get() {
      return editFormData.machineStation_Production.includes(action);
    },
    set(checked) {
      updateMachineStationProduction(checked, action);
    }
  });
}

// Create computed properties for each action
const viewMachineStationProductionChecked = createMachineStationProductionCheckboxComputed('View');
const editMachineStationProductionChecked = createMachineStationProductionCheckboxComputed('Edit');
const createMachineStationProductionChecked = createMachineStationProductionCheckboxComputed('Create');
const deleteMachineStationProductionChecked = createMachineStationProductionCheckboxComputed('Delete');

// Update the machineStation_Production string based on checkbox selections
function updateMachineStationProduction(checked: boolean, action: MachineStationProductionAction) {
  const actions = editFormData.machineStation_Production.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.machineStation_Production = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewMachineStationProductionChecked.value) {
    editFormData.machineStation_Production = '';  // Reset the whole string
  }
}


const qcInspection = computed({
  get() {
    return editFormData.qcInspection === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.qcInspection = checked ? 'View,Create,Edit,Delete' : 'Delete';
  }
});

const postProductionChemicalTreatment = computed({
  get() {
    return editFormData.warehouseRequest === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.postProductionChemicalTreatment = checked ? 'View,Create,Edit,Delete' : 'Delete';
  }
});

const postProductionBlow = computed({
  get() {
    return editFormData.postProductionBlow === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.postProductionBlow = checked ? 'View,Create,Edit,Delete' : 'Delete';
  }
});

// Define a type for the allowed actions
type PackingAction = 'View' | 'Edit' | 'Create' | 'Delete';

// Helper function to generate computed properties for each action
function createPackingCheckboxComputed(action: PackingAction) {
  return computed({
    get() {
      return editFormData.packing.includes(action);
    },
    set(checked) {
      updatePacking(checked, action);
    }
  });
}

// Create computed properties for each action
const viewPackingChecked = createPackingCheckboxComputed('View');
const editPackingChecked = createPackingCheckboxComputed('Edit');
const createPackingChecked = createPackingCheckboxComputed('Create');
const deletePackingChecked = createPackingCheckboxComputed('Delete');

// Update the packing string based on checkbox selections
function updatePacking(checked: boolean, action: PackingAction) {
  const actions = editFormData.packing.split(',').map(a => a.trim()).filter(Boolean);

  if (checked) {
    if (!actions.includes(action)) {
      actions.push(action);
    }
  } else {
    const index = actions.indexOf(action);
    if (index !== -1) {
      actions.splice(index, 1);
    }
  }

  editFormData.packing = actions.join(', ');

  // If 'View' is unchecked, also uncheck and disable other options
  if (!viewPackingChecked.value) {
    editFormData.packing = '';  // Reset the whole string
  }
}


const packageHolding = computed({
  get() {
    return editFormData.packageHolding === 'View,Create,Edit,Delete';
  },
  set(checked) {
    editFormData.packageHolding = checked ? 'View,Create,Edit,Delete' : 'Delete';
  }
});

// Define reactive permission variables for roleAccessManagements
const canEditRoleAccessManagements = ref(false);

// Define the fetchUserRoleAccessPermissions function
const fetchUserRoleAccessPermissions = async () => {
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

            const roleAccessManagements = userDetails.roleAccessManagements || ''; // Ensure the value is a string

            // Check if the string contains "Edit" for roleAccessManagements
            canEditRoleAccessManagements.value = roleAccessManagements.includes('Edit');

            console.log('canEditRoleAccessManagements:', canEditRoleAccessManagements.value); // Debugging log
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
    await fetchUserRoleAccessPermissions();
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
    console.log(`Fetching data for ID: ${id}`); // Log fetching ID
    loading.value = true; // Start loading animation

    axios.get(`${API_BASE_URL}${id}`)
        .then(response => {
            const data = response.data.result;
            console.log(`Fetched data:`, data); // Log fetched data
            if (data && data.length > 0) {
                const [firstItem] = data;
                Object.assign(formData, {
  id: firstItem.id || '',
  rolecode: firstItem.rolecode || '',
  rolename: firstItem.rolename || '',
  roleId: firstItem.roleId || '',
  admin: firstItem.admin || '',
  goodsReceiving: firstItem.goodsReceiving || '',
  planning: firstItem.planning || '',
  qualityCheck: firstItem.qualityCheck || '',
  blending: firstItem.blending || '',
  machineStation_Production: firstItem.machineStation_Production || '',
  qcInspection: firstItem.qcInspection || '',
  postProductionChemicalTreatment: firstItem.postProductionChemicalTreatment || '',
  postProductionBlow: firstItem.postProductionBlow || '',
  packing: firstItem.packing || '',
  packageHolding: firstItem.packageHolding || '',
  masters: firstItem.masters || '',
  userAccessManagements: firstItem.userAccessManagements || '',
  roleAccessManagements: firstItem.roleAccessManagements || '',
  roleMaster: firstItem.roleMaster || '',
  locationMaster: firstItem.locationMaster || '',
  shiftMaster: firstItem.shiftMaster || '',
  vendorMaster: firstItem.vendorMaster || '',
  machineMaster: firstItem.machineMaster || '',
  machineTypeMaster: firstItem.machineTypeMaster || '',
  platformMaster: firstItem.platformMaster || '',
  binMaster: firstItem.binMaster || '',
  cartonMaster: firstItem.cartonMaster || '',
  bagMaster: firstItem.bagMaster || '',
  goodsReceive: firstItem.goodsReceive || '',
  warehouse: firstItem.warehouse || '',
  production: firstItem.production || '',
  blendingJobs: firstItem.blendingJobs || '',
  machineStationJobs: firstItem.machineStationJobs || '',
  inProcessQualityCheck: firstItem.inProcessQualityCheck || '',
  postProduction: firstItem.postProduction || '',
  outgoingQualityCheck: firstItem.outgoingQualityCheck || '',
  packingJob: firstItem.packingJob || '',
  warehouseRequest: firstItem.warehouseRequest || '',
  secondaryProcess: firstItem.secondaryProcess || '',
  wetTreatmentJob: firstItem.wetTreatmentJob || '',
  plasmaTreatmentJob: firstItem.plasmaTreatmentJob || '',
  deburringJob: firstItem.deburringJob || '',
  dedustingJob: firstItem.dedustingJob || '',
  partNumberMaster: firstItem.partNumberMaster || '',
  powderMaster: firstItem.powderMaster || '',
  stickerMaster: firstItem.stickerMaster || '',
  binHolding: firstItem.binHolding || '',
});

                modalSetter(true); // Open the modal once data is set
            } else {
                console.error('No data found for the specified ID:', id);
            }
        })
        .catch(error => handleError(error, 'Error fetching data for editing'))
        .finally(() => {
            loading.value = false; // End loading animation
        });
};




const editRole = (roleId: string) => fetchAndSetData(roleId, editFormData, setEditSlideOver);
const viewRole = (id: string) => fetchAndSetData(id, viewData, setviewModal, true);

// Update Table Data
const updateTableData = () => {
    loading.value = true; // Show loading modal at the start

axios.get(API_BASE_URL)
    .then(response => {
        // Filter out data with status "InActive"
        const filteredData = response.data.result.filter((item: any) => item.status !== 'InActive');
        console.log(filteredData);

        // Populate the table with filtered data
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

// Initialize other functions that don’t need loading control
initTabulator();
reInitOnResizeWindow();
fetchItems();
};



// Update Role
const updateRole = () => {

    Swal.fire({
        title: 'Are you sure?',
        text: 'This will update the data!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1e40af',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, update it!',
    }).then(result => {
        if (result.isConfirmed && editFormData.roleId) {
            axios.put(`${API_BASE_URL}${editFormData.roleId}`, { ...editFormData })
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





const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
    EditSlideOver.value = value;
};


// Define a reactive variable to control the visibility of the "Blending" row
const isProductionVisible = ref(false);

// Define a method to toggle the visibility
const toggleProduction = () => {
  isProductionVisible.value = !isProductionVisible.value;
};

// Define a reactive variable to control the visibility of the "Planning" row
const isPlanningVisible = ref(false);

// Define a method to toggle the visibility
const togglePlanning = () => {
  isPlanningVisible.value = !isPlanningVisible.value;
};

const isGoodsReceiveVisible = ref(false);

// Define a method to toggle the visibility
const toggleGoodsReceive = () => {
  isGoodsReceiveVisible.value = !isGoodsReceiveVisible.value;
};

const isMasterSectionVisible = ref(false);

// Define a method to toggle the visibility
const toggleMasterSection = () => {
  isMasterSectionVisible.value = !isMasterSectionVisible.value;
};

// Define a reactive variable to control the visibility of the "Post Production" rows
const isPostProductionSectionVisible = ref(false);

// Define a method to toggle the visibility
const togglePostProductionSection = () => {
  isPostProductionSectionVisible.value = !isPostProductionSectionVisible.value;
};

// Define a reactive variable to control the visibility of the "Masters" rows
const isMastersSectionVisible = ref(false);

// Define a method to toggle the visibility
const toggleMastersSection = () => {
  isMastersSectionVisible.value = !isMastersSectionVisible.value;
};

// Define a reactive variable to control the visibility of the "Goods Receive" rows
const isGoodsReceiveSectionVisible = ref(false);

// Define a method to toggle the visibility
const toggleGoodsReceiveSection = () => {
  isGoodsReceiveSectionVisible.value = !isGoodsReceiveSectionVisible.value;
};


// Define a reactive variable to control the visibility of the "Production" rows
const isProductionSectionVisible = ref(false);

// Define a method to toggle the visibility
const toggleProductionSection = () => {
  isProductionSectionVisible.value = !isProductionSectionVisible.value;
};


// Define a reactive variable to control the visibility of the "Planning" rows
const isPlanningSectionVisible = ref(false);

// Define a method to toggle the visibility
const togglePlanningSection = () => {
  isPlanningSectionVisible.value = !isPlanningSectionVisible.value;
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
        <h2 class="mr-auto text-lg font-medium">Role Access Management</h2>

    </div>
    <!-- BEGIN: HTML Table Data -->
    <div class="p-5 mt-5 intro-y box">
    <div class="flex flex-col sm:flex-row sm:items-end xl:items-start">
      <form
        id="tabulator-html-filter-form"
        class="xl:flex sm:mr-auto"
        @submit="
          (e) => {
            e.preventDefault();
            onFilter();
          }
        "
      >
        <div class="items-center sm:flex sm:mr-4">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Field
          </label>
          <FormSelect
            id="tabulator-html-filter-field"
            v-model="filter.field"
            class="w-full mt-2 2xl:w-full sm:mt-0 sm:w-auto"
          >
            <option value="rolecode">Role Code</option>
            <option value="rolename">Role Name</option>
          </FormSelect>
        </div>
        <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0 " style="display:none">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Type
          </label>
          <FormSelect
            id="tabulator-html-filter-type"
            v-model="filter.type"
            class="w-full mt-2 sm:mt-0 sm:w-auto"
          >
            <option value="like">like</option>

          </FormSelect>
        </div>
        <div class="items-center mt-2 sm:flex sm:mr-4 xl:mt-0">
          <label class="flex-none w-12 mr-2 xl:w-auto xl:flex-initial">
            Value
          </label>
          <FormInput
            id="tabulator-html-filter-value"
            v-model="filter.value"
            type="text"
            class="mt-2 sm:w-40 2xl:w-full sm:mt-0"
            placeholder="Search..."
          />
        </div>
        <div class="mt-2 xl:mt-0">
          <Button
            id="tabulator-html-filter-go"
            variant="primary"
            type="button"
            class="w-full sm:w-16"
            @click="onFilter"
          >
            Go
          </Button>
          <Button
            id="tabulator-html-filter-reset"
            variant="secondary"
            type="button"
            class="w-full mt-2 sm:w-16 sm:mt-0 sm:ml-1"
            @click="onResetFilter"
          >
            Reset
          </Button>
        </div>
      </form>

    </div>
    <div class="overflow-x-auto scrollbar-hidden">
      <div id="tabulator" ref="tableRef" class="mt-5"></div>
    </div>
  </div>

    <Slideover :open="EditSlideOver" @close="() => {
        setEditSlideOver(false);
    }
        ">
        <Slideover.Panel>
            <Slideover.Title class="p-5">
                <h2 class="mr-auto text-base font-medium">
                    Edit Role Access Management
                </h2>
            </Slideover.Title>
            <Slideover.Description>

                <form class="validate-form" @submit.prevent="updateRole">
                    <table class="w-full rounded-lg overflow-hidden mt-5">
            <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                Module
              </th>
              <th scope="col"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                View
              </th>
              <th scope="col"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                Create
              </th>
              <th scope="col"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                Edit
              </th>
              <th scope="col"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                Delete
              </th>
            </tr> -->
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" colspan="5"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                @click="toggleMasterSection">
                Masters
                <span class="ml-2">
                  <i :class="isMasterSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </span>
              </th>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="userAccessManagements" class="block mr-2 ml-[-2]">
                  User Access Managements
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="user-access-managements-view" v-model="viewUserAccessManagementsChecked"
                  type="checkbox" value="" />
                <label for="user-access-managements-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="user-access-managements-create" v-model="createUserAccessManagementsChecked"
                  :disabled="!viewUserAccessManagementsChecked" type="checkbox" value="" />
                <label for="user-access-managements-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="user-access-managements-edit" v-model="editUserAccessManagementsChecked"
                  :disabled="!viewUserAccessManagementsChecked" type="checkbox" value="" />
                <label for="user-access-managements-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="user-access-managements-delete" v-model="deleteUserAccessManagementsChecked"
                  :disabled="!viewUserAccessManagementsChecked" type="checkbox" value="" />
                <label for="user-access-managements-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="roleAccessManagement" class="block mr-2 ml-[-2]">
                  Role Access Management
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="role-access-view" v-model="viewRoleAccessChecked" type="checkbox" value="" />
                <label for="role-access-view" class="ml-2">View</label>
              </td>
              <!-- Add empty table data cells to align with Goods Receiving -->
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="role-access-edit" v-model="editRoleAccessChecked"
                  :disabled="!viewRoleAccessChecked" type="checkbox" value="" />
                <label for="role-access-edit" class="ml-2">Edit</label>
              </td>




              <td class="px-6 py-4"></td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
  <th scope="row"
    class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
    <FormCheck.Label htmlFor="roleMaster" class="block mr-2 ml-[-2]">
      Role Master
    </FormCheck.Label>
  </th>
  <td class="px-6 py-4 text-center">
    <!-- View Checkbox -->
    <FormCheck.Input id="role-master-view" v-model="viewRoleMasterChecked" type="checkbox" value="" />
    <label for="role-master-view" class="ml-2">View</label>
  </td>

  <td class="px-6 py-4 text-center">
    <!-- Create Checkbox, disabled when View is unchecked -->
    <FormCheck.Input id="role-master-create" v-model="createRoleMasterChecked"
      :disabled="!viewRoleMasterChecked" type="checkbox" value="" />
    <label for="role-master-create" class="ml-2">Create</label>
  </td>
  <td class="px-6 py-4 text-center">
    <!-- Edit Checkbox, disabled when View is unchecked -->
    <FormCheck.Input id="role-master-edit" v-model="editRoleMasterChecked"
      :disabled="!viewRoleMasterChecked" type="checkbox" value="" />
    <label for="role-master-edit" class="ml-2">Edit</label>
  </td>
  <td class="px-6 py-4 text-center">
    <!-- Delete Checkbox, disabled when View is unchecked -->
    <FormCheck.Input id="role-master-delete" v-model="deleteRoleMasterChecked"
      :disabled="!viewRoleMasterChecked" type="checkbox" value="" />
    <label for="role-master-delete" class="ml-2">Delete</label>
  </td>
</tr>


            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="locationMaster" class="block mr-2 ml-[-2]">
                  Location Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="location-master-view" v-model="viewLocationMasterChecked" type="checkbox"
                  value="" />
                <label for="location-master-view" class="ml-2">View</label>
              </td>

              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="location-master-create" v-model="createLocationMasterChecked"
                  :disabled="!viewLocationMasterChecked" type="checkbox" value="" />
                <label for="location-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="location-master-edit" v-model="editLocationMasterChecked"
                  :disabled="!viewLocationMasterChecked" type="checkbox" value="" />
                <label for="location-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="location-master-delete" v-model="deleteLocationMasterChecked"
                  :disabled="!viewLocationMasterChecked" type="checkbox" value="" />
                <label for="location-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="shiftMaster" class="block mr-2 ml-[-2]">
                  Shift Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="shift-master-view" v-model="viewShiftMasterChecked" type="checkbox" value="" />
                <label for="shift-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="shift-master-create" v-model="createShiftMasterChecked"
                  :disabled="!viewShiftMasterChecked" type="checkbox" value="" />
                <label for="shift-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="shift-master-edit" v-model="editShiftMasterChecked"
                  :disabled="!viewShiftMasterChecked" type="checkbox" value="" />
                <label for="shift-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="shift-master-delete" v-model="deleteShiftMasterChecked"
                  :disabled="!viewShiftMasterChecked" type="checkbox" value="" />
                <label for="shift-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="vendorMaster" class="block mr-2 ml-[-2]">
                  Vendor Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="vendor-master-view" v-model="viewVendorMasterChecked" type="checkbox" value="" />
                <label for="vendor-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="vendor-master-create" v-model="createVendorMasterChecked"
                  :disabled="!viewVendorMasterChecked" type="checkbox" value="" />
                <label for="vendor-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="vendor-master-edit" v-model="editVendorMasterChecked"
                  :disabled="!viewVendorMasterChecked" type="checkbox" value="" />
                <label for="vendor-master-edit" class="ml-2">Edit</label>
              </td>

              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="vendor-master-delete" v-model="deleteVendorMasterChecked"
                  :disabled="!viewVendorMasterChecked" type="checkbox" value="" />
                <label for="vendor-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>


            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="machineMaster" class="block mr-2 ml-[-2]">
                  Machine Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="machine-master-view" v-model="viewMachineMasterChecked" type="checkbox" value="" />
                <label for="machine-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-master-create" v-model="createMachineMasterChecked"
                  :disabled="!viewMachineMasterChecked" type="checkbox" value="" />
                <label for="machine-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-master-edit" v-model="editMachineMasterChecked"
                  :disabled="!viewMachineMasterChecked" type="checkbox" value="" />
                <label for="machine-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-master-delete" v-model="deleteMachineMasterChecked"
                  :disabled="!viewMachineMasterChecked" type="checkbox" value="" />
                <label for="machine-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="machineTypeMaster" class="block mr-2 ml-[-2]">
                  Machine Type Master
                </FormCheck.Label>
              </th>

              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="machine-type-master-view" v-model="viewMachineTypeMasterChecked" type="checkbox"
                  value="" />
                <label for="machine-type-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-type-master-create" v-model="createMachineTypeMasterChecked"
                  :disabled="!viewMachineTypeMasterChecked" type="checkbox" value="" />
                <label for="machine-type-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-type-master-edit" v-model="editMachineTypeMasterChecked"
                  :disabled="!viewMachineTypeMasterChecked" type="checkbox" value="" />
                <label for="machine-type-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-type-master-delete" v-model="deleteMachineTypeMasterChecked"
                  :disabled="!viewMachineTypeMasterChecked" type="checkbox" value="" />
                <label for="machine-type-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>



            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="platformMaster" class="block mr-2 ml-[-2]">
                  Platform Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="platform-master-view" v-model="viewPlatformMasterChecked" type="checkbox"
                  value="" />
                <label for="platform-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="platform-master-create" v-model="createPlatformMasterChecked"
                  :disabled="!viewPlatformMasterChecked" type="checkbox" value="" />
                <label for="platform-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="platform-master-edit" v-model="editPlatformMasterChecked"
                  :disabled="!viewPlatformMasterChecked" type="checkbox" value="" />
                <label for="platform-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="platform-master-delete" v-model="deletePlatformMasterChecked"
                  :disabled="!viewPlatformMasterChecked" type="checkbox" value="" />
                <label for="platform-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="productMaster" class="block mr-2 ml-[-2]">
                  Part Number Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="product-master-view" v-model="viewProductMasterChecked" type="checkbox" value="" />
                <label for="product-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="product-master-create" v-model="createProductMasterChecked"
                  :disabled="!viewProductMasterChecked" type="checkbox" value="" />
                <label for="product-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="product-master-edit" v-model="editProductMasterChecked"
                  :disabled="!viewProductMasterChecked" type="checkbox" value="" />
                <label for="product-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="product-master-delete" v-model="deleteProductMasterChecked"
                  :disabled="!viewProductMasterChecked" type="checkbox" value="" />
                <label for="product-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>
            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="cartonStickerMaster" class="block mr-2 ml-[-2]">
                  Powder Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="powder-master-view" v-model="viewPowderMasterChecked" type="checkbox" value="" />
                <label for="powder-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="powder-master-create" v-model="createPowderMasterChecked"
                  :disabled="!viewPowderMasterChecked" type="checkbox" value="" />
                <label for="powder-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="powder-master-edit" v-model="editPowderMasterChecked"
                  :disabled="!viewPowderMasterChecked" type="checkbox" value="" />
                <label for="powder-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="powder-master-delete" v-model="deletePowderMasterChecked"
                  :disabled="!viewPowderMasterChecked" type="checkbox" value="" />
                <label for="powder-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>


            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="binMaster" class="block mr-2 ml-[-2]">
                  Bin Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="bin-master-view" v-model="viewBinMasterChecked" type="checkbox" value="" />
                <label for="bin-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bin-master-create" v-model="createBinMasterChecked"
                  :disabled="!viewBinMasterChecked" type="checkbox" value="" />
                <label for="bin-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bin-master-edit" v-model="editBinMasterChecked" :disabled="!viewBinMasterChecked"
                  type="checkbox" value="" />
                <label for="bin-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bin-master-delete" v-model="deleteBinMasterChecked"
                  :disabled="!viewBinMasterChecked" type="checkbox" value="" />
                <label for="bin-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="cartonMaster" class="block mr-2 ml-[-2]">
                  Carton Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="carton-master-view" v-model="viewCartonMasterChecked" type="checkbox" value="" />
                <label for="carton-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="carton-master-create" v-model="createCartonMasterChecked"
                  :disabled="!viewCartonMasterChecked" type="checkbox" value="" />
                <label for="carton-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="carton-master-edit" v-model="editCartonMasterChecked"
                  :disabled="!viewCartonMasterChecked" type="checkbox" value="" />
                <label for="carton-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="carton-master-delete" v-model="deleteCartonMasterChecked"
                  :disabled="!viewCartonMasterChecked" type="checkbox" value="" />
                <label for="carton-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>




            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="bagMaster" class="block mr-2 ml-[-2]">
                  Bag Master
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="bag-master-view" v-model="viewBagMasterChecked" type="checkbox" value="" />
                <label for="bag-master-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bag-master-create" v-model="createBagMasterChecked"
                  :disabled="!viewBagMasterChecked" type="checkbox" value="" />
                <label for="bag-master-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bag-master-edit" v-model="editBagMasterChecked" :disabled="!viewBagMasterChecked"
                  type="checkbox" value="" />
                <label for="bag-master-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bag-master-delete" v-model="deleteBagMasterChecked"
                  :disabled="!viewBagMasterChecked" type="checkbox" value="" />
                <label for="bag-master-delete" class="ml-2">Delete</label>
              </td>
            </tr>
            <tr v-if="isMasterSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="holdingBagMaster" class="block mr-2 ml-[-2]">
                  Bin Holding
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="bin-holding-view" v-model="viewBinHoldingChecked" type="checkbox" value="" />
                <label for="bin-holding-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="bin-holding-delete" v-model="deleteBinHoldingChecked"
                  :disabled="!viewBinHoldingChecked" type="checkbox" value="" />
                <label for="bin-holding-delete" class="ml-2">Release</label>
              </td>
            </tr>

            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" colspan="5"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                @click="toggleGoodsReceive">
                Goods Receive
                <span class="ml-2">
                  <i :class="isGoodsReceiveVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </span>
              </th>
            </tr>

            <tr v-if="isGoodsReceiveVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="goods-receiving" class="block mr-2 ml-[-2]">
                  Goods Receiving
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="goods-receiving-view" v-model="viewChecked" type="checkbox" value="" />
                <label for="goods-receiving-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="goods-receiving-create" v-model="createChecked" :disabled="!viewChecked"
                  type="checkbox" value="" />
                <label for="goods-receiving-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="goods-receiving-edit" v-model="editChecked" :disabled="!viewChecked"
                  type="checkbox" value="" />
                <label for="goods-receiving-edit" class="ml-2">Edit</label>
              </td>

              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="goods-receiving-delete" v-model="deleteChecked" :disabled="!viewChecked"
                  type="checkbox" value="" />
                <label for="goods-receiving-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr v-if="isGoodsReceiveVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="quality-check" class="block mr-2 ml-[-2]">
                  Goods Receiving Quality Check
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="goods-receive-view" v-model="viewGoodsReceiveChecked" type="checkbox" value="" />
                <label for="goods-receive-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="goods-receive-edit" v-model="editGoodsReceiveChecked"
                  :disabled="!viewGoodsReceiveChecked" type="checkbox" value="" />
                <label for="goods-receive-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr v-if="isGoodsReceiveVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="warehouse" class="block mr-2 ml-[-2]">
                  Warehouse
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="warehouse-view" v-model="viewWarehouseChecked" type="checkbox" value="" />
                <label for="warehouse-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="warehouse-edit" v-model="editWarehouseChecked" :disabled="!viewWarehouseChecked"
                  type="checkbox" value="" />
                <label for="warehouse-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isGoodsReceiveVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="warehouseRequest" class="block mr-2 ml-[-2]">
                  Warehouse Request
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="warehouse-request-view" v-model="viewWarehouseRequestChecked" type="checkbox"
                  value="" />
                <label for="warehouse-request-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="warehouse-request-edit" v-model="editWarehouseRequestChecked"
                  :disabled="!viewWarehouseRequestChecked" type="checkbox" value="" />
                <label for="warehouse-request-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" colspan="5"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                @click="togglePlanning">
                Planning
                <span class="ml-2">
                  <i :class="isPlanningVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </span>
              </th>
            </tr>

            <tr v-if="isPlanningVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="planning" class="block mr-2 ml-[-2]">
                  Planning
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="planning-view" v-model="viewPlanningChecked" type="checkbox" value="" />
                <label for="planning-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Create Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="planning-create" v-model="createPlanningChecked" :disabled="!viewPlanningChecked"
                  type="checkbox" value="" />
                <label for="planning-create" class="ml-2">Create</label>
              </td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="planning-edit" v-model="editPlanningChecked" :disabled="!viewPlanningChecked"
                  type="checkbox" value="" />
                <label for="planning-edit" class="ml-2">Edit</label>
              </td>

              <td class="px-6 py-4 text-center">
                <!-- Delete Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="planning-delete" v-model="deletePlanningChecked" :disabled="!viewPlanningChecked"
                  type="checkbox" value="" />
                <label for="planning-delete" class="ml-2">Delete</label>
              </td>
            </tr>

            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" colspan="5"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                @click="toggleProduction">
                Production
                <span class="ml-2">
                  <i :class="isProductionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </span>
              </th>
            </tr>

            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="blending" class="block mr-2 ml-[-2]">
                  Blending
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="blending-view" v-model="viewBlendingChecked" type="checkbox" value="" />
                <label for="blending-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="blending-edit" v-model="editBlendingChecked" :disabled="!viewBlendingChecked"
                  type="checkbox" value="" />
                <label for="blending-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="blendingJobs" class="block mr-2 ml-[-2]">
                  Blending Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="blending-jobs-view" v-model="viewBlendingJobsChecked" type="checkbox" value="" />
                <label for="blending-jobs-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="blending-jobs-edit" v-model="editBlendingJobsChecked"
                  :disabled="!viewBlendingJobsChecked" type="checkbox" value="" />
                <label for="blending-jobs-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="machine-station" class="block mr-2 ml-[-2]">
                  Machine Station
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="machine-station-view" v-model="viewMachineStationProductionChecked" type="checkbox"
                  value="" />
                <label for="machine-station-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-station-edit" v-model="editMachineStationProductionChecked"
                  :disabled="!viewMachineStationProductionChecked" type="checkbox" value="" />
                <label for="machine-station-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="machineStationJobs" class="block mr-2 ml-[-2]">
                  Machine Station Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="machine-station-jobs-view" v-model="viewMachineStationJobsChecked" type="checkbox"
                  value="" />
                <label for="machine-station-jobs-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="machine-station-jobs-edit" v-model="editMachineStationJobsChecked"
                  :disabled="!viewMachineStationJobsChecked" type="checkbox" value="" />
                <label for="machine-station-jobs-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="inProcessQualityCheck" class="block mr-2 ml-[-2]">
                  In-Progress Quality Check
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="inProcessQualityCheck-view" v-model="viewInProcessQualityCheckChecked"
                  type="checkbox" value="" />
                <label for="inProcessQualityCheck-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="inProcessQualityCheck-edit" v-model="editInProcessQualityCheckChecked"
                  :disabled="!viewInProcessQualityCheckChecked" type="checkbox" value="" />
                <label for="inProcessQualityCheck-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="secondaryProcess" class="block mr-2 ml-[-2]">
                  Secondary Process
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="secondary-process-view" v-model="viewSecondaryProcessChecked" type="checkbox"
                  value="" />
                <label for="secondary-process-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>

              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="secondary-process-edit" v-model="editSecondaryProcessChecked"
                  :disabled="!viewSecondaryProcessChecked" type="checkbox" value="" />
                <label for="secondary-process-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="wetTreatmentJob" class="block mr-2 ml-[-2]">
                  Wet Treatment Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="wet-treatment-job-view" v-model="viewWetTreatmentJobChecked" type="checkbox"
                  value="" />
                <label for="wet-treatment-job-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="wet-treatment-job-edit" v-model="editWetTreatmentJobChecked"
                  :disabled="!viewWetTreatmentJobChecked" type="checkbox" value="" />
                <label for="wet-treatment-job-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="plasmaTreatmentJob" class="block mr-2 ml-[-2]">
                  Plasma Treatment Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="plasma-treatment-job-view" v-model="viewPlasmaTreatmentJobChecked" type="checkbox"
                  value="" />
                <label for="plasma-treatment-job-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="plasma-treatment-job-edit" v-model="editPlasmaTreatmentJobChecked"
                  :disabled="!viewPlasmaTreatmentJobChecked" type="checkbox" value="" />
                <label for="plasma-treatment-job-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="deburringJob" class="block mr-2 ml-[-2]">
                  Deburring Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="deburring-job-view" v-model="viewDeburringJobChecked" type="checkbox" value="" />
                <label for="deburring-job-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="deburring-job-edit" v-model="editDeburringJobChecked"
                  :disabled="!viewDeburringJobChecked" type="checkbox" value="" />
                <label for="deburring-job-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
            <tr v-if="isProductionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="dedustingJob" class="block mr-2 ml-[-2]">
                  Dedusting Jobs
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="dedusting-job-view" v-model="viewDedustingJobChecked" type="checkbox" value="" />
                <label for="dedusting-job-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="dedusting-job-edit" v-model="editDedustingJobChecked"
                  :disabled="!viewDedustingJobChecked" type="checkbox" value="" />
                <label for="dedusting-job-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th scope="col" colspan="5"
                class="title px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                @click="togglePostProductionSection">
                Post Production
                <span class="ml-2">
                  <i :class="isPostProductionSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                </span>
              </th>
            </tr>
            <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="outgoingQualityCheck" class="block mr-2 ml-[-2]">
                  Out Going Quality Check
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="outgoing-quality-check-view" v-model="viewOutgoingQualityCheckChecked"
                  type="checkbox" value="" />
                <label for="outgoing-quality-check-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="outgoing-quality-check-edit" v-model="editOutgoingQualityCheckChecked"
                  :disabled="!viewOutgoingQualityCheckChecked" type="checkbox" value="" />
                <label for="outgoing-quality-check-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="packing" class="block mr-2 ml-[-2]">
                  Packing
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="packing-view" v-model="viewPackingChecked" type="checkbox" value="" />
                <label for="packing-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="packing-edit" v-model="editPackingChecked" :disabled="!viewPackingChecked"
                  type="checkbox" value="" />
                <label for="packing-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>

            <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
              <th scope="row"
                class="px-6 py-4 text-left font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                <FormCheck.Label htmlFor="packingJob" class="block mr-2 ml-[-2]">
                  Packing Job
                </FormCheck.Label>
              </th>
              <td class="px-6 py-4 text-center">
                <!-- View Checkbox -->
                <FormCheck.Input id="packing-job-view" v-model="viewPackingJobChecked" type="checkbox" value="" />
                <label for="packing-job-view" class="ml-2">View</label>
              </td>
              <td class="px-6 py-4"></td>
              <td class="px-6 py-4 text-center">
                <!-- Edit Checkbox, disabled when View is unchecked -->
                <FormCheck.Input id="packing-job-edit" v-model="editPackingJobChecked"
                  :disabled="!viewPackingJobChecked" type="checkbox" value="" />
                <label for="packing-job-edit" class="ml-2">Edit</label>
              </td>
              <td class="px-6 py-4"></td>
            </tr>
          </table>

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
                    View Role Access Management
                </h2>
            </Dialog.Title>
            <Dialog.Description class="max-h-[70vh] overflow-y-auto">

        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">


          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed">
            <tbody>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  Access Management
                </th>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                  @click="toggleMastersSection">
                  Masters
                  <span class="ml-2">
                    <i :class="isMastersSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  </span>
                </th>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  User Access Managements
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.userAccessManagements }}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Role Access Management
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.roleAccessManagements}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Role Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.roleMaster }}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Location Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{viewData.locationMaster}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Shift Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.shiftMaster }}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Vendor Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.vendorMaster}}
                </td>
              </tr>
<!--
              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Movement Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  <span :class="{
                    'bg-green-500 text-white px-3 py-1 rounded-full border-2 border-green-500': viewData.movementMaster === 'View,Create,Edit,Delete',
                    'bg-red-500 text-white px-3 py-1 rounded-full border-2 border-red-500': viewData.movementMaster === 'Delete'
                  }">
                    {{ viewData.movementMaster === 'View,Create,Edit,Delete' ? 'YES' : (viewData.movementMaster ===
                      'Delete' ? 'NO' : viewData.movementMaster) }}
                  </span>
                </td>
              </tr> -->

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Machine Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.machineMaster}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Machine Type Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.machineTypeMaster }}
                </td>
              </tr>



              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Platform Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.platformMaster }}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Part Number Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.partNumberMaster}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Powder Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.powderMaster}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Bin Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.binMaster}}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Carton Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
               {{viewData.cartonMaster}}
                </td>
              </tr>


              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Bag Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.bagMaster }}
                </td>
              </tr>

              <tr v-if="isMastersSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                 Bin Holding Master
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.binHolding }}
                </td>
              </tr>

              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                  @click="toggleGoodsReceiveSection">
                  Goods Receive
                  <span class="ml-2">
                    <i :class="isGoodsReceiveSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  </span>
                </th>
              </tr>

              <tr v-if="isGoodsReceiveSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Goods Receiving
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.goodsReceiving }}
                </td>
              </tr>

              <tr v-if="isGoodsReceiveSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Goods Receiving Quality Check
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.goodsReceive}}
                </td>
              </tr>

              <tr v-if="isGoodsReceiveSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Warehouse
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                {{ viewData.warehouse }}
                </td>
              </tr>
              <tr v-if="isGoodsReceiveSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Warehouse Request
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                {{ viewData.warehouseRequest }}
                </td>
              </tr>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                  @click="togglePlanningSection">
                  Planning
                  <span class="ml-2">
                    <i :class="isPlanningSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  </span>
                </th>
              </tr>

              <tr v-if="isPlanningSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Planning
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{viewData.planning}}
                </td>
              </tr>


              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                  @click="toggleProductionSection">
                  Production
                  <span class="ml-2">
                    <i :class="isProductionSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  </span>
                </th>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Blending
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{viewData.blending}}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Blending Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.blendingJobs}}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Machine Station
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.machineStation_Production}}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Machine Station Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.machineStationJobs }}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  In Progress Quality Check
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.inProcessQualityCheck}}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Secondary Process
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.secondaryProcess }}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Wet Treatment Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{ viewData.wetTreatmentJob }}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Plasma Treatment Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.plasmaTreatmentJob}}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Deburring Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.deburringJob }}
                </td>
              </tr>

              <tr v-if="isProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Dedusting Jobs
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.dedustingJob }}
                </td>
              </tr>

              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="2"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800"
                  @click="togglePostProductionSection">
                  Post Production
                  <span class="ml-2">
                    <i :class="isPostProductionSectionVisible ? 'fas fa-chevron-down' : 'fas fa-chevron-right'"></i>
                  </span>
                </th>
              </tr>

              <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Outgoing Quality Check
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                 {{viewData.outgoingQualityCheck}}
                </td>
              </tr>

              <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Packing
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.packing }}
                </td>
              </tr>

              <tr v-if="isPostProductionSectionVisible" class="border-b border-gray-200 dark:border-gray-700">
                <th scope="row"
                  class="w-1/2 px-6 py-4 text-center font-medium text-white bg-primary dark:text-white dark:bg-gray-800 break-words">
                  Packing Job
                </th>
                <td class="w-1/2 px-auto text-center break-words">
                  {{ viewData.packingJob }}
                </td>
              </tr>



            </tbody>
          </table>
          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 table-fixed">
            <tbody>




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
.table-fixed {
  table-layout: fixed;
}

.break-words {
  word-break: break-word;
}
</style>
