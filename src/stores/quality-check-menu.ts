import { defineStore } from "pinia";
import { Icon } from "../base-components/Lucide/Lucide.vue";

export interface Menu {
  icon: Icon;
  title: string;
  pageName?: string;
  subMenu?: Menu[];
  ignore?: boolean;
}

export interface QualityCheckMenuState {
  menu: Array<Menu | "divider">;
}

export const useQualityCheckMenuStore = defineStore("QualityCheckMenu", {
  state: (): QualityCheckMenuState => ({
    menu: [
      {
        icon: "ShieldCheck",
        pageName: "quality-check-menu-quality-check",
        title: "Quality Check",
      },
     
    ],
  }),
});
