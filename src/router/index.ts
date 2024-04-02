import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import SideMenu from "../layouts/SideMenu/SideMenu.vue";
import GoodReceivingMenu from "../layouts/GoodReceivingMenu/GoodReceivingMenu.vue";
import WarehouseMenu from "../layouts/WarehouseMenu/WarehouseMenu.vue";
import QualityCheckMenu from "../layouts/QualityCheck/QualityCheckMenu.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import ErrorPage from "../pages/ErrorPage.vue";
import RoleMaster from "../pages/RoleMaster.vue";
import ProductMaster from "../pages/ProductMaster.vue";
import WarehouseLocationMaster from "../pages/WarehouseLocationMaster.vue";
import MachineCodeMaster from "../pages/MachineCodeMaster.vue";
import FinishedProductMaster from "../pages/FinishedProductMaster.vue";
import VendorMaster from "../pages/VendorMaster.vue";
import GoodReceiving from "../pages/GoodReceiving.vue";
import Planning from "../pages/Planning.vue";
import Warehouse from "../pages/Warehouse.vue";
import QualityCheck from "../pages/QualityCheck.vue";

// Function to check if the user is authenticated
const isAuthenticated = () => {
  // Check if user is authenticated, for example, by checking if token exists in localStorage
  return localStorage.getItem('token') !== null;
};

// Function to check if the user has the appropriate role
const hasRole = (role: string) => {
  // Check if user has the specified role, for example, by checking user object stored in localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user && user.user_type === role;
};

const routes: Array<RouteRecordRaw> =[
  {
    path: "/",
    component: SideMenu,
    children: [
      {
        path: "role-master",
        name: "side-menu-role-master",
        component: RoleMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "product-master",
        name: "side-menu-product-master",
        component: ProductMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "warehouse-location-master",
        name: "side-menu-warehouse-location-master",
        component: WarehouseLocationMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "finished-product-master",
        name: "side-menu-finished-product-master",
        component: FinishedProductMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "machine-code-master",
        name: "side-menu-machine-code-master",
        component: MachineCodeMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "vendor-master",
        name: "side-menu-vendor-master",
        component: VendorMaster,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "planning",
        name: "side-menu-planning",
        component: Planning,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "warehouse",
        name: "side-menu-warehouse",
        component: Warehouse,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "quality-check",
        name: "side-menu-quality-check",
        component:  QualityCheck,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
      {
        path: "good-receiving",
        name: "side-menu-good-receiving",
        component: GoodReceiving,
        // meta: { requiresAuth: true, requiresRole: 'admin' }
      },
    ],
  },
  {
    path: "/good-receiving",
    component: GoodReceivingMenu,
    children: [

      {
        path: "good-receiving",
        name: "good-receiving-menu-good-receiving",
        component: GoodReceiving,
      },
    ],
  },
  {
    path: "/warehouse",
    component: WarehouseMenu,
    children: [

      {
        path: "warehouse",
        name: "warehouse-menu-warehouse",
        component: Warehouse,
        // meta: { requiresAuth: true, requiresRole: 'whuser' }
      },
    ],
  },
  {
    path: "/quality-check",
    component: QualityCheckMenu,
    children: [

      {
        path: "quality-check",
        name: "quality-check-menu-quality-check",
        component: QualityCheck,
        // meta: { requiresAuth: true, requiresRole: 'qcuser' }
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: Login,
  },
  {
    path: "/register",
    name: "register",
    component: Register,
  },
  {
    path: "/error-page",
    name: "error-page",
    component: ErrorPage,
  },
  {
    path: "/:pathMatch(.*)*",
    component: ErrorPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 };
  },
});


router.beforeEach((to, from, next) => {
  if (to.meta.requiresRole) {
    const requiredRole = to.meta.requiresRole as string; // Ensure requiredRole is of type string
    if (!isAuthenticated()) {
      // If user is not authenticated, redirect to login page
      next('/login');
    } else if (!hasRole(requiredRole)) {
      // If user does not have the required role, redirect to unauthorized page
      next('/error-page');
    } else {
      // Proceed to the next route
      next();
    }
  } else {
    // Proceed to the next route
    next();
  }
});

export default router;