import { BarChartOutlined, DollarOutlined } from "@ant-design/icons";

interface ChildAssistance {
  id: number;
  childrenId: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceProvider: string;
  assistanceAmount: number;
  notes?: string | null;
  childAssistanceDocs?: any[];
}

interface ChildAssistanceStatisticsProps {
  assistance: ChildAssistance[];
}

export default function ChildAssistanceStatistics({ assistance }: ChildAssistanceStatisticsProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Statistik Bantuan Anak
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Bantuan</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{assistance.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
              <BarChartOutlined className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nominal Bantuan</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Rp{assistance.reduce((sum, a) => sum + a.assistanceAmount, 0).toLocaleString("id-ID")}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-800/30 rounded-full flex items-center justify-center">
              <DollarOutlined className="text-xl text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rata-rata Nominal</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                Rp{assistance.length > 0 
                  ? (assistance.reduce((sum, a) => sum + a.assistanceAmount, 0) / assistance.length).toLocaleString("id-ID", { maximumFractionDigits: 0 })
                  : '0'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/30 rounded-full flex items-center justify-center">
              <BarChartOutlined className="text-xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}