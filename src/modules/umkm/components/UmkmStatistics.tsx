import { BarChartOutlined, DollarOutlined, RiseOutlined } from "@ant-design/icons";

interface UmkmVisit {
  id: number;
  umkmId: number;
  visitNumber: number;
  assistanceDate: string;
  assistanceType: string;
  itemType: string;
  assistanceAmount: number;
  assistanceSource: string;
  value: number;
  notes?: string | null;
  umkmVisitDocs?: any[];
}

interface UmkmMonitoring {
  id: number;
  umkmId: number;
  visitNumber: number;
  monitoringDate: string;
  surveyor: string;
  turnoverBefore?: number | null;
  turnoverAfter?: number | null;
  workersBefore?: number | null;
  workersAfter?: number | null;
  productionBefore?: number | null;
  productionAfter?: number | null;
  customersBefore?: number | null;
  customersAfter?: number | null;
  benefitLevel?: string | null;
  challenges?: string | null;
  developmentNeeds?: string | null;
  otherNotes?: string | null;
  umkmMonitoringDocs?: any[];
}

interface UmkmStatisticsProps {
  visits: UmkmVisit[];
  monitoring: UmkmMonitoring[];
}

export default function UmkmStatistics({ visits, monitoring }: UmkmStatisticsProps) {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 mt-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Statistik UMKM
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Kunjungan Bantuan</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{visits.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-full flex items-center justify-center">
              <BarChartOutlined className="text-xl text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Nilai Bantuan</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                Rp{visits.reduce((sum, v) => sum + v.value, 0).toLocaleString("id-ID")}
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Monitoring</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{monitoring.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-800/30 rounded-full flex items-center justify-center">
              <BarChartOutlined className="text-xl text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        {/* <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Rata-rata Manfaat</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {monitoring.length > 0
                  ? (() => {
                      const benefitCounts = monitoring.reduce((acc, m) => {
                        if (m.benefitLevel) {
                          acc[m.benefitLevel] = (acc[m.benefitLevel] || 0) + 1;
                        }
                        return acc;
                      }, {} as Record<string, number>);
                      const mostCommon = Object.entries(benefitCounts).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined;
                      return mostCommon ? mostCommon[0].split(' ')[0] : '-';
                    })()
                  : '-'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-800/30 rounded-full flex items-center justify-center">
              <RiseOutlined className="text-xl text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}