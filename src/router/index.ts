import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { reactive } from 'vue';
import axios from 'axios';
import SideMenu from '../layouts/SideMenu/SideMenu.vue';
import GoodReceivingMenu from '../layouts/GoodReceivingMenu/GoodReceivingMenu.vue';
import WarehouseMenu from '../layouts/WarehouseMenu/WarehouseMenu.vue';
import QualityCheckMenu from '../layouts/QualityCheck/QualityCheckMenu.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';
import ErrorPage from '../pages/ErrorPage.vue';
import RoleMaster from '../pages/RoleMaster.vue';
import ProductMaster from '../pages/ProductMaster.vue';
import WarehouseLocationMaster from '../pages/WarehouseLocationMaster.vue';
import MachineCodeMaster from '../pages/MachineCodeMaster.vue';
import FinishedProductMaster from '../pages/FinishedProductMaster.vue';
import GoodReceiving from '../pages/GoodReceiving.vue';
import Planning from '../pages/Planning.vue';
import Warehouse from '../pages/Warehouse.vue';
import QualityCheck from '../pages/QualityCheck.vue';
import LandingPage from '../pages/LandingPage.vue';
import Blending from '../pages/Blending.vue';
import MachineStation from '../pages/MachineStation.vue';
import PackageHolding from '../pages/PackageHolding.vue';
import Packing from '../pages/Packing.vue';
import PostProductionChemicalTreatment from '../pages/PostProductionChemicalTreatment.vue';
import PostProductBlow from '../pages/PostProductBlow.vue';
import QCInspection from '../pages/QCInspection.vue';
import MachineMaster from '../pages/MachineMaster.vue';
import ForgetPassword from '../pages/ForgetPassword.vue';
import LocationMaster from '../pages/LocationMaster.vue';
import BinMaster from '../pages/BinMaster.vue';
import ShiftMaster from '../pages/ShiftMaster.vue';
import MovementMaster from '../pages/MovementMaster.vue';
import CartonMaster from '../pages/CartonMaster.vue';
import PacketMaster from '../pages/PacketMaster.vue';
import MachineTypeMaster from '../pages/MachineTypeMaster.vue';
import PlatformMaster from '../pages/PlatformMaster.vue';
import ProductGroupMaster from '../pages/ProductGroupMaster.vue';
import UserMaster from '../pages/UserMaster.vue';
import VendorMaster from '../pages/VendorMaster.vue';
import HoldingBagsMaster from '../pages/HoldingBagsMaster.vue';
import CartonStickerMaster from '../pages/CartonStickerMaster.vue';
import PacketStickerMaster from '../pages/PacketStickerMaster.vue';
import UserRegistration from '../pages/UserRegistration.vue';
import ChangePassword from '../pages/ChangePassword.vue';
import test from '../pages/test.vue';
import ValueStreamMaster from "../pages/ValueStreamMaster.vue";
import UserAccessManagement from '../pages/UserAccessManagement.vue';
import RoleAccessManagement from '../pages/RoleAccessManagement.vue';
import Profile from '../pages/Profile.vue';
import MachineLocationMaster from '../pages/MachineLocationMaster.vue';
import GRWarehouse from '../pages/GRWarehouse.vue';
import BlendingJob from '../pages/BlendingJob.vue';
import MachineJob from '../pages/MachineJob.vue';
import ChemicalJob from '../pages/ChemicalJob.vue';
import PowerMaster from '../pages/PowerMaster.vue';
import ipqc from '../pages/ipqc.vue';
import SecondaryProcess from '../pages/SecondaryProcess.vue';
import WetTreatmentJob from '../pages/WetTreatmentJob.vue';
import DeburringJob from '../pages/DeburringJob.vue';
import DedustingJob from '../pages/DedustingJob.vue';
import PlasmaTreatment from '../pages/PlasmaTreatment.vue';
import WarehouseRequest from '../pages/WarehouseRequest.vue';
import BinHolding from '../pages/BinHolding.vue';
import PackingJob from '../pages/PackingJob.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/landing-page',
    component: SideMenu,
    children: [
      {
        path: 'role-master',
        name: 'side-menu-role-master',
        component: RoleMaster,
        meta: { requiresPermission: 'roleMaster' },
      },
      {
        path: 'part-number-master',
        name: 'side-menu-part-number-master',
        component: ProductMaster,
        meta: { requiresPermission: 'partNumberMaster' },
      },
      {
        path: 'warehouse-location-master',
        name: 'side-menu-warehouse-location-master',
        component: WarehouseLocationMaster,
        meta: { requiresPermission: 'admin' },
      },
      {
        path: 'finished-product-master',
        name: 'side-menu-finished-product-master',
        component: FinishedProductMaster,
        meta: { requiresPermission: 'admin' },
      },
      {
        path: 'machine-code-master',
        name: 'side-menu-machine-code-master',
        component: MachineCodeMaster,
        meta: { requiresPermission: 'admin' },
      },
      {
        path: 'vendor-master',
        name: 'side-menu-vendor-master',
        component: VendorMaster,
        meta: { requiresPermission: 'vendorMaster' },
      },
      {
        path: 'planning',
        name: 'side-menu-planning',
        component: Planning,
        meta: { requiresPermission: 'planning' },
      },
      {
        path: 'warehouse',
        name: 'side-menu-warehouse',
        component: Warehouse,
        meta: { requiresPermission: 'warehouse' },
      },
      {
        path: 'quality-check',
        name: 'side-menu-quality-check',
        component: QualityCheck,
        meta: { requiresPermission: 'goodsReceive' },
      },
      {
        path: 'good-receiving',
        name: 'side-menu-good-receiving',
        component: GoodReceiving,
        meta: { requiresPermission: 'goodsReceiving' },
      },
      {
        path: 'gr-warehouse',
        name: 'side-menu-gr-warehouse',
        component: GRWarehouse,
        meta: { requiresPermission: 'warehouse' },
      },
      {
        path: 'warehouse-request',
        name: 'side-menu-warehouse-request',
        component: WarehouseRequest,
        meta: { requiresPermission: 'warehouseRequest' },
      },
      {
        path: 'bin-holding',
        name: 'side-menu-bin-holding',
        component: BinHolding,
        meta: { requiresPermission: 'binHolding' },
      },
      {
        path: 'landing-page',
        name: 'side-menu-landing-page',
        component: LandingPage,
      },
      {
        path: 'blending',
        name: 'side-menu-blending',
        component: Blending,
        meta: { requiresPermission: 'blending' },
      },
      {
        path: 'blending-job',
        name: 'side-menu-blending-job',
        component: BlendingJob,
        meta: { requiresPermission: 'blendingJobs' },
      },
      {
        path: 'machine-station',
        name: 'side-menu-machine-station',
        component: MachineStation,
        meta: { requiresPermission: 'machineStation_Production' },
      },
      {
        path: 'secondary-process',
        name: 'side-menu-secondary-process',
        component: SecondaryProcess,
        meta: { requiresPermission: 'secondaryProcess' },
      },
      {
        path: 'wet-treatment-job',
        name: 'side-menu-wet-treatment-job',
        component: WetTreatmentJob,
        meta: { requiresPermission: 'wetTreatmentJob' },
      },
      {
        path: 'deburring-job',
        name: 'side-menu-deburring-job',
        component: DeburringJob,
        meta: { requiresPermission: 'deburringJob' },
      },
      {
        path: 'plasma-treatment-job',
        name: 'side-menu-plasma-treatment-job',
        component: PlasmaTreatment,
        meta: { requiresPermission: 'plasmaTreatmentJob' },
      },
      {
        path: 'dedusting-job',
        name: 'side-menu-dedusting-job',
        component: DedustingJob,
        meta: { requiresPermission: 'dedustingJob' },
      },
      {
        path: 'package-holding',
        name: 'side-menu-package-holding',
        component: PackageHolding,
        meta: { requiresPermission: 'packageHolding' },
      },
      {
        path: 'packing',
        name: 'side-menu-packing',
        component: Packing,
        meta: { requiresPermission: 'packing' },
      },
      {
        path: 'packing-job',
        name: 'side-menu-packing-job',
        component: PackingJob,
        meta: { requiresPermission: 'packingJob' },
      },
      {
        path: 'post-production-chemical-treatment',
        name: 'side-menu-post-production-chemical-treatment',
        component: PostProductionChemicalTreatment,
        meta: { requiresPermission: 'postProductionChemicalTreatment' },
      },
      {
        path: 'post-production-blow',
        name: 'side-menu-post-production-blow',
        component: PostProductBlow,
        meta: { requiresPermission: 'blowerJobs' },
      },
      {
        path: 'qc-inspection',
        name: 'side-menu-qc-inspection',
        component: QCInspection,
        meta: { requiresPermission: 'outgoingQualityCheck' },
      },
      {
        path: 'in-progress-quality-check',
        name: 'side-menu-in-progress-quality-check',
        component: ipqc,
        meta: { requiresPermission: 'inProcessQualityCheck' },
      },
      {
        path: 'machine-master',
        name: 'side-menu-machine-master',
        component: MachineMaster,
        meta: { requiresPermission: 'machineMaster' },
      },
      {
        path: 'location-master',
        name: 'side-menu-main-location-master',
        component: LocationMaster,
        meta: { requiresPermission: 'locationMaster' },
      },
      {
        path: 'bin-master',
        name: 'side-menu-bin-master',
        component: BinMaster,
        meta: { requiresPermission: 'binMaster' },
      },
      {
        path: 'shift-master',
        name: 'side-menu-shift-master',
        component: ShiftMaster,
        meta: { requiresPermission: 'shiftMaster' },
      },
      {
        path: 'movement-master',
        name: 'side-menu-movement-master',
        component: MovementMaster,
        meta: { requiresPermission: 'movementMaster' },
      },
      {
        path: 'carton-master',
        name: 'side-menu-carton-master',
        component: CartonMaster,
        meta: { requiresPermission: 'cartonMaster' },
      },
      {
        path: 'bag-master',
        name: 'side-menu-bag-master',
        component: PacketMaster,
        meta: { requiresPermission: 'bagMaster' },
      },
      {
        path: 'machine-type-master',
        name: 'side-menu-machine-type-master',
        component: MachineTypeMaster,
        meta: { requiresPermission: 'machineTypeMaster' },
      },
      {
        path: 'platform-master',
        name: 'side-menu-platform-master',
        component: PlatformMaster,
        meta: { requiresPermission: 'platformMaster' },
      },
      {
        path: 'product-group-master',
        name: 'side-menu-product-group-master',
        component: ProductGroupMaster,
        meta: { requiresPermission: 'productGroupMaster' },
      },
      {
        path: 'user-master',
        name: 'side-menu-user-master',
        component: UserMaster,
        meta: { requiresPermission: 'admin' },
      },
      {
        path: 'holding-bag-master',
        name: 'side-menu-holding-bag-master',
        component: HoldingBagsMaster,
        meta: { requiresPermission: 'holdingBagMaster' },
      },
      {
        path: 'carton-sticker-master',
        name: 'side-menu-carton-sticker-master',
        component: CartonStickerMaster,
        meta: { requiresPermission: 'cartonStickerMaster' },
      },
      {
        path: 'packet-sticker-master',
        name: 'side-menu-packet-sticker-master',
        component: PacketStickerMaster,
        meta: { requiresPermission: 'bagStickerMaster' },
      },
      {
        path: "value-stream-master",
        name: "side-menu-value-stream-master",
        component: ValueStreamMaster,
        meta: { requiresPermission: 'valueStreamMaster' },
      },
      {
        path: "user-access-management",
        name: "side-menu-user-access-management",
        component: UserAccessManagement,
        meta: { requiresPermission: 'userAccessManagements' },
      },
      {
        path: "role-access-management",
        name: "side-menu-role-access-management",
        component: RoleAccessManagement,
        meta: { requiresPermission: 'roleAccessManagements' },
      },
      {
        path: "machine-location-master",
        name: "side-menu-machine-location-master",
        component: MachineLocationMaster,
        meta: { requiresPermission: 'machineLocationMaster' },
      },
      {
        path: "machine-job",
        name: "side-menu-machine-job",
        component: MachineJob,
        meta: { requiresPermission: 'machineStationJobs' },
      },
      {
        path: "user-master",
        name: "side-menu-user-master",
        component: UserMaster,
        meta: { requiresPermission: 'admin' },
      },
      {
        path: "powder-master",
        name: "side-menu-powder-master",
        component: PowerMaster,
        meta: { requiresPermission: 'powderMaster' },
      },
      {
        path: "chemical-job",
        name: "side-menu-chemical-job",
        component: ChemicalJob,
        meta: { requiresPermission: 'chemicalTreatmentJobs' },
      },
      {
        path: "profile",
        name: "side-menu-profile",
        component: Profile,
      },

    ],
  },
  {
    path: '/good-receiving',
    component: GoodReceivingMenu,
    children: [
      {
        path: 'good-receiving',
        name: 'good-receiving-menu-good-receiving',
        component: GoodReceiving,
      },
    ],
  },
  {
    path: '/warehouse',
    component: WarehouseMenu,
    children: [
      {
        path: 'warehouse',
        name: 'warehouse-menu-warehouse',
        component: Warehouse,
        // meta: { requiresAuth: true, requiresRole: 'whuser' }
      },
    ],
  },
  {
    path: '/quality-check',
    component: QualityCheckMenu,
    children: [
      {
        path: 'quality-check',
        name: 'quality-check-menu-quality-check',
        component: QualityCheck,
        // meta: { requiresAuth: true, requiresRole: 'qcuser' }
      },
    ],
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
  },
  {
    path: '/test',
    name: 'test',
    component: test,
  },
  {
    path: '/forget-password',
    name: 'forget-password',
    component: ForgetPassword,
  },
  {
    path: '/change-password',
    name: 'change-password',
    component: ChangePassword,
  },
  {
    path: '/user-registration',
    name: 'user-registration',
    component: UserRegistration,
  },
  {
    path: '/register',
    name: 'register',
    component: Register,
  },
  {
    path: '/error-page',
    name: 'error-page',
    component: ErrorPage,
  },
  {
    path: '/:pathMatch(.*)*',
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

interface UserPermissions {
  admin: string;
  goodsReceiving: string;
  plasmaTreatmentJob: string;
  dedustingJob: string;
  deburringJob: string;
  wetTreatmentJob: string;
  goodsReceive: string;
  binHolding: string;
  planning: string;
  qualityCheck: string;
  blending: string;
  machineStation_Production: string;
  qcInspection: string;
  postProductionChemicalTreatment: string;
  postProductionBlow: string;
  packing: string;
  packageHolding: string;
  userAccessManagements: string;
  roleAccessManagements: string;
  roleMaster: string;
  locationMaster: string;
  shiftMaster: string;
  vendorMaster: string;
  movementMaster: string;
  machineMaster: string;
  machineTypeMaster: string;
  machineLocationMaster: string;
  platformMaster: string;
  partNumberMaster: string;
  powderMaster: string;
  productGroupMaster: string;
  binMaster: string;
  cartonMaster: string;
  cartonStickerMaster: string;
  bagMaster: string;
  bagStickerMaster: string;
  valueStreamMaster: string;
  holdingBagMaster: string;
  warehouse: string;
  warehouseRequest: string;
  blendingJobs: string;
  machineStationJobs: string;
  inProcessQualityCheck: string;
  chemicalTreatmentJobs: string;
  blowerJobs: string;
  outgoingQualityCheck: string;
  packingJob: string;
  secondaryProcess: string;
}



const userPermissions: UserPermissions = reactive({
  admin: '',
  goodsReceiving: '',
  plasmaTreatmentJob: '',
  dedustingJob: '',
  deburringJob: '',
  wetTreatmentJob: '',
  goodsReceive: '',
  binHolding: '',
  planning: '',
  qualityCheck: '',
  blending: '',
  machineStation_Production: '',
  qcInspection: '',
  postProductionChemicalTreatment: '',
  postProductionBlow: '',
  packing: '',
  packageHolding: '',
  userAccessManagements: '',
  roleAccessManagements: '',
  roleMaster: '',
  locationMaster: '',
  shiftMaster: '',
  vendorMaster: '',
  movementMaster: '',
  machineMaster: '',
  machineTypeMaster: '',
  machineLocationMaster: '',
  platformMaster: '',
  partNumberMaster: '',
  powderMaster: '',
  productGroupMaster: '',
  binMaster: '',
  cartonMaster: '',
  cartonStickerMaster: '',
  bagMaster: '',
  bagStickerMaster: '',
  valueStreamMaster: '',
  holdingBagMaster: '',
  warehouse: '',
  warehouseRequest: '',
  blendingJobs: '',
  machineStationJobs: '',
  inProcessQualityCheck: '',
  chemicalTreatmentJobs: '',
  blowerJobs: '',
  outgoingQualityCheck: '',
  packingJob: '',
  secondaryProcess: ''
});


const fetchUserPermissions = async (userId: string) => {
  try {
    const response = await axios.get('http://10.87.0.33:8082/api/UserAccessManagement');
    if (response.data.statusCode === 200) {
      const user = response.data.result.find((user: any) => user.userId === userId);
      if (user) {
        Object.assign(userPermissions, user);
      }
    }
  } catch (error) {
    console.error('Error fetching user permissions:', error);
  }
};

const publicRoutes = [
  '/login',
  '/test',
  '/forget-password',
  '/change-password',
  '/user-registration',
  '/register',
  '/error-page',
  '/:pathMatch(.*)*',
];

router.beforeEach(async (to, from, next) => {
  const logoutPages = [
    '/forget-password',
    '/change-password',
    '/user-registration',
    '/login',
  ];

  if (logoutPages.includes(to.path)) {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    return next();
  }

  // Allow public routes
  if (publicRoutes.includes(to.path)) {
    return next();
  }

  const userId = localStorage.getItem('userId');

  if (userId) {
    await fetchUserPermissions(userId);

    if (to.meta.requiresPermission) {
      const requiredPermission = to.meta.requiresPermission as keyof UserPermissions;
      const userPermission = userPermissions[requiredPermission];

      if (!userPermission || userPermission === 'Delete') {
        return next('/error-page');
      }
    }
    next();
  } else {
    if (to.path !== '/login') {
      return next('/login');
    }
    next();
  }
});

export default router;