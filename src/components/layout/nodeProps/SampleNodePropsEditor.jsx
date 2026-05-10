import useLibraryStore from '../../../stores/libraryStore'

const CONTAINER_OPTIONS = [
  { value: 'well_96', label: '96-well Plate' },
  { value: 'well_384', label: '384-well Plate' },
  { value: 'well_6', label: '6-well Plate' },
  { value: 'cryo_tube', label: 'Cryo Tube' },
  { value: 'reservoir', label: 'Reservoir' },
  { value: 'flask', label: 'Flask' },
  { value: 'autoflask', label: 'AutoFlask' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'tube_15', label: '15 mL Tube' },
  { value: 'tube_50', label: '50 mL Tube' },
  { value: 'deepwell_96', label: '96-well Deep Well' },
  { value: 'other', label: 'Other' },
]

const CONC_UNITS = ['nM', 'µM', 'mM', 'M', 'mg/mL', 'µg/mL', 'ng/mL', 'cells/mL', '%', 'U/mL']
const VOL_UNITS = ['µL', 'mL', 'L']
const STORAGE_TEMPS = ['RT', '4°C', '-20°C', '-80°C', 'LN2', 'Other']

export default function SampleNodePropsEditor({ data, update }) {
  const samples = useLibraryStore((s) => s.samples)

  return (
    <>
      <Field label="Sample (from library)">
        <select
          value={data.sampleId ?? ''}
          onChange={(e) => {
            const s = samples.find((x) => x.id === e.target.value)
            update({ sampleId: e.target.value || null, sampleName: s?.name ?? '' })
          }}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}
        >
          <option value="">— custom / unlisted —</option>
          {samples.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>

      {!data.sampleId && (
        <Field label="Sample name">
          <Input value={data.sampleName} onChange={(v) => update({ sampleName: v })} placeholder="e.g. HEK293T" />
        </Field>
      )}

      <Field label="Container type">
        <select value={data.containerType ?? 'well_96'} onChange={(e) => update({ containerType: e.target.value })}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
          {CONTAINER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>

      <Field label="Quantity / count">
        <Input value={data.quantity} onChange={(v) => update({ quantity: v })} placeholder="e.g. 4 plates, 2 vials" />
      </Field>

      <Field label="Concentration">
        <div className="flex gap-2">
          <Input value={data.concentration} onChange={(v) => update({ concentration: v })} placeholder="e.g. 50" />
          <select value={data.concentrationUnit ?? 'nM'} onChange={(e) => update({ concentrationUnit: e.target.value })}
            className="w-24 border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none" style={{ borderRadius: 4 }}>
            {CONC_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </Field>

      <Field label="Volume">
        <div className="flex gap-2">
          <Input value={data.volume} onChange={(v) => update({ volume: v })} placeholder="e.g. 100" />
          <select value={data.volumeUnit ?? 'µL'} onChange={(e) => update({ volumeUnit: e.target.value })}
            className="w-20 border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none" style={{ borderRadius: 4 }}>
            {VOL_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </Field>

      <Field label="Storage temperature">
        <select value={data.storageTemp ?? ''} onChange={(e) => update({ storageTemp: e.target.value })}
          className="w-full border border-gray-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-red-400" style={{ borderRadius: 4 }}>
          <option value="">— not specified —</option>
          {STORAGE_TEMPS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </Field>

      <Field label="Notes">
        <Textarea value={data.notes} onChange={(v) => update({ notes: v })} placeholder="Additional info..." rows={2} />
      </Field>
    </>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
)

const Input = ({ value, onChange, placeholder, type = 'text', min }) => (
  <input type={type} min={min} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    placeholder={placeholder}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100" style={{ borderRadius: 4 }} />
)

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    className="w-full border border-gray-200 px-2.5 py-1.5 text-sm focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 resize-none" style={{ borderRadius: 4 }} />
)
