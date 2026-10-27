import { useState } from 'react'
import { motion } from 'framer-motion'
import PaymentLogo from '../ui/PaymentLogo.jsx'
import SectionTitle from './SectionTitle.jsx'
import { useCopy } from '../../copy/CopyContext.jsx'

function typeLabel(account, t) {
  if (account.account_type === 'ewallet') return t('gift.typeEwallet')
  if (account.account_type === 'qris') return t('gift.typeQris')
  return t('gift.typeBank')
}

function BankCard({ account }) {
  const { t } = useCopy()
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
      <div className="bank-logo-wrap"><PaymentLogo name={account.bank_name} /></div>
      <p className="bank-name">{account.bank_name || typeLabel(account, t)}</p>

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

      <p className="bank-holder">{t('gift.holder')} {account.account_name}</p>

      {!isQris && account.account_number && (
        <button className="bank-copy-btn" onClick={handleCopy}>
          {copied ? `${t('gift.copied')} ✓` : t('gift.copy')}
        </button>
      )}
    </motion.div>
  )
}

// Optional shipping address for physical gifts (set in the editor; visible to every guest).
function GiftAddressCard({ recipient, address, phone }) {
  const { t } = useCopy()
  const [copied, setCopied] = useState(false)
  const text = [recipient, address, phone].filter(Boolean).join('\n')

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      className="bank-card gift-address-card"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <p className="bank-name">{t('gift.address.title')}</p>
      {recipient && <p className="gift-address-recipient">{recipient}</p>}
      <p className="gift-address-text">{address}</p>
      {phone && <p className="gift-address-phone">{phone}</p>}
      <button className="bank-copy-btn" onClick={handleCopy}>
        {copied ? `${t('gift.copied')} ✓` : t('gift.address.copy')}
      </button>
    </motion.div>
  )
}

export default function AmplodDigital({ bankAccounts, wishlistUrl }) {
  const { t, invitation } = useCopy()
  const hasBanks = bankAccounts && bankAccounts.length > 0
  const address = invitation?.gift_address?.trim()
  if (!hasBanks && !wishlistUrl && !address) return null
  return (
    <section className="amplod-section">
      <SectionTitle>{t('gift.title')}</SectionTitle>
      <p className="amplod-desc">
        {t('gift.intro')}
      </p>
      {hasBanks && (
        <div className="bank-cards">
          {bankAccounts.map(account => (
            <BankCard key={account.id} account={account} />
          ))}
        </div>
      )}
      {address && (
        <div className="bank-cards">
          <GiftAddressCard recipient={invitation.gift_recipient} address={address} phone={invitation.gift_phone} />
        </div>
      )}
      {wishlistUrl && (
        <div className="amplod-wishlist-wrap">
          <a className="amplod-wishlist" href={wishlistUrl} target="_blank" rel="noopener noreferrer">
            {t('gift.wishlist')} →
          </a>
        </div>
      )}
    </section>
  )
}
