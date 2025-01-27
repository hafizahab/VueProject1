<script setup lang="ts">
import DarkModeSwitcher from "../components/DarkModeSwitcher";
import MainColorSwitcher from "../components/MainColorSwitcher";
import registerImg from  "../assets/images/register-img.png";
import illustrationUrl from "../assets/images/illustration.svg";
import { FormInput, FormCheck, InputGroup, FormLabel, FormTextarea, FormSelect } from "../base-components/Form";
import Button from "../base-components/Button";
import Swal from 'sweetalert2';
import Toastify from "toastify-js";
import axios from 'axios';
import { ref, reactive, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';

const addFormData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  department: '',
  division: '',
  designation: '',
  location: '',
  remarks: '',
  roleId: '',
  employeeid: '',
  userAccessManagement: [
    {
      admin: '',
      goodsReceiving: '',
      planning: '',
      qualityCheck: '',
      blending: '',
      machineStation_Production: '',
      qcInspection: '',
      postProductionChemicalTreatment: '',
      postProductionBlow: '',
      packing: '',
      packageHolding: '',
    }
  ],
  names: [] as string[],
});

const roles = ref<any[]>([]);

onMounted(() => {
  fetchNamesLocation();
  fetchRolesAndAccess();
});

const router = useRouter();

const fetchNamesLocation = () => {
  axios.get('http://10.87.0.33:8082/api/LocationMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');
        addFormData.names = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};



const fetchRolesAndAccess = async () => {
  try {
    const [rolesResponse, accessResponse] = await Promise.all([
      axios.get('http://10.87.0.33:8082/api/RoleMaster'),
      axios.get('http://10.87.0.33:8082/api/RoleAccessManagement')
    ]);

    const rolesData = rolesResponse.data.result;
    const accessData = accessResponse.data.result;

    if (Array.isArray(rolesData) && Array.isArray(accessData)) {
      const activeRoles = rolesData.filter(role => role.status && role.status.toLowerCase() === 'active');
      const roleAccessMap = accessData.reduce((map, item) => {
        map[item.rolecode] = item; // Use rolecode to map access data
        return map;
      }, {});

      roles.value = activeRoles.map(role => {
        const access = roleAccessMap[role.code] || {};
        console.log(`Fetched access for role ${role.name}:`, JSON.stringify(access, null, 2));
        return {
          id: role.id,
          code: role.code,
          name: role.name,
          permissions: {
            admin: access.admin,
            goodsReceiving: access.goodsReceiving,
            planning: access.planning,
            qualityCheck: access.qualityCheck,
            blending: access.blending,
            machineStation_Production: access.machineStation_Production,
            qcInspection: access.qcInspection,
            postProductionChemicalTreatment: access.postProductionChemicalTreatment,
            postProductionBlow: access.postProductionBlow,
            packing: access.packing,
            packageHolding: access.packageHolding
          }
        };
      });
    } else {
      console.error('Invalid response format for roles or access data:', rolesData, accessData);
    }
  } catch (error) {
    console.error('Error fetching roles and access data:', error);
  }
};

// Watch for changes to roleId and update userAccessManagement
watch(() => addFormData.roleId, (newRoleId) => {
  const selectedRole = roles.value.find(role => role.id === newRoleId);
  if (selectedRole) {
    addFormData.userAccessManagement = [{
      admin: selectedRole.permissions.admin,
      goodsReceiving: selectedRole.permissions.goodsReceiving,
      planning: selectedRole.permissions.planning,
      qualityCheck: selectedRole.permissions.qualityCheck,
      blending: selectedRole.permissions.blending,
      machineStation_Production: selectedRole.permissions.machineStation_Production,
      qcInspection: selectedRole.permissions.qcInspection,
      postProductionChemicalTreatment: selectedRole.permissions.postProductionChemicalTreatment,
      postProductionBlow: selectedRole.permissions.postProductionBlow,
      packing: selectedRole.permissions.packing,
      packageHolding: selectedRole.permissions.packageHolding,
    }];
  } else {
    // Reset if no role is selected or role doesn't exist
    addFormData.userAccessManagement = [{
      admin: '',
      goodsReceiving: '',
      planning: '',
      qualityCheck: '',
      blending: '',
      machineStation_Production: '',
      qcInspection: '',
      postProductionChemicalTreatment: '',
      postProductionBlow: '',
      packing: '',
      packageHolding: '',
    }];
  }
});

const API_BASE_URL = 'http://10.87.0.33:8082/api/UserRegistration/';

const formSubmitted = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// watch(() => addFormData.roleId, (newRoleId) => {
//   if (roles.value.find(role => role.id === newRoleId)?.name.toLowerCase() === 'user') {
//     addFormData.userAccessManagement[0].admin = 'Delete';
//   } else {
//     addFormData.userAccessManagement[0].admin = 'View,Create,Edit,Delete';
//   }
// });

const registerUser = () => {
  formSubmitted.value = true;

  if (!addFormData.firstName || !addFormData.lastName || !emailPattern.test(addFormData.email) || !addFormData.location || !addFormData.roleId) {
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
    axios.post(API_BASE_URL, addFormData)
      .then(response => {
        if (response.data.message === `User already exist`) {
          Swal.fire({
            icon: 'error',
            title: 'User already exists',
            html: `Please try again`,
          });
        } else {
          console.log('Successfully submitted data:', response.data);
          router.push('/login').then(() => {
            Swal.fire({
              icon: 'success',
              title: 'Successfully Registered',
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
          });
        }
        formSubmitted.value = false;
      })
      .catch(error => handleError(error, 'Error adding role'));
}
};


const handleError = (error: any, message: any) => {
  console.error(message, error);
  Swal.fire({
    icon: 'error',
    title: 'Operation Failed',
    text: message,
  });
};
</script>
<template>
  <div class="min-h-screen flex items-center justify-center py-6 bg-blue-900">
    <div class=" flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto w-full max-w-6xl" style="width: 90%;">
      <div class="rounded hidden lg:block lg:w-1/2 bg-cover" :style="{ backgroundImage: `url(${registerImg})` }"></div>

  <div class="w-full p-8 lg:w-1/2">
    <h2 class="text-2xl font-semibold text-blue-700 text-center">Porex RMC</h2>
    <p class="text-xl text-gray-600 text-center">Create your account</p>
    <hr class="mt-5 mb-5">
    <form @submit.prevent="registerUser">
      <div class="space-y-4">
        <div class="md:flex md:space-x-4">
          <div class="w-full md:w-1/2">
            <FormLabel htmlFor="regular-form-1" class="font-bold">First Name</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.firstName }"
              v-model="addFormData.firstName" id="first-name" type="text" placeholder="First Name" />
            <span v-if="formSubmitted && !addFormData.firstName" class="text-red-500">First Name is required!</span>
          </div>
          <div class="w-full md:w-1/2 mt-5 md:mt-0">
            <FormLabel htmlFor="regular-form-1" class="font-bold">Last Name</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.lastName }"
              v-model="addFormData.lastName" id="last-name" type="text" placeholder="Last Name" />
            <span v-if="formSubmitted && !addFormData.lastName" class="text-red-500">Last Name is required!</span>
          </div>
        </div>
        <div class="md:flex md:space-x-4">
          <div class="w-full md:w-1/2">
            <FormLabel htmlFor="email" class="font-bold">Email</FormLabel><span
            class="text-red-500 pl-1 text-md">*</span>
          <FormInput :class="{ 'border-red-500': formSubmitted && !emailPattern.test(addFormData.email) }"
            v-model="addFormData.email" id="email" type="email" placeholder="Your Email" />
          <span v-if="formSubmitted && !addFormData.email" class="text-red-500">Email is required!</span>
          <span v-if="formSubmitted && addFormData.email && !emailPattern.test(addFormData.email)"
            class="text-red-500">Please enter a valid email address!</span>
          </div>
          <div class="w-full md:w-1/2 mt-5 md:mt-0">
            <FormLabel htmlFor="regular-form-1" class="font-bold">Employee ID</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.employeeid }"
              v-model="addFormData.employeeid" id="employeeid" type="text" placeholder="Employee ID" />
            <span v-if="formSubmitted && !addFormData.employeeid" class="text-red-500">Employee ID is required!</span>
          </div>
        </div>

        <div class="md:flex md:space-x-4">
          <div class="w-full md:w-1/2">
            <FormLabel htmlFor="regular-form-1" class="font-bold">Department</FormLabel>
            <FormInput v-model="addFormData.department" id="department" type="text" placeholder="Your Department" />
          </div>
          <div class="w-full md:w-1/2 mt-5 md:mt-0">
            <FormLabel htmlFor="regular-form-1" class="font-bold">Designation</FormLabel>
            <FormInput v-model="addFormData.designation" id="designation" type="text"
              placeholder="Your Designation" />
          </div>
        </div>
        <div class="md:flex md:space-x-4">
          <div class="w-full md:w-1/2">
            <FormLabel htmlFor="regular-form-7" class="font-bold">Location</FormLabel>
          <span class="text-red-500 pl-1 text-md">*</span>
          <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.location }"
            v-model="addFormData.location" class=" sm:mr-2" aria-label="Default select example">
            <option disabled value="">Select a Location Option</option>
            <option v-for="name in addFormData.names" :key="name" :value="name">
              {{ name }}
            </option>
          </FormSelect>
          <span v-if="formSubmitted && !addFormData.location" class="text-red-500">Location is required!</span>
          </div>
          <div class="w-full md:w-1/2 mt-5 md:mt-0">
            <FormLabel htmlFor="regular-form-7" class="font-bold">Role ID</FormLabel>
          <span class="text-red-500 pl-1 text-md">*</span>
          <FormSelect :class="{ 'border-red-500': formSubmitted && !addFormData.roleId }"
            v-model="addFormData.roleId" class=" sm:mr-2" aria-label="Default select example">
            <option disabled value="">Select a Role</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">
              {{ role.name }}
            </option>
          </FormSelect>
          <span v-if="formSubmitted && !addFormData.roleId" class="text-red-500">Role ID is required!</span>
          </div>
        </div>

        <div>
          <FormLabel htmlFor="regular-form-1" class="font-bold">Remarks</FormLabel>
          <FormTextarea v-model="addFormData.remarks" id="validation-form-6" placeholder="Type your remarks">
          </FormTextarea>
        </div>
        <div class="mt-8">
          <button
            class="bg-blue-700 text-white text-md font-bold py-3 px-4 w-full rounded-md hover:bg-blue-800 transition duration-300 ease-in-out">
            <i class="pr-3 fa-solid fa-arrow-right-to-bracket"></i>Register
          </button>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <span class="border-b w-1/5 md:w-1/4"></span>
          <router-link to="/login" class="text-xs text-gray-500 uppercase">
            <b class="hover"> back to login</b>
          </router-link>
          <span class="border-b w-1/5 md:w-1/4"></span>
        </div>
      </div>
    </form>
  </div>
</div>
  </div>
</template>
<style scoped>
.hover {
  transition: color 0.3s ease, text-decoration 0.3s ease;
}

.hover:hover {
  color: rgb(10, 10, 162);
}
</style>