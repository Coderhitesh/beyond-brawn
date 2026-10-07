'use client';
import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { Guard } from '@/components/admin/AdminShell';
import { Btn, ErrorBox, Loading, PageTitle } from '@/components/admin/ui';
import { useAdmin } from '@/context/AdminAuthContext';
import { useToast } from '@/context/ToastContext';
import useFetch from '@/hooks/useFetch';
import { adminApi } from '@/services/admin';

function Templates() {
  const toast = useToast();
  const { admin, can } = useAdmin();
  const { data, loading, error, reload } = useFetch(() => adminApi('/email-templates'));
  const [key, setKey] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('');
  const [busy, setBusy] = useState('');

  const templates = data ? data.templates : [];
  const current = templates.find((t) => t.key === key) || templates[0];
  const currentKey = current ? current.key : null;

  useEffect(() => {
    if (!currentKey) return;
    setPreview(null);
    setSubject(current.subjectOverride || '');
    adminApi(`/email-templates/${currentKey}/preview`).then((r) => setPreview(r.data)).catch((e) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey, data]);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const saveSubject = async () => {
    setBusy('save');
    try {
      const overrides = Object.fromEntries(templates.map((t) => [t.key, t.key === currentKey ? subject.trim() : t.subjectOverride]).filter(([, s]) => s).map(([k, s]) => [k, { subject: s }]));
      await adminApi('/settings/emailTemplates', { method: 'PUT', body: overrides });
      toast.success('Subject saved');
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };
  const sendTest = async () => {
    setBusy('test');
    try {
      toast.success((await adminApi(`/email-templates/${currentKey}/test`, { method: 'POST' })).message);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageTitle title="Email templates" text="Emails the store sends automatically. Previews use sample data." crumbs={[{ label: 'Marketing' }, { label: 'Email templates' }]} />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <ul className="acard self-start">
          {templates.map((t) => (
            <li key={t.key} className="border-b border-line last:border-b-0">
              <button type="button" onClick={() => setKey(t.key)} aria-current={t.key === currentKey} className={`block w-full cursor-pointer px-3 py-2.5 text-left text-sm font-semibold ${t.key === currentKey ? 'bg-black text-white' : 'hover:bg-bone'}`}>
                {t.label}
                {t.subjectOverride && <span className={`block text-xs font-normal ${t.key === currentKey ? 'text-lime' : 'text-mute'}`}>Custom subject</span>}
              </button>
            </li>
          ))}
        </ul>
        {current && (
          <div className="min-w-0 space-y-3">
            <div className="acard p-4">
              <label htmlFor="tpl-subject" className="alabel">Subject line</label>
              <div className="flex flex-wrap gap-2">
                <input id="tpl-subject" className="ainput min-w-0 flex-1" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={current.defaultSubject} disabled={!can('settings.manage')} maxLength={150} />
                {can('settings.manage') && <Btn loading={busy === 'save'} onClick={saveSubject}>Save subject</Btn>}
                <Btn variant="ghost" loading={busy === 'test'} onClick={sendTest}><Send className="size-4" aria-hidden />Send test to {admin.email}</Btn>
              </div>
              <p className="ahint">Leave empty to use the default. You can use {'{{orderNumber}}'} and {'{{otp}}'} where they apply.{!can('settings.manage') ? ' Changing subjects needs the Settings permission.' : ''}</p>
            </div>
            <div className="acard">
              {preview ? <iframe title={`Preview of ${current.label}`} srcDoc={preview.html} sandbox="" className="h-[680px] w-full bg-bone" /> : <Loading />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Guard perms={['marketing.manage', 'settings.manage']}>
      <Templates />
    </Guard>
  );
}
