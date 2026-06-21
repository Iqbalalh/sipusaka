// const baseUrl = "http://localhost:9000";
const baseUrl = "https://api.yayasanpusakakai.org";

// Auth
export const API_AUTH_LOGIN = `${baseUrl}/api/auth/login`;
export const API_AUTH_CHANGE_CREDENTIALS = `${baseUrl}/api/auth/change-credentials`;
export const API_AUTH_AVATAR = `${baseUrl}/api/auth/avatar`;

// Homes
export const API_HOME = `${baseUrl}/api/homes`;
export const API_HOME_EXPORT = `${baseUrl}/api/homes/export`;
export const API_HOME_OPTIMIZED = `${baseUrl}/api/homes/optimized`;
export const API_HOME_SUMMARY = `${baseUrl}/api/homes/summary`;
export const API_HOME_SIBLING = (id: number | string) => `${baseUrl}/api/homes/${id}/sibling`;

// Regions
export const API_REGION = `${baseUrl}/api/regions`;
export const API_REGION_STATS = `${baseUrl}/api/regions/stats`;

// Employees
export const API_EMPLOYEE = `${baseUrl}/api/employees`;
export const API_EMPLOYEE_OPTIMIZED = `${baseUrl}/api/employees/optimized`;
export const API_EMPLOYEE_SUMMARY = `${baseUrl}/api/employees/summary`;

// Partners
export const API_PARTNER = `${baseUrl}/api/partners`;
export const API_PARTNER_OPTIMIZED = `${baseUrl}/api/partners/optimized`;
export const API_PARTNER_SUMMARY = `${baseUrl}/api/partners/summary`;

// Wali
export const API_WALI = `${baseUrl}/api/wali`;
export const API_WALI_OPTIMIZED = `${baseUrl}/api/wali/optimized`;
export const API_WALI_SUMMARY = `${baseUrl}/api/wali/summary`;

// Childrens
export const API_CHILDREN = `${baseUrl}/api/children`;

// UMKM
export const API_UMKM = `${baseUrl}/api/umkm`;
export const API_UMKM_OPTIMIZED = `${baseUrl}/api/umkm/optimized`;
export const API_UMKM_TABLE_SUMMARY = `${baseUrl}/api/umkm/summary`;

// Picture
export const API_DELETE_FILE = `${baseUrl}/api/picture/delete`;

// Dashboard
export const API_DASHBOARD = `${baseUrl}/api/dashboard`

// Staff
export const API_STAFF = `${baseUrl}/api/staff`;
export const API_STAFF_OPTIMIZED = `${baseUrl}/api/staff/optimized`;

// Image
export const API_IMAGE = `${baseUrl}/api/images`;

// Family Visits
export const API_FAMILY_VISIT = `${baseUrl}/api/family-visits`;

// UMKM Visits
export const API_UMKM_VISIT = `${baseUrl}/api/umkm-visits`;

// UMKM Monitoring
export const API_UMKM_MONITORING = `${baseUrl}/api/umkm-monitoring`;

// Child Assistance
export const API_CHILD_ASSISTANCE = `${baseUrl}/api/child-assistance`;
export const API_CHILD_ASSISTANCE_OPTIMIZED = `${baseUrl}/api/child-assistance/optimized`;

// Galleries
export const API_GALLERIES = `${baseUrl}/api/galleries`;

// Social Assistance
export const API_SOCIAL_ASSISTANCE = `${baseUrl}/api/social-assistance`;
export const API_SOCIAL_ASSISTANCE_OPTIMIZED = `${baseUrl}/api/social-assistance/optimized`;

// Users
export const API_USERS = `${baseUrl}/api/users`;

// Letters
export const API_LETTERS = `${baseUrl}/api/letters`;
export const API_LETTER_TYPES = `${baseUrl}/api/letter-types`;