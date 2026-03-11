import React, { useState, useMemo } from 'react';
import { Copy, Link as LinkIcon, CheckCircle2, Code2 } from 'lucide-react';

export default function App() {
  // Pevně definovaná struktura polí podle specifikace
  const [fields, setFields] = useState([
    { id: 'ico', label: 'IČO střediska', type: 'text', value: '62157612', active: true, required: true, fixed: true, desc: 'Povinné a pevně dané (IČO organizace)' },
    { id: 'course_name', label: 'Účel platby', type: 'text', value: 'Registrační poplatek skaut 2026', active: true, required: false, desc: 'Max. 100 znaků', maxLength: 100 },
    { id: 'course_date', label: 'Datum splatnosti', type: 'date', value: new Date().toISOString().split('T')[0], active: true, required: false, desc: 'Datum ke kterému je nutné uhradit kredity' },
    { id: 'course_price', label: 'Celkový poplatek', type: 'number', value: '2000', active: true, required: false, desc: 'Kladné číslo (např. 2000)', min: 1 },
    { id: 'amount', label: 'Částka ke stržení (kredity)', type: 'number', value: '1600', active: true, required: false, desc: 'Kladné číslo. Pokud rodič nemá dost kreditů, bude muset částku ručně upravit doplatkem.', min: 1 },
    { id: 'course_id', label: 'ID kurzu', type: 'text', value: '', active: false, required: false, desc: 'Max. 40 znaků', maxLength: 40 },
    { id: 'vs', label: 'Variabilní symbol (VS)', type: 'text', value: '', active: false, required: false, desc: 'Max. 10 číslic', maxLength: 10 },
    { id: 'ss', label: 'Specifický symbol (SS)', type: 'text', value: '', active: false, required: false, desc: 'Max. 10 číslic', maxLength: 10 },
  ]);
  
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Aktualizace konkrétního pole
  const updateField = (id, key, newValue) => {
    setFields(fields.map((field) => {
      if (field.id === id) {
        // Filtrace pro VS a SS (pouze číslice)
        if (key === 'value' && (id === 'vs' || id === 'ss')) {
          newValue = newValue.replace(/\D/g, '');
        }
        return { ...field, [key]: newValue };
      }
      return field;
    }));
  };

  // Výpočet JSON payloadu
  const jsonPayload = useMemo(() => {
    const payload = {};
    fields.forEach(f => {
      if (f.active && f.value !== '') {
        let val = f.value;
        
        // Bezpečný převod na číslo tam, kde to dává smysl (pokud to nezačíná nulou, např. u VS)
        if (['ico', 'course_price', 'amount', 'vs', 'ss'].includes(f.id)) {
          if (!isNaN(val) && val.trim() !== '') {
            if (val.length > 1 && val.startsWith('0')) {
              // Ponechat jako string (např. IČO začínající nulou nebo VS)
            } else {
              val = Number(val);
            }
          }
        }
        payload[f.id] = val;
      }
    });
    return payload;
  }, [fields]);

  // Výpočet finální URL adresy
  const generatedUrl = useMemo(() => {
    try {
      const jsonString = JSON.stringify(jsonPayload);
      // Bezpečný Base64 encoding s podporou UTF-8 (pro českou diakritiku v názvu kurzu)
      const base64 = btoa(unescape(encodeURIComponent(jsonString)));
      return `https://www.brnoid.cz/cs/rv-nabidka-kreditu?q=${base64}`;
    } catch (e) {
      return 'Chyba při generování Base64';
    }
  }, [jsonPayload]);

  // Kopírovací funkce
  const handleCopy = async (text, setCopiedState) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedState(true);
        setTimeout(() => setCopiedState(false), 2000);
      } catch (e) {
        console.error('Kopírování selhalo');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Hlavička */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 sm:p-3 bg-indigo-100 text-indigo-600 rounded-lg shrink-0">
              <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Brno iD - Nabídka kreditu</h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Nástroj generuje odkaz na Brno iD s pře-vyplněnými údaji pro úhradu z nabitého kreditu. 
            Data se automaticky formátují do JSONu a následně kódují přes Base64 do parametru <code className="bg-slate-100 px-1 py-0.5 rounded">q</code>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          
          {/* Levý sloupec: Formulář */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-4 border-b pb-2">Parametry nabídky</h2>
            
            <div className="space-y-3">
              {fields.map((field) => (
                <div key={field.id} className={`flex items-start gap-2 sm:gap-3 p-3 rounded-xl border transition-colors ${field.active ? 'bg-indigo-50/30 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="pt-1.5 sm:pt-2.5">
                    <input
                      type="checkbox"
                      checked={field.active}
                      disabled={field.required}
                      onChange={(e) => updateField(field.id, 'active', e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      title={field.required ? "Toto pole je povinné" : "Zahrnout do JSON objektu"}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-base font-medium text-slate-800 mb-1 break-words">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => {
                        if (field.fixed) return;
                        updateField(field.id, 'value', e.target.value);
                        if (!field.active && e.target.value !== '') {
                          updateField(field.id, 'active', true);
                        }
                      }}
                      maxLength={field.maxLength}
                      min={field.min}
                      disabled={field.fixed || (!field.active && !field.required)}
                      placeholder="Není vyplněno"
                      className={`w-full box-border px-3 py-2 text-base border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${field.fixed || (!field.active && !field.required) ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed' : 'bg-white border-slate-300'}`}
                    />
                    <p className="text-sm text-slate-500 mt-1.5 leading-snug break-words">{field.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pravý sloupec: Výsledky (JSON a Link) */}
          <div className="space-y-4 sm:space-y-6 lg:sticky lg:top-6">
            
            {/* JSON Náhled */}
            <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-indigo-400"/> Generovaný JSON
                </h2>
                <button
                  onClick={() => handleCopy(JSON.stringify(jsonPayload), setCopiedJson)}
                  className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5 bg-slate-800 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg sm:rounded-none w-full sm:w-auto justify-center"
                >
                  {copiedJson ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  {copiedJson ? 'Zkopírováno' : 'Kopírovat JSON'}
                </button>
              </div>
              
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800 overflow-x-auto">
                <pre className="text-emerald-400 font-mono text-xs sm:text-sm">
                  {JSON.stringify(jsonPayload, null, 2)}
                </pre>
              </div>
            </div>

            {/* Finální URL */}
            <div className="bg-indigo-950 rounded-2xl shadow-lg border border-indigo-900 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-indigo-400"/> Výsledný Link
              </h2>
              
              <div className="bg-slate-950 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 relative group border border-slate-800">
                <p className="text-indigo-300 font-mono text-xs sm:text-sm break-all whitespace-pre-wrap">
                  {generatedUrl}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleCopy(generatedUrl, setCopiedUrl)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
                >
                  {copiedUrl ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                  {copiedUrl ? 'Zkopírováno!' : 'Kopírovat link'}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
