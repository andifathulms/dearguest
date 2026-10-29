"""A fixed personal link for Lighthouse CI (run through `manage.py shell`):
guest code LHC2PQ on the sage demo."""
from apps.invitations.models import Guest, Invitation

inv = Invitation.objects.get(slug='demo-taman-sage')
Guest.objects.get_or_create(invitation=inv, code='LHC2PQ', defaults={'name': 'Bapak Ahmad Fauzi'})
print('lighthouse guest link: /demo-taman-sage/LHC2PQ')
