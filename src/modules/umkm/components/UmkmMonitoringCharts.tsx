import { Card } from "antd";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface UmkmMonitoring {
  id: number;
  visitNumber: number;
  turnoverBefore?: number | null;
  turnoverAfter?: number | null;
  workersBefore?: number | null;
  workersAfter?: number | null;
  productionBefore?: number | null;
  productionAfter?: number | null;
  customersBefore?: number | null;
  customersAfter?: number | null;
}

interface UmkmMonitoringChartsProps {
  monitoring: UmkmMonitoring[];
}

export default function UmkmMonitoringCharts({ monitoring }: UmkmMonitoringChartsProps) {
  if (monitoring.length === 0) return null;

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Grafik Monitoring
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Turnover Trend */}
        <Card
          title="Tren Omset"
          className="border-emerald-200 dark:border-emerald-800"
          styles={{
            header: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monitoring.map(m => ({
              name: `Kunjungan ${m.visitNumber}`,
              sebelum: m.turnoverBefore || 0,
              sesudah: m.turnoverAfter || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? `Rp${value.toLocaleString('id-ID')}` : ''}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sebelum"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Sebelum"
              />
              <Line
                type="monotone"
                dataKey="sesudah"
                stroke="#10b981"
                strokeWidth={2}
                name="Sesudah"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Workers Trend */}
        <Card
          title="Tren Tenaga Kerja"
          className="border-blue-200 dark:border-blue-800"
          styles={{
            header: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monitoring.map(m => ({
              name: `Kunjungan ${m.visitNumber}`,
              sebelum: m.workersBefore || 0,
              sesudah: m.workersAfter || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? `${value} orang` : ''}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sebelum"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Sebelum"
              />
              <Line
                type="monotone"
                dataKey="sesudah"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Sesudah"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Production Trend */}
        <Card
          title="Tren Produksi"
          className="border-amber-200 dark:border-amber-800"
          styles={{
            header: { backgroundColor: 'rgba(245, 158, 11, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monitoring.map(m => ({
              name: `Kunjungan ${m.visitNumber}`,
              sebelum: m.productionBefore || 0,
              sesudah: m.productionAfter || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? value.toLocaleString('id-ID') : ''}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sebelum"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Sebelum"
              />
              <Line
                type="monotone"
                dataKey="sesudah"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Sesudah"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Customers Trend */}
        <Card
          title="Tren Pelanggan"
          className="border-rose-200 dark:border-rose-800"
          styles={{
            header: { backgroundColor: 'rgba(244, 63, 94, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monitoring.map(m => ({
              name: `Kunjungan ${m.visitNumber}`,
              sebelum: m.customersBefore || 0,
              sesudah: m.customersAfter || 0,
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? `${value} orang` : ''}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="sebelum"
                stroke="#9ca3af"
                strokeWidth={2}
                name="Sebelum"
              />
              <Line
                type="monotone"
                dataKey="sesudah"
                stroke="#f43f5e"
                strokeWidth={2}
                name="Sesudah"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}