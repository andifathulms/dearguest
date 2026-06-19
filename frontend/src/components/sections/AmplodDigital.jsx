import { useState } from 'react'
import { motion } from 'framer-motion'

function BankCard({ account }) {
  const [copied, setCopied] = useState(false)

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
      <p className="bank-name">{account.bank_name}</p>
      <p className="bank-number">{account.account_number}</p>
      <p className="bank-holder">{account.account_name}</p>
      <button className="bank-copy-btn" onClick={handleCopy}>
        {copied ? 'Tersalin ✓' : 'Salin Nomor'}
      </button>
    </motion.div>
  )
}

export default function AmplodDigital({ bankAccounts }) {
  if (!bankAccounts || bankAccounts.length === 0) return null
  return (
    <section className="amplod-section">
      <h2 className="section-title">Amplop Digital</h2>
      <p className="amplod-desc">
        Bagi yang ingin memberikan hadiah melalui transfer, berikut rekening kami:
      </p>
      <div className="bank-cards">
        {bankAccounts.map(account => (
          <BankCard key={account.id} account={account} />
        ))}
      </div>
    </section>
  )
}
