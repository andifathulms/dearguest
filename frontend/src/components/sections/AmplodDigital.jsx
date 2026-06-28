import { useState } from 'react'
import { motion } from 'framer-motion'

function typeLabel(account) {
  if (account.account_type === 'ewallet') return 'Nomor E-Wallet'
  if (account.account_type === 'qris') return 'Scan QRIS'
  return 'Nomor Rekening'
}

function BankCard({ account }) {
  const [copied, setCopied] = useState(false)
  const isQris = account.account_type === 'qris'

  function handleCopy() {
    navigator.clipboard.writeText(account.account_number).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      className="bank-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="bank-name">{account.bank_name || typeLabel(account)}</p>

      {isQris ? (
        account.qris_image && (
          <img
            src={account.qris_image}
            alt={`QRIS ${account.account_name}`}
            style={{ width: '100%', maxWidth: '200px', borderRadius: '8px', margin: '0.5rem auto 0.75rem', display: 'block', background: '#fff', padding: '6px' }}
          />
        )
      ) : (
        <p className="bank-number">{account.account_number}</p>
      )}

      <p className="bank-holder">a.n. {account.account_name}</p>

      {!isQris && account.account_number && (
        <button className="bank-copy-btn" onClick={handleCopy}>
          {copied ? 'Tersalin ✓' : 'Salin Nomor'}
        </button>
      )}
    </motion.div>
  )
}

export default function AmplodDigital({ bankAccounts }) {
  if (!bankAccounts || bankAccounts.length === 0) return null
  return (
    <section className="amplod-section">
      <h2 className="section-title">Amplop Digital</h2>
      <p className="amplod-desc">
        Doa restu Anda merupakan karunia yang berarti. Bagi yang ingin memberikan tanda kasih,
        dapat melalui rekening, e-wallet, atau QRIS berikut:
      </p>
      <div className="bank-cards">
        {bankAccounts.map(account => (
          <BankCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  )
}
