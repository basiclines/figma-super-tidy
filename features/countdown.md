### Countdown Monetization Plan (Figma Payments API)

#### Goal
- Introduce a countdown gate (random 6–15s) before executing any command for unpaid users, with an in-UI option to purchase and skip the delay.
- Paying customers experience zero delay.

---

### User Experience
- **Paying user**
  - Launch any command (including “Run all”) → command runs immediately, no UI delay screen.
- **Unpaid user**
  - Launch any command → plugin opens a countdown screen showing remaining seconds and a “Go Pro to run now” action.
  - Options:
    - Wait until countdown completes → command runs automatically at 0.
    - Click “Go Pro to run now” → initiate Figma checkout, return to plugin, and if payment successful, run immediately.
  - If checkout is canceled/fails → return to countdown (continue from remaining seconds or restart as desired).

---

### Technical Overview
- **Central gating function** wraps all command execution paths:
  - Check `figma.payments.status`.
  - If paid → run command.
  - If not paid → show countdown UI and allow checkout to skip.
- **Countdown**: uniform random integer between 6–15 seconds per command invocation.
- **UI**: New “Countdown” view inside the existing plugin UI with:
  - Prominent timer, clear copy explaining the free delay.
  - Primary action to purchase (“Go Pro to run now”), secondary to continue waiting.
  - Subtle messaging on benefits of Pro.
- **Messaging**: `figma.ui.postMessage` and `figma.ui.onmessage` for countdown start, tick, complete, and checkout actions.

---

### Figma Payments Integration
- **Docs**: See Figma’s Payments docs: [Requiring payment](https://www.figma.com/plugin-docs/requiring-payment/)
- **APIs** (verify exact names against current docs during implementation):
  - Read status: `figma.payments.status` → check `.type` (e.g., `PAID` vs other states)
  - Initiate purchase: `figma.payments.initiateCheckoutAsync(options)`
    - Use appropriate `interstitial` reason (e.g., "TRIAL_ENDED", "LOCKED_FEATURE") if supported.
  - Re-check status after checkout resolves.
- **Manifest** (verify against current docs): ensure Payments access is enabled in `manifest.json` if required by current API (e.g., a `permissions` entry for payments).

---

### Implementation Steps
1. Manifest updates
   - Confirm whether Payments requires a permission entry (e.g., `"permissions": ["payments"]`).
   - Ensure any network access configuration is present if remote calls/logging are used.

2. Core gating helper (new module, e.g., `src/payments/gate.ts`)
   - `getPaymentStatus(): Promise<"PAID" | "UNPAID" | "UNKNOWN" | ...>`
   - `initiateCheckout(reason?: string): Promise<boolean>`
   - `ensurePaidOrCountdown(commandName: string, onProceed: () => void): Promise<void>`
     - If paid → `onProceed()`
     - Else → show UI with `countdownSeconds`, handle skip (checkout) or wait to 0 → `onProceed()`
   - Cache a short-lived in-memory flag per session to avoid double-gating when one command triggers others.

3. UI: Countdown screen (e.g., React view or vanilla HTML)
   - Props via `postMessage`: `{ type: 'start-countdown', seconds, commandName }`
   - Renders:
     - Heading: “Free mode: starting in Xs”
     - Timer decreasing every second
     - Primary button: “Go Pro to run now” → send `{ type: 'skip-countdown' }`
     - Secondary link: benefits of Pro
   - Emits messages:
     - `{ type: 'countdown-complete' }`
     - `{ type: 'skip-countdown' }`
   - Visual polish: neutral background, accessible contrast, non-blocking copy.

4. Main process wiring
   - Wrap all entry points (single feature commands + “Run all”) with `ensurePaidOrCountdown`.
   - Ensure any command invocations from UI buttons also pass through the gate.

5. Post-checkout handling
   - After `initiateCheckoutAsync` resolves, immediately re-check `figma.payments.status`.
   - If paid → close countdown UI (if open) and proceed.
   - If still unpaid or error → keep countdown active or resume.

6. Analytics and logging (optional but recommended)
   - Track events: `countdown_shown`, `checkout_initiated`, `checkout_succeeded`, `checkout_failed`, `countdown_completed`, `pro_bypass`.
   - Avoid sending personally identifiable information; follow Figma plugin network access rules.

7. QA scenarios
   - Paid user: no countdown, all commands run immediately.
   - Unpaid user waits: countdown completes → command runs.
   - Unpaid user purchases: checkout succeeds → immediate run.
   - Checkout canceled: countdown continues.
   - Rapid repeated commands: gating runs once per invocation; ensure UI state doesn’t conflict.
   - Offline/unavailable payments: gracefully fall back to countdown; disable purchase action with helpful copy.

8. Publishing
   - Confirm compliance with Figma’s review guidelines (pricing copy, disclosures).
   - Provide clear description/screenshots for Pro features and free mode behavior.

---

### Pseudocode Sketch
```ts
async function ensurePaidOrCountdown(commandName: string, onProceed: () => void) {
  const status = figma.payments.status; // verify exact API surface
  const isPaid = status?.type === 'PAID';
  if (isPaid) {
    onProceed();
    return;
  }

  const seconds = getRandomIntInclusive(6, 15);
  figma.showUI(__html__, { width: 360, height: 240 });
  figma.ui.postMessage({ type: 'start-countdown', seconds, commandName });

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'skip-countdown') {
      try {
        await figma.payments.initiateCheckoutAsync({ /* interstitial: 'LOCKED_FEATURE' */ });
      } catch (e) { /* swallow and continue countdown */ }
      const newStatus = figma.payments.status;
      if (newStatus?.type === 'PAID') {
        onProceed();
      }
    }

    if (msg.type === 'countdown-complete') {
      onProceed();
    }
  };
}
```

---

### Copy Guidelines (UI)
- Title: “Free mode: starting soon”
- Body: “Run will start in X seconds. Get Pro to skip the wait and run instantly.”
- Primary CTA: “Go Pro to run now”
- Secondary note: “Pro also unlocks instant runs forever.”

---

### Rollout Plan
- Phase 1: Implement and test locally with staging price/checkout.
- Phase 2: Limited release (internal/team testers) to validate UX and conversion.
- Phase 3: Full release with analytics dashboards monitoring conversion and drop-off.