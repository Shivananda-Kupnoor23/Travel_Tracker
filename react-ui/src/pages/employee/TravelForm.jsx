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

  const inputClass = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header title={isEdit ? 'Edit Travel' : 'New Travel Request'} />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/my-travel')} className="text-blue-600 text-sm mb-5 hover:underline flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          Back to My Travel
        </button>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                {isEdit ? '✏️' : '✈️'}
              </div>
              <div>
                <h2 className="text-lg font-bold">{isEdit ? 'Edit Travel Details' : 'New Travel Request'}</h2>
                <p className="text-blue-100 text-xs">Fill in your travel details below</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Travel Type */}
            <div>
              <label className={labelClass}>Travel Type</label>
              <div className="flex gap-3">
                {['Domestic', 'International'].map(t => (
                  <button key={t} type="button" onClick={() => set('travelType', t)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.travelType === t
                      ? t === 'Domestic' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                    {t === 'Domestic' ? '🏠' : '🌍'} {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Fields */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                📍 {isDomestic ? 'Domestic Route' : 'International Route'}
              </h3>
              {isDomestic ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>From City *</label>
                    <input value={form.fromCity} onChange={e => set('fromCity', e.target.value)}
                      className={inputClass} placeholder="e.g. Mumbai, Delhi" />
                  </div>
                  <div>
                    <label className={labelClass}>To City *</label>
                    <input value={form.toCity} onChange={e => set('toCity', e.target.value)}
                      className={inputClass} placeholder="e.g. Bangalore, Chennai" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className={labelClass}>From Country</label>
                      <input value={form.fromCountry} onChange={e => set('fromCountry', e.target.value)}
                        className={inputClass} placeholder="India" />
                    </div>
                    <div>
                      <label className={labelClass}>To Country *</label>
                      <input value={form.toCountry} onChange={e => set('toCountry', e.target.value)}
                        className={inputClass} placeholder="e.g. Singapore, USA" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Passport Number</label>
                      <input value={form.passportNumber} onChange={e => set('passportNumber', e.target.value)}
                        className={inputClass} placeholder="e.g. A1234567" />
                    </div>
                    <div>
                      <label className={labelClass}>Visa Status</label>
                      <select value={form.visaStatus} onChange={e => set('visaStatus', e.target.value)}
                        className={inputClass}>
                        <option value="">-- Select --</option>
                        <option>Have Visa</option><option>Need Visa</option><option>Applied</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Travel Dates */}
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">📅 Travel Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Start Date *</label>
                  <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>End Date *</label>
                  <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className={labelClass}>📌 Purpose of Travel</label>
              <textarea value={form.purpose} onChange={e => set('purpose', e.target.value)} rows={3}
                className={inputClass + " resize-none"} placeholder="e.g. Business Meeting, Conference, Client Visit" />
            </div>

            {/* Status Badge (edit only) */}
            {isEdit && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase">Status:</span>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${form.status === 'Planned' ? 'bg-blue-100 text-blue-700' : form.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : form.status === 'Travelling' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                  {form.status}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => navigate('/my-travel')}
                className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
                {saving ? 'Saving...' : isEdit ? 'Update Travel' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
