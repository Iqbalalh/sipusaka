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
  BarChart,
  Bar,
} from "recharts";
import dayjs from "dayjs";

interface ChildAssistance {
  id: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceAmount: number;
}

interface ChildAssistanceChartsProps {
  assistance: ChildAssistance[];
}

export default function ChildAssistanceCharts({ assistance }: ChildAssistanceChartsProps) {
  if (assistance.length === 0) return null;

  // Sort by date for charts
  const sortedAssistance = [...assistance].sort((a, b) => 
    new Date(a.assistanceDate).getTime() - new Date(b.assistanceDate).getTime()
  );

  // Prepare data for assistance trend chart
  const trendData = sortedAssistance.map(a => ({
    name: dayjs(a.assistanceDate).format("DD MMM YYYY"),
    nominal: a.assistanceAmount,
    type: a.assistanceType,
  }));

  // Prepare data for assistance by type chart
  const typeData = assistance.reduce((acc, curr) => {
    const existing = acc.find(item => item.type === curr.assistanceType);
    if (existing) {
      existing.total += curr.assistanceAmount;
      existing.count += 1;
    } else {
      acc.push({
        type: curr.assistanceType,
        total: curr.assistanceAmount,
        count: 1,
      });
    }
    return acc;
  }, [] as { type: string; total: number; count: number }[]);

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Grafik Bantuan Anak
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assistance Amount Trend */}
        <Card
          title="Tren Nominal Bantuan"
          className="border-emerald-200 dark:border-emerald-800"
          styles={{
            header: { backgroundColor: 'rgba(16, 185, 129, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? `Rp${value.toLocaleString('id-ID')}` : ''}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="nominal"
                stroke="#10b981"
                strokeWidth={2}
                name="Nominal Bantuan"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Assistance by Type */}
        <Card
          title="Bantuan Berdasarkan Jenis"
          className="border-blue-200 dark:border-blue-800"
          styles={{
            header: { backgroundColor: 'rgba(59, 130, 246, 0.1)' }
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip
                formatter={(value: number | undefined) => value !== undefined ? `Rp${value.toLocaleString('id-ID')}` : ''}
              />
              <Legend />
              <Bar
                dataKey="total"
                fill="#3b82f6"
                name="Total Nominal"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}