### Countdown Monetization Plan (Gumroad One‑Time License, Client‑Only)

#### Goal
- Introduce a countdown gate (random 6–15s) before executing any command for unlicensed users, with an in-UI option to purchase and skip the delay.
- Licensed customers experience zero delay.
- Payments handled via a Gumroad product (one-time); license activation is client-only via Gumroad License Verification API (no server).

---

### User Experience
- **Licensed user**
  - Launch any command (including “Run all”) → runs immediately, no countdown.
- **Unlicensed user**
  - Launch any command → plugin opens a countdown screen showing remaining seconds and actions:
    - “Buy Pro on Gumroad” → open Gumroad product in browser.
    - “I have a license” → enter license key to activate and run instantly.
  - Options:
    - Wait until countdown completes → command runs automatically at 0.
    - Click “Buy Pro on Gumroad” → complete checkout, receive a license key, return to plugin and activate via “I have a license”.
    - If purchase is canceled → return to countdown (continue from remaining seconds or restart).
- **Notes**
  - License activation is verified client-side against Gumroad’s API and stored in local plugin storage (soft enforcement). For strong enforcement, add a lightweight server later.

---

### Trigger and Timing Guarantees
- Countdown/paywall appears only after a user explicitly triggers a command.
- Command execution is deferred until countdown completes or license is activated; no pre-execution side effects occur.
- Treat the countdown as an interstitial gate between invocation and execution; the command is queued and runs only upon proceed.
- Closing the plugin/countdown before proceed means the command does not run.
- Applies to single commands and "Run all". Licensed users bypass the gate entirely.

---

### Technical Overview
- **Clean Architecture**: Gating logic is handled at the UI component level where user actions originate:
  - **FormView.js**: Contains all gating logic, handles form submission, manages countdown flow
  - **Router.js**: Handles navigation between views (`index`, `preferences`, `countdown`)
  - **App.js**: Minimal orchestrator, only handles Core.js messages and view switching
  - **Core.js**: Pure Figma Canvas + Storage APIs, no UI logic
- **Gating Flow**: 
  - Check `clientStorage` for valid local license in FormView
  - If licensed → send command directly to Core.js
  - If not licensed → use Router to navigate to countdown view, start countdown, then proceed
- **Countdown**: uniform random integer between 6–15 seconds per command invocation.
- **UI Navigation**: Uses existing Router system with `Router.navigate(Router.routes.countdown)`
- **Communication**: 
  - **Internal UI**: Direct method calls and Router navigation (no events/postMessage)
  - **UI ↔ Core.js**: Only `figma.ui.postMessage` for actual Figma API commands

---

### Gumroad Integration (Client‑Only)
- **Product setup**
  - Create a one-time product on Gumroad.
  - Enable Software Licensing to issue license keys for purchases.
- **Checkout**
  - Open the product page with `figma.openExternal(GUMROAD_PRODUCT_URL)`. This requires no server and runs in the system browser.
- **License verification**
  - Endpoint: `POST https://api.gumroad.com/v2/licenses/verify`
  - Body (JSON):
    - `product_id`: your Gumroad product ID
    - `license_key`: user-entered license key
    - `increment_uses_count`: `true`
  - Acceptance criteria:
    - `success === true`
    - `purchase.refunded !== true`
    - `purchase.chargebacked !== true`
    - `purchase.license_disabled !== true` (if present)
- **Activation storage**
  - Store minimal details in `clientStorage`:
    - `{ licensed: true, productId, licenseKeyHash, deviceId, activatedAt, purchase: { email?, id? } }`
  - Do not store raw license keys; hash or omit.

---

### Manifest and Network Access
- Add Gumroad API if performing client-side verification:
  - `"networkAccess": { "allowedDomains": ["https://api.gumroad.com", "https://*.amplitude.com", "https://*.netlify.app/"] }`
- Opening the Gumroad product page via `figma.openExternal` does not require allowlisting.

---

### Implementation Steps

1) Local license storage
- Schema in `clientStorage`:
  - Key: `LICENSE_V1`
  - Value:
    - `licensed: boolean`
    - `productId: string`
    - `licenseKeyHash?: string`
    - `deviceId: string`
    - `activatedAt: number`
    - `purchase?: { email?: string, id?: string }`
- `deviceId` can reuse the existing `UUID`.

2) License helper functions (`src/payments/gate.js`)
- `shouldShowCountdown(): boolean` - simple check for Iteration 1 (always true)
- `getCountdownSeconds(): number` - generates random 6-15 second delay
- For future iterations:
  - `getLocalLicense(): Promise<{ licensed: boolean }>`
  - `verifyGumroadLicense(productId: string, licenseKey: string): Promise<{ ok: boolean, purchase?: any }>`
  - `activateLicenseViaGumroad(productId: string, licenseKey: string, deviceId: string): Promise<boolean>`

3) UI: Countdown + Activation (LEO)
- **CountdownView.js**: LEO Element with direct method interface:
  - `startCountdown(seconds, commandName, onComplete)` - starts timer with callback
  - No postMessage listeners, uses direct callback when complete
- Renders:
  - Heading: "Free mode: starting in Xs"
  - Timer decreasing every second
  - Primary button: "Buy Pro on Gumroad" (future iteration)
  - Secondary: "I have a license" form (future iteration)

4) FormView integration (`src/ui/views/form/FormView.js`)
- Import gating functions from `src/payments/gate.js`
- Handle form submission with gating logic:
  - If `shouldShowCountdown()` → navigate to countdown, start timer, queue command
  - If licensed → send command directly to Core.js
- Use `Router.navigate(Router.routes.countdown)` for view switching
- Call `countdownView.startCountdown(seconds, commandName, callback)` directly
- On completion callback → send queued command to Core.js, navigate back to form

5) Router setup (`src/App.js`)
- Add countdown route: `countdown: '#countdown'`
- Router handles all view navigation
- App.js remains minimal, only handles Core.js messages

6) Post-purchase handling
- After user completes payment on Gumroad, they receive a license key.
- They return to the plugin, choose “I have a license”, paste the key, and activate.
- If activation fails (invalid key or offline), continue the countdown flow.

7) Analytics and logging (optional)
- Track events:
  - `countdown_shown`, `gumroad_checkout_clicked`, `activation_opened`, `activation_succeeded`, `activation_failed`, `countdown_completed`, `pro_bypass`
- Avoid PII; continue using Amplitude.

8) QA scenarios
- Licensed user: no countdown, immediate runs.
- Unlicensed waits: countdown completes → command runs.
- Unlicensed purchases: opens Gumroad, returns, activates with key → immediate run.
- Purchase canceled: countdown continues.
- Rapid repeated commands: gating runs once per invocation; UI state stays consistent.
- Offline/unavailable Gumroad API: show friendly error on activation; countdown remains available; previously licensed devices continue to skip if license is cached.

9) Publishing
- Disclose that Pro is a one-time license unlocked on this device via Gumroad license key activation.
- Provide clear instructions/screenshots for purchase and activation.

---

### Pseudocode Sketch

```js
// payments/gate.js - Iteration 1 (Simple version)
function getRandomIntInclusive(min, max) {
  const mi = Math.ceil(min), ma = Math.floor(max)
  return Math.floor(Math.random() * (ma - mi + 1)) + mi
}

export function shouldShowCountdown() {
  // Always show countdown for now - no license checking in iteration 1
  return true
}

export function getCountdownSeconds() {
  return getRandomIntInclusive(6, 15)
}

// Future iterations will add:
// export async function getLocalLicense() { ... }
// export async function verifyGumroadLicense(productId, licenseKey) { ... }
// export async function activateLicenseViaGumroad(productId, licenseKey, deviceId) { ... }
```

```js
// ui/views/form/FormView.js - Gating logic
import { shouldShowCountdown, getCountdownSeconds } from 'src/payments/gate'
import Router from 'src/utils/Router'

class FormView extends Element {
  beforeMount() {
    this.data.pendingCommand = null
  }

  handleCommandRequest(commandName, options) {
    if (shouldShowCountdown()) {
      // Store command for later execution
      this.data.pendingCommand = { commandName, options }
      
      // Navigate to countdown view
      const seconds = getCountdownSeconds()
      Router.navigate(Router.routes.countdown)
      
      // Start countdown with callback
      setTimeout(() => {
        const countdownView = document.querySelector('[data-view="countdown"]')
        countdownView.startCountdown(seconds, commandName, () => {
          this.executePendingCommand()
        })
      }, 50)
    } else {
      // Execute immediately if licensed
      this.executeCommand(commandName, options)
    }
  }
  
  executePendingCommand() {
    if (this.data.pendingCommand) {
      this.executeCommand(this.data.pendingCommand.commandName, this.data.pendingCommand.options)
      this.data.pendingCommand = null
      Router.navigate(Router.routes.index) // Back to form
    }
  }
  
  executeCommand(commandName, options) {
    // Send to Core.js
    parent.postMessage({ 
      pluginMessage: { type: commandName, options } 
    }, '*')
  }
}
```

```js
// ui/views/countdown/CountdownView.js - Direct callback interface
class CountdownView extends Element {
  beforeMount() {
    this.data.seconds = 0
    this.data.commandName = ''
    this.data.intervalId = null
    this.data.onComplete = null
  }

  startCountdown(seconds, commandName, onComplete) {
    this.data.seconds = seconds
    this.data.commandName = commandName
    this.data.onComplete = onComplete
    this.render()

    // Start timer
    this.data.intervalId = setInterval(() => {
      this.data.seconds--
      this.render()
      if (this.data.seconds <= 0) {
        this.completeCountdown()
      }
    }, 1000)
  }

  completeCountdown() {
    if (this.data.intervalId) {
      clearInterval(this.data.intervalId)
      this.data.intervalId = null
    }
    // Direct callback - no postMessage
    if (this.data.onComplete) {
      this.data.onComplete()
    }
  }

  render() {
    return `
      <div class="countdown-container">
        <div class="countdown-title">Free mode: starting soon</div>
        <div class="countdown-timer">${this.data.seconds}s</div>
        <div class="countdown-command">${this.data.commandName}</div>
      </div>
    `
  }
}
customElements.define('v-countdown', CountdownView)

```

---

### Incremental Implementation Plan

To build this feature step-by-step with working iterations, break it down into these phases:

#### **Iteration 1: Basic Countdown (No Payments)**
*Goal: Get the countdown mechanism working end-to-end*

**What to build:**
- Simple countdown UI that blocks command execution
- Basic gating function that wraps one command (e.g., `tidy`)
- Timer that counts down and then proceeds

**Files to create/modify:**
- `src/payments/gate.js` - minimal version with hardcoded `licensed: false`
- `src/ui/views/countdown/CountdownView.js` - basic LEO element with timer only
- `src/Core.js` - wrap just the `tidy` command for testing

**Test:** 
- Run `tidy` command → see countdown → wait → command executes

```js
// Minimal gate.js for Iteration 1
export async function ensureLicensedOrCountdown(commandName, onProceed) {
  // Always show countdown for now
  const seconds = Math.floor(Math.random() * 10) + 6
  figma.showUI(__html__, { width: 360, height: 200 })
  figma.ui.postMessage({ type: 'start-countdown', seconds, commandName })
  
  figma.ui.onmessage = (msg) => {
    if (msg.type === 'countdown-complete') onProceed()
  }
}
```

#### **Iteration 2: Local License Storage**
*Goal: Add license bypass without external verification*

**What to add:**
- Local license storage in `clientStorage`
- Manual license activation (any non-empty key works)
- License check that skips countdown

**New functionality:**
- "I have a license" form in countdown UI
- Simple activation that stores `{ licensed: true }` locally
- Licensed users skip countdown entirely

**Test:**
- Run command → see countdown → enter any license → immediate execution
- Run command again → no countdown (licensed)

#### **Iteration 3: External Checkout Link**
*Goal: Add purchase flow without verification*

**What to add:**
- "Buy Pro" button that opens external URL
- Gumroad product page setup (or placeholder)
- Purchase flow instructions

**Test:**
- Run command → see countdown → click "Buy Pro" → browser opens
- Return to plugin → activate with any key → works

#### **Iteration 4: Real Gumroad Integration**
*Goal: Connect to actual Gumroad license verification*

**What to add:**
- Real Gumroad product with licensing enabled
- API integration for license verification
- Proper validation and error handling
- Network access permissions in manifest

**Test:**
- Purchase real license → get actual key → activation works
- Try invalid key → activation fails gracefully
- Try valid key → immediate activation and bypass

#### **Iteration 5: Full Command Coverage**
*Goal: Apply gating to all commands*

**What to add:**
- Wrap all command entry points (`rename`, `reorder`, `pager`, `all`)
- Handle "Run all" as a single gate check
- Consistent UI behavior across all commands

#### **Iteration 6: Polish & Analytics**
*Goal: Production-ready experience*

**What to add:**
- Loading states during license verification
- Better error messages and retry options
- Analytics tracking for conversion funnel
- Offline handling and edge cases
- Visual polish and copy refinement

#### **Iteration 7: Advanced Features (Optional)**
*Goal: Enhanced experience and security*

**What to consider:**
- Server-side license verification for stronger security
- Usage analytics and license management
- Multiple license tiers or features
- License transfer/deactivation options

---

### Development Tips for Each Iteration

**Start Simple:**
- Use `console.log` extensively in early iterations
- Test with manual license keys before connecting to Gumroad
- Build UI incrementally (timer first, then forms)

**Test Thoroughly:**
- Each iteration should be fully functional on its own
- Test edge cases: plugin closure, rapid commands, network failures
- Verify storage persistence across plugin sessions

**Iterate Based on Feedback:**
- Show Iteration 2-3 to potential users for UX feedback
- Measure conversion rates starting with Iteration 4
- Polish based on real usage patterns

**Deployment Strategy:**
- Deploy Iteration 1-3 as internal/beta versions
- Iteration 4+ can go to limited public release
- Full rollout only after Iteration 5-6 is stable

This approach lets you validate the core concept quickly, gather feedback early, and build confidence in the technical approach before investing in the full payment integration.

---

### Copy Guidelines (UI)
- Title: "Free mode: starting soon"
- Body: "Run will start in X seconds. Get Pro to skip the wait and run instantly."
- Primary CTA: "Buy Pro on Gumroad"
- Secondary: "I have a license"
- Activation form help: "Paste the license key you received from Gumroad."

---

### Rollout Plan
- Phase 1: Implement local license store + countdown UI + Gumroad product checkout + client-side license verification.
- Phase 2: Limited release (internal/testers) to validate UX and conversion. Iterate on activation UI and error states.
- Phase 3: Optional hardening — add a small server or Netlify Function to verify Gumroad purchases and issue signed licenses; migrate activations progressively.

### Notes for this codebase
- **Clean Architecture**: Gating logic is handled in FormView.js where user actions originate, not in Core.js
- **Router Integration**: Uses existing Router system (`Router.navigate(Router.routes.countdown)`) for view navigation
- **Direct Communication**: No custom events or internal postMessage - uses direct method calls and callbacks
- **Minimal App.js**: App.js only handles Core.js messages and Router setup, no gating logic
- **Core.js Unchanged**: Core.js remains pure Figma API logic, receives standard command messages
- **LEO Elements**: Existing LEO-based UI system, CountdownView uses direct callback interface
- **Future Enhancement**: Success/activation pages can use Netlify domain (already allowed in `manifest.json`)

### References
- LEO UI library: https://github.com/basiclines/leo
- Gumroad API (License Verification): https://gumroad.com/api#verify-license-key