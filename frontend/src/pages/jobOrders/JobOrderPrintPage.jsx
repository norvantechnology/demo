import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';
import { Button, ErrorBanner } from '../../components/ui';

const FINISHING = [
  { key: 'lamination', en: 'Lamination', ar: 'تغليف' },
  { key: 'rope', en: 'Rope', ar: 'حبل' },
  { key: 'oneSide', en: 'One side', ar: 'وجه واحد' },
  { key: 'twoSide', en: 'Two side', ar: 'وجهين' },
  { key: 'digital', en: 'Digital', ar: 'ديجيتال' },
  { key: 'size50x70', en: '50×70', ar: '50×70' },
  { key: 'size100x70', en: '100×70', ar: '100×70' },
];

const ADDON_BOXES = [
  { key: 'goldStamping', en: 'Gold stamping', ar: 'طباعة ذهبية' },
  { key: 'embossing', en: 'Embossing', ar: 'نقش بارز' },
  { key: 'silkScreen', en: 'Silk screen', ar: 'سيلك سكرين' },
  { key: 'uv', en: 'UV', ar: 'UV' },
  { key: 'dieCut', en: 'Die cut', ar: 'قص' },
  { key: 'creasing', en: 'Creasing', ar: 'تجعيد' },
];

const COPY_KEYS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
const COPY_EN = ['1st Copy', '2nd Copy', '3rd Copy', '4th Copy', '5th Copy', '6th Copy'];
const COPY_AR = ['النسخة 1', 'النسخة 2', 'النسخة 3', 'النسخة 4', 'النسخة 5', 'النسخة 6'];

const RIGHT_FIELDS = [
  { key: 'numberingFrom', en: 'Numbering from', ar: 'الترقيم من' },
  { key: 'perforating', en: 'Perforating', ar: 'تثقيب' },
  { key: 'gumming', en: 'Gumming', ar: 'لصق' },
  { key: 'stitching', en: 'Stitching', ar: 'تجليد' },
  { key: 'coverNo', en: 'Cover No.', ar: 'رقم الغلاف' },
  { key: 'coverColour', en: 'Cover colour', ar: 'لون الغلاف' },
];

function BilingualRow({ en, ar, value }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 border-b border-gray-200 py-1.5 text-sm">
      <span className="text-start">{en}</span>
      <span className="min-w-[120px] text-center font-medium">{value || '-'}</span>
      <span className="text-end">{ar}</span>
    </div>
  );
}

function DetailFields({ jo }) {
  const rows = [
    { en: 'Customer', ar: 'العميل', value: jo.customer?.name },
    { en: 'Company', ar: 'الشركة', value: jo.customer?.company },
    { en: 'Tel', ar: 'هاتف', value: jo.customer?.phone },
    { en: 'Job nature', ar: 'نوع العمل', value: jo.jobNature },
    { en: 'Actual size', ar: 'الحجم الفعلي', value: jo.actualSize },
    { en: 'Printing size', ar: 'حجم الطباعة', value: jo.printingSize },
    { en: 'No. of copies', ar: 'عدد النسخ', value: jo.numberOfCopies },
    { en: 'Ink colour', ar: 'لون الحبر', value: jo.inkColour },
    { en: 'Printing qty', ar: 'كمية الطباعة', value: jo.printingQty },
    { en: 'Qty required', ar: 'الكمية المطلوبة', value: jo.qtyRequired },
    { en: 'Kind of paper', ar: 'نوع الورق', value: jo.kindOfPaper },
    { en: 'Paper size', ar: 'مقاس الورق', value: jo.paperSize },
  ];
  return (
    <div>
      {rows.map((r) => (
        <BilingualRow key={r.en} en={r.en} ar={r.ar} value={r.value} />
      ))}
    </div>
  );
}

export default function JobOrderPrintPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const q = useQuery({
    queryKey: ['job-order-print', id],
    queryFn: async () => (await api.get(`/job-orders/${id}/print`)).data,
  });

  if (q.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  if (q.isError) {
    return (
      <div className="p-6">
        <ErrorBanner onRetry={() => q.refetch()} />
      </div>
    );
  }

  const { jobOrder: jo, company } = q.data;

  return (
    <div className="min-h-screen bg-white text-black print:m-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { margin: 12mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print flex flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="secondary" className="w-full sm:w-auto" onClick={() => navigate(`/job-orders/${id}`)}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button className="w-full sm:w-auto" onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="mx-auto max-w-4xl p-6 print:p-0">
        {company?.arabicName ? (
          <div className="mb-4 text-center text-lg font-bold">{company.arabicName}</div>
        ) : null}

        <div className="mb-6 flex justify-between gap-4">
          <div>
            <div className="text-lg font-bold">{company?.name || 'A2Z Printing'}</div>
            <div className="text-sm">{company?.address}</div>
            <div className="text-sm">{company?.phone}</div>
          </div>
          <div className="rounded border-2 border-black px-4 py-2 text-end">
            <div className="font-bold">No. {jo.jobOrderNo}</div>
            <div className="text-sm">{formatDate(jo.date)}</div>
          </div>
        </div>

        <div className="mb-4 border-y border-black py-2 text-center font-semibold">
          Job Details / تفاصيل العمل
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <DetailFields jo={jo} />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {FINISHING.map(({ key, en, ar }) => (
            <div
              key={key}
              className="flex min-w-[90px] flex-col items-center rounded border border-gray-400 px-2 py-2 text-xs"
            >
              <div>{en}</div>
              <div>{ar}</div>
              <div className="mt-1 font-bold">{jo.options?.[key] ? '✓' : ''}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div>
            {COPY_KEYS.map((key, i) => (
              <BilingualRow
                key={key}
                en={COPY_EN[i]}
                ar={COPY_AR[i]}
                value={jo.copies?.[key]}
              />
            ))}
          </div>
          <div>
            {RIGHT_FIELDS.map(({ key, en, ar }) => (
              <BilingualRow key={key} en={en} ar={ar} value={jo[key]} />
            ))}
          </div>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-2 border border-gray-400 p-3">
              <div className="mb-1 flex justify-between text-xs">
                <span>Remarks</span>
                <span>ملاحظات</span>
              </div>
              <div className="min-h-[60px] text-sm">{jo.remarks || '-'}</div>
            </div>
            {jo.materials?.length ? (
              <div>
                <div className="mb-1 text-xs font-semibold">Materials / المواد</div>
                <ul className="text-sm">
                  {jo.materials.map((m, i) => (
                    <li key={i}>
                      {m.name} - {m.qty} {m.unit}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              {ADDON_BOXES.map(({ key, en, ar }) => (
                <div
                  key={key}
                  className="rounded border border-gray-400 px-2 py-1 text-xs"
                >
                  <div>{en}</div>
                  <div>{ar}</div>
                  <div className="font-medium">{jo[key] || '-'}</div>
                </div>
              ))}
            </div>
            <div className="mt-8 space-y-8">
              <div className="border-t border-gray-400 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Incharge</span>
                  <span>مسؤول</span>
                </div>
              </div>
              <div className="border-t border-gray-400 pt-2">
                <div className="flex justify-between text-sm">
                  <span>Manager</span>
                  <span>المدير</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-12 sm:grid-cols-2">
          <div className="border-t border-gray-400 pt-2">
            <div className="flex justify-between text-sm">
              <span>Receiver&apos;s Sign.</span>
              <span>توقيع المستلم</span>
            </div>
          </div>
          <div className="border-t border-gray-400 pt-2">
            <div className="flex justify-between text-sm">
              <span>Sales Signature</span>
              <span>توقيع المبيعات</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
