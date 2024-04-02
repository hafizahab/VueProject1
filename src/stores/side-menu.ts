import { defineStore } from "pinia";
import { Icon } from "../base-components/Lucide/Lucide.vue";

export interface Menu {
  icon: Icon;
  title: string;
  pageName?: string;
  subMenu?: Menu[];
  ignore?: boolean;
}

export interface SideMenuState {
  menu: Array<Menu | "divider">;
}

export const useSideMenuStore = defineStore("sideMenu", {
  state: (): SideMenuState => ({
    menu: [
     
    
      {
        icon: "UserCog",
        pageName: "side-menu-master",
        title: "Masters",
        subMenu: [
          {
            icon: "UserCheck",
            pageName: "side-menu-role-master",
            title: "Role Master",
          },
          {
            icon: "PackagePlus",
            pageName: "side-menu-product-master",
            title: "Product Master",
          },
          {
            icon: "Home",
            pageName: "side-menu-warehouse-location-master",
            title: "Warehouse Location Master",
          },
          {
            icon: "PackageCheck",
            pageName: "side-menu-finished-product-master",
            title: "Finished Product Master",
          },
          {
            icon: "ArchiveRestore",
            pageName: "side-menu-vendor-master",
            title: "Vendor Master",
          },
          {
            icon: "ServerCog",
            pageName: "side-menu-machine-code-master",
            title: "Machine Code Master",
          },
        ],
      },
      {
        icon: "CheckSquare",
        pageName: "side-menu-good-receiving",
        title: "Good Receiving",
      },
      {
        icon: "ClipboardCheck",
        pageName: "side-menu-planning",
        title: "Planning",
      },
      {
        icon: "PackageOpen",
        pageName: "side-menu-warehouse",
        title: "Warehouse",
      },
      {
        icon: "ShieldCheck",
        pageName: "side-menu-quality-check",
        title: "Quality Check",
      },
      
    ],
  }),
});
