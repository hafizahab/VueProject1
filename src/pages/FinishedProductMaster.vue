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

interface Response {
  name?: string;
  code?: string;
  averagetime?: string;
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
  // Sample data for demonstration purposes
  const sampleData = [
    { name: "Name 1", code: "1003", averagetime: "10:00", status: true },
  { name: "Name 2", code: "1004", averagetime: "12:30", status: false },
  { name: "Name 3", code: "1005", averagetime: "15:45", status: true },
  { name: "Name 4", code: "1006", averagetime: "08:15", status: false },
  { name: "Name 5", code: "1007", averagetime: "14:20", status: true },
  { name: "Name 6", code: "1008", averagetime: "09:55", status: false },
  { name: "Name 7", code: "1009", averagetime: "16:10", status: true },
  { name: "Name 8", code: "1010", averagetime: "11:25", status: false },
  { name: "Name 9", code: "1011", averagetime: "13:40", status: true },
  { name: "Name 10", code: "1012", averagetime: "07:30", status: false },
  { name: "Name 11", code: "1013", averagetime: "17:05", status: true },


  ];

  if (tableRef.value) {
    tabulator.value = new Tabulator(tableRef.value, {
      data: sampleData,
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

        // For HTML table
        {
          title: "CODE",
          minWidth: 200,
          responsive: 0,
          field: "code",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.code}</div>
              </div>`;
          },
        },
        {
          title: "NAME",
          minWidth: 200,
          responsive: 0,
          field: "name",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.name}</div>
              </div>`;
          },
        },
        {
          title: "AVERAGE TIME",
          minWidth: 200,
          responsive: 0,
          field: "averagetime",
          vertAlign: "middle",
          print: false,
          download: false,
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div>
                <div class="font-medium whitespace-nowrap">${response.averagetime}</div>
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
          formatter(cell) {
            const response: Response = cell.getData();
            return `<div class="flex items-center lg:justify-center ${response.status ? "bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-green-400 border border-green-400" : "bg-red-100 text-red-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-gray-700 dark:text-red-400 border border-red-400"
              }">
                ${response.status ? "Active" : "Inactive"
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
            container.classList.add("flex", "items-center", "lg:justify-center");

            const editLink = document.createElement("a");
            editLink.classList.add("flex", "items-center", "mr-3");
            editLink.href = "#";
            editLink.addEventListener("click", (event) => {
              event.preventDefault();
              setMediumSlideoverSizePreview(true);
            });

            const editIcon = document.createElement("i");
            editIcon.classList.add("fa-regular", "fa-pen-to-square", "pr-2");
            editLink.appendChild(editIcon);
            editLink.appendChild(document.createTextNode("Edit"));

            const deleteLink = document.createElement("a");
            deleteLink.classList.add("flex", "items-center", "text-danger");
            deleteLink.href = "javascript:;";
            deleteLink.addEventListener("click", function () {
              // Handle delete action
            });

            const deleteIcon = document.createElement("i");
            deleteIcon.classList.add("fa-regular", "fa-trash-can", "pr-2");
            deleteLink.appendChild(deleteIcon);
            deleteLink.appendChild(document.createTextNode("Delete"));

            container.appendChild(editLink);
            container.appendChild(deleteLink);

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
  initTabulator();
  reInitOnResizeWindow();
});


const basicSlideoverPreview = ref(false);
const setBasicSlideoverPreview = (value: boolean) => {
  basicSlideoverPreview.value = value;
};


const mediumSlideoverSizePreview = ref(false);
const setMediumSlideoverSizePreview = (value: boolean) => {
  mediumSlideoverSizePreview.value = value;
};
</script>

<template>
  <div class="flex flex-col items-center mt-8 intro-y sm:flex-row">
    <h2 class="mr-auto text-lg font-medium">Finished Product Master</h2>
    <div class="flex w-full mt-4 sm:w-auto sm:mt-0">
      <Button variant="primary" class="mr-2 shadow-md" as="a" href="#" @click="(event: MouseEvent) => {
        event.preventDefault();
        setBasicSlideoverPreview(true);
      }">
        Add Finished Product Master
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
  <Slideover :open="basicSlideoverPreview" @close="() => {
      setBasicSlideoverPreview(false);
    }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Add Finished Product Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <div>
          <FormLabel htmlFor="regular-form-1">Code</FormLabel>
          <FormInput id="regular-form-1" type="text" placeholder="Code" />
        </div>
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Name</FormLabel>
          <FormInput id="regular-form-1" type="text" placeholder="Name" />
        </div>
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Averagetime</FormLabel>
          <FormInput id="regular-form-1" type="time" />
        </div>
       
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Status</FormLabel>
          <FormSelect class=" sm:mr-2" aria-label="Default select example">
            <option>Active</option>
            <option>Inactive</option>

          </FormSelect>
        </div>
        <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
          Submit
        </Button>
      </Slideover.Description>
      <Slideover.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
            setMediumSlideoverSizePreview(false);
          }
          " class="w-20 mr-1">
          Cancel
        </Button>
      
      </Slideover.Footer>
    </Slideover.Panel>
  </Slideover>
  <Slideover :open="mediumSlideoverSizePreview" @close="() => {
      setMediumSlideoverSizePreview(false);
    }
    ">
    <Slideover.Panel>
      <Slideover.Title class="p-5">
        <h2 class="mr-auto text-base font-medium">
          Edit Finished Product Master
        </h2>
      </Slideover.Title>
      <Slideover.Description>
        <div>
          <FormLabel htmlFor="regular-form-1">Code</FormLabel>
          <FormInput id="regular-form-1" type="text" placeholder="Code" />
        </div>
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Name</FormLabel>
          <FormInput id="regular-form-1" type="text" placeholder="Name" />
        </div>
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Averagetime</FormLabel>
          <FormInput id="regular-form-1" type="time" />
        </div>
       
        <div class="mt-5">
          <FormLabel htmlFor="regular-form-1">Status</FormLabel>
          <FormSelect class=" sm:mr-2" aria-label="Default select example">
            <option>Active</option>
            <option>Inactive</option>

          </FormSelect>
        </div>
        <Button variant="primary" class="w-[100%] mr-2 mt-10 shadow-md">
          Submit
        </Button>
      </Slideover.Description>
      <Slideover.Footer>
        <Button variant="outline-secondary" type="button" @click="() => {
            setMediumSlideoverSizePreview(false);
          }
          " class="w-20 mr-1">
          Cancel
        </Button>
      
      </Slideover.Footer>
    </Slideover.Panel>
  </Slideover>
</template>
