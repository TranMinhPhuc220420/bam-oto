import React, { useEffect, useState } from 'react';
import { App, Button, Card, Grid, Spin, Typography } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  ensureUniqueCarPlateNumber,
  isDuplicateCarPlateError,
} from '../../services/carService';
import { CarForm } from '../../components/cars/CarForm';
import { Car } from '../../types/Car';

const { Title } = Typography;

function buildCarPayload(values: Partial<Car>): Partial<Car> {
  return Object.fromEntries(
    Object.entries({
      ...values,
      plateNumber: values.plateNumber?.trim().toUpperCase() || undefined,
      brand: values.brand?.trim() || undefined,
      model: values.model?.trim() || undefined,
      images: values.images ?? [],
      note: values.note?.trim() || undefined,
    }).filter(([, value]) => value !== undefined)
  ) as Partial<Car>;
}

export function EditCarPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [car, setCar] = useState<Car | null>(null);
  const { t } = useTranslation();
  const { message } = App.useApp();
  const screen = Grid.useBreakpoint();
  const isMobile = screen.md === false;

  useEffect(() => {
    const fetchCar = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'cars', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCar({ id: docSnap.id, ...docSnap.data() } as Car);
        } else {
          message.error(t('cars.edit.notFound'));
          navigate('/cars');
        }
      } catch (error) {
        console.error('Error fetching car:', error);
        message.error(t('cars.edit.loadError'));
      } finally {
        setFetching(false);
      }
    };

    fetchCar();
  }, [id, message, navigate, t]);

  const handleSubmit = async (values: Partial<Car>) => {
    if (!id) return;
    setLoading(true);
    try {
      await ensureUniqueCarPlateNumber(values.plateNumber ?? car?.plateNumber ?? '', id);

      const docRef = doc(db, 'cars', id);
      await updateDoc(docRef, {
        ...buildCarPayload(values),
        updatedAt: serverTimestamp(),
      });
      message.success(t('cars.edit.success'));
      navigate('/cars');
    } catch (error) {
      console.error('Error updating car:', error);
      message.error(
        isDuplicateCarPlateError(error)
          ? t('cars.form.validation.duplicatePlateNumber')
          : t('cars.edit.error')
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="sm:mb-6 flex items-center space-x-4">
        <Button
          icon={<LeftOutlined />}
          type="text"
          onClick={() => navigate('/cars')}
        >
          {!isMobile && t('cars.create.back')}
        </Button>
        <Title level={isMobile ? 4 : 2} className="!mb-0 !mt-0 text-slate-900">
          {t('cars.edit.title')}
        </Title>
      </div>

      <Card className="rounded-[28px] border-0 shadow-sm p-4">
        {car && (
          <CarForm
            initialValues={car}
            onSubmit={handleSubmit}
            isLoading={loading}
          />
        )}
      </Card>
    </div>
  );
}