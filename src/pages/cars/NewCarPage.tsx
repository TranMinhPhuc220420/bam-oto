import React, { useState } from 'react';
import { App, Button, Card, Typography } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { CarForm } from '../../components/cars/CarForm';
import { Car } from '../../types/Car';

const { Title } = Typography;

function buildCarPayload(values: Partial<Car>): Partial<Car> {
  return Object.fromEntries(
    Object.entries({
      ...values,
      brand: values.brand?.trim() || undefined,
      model: values.model?.trim() || undefined,
      images: values.images ?? [],
      note: values.note?.trim() || undefined,
    }).filter(([, value]) => value !== undefined)
  ) as Partial<Car>;
}

export function NewCarPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { message } = App.useApp();

  const handleSubmit = async (values: Partial<Car>) => {
    setLoading(true);
    try {
      const newCar: Partial<Car> = {
        ...buildCarPayload(values),
        everRented: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'cars'), newCar);
      message.success(t('cars.create.success'));
      navigate('/cars');
    } catch (error) {
      console.error('Error adding car:', error);
      message.error(t('cars.create.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button 
          icon={<LeftOutlined />} 
          type="text" 
          onClick={() => navigate('/cars')}
        >
          {t('cars.create.back')}
        </Button>
        <Title level={2} className="mb-0 text-slate-900 !mt-0">
          {t('cars.create.title')}
        </Title>
      </div>

      <Card className="rounded-[28px] border-0 shadow-sm p-4">
        <CarForm onSubmit={handleSubmit} isLoading={loading} />
      </Card>
    </div>
  );
}