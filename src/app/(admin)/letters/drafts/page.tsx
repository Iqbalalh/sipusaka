'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Space, Typography, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Letter, User } from '@/types/models/letter';
import { getDraftLetters, getUsers } from '@/utils/services/letter.service';
import { getDraftLetterColumns } from '@/modules/letters/letters.columns';
import LettersTable from '@/modules/letters/letters.table';

const { Title } = Typography;

export default function DraftLettersPage() {
  const router = useRouter();
  const [data, setData] = useState<Letter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [lettersData, usersData] = await Promise.all([
        getDraftLetters(),
        getUsers(),
      ]);
      setData(lettersData);
      setUsers(usersData);
      setPagination((prev) => ({ ...prev, total: lettersData.length }));
    } catch (error) {
      message.error('Gagal memuat data surat');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = getDraftLetterColumns(users);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={4} style={{ margin: 0 }}>
            Daftar Draft Surat
          </Title>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/letters/drafts/create')}
            >
              Buat Surat Baru
            </Button>
          </Space>
        </div>
        <LettersTable
          columns={columns}
          data={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          onRefresh={fetchData}
        />
      </Card>
    </div>
  );
}
