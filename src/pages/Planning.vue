<script setup lang="ts">
import Lucide from "../base-components/Lucide";
import { Menu, Slideover, Dialog } from "../base-components/Headless";
import Button from "../base-components/Button";
import { FormInput, FormSelect, FormLabel, FormTextarea, FormCheck } from "../base-components/Form";
import { onMounted, ref, reactive, computed, watch, ComputedRef, watchEffect, Ref } from "vue";
import { createIcons, icons } from "lucide";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import axios from "axios";
import Swal from 'sweetalert2';
import Tippy from "../base-components/Tippy";
import TippyContent from "../base-components/TippyContent";
import TomSelect from "../base-components/TomSelect";
import LoadingIcon from "../base-components/LoadingIcon";


interface UserAccess {
  userId: string;
  planning?: string[];
}

let cachedUserAccess: UserAccess[] | null = null; // Use null initially to indicate no data is cached

function getUserAccessData(): Promise<UserAccess[]> {
  return new Promise((resolve, reject) => {
    if (cachedUserAccess) {
      resolve(cachedUserAccess);
    } else {
      loading.value = true; // Show the loading modal
      fetch('http://10.87.0.33:8082/api/UserAccessManagement')
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          // Ensure the data structure matches expectations
          if (data && Array.isArray(data.result)) {
            cachedUserAccess = data.result as UserAccess[]; // Explicitly cast data.result
            resolve(cachedUserAccess);
          } else {
            throw new Error("Unexpected response format");
          }
        })
        .catch((error) => reject(error))
        .finally(() => {
          loading.value = false; // Hide the loading modal
        });
    }
  });
}

const select2 = ref("*");

const selectedPlatforms = ref([]);
const selectOptions = {
  placeholder: 'Select platforms',
};


const selectPart = {
  placeholder: 'Select Part Number',
};

interface Response {
  id?: string;
  productcode?: string;
  date?: string;
  resourcecode?: string;
  shift?: string;
  jobId?: string;
  sku?: string;
  jobtype?: string;
  platform?: string;
  remarks?: string;
  quantity?: number;
  startdate?: string;
  expecteddate?: string;
  actualdate?: string;
  noofresources?: number;
  noofmachines?: number;
  buffer?: number;
  bufferremarks?: string;
  wettreatmentrequired?: boolean;
  dustingrequired?: boolean;
  replacemenntjobid?: string;
  jobstatus?: string;
  noofpieces?: string;
  oracleJobId?: string;
}


const tableRef = ref<HTMLDivElement>();
const tabulator = ref<Tabulator>();
const filter = reactive({
  field: "name",
  type: "like",
  value: "",
  jobId: "",
  productcode: "",
  status: "",
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
      // Initial sort
      initialSort: [
        { column: "date", dir: "desc" }, // Sort by date in descending order
      ],
      // Add a title at the top of the print view
      printHeader: `
                <h1 style="text-align: center; font-size: 20px; margin-bottom: 20px;">
                    Planning
                </h1>
            `,

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
          title: "JOB ID",
          minWidth: 100,
          responsive: 0,
          field: "jobId",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
      <div class="font-medium whitespace-nowrap">${response.jobId}</div>
    </div>`;
          },
        },
        {
          title: "PART NUMBER",
          minWidth: 180,
          responsive: 0,
          field: "productcode",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.productcode}</div>
              </div>`;
          },
        },


        //     {
        //       title: "EMPLOYEE ID",
        //       minWidth: 150,
        //       responsive: 0,
        //       field: "resourcecode",
        //       vertAlign: "middle",
        //       print: false,
        //       download: false,
        //       formatter(cell) {
        //         const response: Response = cell.getData();
        //         return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.resourcecode}</div>
        // </div>`;
        //       },
        //     },
        //     {
        //       title: "SHIFT",
        //       minWidth: 150,
        //       responsive: 0,
        //       field: "shift",
        //       vertAlign: "middle",
        //       print: false,
        //       download: false,
        //       formatter(cell) {
        //         const response: Response = cell.getData();
        //         return `<div>
        //   <div class="font-medium whitespace-nowrap">${response.shift}</div>
        // </div>`;
        //       },
        //     },
        {
          title: "JOB STATUS",
          minWidth: 290,
          responsive: 0,
          field: "jobstatus",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let statusClass = '';

            if (!status) {
              status = 'N/A';
              statusClass = 'bg-gray-100 text-gray-800 border-gray-400';
            } else {
              switch (status) {
                case 'Completed':
                  statusClass = 'bg-green-100 text-green-800 border-green-400 dark:text-green-500';
                  break;
                case 'Draft':
                  statusClass = 'bg-orange-100 text-orange-800 border-orange-400 dark:text-orange-500';
                  break;
                case 'Pending':
                  statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-400 dark:text-yellow-500';
                  break;
                case 'Pending Blending':
                  statusClass = 'bg-sky-100 text-sky-800 border-sky-400 dark:text-sky-500';
                  break;
                case 'Pending Machine Station':
                  statusClass = 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-400 dark:text-fuchsia-500';
                  break;
                case 'Pending Wet Treatment':
                  statusClass = 'bg-blue-100 text-blue-800 border-blue-400 dark:text-blue-500';
                  break;
                case 'Pending Plasma Treatment':
                  statusClass = 'bg-indigo-100 text-indigo-800 border-indigo-400 dark:text-indigo-500';
                  break;
                case 'Pending Deburring':
                  statusClass = 'bg-violet-100 text-violet-800 border-violet-400 dark:text-violet-500';
                  break;
                case 'Pending Dedusting':
                  statusClass = 'bg-violet-100 text-violet-800 border-violet-400 dark:text-violet-500';
                  break;
                case 'Pending Quality Check':
                  statusClass = 'bg-teal-100 text-teal-800 border-teal-400 dark:text-teal-500';
                  break;
                case 'Pending Packing':
                  statusClass = 'bg-lime-100 text-lime-800 border-lime-400 dark:text-lime-500';
                  break;
                case 'Quality Check Rejected':
                  statusClass = 'bg-red-100 text-red-800 border-red-400 dark:text-red-500';
                  break;
                case 'Pending Secondary Process':
                  statusClass = 'bg-purple-100 text-purple-800 border-purple-400 dark:text-purple-500';
                  break;
                case 'Pending Production':
                  statusClass = 'bg-cyan-100 text-cyan-800 border-cyan-400 dark:text-cyan-500';
                  break;
              }
            }

            return `<div class="flex items-center lg:justify-center ${statusClass} text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:${status === 'submitted' ? 'text-green-400' : 'text-yellow-400'} border">
      ${status}
    </div>`;
          },
        },
        {
          title: "START DATES",
          minWidth: 200,
          responsive: 0,
          field: "startdate",
          vertAlign: "middle",
          print: false,
          visible: true,
          download: false,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.startdate);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');
            const hours = String(fullDate.getHours()).padStart(2, '0');
            const minutes = String(fullDate.getMinutes()).padStart(2, '0');
            const seconds = String(fullDate.getSeconds()).padStart(2, '0');
            const meridian = (fullDate.getHours() < 12) ? 'AM' : 'PM';

            // Formatted date string
            const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${meridian}`;

            return `<div>
        <div class="font-medium whitespace-nowrap">${formattedDate}</div>
    </div>`;
          },
        },
        {
          title: "ACTIONS",
          minWidth: 300,
          field: "actions",
          responsive: 1,
          hozAlign: "center",
          print: false,
          headerHozAlign: "center",
          vertAlign: "middle",
          formatter: function (cell) {
            const container = document.createElement("div");
            container.classList.add(
              "flex",
              "items-center",
              "gap-3",
              "justify-center",
              "flex-nowrap",
              "overflow-x-auto",
              "whitespace-nowrap"
            );

            const response = cell.getData();
            const loggedInUserId = localStorage.getItem("userId");

            // Placeholder while data is being fetched
            container.innerHTML = `<span class="text-gray-400 text-sm">Loading...</span>`;

            getUserAccessData()
              .then((userAccessData) => {
                const userAccess = userAccessData.find((user) => user.userId === loggedInUserId);

                // Clear placeholder
                container.innerHTML = "";
                // Add "Release to Production" button only if jobstatus is "Pending"
                if (response.jobstatus === "Pending") {
                  const releaseButton: HTMLAnchorElement = document.createElement("a");
                  releaseButton.classList.add("flex", "items-center", "text-green-600", "text-sm");
                  releaseButton.href = "javascript:;";
                  // Revised fetchProductSubCodes to return a Promise
                  const fetchProductSubCodes = async (productCode: string) => {
                    try {
                      const response = await axios.get(`http://10.87.0.33:8082/api/ProductMaster/GetProductReceiptdatabyProductCode/${productCode}`);
                      const result = response.data.result;

                      if (Array.isArray(result)) {
                        const mappedSubCodes = result.map((item: any) => ({
                          id: item.id,
                          jobId: '',
                          productCode: item.productCode,
                          percentage: item.percentage.toString(),
                          weight: item.weight,
                          blendingRequired: !!item.blendingRequired,
                        }));

                        const sortedSubCodes = sortProductSubCodes(mappedSubCodes);
                        addFormData.productSubCodesofRecipe = sortedSubCodes;
                        editFormData.productSubCodesofRecipe = sortedSubCodes;
                      } else {
                        console.error('Invalid response format for product sub-codes:', result);
                      }
                    } catch (error) {
                      console.error('Error fetching product sub-codes:', error);
                      throw error;
                    }
                  };
                  // Revised click event listener
                  // Revised click event listener for the "Release to Production" button
                  releaseButton.addEventListener("click", async (event: MouseEvent) => {
                    event.preventDefault();

                    try {
                      // Fetch data for the specific row
                      const { data }: { data: { result: any[] } } = await axios.get(`${API_BASE_URL}${response.id}`);
                      const item: any = data.result.find((d: any) => d.id === response.id);

                      if (!item) {
                        console.error('No data found for the specified ID:', response.id);
                        return;
                      }

                      // Ensure product sub-codes are fetched before proceeding
                      await fetchProductSubCodes(item.productcode);



                      // Update weights if quantity is available
                      if (item.quantity) {
                        updateWeights(item.quantity);
                      }

                      // Prepare the release payload
                      let platformString = '';
              if (Array.isArray(item.platform)) {
                platformString = item.platform.join(',');
              } else if (typeof item.platform === 'string') {
                platformString = item.platform;
              }
                      const releasePayload: any = {
                        productcode: item.productcode,
                        date: item.date || new Date().toISOString().substring(0, 10),
                        resourcecode: item.resourcecode || '',
                        employeeID: item.resourcecode || '',
                        shift: item.shift || '',
                        jobId: item.jobId || '',
                        sku: item.sku || '',
                        jobtype: item.jobtype || '',
                        platform: platformString,
                        remarks: item.remarks || '',
                        quantity: item.quantity || 0,
                        startdate: item.startdate || '',
                        expecteddate: item.expecteddate || '',
                        actualdate: item.actualdate || '',
                        noofresources: parseInt(item.noofresources) || 0,
                        noofmachines: parseInt(item.noofmachines) || 0,
                        buffer: parseFloat(item.buffer) || 0,
                        bufferremarks: item.bufferremarks || '',
                        wettreatmentrequired: !!item.wettreatmentrequired,
                        plasmatreatmentrequired: !!item.plasmatreatmentrequired,
                        deburringrequired: !!item.deburringrequired,
                        dustingrequired: !!item.dustingrequired,
                        replacemenntjobid: item.replacemenntjobid || '',
                        noofpieces: item.noofpieces || '',
                        oracleJobId: item.oracleJobId || '',
                        listMachines: (item.listMachines || []).map((machine: any) => ({
                          code: machine.code,
                          type: machine.type,
                        })),
                        productSubCodesofRecipe: editFormData.productSubCodesofRecipe.map((subCode: any) => ({
                          id: subCode.id,
                          productRecipeMappingId: item.jobId,
                          jobId: item.jobId,
                          productCode: subCode.productCode,
                          percentage: parseFloat(subCode.percentage) || 0,
                          weight: subCode.weight,
                          blendingRequired: subCode.blendingRequired,
                        })),
                        listBins: (item.listBins || []).map((bin: any) => ({
                          mappingId: item.jobId,
                          type: bin.type,
                          weight: bin.weight,
                          movement: bin.movement || item.jobtype || 'Blending', // Ensure movement is set dynamically
                          colour: bin.colour || '',
                          capacityMin: bin.capacityMin || 0,
                          capacityMax: bin.capacityMax || 0,
                          reassignBinId: bin.reassignBinId || '',
                          productCode: bin.productCode || '',
                        })),
                        machineStation: (item.machineStation || []).map((machine: any) => ({
                          shift: machine.shift,
                          machineCode: machine.machineCode,
                          totalWeight: parseFloat(machine.totalWeight.toString()) || 0,
                          waste: parseFloat(machine.waste.toString()) || 0,
                          listBins: (machine.pMachineListBins || []).map((bin: any) => ({
                            mappingId: bin.mappingId,
                            capacityMin: parseFloat(bin.capacityMin.toString()) || 0,
                            capacityMax: parseFloat(bin.capacityMax.toString()) || 0,
                          })),
                        })),
                      };

                      console.log('Release Payload (Before Submission):', JSON.stringify(releasePayload, null, 2));

                      // Confirmation dialog
                      const confirmResult = await Swal.fire({
                        title: 'Are you sure?',
                        text: 'This will release the data to production!',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: '#1e40af',
                        cancelButtonColor: '#d33',
                        confirmButtonText: 'Yes, release it!',
                      });

                      if (!confirmResult.isConfirmed) {
                        return;
                      }

                      // Execute the release API call
                      await axios.post(`http://10.87.0.33:8082/api/PlanningDetails/ReleasetoProduction`, releasePayload);
                      updateTableData();
                      generateNewJobId();

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
                    } catch (error) {
                      console.error('Error in release process:', error);
                      Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'An error occurred while releasing to production.',
                      });
                    }
                  });

                  releaseButton.innerHTML = `<i class="fa-regular fa-paper-plane mr-1"></i>Release`;
                  container.appendChild(releaseButton);
                };




                if (userAccess) {
                  // Conditionally render "Edit" link
                  if (
                    userAccess.planning &&
                    userAccess.planning.includes("Edit") &&
                    (response.jobstatus === "Draft" || response.jobstatus === "Pending")
                  ) {
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

                  // Conditionally render "Delete" link
                  if (userAccess.planning && userAccess.planning.includes("Delete")) {
                    const deleteLink = document.createElement("a");
                    deleteLink.classList.add(
                      "flex",
                      "items-center",
                      "text-danger",
                      "text-sm"
                    );
                    deleteLink.href = "javascript:;";
                    deleteLink.addEventListener("click", () => {
                      deleteRole(response.id);
                    });
                    deleteLink.innerHTML = `<i class="fa-regular fa-trash-can mr-1"></i>Delete`;
                    container.appendChild(deleteLink);
                  }
                }

                // Add "View" link
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




        {
          title: "Job ID",
          field: "jobId",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Oracle Job ID",
          field: "oracleJobId",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "PART NUMBER",
          field: "productcode",
          visible: false,
          print: true,
          download: true,
        },
        // {
        //     title: "Date",
        //     field: "date",
        //     visible: false,
        //     print: true,
        //     download: true,
        //     formatter(cell) {
        //         const response = cell.getData();
        //         const fullDate = new Date(response.date);

        //         // Extracting date components
        //         const year = fullDate.getFullYear();
        //         const month = String(fullDate.getMonth() + 1).padStart(2, '0');
        //         const day = String(fullDate.getDate()).padStart(2, '0');

        //         // Formatted date string
        //         const formattedDate = `${day}/${month}/${year}`;

        //         return `<div>
        //             <div class="font-medium whitespace-nowrap">${formattedDate}</div>
        //         </div>`;
        //     },
        // },
        {
          title: "Employee ID",
          field: "resourcecode",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Job Type",
          field: "jobtype",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Platform",
          field: "platform",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "No of Pieces",
          field: "noofpieces",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Weight",
          field: "quantity",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Planning Start Date",
          field: "startdate",
          visible: false,
          print: true,
          download: true,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.startdate);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');

            // Formatted date string
            const formattedDate = `${day}/${month}/${year}`;

            return `<div>
            <div class="font-medium whitespace-nowrap">${formattedDate}</div>
        </div>`;
          },
        },
        {
          title: "Planning Complete Date",
          field: "expecteddate",
          visible: false,
          print: true,
          download: true,
          formatter(cell) {
            const response = cell.getData();
            const fullDate = new Date(response.expecteddate);

            // Extracting date components
            const year = fullDate.getFullYear();
            const month = String(fullDate.getMonth() + 1).padStart(2, '0');
            const day = String(fullDate.getDate()).padStart(2, '0');

            // Formatted date string
            const formattedDate = `${day}/${month}/${year}`;

            return `<div>
            <div class="font-medium whitespace-nowrap">${formattedDate}</div>
        </div>`;
          },
        },
        {
          title: "No of Resources",
          field: "noofresources",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "No of Machines",
          field: "noofmachines",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Buffer",
          field: "buffer",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Wet Treatment Required",
          field: "wettreatmentrequired",
          visible: false,
          print: true,
          download: true,

        },
        {
          title: "Plasma Treatment Required",
          field: "plasmatreatmentrequired",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Dedusting Required",
          field: "dustingrequired",
          visible: false,
          print: true,
          download: true,
        },
        {
          title: "Deburring Required",
          field: "deburringrequired",
          visible: false,
          print: true,
          download: true,
        },


        {
          title: "Job Status",
          field: "jobstatus",
          visible: false,
          print: true,
          download: true,
          formatter: function (cell, formatterParams, onRendered) {
            let status = cell.getValue();
            let textColor;

            if (!status) {
              status = 'N/A';
              textColor = 'text-gray-600'; // Color for 'N/A'
            } else {
              switch (status) {
                case 'Completed':
                  textColor = 'text-green-600';
                  break;
                case 'Draft':
                  textColor = 'text-orange-600';
                  break;
                case 'Pending':
                  textColor = 'text-yellow-600';
                  break;
                case 'Pending Blending':
                  textColor = 'text-sky-600';
                  break;
                case 'Pending Machine Station':
                  textColor = 'text-fuchsia-600';
                  break;
                case 'Pending Wet Treatment':
                  textColor = 'text-blue-600';
                  break;
                case 'Pending Plasma Treatment':
                  textColor = 'text-indigo-600';
                  break;
                case 'Pending Deburring':
                  textColor = 'text-violet-600';
                  break;
                case 'Pending Dedusting':
                  textColor = 'text-violet-600';
                  break;
                case 'Pending Quality Check':
                  textColor = 'text-teal-600';
                  break;
                case 'Pending Packing':
                  textColor = 'text-lime-600';
                  break;
                case 'Quality Check Rejected':
                  textColor = 'text-red-600';
                  break;
                case 'Pending Secondary Process':
                  textColor = 'text-purple-600';
                  break;
                case 'Pending Production':
                  textColor = 'text-cyan-600';
                  break;
                default:
                  textColor = 'text-black'; // Default text color
              }
            }

            return `<span class="${textColor}">${status}</span>`;
          }
        }

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
    tabulator.value.setFilter((data) => {
      // Parse the date from the API data
      const dateValue = new Date(data.date);

      // Validate the dateValue
      if (isNaN(dateValue.getTime())) {
        console.error("Invalid Date:", data.date);
        return false; // Exclude entries with invalid dates
      }

      // Get start and end dates from the filters
      const startDate = filter.startDate ? new Date(filter.startDate) : null;
      const endDate = filter.endDate ? new Date(filter.endDate) : null;

      // Validate start and end dates
      if (startDate && isNaN(startDate.getTime())) {
        console.error("Invalid Start Date:", filter.startDate);
        return false;
      }
      if (endDate && isNaN(endDate.getTime())) {
        console.error("Invalid End Date:", filter.endDate);
        return false;
      }

      // Function to format a date to YYYY-MM-DD
      const formatDateToUTC = (date: Date) => {
        if (!date) return null;
        // Adjust the date to UTC and format it to YYYY-MM-DD
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return utcDate.toISOString().split('T')[0];
      };

      // Format the date components to strings
      const formattedDateValue = formatDateToUTC(dateValue);
      const formattedStartDate = startDate ? formatDateToUTC(startDate) : null;
      const formattedEndDate = endDate ? formatDateToUTC(endDate) : null;

      // Debugging logs
      console.log(`Data Date: ${formattedDateValue}, Start Date: ${formattedStartDate}, End Date: ${formattedEndDate}`);

      // Check if the date falls within the specified range or matches the start date
      if (formattedDateValue && formattedStartDate && !formattedEndDate) {
        // Only start date is specified
        return formattedDateValue === formattedStartDate;
      } else if (formattedDateValue && formattedStartDate && formattedEndDate) {
        // Both start and end dates are specified
        return formattedDateValue >= formattedStartDate && formattedDateValue <= formattedEndDate;
      } else if (formattedDateValue && !formattedStartDate && formattedEndDate) {
        // Only end date is specified, match date equals end date
        return formattedDateValue === formattedEndDate;
      } else {
        // Neither start nor end date is specified
        return true; // Return all data
      }
    });
  }
};


const jobId = () => {
  if (tabulator.value) {
    tabulator.value.setFilter("jobId", 'like', filter.jobId);
  }
};

const productcode = () => {
  if (tabulator.value && filter.productcode) {
    console.log("Applying filter for productcode:", filter.productcode);
    tabulator.value.setFilter((data) => {
      const searchValue = filter.productcode.toLowerCase();
      const columnValue = data.productcode ? data.productcode.toLowerCase() : '';
      return columnValue.includes(searchValue);
    });
  } else {
    console.warn("Filter value is empty or Tabulator not initialized");
  }
};


const onStatus = () => {
  if (tabulator.value) {
    // Clear existing filters
    tabulator.value.clearFilter(true);

    // Check the selected status
    if (filter.status === "Pending") {
      // Apply 'like' filter for "Pending" to include all statuses with the word "Pending"
      tabulator.value.setFilter("jobstatus", 'like', "Pending");
    } else if (filter.status === "Completed" || filter.status === "Draft") {
      // Apply exact match filter for "Completed" and "Draft"
      tabulator.value.setFilter("jobstatus", '=', filter.status);
    } else {
      // No specific status filter selected, revert to default filter
      tabulator.value.setFilter((item) => item.jobstatus.toLowerCase() !== 'completed');
    }
  }
};


// On reset filter
const onResetFilter = () => {
  setFilter({
    ...filter,
    value: "",
    jobId: "",
    status: "",
    startDate: null,
    endDate: null,
  });

  // Reset to the default view
  if (tabulator.value) {
    tabulator.value.clearFilter(true);
    tabulator.value.setFilter((item) => item.jobstatus.toLowerCase() !== 'completed');
  }
};


// Print
const onPrint = () => {
  if (tabulator.value) {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        @page {
          size: landscape;
        }
      }
    `;
    document.head.appendChild(style);

    // Trigger the print function of tabulator
    tabulator.value.print();

    // Remove the style after printing to clean up
    document.head.removeChild(style);
  }
};


const loading = ref(false); // Controls loading animation modal
// API Base URL
const API_BASE_URL = 'http://10.87.0.33:8082/api/PlanningDetails/';

onMounted(() => {
  loading.value = true; // Show loading modal at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      if (response.data.result && Array.isArray(response.data.result)) {
        let data = response.data.result;

        // Filter out items with status 'deleted'
        data = data.filter((item: any) => item.status.toLowerCase() !== 'deleted');

        // Sort data: First by "Pending" jobstatus, then by date (latest to oldest)
        const sortedData = data.sort((a: any, b: any) => {
          const isPendingA = a.jobstatus.toLowerCase().includes('pending');
          const isPendingB = b.jobstatus.toLowerCase().includes('pending');
          if (isPendingA && !isPendingB) return -1;
          if (!isPendingA && isPendingB) return 1;
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('Filtered and Sorted Data:', sortedData);

        if (tabulator.value) {
          tabulator.value.setData(sortedData);
          tabulator.value.setFilter((item) => item.jobstatus.toLowerCase() !== 'completed');
        }
      } else {
        console.warn('Unexpected response data format:', response.data);
      }
    }),

    // Additional data-fetching functions
    fetchNamesShift(),
    fetchBinId(),
    fetchMachineName(),
    fetchPlatform(),
    fetchProductCodes(),
    fetchUserDetails(),
    fetchProductList(),
    fetchType()
  ];

  // Execute all fetch calls, and hide loading modal once all are completed
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize Tabulator and other non-async functions
  initTabulator();
  reInitOnResizeWindow();
});





// Fetch job IDs on component mount
onMounted(async () => {
  generateNewJobId();
});

// Utility Functions
const formatDate = (date: any) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
};

const formatDateView = (date: Date): string => {
  const pad = (n: number) => (n < 10 ? '0' + n : n);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = date.getHours() % 12 || 12;
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';

  return `${day}/${month}/${year} ${pad(hours)}:${minutes}:${seconds} ${ampm}`;
};

const formattedDate = computed(() => {
  return formatDateView(new Date(viewData.date));
});

const formattedStartDate = computed(() => {
  return viewData.startdate ? formatDateView(new Date(viewData.startdate)) : '';
});

const formattedExpectedDate = computed(() => {
  return viewData.expecteddate ? formatDateView(new Date(viewData.expecteddate)) : '';
});

const formattedActualDate = computed(() => {
  return viewData.actualdate ? formatDateView(new Date(viewData.actualdate)) : '';
});

const isNumeric = (value: any) => {
  // Check if the value is a valid number
  return !isNaN(parseFloat(value)) && isFinite(value);
};

function getCurrentDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const viewData = reactive({
  id: null,
  date: formatDate(new Date()),
  productcode: '',
  resourcecode: '',
  employeeID: '',
  shift: '',
  jobId: '',
  sku: '',
  jobstatus: '',
  status: '',
  jobtype: 'Blending',
  remarks: '',
  platform: [] as string[],
  quantity: 0,
  noofpieces: 0,
  weightperpiece: 0,
  oracleJobId: '',
  startdate: '',
  expecteddate: '',
  actualdate: '',
  noofresources: '',
  noofmachines: '',
  machinetype: '',
  machinecode: '',
  buffer: '',
  bufferremarks: '',
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  deburringrequired: false,
  dustingrequired: false,
  replacemenntjobid: '',
  shifts: [] as string[],
  machinecodes: [] as string[],
  productcodes: [] as string[],
  bins: [] as string[],
  platforms: [] as string[],
  types: [] as string[],
  binData: [] as any[],
  machines: [] as string[],
  productData: [] as Array<{ code: string; wettreatmentrequired: boolean; plasmatreatmentrequired: boolean; deburringrequired: boolean; dustingrequired: boolean; weightperpiece: number, platform: string }>,
  productSubCodesofRecipe: [] as Array<{ id: string; productRecipeMappingId: string; jobId: string; productCode: string; percentage: ''; weight: number; blendingRequired: boolean }>,
  listMachines: [] as Array<{ code: string; type: string; machines: string[] }>,
  listBins: [] as Array<{
    id: string;
    mappingId: string;
    binMasterId: string;
    type: string;
    weight: number;
    movement: string;
    colour: string;
    capacityMin: number;
    capacityMax: number;
    reassignBinId: string;
    productCode: string;
    validated: boolean;
  }>,
  machineStation: [] as Array<{ shift: string; machineCode: string; totalWeight: number; waste: number; pMachineListBins: Array<{ id: string; mappingId: string; binMasterId: string; capacityMin: number; capacityMax: number }> }>,
});




// Form Data
const editFormData = reactive({
  id: null,
  date: formatDate(new Date()),
  productcode: '',
  resourcecode: '',
  employeeID: '',
  shift: '',
  jobId: '',
  sku: '',
  jobtype: 'Blending',
  remarks: '',
  platform: [] as string[],
  quantity: 0,
  noofpieces: 0,
  weightperpiece: 0,
  oracleJobId: '',
  startdate: '',
  expecteddate: '',
  actualdate: '',
  noofresources: '',
  noofmachines: '',
  machinetype: '',
  machinecode: '',
  buffer: '',
  bufferremarks: '',
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  deburringrequired: false,
  dustingrequired: false,
  replacemenntjobid: '',
  shifts: [] as string[],
  machinecodes: [] as string[],
  productcodes: [] as string[],
  bins: [] as string[],
  platforms: [] as string[],
  types: [] as string[],
  binData: [] as any[],
  machines: [] as string[],
  productData: [] as Array<{ code: string; wettreatmentrequired: boolean; plasmatreatmentrequired: boolean; deburringrequired: boolean; dustingrequired: boolean; weightperpiece: number, platform: string }>,
  productSubCodesofRecipe: [] as Array<{ id: string; productRecipeMappingId: string; jobId: string; productCode: string; percentage: ''; weight: number; blendingRequired: boolean }>,
  listMachines: [] as Array<{ code: string; type: string; machines: string[] }>,
  listBins: [] as Array<{
    id: string;
    mappingId: string;
    binMasterId: string;
    type: string;
    weight: number;
    movement: string;
    colour: string;
    capacityMin: number;
    capacityMax: number;
    reassignBinId: string;
    productCode: string;
    validated: boolean;
  }>,
  machineStation: [] as Array<{ shift: string; machineCode: string; totalWeight: number; waste: number; pMachineListBins: Array<{ id: string; mappingId: string; binMasterId: string; capacityMin: number; capacityMax: number }> }>,
});

const addFormData = reactive({
  productcode: '',
  date: formatDate(new Date()),
  resourcecode: '',
  employeeID: '',
  shift: '',
  jobId: '',
  sku: '',
  jobtype: 'Blending',
  remarks: '',
  platform: [] as string[],
  quantity: 0,
  noofpieces: 0,
  weightperpiece: 0,
  oracleJobId: '',
  startdate: getCurrentDateTime(),
  expecteddate: getCurrentDateTime(),
  actualdate: getCurrentDateTime(),
  noofresources: '',
  noofmachines: '',
  machinetype: '',
  machinecode: '',
  buffer: '',
  bufferremarks: '',
  wettreatmentrequired: false,
  plasmatreatmentrequired: false,
  deburringrequired: false,
  dustingrequired: false,
  replacemenntjobid: '',
  shifts: [] as string[],
  machinecodes: [] as string[],
  productcodes: [] as string[],
  bins: [] as string[],
  platforms: [] as string[],
  binData: [] as any[],
  types: [] as string[],
  machines: [] as string[],
  productData: [] as Array<{ code: string; wettreatmentrequired: boolean; plasmatreatmentrequired: boolean; deburringrequired: boolean; dustingrequired: boolean; weightperpiece: number, platform: string }>,
  productSubCodesofRecipe: [] as Array<{ id: string; productRecipeMappingId: string; serialNumber: string; jobId: string; productCode: string; percentage: ''; weight: number; blendingRequired: boolean }>,
  listMachines: [] as Array<{ code: string; type: string; machines: string[] }>,
  listBins: [] as Array<{
    id: string;
    mappingId: string;
    binMasterId: string;
    type: string;
    weight: number;
    movement: string;
    colour: string;
    capacityMin: number;
    capacityMax: number;
    reassignBinId: string;
    productCode: string;
    validated: boolean;
  }>,
  machineStation: [] as Array<{ shift: string; machineCode: string; totalWeight: number; waste: number; pMachineListBins: Array<{ id: string; mappingId: string; binMasterId: string; capacityMin: number; capacityMax: number; validated: boolean }> }>,
});

// Dropdown control for Part Number
const isPartNumberDropdownOpen = ref(false);
const searchPartNumberQuery = ref('');
const selectedPartNumber = ref(addFormData.productcode);

// Computed property to filter part numbers based on search query
const filteredPartNumbers = computed(() => {
  if (!searchPartNumberQuery.value) {
    return addFormData.productcodes; // Assuming part number options are also in addFormData.productcodes
  }
  return addFormData.productcodes.filter((productcode) =>
    productcode.toLowerCase().includes(searchPartNumberQuery.value.toLowerCase())
  );
});

// Function to toggle dropdown open/close for Part Number
const togglePartNumberDropdown = () => {
  isPartNumberDropdownOpen.value = !isPartNumberDropdownOpen.value;
  searchPartNumberQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a part number
const selectPartNumber = (productcode: any) => {
  selectedPartNumber.value = productcode;
  addFormData.productcode = productcode;
  isPartNumberDropdownOpen.value = false; // Close the dropdown after selecting
};

// Dropdown control for editing Part Number
const isEditPartNumberDropdownOpen = ref(false);
const searchEditPartNumberQuery = ref('');
const selectedEditPartNumber = ref(editFormData.productcode);

// Computed property to filter part numbers based on search query (for edit context)
const filteredEditPartNumbers = computed(() => {
  if (!searchEditPartNumberQuery.value) {
    return editFormData.productcodes;
  }
  return editFormData.productcodes.filter((productcode) =>
    productcode.toLowerCase().includes(searchEditPartNumberQuery.value.toLowerCase())
  );
});

// Function to toggle dropdown open/close for Part Number (edit context)
const toggleEditPartNumberDropdown = () => {
  isEditPartNumberDropdownOpen.value = !isEditPartNumberDropdownOpen.value;
  searchEditPartNumberQuery.value = ''; // Clear search query when dropdown is opened
};

// Function to select a part number (for edit context)
const selectEditPartNumber = (productcode: any) => {
  selectedEditPartNumber.value = productcode;
  editFormData.productcode = productcode; // Maintain binding with editFormData.productcode
  isEditPartNumberDropdownOpen.value = false; // Close the dropdown after selecting
};

// Dropdown control for adding Type and Code per machine row (add context)
const isAddTypeDropdownOpen: Ref<boolean[]> = ref([]);
const searchAddTypeQuery: Ref<string[]> = ref([]);
const isAddCodeDropdownOpen: Ref<boolean[]> = ref([]);
const searchAddCodeQuery: Ref<string[]> = ref([]);

// Computed properties for filtering types and codes based on search query (add context)
const filteredAddTypes = (index: any) => {
  if (!searchAddTypeQuery.value[index]) {
    return addFormData.types;
  }
  return addFormData.types.filter((type) =>
    type.toLowerCase().includes(searchAddTypeQuery.value[index].toLowerCase())
  );
};

const filteredAddCodes = (index: any) => {
  const machineRow = addFormData.listMachines[index];
  if (!searchAddCodeQuery.value[index] || !machineRow.type) {
    return machineRow.machines;
  }
  return machineRow.machines.filter((code) =>
    code.toLowerCase().includes(searchAddCodeQuery.value[index].toLowerCase())
  );
};

// Functions to toggle dropdown open/close for Type and Code per row (add context)
const toggleAddTypeDropdown = (index: any) => {
  isAddTypeDropdownOpen.value[index] = !isAddTypeDropdownOpen.value[index];
  searchAddTypeQuery.value[index] = ''; // Clear search query when dropdown is opened
};

const toggleAddCodeDropdown = (index: any) => {
  isAddCodeDropdownOpen.value[index] = !isAddCodeDropdownOpen.value[index];
  searchAddCodeQuery.value[index] = ''; // Clear search query when dropdown is opened
};

// Functions to select Type and Code per row (add context)
const selectAddType = (index: any, type: any) => {
  addFormData.listMachines[index].type = type;
  fetchMachineCode(type, 'add', index); // Fetch machine codes for the selected type
  isAddTypeDropdownOpen.value[index] = false; // Close the dropdown after selecting
};

const selectAddCode = (index: any, code: any) => {
  addFormData.listMachines[index].code = code;
  isAddCodeDropdownOpen.value[index] = false; // Close the dropdown after selecting
};


// Corrected type for the isTypeDropdownOpen array (array of booleans)
const isTypeDropdownOpen: Ref<boolean[]> = ref([]);

// Corrected type for the isCodeDropdownOpen array (array of booleans)
const isCodeDropdownOpen: Ref<boolean[]> = ref([]);

// Corrected type for search queries (array of strings)
const searchTypeQuery: Ref<string[]> = ref([]);
const searchCodeQuery: Ref<string[]> = ref([]);



// Computed property to filter types based on search query for each row
const filteredTypes = (index: any) => {
  if (!searchTypeQuery.value[index]) {
    return editFormData.types;
  }
  return editFormData.types.filter((type) =>
    type.toLowerCase().includes(searchTypeQuery.value[index].toLowerCase())
  );
};

// Computed property to filter codes based on search query for each row
const filteredCodes = (index: any) => {
  if (!searchCodeQuery.value[index]) {
    return editFormData.listMachines[index].machines;
  }
  return editFormData.listMachines[index].machines.filter((code) =>
    code.toLowerCase().includes(searchCodeQuery.value[index].toLowerCase())
  );
};

// Function to toggle dropdown open/close for Type
const toggleTypeDropdown = (index: any) => {
  isTypeDropdownOpen.value[index] = !isTypeDropdownOpen.value[index];
  searchTypeQuery.value[index] = ''; // Clear search query when dropdown is opened
};

// Function to toggle dropdown open/close for Code
const toggleCodeDropdown = (index: any) => {
  isCodeDropdownOpen.value[index] = !isCodeDropdownOpen.value[index];
  searchCodeQuery.value[index] = ''; // Clear search query when dropdown is opened
};

// Function to select a type
const selectType = (index: any, type: any) => {
  editFormData.listMachines[index].type = type;
  fetchMachineCode(type, 'edit', index);
  isTypeDropdownOpen.value[index] = false; // Close the dropdown after selecting
};

// Function to select a code
const selectCode = (index: any, code: any) => {
  editFormData.listMachines[index].code = code;
  isCodeDropdownOpen.value[index] = false; // Close the dropdown after selecting
};


// Define permission variables for planning
let canEditPlanning = false;
let canDeletePlanning = false;
const canCreatePlanning = ref(false);

// Define the fetchUserPlanningPermissions function
const fetchUserPlanningPermissions = async () => {
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

      const planning = userDetails.planning || ''; // Ensure the value is a string

      // Check if the string contains "Create", "Delete", and "Edit" for planning
      canCreatePlanning.value = planning.includes('Create');
      canDeletePlanning = planning.includes('Delete');
      canEditPlanning = planning.includes('Edit');

      console.log('canCreatePlanning:', canCreatePlanning.value); // Debugging log
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

// Call the fetchUserPlanningPermissions function to get permissions
fetchUserPlanningPermissions();


const fetchType = () => {
  axios.get('http://10.87.0.33:8082/api/MachineTypeMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.types = activeNameData.map(item => item.name);
        editFormData.types = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};


const fetchMachineCode = (selectedType: any, formType: any, rowIndex: any) => {
  axios.get('http://10.87.0.33:8082/api/MachineMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive" and match the selected type
        const activeNameData = nameData.filter(item =>
          item.status.toLowerCase() !== 'inactive' &&
          item.type === selectedType
        );

        // Update the specific row's machines array based on formType and rowIndex
        if (formType === 'add') {
          addFormData.listMachines[rowIndex].machines = activeNameData.map(item => item.name);
        } else if (formType === 'edit') {
          editFormData.listMachines[rowIndex].machines = activeNameData.map(item => item.name);
        }
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};



// Define isBlendingJobType as a computed property
const isBlendingJobType: ComputedRef<boolean> = computed(() => addFormData.jobtype === 'Blending');
const isBlendingJobTypeEdit: ComputedRef<boolean> = computed(() => editFormData.jobtype === 'Blending');


const isMachineJobType = computed(() => addFormData.jobtype === 'Blending');
const isMachineJobTypeEdit = computed(() => editFormData.jobtype === 'Blending');



const addRowMachine = (formData: any) => {
  formData.listMachines.push({
    code: '',
    type: '',
  });
};

// Add row to addFormData
const addRowsToAddFormMachine = (count: number) => {
  addFormData.listMachines = [];
  for (let i = 0; i < count; i++) {
    addRowMachine(addFormData);
  }
};

// Add row to editFormData
const addRowsToEditFormMachine = (count: any) => {
  const currentLength = editFormData.listMachines.length;

  // If the new count is greater than the current length, add new empty rows
  if (count > currentLength) {
    for (let i = currentLength; i < count; i++) {
      editFormData.listMachines.push({ code: '', type: '', machines: [] });
    }
  } else {
    // If the new count is less than or equal to the current length, truncate the list
    editFormData.listMachines.length = count;
  }

  console.log('listMachines:', editFormData.listMachines);
};

watch(() => editFormData.noofmachines, (newVal) => {
  if (newVal) {
    addRowsToEditFormMachine(parseInt(newVal));
  } else {
    editFormData.listMachines = [];
  }
});



watch(() => addFormData.noofmachines, (newVal) => {
  if (newVal) {
    addRowsToAddFormMachine(parseInt(newVal));
  } else {
    addFormData.listMachines = [];
  }
});

const addRow = (formData: any) => {
  formData.productSubCodesofRecipe.push({
    id: formData.id,
    productRecipeMappingId: formData.productRecipeMappingId,
    serialNumber: formData.serialNumber,
    jobId: formData.jobId,
    productCode: '',
    percentage: '',
    weight: 0,
    blendingRequired: false
  });
};

// Add row to addFormData
const addRowToAddForm = () => {
  addRow(addFormData);
};

// Add row to editFormData

// const addRowToEditForm = () => {
//   editFormData.productSubCodesofRecipe.push({
//     jobId: editFormData.jobId,
//     productCode: '',
//     percentage: '',
//     weight: '',
//     blendingRequired: false
//   });
// };

// const deleteAddRow = (index: number) => {
//   addFormData.productSubCodesofRecipe.splice(index, 1);
// };

// const deleteRowFromEditForm = (index: number) => {
//   editFormData.productSubCodesofRecipe.splice(index, 1);
// };




watch(() => editFormData.jobtype, (newJobType) => {
  if (newJobType === 'Blending' && editFormData.listBins.length === 0) {
    addRowBlendingToEditForm();
  }
  if (newJobType === 'Blending' && editFormData.machineStation.length === 0) {
    addRowMachineStationToEditForm();
  }
});


const addRowMachineToEditForm = () => {
  editFormData.listMachines.push({
    code: '',
    type: '',
    machines: [],
  });
};



watch(() => editFormData.jobtype, (newJobType) => {
  if (newJobType === 'Blending' && editFormData.listBins.length === 0) {
    addRowBlendingToEditForm();
  }
  if (newJobType === 'Blending' && editFormData.machineStation.length === 0) {
    addRowMachineStationToEditForm();
  }
});

const addRowBlendingToEditForm = () => {
  editFormData.listBins.push({
    id: '',
    mappingId: '',
    binMasterId: '',
    type: '',
    weight: 0,
    movement: '',
    colour: '',
    capacityMin: 0,
    capacityMax: 0,
    reassignBinId: '',
    productCode: '',
    validated: false
  });
};




const addRowMachineStationToEditForm = () => {
  if (!Array.isArray(editFormData.machineStation)) {
    editFormData.machineStation = [];
  }
  editFormData.machineStation.push({
    shift: '',
    machineCode: '',
    totalWeight: 0,
    waste: 0,
    pMachineListBins: []
  });
};

const addRowToListBinsMachineEditForm = (machineIndex: any) => {
  if (!Array.isArray(editFormData.machineStation[machineIndex].pMachineListBins)) {
    editFormData.machineStation[machineIndex].pMachineListBins = [];
  }
  editFormData.machineStation[machineIndex].pMachineListBins.push({
    id: '',
    mappingId: '',
    binMasterId: '',
    capacityMin: 0,
    capacityMax: 0
  });
};



const deleteRowFromListBinsMachineEditForm = (machineIndex: number, binIndex: number) => {
  const bin = editFormData.machineStation[machineIndex].pMachineListBins[binIndex];

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you really want to delete this bin?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then(result => {
    if (result.isConfirmed) {
      if (bin.id) {
        // Call delete API for existing data
        deleteListBin(bin.id).then(() => {
          editFormData.machineStation[machineIndex].pMachineListBins.splice(binIndex, 1);
          Swal.fire({
            icon: 'success',
            title: 'The bin has been deleted.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            position: 'top-end',
            toast: true,
            iconColor: 'green',
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        }).catch(error => {
          console.error('Error deleting list bin:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to delete the bin.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            position: 'top-end',
            toast: true,
            iconColor: 'red',
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        });
      } else {
        // Just remove the row for new data
        editFormData.machineStation[machineIndex].pMachineListBins.splice(binIndex, 1);
      }
    }
  });
};








const addRowMachineStation = () => {
  if (!Array.isArray(addFormData.machineStation)) {
    addFormData.machineStation = [];
  }
  addFormData.machineStation.push({
    shift: '',
    machineCode: '',
    totalWeight: 0,
    waste: 0,
    pMachineListBins: []
  });
};

const addRowToListBinsMachine = (machineIndex: number) => {
  addFormData.machineStation[machineIndex].pMachineListBins.push({
    id: '',
    mappingId: '',
    binMasterId: '',
    capacityMin: 0,
    capacityMax: 0,
    validated: false
  });
};

const addRowToListBinsMachineEdit = (machineIndex: number) => {
  editFormData.machineStation[machineIndex].pMachineListBins.push({
    id: '',
    mappingId: '',
    binMasterId: '',
    capacityMin: 0,
    capacityMax: 0
  });
};



const deleteRowFromListBinsMachine = (machineIndex: number, binIndex: number) => {
  addFormData.machineStation[machineIndex].pMachineListBins.splice(binIndex, 1);
};


// Automatically generate a new unique job ID
const generateNewJobId = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/PlanningDetails/GetJobId');
    if (response.status === 200 && response.data) {
      addFormData.jobId = response.data;  // Assuming the API returns the job ID as a plain string (e.g., 'J693')
    } else {
      console.error('Unexpected response format:', response);
    }
  } catch (error) {
    console.error('Error fetching new job ID:', error);
  }
};

const fetchNamesShift = () => {
  axios.get('http://10.87.0.33:8082/api/ShiftMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.shifts = activeNameData.map(item => item.name);
        editFormData.shifts = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

const fetchBinId = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/BinMaster');
    const nameData = response.data.result;

    if (Array.isArray(nameData)) {
      // Filter out items with status "Inactive" or "InActive"
      const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

      // Map the activeNameData array to extract the 'id' property
      addFormData.bins = activeNameData.map(item => item.id);
      editFormData.bins = activeNameData.map(item => item.id);

      // Store the full bin data for later use
      addFormData.binData = activeNameData;
      editFormData.binData = activeNameData;
    } else {
      console.error('Invalid response format for name:', nameData);
    }
  } catch (error) {
    console.error('Error fetching names:', error);
  }
};

// Method to find bin details by id
const getBinDetails = (binMasterId: any) => {
  const bin = addFormData.binData.find(bin => bin.id === binMasterId) || editFormData.binData.find(bin => bin.id === binMasterId);
  return bin || {};
};

const updateCapacityValues = (binMasterId: any, row: any) => {
  const binDetails = getBinDetails(binMasterId);
  if (binDetails) {
    row.capacityMin = binDetails.capacityMin;
    row.capacityMax = binDetails.capacityMax;
  }
};

const fetchMachineName = () => {
  axios.get('http://10.87.0.33:8082/api/MachineCodeMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive');

        // Map the activeNameData array to extract the 'name' property
        addFormData.machinecodes = activeNameData.map(item => item.machinecode);
        editFormData.machinecodes = activeNameData.map(item => item.machinecode);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};
const fetchProductCodes = () => {
  axios.get('http://10.87.0.33:8082/api/ProductMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive' && item.productType === 'Product'
        );

        // Store the complete product data
        const productData = activeNameData.map(item => ({
          code: item.code,
          wettreatmentrequired: item.wettreatmentrequired,
          plasmatreatmentrequired: item.plasmatreatmentrequired,
          deburringrequired: item.deburringrequired,
          dustingrequired: item.dustingrequired,
          weightperpiece: item.weightperpiece, // Ensure weightperpiece is included
          platform: item.platform // Ensure platform is included
        }));

        addFormData.productcodes = productData.map(item => item.code);
        editFormData.productcodes = productData.map(item => item.code);

        // Store the product data globally for later use
        addFormData.productData = productData;
        editFormData.productData = productData;
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};

watch(() => addFormData.productcode, (newVal) => {
  if (newVal) {
    const selectedProduct = addFormData.productData.find(product => product.code === newVal);
    if (selectedProduct && selectedProduct.platform) {
      addFormData.platform = selectedProduct.platform.split(',');
    } else {
      addFormData.platform = [];
    }
  } else {
    addFormData.platform = [];
  }
});



const fetchUserDetails = async () => {
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

    // Fetch user details from the UserRegistration API
    const userRegistrationResponse = await axios.get('http://10.87.0.33:8082/api/UserRegistration');
    let userDetails = userRegistrationResponse.data.result.find((user: any) => user.id === userId);

    // If userDetails are not found in UserRegistration API, check the UserMaster API
    if (!userDetails) {
      console.log('User not found in UserRegistration API, checking UserMaster API'); // Debugging line

      const userMasterResponse = await axios.get('http://10.87.0.33:8082/api/UserMaster');
      userDetails = userMasterResponse.data.result.find((user: any) => user.id === userId && user.status === 'active');
    }

    // Check if userDetails are found and fetch the employeeId
    if (userDetails) {
      console.log('Fetched user details:', userDetails); // Debugging line
      const employeeId = userDetails.employeeid; // Get the employee ID
      console.log('Employee ID:', employeeId); // Debugging line
      addFormData.resourcecode = employeeId; // Set the employee ID in form data
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'User details not found'
      });
    }
  } catch (error) {
    console.error('Error fetching user details:', error); // Debugging line
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while fetching user details'
    });
  }
};


// Watcher for addFormData.productcode
watch(() => addFormData.productcode, (newCode) => {
  const selectedProduct = addFormData.productData.find(product => product.code === newCode);
  if (selectedProduct) {
    addFormData.dustingrequired = selectedProduct.dustingrequired;
    addFormData.wettreatmentrequired = selectedProduct.wettreatmentrequired;
    addFormData.plasmatreatmentrequired = selectedProduct.plasmatreatmentrequired;
    addFormData.deburringrequired = selectedProduct.deburringrequired;
    addFormData.weightperpiece = selectedProduct.weightperpiece;
    if (addFormData.noofpieces) {
      // Convert weightperpiece from grams to kilograms
      addFormData.quantity = (addFormData.noofpieces * selectedProduct.weightperpiece) / 1000;
    }
  } else {
    addFormData.dustingrequired = false;
    addFormData.wettreatmentrequired = false;
    addFormData.plasmatreatmentrequired = false;
    addFormData.deburringrequired = false;
    addFormData.weightperpiece = 0;
  }
});

watch(() => addFormData.noofpieces, (newNoOfPieces) => {
  if (addFormData.weightperpiece) {
    // Convert weightperpiece from grams to kilograms
    addFormData.quantity = (newNoOfPieces * addFormData.weightperpiece) / 1000;
  }
});



// Watcher for editFormData
watch(() => addFormData.productcode, (newCode) => {
  const selectedProduct = addFormData.productData.find(product => product.code === newCode);
  if (selectedProduct) {
    addFormData.dustingrequired = selectedProduct.dustingrequired ?? false;
    addFormData.wettreatmentrequired = selectedProduct.wettreatmentrequired ?? false;
    addFormData.plasmatreatmentrequired = selectedProduct.plasmatreatmentrequired ?? false;
    addFormData.deburringrequired = selectedProduct.deburringrequired ?? false;
    addFormData.weightperpiece = selectedProduct.weightperpiece || 0;
    if (addFormData.noofpieces) {
      addFormData.quantity = (addFormData.noofpieces * selectedProduct.weightperpiece) / 1000;
    }
  } else {
    addFormData.dustingrequired = false;
    addFormData.wettreatmentrequired = false;
    addFormData.plasmatreatmentrequired = false;
    addFormData.deburringrequired = false;
    addFormData.weightperpiece = 0;
  }
});


watch(() => editFormData.noofpieces, (newNoOfPieces) => {
  if (editFormData.weightperpiece) {
    editFormData.quantity = (newNoOfPieces * editFormData.weightperpiece) / 1000;
  }
});



const fetchProductSubCodes = (productCode: string) => {
  axios.get(`http://10.87.0.33:8082/api/ProductMaster/GetProductReceiptdatabyProductCode/${productCode}`)
    .then(response => {
      const result = response.data.result;
      if (Array.isArray(result)) {
        const mappedSubCodes = result.map((item: any) => ({
          id: item.id,
          jobId: '',
          productCode: item.productCode,
          percentage: item.percentage.toString(), // Ensure it's a string to match the type
          weight: item.weight,
          blendingRequired: !!item.blendingRequired,
        }));

        const sortedSubCodes = sortProductSubCodes(mappedSubCodes);
        addFormData.productSubCodesofRecipe = sortedSubCodes;
        editFormData.productSubCodesofRecipe = sortedSubCodes;

        // Initial weight calculation only if quantity is already set
        if (addFormData.quantity) {
          updateWeights(addFormData.quantity);
        }
        if (editFormData.quantity) {
          updateWeights(editFormData.quantity);
        }
      } else {
        console.error('Invalid response format for product sub codes:', result);
      }
    })
    .catch(error => {
      console.error('Error fetching product sub codes:', error);
    });
};

// Helper function to parse and sort product codes
function generateSerialNumbers(sortedSubCodes: any[]) {
  const serialNumbers: { [key: string]: string } = {};

  const generateSerial = (code: string, parentSerial: string = ''): string => {
    if (!serialNumbers[code]) {
      const siblings = sortedSubCodes.filter((subCode: any) => {
        const subCodeParts = subCode.productCode.split('|');
        const codeParts = code.split('|');
        return (
          subCodeParts.length === codeParts.length &&
          subCodeParts.slice(0, -1).join('|') === codeParts.slice(0, -1).join('|')
        );
      });

      const siblingIndex = siblings.findIndex((subCode: any) => subCode.productCode === code) + 1;
      serialNumbers[code] = `${parentSerial}${siblingIndex}`;
    }
    return serialNumbers[code];
  };

  sortedSubCodes.forEach((subCode: any) => {
    const codeParts = subCode.productCode.split('|');
    let serial = '';
    codeParts.forEach((_part: any, index: number) => {
      const partialCode = codeParts.slice(0, index + 1).join('|');
      serial = generateSerial(partialCode, serial ? `${serial}.` : '');
    });
  });

  sortedSubCodes.forEach((subCode: any) => {
    subCode.serialNumber = serialNumbers[subCode.productCode].replace(/^0*(\.0*)?/, ''); // Remove leading zeros and '0.'
  });

  return sortedSubCodes;
}



function sortProductSubCodes(subCodes: any) {
  subCodes.sort((a: any, b: any) => {
    const aParts = parseProductCode(a.productCode);
    const bParts = parseProductCode(b.productCode);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      if (aParts[i] !== bParts[i]) {
        return (aParts[i] || 0) - (bParts[i] || 0);
      }
    }
    return 0;
  });

  return generateSerialNumbers(subCodes);
}

// Helper function to parse and sort product codes
function parseProductCode(code: string): number[] {
  return code.split('|').map((part) => {
    // Extract numeric parts only, removing any non-digit characters
    return parseInt(part.replace(/\D/g, ''), 10);
  });
}

// Update weights based on total quantity and percentages
function updateWeights(totalWeight: any) {
  const productSubCodes = addFormData.productSubCodesofRecipe || [];

  const calculateWeight = (parentCode: any, parentWeight: any) => {
    const children = productSubCodes.filter(code => code.productCode.startsWith(parentCode + '|') && code.productCode.split('|').length === parentCode.split('|').length + 1);

    children.forEach(child => {
      const percentage = parseFloat(child.percentage);
      const childWeight = (percentage / 100) * parentWeight;
      child.weight = childWeight;

      // Recursively calculate for any sub-children
      calculateWeight(child.productCode, childWeight);
    });
  };

  // Start by calculating the weight for the main product (level 1)
  const mainProducts = productSubCodes.filter(code => code.productCode.split('|').length === 2);
  mainProducts.forEach(mainProduct => {
    const mainPercentage = parseFloat(mainProduct.percentage);
    const mainWeight = (mainPercentage / 100) * totalWeight;
    mainProduct.weight = mainWeight;

    // Recursively calculate for all children
    calculateWeight(mainProduct.productCode, mainWeight);
  });

  // Ensure the weights are updated in the forms
  addFormData.productSubCodesofRecipe = [...productSubCodes];
  editFormData.productSubCodesofRecipe = [...productSubCodes];
}

// Watch for changes in the number of pieces and update weights accordingly
watch(() => addFormData.noofpieces, (newNoOfPieces) => {
  if (addFormData.weightperpiece) {
    const totalWeight = (newNoOfPieces * addFormData.weightperpiece) / 1000; // Convert to kilograms
    updateWeights(totalWeight);
  }
});

watch(() => editFormData.noofpieces, (newNoOfPieces) => {
  if (editFormData.weightperpiece) {
    const totalWeight = (newNoOfPieces * editFormData.weightperpiece) / 1000; // Convert to kilograms
    updateWeights(totalWeight);
  }
});


// Example usage in watch function
watch(() => addFormData.weightperpiece, (newWeightperpiece) => {
  updateWeights(newWeightperpiece);
});

watch(() => editFormData.weightperpiece, (newWeightperpiece) => {
  updateWeights(newWeightperpiece);
});


// Watch for productCode changes in addFormData and editFormData
watch(() => addFormData.productcode, (newVal) => {
  fetchProductSubCodes(newVal);
  updateFormDataBasedOnProductCode(addFormData, newVal);
});

watch(() => editFormData.productcode, (newVal) => {
  fetchProductSubCodes(newVal);
  updateFormDataBasedOnProductCode(editFormData, newVal);
});

function updateFormDataBasedOnProductCode(formData: any, newCode: string) {
  const selectedProduct = formData.productData.find((product: any) => product.code === newCode);
  if (selectedProduct) {
    formData.blowrequired = selectedProduct.blowrequired;
    formData.chemicaltreatmentrequired = selectedProduct.chemicaltreatmentrequired;
    formData.weightperpiece = selectedProduct.weightperpiece;
    if (formData.noofpieces) {
      formData.quantity = formData.noofpieces * selectedProduct.weightperpiece;
    }
  } else {
    formData.blowrequired = false;
    formData.chemicaltreatmentrequired = false;
    formData.weightperpiece = 0;
  }
}

// Watch for noofpieces changes in editFormData
watch(() => editFormData.noofpieces, (newNoOfPieces) => {
  if (editFormData.weightperpiece) {
    editFormData.quantity = (newNoOfPieces * editFormData.weightperpiece) / 1000;
  }
});

// const normalizeWeight = (percentage: number, totalPercentage: number): number => {
//   return Math.round((percentage / totalPercentage) * 100);
// };

const fetchPlatform = async () => {
  axios.get('http://10.87.0.33:8082/api/PlatformMaster')
    .then(response => {
      const nameData = response.data.result;

      if (Array.isArray(nameData)) {
        // Filter out items with status "Inactive" or "InActive"
        const activeNameData = nameData.filter(item => item.status.toLowerCase() !== 'inactive'
        );

        // Map the activeNameData array to extract the 'name' property
        addFormData.platforms = activeNameData.map(item => item.name);
        editFormData.platforms = activeNameData.map(item => item.name);
      } else {
        console.error('Invalid response format for name:', nameData);
      }
    })
    .catch(error => {
      console.error('Error fetching names:', error);
    });
};



watch(() => addFormData.productcode, (newProductCode) => {
  if (newProductCode) {
    fetchProductSubCodes(newProductCode);
  } else {
    addFormData.productSubCodesofRecipe = [];
  }
});

interface Product {
  code: string;
  containsRecipe: boolean;
}

const productList: Product[] = reactive([]);

const fetchProductList = async () => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/ProductMaster');
    const nameData = response.data.result;

    if (Array.isArray(nameData)) {
      productList.push(...nameData);
    } else {
      console.error('Invalid response format for name:', nameData);
    }
  } catch (error) {
    console.error('Error fetching product list:', error);
  }
};

watch(() => addFormData.productcode, (newCode) => {
  if (newCode) {
    const selectedProduct = productList.find(product => product.code === newCode);
    if (selectedProduct) {
      addFormData.jobtype = selectedProduct.containsRecipe ? 'Blending' : 'Blending';
    } else {
      addFormData.jobtype = 'Blending';
    }
  } else {
    addFormData.jobtype = 'Blending';
  }
});

watch(() => editFormData.productcode, (newCode) => {
  if (newCode) {
    const selectedProduct = productList.find(product => product.code === newCode);
    if (selectedProduct) {
      editFormData.jobtype = selectedProduct.containsRecipe ? 'Blending' : 'Blending';
    } else {
      editFormData.jobtype = 'Blending';
    }
  } else {
    editFormData.jobtype = 'Blending';
  }
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

interface Bin {
  type: string;
  weight: number;
  reassignBinId: string;
  productCode: string;
}


interface Machine {
  shift: string;
  machineCode: string;
  totalWeight: number;
  waste: number;
  listBins: Bin[];
}

// Fetch and Set Data for Edit/View
// Fetch data and set in the formData when editing
const fetchAndSetData = async (id: string, formData: any, modalSetter: (value: boolean) => void, isView = false) => {
  loading.value = true; // Start loading animation

  try {
    const response = await axios.get(`${API_BASE_URL}${id}`);
    const data = response.data.result;

    if (data && data.length > 0) {
      const item = data.find((d: any) => d.id === id);
      if (item) {
        console.log('Retrieved Data:', item);

        const platformData = isView ? item.platform : (item.platform ? item.platform.split(',') : []);

        Object.assign(formData, {
          id: item.id,
          productcode: item.productcode,
          date: item.date || new Date().toISOString().substring(0, 10),
          resourcecode: item.resourcecode || '',
          shift: item.shift || '',
          jobId: item.jobId || '',
          sku: item.sku || '',
          jobtype: item.jobtype || '',
          remarks: item.remarks || '',
          quantity: item.quantity || 0,
          startdate: item.startdate || '',
          jobstatus: item.jobstatus || '',
          status: item.status || '',
          platform: platformData,
          expecteddate: item.expecteddate || '',
          actualdate: item.actualdate || '',
          noofresources: item.noofresources || '',
          noofmachines: item.noofmachines || '',
          machinetype: item.machinetype || '',
          machinecode: item.machinecode || '',
          buffer: item.buffer || '',
          bufferremarks: item.bufferremarks || '',
          wettreatmentrequired: !!item.wettreatmentrequired,
          plasmatreatmentrequired: item.plasmatreatmentrequired,
          deburringrequired: !!item.deburringrequired,
          dustingrequired: !!item.dustingrequired,
          replacemenntjobid: item.replacemenntjobid || '',
          noofpieces: item.noofpieces || '',
          oracleJobId: item.oracleJobId || '',
          productSubCodesofRecipe: item.productSubCodesofRecipe || [],
          listBins: item.listBins || [],
          listMachines: item.listMachines || [],
        });

        selectedEditPartNumber.value = item.productcode;

        modalSetter(true);
      } else {
        console.error('No data found for the specified ID:', id);
      }
    } else {
      console.error('No data found in the response');
    }
  } catch (error) {
    console.error('Error fetching data for editing:', error);
  } finally {
    loading.value = false; // End loading animation
  }
};





const editRole = (id: any) => fetchAndSetData(id, editFormData, setEditSlideOver);
const viewRole = (id: any) => fetchAndSetData(id, viewData, setviewModal, true);


// Update Table Data
const updateTableData = () => {
  loading.value = true; // Show loading modal at the start

  // Define an array of promises to fetch all necessary data
  const fetchPromises = [
    axios.get(API_BASE_URL).then(response => {
      if (response.data.result && Array.isArray(response.data.result)) {
        let data = response.data.result;

        // Filter out items with status 'deleted'
        data = data.filter((item: any) => item.status.toLowerCase() !== 'deleted');

        // Sort data: First by "Pending" jobstatus, then by date (latest to oldest)
        const sortedData = data.sort((a: any, b: any) => {
          const isPendingA = a.jobstatus.toLowerCase().includes('pending');
          const isPendingB = b.jobstatus.toLowerCase().includes('pending');
          if (isPendingA && !isPendingB) return -1;
          if (!isPendingA && isPendingB) return 1;
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime();
        });

        console.log('Filtered and Sorted Data:', sortedData);

        if (tabulator.value) {
          tabulator.value.setData(sortedData);
          tabulator.value.setFilter((item) => item.jobstatus.toLowerCase() !== 'completed');
        }
      } else {
        console.warn('Unexpected response data format:', response.data);
      }
    }),

    // Additional data-fetching functions
    fetchNamesShift(),
    fetchBinId(),
    fetchMachineName(),
    fetchPlatform(),
    fetchProductCodes(),
    fetchUserDetails(),
    fetchProductList(),
  generateNewJobId(),
    fetchType()
  ];

  // Execute all fetch calls, and hide loading modal once all are completed
  Promise.all(fetchPromises)
    .then(() => {
      console.log("All data and initializations loaded successfully.");
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    })
    .finally(() => {
      loading.value = false; // Hide loading modal once all tasks are completed
    });

  // Initialize Tabulator and other non-async functions
  initTabulator();
  reInitOnResizeWindow();

};



// Update Role
const updateRole = () => {
  if (!editFormData.productcode || !editFormData.resourcecode || !editFormData.startdate || !editFormData.expecteddate || !editFormData.actualdate || !editFormData.quantity || !editFormData.noofmachines || !editFormData.noofpieces) {
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
    // Update mappingId for listBins
    editFormData.listBins = editFormData.listBins.map(item => ({
      ...item,
      mappingId: editFormData.jobId
    }));

    // Update mappingId for machineStation's listBins
    if (isMachineJobTypeEdit.value) {
      editFormData.machineStation = editFormData.machineStation.map(machine => ({
        ...machine,
        listBins: machine.pMachineListBins.map(bin => ({
          ...bin,
          mappingId: editFormData.jobId
        }))
      }));
    }
    let platformString = '';
    if (Array.isArray(editFormData.platform)) {
      platformString = editFormData.platform.join(',');
    }
    const payload = {
      productcode: editFormData.productcode,
      date: editFormData.date,
      resourcecode: editFormData.resourcecode,
      employeeID: editFormData.resourcecode,
      shift: editFormData.shift,
      jobId: editFormData.jobId,
      sku: editFormData.sku,
      jobtype: editFormData.jobtype,
      platform: platformString,
      remarks: editFormData.remarks,
      quantity: editFormData.quantity,
      startdate: editFormData.startdate,
      expecteddate: editFormData.expecteddate,
      actualdate: editFormData.actualdate,
      noofresources: parseInt(editFormData.noofresources) || 0,
      noofmachines: parseInt(editFormData.noofmachines) || 0,
      buffer: parseFloat(editFormData.buffer) || 0,
      bufferremarks: editFormData.bufferremarks,
      wettreatmentrequired: !!editFormData.wettreatmentrequired, // Ensure boolean
      plasmatreatmentrequired: !!editFormData.plasmatreatmentrequired, // Ensure boolean
      deburringrequired: !!editFormData.deburringrequired, // Ensure boolean
      dustingrequired: !!editFormData.dustingrequired, // Ensure boolean
      replacemenntjobid: editFormData.replacemenntjobid,
      noofpieces: editFormData.noofpieces,
      oracleJobId: editFormData.oracleJobId,
      listMachines: editFormData.listMachines.map(item => ({
        code: item.code,
        type: item.type,
      })),
      productSubCodesofRecipe: editFormData.productSubCodesofRecipe.map(item => ({
        id: item.id,
        productRecipeMappingId: editFormData.jobId,
        jobId: editFormData.jobId,
        productCode: item.productCode,
        percentage: parseFloat(item.percentage) || 0,
        weight: item.weight, // Ensure weight is a number
        blendingRequired: item.blendingRequired
      })),
      listBins: editFormData.listBins.map(item => ({
        mappingId: item.mappingId,
        type: item.type,
        weight: item.weight,
        movement: item.movement,
        colour: item.colour,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
        reassignBinId: item.reassignBinId,
        productCode: item.productCode,
      })),
      machineStation: isMachineJobTypeEdit.value ? editFormData.machineStation.map(machine => ({
        shift: machine.shift,
        machineCode: machine.machineCode,
        totalWeight: parseFloat(machine.totalWeight.toString()) || 0, // Ensure totalWeight is parsed as a float
        waste: parseFloat(machine.waste.toString()) || 0,
        listBins: machine.pMachineListBins.map(bin => ({
          mappingId: bin.mappingId,
          capacityMin: parseFloat(bin.capacityMin.toString()) || 0,
          capacityMax: parseFloat(bin.capacityMax.toString()) || 0,
        }))
      })) : [],
    };

    // Log the payload
    console.log('Payload:', JSON.stringify(payload, null, 2));

    Swal.fire({
      title: 'Are you sure?',
      text: 'This will update the data!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, update it!',
    }).then(result => {
      if (result.isConfirmed) {
        axios.post(`http://10.87.0.33:8082/api/PlanningDetails/SubmitPlanningDetails`, payload)
          .then(() => {
            setEditSlideOver(false);
            updateTableData();
            fetchNamesShift();
            fetchBinId();
            fetchMachineName();
            fetchPlatform();
            fetchProductCodes();
            fetchUserDetails();
            fetchProductList();
            fetchType();
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
          .catch(error => handleError(error, 'Error updating data'));
      }
    });
  }
};
const release = () => {
  if (!editFormData.productcode || !editFormData.resourcecode || !editFormData.startdate || !editFormData.expecteddate || !editFormData.actualdate || !editFormData.quantity || !editFormData.noofmachines || !editFormData.noofpieces) {
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
    // Update mappingId for listBins
    editFormData.listBins = editFormData.listBins.map(item => ({
      ...item,
      mappingId: editFormData.jobId
    }));

    // Update mappingId for machineStation's listBins
    if (isMachineJobTypeEdit.value) {
      editFormData.machineStation = editFormData.machineStation.map(machine => ({
        ...machine,
        listBins: machine.pMachineListBins.map(bin => ({
          ...bin,
          mappingId: editFormData.jobId
        }))
      }));
    }
    let platformString = '';
    if (Array.isArray(editFormData.platform)) {
      platformString = editFormData.platform.join(',');
    }
    const payload = {
      productcode: editFormData.productcode,
      date: editFormData.date,
      resourcecode: editFormData.resourcecode,
      employeeID: editFormData.resourcecode,
      shift: editFormData.shift,
      jobId: editFormData.jobId,
      sku: editFormData.sku,
      jobtype: editFormData.jobtype,
      platform: platformString,
      remarks: editFormData.remarks,
      quantity: editFormData.quantity,
      startdate: editFormData.startdate,
      expecteddate: editFormData.expecteddate,
      actualdate: editFormData.actualdate,
      noofresources: parseInt(editFormData.noofresources) || 0,
      noofmachines: parseInt(editFormData.noofmachines) || 0,
      buffer: parseFloat(editFormData.buffer) || 0,
      bufferremarks: editFormData.bufferremarks,
      wettreatmentrequired: !!editFormData.wettreatmentrequired, // Ensure boolean
      plasmatreatmentrequired: !!editFormData.plasmatreatmentrequired, // Ensure boolean
      deburringrequired: !!editFormData.deburringrequired, // Ensure boolean
      dustingrequired: !!editFormData.dustingrequired, // Ensure boolean
      replacemenntjobid: editFormData.replacemenntjobid,
      noofpieces: editFormData.noofpieces,
      oracleJobId: editFormData.oracleJobId,
      listMachines: editFormData.listMachines.map(item => ({
        code: item.code,
        type: item.type,
      })),
      productSubCodesofRecipe: editFormData.productSubCodesofRecipe.map(item => ({
        id: item.id,
        productRecipeMappingId: editFormData.jobId,
        jobId: editFormData.jobId,
        productCode: item.productCode,
        percentage: parseFloat(item.percentage) || 0,
        weight: item.weight, // Ensure weight is a number
        blendingRequired: item.blendingRequired
      })),
      listBins: editFormData.listBins.map(item => ({
        mappingId: item.mappingId,
        type: item.type,
        weight: item.weight,
        movement: item.movement,
        colour: item.colour,
        capacityMin: item.capacityMin,
        capacityMax: item.capacityMax,
        reassignBinId: item.reassignBinId,
        productCode: item.productCode,
      })),
      machineStation: isMachineJobTypeEdit.value ? editFormData.machineStation.map(machine => ({
        shift: machine.shift,
        machineCode: machine.machineCode,
        totalWeight: parseFloat(machine.totalWeight.toString()) || 0, // Ensure totalWeight is parsed as a float
        waste: parseFloat(machine.waste.toString()) || 0,
        listBins: machine.pMachineListBins.map(bin => ({
          mappingId: bin.mappingId,
          capacityMin: parseFloat(bin.capacityMin.toString()) || 0,
          capacityMax: parseFloat(bin.capacityMax.toString()) || 0,
        }))
      })) : [],
    };

    // Log the payload
    console.log('Payload:', JSON.stringify(payload, null, 2));

    Swal.fire({
      title: 'Are you sure?',
      text: 'This will data will release to production!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, release it!',
    }).then(result => {
      if (result.isConfirmed) {
        axios.post(`http://10.87.0.33:8082/api/PlanningDetails/ReleasetoProduction`, payload)
          .then(() => {
            setEditSlideOver(false);
            updateTableData();
            fetchNamesShift();
            fetchBinId();
            fetchMachineName();
            fetchPlatform();
            fetchProductCodes();
            fetchUserDetails();
            fetchProductList();
            fetchType();
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
          .catch(error => handleError(error, 'Error updating data'));
      }
    });
  }
};




// Add Role

// Method to handle form validation and display error messages

const validateForm = () => {
  formSubmitted.value = true;
  if (
    !addFormData.productcode || !addFormData.resourcecode || !addFormData.startdate || !addFormData.expecteddate || !addFormData.actualdate || !addFormData.quantity || !addFormData.noofmachines || !addFormData.noofpieces
  ) {
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
    });
    return false;
  }
  return true;
};


const prepareListMachinesForSubmission = (listMachines: any) => {
  return listMachines.map((item: any) => ({
    code: item.code || '',   // Ensure the fields are set, even if they are empty
    type: item.type || '',
    machines: Array.isArray(item.machines) ? [...item.machines] : [],  // Spread to ensure a new array is created
  }));
}

// Method to handle the Save button click event
const saveRole = async () => {
  if (validateForm()) {

    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to submit this data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Update mappingId for listBins
        addFormData.listBins = addFormData.listBins.map(item => ({
          ...item,
          mappingId: addFormData.jobId
        }));

        // Update mappingId for machineStation's listBins
        if (isMachineJobType.value) {
          addFormData.machineStation = addFormData.machineStation.map(machine => ({
            ...machine,
            listBins: machine.pMachineListBins.map(bin => ({
              ...bin,
              mappingId: addFormData.jobId
            }))
          }));
        }

        // Convert platform array to comma-separated string
        const platformString = addFormData.platform.join(',');
        const payload = {
          productcode: addFormData.productcode,
          date: addFormData.date,
          resourcecode: addFormData.resourcecode,
          employeeID: addFormData.resourcecode,
          shift: addFormData.shift,
          jobId: addFormData.jobId,
          sku: addFormData.sku,
          jobtype: addFormData.jobtype,
          platform: platformString,
          remarks: addFormData.remarks,
          quantity: addFormData.quantity,
          startdate: addFormData.startdate,
          expecteddate: addFormData.expecteddate,
          actualdate: addFormData.actualdate,
          noofresources: parseInt(addFormData.noofresources) || 0,
          noofmachines: parseInt(addFormData.noofmachines) || 0,
          buffer: parseFloat(addFormData.buffer) || 0,
          bufferremarks: addFormData.bufferremarks,
          wettreatmentrequired: addFormData.wettreatmentrequired,
          plasmatreatmentrequired: addFormData.plasmatreatmentrequired,
          deburringrequired: addFormData.deburringrequired,
          dustingrequired: addFormData.dustingrequired,
          replacemenntjobid: addFormData.replacemenntjobid,
          noofpieces: addFormData.noofpieces,
          oracleJobId: addFormData.oracleJobId,
          listMachines: prepareListMachinesForSubmission(addFormData.listMachines), // Filter out empty rows
          productSubCodesofRecipe: addFormData.productSubCodesofRecipe.map(item => ({
            id: item.id,
            productRecipeMappingId: addFormData.jobId,
            jobId: addFormData.jobId,
            productCode: item.productCode,
            percentage: parseFloat(item.percentage) || 0,
            weight: item.weight, // Ensure weight is a number
            blendingRequired: item.blendingRequired
          })),
          listBins: addFormData.listBins.map(item => ({
            mappingId: item.mappingId,
            binMasterId: item.binMasterId,
            type: item.type,
            weight: item.weight,
            movement: item.movement,
            colour: item.colour,
            capacityMin: item.capacityMin,
            capacityMax: item.capacityMax,
            reassignBinId: item.reassignBinId,
            productCode: item.productCode,
          })),
          machineStation: isMachineJobType.value ? addFormData.machineStation.map(machine => ({
            shift: machine.shift,
            machineCode: machine.machineCode,
            totalWeight: parseFloat(machine.totalWeight.toString()) || 0, // Ensure totalWeight is parsed as a float
            waste: parseFloat(machine.waste.toString()) || 0,
            pMachineListBins: machine.pMachineListBins.map(bin => ({
              mappingId: bin.mappingId,
              binMasterId: bin.binMasterId,
              capacityMin: parseFloat(bin.capacityMin.toString()) || 0,
              capacityMax: parseFloat(bin.capacityMax.toString()) || 0,
            }))
          })) : [],
        };

        console.log('Payload for Save:', JSON.stringify(payload, null, 2));

        try {
          // First, save the planning details
          const saveResponse = await axios.post('http://10.87.0.33:8082/api/PlanningDetails/SavePlanningDetails', payload);
          console.log('Save API Response:', saveResponse);

          if (saveResponse.status === 200 && saveResponse.data.statusCode === 200) {
            // If saving is successful, then submit the same data
            console.log('Submitting data after save...');

            const submitResponse = await axios.post('http://10.87.0.33:8082/api/PlanningDetails/SubmitPlanningDetails', payload);
            console.log('Submit API Response:', submitResponse);

            if (submitResponse.status === 200 && submitResponse.data.statusCode === 200) {
              updateTableData();
              setAddSlideover(false);
 // Update `existingJobIds` after successful save and submit
              Swal.fire({
                icon: 'success',
                title: 'Data Saved and Submitted Successfully',
                showConfirmButton: false,
                showCloseButton: true,
                timer: 5000,
                timerProgressBar: true,
                position: 'top-end',
                iconColor: 'green',
                toast: true,
                background: '#fff',
              });
              isFormSaved.value = true;
              formSubmitted.value = true;

            } else {
              Swal.fire({
                icon: 'warning',
                title: 'Unexpected response on submission',
                text: 'The data was not submitted as expected.',
                showConfirmButton: true,
              });
            }

          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Unexpected response on save',
              text: 'The data was not saved as expected.',
              showConfirmButton: true,
            });
          }
        } catch (error) {
          console.error('Error during save or submit:', error);
          handleError(error, 'Error saving or submitting data');
        }
      }
    });
  }
};







// Method to handle the Submit button click event
const submitRole = () => {
  if (validateForm()) {
    Swal.fire({
      title: 'Confirmation',
      text: 'Are you sure you want to submit this data?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#1e40af',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, submit it!',
    }).then(async result => { // Use async/await for clarity
      if (result.isConfirmed) {
        // Update mappingId for listBins
        addFormData.listBins = addFormData.listBins.map(item => ({
          ...item,
          mappingId: addFormData.jobId
        }));

        // Update mappingId for machineStation's listBins
        if (isMachineJobType.value) {
          addFormData.machineStation = addFormData.machineStation.map(machine => ({
            ...machine,
            listBins: machine.pMachineListBins.map(bin => ({
              ...bin,
              mappingId: addFormData.jobId
            }))
          }));
        }

        // Convert platform array to comma-separated string
        const platformString = addFormData.platform.join(',');

        const payload = {
          productcode: addFormData.productcode,
          date: addFormData.date,
          resourcecode: addFormData.resourcecode,
          employeeID: addFormData.resourcecode,
          shift: addFormData.shift,
          jobId: addFormData.jobId,
          sku: addFormData.sku,
          jobtype: addFormData.jobtype,
          platform: platformString,
          remarks: addFormData.remarks,
          quantity: addFormData.quantity,
          startdate: addFormData.startdate,
          expecteddate: addFormData.expecteddate,
          actualdate: addFormData.actualdate,
          noofresources: parseInt(addFormData.noofresources) || 0,
          noofmachines: parseInt(addFormData.noofmachines) || 0,
          buffer: parseFloat(addFormData.buffer) || 0,
          bufferremarks: addFormData.bufferremarks,
          wettreatmentrequired: addFormData.wettreatmentrequired,
          plasmatreatmentrequired: addFormData.plasmatreatmentrequired,
          deburringrequired: addFormData.deburringrequired,
          dustingrequired: addFormData.dustingrequired,
          replacemenntjobid: addFormData.replacemenntjobid,
          noofpieces: addFormData.noofpieces,
          oracleJobId: addFormData.oracleJobId,
          listMachines: prepareListMachinesForSubmission(addFormData.listMachines), // Filter out empty rows
          productSubCodesofRecipe: addFormData.productSubCodesofRecipe.map(item => ({
            id: item.id,
            productRecipeMappingId: addFormData.jobId,
            jobId: addFormData.jobId,
            productCode: item.productCode,
            percentage: parseFloat(item.percentage) || 0,
            weight: item.weight, // Ensure weight is a number
            blendingRequired: item.blendingRequired
          })),
          listBins: addFormData.listBins.map(item => ({
            mappingId: item.mappingId,
            binMasterId: item.binMasterId,
            type: item.type,
            weight: item.weight,
            movement: item.movement,
            colour: item.colour,
            capacityMin: item.capacityMin,
            capacityMax: item.capacityMax,
            reassignBinId: item.reassignBinId,
            productCode: item.productCode,
          })),
          machineStation: isMachineJobType.value ? addFormData.machineStation.map(machine => ({
            shift: machine.shift,
            machineCode: machine.machineCode,
            totalWeight: parseFloat(machine.totalWeight.toString()) || 0, // Ensure totalWeight is parsed as a float
            waste: parseFloat(machine.waste.toString()) || 0,
            pMachineListBins: machine.pMachineListBins.map(bin => ({
              mappingId: bin.mappingId,
              binMasterId: bin.binMasterId,
              capacityMin: parseFloat(bin.capacityMin.toString()) || 0,
              capacityMax: parseFloat(bin.capacityMax.toString()) || 0,
            }))
          })) : [],
        };

        console.log('Payload:', JSON.stringify(payload, null, 2));

        try {
          const response = await axios.post('http://10.87.0.33:8082/api/PlanningDetails/SubmitPlanningDetails', payload);
          console.log('Response:', response);

          if (response.status === 200 && response.data.result) {
            Swal.fire({
              icon: 'success',
              title: 'Data Submitted Successfully',
              showConfirmButton: false,
              showCloseButton: true,
              timer: 5000,
              timerProgressBar: true,
              position: 'top-end',
              iconColor: 'green',
              toast: true,
              background: '#fff',
            });
            setAddSlideover(false);
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'Unexpected response',
              text: 'The data was not submitted as expected.',
              showConfirmButton: true,
            });
            console.error('Unexpected response:', response);
          }
        } catch (error) {
          console.error('Error submitting data:', error);
          handleError(error, 'Error submitting data');
        }
      }
    });
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
  // Save the current value of the date fields
  const currentDate = formData.date;

  Object.keys(formData).forEach((key) => {
    if (typeof formData[key] === 'boolean') {
      formData[key] = false;
    } else if (typeof formData[key] === 'number') {
      formData[key] = 0;
    } else if (Array.isArray(formData[key])) {
      formData[key] = [];
    } else if (key === 'startdate' || key === 'expecteddate' || key === 'actualdate') {
      formData[key] = getCurrentDateTime();
    } else {
      formData[key] = '';
    }
    addFormData.jobtype = "Blending"
  });

  // Restore the date field
  formData.date = currentDate;

  // Resetting specific arrays with their initial structures
  addFormData.productSubCodesofRecipe = [];
  addFormData.listMachines = [];
  addFormData.listBins = [];
  addFormData.machineStation = [];

  // Resetting edit form data as well
  editFormData.listMachines = [];
  editFormData.listBins = [];

  selectedPartNumber.value = '';
  searchPartNumberQuery.value = '';
};


// watch(
//   () => addFormData.productcode,
//   (newProductCode) => {
//     addFormData.listBins.forEach(bin => {
//       bin.productCode = newProductCode;
//     });
//     addFormData.machineStation.forEach(machine => {
//       machine.listBins.forEach(bin => {
//         bin.productCode = newProductCode;
//       });
//     });
//   }
// );


const isFormSaved = ref(false);

const handleClose = async () => {

};

const addSlideover = ref(false);
const setAddSlideover = async (value: boolean) => {
  addSlideover.value = value;

  if (value) {
    try {
      // Fetch existing job IDs first, then generate a new Job ID
      generateNewJobId();
    } catch (error) {
      console.error('Error fetching existing job IDs or generating a new Job ID:', error);
    }
  } else {
    // Reset fields when modal is closed
    addSlideover.value = false;
    formSubmitted.value = false;

    addFormData.jobtype = "Blending";
    addFormData.oracleJobId = '';
    addFormData.resourcecode = '';
    addFormData.platform = [];
    addFormData.noofpieces = 0;
    addFormData.noofmachines = '';
    selectedPartNumber.value = '';
    searchPartNumberQuery.value = '';
    addFormData.wettreatmentrequired = false;
    addFormData.plasmatreatmentrequired = false;
    addFormData.deburringrequired = false;
    addFormData.dustingrequired = false;
    addFormData.productcode = '';

    // Fetch additional data for the modal
    fetchNamesShift();
    fetchBinId();
    fetchMachineName();
    fetchPlatform();
    fetchProductCodes();
    fetchUserDetails();
    fetchProductList();
    fetchType();
  }
};



const EditSlideOver = ref(false);
const setEditSlideOver = (value: boolean) => {
  EditSlideOver.value = value;
  if (!value) {
    resetEditFormData();
    generateNewJobId();
  }
};

const handleAddClick = async (event: MouseEvent) => {
  event.preventDefault();
  loading.value = true; // Start loading animation

  try {
    // Perform the API call to save temporary Job ID
    const response = await axios.get('http://10.87.0.33:8082/api/PlanningDetails/SavetempJobId');

    // Check the API response for success or error
    if (response.status === 200 && response.data) {
      console.log('Temporary Job ID saved successfully:', response.data);

      // Open the Add Slideover after successful API call
      setAddSlideover(true);
    } else {
      console.error('Failed to save temporary Job ID:', response.data);
      Swal.fire({
        icon: 'error',
        title: 'Failed to Save Temporary Job ID',
        text: 'Please try again later.',
        confirmButtonColor: '#d33',
      });
    }

    // You can add any function here to fetch updated details if needed
    generateNewJobId(); // Uncomment or modify as required

  } catch (error) {
    console.error('Error during API call to save temporary Job ID:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'An error occurred while saving temporary Job ID. Please try again.',
      confirmButtonColor: '#d33',
    });
  } finally {
    loading.value = false; // End loading animation
  }
};



const resetEditFormData = () => {
  editFormData.id = null;
};
const toPrint = ref<HTMLElement | null>(null);

const printTable = (): void => {
  const el = toPrint.value;
  if (el) {
    const newPrint = window.open("", "_blank");

    if (newPrint) {
      newPrint.document.write(`
        <html>
          <head>
            <title>Planning</title>
            <style>
              @media print {
                table {
                  border-collapse: collapse;
                  width: 100%;
                  font-family: Arial, Helvetica, sans-serif;
                }
                th, td {
                  border: 1px solid #000; /* Set border color */
                  padding: 8px;
                  text-align: left;
                  vertical-align: top;
                }
                th {
                  background-color: #f2f2f2;
                  font-weight: bold;
                  color: #000; /* Set text color */
                }
                td {
                  color: #000;
                }
                .title {
                  text-align: center;
                }
                /* Status colors */
                .text-green-600 {
                  color: #166534;
                }
                .text-cyan-600 {
                  color: #155e75;
                }
                .text-red-600 {
                  color: #991b1b;
                }
                .text-orange-600 {
                  color: #9a3412;
                }
              }
            </style>
          </head>
          <body>
            <table class="w-full">
              <tbody>
                ${el.innerHTML}
              </tbody>
            </table>
          </body>
        </html>
      `);

      // Close the document to ensure it's fully loaded
      newPrint.document.close();

      // Wait for the content to be fully loaded, then print
      newPrint.focus();  // Ensure the new window is focused

      // Listen for the 'afterprint' event to close the window after printing
      newPrint.onafterprint = () => {
        newPrint.close();
      };

      // Trigger the print dialog
      setTimeout(() => {
        newPrint.print();
      }, 500);  // 500ms delay to ensure content is fully loaded
    }
  }
};



// Computed property to calculate waste for each machine in editFormData
// Computed property to calculate waste for each machine in editFormData
const computeWaste = (machine: any) => {
  return computed(() => {
    const totalBinWeight = machine.listBins.reduce((sum: any, bin: any) => sum + bin.weight, 0);
    return machine.totalWeight - totalBinWeight;
  });
};

// Watcher to update waste whenever totalWeight or listBins change
editFormData.machineStation.forEach(machine => {
  const waste = computeWaste(machine);
  machine.waste = waste.value;
});

addFormData.machineStation.forEach(machine => {
  const waste = computeWaste(machine);
  machine.waste = waste.value;
});



const addRowBL = () => {
  addFormData.listBins.push({
    id: '',
    mappingId: addFormData.jobId,
    binMasterId: '',
    type: '',
    weight: 0,
    movement: '',
    colour: '',
    capacityMin: 0,
    capacityMax: 0,
    reassignBinId: '',
    productCode: addFormData.productcode, // Set to current productcode
    validated: false
  });
};


const removeRowBL = (index: number) => {
  addFormData.listBins.splice(index, 1);
};
const addRowBLEdit = () => {
  editFormData.listBins.push({
    id: '',
    mappingId: '',
    binMasterId: '',
    type: '',
    weight: 0,
    movement: '',
    colour: '',
    capacityMin: 0,
    capacityMax: 0,
    reassignBinId: '',
    productCode: editFormData.productcode,
    validated: false
  });
};

const removeRowBLEdit = (index: number) => {
  const bin = editFormData.listBins[index];

  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you really want to delete this bin?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e40af',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
  }).then(result => {
    if (result.isConfirmed) {
      if (bin.id) {
        // Call delete API for existing data
        deleteListBin(bin.id).then(() => {
          editFormData.listBins.splice(index, 1);
          Swal.fire({
            icon: 'success',
            title: 'The bin has been deleted.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            position: 'top-end',
            toast: true,
            iconColor: 'green',
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        }).catch(error => {
          console.error('Error deleting list bin:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to delete the bin.',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            position: 'top-end',
            toast: true,
            iconColor: 'red',
            background: '#fff',
            showClass: {
              popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp',
            },
          });
        });
      } else {
        // Just remove the row for new data
        editFormData.listBins.splice(index, 1);
      }
    }
  });
};


const deleteListBin = (id: any) => {
  return axios.delete(`http://10.87.0.33:8082/api/ListBins/${id}`);
}


watch(() => addFormData.jobtype, (newJobType) => {
  if (newJobType === 'Blending' && addFormData.machineStation.length === 0) {
    addRowMachineStation();
  }
});
</script>

<template>
  <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="flex flex-col items-center">
      <LoadingIcon icon="oval" class="w-8 h-8 text-white animate-spin" />
      <p class="mt-2 text-white text-center text-lg">Loading...</p>
    </div>
  </div>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Planning</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0" v-if="canCreatePlanning">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="handleAddClick">
        Add Planning
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
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Job ID</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.jobId" type="text" class="mt-2 w-full"
                placeholder="Search Job ID..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="jobId">Job ID</Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-full xl:w-auto xl:flex-initial">Part Number</label>
            <div class="relative">
              <FormInput id="tabulator-html-filter-id" v-model="filter.productcode" type="text" class="mt-2 w-full"
                placeholder="Search Part Number..." />
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="productcode">Part Number</Button>
            </div>
          </div>
        </div>
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="flex-1 xl:mr-6">
            <label class="flex-none w-12 xl:w-auto xl:flex-initial">Status</label>
            <div class="relative">
              <FormSelect id="tabulator-html-filter-id" v-model="filter.status" class="mt-2 w-full"
                aria-label="Default select example">
                <option disabled value="">Select a Status Option</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
              </FormSelect>
              <Button id="tabulator-html-filter-new-go" variant="primary" type="button"
                class="w-[100%] top-0 right-0 mt-2" @click="onStatus">
                Status
              </Button>
            </div>
          </div>
        </div>

        <div class=" flex-col xl:flex-row xl:items-center xl:justify-between mt-2">
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div class="flex">
              <div class="flex-1">
                <label class="flex-none w-12 xl:w-auto xl:flex-initial">Start Date</label>
                <div class="relative">
                  <FormInput id="tabulator-html-filter-id" v-model="filter.startDate" type="date" class="mt-2 w-full" />
                </div>

              </div>

            </div>
            <div class="flex">
              <div class="flex-1">
                <label class="flex-none w-12 xl:w-auto xl:flex-initial">End Date</label>
                <div class="relative">
                  <FormInput id="tabulator-html-filter-id" v-model="filter.endDate" type="date" class="mt-2 w-full" />
                </div>

              </div>

            </div>
          </div>

          <div>

            <Button id="tabulator-html-filter-new-go" variant="primary" type="button" class="w-full top-0 right-0 mt-2"
              @click="onFilter">
              Date</Button>
          </div>
        </div>
      </form>
      <div class="flex mt-5 sm:mt-0">
        <Button id="tabulator-print" variant="outline-secondary" class="w-1/2 mr-2 sm:w-auto" @click="onResetFilter">
          Reset
        </Button>

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
  <Dialog
:staticBackdrop="true" size="3xl" :open="addSlideover" @close="() => {
    setAddSlideover(false);
  }
    " >
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Add Planning
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent>
          <div>
            <FormLabel htmlFor="regular-form-1">Job ID</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.jobId }" id="regular-form-1"
              v-model="addFormData.jobId" type="text" placeholder="Job ID" disabled />
            <span v-if="formSubmitted && !addFormData.jobId" class="text-red-500">Job ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Oracle Job ID</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.oracleJobId }" id="regular-form-1"
              v-model="addFormData.oracleJobId" type="text" placeholder="Oracle Job ID" />
            <span v-if="formSubmitted && !addFormData.oracleJobId" class="text-red-500">Oracle Job ID is
              required!</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Part Number</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormSelect v-model="addFormData.productcode"
              :class="{ 'border-red-500': formSubmitted && !addFormData.productcode }" class="sm:mr-2"
              aria-label="Default select example">
              <option disabled value="">Select a Part Number Option</option>
              <option v-for="productcode in addFormData.productcodes" :key="productcode" :value="productcode">
                {{ productcode }}
              </option>
            </FormSelect>
            <span v-if="formSubmitted && !addFormData.productcode" class="text-red-500">Part Number is required!</span>
          </div> -->
          <div class="mt-5 relative">
            <FormLabel htmlFor="regular-form-5">Part Number</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>

            <!-- Custom dropdown with search -->
            <div class="relative">
              <div
                :class="['border rounded', { 'border-red-500': formSubmitted && !addFormData.productcode, 'border-gray-300': !(formSubmitted && !addFormData.productcode) }]">
                <div class="relative">
                  <!-- Dropdown trigger - clicking this opens the dropdown -->
                  <div @click="togglePartNumberDropdown" class="cursor-pointer p-2">
                    {{ selectedPartNumber || 'Select a Part Number Option' }}
                  </div>
                  <div v-if="isPartNumberDropdownOpen" class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                    <!-- Searchable input inside the dropdown -->
                    <input type="text" v-model="searchPartNumberQuery" placeholder="Search Part Number"
                      class="border-b border-gray-300 p-2 w-full" />
                    <!-- Filtered options -->
                    <ul class="max-h-40 overflow-y-auto">
                      <li v-for="productcode in filteredPartNumbers" :key="productcode"
                        @click="selectPartNumber(productcode)" class="cursor-pointer p-2 hover:bg-gray-100">
                        {{ productcode }}
                      </li>
                      <li v-if="filteredPartNumbers.length === 0" class="p-2 text-gray-500">No results found</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <span v-if="formSubmitted && !addFormData.productcode" class="text-red-500">
              Part Number is required!
            </span>
          </div>



          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.resourcecode }" id="regular-form-1"
              v-model="addFormData.resourcecode" type="text" placeholder="Employee ID" />
            <span v-if="formSubmitted && !addFormData.resourcecode" class="text-red-500">Employee ID is
              required!</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="addFormData.shift" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in addFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">SKU</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.sku }" id="regular-form-1"
              v-model="addFormData.sku" type="text" placeholder="SKU" />
            <span v-if="formSubmitted && !addFormData.sku" class="text-red-500">SKU is
              required!</span>
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.jobtype }" id="regular-form-1"
              v-model="addFormData.jobtype" type="text" placeholder="Job Type" disabled />
            <span v-if="formSubmitted && !addFormData.jobtype" class="text-red-500">Job Type is
              required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="addFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in addFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Remarks</FormLabel>
            <FormInput id="regular-form-3" v-model="addFormData.remarks" type="text" placeholder="Remarks" />
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    No. of Pieces
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-4" class="sr-only">No. of Pieces</FormLabel>
                    <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.noofpieces }"
                      id="regular-form-4" v-model="addFormData.noofpieces" type="number" placeholder="No. of Pieces"
                      step="any" />
                    <span v-if="formSubmitted && !addFormData.noofpieces" class="text-red-500">
                      No. of Pieces is required!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-5" class="sr-only">Weight</FormLabel>
                    <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.quantity }" id="regular-form-5"
                      v-model="addFormData.quantity" type="number" placeholder="Weight" step="any" disabled />
                    <span v-if="formSubmitted && !addFormData.quantity" class="text-red-500">
                      Weight is required!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Start Date<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Complete Date<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-5" class="sr-only">Planning Start Date</FormLabel>
                    <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.startdate }"
                      id="regular-form-5" v-model="addFormData.startdate" type="datetime-local" />
                    <span v-if="formSubmitted && !addFormData.startdate" class="text-red-500">
                      Planning Start Date is required!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-6" class="sr-only">Planning Complete Date</FormLabel>
                    <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.expecteddate }"
                      id="regular-form-6" v-model="addFormData.expecteddate" type="datetime-local" />
                    <span v-if="formSubmitted && !addFormData.expecteddate" class="text-red-500">
                      Planning Complete Date is required!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-7">Actual Date</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.actualdate }" id="regular-form-7"
              v-model="addFormData.actualdate" type="datetime-local" />
            <span v-if="formSubmitted && !addFormData.actualdate" class="text-red-500">Actual Date is required!</span>
          </div> -->
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Number of Resources
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Number of Machines<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Number of Resources</FormLabel>
                    <FormInput id="regular-form-8" v-model="addFormData.noofresources" type="number"
                      placeholder="Number of Resources" />
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-9" class="sr-only">Number of Machines</FormLabel>
                    <FormInput :class="{ 'border-red-500': formSubmitted && !addFormData.noofmachines }"
                      id="regular-form-9" v-model="addFormData.noofmachines" type="number"
                      placeholder="Number of Machines" />
                    <span v-if="formSubmitted && !addFormData.noofmachines" class="text-red-500">Number of Machines is
                      required!</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div class="mt-5">
            <FormLabel htmlFor="regular-form-12">Buffer</FormLabel>
            <FormInput id="regular-form-12" v-model="addFormData.buffer" type="number" placeholder="Buffer" />
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-13">Buffer Remarks</FormLabel>
            <FormInput id="regular-form-13" v-model="addFormData.bufferremarks" type="text"
              placeholder="Buffer Remarks" />
          </div>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Wet Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Plasma Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Dedusting<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Deburring<br>Required
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="wettreatmentrequired" v-model="addFormData.wettreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="plasmatreatmentrequired" v-model="addFormData.plasmatreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="dustingrequired" v-model="addFormData.dustingrequired" type="checkbox"
                        disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="deburringrequired" v-model="addFormData.deburringrequired" type="checkbox"
                        disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-13">Replacement Job ID</FormLabel>
            <FormInput id="regular-form-13" v-model="addFormData.replacemenntjobid" type="text"
              placeholder="Replacement Job ID" />
          </div> -->
          <!-- List Machines -->
          <div v-if="addFormData.listMachines.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List Machines</h6>
            <hr>

            <table class="min-w-full border-collapse rounded-lg  shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto rounded-tl-lg">No.</th>
                  <th class="py-2 px-4 border-b text-center">Type</th>
                  <th class="py-2 px-4 border-b text-center rounded-tr-lg">Code</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in addFormData.listMachines" :key="index" class="hover:bg-gray-100">
                  <!-- Index column -->
                  <td class="py-2 px-4 border-b text-center">
                    {{ index + 1 }}
                  </td>

                  <!-- Type Dropdown -->
                  <td class="py-2 px-4 border-b">
                    <div class="relative">
                      <div @click="toggleAddTypeDropdown(index)" class="cursor-pointer p-2 border rounded">
                        {{ row.type || 'Select a Type Option' }}
                      </div>
                      <div v-if="isAddTypeDropdownOpen[index]"
                        class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                        <!-- Searchable input inside the dropdown -->
                        <input type="text" v-model="searchAddTypeQuery[index]" placeholder="Search Type"
                          class="border-b border-gray-300 p-2 w-full" />
                        <!-- Filtered options -->
                        <ul class="max-h-40 overflow-y-auto">
                          <li v-for="type in filteredAddTypes(index)" :key="type" @click="selectAddType(index, type)"
                            class="cursor-pointer p-2 hover:bg-gray-100">
                            {{ type }}
                          </li>
                          <li v-if="filteredAddTypes(index).length === 0" class="p-2 text-gray-500">No results found
                          </li>
                        </ul>
                      </div>
                    </div>
                  </td>

                  <!-- Code Dropdown -->
                  <td class="py-2 px-4 border-b">
                    <div class="relative">
                      <div @click="toggleAddCodeDropdown(index)" class="cursor-pointer p-2 border rounded"
                        :class="{ 'opacity-50 cursor-not-allowed': !row.type }" :disabled="!row.type">
                        {{ row.code || 'Select a Machine Code Option' }}
                      </div>
                      <div v-if="isAddCodeDropdownOpen[index]"
                        class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                        <!-- Searchable input inside the dropdown -->
                        <input type="text" v-model="searchAddCodeQuery[index]" placeholder="Search Code"
                          class="border-b border-gray-300 p-2 w-full" :disabled="!row.type" />
                        <!-- Filtered options -->
                        <ul class="max-h-40 overflow-y-auto">
                          <li v-for="code in filteredAddCodes(index)" :key="code" @click="selectAddCode(index, code)"
                            class="cursor-pointer p-2 hover:bg-gray-100">
                            {{ code }}
                          </li>
                          <li v-if="filteredAddCodes(index).length === 0" class="p-2 text-gray-500">No results found
                          </li>
                        </ul>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <!-- Product Sub Codes of Recipe -->
          <div v-if="addFormData.productSubCodesofRecipe.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Product Sub Codes of Recipe</h6>
            <hr>
            <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-2">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto">No.</th>
                  <th class="py-2 px-4 border-b ">Part Number</th>
                  <th class="py-2 px-4 border-b text-center">Percentage</th>
                  <th class="py-2 px-4 border-b text-center">Weight</th>
                  <th class="py-2 px-4 border-b text-center">Blending Required</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in addFormData.productSubCodesofRecipe" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b">
                    {{ row.serialNumber }}
                  </td>
                  <td class="py-2 px-4 border-b">{{ row.productCode }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ row.percentage }}</td>
                  <td class="py-2 px-4 border-b text-center">{{ row.weight.toFixed(4) }}</td>
                  <td class="py-2 px-4 border-b text-center">
                    {{ row.blendingRequired ? 'Yes' : 'No' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>


          <div class="mt-5 flex justify-between">

            <Button @click="saveRole" variant="primary" class="w-[100%] ml-2 mt-10 shadow-md">
              Submit
            </Button>
          </div>
        </form>
      </Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
          setAddSlideover(false);
        }" class="w-20 mr-1">
          Cancel
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>
  <Dialog
:staticBackdrop="true" size="3xl" :open="EditSlideOver" @close="() => {
    setEditSlideOver(false);
  }">
    <Dialog.Panel>
      <Dialog.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Planning
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <form class="validate-form" @submit.prevent>
          <div>
            <FormLabel htmlFor="regular-form-1">Job ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.jobId }" id="regular-form-1"
              v-model="editFormData.jobId" type="text" placeholder="Job ID" disabled />
            <span v-if="!editFormData.jobId" class="text-red-500">Job ID is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Oracle Job ID</FormLabel><span
              class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.oracleJobId }" id="regular-form-1"
              v-model="editFormData.oracleJobId" type="text" placeholder="Oracle Job ID" />
            <span v-if="!editFormData.oracleJobId" class="text-red-500">Oracle Job ID is required!</span>
          </div>
          <div class="mt-5 relative">
            <FormLabel htmlFor="regular-form-5">Part Number</FormLabel>
            <span class="text-red-500 pl-1 text-md">*</span>

            <!-- Custom dropdown with search (edit context) -->
            <div class="relative">
              <div
                :class="['border rounded', { 'border-red-500': !editFormData.productcode, 'border-gray-300': editFormData.productcode }]">
                <div class="relative">
                  <!-- Dropdown trigger - clicking this opens the dropdown -->
                  <div @click="toggleEditPartNumberDropdown" class="cursor-pointer p-2">
                    {{ selectedEditPartNumber || 'Select a Part Number Option' }}
                  </div>
                  <div v-if="isEditPartNumberDropdownOpen"
                    class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                    <!-- Searchable input inside the dropdown -->
                    <input type="text" v-model="searchEditPartNumberQuery" placeholder="Search Part Number"
                      class="border-b border-gray-300 p-2 w-full" />
                    <!-- Filtered options -->
                    <ul class="max-h-40 overflow-y-auto">
                      <li v-for="productcode in filteredEditPartNumbers" :key="productcode"
                        @click="selectEditPartNumber(productcode)" class="cursor-pointer p-2 hover:bg-gray-100">
                        {{ productcode }}
                      </li>
                      <li v-if="filteredEditPartNumbers.length === 0" class="p-2 text-gray-500">No results found</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <span v-if="!editFormData.productcode" class="text-red-500">
              Part Number is required!
            </span>
          </div>


          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Employee ID</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.resourcecode }" id="regular-form-1"
              v-model="editFormData.resourcecode" type="text" placeholder="Employee ID" />
            <span v-if="!editFormData.resourcecode" class="text-red-500">Employee ID is required!</span>
          </div>
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Shift</FormLabel>
            <FormSelect v-model="editFormData.shift" class=" sm:mr-2" aria-label="Default select example">
              <option disabled value="">Select a Shift Option</option>
              <option v-for="name in editFormData.shifts" :key="name" :value="name">
                {{ name }}
              </option>
            </FormSelect>
          </div> -->
          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">SKU</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.sku }" id="regular-form-1" v-model="editFormData.sku"
              type="text" placeholder="SKU" />
            <span v-if="!editFormData.sku" class="text-red-500">SKU is required!</span>
          </div> -->
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-1">Job Type</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.jobtype }" id="regular-form-1"
              v-model="editFormData.jobtype" type="text" placeholder="Job Type" disabled />
            <span v-if="!editFormData.jobtype" class="text-red-500">Job Type is required!</span>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-5">Platform</FormLabel>
            <TomSelect v-model="editFormData.platform" :options="selectOptions" class="w-full" multiple>
              <option v-for="platform in editFormData.platforms" :key="platform" :value="platform">
                {{ platform }}
              </option>
            </TomSelect>
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-3">Remarks</FormLabel>
            <FormInput id="regular-form-3" v-model="editFormData.remarks" type="text" placeholder="Remarks" />
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    No. of Pieces
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Weight
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-4" class="sr-only">No. of Pieces</FormLabel>
                    <FormInput :class="{ 'border-red-500': !editFormData.noofpieces }" id="regular-form-4"
                      v-model="editFormData.noofpieces" type="number" placeholder="No. of Pieces" />
                    <span v-if="!editFormData.noofpieces" class="text-red-500">No. of Pieces is required!</span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-4" class="sr-only">Weight</FormLabel>
                    <FormInput :class="{ 'border-red-500': !editFormData.quantity }" id="regular-form-4"
                      v-model="editFormData.quantity" type="number" placeholder="Weight" step="any" disabled />
                    <span v-if="!editFormData.quantity" class="text-red-500">Weight is required!</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Start Date
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Complete Date
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-5" class="sr-only">Planning Start Date</FormLabel>
                    <FormInput :class="{ 'border-red-500': !editFormData.startdate }" id="regular-form-5"
                      v-model="editFormData.startdate" type="datetime-local" />
                    <span v-if="!editFormData.startdate" class="text-red-500">
                      Planning Start Date is required!
                    </span>
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-6" class="sr-only">Planning Complete Date</FormLabel>
                    <FormInput :class="{ 'border-red-500': !editFormData.expecteddate }" id="regular-form-6"
                      v-model="editFormData.expecteddate" type="datetime-local" />
                    <span v-if="!editFormData.expecteddate" class="text-red-500">
                      Planning Complete Date is required!
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-7">Actual Date</FormLabel><span class="text-red-500 pl-1 text-md">*</span>
            <FormInput :class="{ 'border-red-500': !editFormData.actualdate }" id="regular-form-7"
              v-model="editFormData.actualdate" type="datetime-local" />
            <span v-if="!editFormData.actualdate" class="text-red-500">Actual Date is required!</span>
          </div> -->
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Number of Resources
                  </th>
                  <th scope="row"
                    class="px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Number of Machines<span class="text-red-500 pl-1 text-md">*</span>
                  </th>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-8" class="sr-only">Number of Resources</FormLabel>
                    <FormInput id="regular-form-8" v-model="editFormData.noofresources" type="number"
                      placeholder="Number of Resources" />
                  </td>
                  <td class="px-4 py-2 text-center text-gray-700 dark:text-white">
                    <FormLabel htmlFor="regular-form-9" class="sr-only">Number of Machines</FormLabel>
                    <FormInput id="regular-form-9" v-model="editFormData.noofmachines" type="number"
                      placeholder="Number of Machines" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="mt-5">
            <FormLabel htmlFor="regular-form-12">Buffer</FormLabel>
            <FormInput id="regular-form-12" v-model="editFormData.buffer" type="number" placeholder="Buffer" />
          </div>
          <div class="mt-5">
            <FormLabel htmlFor="regular-form-13">Buffer Remarks</FormLabel>
            <FormInput id="regular-form-13" v-model="editFormData.bufferremarks" type="text"
              placeholder="Buffer Remarks" />
          </div>
          <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-5">
            <table class="w-full text-sm text-center text-gray-500 dark:text-gray-400">
              <thead class="bg-primary dark:bg-gray-800">
                <tr>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Wet Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Plasma Treatment<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Dedusting<br>Required
                  </th>
                  <th scope="col" class="px-2 py-2 font-medium text-white whitespace-normal w-1/4">
                    Deburring<br>Required
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="wet-treatment-edit" v-model="editFormData.wettreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="plasma-treatment-edit" v-model="editFormData.plasmatreatmentrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="dusting-required-edit" v-model="editFormData.dustingrequired" type="checkbox"
                        disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                  <td class="px-4 py-2">
                    <FormCheck>
                      <FormCheck.Input id="deburring-required-edit" v-model="editFormData.deburringrequired"
                        type="checkbox" disabled class="mx-auto" />
                    </FormCheck>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- <div class="mt-5">
            <FormLabel htmlFor="regular-form-13">Replacement Job ID</FormLabel>
            <FormInput id="regular-form-13" v-model="editFormData.replacemenntjobid" type="text"
              placeholder="Replacement Job ID" />
          </div> -->


          <!-- List Machines -->
          <div v-if="editFormData.listMachines.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">List Machines</h6>
            <hr>
            <table class="min-w-full border-collapse rounded-lg shadow-sm">
              <thead class="bg-primary text-white">
                <tr>
                  <th class="py-2 px-4 border-b text-center w-auto rounded-tl-lg">No.</th>
                  <th class="py-2 px-4 border-b text-center">Type</th>
                  <th class="py-2 px-4 border-b text-center rounded-tr-lg">Code</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in editFormData.listMachines" :key="index" class="hover:bg-gray-100">
                  <td class="py-2 px-4 border-b text-center">
                    {{ index + 1 }}
                  </td>

                  <!-- Custom dropdown for Type -->
                  <td class="py-2 px-4 border-b">
                    <div class="relative">
                      <div
                        :class="['border rounded', { 'border-red-500': formSubmitted && !row.type, 'border-gray-300': !(formSubmitted && !row.type) }]">
                        <div @click="toggleTypeDropdown(index)" class="cursor-pointer p-2">
                          {{ row.type || 'Select a Type Option' }}
                        </div>
                        <div v-if="isTypeDropdownOpen[index]"
                          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                          <!-- Searchable input inside the dropdown -->
                          <input type="text" v-model="searchTypeQuery[index]" placeholder="Search Type"
                            class="border-b border-gray-300 p-2 w-full" />
                          <!-- Filtered options -->
                          <ul class="max-h-40 overflow-y-auto">
                            <li v-for="type in filteredTypes(index)" :key="type" @click="selectType(index, type)"
                              class="cursor-pointer p-2 hover:bg-gray-100">
                              {{ type }}
                            </li>
                            <li v-if="filteredTypes(index).length === 0" class="p-2 text-gray-500">No results found</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Custom dropdown for Code -->
                  <td class="py-2 px-4 border-b">
                    <div class="relative">
                      <div
                        :class="['border rounded', { 'border-red-500': formSubmitted && !row.code, 'border-gray-300': !(formSubmitted && !row.code) }]">
                        <div @click="toggleCodeDropdown(index)" class="cursor-pointer p-2" :disabled="!row.type">
                          {{ row.code || 'Select a Machine Code Option' }}
                        </div>
                        <div v-if="isCodeDropdownOpen[index]"
                          class="absolute left-0 top-full w-full bg-white shadow-md z-10">
                          <!-- Searchable input inside the dropdown -->
                          <input type="text" v-model="searchCodeQuery[index]" placeholder="Search Code"
                            class="border-b border-gray-300 p-2 w-full" />
                          <!-- Filtered options -->
                          <ul class="max-h-40 overflow-y-auto">
                            <li v-for="code in filteredCodes(index)" :key="code" @click="selectCode(index, code)"
                              class="cursor-pointer p-2 hover:bg-gray-100">
                              {{ code }}
                            </li>
                            <li v-if="filteredCodes(index).length === 0" class="p-2 text-gray-500">No results found</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </td>

                </tr>
              </tbody>
            </table>
          </div>

          <!-- Product Sub Codes of Recipe -->
          <div v-if="editFormData.productSubCodesofRecipe.length > 0">
            <h6 class="mb-2 mt-8 text-lg font-medium leading-none">Product Sub Codes of Recipe</h6>
            <hr>
            <div class="overflow-x-auto max-w-full">
              <table class="min-w-full border-collapse rounded-lg overflow-hidden shadow-sm mt-2 responsive-table">
                <thead class="bg-primary text-white">
                  <tr>
                    <th class="py-2 px-4 border-b text-center w-auto">No.</th>
                    <th class="py-2 px-4 border-b text-center">Part Number</th>
                    <th class="py-2 px-4 border-b text-center">Percentage</th>
                    <th class="py-2 px-4 border-b text-center">Weight</th>
                    <th class="py-2 px-4 border-b text-center">Blending Required</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in editFormData.productSubCodesofRecipe" :key="index"
                    class="hover:bg-gray-100">
                    <td class="py-2 px-4 border-b text-center" data-label="No.">
                      {{ index + 1 }}
                    </td>
                    <td class="py-2 px-4 border-b" data-label="Part Number">{{ row.productCode }}</td>
                    <td class="py-2 px-4 border-b text-center" data-label="Percentage">{{ row.percentage }}</td>
                    <td class="py-2 px-4 border-b text-center" data-label="Weight">{{ row.weight.toFixed(4) }}</td>
                    <td class="py-2 px-4 border-b text-center" data-label="Blending Required">
                      {{ row.blendingRequired ? 'Yes' : 'No' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="mt-5 flex justify-between">

            <Button @click="updateRole" variant="primary" class="w-[100%] ml-2 mt-10 shadow-md">
              Submit
            </Button>
            <Button @click="release" variant="primary" class="w-[100%] ml-2 mt-10 shadow-md">
              Release to Production
            </Button>
          </div>


        </form>
      </Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
          setEditSlideOver(false);
        }" class="w-20 mr-1">
          Cancel
        </Button>
      </Dialog.Footer>
    </Dialog.Panel>
  </Dialog>


  <!-- BEGIN: Modal Content -->
  <Dialog
:staticBackdrop="true" size="xl" :open="viewModal" @close="() => {
    setviewModal(false);
  }
    ">
    <Dialog.Panel>
      <Dialog.Title>
        <h2 class="w-100 mr-auto text-base font-medium">
          View Planning
        </h2>
      </Dialog.Title>
      <Dialog.Description class="max-h-[70vh] overflow-y-auto">
        <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
          <div class="lg:flex lg:flex-row">
            <div class="hidden" ref="toPrint">
              <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <tbody class="w-[100%]">
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.jobId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Oracle Job ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.oracleJobId }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Part Number
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.productcode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Date
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ formattedDate }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Employee ID
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.resourcecode }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Type
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.jobtype }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Platform
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.platform }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Remarks
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.remarks }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      No of Pieces
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.noofpieces }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Wwight
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.quantity }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Planning Start Date
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ formattedStartDate }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Planning Complete Date
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ formattedExpectedDate }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      No of Resources
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.noofresources }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      No of Machines
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.noofmachines }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Buffer
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.buffer }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Buffer Remarks
                    </th>
                    <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                      {{ viewData.bufferremarks }}
                    </td>
                  </tr>

                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Wet <br>Treatment<br>Required
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span
                        :class="{ 'text-red-600 ': !viewData.wettreatmentrequired, 'text-green-600': viewData.wettreatmentrequired }">
                        {{ viewData.wettreatmentrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.wettreatmentrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.wettreatmentrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Plasma <br>Treatment<br>Required
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span
                        :class="{ 'text-red-600 ': !viewData.plasmatreatmentrequired, 'text-green-600': viewData.plasmatreatmentrequired }">
                        {{ viewData.plasmatreatmentrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.plasmatreatmentrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.plasmatreatmentrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Dedusting Required
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span
                        :class="{ 'text-red-600 ': !viewData.dustingrequired, 'text-green-600': viewData.dustingrequired }">
                        {{ viewData.dustingrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.dustingrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.dustingrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Deburring Required
                    </th>
                    <td class="w-[50%] px-auto text-center">
                      <span
                        :class="{ 'text-red-600 ': !viewData.deburringrequired, 'text-green-600': viewData.deburringrequired }">
                        {{ viewData.deburringrequired ? 'Required' : 'Not Required' }}
                        <i v-if="viewData.deburringrequired" class="far fa-circle-check"></i>
                        <i v-if="!viewData.deburringrequired" class="fa-regular fa-circle-xmark"></i>
                      </span>
                    </td>
                  </tr>
                  <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Replacement Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.replacemenntjobid }}
                  </td>
                </tr> -->
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Job Status
                    </th>
                    <td class="w-[50%] px-auto text-center" :class="{
                      'text-orange-600': viewData.jobstatus === 'Draft',
                      'text-green-600': viewData.jobstatus === 'Completed',
                      'text-sky-600': viewData.jobstatus === 'Pending Blending',
                      'text-blue-600': viewData.jobstatus === 'Pending Production',
                      'text-indigo-600': viewData.jobstatus === 'Pending Post Production Chemical Treatment',
                      'text-violet-600': viewData.jobstatus === 'Pending Post Production Blow',
                      'text-teal-600': viewData.jobstatus === 'Pending Quality Check',
                      'text-lime-600': viewData.jobstatus === 'Pending Packing',
                      'text-red-600': viewData.jobstatus === 'Quality Check Rejected',
                      'text-gray-500': viewData.jobstatus !== 'Draft' && viewData.jobstatus !== 'Completed'
                    }">
                      {{ viewData.jobstatus }}
                    </td>
                  </tr>
                  <tr class="border-b border-gray-200 dark:border-gray-700">
                    <th scope="row"
                      class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                      Status
                    </th>
                    <td class="w-[50%] px-auto text-center" :class="{
                      'text-red-600': viewData.status === 'Inactive', 'text-green-600': viewData.status === 'Active',
                      'text-gray-500': viewData.status !== 'Inactive' && viewData.status !== 'Active'
                    }">
                      {{ viewData.status }}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10"
                v-if="viewData.listMachines.length > 0">

                <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <tbody class="w-[100%]">
                    <tr class="border-b border-gray-200 dark:border-gray-700">
                      <th scope="col" colspan="7"
                        class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                        List Machines
                      </th>
                    </tr>
                    <tr>
                      <th scope="row"
                        class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Code
                      </th>
                      <th scope="row"
                        class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                        Type
                      </th>

                    </tr>
                    <tr v-for="(row, index) in viewData.listMachines" :key="index" class="hover:bg-gray-100">
                      <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.code }}
                      </td>
                      <td class=" px-auto text-center text-gray-700 dark:text-white ">
                        {{ row.type }}
                      </td>

                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
            <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Oracle Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.oracleJobId }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Part Number
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.productcode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Date
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ formattedDate }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Employee ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.resourcecode }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Type
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.jobtype }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Platform
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.platform }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Remarks
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.remarks }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    No of Pieces
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.noofpieces }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Wwight
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.quantity }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Start Date
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ formattedStartDate }}
                  </td>
                </tr>

              </tbody>
            </table>
            <table class="w-[100%] text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
              <tbody class="w-[100%]">
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Planning Complete Date
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ formattedExpectedDate }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    No of Resources
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.noofresources }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    No of Machines
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.noofmachines }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Buffer
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.buffer }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Buffer Remarks
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.bufferremarks }}
                  </td>
                </tr>

                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Wet <br>Treatment<br>Required
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span
                      :class="{ 'text-red-600 ': !viewData.wettreatmentrequired, 'text-green-600': viewData.wettreatmentrequired }">
                      {{ viewData.wettreatmentrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.wettreatmentrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.wettreatmentrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Plasma <br>Treatment<br>Required
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span
                      :class="{ 'text-red-600 ': !viewData.plasmatreatmentrequired, 'text-green-600': viewData.plasmatreatmentrequired }">
                      {{ viewData.plasmatreatmentrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.plasmatreatmentrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.plasmatreatmentrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Dedusting Required
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span
                      :class="{ 'text-red-600 ': !viewData.dustingrequired, 'text-green-600': viewData.dustingrequired }">
                      {{ viewData.dustingrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.dustingrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.dustingrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Deburring Required
                  </th>
                  <td class="w-[50%] px-auto text-center">
                    <span
                      :class="{ 'text-red-600 ': !viewData.deburringrequired, 'text-green-600': viewData.deburringrequired }">
                      {{ viewData.deburringrequired ? 'Required' : 'Not Required' }}
                      <i v-if="viewData.deburringrequired" class="far fa-circle-check"></i>
                      <i v-if="!viewData.deburringrequired" class="fa-regular fa-circle-xmark"></i>
                    </span>
                  </td>
                </tr>
                <!-- <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Replacement Job ID
                  </th>
                  <td class="w-[50%] px-auto text-center text-gray-700 dark:text-white">
                    {{ viewData.replacemenntjobid }}
                  </td>
                </tr> -->
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Job Status
                  </th>
                  <td class="w-[50%] px-auto text-center" :class="{
                    'text-orange-600': viewData.jobstatus === 'Draft',
                    'text-green-600': viewData.jobstatus === 'Completed',
                    'text-sky-600': viewData.jobstatus === 'Pending Blending',
                    'text-blue-600': viewData.jobstatus === 'Pending Production',
                    'text-indigo-600': viewData.jobstatus === 'Pending Post Production Chemical Treatment',
                    'text-violet-600': viewData.jobstatus === 'Pending Post Production Blow',
                    'text-teal-600': viewData.jobstatus === 'Pending Quality Check',
                    'text-lime-600': viewData.jobstatus === 'Pending Packing',
                    'text-red-600': viewData.jobstatus === 'Quality Check Rejected',
                    'text-gray-500': viewData.jobstatus !== 'Draft' && viewData.jobstatus !== 'Completed'
                  }">
                    {{ viewData.jobstatus }}
                  </td>
                </tr>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th scope="row"
                    class="w-[50%] px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800">
                    Status
                  </th>
                  <td class="w-[50%] px-auto text-center" :class="{
                    'text-red-600': viewData.status === 'Inactive', 'text-green-600': viewData.status === 'Active',
                    'text-gray-500': viewData.status !== 'Inactive' && viewData.status !== 'Active'
                  }">
                    {{ viewData.status }}
                  </td>
                </tr>


              </tbody>
            </table>

          </div>

        </div>

        <div class="relative overflow-x-auto shadow-md sm:rounded-lg mt-10" v-if="viewData.listMachines.length > 0">

          <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
            <tbody class="w-[100%]">
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th scope="col" colspan="7"
                  class="title px-6 py-4 text-center font-medium text-white whitespace-nowrap bg-blue-900 dark:text-white dark:bg-gray-800">
                  List Machines
                </th>
              </tr>
              <tr>
                <th scope="row"
                  class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  No.
                </th>
                <th scope="row"
                  class=" px-4 py-4 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  Code
                </th>
                <th scope="row"
                  class=" px-4 py-2 text-center font-medium text-white whitespace-nowrap bg-primary dark:text-white dark:bg-gray-800  ">
                  Type
                </th>


              </tr>
              <tr v-for="(row, index) in viewData.listMachines" :key="index" class="hover:bg-gray-100">
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                  {{ index + 1 }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                  {{ row.code }}
                </td>
                <td class="py-3 px-auto text-center text-gray-700 dark:text-white ">
                  {{ row.type }}
                </td>


              </tr>

            </tbody>
          </table>
        </div>





      </Dialog.Description>
      <Dialog.Footer>
        <Button type="button" variant="primary" class="mr-2" @click="printTable">
          <i class="fa-solid fa-print mr-2"></i> Print
        </Button>

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
@media (max-width: 635px) {
  .responsive-table thead {
    display: none;
  }

  .responsive-table tbody tr {
    display: flex;
    flex-direction: column;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
  }

  .responsive-table tbody td {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    border-bottom: 1px solid #dddddd;
  }

  .responsive-table tbody td::before {
    content: attr(data-label);
    flex-basis: 50%;
    text-align: left;
    font-weight: bold;
  }
}

.rounded-tl-lg {
  border-top-left-radius: 0.5rem;
  /* Adjust the size as needed */
}

.rounded-tr-lg {
  border-top-right-radius: 0.5rem;
  /* Adjust the size as needed */
}
</style>
