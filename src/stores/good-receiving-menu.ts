import { defineStore } from "pinia";
import { Icon } from "../base-components/Lucide/Lucide.vue";

export interface Menu {
  icon: Icon;
  title: string;
  pageName?: string;
  subMenu?: Menu[];
  ignore?: boolean;
}

export interface GoodReceivingMenuState {
  menu: Array<Menu | "divider">;
}

export const useGoodReceivingMenuStore = defineStore("GoodReceivingMenu", {
  state: (): GoodReceivingMenuState => ({
    menu: [
      {
        icon: "ClipboardCheck",
        pageName: "good-receiving-menu-good-receiving",
        title: "Good Receiving",
      },
     
    ],
  }),
});
