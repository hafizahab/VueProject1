<script setup lang="ts">
import DarkModeSwitcher from "../components/DarkModeSwitcher";
import MainColorSwitcher from "../components/MainColorSwitcher";
import errorIllustration from "../assets/images/error-illustration.svg";
import Button from "../base-components/Button";

import { useRouter } from 'vue-router';

const router = useRouter();

const goBackToHome = () => {
  router.push({ name: 'side-menu-landing-page' });
};
</script>

<template>
  <div class="py-2 bg-primary">
    <DarkModeSwitcher />
    <MainColorSwitcher />
    <div class="container ">
      <!-- BEGIN: Error Page -->
      <div
        class="flex flex-col items-center justify-center h-screen text-center error-page lg:flex-row lg:text-left"
      >
        <div class="-intro-x lg:mr-20">
          <img
            alt="Midone Tailwind HTML Admin Template"
            class="w-[450px] h-48 lg:h-auto"
            :src="errorIllustration"
          />
        </div>
        <div class="mt-10 text-white lg:mt-0">
  <div class="font-medium intro-x text-8xl">403</div>
  <div class="mt-5 text-xl font-medium intro-x lg:text-3xl">
    Access Denied
  </div>
  <div class="mt-3 text-lg intro-x">
    You do not have permission to view this page. If you believe this is a mistake, please contact the administrator for access.
  </div>
  <Button
    class="px-4 py-3 mt-10 text-white border-white intro-x dark:border-darkmode-400 dark:text-slate-200"
    @click="goBackToHome"
  >
    Back to Home
  </Button>
</div>
      </div>
      <!-- END: Error Page -->
    </div>
  </div>
</template>
