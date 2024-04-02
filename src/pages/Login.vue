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
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const emailError = ref('');
const passwordError = ref('');
const router = useRouter();


const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim() || !emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address';
  } else {
    emailError.value = '';
  }
};

const validatePassword = () => {
  if (!password.value.trim()) {
    passwordError.value = 'Password is required.';
  } else if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters long.';
  } else {
    passwordError.value = '';
  }
};

const loginUser = async () => {
  validateEmail();
  validatePassword();

  if (!emailError.value && !passwordError.value) {
    try {
      // Retrieve the user data
      const response = await axios.get(`https://65fa88953909a9a65b1a9b2e.mockapi.io/login/users`);
      const users = response.data;

      const user = users.find(u => u.email === email.value && u.password === password.value);

      if (user) {
        // Handle successful login, e.g., update state or redirect
        console.log('Successfully logged in. User:', user);
        localStorage.setItem('token', JSON.stringify(user.token));
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect based on user type
        switch (user.user_type) {
          case 'admin':
            router.push('/role-master');
            break;
          case 'gruser':
            router.push('/good-receiving/good-receiving');
            break;
          case 'whuser':
            router.push('/warehouse/warehouse');
            break;
          case 'qcuser':
            router.push('/quality-check/quality-check');
            break;
          default:
            console.error('Unknown user type:', user.user_type);
            break;
        }
      } else {
        console.error('Login failed: Invalid email or password');
        // Handle invalid credentials
        emailError.value = 'Invalid email or password';
      }
    } catch (error) {
      console.error('Login failed: Invalid credentials', error);
      const failedEl = document
      .querySelectorAll("#failed-notification-content")[0]
      .cloneNode(true) as HTMLElement;
    failedEl.classList.remove("hidden");
    Toastify({
      node: failedEl,
      duration: 3000,
      newWindow: true,
      close: true,
      gravity: "top",
      position: "right",
      stopOnFocus: true,
    }).showToast()
    }
  }
};
</script>

<template>
  <div class="py-16">
    <div class="flex bg-white rounded-lg shadow-lg overflow-hidden mx-auto max-w-sm lg:max-w-[70%]">

      <div class="hidden bg-white shadow-md border border-gray-100 border-r-1 lg:block lg:w-1/2 bg-cover">
        
        <img
          src="https://img.freepik.com/free-photo/corporate-business-handshake-business-partners_53876-104764.jpg?t=st=1709192957~exp=1709196557~hmac=33739e88726addfdb75577feb35ef9cfcd367b6af6467cf1bc63fda0d77e6ddd&w=740"
          width="450" class="mt-10 mb-10 ml-8 rounded-lg">

      </div>
      <div class="w-full p-8 lg:w-1/2">
        <img src="https://vectorseek.com/wp-content/uploads/2023/12/Porex-Filtration-Group-Logo-Vector.svg-.png"
          width="200" class="m-5">
        <div class="mt-10 flex flex-col items-center">
          
          <h1 class="text-2xl mb-10 xl:text-3xl font-extrabold ">
            Login
          </h1>
          <div class="w-full flex-1 mt-8">

            <div class="mx-auto max-w-xs">
            
              <div class="mt-8 intro-x">
              <FormInput type="text" v-model="email" @input="validateEmail"
                class="block px-4 py-3 intro-x login__input min-w-full xl:min-w-[350px]" placeholder="Email" />
              <div id="email-error" class="text-xs text-red-500 mt-1">{{ emailError }}</div>

              <FormInput type="password" v-model="password" @input="validatePassword"
                class="block px-4 py-3 mt-4 intro-x login__input min-w-full xl:min-w-[350px]" placeholder="Password" />
              <div id="password-error" class="text-xs text-red-500 mt-1">{{ passwordError }}</div>
            </div>

             
            <Button @click="loginUser" variant="primary" class="w-full px-4 py-3 align-top xl:w-32 xl:mr-3">
                Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div></template>
