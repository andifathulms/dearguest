import { useState } from 'react'
import { fromLocalInput, toLocalInputValue } from '../../utils/dates.js'
import { normaliseCode, priceWith, voucherLabel } from '../../utils/vouchers.js'
import { errorText, rupiah, staffGet } from '../ui.jsx'

const TZ = 'Asia/Jakarta'

function initial(v) {
  return {
    code: v?.code || '',
    discount_type: v?.discount_type || 'percent',
    discount_percent: v?.discount_percent ? String(v.discount_percent) : '',
    discount_amount: v?.discount_amount ? String(v.discount_amount) : '',
    max_discount: v?.max_discount ? String(v.max_discount) : '',
    plans: v?.plans?.length ? v.plans : ['premium', 'bisnis'],
    quota: v?.quota ? String(v.quota) : '',
    starts_at: toLocalInputValue(v?.starts_at, TZ),
    ends_at: toLocalInputValue(v?.ends_at, TZ),
    once_per_account: v ? v.once_per_account : true,
    active: v ? v.active : true,
    description: v?.description || '',
  }
}

// Make or change a voucher. `voucher` (when editing) locks the code and the
// discount once it has been used; `plans` are the paid plans with prices, for
// the live preview.
export default function VoucherForm({ voucher, plans, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(() => initial(voucher))
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const set = patch => setForm(f => ({ ...f, ...patch }))
  const locked = !!voucher?.ever_used
  const digits = v => v.replace(/\D/g, '')

  async function newCode() {
    try { set({ code: (await staffGet('vouchers/new-code/')).code }) } catch { /* the field stays as it was */ }
  }

  function togglePlan(slug) {
    const next = form.plans.includes(slug) ? form.plans.filter(p => p !== slug) : [...form.plans, slug]
    set({ plans: next.length ? next : form.plans })   // at least one plan
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    const percent = form.discount_type === 'percent'
    const body = {
      code: form.code, discount_type: form.discount_type, plans: form.plans,
      discount_percent: percent ? form.discount_percent : undefined,
      discount_amount: percent ? undefined : form.discount_amount,
      max_discount: percent ? form.max_discount : '',
      quota: form.quota, starts_at: fromLocalInput(form.starts_at, TZ), ends_at: fromLocalInput(form.ends_at, TZ),
      once_per_account: form.once_per_account, active: form.active, description: form.description,
    }
    if (locked) { delete body.code; delete body.discount_type; delete body.discount_percent; delete body.discount_amount }
    try {
      await onSubmit(body)
    } catch (err) {
      const data = err?.response?.data
      setErrors(data && typeof data === 'object' && !data.detail ? data : { form: errorText(err) })
    } finally {
      setBusy(false)
    }
  }

  const draft = { ...form, discount_percent: Number(form.discount_percent), discount_amount: Number(form.discount_amount),
    max_discount: Number(form.max_discount) || null }
  const showPreview = form.discount_type === 'percent' ? Number(form.discount_percent) > 0 : Number(form.discount_amount) > 0
  const err = name => errors[name] && <span className="bo-field-error" role="alert">{errors[name]}</span>
  const id = name => `bo-v-${name}`

  return (
    <form className="bo-form bo-voucher-form" onSubmit={submit} noValidate>
      <div className="bo-form-grid">
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('code')}>Kode voucher</label>
          <div className="bo-inline">
            <input id={id('code')} className="dg-input bo-code-input" value={form.code} disabled={locked} maxLength={30}
              placeholder="kosongkan untuk dibuatkan" onChange={e => set({ code: normaliseCode(e.target.value) })} />
            {!locked && <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={newCode}>Buat kode</button>}
          </div>
          {locked ? <span className="bo-quiet">Sudah dipakai, jadi kode dan potongannya tetap.</span>
            : <span className="bo-quiet">Huruf, angka, tanda hubung. Pasangan cukup menempelkannya.</span>}
          {err('code')}
        </div>
        <div className="dg-field">
          <span className="dg-label">Jenis potongan</span>
          <div className="bo-chips" role="group" aria-label="Jenis potongan">
            {[['percent', 'Persentase'], ['amount', 'Nominal (Rp)']].map(([value, label]) => (
              <button key={value} type="button" className="dg-chip" aria-pressed={form.discount_type === value}
                disabled={locked} onClick={() => set({ discount_type: value })}>{label}</button>
            ))}
          </div>
          {err('discount_type')}
        </div>
        {form.discount_type === 'percent' ? (
          <>
            <div className="dg-field">
              <label className="dg-label" htmlFor={id('pct')}>Potongan (%)</label>
              <input id={id('pct')} className="dg-input" inputMode="numeric" value={form.discount_percent} disabled={locked}
                placeholder="mis. 20" onChange={e => set({ discount_percent: digits(e.target.value).slice(0, 3) })} />
              {err('discount_percent')}
            </div>
            <div className="dg-field">
              <label className="dg-label" htmlFor={id('max')}>Potongan maksimal (Rp)</label>
              <input id={id('max')} className="dg-input" inputMode="numeric" value={form.max_discount}
                placeholder="opsional, mis. 30000" onChange={e => set({ max_discount: digits(e.target.value) })} />
              {err('max_discount')}
            </div>
          </>
        ) : (
          <div className="dg-field">
            <label className="dg-label" htmlFor={id('amount')}>Potongan (Rp)</label>
            <input id={id('amount')} className="dg-input" inputMode="numeric" value={form.discount_amount} disabled={locked}
              placeholder="mis. 25000" onChange={e => set({ discount_amount: digits(e.target.value) })} />
            {err('discount_amount')}
          </div>
        )}
      </div>

      <div className="bo-form-grid">
        <div className="dg-field">
          <span className="dg-label">Berlaku untuk paket</span>
          <div className="bo-chips" role="group" aria-label="Paket">
            {plans.map(p => (
              <button key={p.slug} type="button" className="dg-chip" aria-pressed={form.plans.includes(p.slug)}
                onClick={() => togglePlan(p.slug)}>{p.name}</button>
            ))}
          </div>
          {err('plans')}
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('quota')}>Kuota</label>
          <input id={id('quota')} className="dg-input" inputMode="numeric" value={form.quota}
            placeholder="kosong = tanpa batas" onChange={e => set({ quota: digits(e.target.value) })} />
          <span className="bo-quiet">Berapa undangan boleh memakai{voucher ? `; sudah ${voucher.used}` : ''}.</span>
          {err('quota')}
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('start')}>Mulai (WIB)</label>
          <input id={id('start')} type="datetime-local" className="dg-input" value={form.starts_at}
            onChange={e => set({ starts_at: e.target.value })} />
          <span className="bo-quiet">Kosong = langsung berlaku.</span>
          {err('starts_at')}
        </div>
        <div className="dg-field">
          <label className="dg-label" htmlFor={id('end')}>Berakhir (WIB)</label>
          <input id={id('end')} type="datetime-local" className="dg-input" value={form.ends_at}
            onChange={e => set({ ends_at: e.target.value })} />
          <span className="bo-quiet">Kosong = tanpa batas waktu.</span>
          {err('ends_at')}
        </div>
      </div>

      <div className="dg-field">
        <label className="dg-label" htmlFor={id('desc')}>Keterangan</label>
        <input id={id('desc')} className="dg-input" maxLength={200} value={form.description}
          placeholder="mis. Mitra MUA Bukittinggi, atau Promo Harbolnas" onChange={e => set({ description: e.target.value })} />
      </div>

      <div className="bo-checks">
        <label><input type="checkbox" checked={form.once_per_account} onChange={e => set({ once_per_account: e.target.checked })} />
          Sekali per akun</label>
        <label><input type="checkbox" checked={form.active} onChange={e => set({ active: e.target.checked })} />
          Aktif</label>
      </div>

      {showPreview && (
        <div className="bo-preview" aria-live="polite">
          <span className="bo-quiet">Pratinjau · potongan {voucherLabel(draft)}</span>
          <div className="bo-preview-prices">
            {plans.map(p => (form.plans.includes(p.slug) ? (
              <span key={p.slug}><b>{p.name}</b> <s className="dg-num">{rupiah(p.price)}</s> → <b className="dg-num">{rupiah(priceWith(draft, p.slug, p.price))}</b></span>
            ) : <span key={p.slug} className="bo-quiet"><b>{p.name}</b> tidak berlaku</span>))}
          </div>
        </div>
      )}

      {errors.form && <p className="bo-action-error" role="alert">{errors.form}</p>}
      <div className="bo-row">
        <button type="submit" className="dg-btn dg-btn-ink dg-btn-sm" disabled={busy}>{busy ? 'Menyimpan…' : submitLabel}</button>
        {onCancel && <button type="button" className="dg-btn dg-btn-line dg-btn-sm" onClick={onCancel}>Batal</button>}
      </div>
    </form>
  )
}
