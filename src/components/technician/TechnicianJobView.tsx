'use client'

import { useState, useRef } from 'react'
import { MapPin, Camera, CheckCircle2, XCircle, Loader2, ChevronRight, AlertTriangle } from 'lucide-react'

interface Props {
  ticketId: string
  technicianId: string | null
  visitNumber: 1 | 2
  category: string
  description: string
  isUrgent: boolean
  tenantName: string | null
}

type Step =
  | 'arrival'
  | 'before_photo'
  | 'diagnosis'
  | 'completion'
  | 'parts'
  | 'done'

interface GPS {
  lat: number
  lng: number
  accuracy: number
  flaggedManual: boolean
}

export function TechnicianJobView({
  ticketId,
  technicianId,
  visitNumber,
  category,
  description,
  isUrgent,
  tenantName,
}: Props) {
  const [step, setStep] = useState<Step>('arrival')
  const [gps, setGps] = useState<GPS | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null)
  const [beforePreview, setBeforePreview] = useState<string | null>(null)
  const [canFixNow, setCanFixNow] = useState<boolean | null>(null)
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null)
  const [afterPreview, setAfterPreview] = useState<string | null>(null)
  const [fixNotes, setFixNotes] = useState('')
  const [costAed, setCostAed] = useState('')
  const [partsDescription, setPartsDescription] = useState('')
  const [partsEstCost, setPartsEstCost] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  // ─── GPS Capture ─────────────────────────────────────────────────────────────

  function captureGPS() {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device.')
      return
    }
    setGpsLoading(true)
    setGpsError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          flaggedManual: false,
        })
        setGpsLoading(false)
      },
      (err) => {
        setGpsError('Could not get your location. Please enable GPS and try again.')
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  // ─── Photo Handlers ────────────────────────────────────────────────────────

  function handleBeforePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBeforePhoto(file)
    setBeforePreview(URL.createObjectURL(file))
  }

  function handleAfterPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAfterPhoto(file)
    setAfterPreview(URL.createObjectURL(file))
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const formData = new FormData()
      formData.append('ticketId', ticketId)
      formData.append('technicianId', technicianId ?? '')
      formData.append('visitNumber', String(visitNumber))
      if (gps) {
        formData.append('arrivalLat', String(gps.lat))
        formData.append('arrivalLng', String(gps.lng))
        formData.append('arrivalFlaggedManual', String(gps.flaggedManual))
      }
      if (beforePhoto) formData.append('beforePhoto', beforePhoto)
      formData.append('canFixNow', String(canFixNow ?? false))
      if (canFixNow) {
        if (afterPhoto) formData.append('afterPhoto', afterPhoto)
        formData.append('fixNotes', fixNotes)
        formData.append('costAed', costAed)
      } else {
        formData.append('partsDescription', partsDescription)
        formData.append('partsEstCost', partsEstCost)
      }

      const res = await fetch('/api/technician/submit-visit', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Submission failed. Please try again.')
      }

      setStep('done')
    } catch (err: any) {
      setSubmitError(err.message ?? 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Job summary card */}
      <div className="bg-[#161616] rounded-2xl border border-[#272727] px-5 py-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#555555] text-xs uppercase tracking-wider">{category}</span>
          {isUrgent && (
            <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 text-[11px]">
              <AlertTriangle size={10} /> Urgent
            </span>
          )}
        </div>
        <p className="text-[#A1A1A1] text-sm leading-relaxed">{description}</p>
        {tenantName && (
          <p className="text-[#555555] text-xs">Tenant: <span className="text-white">{tenantName}</span></p>
        )}
        <p className="text-[#555555] text-xs">Visit {visitNumber} of 2</p>
      </div>

      {/* Step: Arrival */}
      {step === 'arrival' && (
        <StepCard title="Step 1 — Mark Arrival" stepNum={1}>
          <p className="text-[#A1A1A1] text-sm mb-4">
            Tap the button below to capture your GPS location as proof of arrival.
          </p>
          {gps ? (
            <div className="bg-[#1E1E1E] rounded-xl px-4 py-3 mb-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-[#BFF549]" />
                <span className="text-[#BFF549] text-sm font-medium">Location captured</span>
              </div>
              <p className="text-[#555555] text-xs font-mono">
                {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
              </p>
              <p className="text-[#555555] text-[11px] mt-0.5">±{gps.accuracy}m accuracy</p>
            </div>
          ) : null}
          {gpsError && (
            <p className="text-red-400 text-xs mb-3">{gpsError}</p>
          )}
          {!gps ? (
            <button
              onClick={captureGPS}
              disabled={gpsLoading}
              className="w-full flex items-center justify-center gap-2 bg-[#BFF549] text-black font-semibold rounded-xl py-3.5 text-sm disabled:opacity-50"
            >
              {gpsLoading ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
              {gpsLoading ? 'Getting location…' : 'Capture GPS Location'}
            </button>
          ) : (
            <button
              onClick={() => setStep('before_photo')}
              className="w-full flex items-center justify-center gap-2 bg-[#BFF549] text-black font-semibold rounded-xl py-3.5 text-sm"
            >
              Continue <ChevronRight size={16} />
            </button>
          )}
          {!gps && gpsError && (
            <button
              onClick={() => {
                setGps({ lat: 0, lng: 0, accuracy: 0, flaggedManual: true })
                setStep('before_photo')
              }}
              className="w-full mt-2 text-[#555555] text-xs underline py-2"
            >
              Skip GPS (will be flagged)
            </button>
          )}
        </StepCard>
      )}

      {/* Step: Before Photo */}
      {step === 'before_photo' && (
        <StepCard title="Step 2 — Before Photo" stepNum={2}>
          <p className="text-[#A1A1A1] text-sm mb-4">
            Take a photo of the issue before you start work.
          </p>
          {beforePreview ? (
            <div className="mb-4">
              <img
                src={beforePreview}
                alt="Before"
                className="w-full rounded-xl object-cover max-h-56 border border-[#272727]"
              />
              <button
                onClick={() => { setBeforePhoto(null); setBeforePreview(null) }}
                className="mt-2 text-[#555555] text-xs underline"
              >
                Retake
              </button>
            </div>
          ) : null}
          <input
            ref={beforeInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleBeforePhoto}
          />
          {!beforePreview ? (
            <button
              onClick={() => beforeInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 bg-[#1E1E1E] border border-[#272727] text-white rounded-xl py-3.5 text-sm hover:border-[#BFF549]/50 transition-colors"
            >
              <Camera size={16} className="text-[#BFF549]" /> Open Camera
            </button>
          ) : (
            <button
              onClick={() => setStep('diagnosis')}
              className="w-full flex items-center justify-center gap-2 bg-[#BFF549] text-black font-semibold rounded-xl py-3.5 text-sm"
            >
              Continue <ChevronRight size={16} />
            </button>
          )}
        </StepCard>
      )}

      {/* Step: Diagnosis */}
      {step === 'diagnosis' && (
        <StepCard title="Step 3 — Diagnosis" stepNum={3}>
          <p className="text-[#A1A1A1] text-sm mb-5">
            Can you fix the issue today with the tools and parts you have?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setCanFixNow(true); setStep('completion') }}
              className="flex flex-col items-center gap-2 bg-[#1E1E1E] border border-[#272727] hover:border-[#BFF549]/60 rounded-2xl py-5 transition-colors"
            >
              <CheckCircle2 size={28} className="text-[#BFF549]" />
              <span className="text-white font-semibold text-sm">Yes, fix now</span>
            </button>
            <button
              onClick={() => { setCanFixNow(false); setStep('parts') }}
              className="flex flex-col items-center gap-2 bg-[#1E1E1E] border border-[#272727] hover:border-red-500/40 rounded-2xl py-5 transition-colors"
            >
              <XCircle size={28} className="text-red-400" />
              <span className="text-white font-semibold text-sm">Need parts</span>
            </button>
          </div>
        </StepCard>
      )}

      {/* Step: Completion */}
      {step === 'completion' && (
        <StepCard title="Step 4 — Job Completion" stepNum={4}>
          <div className="space-y-4">
            {/* After photo */}
            <div>
              <label className="text-[#555555] text-xs mb-2 block">After Photo</label>
              {afterPreview ? (
                <div>
                  <img
                    src={afterPreview}
                    alt="After"
                    className="w-full rounded-xl object-cover max-h-48 border border-[#272727] mb-2"
                  />
                  <button
                    onClick={() => { setAfterPhoto(null); setAfterPreview(null) }}
                    className="text-[#555555] text-xs underline"
                  >
                    Retake
                  </button>
                </div>
              ) : (
                <>
                  <input
                    ref={afterInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleAfterPhoto}
                  />
                  <button
                    onClick={() => afterInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-[#1E1E1E] border border-[#272727] text-white rounded-xl py-3 text-sm hover:border-[#BFF549]/50 transition-colors"
                  >
                    <Camera size={15} className="text-[#BFF549]" /> Take After Photo
                  </button>
                </>
              )}
            </div>

            {/* Fix notes */}
            <div>
              <label className="text-[#555555] text-xs mb-2 block">What was done? (required)</label>
              <textarea
                value={fixNotes}
                onChange={(e) => setFixNotes(e.target.value)}
                placeholder="Describe the work completed…"
                rows={3}
                className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555555] focus:outline-none focus:border-[#BFF549]/50 resize-none"
              />
            </div>

            {/* Cost */}
            <div>
              <label className="text-[#555555] text-xs mb-2 block">Total Cost (AED)</label>
              <input
                type="number"
                inputMode="decimal"
                value={costAed}
                onChange={(e) => setCostAed(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555555] focus:outline-none focus:border-[#BFF549]/50"
              />
            </div>

            {submitError && (
              <p className="text-red-400 text-xs">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !fixNotes.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#BFF549] text-black font-semibold rounded-xl py-3.5 text-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Submitting…' : 'Submit Job Card'}
            </button>
          </div>
        </StepCard>
      )}

      {/* Step: Parts needed */}
      {step === 'parts' && (
        <StepCard title="Step 4 — Parts Required" stepNum={4}>
          <div className="space-y-4">
            <div>
              <label className="text-[#555555] text-xs mb-2 block">Parts needed (required)</label>
              <textarea
                value={partsDescription}
                onChange={(e) => setPartsDescription(e.target.value)}
                placeholder="List the parts required…"
                rows={3}
                className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555555] focus:outline-none focus:border-[#BFF549]/50 resize-none"
              />
            </div>

            <div>
              <label className="text-[#555555] text-xs mb-2 block">Estimated Cost (AED)</label>
              <input
                type="number"
                inputMode="decimal"
                value={partsEstCost}
                onChange={(e) => setPartsEstCost(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#1E1E1E] border border-[#272727] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555555] focus:outline-none focus:border-[#BFF549]/50"
              />
            </div>

            {submitError && (
              <p className="text-red-400 text-xs">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !partsDescription.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#BFF549] text-black font-semibold rounded-xl py-3.5 text-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {isSubmitting ? 'Submitting…' : 'Submit Job Card'}
            </button>
          </div>
        </StepCard>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="bg-[#161616] rounded-2xl border border-[#272727] px-5 py-8 text-center mt-4">
          <div className="w-14 h-14 rounded-full bg-[#BFF549]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-[#BFF549]" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Job card submitted</h2>
          <p className="text-[#A1A1A1] text-sm">
            {canFixNow
              ? 'Great work. The ticket will be reviewed and closed by the office.'
              : 'Parts request logged. The office will follow up on procurement.'}
          </p>
          <p className="text-[#555555] text-xs mt-4">You can close this page.</p>
        </div>
      )}
    </div>
  )
}

// ─── Helper: Step Card wrapper ──────────────────────────────────────────────

function StepCard({ title, stepNum, children }: { title: string; stepNum: number; children: React.ReactNode }) {
  return (
    <div className="bg-[#161616] rounded-2xl border border-[#272727] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#272727] flex items-center gap-3">
        <span className="w-6 h-6 rounded-full bg-[#BFF549]/10 text-[#BFF549] text-xs font-bold flex items-center justify-center">
          {stepNum}
        </span>
        <h2 className="text-white text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  )
}
