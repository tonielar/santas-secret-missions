# Notifications: deliberately omitted from this release

The app requests no notification permission and stores no push subscriptions. It does not send production or test notifications. It does show a persistent local indicator for available missions that have not yet been opened.

A static service worker cannot independently keep a timer alive and reliably wake a closed iPhone app on all twelve dates. Web Push uses a push service and an application-side sender; the sender needs the target's subscription endpoint and encryption keys. Those endpoints must not be published in a public GitHub repository.

GitHub Actions can schedule a sender, but cannot accept and privately store each family's browser subscriptions by itself. Scheduled workflows are not a guaranteed exact-midnight delivery service. A free-tier backend could be investigated later, but would introduce infrastructure, subscription handling, credentials and service limits. None was configured or promised merely because a free tier exists.

This build therefore prioritises the backend-free, key-free, zero-paid-service calendar. It does not use local timers, periodic background sync or calendar reminders as a misleading substitute for closed-app Web Push.

## Future integration boundary

A later implementation should add an explicit user-initiated opt-in, a private subscription registration endpoint, a scheduled sender, unsubscribe controls and generic door-release notifications. Keep personal names on the device unless the parent explicitly chooses otherwise; a generic message can avoid transmitting a child's name. Test builds must use separate subscriptions and never send production notifications. Do not add an inactive Subscribe button to the current child-facing UI.

## Primary documentation

- [WebKit: Web Push for Home Screen apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Apple: sending Web Push notifications](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)
- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [GitHub: scheduled workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)
