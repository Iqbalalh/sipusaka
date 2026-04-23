# sipusaka — TypeScript Conventions

> Dokumen ini memperluas [../CONVENTIONS.md](../CONVENTIONS.md). Semua aturan di root berlaku. Bagian ini hanya mendokumentasikan aturan tambahan dan penyesuaian spesifik untuk project Next.js admin dashboard ini.

---

## 1. Migrasi ESLint ke Flat Config

sipusaka masih menggunakan format legacy `.eslintrc.json`. Migrasikan ke flat config `eslint.config.mjs` agar konsisten dengan citrapusaka dan geopusaka:

**Langkah-langkah:**

1. Hapus `.eslintrc.json`
2. Buat `eslint.config.mjs`:

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "no-duplicate-imports": "error",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "out/", "build/", "next-env.d.ts"],
  },
];

export default eslintConfig;
```

3. Install dependency jika belum ada:
```bash
npm install --save-dev @eslint/eslintrc
```

---

## 2. Path Alias

Selalu gunakan `@/` alias. Dilarang menggunakan `../../` chains.

```typescript
// BENAR
import { API_CHILDREN } from "@/constants/endpoint";
import { BaseChildren } from "@/types/models/children";
import { apiClient } from "@/utils/fetch/apiClient";

// SALAH
import { apiClient } from "../../../utils/fetch/apiClient";
```

`@/` sudah dikonfigurasi di `tsconfig.json` → `"paths": { "@/*": ["./src/*"] }`.

---

## 3. Service Layer Rule

Hanya file di `src/utils/services/` yang boleh memanggil `apiClient` atau `fetchWithAuth`. Component dan module harus memanggil fungsi service, bukan fetch langsung.

```typescript
// BENAR: component memanggil service function
// components/modules/children/children-table.tsx
import { getChildrenList } from "@/utils/services/children.service";

const data = await getChildrenList({ page: 1, limit: 10 });

// SALAH: component memanggil apiClient langsung
import { apiClient } from "@/utils/fetch/apiClient";
const response = await apiClient.get("/children"); // hindari di component
```

Pola ini mencegah duplikasi logika fetch dan memudahkan mocking saat testing.

---

## 4. Lazy Loading untuk Heavy Dependencies

Package berat harus di-lazy load untuk menghindari bundle size yang besar dan error SSR:

```typescript
import dynamic from "next/dynamic";

// WAJIB: Semua library yang butuh window/DOM harus ssr: false
const FullCalendar = dynamic(() => import("@fullcalendar/react"), { ssr: false });
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
const PDFViewer = dynamic(() => import("@react-pdf-viewer/core").then(m => m.Viewer), {
  ssr: false,
});

// Library pemrosesan dokumen: jspdf, docx, exceljs, html2canvas
// Lazy import di dalam fungsi handler jika hanya dibutuhkan saat action
const handleExportPDF = async () => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  // ...
};
```

---

## 5. Ant Design

```typescript
// BENAR: import per-component untuk tree-shaking
import Button from "antd/es/button";
import Table from "antd/es/table";
import type { TableColumnsType } from "antd/es/table";

// SALAH: import dari root antd (mengimpor seluruh bundle)
import { Button, Table } from "antd"; // hindari
```

Jangan import stylesheet Ant Design global (`import 'antd/dist/reset.css'`) kecuali diperlukan. Ant Design v5+ sudah CSS-in-JS.

---

## 6. Context Pattern

Context yang sudah ada (`SidebarContext`, `ThemeContext`) menunjukkan pola yang benar:

```typescript
// BENAR: interface untuk context type (bukan type alias)
interface SidebarContextType {
  isExpanded: boolean;
  isMobileOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// WAJIB: custom hook dengan guard
export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar harus digunakan di dalam SidebarProvider");
  }
  return context;
};
```

---

## 7. next-auth Session

```typescript
// BENAR: gunakan useSession dari next-auth/react di client components
"use client";
import { useSession } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <Spinner />;
  if (!session) return null;
  
  return <div>{session.user?.name}</div>;
}

// BENAR: gunakan getServerSession di Server Components / Route Handlers
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  return session.user;
}
```

---

## 8. Form Handling

sipusaka memiliki `useFormSubmit` hook. Gunakan dengan generic untuk menghindari `any`:

```typescript
// BENAR: generic untuk onSuccess callback
const { handleSubmit, isLoading } = useFormSubmit<ChildrenFormData>(
  async (formData) => {
    return fetch(API_CHILDREN, { method: "POST", body: formData });
  },
  (data) => {
    // data bertipe ChildrenFormData, bukan any
    toast.success(`Anak ${data.childrenName} berhasil ditambahkan`);
  }
);
```

---

## 9. Tipe Model

Definisikan semua interface model di `src/types/models/`:

```typescript
// src/types/models/children.ts
interface BaseChildren {
  childrenName: string;
  birthDate: string;
  gender: "M" | "F";
  homeId: number;
}

interface Children extends BaseChildren {
  id: number;
  createdAt: string;
  updatedAt: string;
}

type CreateChildrenInput = Omit<Children, "id" | "createdAt" | "updatedAt">;
type UpdateChildrenInput = Partial<CreateChildrenInput> & { id: number };

export type { BaseChildren, Children, CreateChildrenInput, UpdateChildrenInput };
```

---

## 10. `use client` Boundary

Push boundary `"use client"` serendah mungkin untuk memaksimalkan Server Components:

```typescript
// KURANG OPTIMAL: seluruh halaman jadi client component
"use client";
export default function ChildrenPage() {
  const [filter, setFilter] = useState(""); // hanya ini yang butuh client
  return (
    <div>
      <PageHeader /> {/* tidak butuh "use client" */}
      <FilterInput value={filter} onChange={setFilter} />
      <ChildrenTable /> {/* tidak butuh "use client" */}
    </div>
  );
}

// LEBIH BAIK: hanya FilterInput yang jadi client component
// pages/children/page.tsx — Server Component (tanpa "use client")
export default function ChildrenPage() {
  return (
    <div>
      <PageHeader />
      <FilterInput /> {/* "use client" ada di dalam FilterInput.tsx */}
      <ChildrenTable />
    </div>
  );
}
```

---

## 11. Struktur Folder

```
src/
├── app/
│   ├── (admin)/              # Route group untuk admin pages
│   │   ├── children/
│   │   │   ├── page.tsx      # Server Component — data fetching
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/edit/
│   │   │       └── page.tsx
│   │   └── layout.tsx
│   ├── api/                  # API Route Handlers
│   │   └── auth/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── common/               # PageBreadCrumb, ComponentCard, ChartTab
│   ├── ui/                   # Button, Modal, Input — pure UI primitives
│   ├── form/                 # Form-specific inputs
│   └── auth/                 # SignInForm, SignUpForm
├── modules/                  # Feature-specific component groups
│   ├── children/             # children-table.tsx, children-form.tsx
│   └── employee/
├── hooks/                    # Custom hooks (use*.ts)
├── types/
│   ├── models/               # BaseChildren, Employee, dll.
│   └── generic/              # ApiError, ApiResponse, dll.
├── utils/
│   ├── fetch/                # apiClient, fetchWithAuth
│   ├── services/             # Semua API call wrappers (children.service.ts)
│   └── formatter/
├── constants/                # API_ENDPOINTS, GENDER_OPTIONS, dll.
└── context/                  # SidebarContext, ThemeContext
```
