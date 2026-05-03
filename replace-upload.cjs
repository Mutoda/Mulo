const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const oldFn = `  const fakeUpload = (setter, name, size) => {
    setTimeout(() => setter({ name, size }), 600);
  };
  const ready = payslip && address;
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => go("loan-sign"), 1200);
  };`;

const newFn = `  const uploadFile = async (file, docType, setter) => {
    if (!file) return;
    try {
      const res = await fetch(API + '/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_number: window._muloIdNumber || 'demo', doc_type: docType, file_name: file.name, content_type: file.type })
      });
      const data = await res.json();
      await fetch(data.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      setter({ name: file.name, size: Math.round(file.size/1024) + ' KB' });
    } catch(err) { console.error('Upload failed', err); }
  };
  const ready = payslip && address;
  const submit = () => {
    setSubmitting(true);
    setTimeout(() => go("loan-sign"), 1200);
  };`;

if (!code.includes('fakeUpload')) { console.log('NOT FOUND'); process.exit(1); }
code = code.replace(oldFn, newFn);

// Replace payslip upload zone onClick
code = code.replace(
  `onClick={() => fakeUpload(setPayslip, "Payslip_March2026.pdf", "284 KB")}`,
  `onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.pdf,.jpg,.jpeg,.png'; i.onchange=e=>uploadFile(e.target.files[0],'payslip',setPayslip); i.click(); }}`
);

// Replace address upload zone onClick
code = code.replace(
  `onClick={() => fakeUpload(setAddress, "BankStatement_March2026.pdf", "512 KB")}`,
  `onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='.pdf,.jpg,.jpeg,.png'; i.onchange=e=>uploadFile(e.target.files[0],'proof_of_address',setAddress); i.click(); }}`
);

fs.writeFileSync('src/App.jsx', code);
console.log('SUCCESS');
