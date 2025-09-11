### Super Tidy Pro: Countdown Monetization System

#### Overview
Implement a premium licensing system with countdown gates for free users and instant execution for licensed users. The system uses Gumroad for payments and license management, with a client-side verification approach optimized for performance and user experience.

#### Product Goals
- **Premium Experience**: Licensed users get instant command execution with zero friction
- **Conversion Optimization**: Free users experience 6-15 second countdown with seamless upgrade path
- **Reliable Architecture**: Robust data flow with comprehensive error tracking and observability
- **Scalable Foundation**: Clean separation of concerns and reusable architectural patterns

---

### User Experience
- **Licensed user**
  - Launch any command (including menu commands) → runs immediately, no countdown.
- **Unlicensed user**
  - Launch any command → countdown appears within the Actions view showing:
    - Animated analog chronometer with dynamic ticks
    - Digital timer countdown
    - "Get Super Tidy Pro" button → navigate to License tab for purchase/activation
    - "Run Now" button (disabled until countdown completes)
  - Options:
    - Wait until countdown completes → "Run Now" button enables, click to execute command
    - Click "Get Super Tidy Pro" → go to License tab, purchase on Gumroad, activate with license key
    - If purchase is canceled → return to countdown state
- **License Management**
  - Dedicated "License" tab in toolbar for activation, viewing license info, and unlinking
  - 2-device usage limit enforced via Gumroad's usage count system
  - License info displays email, license key, activation date, and device usage (X/2 devices)

---

### Trigger and Timing Guarantees
- Countdown appears only after a user explicitly triggers a command (UI form submission or menu command).
- Command execution is deferred until countdown completes and user manually clicks "Run Now".
- Treat the countdown as an interstitial gate between invocation and execution; the command is queued and runs only upon manual proceed.
- Closing the plugin/countdown before proceed means the command does not run.
- Applies to all commands: UI form actions and direct menu commands. Licensed users bypass the gate entirely.

---

### Technical Architecture

#### **Design Principles**
- **Unidirectional Data Flow**: Data flows from Core → App → Components via props
- **Separation of Concerns**: Core.js handles Figma APIs, UI handles presentation logic
- **Centralized Storage**: Single utility manages all clientStorage operations with validation
- **Observability First**: Comprehensive error tracking and analytics integration
- **Memory Efficiency**: Proper cleanup patterns and singleton utilities

#### **Component Responsibilities**

**FormView.js** (Primary gating component):
- Contains all countdown state and rendering logic
- Handles form submission with license gate checks
- Manages countdown timer and analog chronometer
- Renders either form or countdown based on `showingCountdown` state
- Supports both UI-initiated and direct (menu) countdowns via callback parameter
- Imports and displays AnalogChronometer component

**Core.js** (Figma API Layer):
- Manages all Figma Canvas and Storage APIs exclusively
- Handles license storage using centralized Storage utility
- Implements command gating with `ensureDirectCommandGate`
- Includes license data in all initialization messages
- Processes license activation/removal via postMessage

**App.js** (Data Orchestration):
- Receives initialization data from Core.js including license status
- Stores license and preferences in component state
- Passes data to child components via HTML attributes
- Handles direct countdown coordination for menu commands
- Manages view routing and component lifecycle

**FormView.js** (Primary UI & Gating):
- Embedded countdown state within main form interface
- Receives license data via props from App.js
- Manages countdown timer and analog chronometer display
- Handles both UI-initiated and menu-triggered countdowns
- Updates license cache directly from props

**LicenseView.js** (License Management):
- Dual-state rendering: activation form vs license info display
- Receives current license data via props from App.js
- Integrates with Gumroad API for license verification
- Manages license activation and device unlinking
- Provides user support and troubleshooting access

**AnalogChronometer.js** (Visual countdown):
- Animated analog clock with red needle
- Dynamic tick generation based on total seconds
- Attribute-based updates (`total-seconds`, `current-seconds`)
- Clean white circle design with red accents

#### **Storage Architecture**

**Centralized Storage Utility** (`src/utils/Storage.js`):
- Constructor-based singleton pattern initialized from Core.js
- Map-based key validation prevents runtime errors
- Automatic error tracking for all storage operations
- Promise-based API using then/catch for compatibility
- Batch operations (getMultiple/setMultiple) for efficiency

**Storage Key Management**:
```javascript
// Defined in Core.js
const STORAGE_KEYS = {
    UUID: 'UUID',
    PREFERENCES: 'preferences',
    LICENSE_V1: 'LICENSE_V1',
    AD_LAST_SHOWN_DATE: 'AD_LAST_SHOWN_DATE',
    AD_LAST_SHOWN_IMPRESSION: 'AD_LAST_SHOWN_IMPRESSION'
}

// Usage throughout application
Storage.get(Storage.getKey('LICENSE_V1'))
Storage.set(Storage.getKey('UUID'), value)
```

**Error Tracking Integration**:
All storage failures automatically emit tracking events:
```javascript
{
    type: 'tracking-event',
    event: 'storage-operation-failed',
    properties: {
        operation: 'get|set|remove',
        key: 'LICENSE_V1',
        error: 'Detailed error message',
        timestamp: Date.now()
    }
}
```

#### **Data Flow Architecture**

**Initialization Flow**:
```
Core.js → Storage.getMultiple() → Include in init messages → App.js → Props → Components
```

**License Activation Flow**:
```
LicenseView → Gumroad API → activateLicense() → Core.js → Storage.set() → Cache Update
```

**Command Execution Flow**:
```
User Action → Gate Check → [Licensed: Execute] | [Unlicensed: Countdown → Manual Execute]
```

#### **Gating Implementation**
1. **User triggers command** (UI form or menu)
2. **License check** via cached status in `shouldShowCountdown()`
3. **Licensed path**: Execute command immediately
4. **Unlicensed path**: 
   - FormView shows countdown state (embedded in current view)
   - User remains on current tab throughout countdown
   - After countdown completion: "Run Now" button enables
   - Manual execution trigger required

#### **Menu Command Integration**
- Core.js wraps all menu commands with `ensureDirectCommandGate`
- Shows UI and includes license data in `init-direct` message
- App.js coordinates FormView countdown with execution callback
- Licensed users bypass countdown entirely with immediate execution

---

### Gumroad Integration (Client + Netlify Proxy)

#### **Product Setup**
- One-time product on Gumroad with Software Licensing enabled
- 2-device usage limit per license
- OAuth access token stored in `secrets.json` (server-side only)

#### **License Verification**
- **Endpoint**: `POST https://api.gumroad.com/v2/licenses/verify`
- **Client-side call** with form-encoded body:
  - `product_id`: Gumroad product ID  
  - `license_key`: user-entered license key
  - `increment_uses_count`: 'true' (for activation)
- **Validation criteria**:
  - `success === true`
  - `purchase.refunded !== true`
  - `purchase.chargebacked !== true`
  - `uses < 2` (2-device limit)

#### **Usage Count Management**
- **Increment**: Done during license verification (`increment_uses_count: 'true'`)
- **Decrement**: Via Netlify Function proxy at `https://figma-plugins-display-network.netlify.app/api/licenses/decrement_uses_count`
  - **Method**: PUT with JSON body
  - **Auth**: Server-side OAuth token (secure)
  - **Used for**: License unlinking to free up device slots

#### **Local Storage Schema**
- **Key**: `LICENSE_V1` in `figma.clientStorage`
- **Value**:
  ```json
  {
    "licensed": true,
    "productId": "string",
    "licenseKeyHash": "string",
    "deviceId": "string", 
    "activatedAt": 1234567890,
    "purchase": {
      "email": "user@example.com",
      "id": "purchase_id"
    },
    "uses": 1
  }
  ```

---

### Network Access & Security

#### **Manifest Configuration**
```json
{
  "networkAccess": {
    "allowedDomains": [
      "https://api.gumroad.com",
      "https://*.amplitude.com", 
      "https://figma-plugins-display-network.netlify.app/"
    ]
  }
}
```

#### **Security Measures**
- OAuth access token never exposed to client-side code
- License keys hashed before storage (`hashLicenseKey` function)
- Sensitive API calls proxied through Netlify Functions
- 2-device limit prevents unlimited license sharing

---

### UI/UX Implementation Details

#### **Countdown Visual Design**
- **Container**: Centered layout within FormView, maintains "Actions" tab active state
- **Analog Chronometer**: White circle, red needle, dynamic ticks for each second
- **Digital Timer**: Tabular numbers, positioned over chronometer  
- **Buttons**: "Run Now" (disabled until complete), "Get Super Tidy Pro" (always enabled)
- **Copy**: "Get Super Tidy Pro to skip the countdown" with lifetime purchase messaging

#### **License Tab**
- **Unlicensed State**: Input field, "Activate" button, validation messaging
- **Licensed State**: License info display, device usage counter, "Unlink License" button
- **Support**: Link to Google Form for assistance

#### **Navigation Behavior**
- Countdown embedded in FormView keeps user on "Actions" tab
- No "ghost screen" - user always sees familiar navigation
- License tab accessible during countdown for immediate activation

---

### Implementation History & Lessons Learned

#### **Architecture Evolution**
1. **Initial**: Countdown as separate route with Router navigation
2. **Refined**: Gating moved from Core.js to FormView.js for clean separation
3. **Final**: Countdown embedded within FormView as state, not separate route
4. **Latest**: Removed Router dependency, App.js directly calls FormView countdown methods

#### **API Integration Challenges**
1. **Gumroad CORS**: Client-side `decrement_uses_count` blocked by security policies
2. **Solution**: Netlify Function proxy for authenticated endpoints
3. **Content-Type**: Some endpoints require `application/x-www-form-urlencoded`

#### **License Storage & Reliability Issues**
1. **Race Conditions**: FormView event listeners were accumulating without cleanup
2. **Data Consistency**: Usage count not properly stored during license activation
3. **Silent Failures**: Storage operations lacked error handling and user feedback
4. **Complex Timeout Patterns**: Duplicated postMessage request/response cycles with timeout cleanup
5. **Memory Leaks**: Event listeners not properly cleaned up in license retrieval
6. **Solution**: Implemented proper event listener cleanup, comprehensive error handling, consistent data format, and eliminated postMessage complexity

#### **Key Technical Decisions**
- **Memory over Storage**: License status cached in `gate.js` for performance
- **Direct Method Calls**: Eliminated internal UI postMessage for simplicity
- **Callback Pattern**: Unified interface for UI and menu-initiated countdowns
- **State Management**: LEO Element data properties for countdown state
- **Event Listener Management**: Proper cleanup to prevent memory leaks and race conditions
- **Error Handling**: Comprehensive error handling for all storage operations with user feedback
- **Centralized Storage**: Storage utility with automatic error tracking and validation
- **Data Down, Events Up**: License data flows from Core → App → Components via props
- **Unidirectional Data Flow**: Eliminated complex postMessage request/response cycles

---

### Current Status (Fully Implemented)

#### **✅ Completed Features**
- [x] Basic countdown with random 6-15s timing
- [x] Embedded countdown within FormView (no separate route)
- [x] Animated analog chronometer with dynamic ticks
- [x] Manual "Run Now" button after countdown completion
- [x] License tab with dual-state rendering
- [x] Gumroad license verification and activation
- [x] ~~2-device usage limit with Netlify Function proxy~~ (Temporarily disabled for easier management)
- [x] License info display ~~and device usage tracking~~ (Device tracking temporarily hidden)
- [x] License unlinking with usage count decrement
- [x] Menu command gating for direct Figma menu access
- [x] License status caching for fast gate decisions
- [x] Clean architecture with proper separation of concerns
- [x] Removed Router dependency for countdown navigation
- [x] Fixed license storage/retrieval race conditions and reliability issues
- [x] Comprehensive error handling with user feedback for all storage operations
- [x] Proper event listener cleanup to prevent memory leaks
- [x] **NEW**: Centralized Storage utility with automatic error tracking
- [x] **NEW**: Eliminated postMessage timeout patterns for license retrieval
- [x] **NEW**: Unidirectional data flow (Core → App → Components)
- [x] **NEW**: Comprehensive storage operation tracking and analytics

#### **✅ Tested Scenarios**
- [x] Licensed user: immediate command execution
- [x] Unlicensed user: countdown → manual execution
- [x] License activation: Gumroad API integration
- [x] Menu commands: gating works from Figma menu
- [x] ~~Device limits: 2-device enforcement~~ (Temporarily disabled)
- [x] License unlinking: usage count decremented
- [x] Error handling: invalid keys, API failures
- [x] License storage reliability: consistent save/load across plugin sessions
- [x] Memory management: no event listener leaks or race conditions
- [x] Error recovery: proper user feedback for storage failures
- [x] **NEW**: Storage error tracking and analytics integration
- [x] **NEW**: License data propagation through init messages
- [x] **NEW**: Props-based license data flow without postMessage complexity

#### **🎯 Production Ready**
The countdown monetization system is fully implemented and functional, with:
- Clean user experience (no ghost screens, embedded countdown)
- Robust and reliable license management with comprehensive error handling
- Secure API integration via Netlify proxy
- Proper error handling and edge cases with user feedback
- Analytics integration (Amplitude)
- Professional UI/UX matching plugin design system
- Memory-efficient architecture with proper cleanup
- Consistent license storage/retrieval across all scenarios

---

### Deployment Checklist

#### **Pre-Release**
- [ ] Test with real Gumroad product and licenses
- [ ] Verify Netlify Function deployment and access token
- [ ] Confirm analytics tracking for conversion funnel
- [ ] Test edge cases: offline, invalid keys, API timeouts

#### **Release Notes**
- Introduce Super Tidy Pro with one-time license purchase
- 2-device usage limit per license
- Countdown for free users with manual execution
- Dedicated license management tab
- Seamless experience for licensed users

#### **Support Documentation**
- Purchase flow: Gumroad → license key → activation
- Device management: viewing usage, unlinking devices
- Troubleshooting: invalid keys, usage limits, API errors
- Contact: Google Form for license support

---

### Development Best Practices

#### **Storage Operations**
- Always use centralized Storage utility with key validation
- Handle both success and failure cases with user feedback
- Use batch operations for related data updates
- Initialize all keys in Core.js, avoid hardcoded strings

#### **Data Flow Patterns**
- Prefer "data down, events up" architecture
- Include data in initialization messages rather than separate requests
- Use component props/attributes instead of complex postMessage cycles
- Maintain single source of truth for application state

#### **Error Handling & Observability**
- Emit tracking events for all error conditions
- Provide specific, actionable error messages to users
- Log contextual information for effective debugging
- Distinguish between recoverable and fatal error types

#### **Memory & Performance**
- Clean up event listeners in component lifecycle methods
- Use singleton patterns to prevent resource duplication
- Prefer direct method calls over complex async coordination
- Implement proper component cleanup patterns

#### **Code Organization**
- Separate Figma API operations from UI logic
- Create reusable utilities for common patterns
- Use constructor-based classes for stateful services
- Implement comprehensive input validation with clear error messages

---

### Implementation Phases

#### **Phase 1: Core Infrastructure**
- Centralized Storage utility implementation with key validation
- Basic countdown timer and gating logic
- License data flow architecture via props
- Error tracking and analytics integration

#### **Phase 2: Gumroad Integration**
- License verification API integration
- Secure key management and hashing
- Purchase flow and activation process
- Device management capabilities

#### **Phase 3: User Experience Polish**
- Analog chronometer animation implementation
- Visual design and interaction refinement
- Comprehensive error handling and user messaging
- Performance optimization and testing

#### **Phase 4: Analytics & Optimization**
- Conversion funnel implementation
- A/B testing framework setup
- Performance monitoring and alerting
- User feedback collection and analysis

### Testing Strategy

#### **Automated Testing**
- Unit tests for Storage utility and core functions
- Integration tests for license verification flow
- Performance tests for countdown and activation timing
- Error scenario testing for network and storage failures

#### **Manual Testing Scenarios**
- Licensed user: instant command execution across all entry points
- Unlicensed user: countdown completion and manual execution
- License activation: Gumroad integration and key validation
- Menu commands: gating functionality from Figma menu
- Error recovery: invalid keys, network failures, storage issues

#### **User Acceptance Testing**
- Conversion flow optimization and usability
- User interface accessibility and cross-platform compatibility
- Performance under various system conditions
- Edge case handling and error recovery

---

### Future Enhancements

#### **Advanced Features**
- Server-side license validation for enhanced security
- Team license management and bulk operations
- License transfer capabilities between devices
- Advanced usage analytics and reporting
- Multiple license tiers and feature sets

#### **Technical Improvements**
- Automated testing framework expansion
- Performance optimization for large selections
- Modern framework migration considerations
- Enhanced retry mechanisms for critical operations
- Storage integrity verification systems

#### **Business Expansion**
- Subscription model exploration
- Partner integration opportunities
- International market expansion
- Advanced conversion optimization

### Success Metrics

#### **Primary KPIs**
- License conversion rate from free to premium users
- User retention and engagement metrics
- Revenue per user and lifetime value
- Customer satisfaction and support efficiency

#### **Technical KPIs**
- System uptime and reliability metrics
- License activation success rate
- Storage operation performance and error rates
- User experience quality indicators

---

### References & Resources
- **LEO UI Library**: https://github.com/basiclines/leo
- **Gumroad API Documentation**: https://gumroad.com/api#verify-license-key  
- **Netlify Functions**: https://docs.netlify.com/functions/overview/
- **Figma Plugin API**: https://www.figma.com/plugin-docs/
- **Project Repository**: Private - contact for access