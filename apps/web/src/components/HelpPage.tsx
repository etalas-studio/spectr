import { Mail, BookOpen, CreditCard, LifeBuoy, MessageCircleQuestion, Rocket, ShieldQuestion, Sparkles, Video, LayoutGrid, type LucideIcon } from 'lucide-react'
import { useLanguage } from '../lib/i18n'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const HELP_SECTIONS: { title: { en: string; id: string }; icon: LucideIcon; items: { q: { en: string; id: string }; a: { en: string; id: string } }[] }[] = [
  {
    title: { en: 'Getting Started', id: 'Memulai' },
    icon: Rocket,
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
    icon: LayoutGrid,
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
    icon: ShieldQuestion,
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
    icon: CreditCard,
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

const QUICK_LINKS: { icon: LucideIcon; label: { en: string; id: string }; sub: { en: string; id: string } }[] = [
  { icon: MessageCircleQuestion, label: { en: 'Chat with Team', id: 'Chat dengan Tim' }, sub: { en: 'Contact support directly', id: 'Hubungi support langsung' } },
  { icon: BookOpen, label: { en: 'Documentation', id: 'Dokumentasi' }, sub: { en: 'Full guide', id: 'Panduan lengkap' } },
  { icon: Video, label: { en: 'Video Tutorial', id: 'Video Tutorial' }, sub: { en: 'Step-by-step visual', id: 'Step-by-step visual' } },
  { icon: Sparkles, label: { en: 'Changelog', id: 'Changelog' }, sub: { en: 'Latest updates', id: 'Update terbaru' } },
]

export default function HelpPage() {
  const { lang } = useLanguage()
  const L = (s: { en: string; id: string }) => s[lang]

  return (
    <div className="px-6 pt-2 pb-6">
      <div className="mb-8 grid grid-cols-2 gap-3">
        {QUICK_LINKS.map(({ icon: Icon, label, sub }) => (
          <Button key={label.en} variant="outline" className="h-auto justify-start gap-3 rounded-xl p-4 text-left whitespace-normal">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-[18px]" /></span>
            <span>
              <span className="block text-sm font-semibold">{L(label)}</span>
              <span className="mt-0.5 block text-xs font-normal text-[var(--ap-ink-4,#6b7280)]">{L(sub)}</span>
            </span>
          </Button>
        ))}
      </div>

      {HELP_SECTIONS.map((section) => (
        <div key={section.title.en} className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-[var(--ap-ink-3,#5b6472)]">
            <section.icon className="size-[13px]" />
            <span className="text-[11px] font-semibold tracking-widest uppercase">{L(section.title)}</span>
          </div>
          <Accordion>
            {section.items.map((item, i) => (
              <AccordionItem key={i} value={`${section.title.en}-${i}`}>
                <AccordionTrigger>{L(item.q)}</AccordionTrigger>
                <AccordionContent>{L(item.a)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      ))}

      <div className="mt-8 flex items-center gap-4 rounded-2xl border bg-[var(--ap-surface,#fff)] p-5">
        <Avatar className="size-10 bg-linear-to-b from-[#2f6df0] to-[#1d4ed8] text-white"><AvatarFallback className="bg-transparent"><LifeBuoy className="size-[18px]" /></AvatarFallback></Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{lang === 'id' ? 'Butuh bantuan lebih?' : 'Need more help?'}</p>
          <p className="mt-0.5 text-xs text-[var(--ap-ink-4,#6b7280)]">{lang === 'id' ? 'Tim kami siap membantu via chat langsung.' : 'Our team is ready to help via live chat.'}</p>
        </div>
        <Button variant="primary" className="h-9 px-4 text-sm font-semibold" render={<a href="mailto:hello@etalas.com" />}><Mail /> {lang === 'id' ? 'Hubungi Kami' : 'Contact Us'}</Button>
      </div>
    </div>
  )
}
