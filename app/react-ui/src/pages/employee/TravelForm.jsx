import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { createTravel, updateTravel } from '../../api/travelApi';
import Header from '../../components/Header';

export default function TravelForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    travelType: 'Domestic', fromCountry: 'India', toCountry: '', fromCity: '', toCity: '',
    startDate: '', endDate: '', purpose: '', passportNumber: '', visaStatus: '', status: 'Planned'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetch(`/travel/Travels('${id}')`).then(r => r.json()).then(data => {
        setForm({
          travelType: data.travelType || 'Domestic', fromCountry: data.fromCountry || 'India',
          toCountry: data.toCountry || '', fromCity: data.fromCity || '', toCity: data.toCity || '',
          startDate: data.startDate || '', endDate: data.endDate || '', purpose: data.purpose || '',
          passportNumber: data.passportNumber || '', visaStatus: data.visaStatus || '', status: data.status || 'Planned'
        });
      });
    }
  }, [id]);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const isDomestic = form.travelType === 'Domestic';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) return alert('Please fill start and end dates');
    if (isDomestic && (!form.fromCity || !form.toCity)) return alert('Please fill from and to cities');
    if (!isDomestic && !form.toCountry) return alert('Please fill destination country');

    setSaving(true);
    const payload = {
      employee_ID: user.id, travelType: form.travelType,
      fromCountry: isDomestic ? 'India' : (form.fromCountry || 'India'),
      toCountry: isDomestic ? 'India' : form.toCountry,
      fromCity: isDomestic ? form.fromCity : '', toCity: isDomestic ? form.toCity : '',
      startDate: form.startDate, endDate: form.endDate, purpose: form.purpose,
      status: isEdit ? form.status : 'Planned',
      passportNumber: isDomestic ? '' : form.passportNumber, visaStatus: isDomestic ? '' : form.visaStatus,
    };

    if (isEdit) await updateTravel(id, payload);
    else await createTravel(payload);
    navigate('/my-travel');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={isEdit ? 'Edit Travel' : 'New Travel'} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/my-travel')} className="text-blue-600 text-sm mb-4 hover:underline">&larr; Back to My Travel</button>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Travel Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Travel Type</label>
            <div className="flex gap-4">
              {['Domestic', 'International'].map(t => (
                <label key={t} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer transition ${form.travelType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="radio" name="travelType" value={t} checked={form.travelType === t}
                    onChange={() => set('travelType', t)} className="hidden" />
                  <span className="text-sm font-medium">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditional Fields */}
          {isDomestic ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From City *</label>
                <input value={form.fromCity} onChange={e => set('fromCity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Mumbai" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To City *</label>
                <input value={form.toCity} onChange={e => set('toCity', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Bangalore" />
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Country</label>
                  <input value={form.fromCountry} onChange={e => set('fromCountry', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="India" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Country *</label>
                  <input value={form.toCountry} onChange={e => set('toCountry', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Singapore" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number</label>
                  <input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. A1234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visa Status</label>
                  <select value={form.visaStatus} onChange={e => set('visaStatus', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
                    <option value="">-- Select --</option>
                    <option>Have Visa</option><option>Need Visa</option><option>Applied</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <textarea value={form.purpose} onChange={e => set('purpose', e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="e.g. Business Meeting, Conference" />
          </div>

          {/* Status display for edit */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${form.status === 'Planned' ? 'bg-blue-100 text-blue-700' : form.status === 'Approved' ? 'bg-green-100 text-green-700' : form.status === 'Travelling' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{form.status}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => navigate('/my-travel')}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50">{saving ? 'Saving...' : isEdit ? 'Update' : 'Submit'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
