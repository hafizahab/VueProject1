import { defineStore } from "pinia";
import { Icon } from "../base-components/Lucide/Lucide.vue";

export interface Menu {
  icon: Icon;
  title: string;
  pageName?: string;
  subMenu?: Menu[];
  ignore?: boolean;
}

export interface WarehouseMenuState {
  menu: Array<Menu | "divider">;
}

export const useWarehouseMenuStore = defineStore("WarehouseMenu", {
  state: (): WarehouseMenuState => ({
    menu: [
      {
        icon: "PackageOpen",
        pageName: "warehouse-menu-warehouse",
        title: "Warehouse",
      },
     
    ],
  }),
});
