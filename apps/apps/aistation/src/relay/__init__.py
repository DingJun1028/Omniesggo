# source_origin: AI Station §12 / OA-Team Relay - cross-machine messaging
"""Relay package (Desktop relay / hermes peer / bots across machines).

Public surface mirrors the Hermes docs feature list:
  - peer     : connected machine descriptors + roster
  - relay    : send_dm / broadcast / turn_off / turn_on / status
  - cli      : CLI-parity subcommands (send/broadcast/off/on/peers/status)
Failures are typed via ``src.incremental.delivery.DeliveryReason``.
"""
