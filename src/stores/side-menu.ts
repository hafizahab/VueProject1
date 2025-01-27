import { defineStore } from "pinia";
import axios from "axios";
import { Icon } from "../base-components/Lucide/Lucide.vue";

export interface Menu {
  icon: Icon;
  title: string;
  pageName?: string;
  subMenu?: Menu[];
  ignore?: boolean;
  access?: string;
}

export interface SideMenuState {
  menu: Array<Menu | "divider">;
}

function isMenu(item: Menu | "divider"): item is Menu {
  return typeof item !== "string";
}

export const useSideMenuStore = defineStore("sideMenu", {
  state: (): SideMenuState => ({
    menu: [],
  }),
  actions: {
    async fetchUserAccess() {
      try {
        const response = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
        localStorage.setItem('userAccess', JSON.stringify(response.data));
        this.updateMenu();
      } catch (error) {
        console.error('Error fetching user access data:', error);
      }
    },
    updateMenu() {
      const userAccessString = localStorage.getItem('userAccess');
      const userId = localStorage.getItem('userId');
      if (!userAccessString || !userId) {
        console.error("User access data or user ID not found in local storage.");
        this.menu = []; // reset menu
        return;
      }

      let userAccessResponse;
      try {
        userAccessResponse = JSON.parse(userAccessString);
      } catch (error) {
        console.error("Error parsing user access data from local storage:", error);
        this.menu = []; // reset menu
        return;
      }

      const userAccess = userAccessResponse.result.find((access: any) => access.userId === userId) || {};
      if (Object.keys(userAccess).length === 0) {
        console.warn("No access data found for the logged-in user.");
      }

      const filterMenu = (menu: Array<Menu | "divider">): Array<Menu | "divider"> => {
        return menu
          .map(item => {
            if (isMenu(item)) {
              if (item.subMenu) {
                const filteredSubMenu = filterMenu(item.subMenu);
                // Only include the item if the filtered submenu is not empty
                if (filteredSubMenu.length > 0) {
                  return { ...item, subMenu: filteredSubMenu };
                }
                return null; // Exclude this item if the submenu is empty
              }

              if (item.access) {
                const accessKey = item.access as keyof typeof userAccess;
                // Only include the item if the user has "View" access
                return userAccess[accessKey]?.includes("View") ? item : null;
              }

              return item; // Include items without an access requirement
            }
            return item; // Include dividers as they are
          })
          .filter(item => item !== null) as Array<Menu | "divider">;
      };

      const potentialMenu: Array<Menu | "divider"> = [
        {
          icon: "Home",
          pageName: "side-menu-landing-page",
          title: "Home",
        },
        {
          icon: "Cog",
          pageName: "side-menu-master",
          title: "Masters",
          subMenu: [
            {
              icon: "UserPlus",
              pageName: "side-menu-gr",
              title: "User Management",
              subMenu: [
                {
                  icon: "UserCog",
                  pageName: "side-menu-user-access-management",
                  title: "User Access Management",
                  access: "userAccessManagements",
                },
                {
                  icon: "Users",
                  pageName: "side-menu-role-access-management",
                  title: "Role Access Management",
                  access: "roleAccessManagements",
                },
                {
                  icon: "UserCheck",
                  pageName: "side-menu-role-master",
                  title: "Role Master",
                  access: "roleMaster",
                },

              ],
            },
            {
              icon: "MapPin",
              pageName: "side-menu-main-location-master",
              title: "Location Master",
              access: "locationMaster",
            },
            {
              icon: "CalendarClock",
              pageName: "side-menu-shift-master",
              title: "Shift Master",
              access: "shiftMaster",
            },
            {
              icon: "PackageSearch",
              pageName: "side-menu-vendor-master",
              title: "Vendor Master",
              access: "vendorMaster",
            },
            {
              icon: "FolderDown",
              pageName: "side-menu-gr",
              title: "Machine Management",
              subMenu: [
                {
                  icon: "FileCog",
                  pageName: "side-menu-machine-master",
                  title: "Machine Master",
                  access: "machineMaster",
                },
                // {
                //   icon: "Locate",
                //   pageName: "side-menu-machine-location-master",
                //   title: "Machine Location Master",
                //   access: "machineLocationMaster",
                // },
                {
                  icon: "Monitor",
                  pageName: "side-menu-machine-type-master",
                  title: "Machine Type Master",
                  access: "machineTypeMaster",
                },

                {
                  icon: "Tv",
                  pageName: "side-menu-platform-master",
                  title: "Platform Master",
                  access: "platformMaster",
                },
              ],
            },
            // {
            //   icon: "ArrowLeftRight",
            //   pageName: "side-menu-movement-master",
            //   title: "Movement Master",
            //   access: "movementMaster",
            // },
            {
              icon: "ScanLine",
              pageName: "side-menu-gr",
              title: "Product Management",
              subMenu: [
                {
                  icon: "PackageCheck",
                  pageName: "side-menu-part-number-master",
                  title: "Part Number Master",
                  access: "partNumberMaster",
                },
                {
                  icon: "PackageCheck",
                  pageName: "side-menu-powder-master",
                  title: "Powder Master",
                  access: "powderMaster",
                },
                // {
                //   icon: "Boxes",
                //   pageName: "side-menu-product-group-master",
                //   title: "Product Group Master",
                //   access: "productGroupMaster",
                // },
              ],
            },
            {
              icon: "PackagePlus",
              pageName: "side-menu-gr",
              title: "Container Management",
              subMenu: [
                {
                  icon: "PaintBucket",
                  pageName: "side-menu-bin-master",
                  title: "Bin Master",
                  access: "binMaster",
                },
                {
                  icon: "Package",
                  pageName: "side-menu-carton-master",
                  title: "Carton Master",
                  access: "cartonMaster",
                },
                // {
                //   icon: "StickyNote",
                //   pageName: "side-menu-carton-sticker-master",
                //   title: "Carton Sticker Master",
                //   access: "cartonStickerMaster",
                // },
                {
                  icon: "ShoppingBag",
                  pageName: "side-menu-bag-master",
                  title: "Bag Master",
                  access: "bagMaster",
                },
                // {
                //   icon: "StickyNote",
                //   pageName: "side-menu-packet-sticker-master",
                //   title: "Bag Sticker Master",
                //   access: "bagStickerMaster",
                // },
                // {
                //   icon: "FileBarChart",
                //   pageName: "side-menu-value-stream-master",
                //   title: "Value Stream Master",
                //   access: "valueStreamMaster",
                // },
                // {
                //   icon: "CircleSlashed",
                //   pageName: "side-menu-holding-bag-master",
                //   title: "Holding Bag Master",
                //   access: "holdingBagMaster",
                // },
                {
                  icon: "CirclePause",
                  pageName: "side-menu-bin-holding",
                  title: "Bin Holding",
                  access: "binHolding",
                },

              ],
            },



          ],
        },
        {
          icon: "CheckSquare",
          pageName: "side-menu-gr",
          title: "Goods Receive",
          subMenu: [
            {
              icon: "CheckSquare",
              pageName: "side-menu-good-receiving",
              title: "Goods Receiving",
              access: "goodsReceiving",
            },
            {
              icon: "ShieldCheck",
              pageName: "side-menu-quality-check",
              title: "Goods Receiving Quality Check",
              access: "goodsReceive",
            },
            {
              icon: "Album",
              pageName: "side-menu-gr-warehouse",
              title: "Warehouse",
              access: "warehouse",
            },
            {
              icon: "MailQuestion",
              pageName: "side-menu-warehouse-request",
              title: "Warehouse Request",
              access: "warehouseRequest",
            },

          ],
        },
        {
          icon: "ClipboardCheck",
          pageName: "side-menu-planning",
          title: "Planning",
          access: "planning",
        },
        {
          icon: "BarChart4",
          pageName: "side-menu-production",
          title: "Production",
          subMenu: [


                {
                  icon: "RefreshCw",
                  pageName: "side-menu-blending",
                  title: "Blending",
                  access: "blending",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-blending-job",
                  title: "Blending Job",
                  access: "blendingJobs",
                },



                {
                  icon: "Wrench",
                  pageName: "side-menu-machine-station",
                  title: "Machine Station",
                  access: "machineStation_Production",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-machine-job",
                  title: "Machine Station Job",
                  access: "machineStationJobs",
                },
                {
                  icon: "PackageSearch",
                  pageName: "side-menu-in-progress-quality-check",
                  title: "In Progress Quality Check",
                  access: "inProcessQualityCheck",
                },
                {
                  icon: "CornerDownRight",
                  pageName: "side-menu-secondary-process",
                  title: "Secondary Process",
                  access: "secondaryProcess",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-wet-treatment-job",
                  title: "Wet Treatment Job",
                  access: "wetTreatmentJob",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-plasma-treatment-job",
                  title: "Plasma Treatment Job",
                  access: "plasmaTreatmentJob",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-deburring-job",
                  title: "Deburring Job",
                  access: "deburringJob",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-dedusting-job",
                  title: "Dedusting Job",
                  access: "dedustingJob",
                },






          ],
        },
        {
          icon: "FileCog",
          pageName: "side-menu-post-production",
          title: "Post Production",
          subMenu: [


            {
              icon: "PackageSearch",
              pageName: "side-menu-qc-inspection",
              title: "Outgoing Quality Check",
              access: "outgoingQualityCheck",
            },

                {
                  icon: "PackageOpen",
                  pageName: "side-menu-packing",
                  title: "Packing",
                  access: "packing",
                },
                {
                  icon: "LayoutList",
                  pageName: "side-menu-packing-job",
                  title: "Packing Job",
                  access: "packingJob",
                },


            // {
            //   icon: "PauseOctagon",
            //   pageName: "side-menu-package-holding",
            //   title: "Package Holding",
            //   access: "packageHolding",
            // },
          ],
        },
      ];

      const filteredMenu: Array<Menu | "divider"> = potentialMenu.map(menu => {
        if (isMenu(menu) && menu.subMenu) {
          const filteredSubMenu = menu.subMenu.filter(subMenu => {
            if (subMenu.access) {
              const accessKey = subMenu.access as keyof typeof userAccess;
              return userAccess[accessKey]?.includes("View");
            }
            return true;
          });
          if (filteredSubMenu.length > 0) {
            return { ...menu, subMenu: filteredSubMenu };
          }
          return null;
        }

        if (isMenu(menu) && menu.access) {
          const accessKey = menu.access as keyof typeof userAccess;
          return userAccess[accessKey]?.includes("View") ? menu : null;
        }

        return menu;
      }).filter(menu => menu !== null) as Array<Menu | "divider">;
      this.menu = filterMenu(potentialMenu);
    },
    startPolling(interval = 60000) { // Poll every minute by default
      setInterval(this.fetchUserAccess, interval);
    },
    resetMenu() {
      this.menu = [];
    }
  }
});
