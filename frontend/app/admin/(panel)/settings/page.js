'use client';
import { useEffect, useState } from 'react';
import { Guard } from '@/components/admin/AdminShell';
import FormFields from '@/components/admin/FormFields';
import { toForm, toPayload } from '@/components/admin/form-utils';
import { Badge, Btn, ErrorBox, Loading, PageTitle, Tabs } from '@/components/admin/ui';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';

const GROUPS = {
  general: {
    label: 'General',
    fields: [
      { name: 'siteName', label: 'Store name', required: true },
      { name: 'tagline', label: 'Tagline' },
      { name: 'logoUrl', label: 'Logo for white backgrounds (header)', type: 'image', folder: 'misc', hint: 'PNG with a transparent background works best. Leave empty to show the text wordmark.' },
      { name: 'logoDarkUrl', label: 'Logo for black backgrounds (footer, emails)', type: 'image', folder: 'misc' },
      { name: 'announcements', label: 'Announcement bar messages', type: 'list', hint: 'One per line. The first two are shown at the top of every page.' },
      { name: 'orderPrefix', label: 'Order number prefix', upper: true, hint: 'Orders look like BB-2026-000001' },
    ],
  },
  contact: {
    label: 'Contact information',
    fields: [
      { name: 'email', label: 'Support email', type: 'email', hint: 'Shown on the store. New-order and contact-form emails go here unless ADMIN_NOTIFY_EMAIL is set.' },
      { name: 'phone', label: 'Phone' },
      { name: 'whatsapp', label: 'WhatsApp number', placeholder: '+91 98xxxxxxxx' },
      { name: 'hours', label: 'Support hours' },
      { name: 'address', label: 'Business address', type: 'textarea', rows: 2, hint: 'Printed on invoices' },
      { name: 'gstin', label: 'GSTIN', upper: true },
      { name: 'fssai', label: 'FSSAI licence number' },
    ],
  },
  social: {
    label: 'Social media',
    fields: ['instagram', 'facebook', 'youtube', 'x', 'linkedin'].map((k) => ({ name: k, label: `${k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)} link`, type: 'url', placeholder: 'https://', full: true })),
  },
  shipping: {
    label: 'Shipping',
    fields: [
      { name: 'freeShippingThreshold', label: 'Free shipping above (₹)', type: 'number', hint: '0 turns free shipping off', full: true },
      { type: 'heading', label: 'Shipping methods' },
      {
        name: 'methods', label: 'Methods', type: 'rows', addLabel: 'Add shipping method',
        columns: [
          { name: 'code', label: 'Code', placeholder: 'standard', width: 110 }, { name: 'name', label: 'Name shown to customers', placeholder: 'Standard delivery' },
          { name: 'charge', label: 'Charge (₹)', type: 'number', width: 100 }, { name: 'minDays', label: 'Min days', type: 'number', width: 84 }, { name: 'maxDays', label: 'Max days', type: 'number', width: 84 },
          { name: 'freeEligible', label: 'Free above threshold', type: 'checkbox', width: 90 }, { name: 'isActive', label: 'Active', type: 'checkbox', width: 60 },
        ],
      },
      { type: 'heading', label: 'Where you deliver' },
      { name: 'pincodeMode', label: 'Delivery area', type: 'select', options: [{ value: 'all', label: 'All of India, except blocked pincodes' }, { value: 'allowlist', label: 'Only the pincodes listed below' }], full: true },
      { name: 'allowedPincodes', label: 'Allowed pincodes', type: 'list', hint: 'One per line', showIf: (f) => f.pincodeMode === 'allowlist' },
      { name: 'blockedPincodes', label: 'Blocked pincodes', type: 'list', hint: 'One per line' },
    ],
  },
  tax: {
    label: 'Tax',
    fields: [
      { name: 'inclusive', label: 'Product prices include GST', type: 'checkbox', full: true, hint: 'Recommended for India. When off, GST is added on top at checkout.' },
      { name: 'defaultGstRate', label: 'Default GST rate (%)', type: 'number', max: 40, hint: 'Used when a product has no rate of its own' },
    ],
  },
  payment: {
    label: 'Payment',
    fields: [
      { name: 'razorpayEnabled', label: 'Accept online payments (Razorpay)', type: 'checkbox', full: true, hint: 'Turning this off pauses checkout' },
      { name: 'pendingOrderExpiryMinutes', label: 'Hold stock for unpaid orders (minutes)', type: 'number', min: 5, hint: 'After this the stock goes back on sale' },
    ],
  },
  seo: {
    label: 'SEO',
    fields: [
      { name: 'defaultTitle', label: 'Homepage title', full: true },
      { name: 'titleTemplate', label: 'Title pattern for other pages', hint: '%s is replaced by the page name', full: true },
      { name: 'defaultDescription', label: 'Default description', type: 'textarea', rows: 2 },
      { name: 'keywords', label: 'Default keywords', full: true },
      { name: 'ogImage', label: 'Social sharing image (1200 x 630)', type: 'image', folder: 'misc' },
      { name: 'googleSiteVerification', label: 'Google Search Console verification code' },
      { name: 'gaMeasurementId', label: 'Google Analytics measurement ID', placeholder: 'G-XXXXXXXXXX' },
    ],
  },
  homepage: {
    label: 'Homepage',
    fields: [
      { type: 'heading', label: 'Hero (an active hero banner overrides the headline, text and image)' },
      { name: 'hero.headline', label: 'Headline', full: true },
      { name: 'hero.subheading', label: 'Subheading', type: 'textarea', rows: 2 },
      { name: 'hero.primaryCta.label', label: 'Main button text' }, { name: 'hero.primaryCta.href', label: 'Main button link' },
      { name: 'hero.secondaryCta.label', label: 'Second button text' }, { name: 'hero.secondaryCta.href', label: 'Second button link' },
      { name: 'hero.image', label: 'Background image', type: 'image', folder: 'banners' },
      { type: 'heading', label: 'Promotional strip' },
      { name: 'promo.headline', label: 'Headline', full: true },
      { name: 'promo.text', label: 'Text', type: 'textarea', rows: 2 },
      { name: 'promo.cta.label', label: 'Button text' }, { name: 'promo.cta.href', label: 'Button link' },
      { name: 'promo.image', label: 'Image', type: 'image', folder: 'banners' },
    ],
  },
  footer: {
    label: 'Footer',
    fields: [
      { name: 'about', label: 'About text', type: 'textarea', rows: 3 },
      { name: 'copyright', label: 'Copyright line', full: true, hint: 'The year is added automatically' },
    ],
  },
};

function Status({ ok, children }) {
  return (
    <li className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-sm last:border-b-0">
      <span>{children}</span>
      <Badge tone={ok ? 'green' : 'red'}>{ok ? 'Connected' : 'Not configured'}</Badge>
    </li>
  );
}

function SettingsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useFetch(() => adminApi('/settings'));
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const group = GROUPS[tab];

  useEffect(() => {
    if (data) setForm(toForm(group.fields, data.settings[tab]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, tab]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const int = data.integrations;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Keep keys this form does not edit (e.g. provider) by layering the form over the stored group.
      const res = await adminApi(`/settings/${tab}`, { method: 'PUT', body: { ...data.settings[tab], ...toPayload(group.fields, form) } });
      toast.success(`${res.message}. The store updates within two minutes.`);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  const testSmtp = async () => {
    setTesting(true);
    try {
      toast.success((await adminApi('/settings/smtp-test', { method: 'POST' })).message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <PageTitle title="Settings" crumbs={[{ label: 'Settings' }]} />
      <Tabs value={tab} onChange={setTab} tabs={Object.entries(GROUPS).map(([value, g]) => ({ value, label: g.label }))} />
      <form onSubmit={save} className="acard border-t-0 p-4 sm:p-5" noValidate>
        <div className="max-w-4xl">
          <FormFields fields={group.fields} form={form} onChange={setForm} />
          {tab === 'payment' && (
            <div className="mt-6">
              <h3 className="border-b border-black pb-1 text-sm font-bold">Connections</h3>
              <ul>
                <Status ok={int.razorpay.configured}>Razorpay{int.razorpay.configured ? ` (${int.razorpay.mode} mode, key ${int.razorpay.keyId})` : ''}</Status>
                <Status ok={int.razorpay.webhook}>Razorpay webhook secret</Status>
                <Status ok={int.smtp.configured}>Email (SMTP){int.smtp.configured ? `: ${int.smtp.host}` : ''}</Status>
                <Status ok={int.cloudinary.configured}>Cloudinary image storage</Status>
              </ul>
              <p className="ahint">Keys and passwords are kept in the server's .env file for security and cannot be edited here. Ask your developer to change them.</p>
              {int.smtp.configured && <Btn variant="ghost" size="sm" className="mt-2" loading={testing} onClick={testSmtp}>Test email connection</Btn>}
            </div>
          )}
          <div className="mt-6 border-t border-line pt-4">
            <Btn type="submit" variant="lime" loading={saving}>Save {group.label.toLowerCase()} settings</Btn>
          </div>
        </div>
      </form>
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['settings.manage']}>
      <SettingsPage />
    </Guard>
  );
}
