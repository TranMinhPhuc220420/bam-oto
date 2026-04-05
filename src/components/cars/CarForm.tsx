import React, { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { BrandForm, type BrandFormValues } from '../brands/BrandForm';
import { ModelForm, type ModelFormValues } from '../models/ModelForm';
import { CarImageUpload } from './CarImageUpload';
import { BrandSelector } from './BrandSelector';
import { ModelSelector } from './ModelSelector';
import { useCarBrands } from '../../hooks/useCarBrands';
import { isCatalogDuplicateError, saveCarBrand, saveCarModel } from '../../services/carCatalog';
import { Car } from '../../types/Car';
import { CarBrand } from '../../types/Brand';
import { CarModel } from '../../types/Model';

interface CarFormProps {
  initialValues?: Partial<Car>;
  onSubmit: (values: Partial<Car>) => void;
  isLoading?: boolean;
}

export const CarForm: React.FC<CarFormProps> = ({ initialValues, onSubmit, isLoading = false }) => {
  const [form] = Form.useForm<Partial<Car>>();
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { brands } = useCarBrands({ includeInactive: true });
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [catalogSaving, setCatalogSaving] = useState(false);
  const selectedBrandId = Form.useWatch('brandId', form);
  const selectedBrandName = useMemo(
    () => brands.find((brand) => brand.id === selectedBrandId)?.name,
    [brands, selectedBrandId]
  );

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        brandId: initialValues.brandId,
        modelId: initialValues.modelId,
        brand: initialValues.brand,
        model: initialValues.model,
      });
    }
  }, [initialValues, form]);

  const handleBrandRecordChange = (brand: CarBrand | null) => {
    form.setFieldValue('brandId', brand?.id);
    form.setFieldValue('brand', brand?.name);
    form.setFieldValue('modelId', undefined);
    form.setFieldValue('model', undefined);
  };

  const handleModelRecordChange = (model: CarModel | null) => {
    form.setFieldValue('modelId', model?.id);
    form.setFieldValue('model', model?.name);
  };

  const handleCreateBrand = async (values: BrandFormValues) => {
    setCatalogSaving(true);

    try {
      const savedBrand = await saveCarBrand(values);

      form.setFieldsValue({
        brandId: savedBrand.id,
        brand: savedBrand.name,
        modelId: undefined,
        model: undefined,
      });

      message.success(t('cars.form.brandCreatedSelected', { value: savedBrand.name }));
      setIsBrandModalOpen(false);
    } catch (error) {
      console.error('Error creating brand from car form:', error);
      message.error(
        isCatalogDuplicateError(error, 'catalog/brand-duplicate')
          ? t('brands.messages.duplicate')
          : t('brands.messages.saveError')
      );
    } finally {
      setCatalogSaving(false);
    }
  };

  const handleCreateModel = async (values: ModelFormValues) => {
    setCatalogSaving(true);

    try {
      const savedModel = await saveCarModel(values);
      const nextBrandName =
        brands.find((brand) => brand.id === values.brandId)?.name ??
        selectedBrandName ??
        form.getFieldValue('brand');

      form.setFieldsValue({
        brandId: values.brandId,
        brand: nextBrandName,
        modelId: savedModel.id,
        model: savedModel.name,
      });

      message.success(t('cars.form.modelCreatedSelected', { value: savedModel.name }));
      setIsModelModalOpen(false);
    } catch (error) {
      console.error('Error creating model from car form:', error);
      message.error(
        isCatalogDuplicateError(error, 'catalog/model-duplicate')
          ? t('models.messages.duplicate')
          : t('models.messages.saveError')
      );
    } finally {
      setCatalogSaving(false);
    }
  };

  const onFinish = (values: Partial<Car>) => {
    onSubmit(values);
  };

  const brandExtra = (
    <div className="flex flex-col items-start gap-1">
      {initialValues?.brand && !initialValues.brandId ? (
        <span>{t('cars.form.currentBrand', { value: initialValues.brand })}</span>
      ) : null}
      <Button
        type="link"
        icon={<PlusOutlined />}
        className="px-0"
        onClick={() => setIsBrandModalOpen(true)}
      >
        {t('cars.form.addBrandAction')}
      </Button>
    </div>
  );

  const modelExtra = (
    <div className="flex flex-col items-start gap-1">
      {initialValues?.model && !initialValues.modelId ? (
        <span>{t('cars.form.currentModel', { value: initialValues.model })}</span>
      ) : null}
      <Button
        type="link"
        icon={<PlusOutlined />}
        className="px-0"
        onClick={() => setIsModelModalOpen(true)}
        disabled={!brands.length}
      >
        {t('cars.form.addModelAction')}
      </Button>
      {!brands.length ? <span>{t('cars.form.noBrandsYet')}</span> : null}
    </div>
  );

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ everRented: false, status: 'available', images: [], note: '', ...initialValues }}
      >
        <Form.Item
          name="plateNumber"
          label={t('cars.form.plateNumber')}
          rules={[{ required: true, message: t('cars.form.validation.plateNumber') }]}
        >
          <Input disabled={initialValues?.everRented} placeholder={t('cars.form.plateNumberPlaceholder')} />
        </Form.Item>

        <Form.Item name="brand" hidden>
          <Input />
        </Form.Item>

        <Form.Item name="model" hidden>
          <Input />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="brandId"
            label={t('cars.form.brand')}
            rules={[{ required: true, message: t('cars.form.validation.brand') }]}
            extra={brandExtra}
          >
            <BrandSelector onBrandRecordChange={handleBrandRecordChange} />
          </Form.Item>

          <Form.Item
            name="modelId"
            label={t('cars.form.model')}
            rules={[{ required: true, message: t('cars.form.validation.model') }]}
            extra={modelExtra}
          >
            <ModelSelector brandId={selectedBrandId} onModelRecordChange={handleModelRecordChange} />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="fuelType"
            label={t('cars.form.fuelType')}
            rules={[{ required: true, message: t('cars.form.validation.fuelType') }]}
          >
            <Select placeholder={t('cars.form.fuelTypePlaceholder')}>
              <Select.Option value="Gas">{t('cars.list.fuel.gas')}</Select.Option>
              <Select.Option value="Electric">{t('cars.list.fuel.electric')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="color"
            label={t('cars.form.color')}
            rules={[{ required: true, message: t('cars.form.validation.color') }]}
          >
            <Input placeholder={t('cars.form.colorPlaceholder')} />
          </Form.Item>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="year"
            label={t('cars.form.year')}
            rules={[{ required: true, message: t('cars.form.validation.year') }]}
          >
            <InputNumber min={1900} max={new Date().getFullYear() + 1} className="w-full" />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('cars.form.status')}
            rules={[{ required: true, message: t('cars.form.validation.status') }]}
          >
            <Select placeholder={t('cars.form.statusPlaceholder')}>
              <Select.Option value="available">{t('cars.list.statusLabels.available')}</Select.Option>
              <Select.Option value="rented">{t('cars.list.statusLabels.rented')}</Select.Option>
              <Select.Option value="cleaning">{t('cars.list.statusLabels.cleaning')}</Select.Option>
              <Select.Option value="repair">{t('cars.list.statusLabels.repair')}</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="images"
          label={t('cars.form.images')}
        >
          <CarImageUpload />
        </Form.Item>

        <Form.Item
          name="note"
          label={t('cars.form.note')}
        >
          <Input.TextArea rows={4} placeholder={t('cars.form.notePlaceholder')} />
        </Form.Item>

        {initialValues && (
          <Form.Item name="everRented" label={t('cars.form.everRented')} valuePropName="checked">
            <Switch disabled />
          </Form.Item>
        )}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {initialValues ? t('cars.form.submitUpdate') : t('cars.form.submitCreate')}
          </Button>
        </Form.Item>
      </Form>

      <Modal
        open={isBrandModalOpen}
        title={t('cars.form.brandModalTitle')}
        onCancel={() => setIsBrandModalOpen(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <BrandForm
          onSubmit={(values) => {
            void handleCreateBrand(values);
          }}
          isLoading={catalogSaving}
        />
      </Modal>

      <Modal
        open={isModelModalOpen}
        title={t('cars.form.modelModalTitle')}
        onCancel={() => setIsModelModalOpen(false)}
        footer={null}
        destroyOnHidden
        centered
      >
        <ModelForm
          initialValues={{ brandId: selectedBrandId, isActive: true }}
          onSubmit={(values) => {
            void handleCreateModel(values);
          }}
          isLoading={catalogSaving}
        />
      </Modal>
    </>
  );
};
