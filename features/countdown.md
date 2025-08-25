### Countdown Monetization Plan (Figma Payments API)

#### Goal
- Introduce a countdown gate (random 6–15s) before executing any command for unpaid users, with an in-UI option to purchase and skip the delay.
- Paying customers experience zero delay.

---

### User Experience
- **Paying user**
  - Launch any command (including “Run all”) → command runs immediately, no UI delay screen.
- **Trial user (within 7 days of first run)**
  - Launch any command → command runs immediately (no countdown).
  - Also show a `figma.notify` with remaining trial time and a prompt to open the plugin to purchase Pro.
- **Unpaid user**
  - Launch any command → plugin opens a countdown screen showing remaining seconds and a “Go Pro to run now” action.
  - Options:
    - Wait until countdown completes → command runs automatically at 0.
    - Click "Go Pro to run now" → initiate Figma checkout, return to plugin, and if payment successful, run immediately.
  - If checkout is canceled/fails → return to countdown (continue from remaining seconds or restart as desired).

### Trigger and Timing Guarantees
- Countdown/paywall appears only after a user explicitly triggers a command (via plugin UI or Figma menu command).
- Command execution is deferred until countdown completes or purchase succeeds; no pre-execution side effects occur.
- Treat the countdown as an interstitial gate between invocation and execution; the command is queued and runs only upon proceed.
- Closing the plugin/countdown before proceed means the command does not run.
- Applies to single commands and "Run all". Paying users bypass the gate entirely.

---

### Technical Overview
- **Central gating function** wraps all command execution paths:
  - Check `figma.payments.status`.
  - If paid → run command.
  - If not paid, check 7-day trial window via `figma.payments.getUserFirstRanSecondsAgo()`:
    - If trial active → bypass countdown, show `figma.notify` with remaining time and prompt to open plugin and upgrade, then run command.
    - If trial expired → show countdown UI and allow checkout to skip.
- **Countdown**: uniform random integer between 6–15 seconds per command invocation.
- **UI**: New “Countdown” view inside the existing plugin UI with:
  - Prominent timer, clear copy explaining the free delay.
  - Primary action to purchase (“Go Pro to run now”), secondary to continue waiting.
  - Subtle messaging on benefits of Pro.
- **Messaging**: `figma.ui.postMessage` and `figma.ui.onmessage` for countdown start, tick, complete, and checkout actions.

---

### Figma Payments Integration
- **Docs**: Figma Payments API ([link](https://www.figma.com/plugin-docs/api/figma-payments/)).
- **Manifest requirement**: You must include permissions or API calls will throw:
  - `{"permissions": ["payments"]}`
- **Status**: `figma.payments.status` (readonly) returns `{ type: "UNPAID" | "PAID" | "NOT_SUPPORTED" }`.
  - Treat `NOT_SUPPORTED` as an error and do not grant paid features. For gating, handle as unpaid (show countdown/checkout), but never bypass.
- **Checkout**: `figma.payments.initiateCheckoutAsync(options?)` with `options.interstitial` in `"PAID_FEATURE" | "TRIAL_ENDED" | "SKIP"`.
  - Use `PAID_FEATURE` for feature gating; `TRIAL_ENDED` for time/usage trials; `SKIP` if you present your own CTA UI.
  - Throws in query mode while accepting plugin parameters; never call from that state.
  - After it resolves, re-check `figma.payments.status`.
- **Dev helpers**:
  - `figma.payments.setPaymentStatusInDevelopment(status)` (development only) to simulate statuses.
  - `figma.payments.getUserFirstRanSecondsAgo()` for 7-day trial logic.
  - `figma.payments.requestCheckout()` (text review plugins only) and `figma.payments.getPluginPaymentTokenAsync()` (server identity) as needed.

---

### Implementation Steps
1. Manifest updates
   - Confirm whether Payments requires a permission entry (e.g., `"permissions": ["payments"]`).
   - Ensure any network access configuration is present if remote calls/logging are used.

2. Core gating helper (new module, e.g., `src/payments/gate.ts`)
   - `getPaymentStatus(): Promise<"PAID" | "UNPAID" | "NOT_SUPPORTED">` (treat `NOT_SUPPORTED` as error/unpaid; do not grant paid features)
   - `isTrialActive(): boolean` and `getTrialRemainingSeconds(): number` using `figma.payments.getUserFirstRanSecondsAgo()` and a 7-day window.
   - `initiateCheckout(reason?: string): Promise<boolean>`
   - `ensurePaidOrCountdown(commandName: string, onProceed: () => void): Promise<void>`
     - If paid → `onProceed()`
     - Else if trial active → show trial notify, then `onProceed()`
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

  const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;
  const secondsSinceFirstRun = figma.payments.getUserFirstRanSecondsAgo();
  const trialRemainingSeconds = Math.max(SEVEN_DAYS_IN_SECONDS - secondsSinceFirstRun, 0);
  const isTrialActive = trialRemainingSeconds > 0;

  if (isTrialActive) {
    figma.notify(formatTrialRemainingMessage(trialRemainingSeconds));
    onProceed();
    return;
  }

  const seconds = getRandomIntInclusive(6, 15);
  figma.showUI(__html__, { width: 360, height: 240 });
  figma.ui.postMessage({ type: 'start-countdown', seconds, commandName });

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'skip-countdown') {
      try {
        await figma.payments.initiateCheckoutAsync({ interstitial: 'PAID_FEATURE' });
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

// Example helper for trial notify copy
function formatTrialRemainingMessage(remainingSeconds: number): string {
  const remainingDays = Math.floor(remainingSeconds / (24 * 60 * 60));
  const remainingHours = Math.floor((remainingSeconds % (24 * 60 * 60)) / (60 * 60));
  const remaining = remainingDays > 0
    ? `${remainingDays} day${remainingDays === 1 ? '' : 's'}`
    : `${remainingHours} hour${remainingHours === 1 ? '' : 's'}`;
  return `Pro trial: ${remaining} left. Open Super Tidy to upgrade for instant runs.`;
}

---

### Copy Guidelines (UI)
- Title: “Free mode: starting soon”
- Body: “Run will start in X seconds. Get Pro to skip the wait and run instantly.”
- Primary CTA: “Go Pro to run now”
- Secondary note: “Pro also unlocks instant runs forever.”

- Trial notify (shown on every command during active trial):
  - Message: “Pro trial: X left. Open Super Tidy to upgrade for instant runs.”
  - Keep concise; `figma.notify` truncates long text.

---

### Rollout Plan
- Phase 1: Implement and test locally with staging price/checkout.
- Phase 2: Limited release (internal/team testers) to validate UX and conversion.
- Phase 3: Full release with analytics dashboards monitoring conversion and drop-off.