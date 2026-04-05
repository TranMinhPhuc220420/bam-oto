import { Card, Col, Progress, Row, Statistic, Typography } from 'antd'

export function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <Typography.Title level={2} className="mb-2 text-slate-900">
          Finance
        </Typography.Title>
        <Typography.Paragraph className="mb-0 text-slate-600">
          Finance data is protected behind authentication and ready for transaction collection
          integration.
        </Typography.Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card className="rounded-[24px] border-0 shadow-sm">
            <Statistic prefix="VND" title="Revenue this month" value={186000000} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-[24px] border-0 shadow-sm">
            <Statistic prefix="VND" title="Outstanding deposits" value={42000000} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card className="rounded-[24px] border-0 shadow-sm">
            <Statistic title="Invoices issued" value={36} />
          </Card>
        </Col>
      </Row>

      <Card className="rounded-[28px] border-0 shadow-sm">
        <Typography.Title level={4}>Collection progress</Typography.Title>
        <Progress percent={78} strokeColor="#0f766e" />
      </Card>
    </div>
  )
}
