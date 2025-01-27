<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'vue-router';
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormTextarea, FormLabel, FormSelect } from "../base-components/Form";

// Fetching user ID from local storage
const userId = localStorage.getItem('userId');

// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/UserRegistration/';

// State to manage profile data
const profile = reactive({
    id: '',
    firstName: '',
    lastName: '',
    emailId: '',
    department: '',
    division: '',
    designation: '',
    location: '',
    remarks: '',
    employeeid: '',
    names: [] as string[],
});

// Temporary state for form inputs
const tempProfile = reactive({ ...profile });

// Computed properties to return "N/A" if value is empty
const displayProfile = computed(() => {
    return {
        ...profile,
        firstName: profile.firstName || 'N/A',
        lastName: profile.lastName || 'N/A',
        emailId: profile.emailId || 'N/A',
        department: profile.department || 'N/A',
        division: profile.division || 'N/A',
        designation: profile.designation || 'N/A',
        location: profile.location || 'N/A',
        employeeid: profile.employeeid || 'N/A',
        remarks: profile.remarks || 'N/A'
    };
});

const fetchNamesLocation = () => {
    axios.get('http://10.87.0.33:8082/api/LocationMaster')
        .then(response => {
            const nameData = response.data.result;

            if (Array.isArray(nameData)) {
                const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');
                profile.names = activeNameData.map(item => item.name);
            } else {
                console.error('Invalid response format for name:', nameData);
            }
        })
        .catch(error => {
            console.error('Error fetching names:', error);
        });
};

// Fetching user details
const USER_MASTER_API_URL = 'http://10.87.0.33:8082/api/UserMaster';

const fetchUserDetails = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'User ID not found in local storage',
    });
    return;
  }

  try {
    console.log(`Fetching details for user ID: ${userId}`); // Debugging line

    // Attempt to fetch user details from the primary API
    let response = await axios.get(`${API_BASE_URL}${userId}`);
    let userDetails = (response.data.statusCode === 200 && response.data.result.length > 0)
      ? response.data.result[0]
      : null;

    // If not found in the primary API or the data is incomplete, check the UserMaster API
    if (!userDetails) {
      console.log('User not found or incomplete data in primary API, checking UserMaster API'); // Debugging line

      const userMasterResponse = await axios.get(USER_MASTER_API_URL);
      userDetails = userMasterResponse.data.result.find((user : any) => user.id === userId);

      if (!userDetails) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'User details not found',
        });
        return;
      }
    }

    console.log('Fetched user details:', userDetails); // Debugging line

    // Update the profile and tempProfile objects
    Object.assign(profile, userDetails);
    Object.assign(tempProfile, userDetails); // Sync tempProfile with profile

  } catch (error) {
    console.error('Error fetching user details:', error); // Debugging line
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while fetching user details',
    });
  }
};
// Fetch user details on mount
onMounted(() => {
    if (userId) {
        fetchUserDetails();
    } else {
        console.error('No user ID found in local storage'); // Debugging line
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No user ID found in local storage'
        });
    }
    fetchNamesLocation();
});

// State to manage Slideover visibility
const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
    EditSlideOver.value = value;
    if (value) {
        Object.assign(tempProfile, profile); // Sync tempProfile with profile when opening the slideover
    }
};

// Function to handle form submission
const updateProfile = async () => {
    try {
        // Validate email format
        if (!tempProfile.firstName || !tempProfile.lastName || !emailPattern.test(tempProfile.emailId)) {
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

        // Confirmation dialog before updating profile
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will update the data!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#1e40af',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, update it!',
        }).then(async result => {
            if (result.isConfirmed) {
                // Prepare the updated profile data for PUT request
                const updatedProfile = {
                    ...tempProfile,
                    email: tempProfile.emailId // Map emailId to email for the request
                };


                const response = await axios.put(`${API_BASE_URL}${profile.id}`, updatedProfile);
                if (response.data.statusCode === 200) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Profile updated successfully',
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
                    // Sync profile with the updated data, ensuring we map email back to emailId
                    Object.assign(profile, { ...tempProfile, emailId: updatedProfile.email });
                    setEditSlideOver(false);
                    fetchUserDetails(); // Refresh user details
                    fetchNamesLocation();

                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to update profile'
                    });
                }
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error); // Debugging line
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while updating profile'
        });
    }
};
// Email validation pattern
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const copyEmailToClipboard = () => {
    navigator.clipboard.writeText(profile.emailId).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Copied!',
            text: 'Email address copied to clipboard',
            showConfirmButton: false,
            timer: 1500
        });
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to copy email address'
        });
    });
};
</script>
<template>
    <div class="flex flex-col justify-between items-center mt-8 intro-y sm:flex-row">
        <h2 class="mr-auto text-lg font-medium">Profile</h2>
        <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
            <Button variant="primary" class="mr-2 shadow-md" @click="() => setEditSlideOver(true)">
                Edit Profile
            </Button>
        </div>
    </div>
    <div class="mt-5 max-w-full mx-auto p-8 intro-y box shadow-lg rounded-lg w-full">
        <h1 class="text-3xl font-bold text-white-900 mb-4">{{ displayProfile.firstName }} {{ displayProfile.lastName }}
        </h1>


        <div class="mb-6 flex items-center relative">
            <h2 class="text-lg text-white-500 mb-2 mr-2">{{ displayProfile.emailId }}</h2>
            <!-- <i class="text-white-500 fa-solid fa-copy ml-2 cursor-pointer border border-black rounded p-2"
                @click="copyEmailToClipboard"></i> -->

        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Employee ID</h3>
                <p class="text-slate-600 dark:text-gray-50 font-medium">{{ displayProfile.employeeid }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Department</h3>
                <p class="font-medium text-slate-600 dark:text-gray-50">{{ displayProfile.department }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Division</h3>
                <p class="font-medium text-slate-600 dark:text-gray-50">{{ displayProfile.division }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Designation</h3>
                <p class="text-slate-600 dark:text-gray-50 font-medium">{{ displayProfile.designation }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Location</h3>
                <p class="text-slate-600 dark:text-gray-50 font-medium">{{ displayProfile.location }}</p>
            </div>

            <div class="bg-blue-50 dark:bg-gray-600 p-4 rounded-lg shadow-sm w-full" :class="['relative zoom-in']">
                <h3 class="text-lg font-semibold text-white-700">Remarks</h3>
                <p class="text-slate-600 dark:text-gray-50 font-medium">{{ displayProfile.remarks }}</p>
            </div>

        </div>
    </div>

    <Slideover :open="EditSlideOver" @close="() => setEditSlideOver(false)">
        <Slideover.Panel>
            <Slideover.Title class="p-5">
                <h2 class="mr-auto text-base font-medium">
                    Edit Profile
                </h2>
            </Slideover.Title>
            <Slideover.Description>
                <form class="validate-form" @submit.prevent="updateProfile">
                    <div>
                        <FormLabel htmlFor="regular-form-1">First Name</FormLabel>
                        <span class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': !tempProfile.firstName }" id="regular-form-1"
                            v-model="tempProfile.firstName" type="text" placeholder="First Name" />
                        <span v-if="!tempProfile.firstName" class="text-red-500">First Name is required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Last Name</FormLabel>
                        <span class="text-red-500 pl-1 text-md">*</span>
                        <FormInput :class="{ 'border-red-500': !tempProfile.lastName }" id="regular-form-1"
                            v-model="tempProfile.lastName" type="text" placeholder="Last Name" />
                        <span v-if="!tempProfile.lastName" class="text-red-500">Last Name is required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel>
                        <FormInput id="validation-form-6" placeholder="Your Employee ID"
                            v-model="tempProfile.employeeid">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Department</FormLabel>
                        <FormInput id="validation-form-6" placeholder="Your Department"
                            v-model="tempProfile.department">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Division</FormLabel>
                        <FormInput id="validation-form-6" placeholder="Your Division" v-model="tempProfile.division">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Designation</FormLabel>
                        <FormInput id="validation-form-6" placeholder="Your Designation"
                            v-model="tempProfile.designation">
                        </FormInput>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-7">Location</FormLabel>
                        <span class="text-red-500 pl-1 text-md">*</span>
                        <FormSelect :class="{ 'border-red-500': !tempProfile.location }" v-model="tempProfile.location"
                            class=" sm:mr-2" aria-label="Default select example">
                            <option disabled value="">Select a Location Option</option>
                            <option v-for="name in tempProfile.names" :key="name" :value="name">
                                {{ name }}
                            </option>
                        </FormSelect>
                        <span v-if="!tempProfile.location" class="text-red-500">Location is
                            required!</span>
                    </div>
                    <div class="mt-5">
                        <FormLabel htmlFor="regular-form-1">Remarks</FormLabel>
                        <FormTextarea id="validation-form-6" placeholder="Type your remarks"
                            v-model="tempProfile.remarks">
                        </FormTextarea>
                    </div>

                    <Button variant="primary" class="w-full mt-4 shadow-md" type="submit">
                        Save Changes
                    </Button>
                </form>
            </Slideover.Description>
            <Slideover.Footer>
                <Button variant="outline-secondary" type="button" @click="() => setEditSlideOver(false)"
                    class="w-20 mr-1">
                    Cancel
                </Button>
            </Slideover.Footer>
        </Slideover.Panel>
    </Slideover>
</template>

<style scoped>
h1,
h2,
h3,
p {
    margin: 0;
}

.intro-y {
    font-family: 'Inter', sans-serif;
}

.grid {
    gap: 1.5rem;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.text-gray-700 {
    color: #4b5563;
}

.text-gray-600 {
    color: #718096;
}

.text-gray-900 {
    color: #1a202c;
}
</style>
