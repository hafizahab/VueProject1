<script setup lang="ts">
import DarkModeSwitcher from "../components/DarkModeSwitcher";
import MainColorSwitcher from "../components/MainColorSwitcher";
import logoUrl from "../assets/images/logo.svg";
import illustrationUrl from "../assets/images/illustration.svg";
import { FormInput, FormCheck, InputGroup, FormLabel } from "../base-components/Form";
import Button from "../base-components/Button";
import Swal from 'sweetalert2';
import Toastify from "toastify-js";
import axios from 'axios';
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useSideMenuStore } from '../stores/side-menu';


const router = useRouter();


const sideMenuStore = useSideMenuStore();



const addFormData = reactive({
  email: '',
  password: '',
});

// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/UserRegistration/ChangePassword/';

const formSubmitted = ref(false);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const changePassword = async () => {
  formSubmitted.value = true;

  if (formSubmitted.value && (!addFormData.password || !emailPattern.test(addFormData.email))) {
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

  try {
    const response = await axios.post(API_BASE_URL, addFormData);

    if (response.data.message === 'Success!') {
      const { id, firstName, lastName, email, role } = response.data.result;

      localStorage.setItem('userId', id);
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);
      localStorage.setItem('email', email);
      localStorage.setItem('roleId', role.roleId);

      // Fetch user access data
      const accessResponse = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
      console.log("Fetched User Access Data:", accessResponse.data);
      localStorage.setItem('userAccess', JSON.stringify(accessResponse.data));

      // Update the side menu store
      sideMenuStore.updateMenu();

      router.push('/landing-page').then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Password Changed Successfully',
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
    } else if (response.data.message === 'User not exist') {
      Swal.fire({
        icon: 'error',
        title: 'User Not Exist',
        text: 'The specified user does not exist. Please check your email and try again.',
        showConfirmButton: true,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#d33',
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Change Password Failed',
        text: 'An error occurred while changing your password. Please try again.',
        showConfirmButton: true,
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#d33',
      });
    }
    formSubmitted.value = false;

  } catch (error) {
    handleError(error, 'Error during password change');
  } finally {
    formSubmitted.value = false; // reset form submission state
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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-6 bg-blue-900">
    <div class="p-10 flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto w-full max-w-md lg:max-w-4xl">
      <div class="rounded hidden lg:block lg:w-1/2 bg-cover"
        style="background-image:url('src/assets/images/forget-password-img.png')"></div>

      <div class="w-full p-8 lg:w-1/2">
        <h2 class="text-2xl font-semibold text-blue-700 text-center">Porex RMC</h2>
        <p class="text-xl text-gray-600 text-center">Change your Password</p>
        <p class="text-sm text-gray-600 text-center">Provide your email and a new password to complete the password
          change.</p>
        <hr class="mt-5 mb-5">
        <form @submit.prevent="changePassword">
          <div class="mt-4">
            <FormLabel htmlFor="email" class="font-bold">Email</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !emailPattern.test(addFormData.email) }"
              v-model="addFormData.email" id="email" type="email" placeholder="Your Email" />
            <span v-if="formSubmitted && !addFormData.email" class="text-red-500">Email is required!</span>
            <span v-if="formSubmitted && addFormData.email && !emailPattern.test(addFormData.email)"
              class="text-red-500">Please enter a valid email address!</span>
          </div>
          <div class="mt-4">
            <div class="flex justify-between">
              <div>
                <FormLabel htmlFor="regular-form-1" class="font-bold">Password</FormLabel><span
                  class="text-red-500 pl-1 text-md">*</span>
              </div>


            </div>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.password }"
              v-model="addFormData.password" id="password" type="password" placeholder="Password" />
            <span v-if="formSubmitted && !addFormData.password" class="text-red-500">Password is required!</span>
          </div>

          <div class="mt-8">
            <button
              class="bg-blue-700 text-white text-md font-bold py-3 px-4 w-full rounded-md hover:bg-blue-800 transition duration-300 ease-in-out">
              <i class=" pr-3 fa-solid fa-lock"></i>Change Password
            </button>
          </div>
        </form>

        <div class="mt-4 flex items-center justify-between">
          <span class="border-b w-1/5 md:w-1/4"></span>
          <router-link to="/login" class="text-xs text-gray-500 uppercase"><b class="hover">Back to
              Login</b></router-link>
          <span class="border-b w-1/5 md:w-1/4"></span>
        </div>
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
