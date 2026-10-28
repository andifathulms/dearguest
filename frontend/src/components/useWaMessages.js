import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../api/client.js'
import { eventLabel, makeT } from '../copy/copy.js'
import { primaryEvent } from '../utils/events.js'
import { guestUrl, invitationUrl } from '../utils/publicUrl.js'
import { invitationVars, renderMessage, templateFor } from '../utils/waTemplate.js'

// The owner's invitation (couple, events, variant, saved templates) and the
// WhatsApp messages built from it. Used by the guest list and the send queue.
export default function useWaMessages(slug) {
  const [invitation, setInvitation] = useState(null)

  useEffect(() => {
    api.get(`/my/invitations/${slug}/`).then(res => setInvitation(res.data)).catch(() => {})
  }, [slug])

  const t = useMemo(() => makeT(invitation?.copy_variant), [invitation?.copy_variant])
  const saved = invitation?.wa_templates || {}
  const active = saved.active || 'formal'
  const shared = useMemo(() => (invitation ? invitationVars({
    couple: invitation.couple, event: primaryEvent(invitation.events), t, eventLabel,
  }) : {}), [invitation, t])

  const templateText = useCallback(key => templateFor(key, saved, t), [saved, t])

  // `key` defaults to the template the couple chose (formal or santai).
  const messageFor = useCallback((guest, key = active) => renderMessage(templateText(key), {
    ...shared, nama: guest.name, link: guestUrl(slug, guest.code),
  }), [templateText, shared, slug, active])

  const groupMessage = useCallback(() => renderMessage(templateText('group'), {
    ...shared, nama: '', link: invitationUrl(slug),
  }), [templateText, shared, slug])

  const saveTemplates = useCallback(async next => {
    const res = await api.patch(`/my/invitations/${slug}/`, { wa_templates: next })
    setInvitation(res.data)
  }, [slug])

  return { invitation, t, ready: !!invitation, saved, active, shared, templateText, messageFor, groupMessage, saveTemplates }
}
