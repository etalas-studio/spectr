import { useState } from 'react'
import { useLanguage } from '../lib/i18n'

const HELP_SECTIONS = [
  {
    title: { en: 'Getting Started', id: 'Memulai' },
    icon: 'solar:rocket-2-linear',
    items: [
      {
        q: { en: 'What is Spectr?', id: 'Apa itu Spectr?' },
        a: { en: 'Spectr is an AI pipeline that generates technical documents (PRD, MOM, Quotation, Specs) from client briefs automatically. Text input → ready-to-use document output.', id: 'Spectr adalah pipeline AI untuk membuat dokumen teknis (PRD, MOM, Quotation, Specs) dari brief klien secara otomatis. Input teks → output dokumen siap pakai.' },
      },
      {
        q: { en: 'How do I create my first document?', id: 'Bagaimana cara membuat dokumen pertama?' },
        a: { en: 'Type your brief in the main input, choose a document type, then press Enter or click Send. The AI will process and generate a document in seconds.', id: 'Ketik brief di kolom input utama, pilih tipe dokumen, lalu tekan Enter atau klik Send. AI akan memproses dan menghasilkan dokumen dalam beberapa detik.' },
      },
      {
        q: { en: "What's the difference between PRD, MOM, Quotation, and Specs?", id: 'Apa bedanya PRD, MOM, Quotation, dan Specs?' },
        a: { en: 'PRD: Product Requirements Document for new features. MOM: Minutes of Meeting. Quotation: project cost estimation. Specs & Task: technical breakdown and task list.', id: 'PRD: Product Requirements Document untuk fitur baru. MOM: Minutes of Meeting untuk notulen rapat. Quotation: estimasi biaya proyek. Specs & Task: breakdown teknis dan task list.' },
      },
    ],
  },
  {
    title: { en: 'Features', id: 'Fitur' },
    icon: 'solar:widget-2-linear',
    items: [
      {
        q: { en: 'How are documents saved?', id: 'Bagaimana cara menyimpan dokumen?' },
        a: { en: 'Documents are saved automatically to My Briefs after AI finishes processing. No manual save needed.', id: 'Dokumen tersimpan otomatis ke My Briefs setelah AI selesai memproses. Tidak perlu save manual.' },
      },
      {
        q: { en: 'What are chips / quick prompts?', id: 'Chips/quick prompt itu apa?' },
        a: { en: 'Chips are ready-made short prompts that appear below the input. Click one to auto-fill the input field with a template.', id: 'Chips adalah prompt singkat siap pakai yang muncul di bawah input. Klik salah satu untuk otomatis mengisi kolom input dengan template.' },
      },
      {
        q: { en: 'Is my data safe?', id: 'Apakah data saya aman?' },
        a: { en: 'Your documents are stored securely on our servers and are only accessible to you.', id: 'Dokumen Anda disimpan dengan aman di server kami dan hanya dapat diakses oleh Anda.' },
      },
    ],
  },
  {
    title: { en: 'Troubleshooting', id: 'Troubleshooting' },
    icon: 'solar:danger-triangle-linear',
    items: [
      {
        q: { en: "Document doesn't appear after submit?", id: 'Dokumen tidak muncul setelah submit?' },
        a: { en: "Try refreshing the page. If it still doesn't appear, check your internet connection and try submitting again.", id: 'Coba refresh halaman. Jika masih tidak muncul, pastikan koneksi internet stabil dan coba submit ulang.' },
      },
      {
        q: { en: 'AI is responding slowly?', id: 'AI lambat merespons?' },
        a: { en: 'Processing time depends on brief length and server load. Shorter briefs are usually processed faster.', id: 'Waktu proses bergantung pada panjang brief dan beban server. Brief yang lebih singkat biasanya lebih cepat diproses.' },
      },
      {
        q: { en: 'How do I delete a document?', id: 'Bagaimana cara menghapus dokumen?' },
        a: { en: 'Open the document from My Briefs or the type page, click the delete icon, then confirm deletion.', id: 'Buka dokumen dari My Briefs atau halaman tipe, klik ikon hapus, lalu konfirmasi penghapusan.' },
      },
    ],
  },
  {
    title: { en: 'Plans & Subscription', id: 'Paket & Langganan' },
    icon: 'solar:card-linear',
    items: [
      {
        q: { en: "What's the difference between Starter and Pro?", id: 'Apa perbedaan Starter dan Pro?' },
        a: { en: 'Starter: 5 PRDs/month + 100 AI chats. Pro: unlimited PRDs, unlimited AI chat.', id: 'Starter: 5 PRD/bulan + 100 chat AI. Pro: unlimited PRD, chat AI unlimited.' },
      },
      {
        q: { en: 'How do I upgrade to Pro?', id: 'Bagaimana cara upgrade ke Pro?' },
        a: { en: 'Click "Upgrade paket" in the account menu at the bottom of the sidebar.', id: 'Klik "Upgrade paket" di menu akun di bagian bawah sidebar.' },
      },
      {
        q: { en: 'Is there a free plan?', id: 'Apakah ada paket gratis?' },
        a: { en: 'Yes — Starter is free (5 PRDs/month, 100 AI chats). Pro is Rp 100k/mo for unlimited everything.', id: 'Ada — Starter gratis (5 PRD/bulan, 100 chat AI). Pro Rp 100k/bulan untuk semuanya unlimited.' },
      },
    ],
  },
]

const QUICK_LINKS = [
  { icon: 'solar:chat-round-dots-linear', label: { en: 'Chat with Team', id: 'Chat dengan Tim' }, sub: { en: 'Contact support directly', id: 'Hubungi support langsung' } },
  { icon: 'solar:book-linear', label: { en: 'Documentation', id: 'Dokumentasi' }, sub: { en: 'Full guide', id: 'Panduan lengkap' } },
  { icon: 'solar:video-frame-play-horizontal-linear', label: { en: 'Video Tutorial', id: 'Video Tutorial' }, sub: { en: 'Step-by-step visual', id: 'Step-by-step visual' } },
  { icon: 'solar:stars-linear', label: { en: 'Changelog', id: 'Changelog' }, sub: { en: 'Latest updates', id: 'Update terbaru' } },
]

export default function HelpPage() {
  const { lang } = useLanguage()
  const [open, setOpen] = useState<string | null>(null)
  const L = (s: { en: string; id: string }) => s[lang]

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div style={{ maxWidth: '672px', margin: '0 auto' }}>


        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {QUICK_LINKS.map(({ icon, label, sub }) => (
            <button key={label.en}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-colors"
              style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(59,130,246,0.1)' }}>
                <iconify-icon icon={icon} width="18" style={{ color: '#3b82f6' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#111827' }}>{L(label)}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>{L(sub)}</p>
              </div>
            </button>
          ))}
        </div>

        {/* FAQ accordion */}
        {HELP_SECTIONS.map((section) => (
          <div key={section.title.en} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <iconify-icon icon={section.icon} width="13" style={{ color: 'rgba(0,0,0,0.4)' }} />
              <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6b7280' }}>
                {L(section.title)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {section.items.map((item, i) => {
                const itemKey = `${section.title.en}-${i}`
                const isOpen = open === itemKey
                return (
                  <div key={itemKey} className="rounded-xl overflow-hidden" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors"
                      style={{ backgroundColor: isOpen ? 'rgba(59,130,246,0.04)' : 'transparent' }}
                      onClick={() => setOpen(isOpen ? null : itemKey)}
                      onMouseEnter={e => { if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = isOpen ? 'rgba(59,130,246,0.04)' : 'transparent' }}>
                      <span className="text-sm font-medium pr-4" style={{ color: '#111827' }}>{L(item.q)}</span>
                      <iconify-icon
                        icon={isOpen ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
                        width="14"
                        style={{ color: 'rgba(0,0,0,0.3)', flexShrink: 0 }}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-4 pt-1">
                        <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{L(item.a)}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact banner */}
        <div className="mt-8 p-5 rounded-2xl flex items-center gap-4" style={{ backgroundColor: '#ffffff', border: '1px solid rgba(0,0,0,0.08)' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#3b82f6' }}>
            <iconify-icon icon="solar:chat-round-dots-bold" width="18" style={{ color: '#fff' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: '#111827' }}>
              {lang === 'id' ? 'Butuh bantuan lebih?' : 'Need more help?'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9ca3af' }}>
              {lang === 'id' ? 'Tim kami siap membantu via chat langsung.' : 'Our team is ready to help via live chat.'}
            </p>
          </div>
          <button
            className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#3b82f6' }}>
            {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}
          </button>
        </div>

      </div>
    </div>
  )
}
