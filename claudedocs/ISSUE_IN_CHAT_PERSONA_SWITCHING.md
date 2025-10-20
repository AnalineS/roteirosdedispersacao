# Feature Request: In-Chat Persona Switching Functionality

## Title
Add In-Chat Persona Switching to Enable Mid-Conversation Assistant Changes

---

## Problem Statement

**Current Architecture Limitation**: Persona selection occurs exclusively on the home page (`/`). Once a user navigates to `/chat`, no UI component exists to switch between Dr. Gasnelio (technical) and Gá (empathetic) personas.

**Playwright Test Failures**: 7 out of 8 medical validation tests fail with:
```
Error: Persona selector not found on page
  at switchPersona (staging-medical-validation.spec.ts:226:11)
```

**Test Expectation**: Tests attempt to call `switchPersona(page, "Dr. Gasnelio")` which searches for `[data-testid="persona-selector"]` - this element does not exist in the chat interface.

**User Impact**:
- Users must navigate back to home page to change personas
- Conversation context is lost when switching personas
- No ability to get different expertise perspectives on the same medical question
- Workflow interruption reduces educational platform effectiveness

---

## User Story

**As a** healthcare professional or patient using the hanseníase medication dispensing platform
**I want to** switch between Dr. Gasnelio and Gá personas during an active chat conversation
**So that** I can obtain both technical/scientific and empathetic/patient-friendly perspectives on my medical questions without losing conversation context

### Scenarios

**Scenario 1: Professional Seeking Patient-Friendly Explanation**
- Healthcare worker consults Dr. Gasnelio for technical dosing protocol
- Receives scientific response with citations
- Needs to explain the same information to a patient
- Switches to Gá to get simplified, empathetic explanation
- Uses both responses to educate patient comprehensively

**Scenario 2: Patient Escalating to Technical Details**
- Patient starts with Gá for basic medication information
- Receives empathetic, simplified guidance
- Wants more technical details about drug interactions
- Switches to Dr. Gasnelio for pharmacological specifics
- Returns to Gá for reassurance about side effects

**Scenario 3: Multi-Perspective Medical Query**
- User has complex question requiring both technical accuracy and emotional support
- Switches between personas to build comprehensive understanding
- Conversation history shows both perspectives
- User makes informed decision based on dual viewpoints

---

## Functional Requirements

### FR1: Persona Selector UI Component
- **Location**: Chat page header (persistent, always visible)
- **Component Type**: Toggle switch or dropdown selector
- **Visual Design**:
  - Clear visual distinction between Dr. Gasnelio (blue/technical theme) and Gá (yellow/empathetic theme)
  - Avatar icons for each persona (👨‍⚕️ for Dr. Gasnelio, 💬 for Gá)
  - Current persona highlighted/selected state
  - Mobile-responsive (collapsible on small screens)
- **States**:
  - Default: Shows current active persona
  - Hover: Displays persona name and brief descriptor
  - Loading: Shows loading indicator during switch
  - Disabled: Grayed out when switching in progress

### FR2: Persona Switching Mechanism
- **Interaction Method**: Single click/tap to switch
- **Confirmation**: Optional confirmation dialog for mid-conversation switches (configurable)
- **Switch Timing**: Immediate (no page refresh or navigation)
- **Error Handling**: Display error message if switch fails, maintain current persona
- **Accessibility**: Full keyboard navigation support (Tab, Enter, Space)

### FR3: Conversation Preservation
- **History Integrity**: All previous messages remain unchanged with original persona attribution
- **Message Rendering**: Each message displays which persona provided the response
- **Visual Continuity**: Clear visual indicators show persona changes in conversation flow
- **Retroactive Changes**: NO - previous messages maintain their original persona voice and style

### FR4: Visual Feedback
- **Switch Indicator**: Toast notification or inline message confirming switch
- **Persona Badge**: Each message shows small badge/icon indicating which persona responded
- **Transition Animation**: Smooth visual transition (fade or slide) during switch
- **Loading State**: Spinner or skeleton during persona initialization (max 500ms)

### FR5: Mobile and Desktop Experience
- **Desktop**: Full selector always visible in header
- **Mobile**: Collapsible selector or bottom navigation bar item
- **Responsive Breakpoint**: 768px (existing mobile detection)
- **Touch Optimization**: Touch targets minimum 44x44px (iOS/Android guidelines)
- **Orientation Handling**: Works in both portrait and landscape

---

## Technical Requirements

### TR1: Data-TestID Attributes
**Required for Playwright Tests**:
```typescript
// Main selector container
<div data-testid="persona-selector">
  // Dr. Gasnelio option
  <button data-testid="persona-option-dr_gasnelio">

  // Gá option
  <button data-testid="persona-option-ga">

  // Current selection indicator
  <span data-testid="persona-current-selection">
</div>
```

### TR2: PersonaContext Integration
**State Management**:
- Use existing `PersonaContext` from `contexts/PersonaContext.tsx`
- Call `setPersona(personaId: ValidPersonaId, source: 'explicit')` on switch
- Subscribe to `currentPersona` state for real-time updates
- Leverage existing `useCurrentPersona()` hook

**Code Integration Points**:
```typescript
// apps/frontend-nextjs/src/app/chat/page.tsx
import { useCurrentPersona, usePersonaActions } from '@/contexts/PersonaContext';

const { persona: contextPersona } = useCurrentPersona();
const { setPersona } = usePersonaActions();

const handlePersonaSwitch = async (newPersonaId: ValidPersonaId) => {
  await setPersona(newPersonaId, 'explicit');
  // Update local state if needed
};
```

### TR3: Conversation History Management
**Message Attribution**:
```typescript
// Each message must include persona metadata
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona: 'dr_gasnelio' | 'ga'; // Persona that generated this message
}
```

**Preservation Logic**:
- Do NOT modify `persona` field of existing messages on switch
- New messages use currently selected persona
- Conversation history maintains chronological persona changes

### TR4: Accessibility (WCAG 2.1 AA Compliance)
**Required Attributes**:
```html
<div
  role="radiogroup"
  aria-label="Selecionar assistente virtual"
  data-testid="persona-selector"
>
  <button
    role="radio"
    aria-checked="true"
    aria-label="Dr. Gasnelio - Assistente Técnico"
    data-testid="persona-option-dr_gasnelio"
  >
    <!-- Content -->
  </button>
</div>
```

**Keyboard Support**:
- `Tab`: Navigate to selector
- `Arrow Keys`: Move between persona options
- `Enter/Space`: Activate selection
- `Escape`: Close dropdown (if applicable)

**Screen Reader**:
- Announce current persona on page load
- Announce persona change when switched
- Provide clear labels for each option

### TR5: Performance Requirements
**Switch Completion**: < 500ms from click to confirmation
**No Page Reload**: Pure client-side state management
**Optimistic Updates**: UI updates immediately, API call in background
**Error Recovery**: Rollback to previous persona if switch fails

---

## UX Considerations

### UX1: Switch Availability
**When Users Can Switch**:
- ✅ Always available during active conversation
- ✅ Available when chat is idle (no message being sent)
- ✅ Available in empty conversation (before first message)

**When Users Cannot Switch**:
- ❌ During active message sending/receiving (chatLoading === true)
- ❌ During error states (show disabled state with tooltip)

### UX2: Message History Integrity
**Design Decision**: Preserve conversation authenticity
- Previous messages DO NOT change persona voice retroactively
- Each message maintains original persona's communication style
- Visual indicators clearly show which persona provided each response
- Rationale: Medical accuracy requires preserving original clinical/empathetic context

**Example Conversation**:
```
[Dr. Gasnelio 👨‍⚕️]: "A dose recomendada de rifampicina é 600mg..."
--- User switches to Gá ---
[Gá 💬]: "Para facilitar, vou explicar de forma simples..."
```

### UX3: Switch Warnings (Optional)
**Mid-Complex Query Warning**:
```
⚠️ "Você está no meio de uma pergunta complexa. Deseja trocar de assistente?"
[Continuar com Dr. Gasnelio] [Trocar para Gá]
```

**Trigger Conditions**:
- Input field has > 100 characters
- Last message was follow-up question (< 2 minutes ago)
- Conversation depth > 5 messages

### UX4: Undo Functionality
**Quick Undo**:
- Show "Undo" button for 5 seconds after switch
- Returns to previous persona
- Resets input field to pre-switch state
- Analytics: Track undo rate to improve switching UX

### UX5: Intelligent Suggestions
**Persona Switch Recommendations**:
- System suggests switching when question type doesn't match current persona
- Example: Technical pharmacology question asked to Gá → Suggest Dr. Gasnelio
- Uses existing `useIntelligentRouting` hook
- Non-intrusive: Small suggestion badge, user decides

---

## Medical/Educational Constraints

### MC1: PCDT Hanseníase 2022 Compliance
**Medical Accuracy Preservation**:
- Both personas must maintain PCDT guideline compliance
- Technical information from Dr. Gasnelio must match protocol specifications
- Gá must simplify without losing medical accuracy
- No persona switch should compromise medication safety information

### MC2: LGPD Data Protection
**Privacy During Switches**:
- Conversation history with PII remains encrypted
- Persona metadata does NOT include user health data
- Switch events logged for analytics without PII
- User consent covers both personas equally

**Implementation**:
```typescript
// Log persona switch without PII
trackEvent('persona_switch', {
  from: 'dr_gasnelio',
  to: 'ga',
  timestamp: Date.now(),
  // NO user_id, NO message_content, NO health_data
});
```

### MC3: User Journey Continuity
**Educational Flow**:
- Persona switches should enhance learning, not disrupt it
- Maintain conversation context for clinical scenarios
- Support comparative learning (technical vs empathetic explanations)
- Enable users to build comprehensive understanding

---

## Acceptance Criteria

### AC1: Playwright Tests Pass
- [x] `switchPersona(page, "Dr. Gasnelio")` function locates selector
- [x] `[data-testid="persona-selector"]` exists on chat page
- [x] Can programmatically switch between all personas
- [x] Switch completes within 500ms
- [x] All 8 medical validation tests pass

### AC2: Functional Requirements Met
- [x] Persona selector visible in chat page header
- [x] Can switch from Dr. Gasnelio to Gá (and vice versa)
- [x] Conversation history preserved after switch
- [x] New messages use newly selected persona
- [x] Previous messages maintain original persona attribution

### AC3: Visual Feedback
- [x] Current persona clearly indicated (visual highlight)
- [x] Switch confirmation shown (toast or message)
- [x] Loading state displayed during switch (< 500ms)
- [x] Each message shows persona badge/icon
- [x] Mobile responsive (works on 320px - 1920px screens)

### AC4: Accessibility Validated
- [x] WCAG 2.1 AA compliance verified
- [x] Keyboard navigation functional (Tab, Enter, Arrows)
- [x] Screen reader announces current persona
- [x] Screen reader announces persona changes
- [x] Focus indicators visible (3px solid outline)
- [x] Color contrast meets 4.5:1 minimum

### AC5: Performance Benchmarks
- [x] Switch completes in < 500ms (measured from click to UI update)
- [x] No page reload or navigation
- [x] UI remains responsive during switch
- [x] Works under load (concurrent users, slow connections)

### AC6: Error Handling
- [x] Failed switch shows error message to user
- [x] Failed switch maintains current persona (no broken state)
- [x] Network errors handled gracefully
- [x] Error logged for debugging (with ErrorMonitorService)

### AC7: Medical Compliance
- [x] Both personas provide PCDT-compliant information
- [x] No medical accuracy loss during switches
- [x] Conversation integrity maintained for clinical review
- [x] LGPD compliance verified (no PII in switch events)

---

## Technical Implementation Notes

### Files to Modify

**1. Chat Page Component**
```
apps/frontend-nextjs/src/app/chat/page.tsx
```
Changes:
- Import persona selector component
- Pass persona state and switch handler
- Integrate with existing PersonaContext

**2. Create New Component**
```
apps/frontend-nextjs/src/components/chat/PersonaSwitcher.tsx
```
Contents:
- Toggle or dropdown UI
- Data-testid attributes for Playwright
- Accessibility attributes
- Mobile responsive design
- Loading states

**3. ModernChatContainer Integration**
```
apps/frontend-nextjs/src/components/chat/modern/ModernChatContainer.tsx
```
Changes:
- Accept persona switcher as prop or render internally
- Display persona badge on each message
- Handle loading states during switch

**4. PersonaContext Enhancement** (Optional)
```
apps/frontend-nextjs/src/contexts/PersonaContext.tsx
```
Potential additions:
- `switchHistory` tracking (who switched when)
- `canSwitch()` method for validation
- Switch analytics events

### Component Structure Proposal

```typescript
// PersonaSwitcher.tsx
interface PersonaSwitcherProps {
  currentPersona: ValidPersonaId | null;
  personas: Record<string, PersonaConfig>;
  onSwitch: (personaId: ValidPersonaId) => Promise<void>;
  disabled?: boolean;
  variant?: 'header' | 'inline' | 'mobile';
}

export default function PersonaSwitcher({
  currentPersona,
  personas,
  onSwitch,
  disabled = false,
  variant = 'header'
}: PersonaSwitcherProps) {
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitch = async (newPersonaId: ValidPersonaId) => {
    if (isSwitching || disabled) return;

    setIsSwitching(true);
    try {
      await onSwitch(newPersonaId);
      // Show success feedback
    } catch (error) {
      // Show error feedback
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div
      data-testid="persona-selector"
      role="radiogroup"
      aria-label="Selecionar assistente virtual"
    >
      {Object.entries(personas).map(([id, config]) => (
        <button
          key={id}
          data-testid={`persona-option-${id}`}
          role="radio"
          aria-checked={id === currentPersona}
          onClick={() => handleSwitch(id as ValidPersonaId)}
          disabled={isSwitching || disabled}
        >
          {/* Persona UI */}
        </button>
      ))}
    </div>
  );
}
```

### Conversation History Rendering

```typescript
// Message component update
interface MessageProps {
  message: ChatMessage;
  personas: Record<string, PersonaConfig>;
}

function Message({ message, personas }: MessageProps) {
  const personaConfig = personas[message.persona];

  return (
    <div className={`message ${message.role}`}>
      {message.role === 'assistant' && (
        <div className="persona-badge" aria-label={`Resposta de ${personaConfig.name}`}>
          {personaConfig.avatar} {personaConfig.name}
        </div>
      )}
      <div className="message-content">
        {message.content}
      </div>
    </div>
  );
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// PersonaSwitcher.test.tsx
describe('PersonaSwitcher', () => {
  it('renders all available personas', () => {});
  it('highlights current persona', () => {});
  it('calls onSwitch when persona clicked', () => {});
  it('disables during loading', () => {});
  it('shows error message on switch failure', () => {});
  it('has correct data-testid attributes', () => {});
});
```

### Integration Tests
```typescript
// chat-page.test.tsx
describe('Chat Page Persona Switching', () => {
  it('preserves conversation history on switch', () => {});
  it('updates PersonaContext on switch', () => {});
  it('new messages use new persona', () => {});
  it('maintains old messages with original persona', () => {});
});
```

### E2E Tests (Playwright)
```typescript
// Update existing staging-medical-validation.spec.ts
test('Persona switching in chat interface', async ({ page }) => {
  await page.goto('/chat');

  // Verify selector exists
  const selector = page.locator('[data-testid="persona-selector"]');
  await expect(selector).toBeVisible();

  // Switch to Dr. Gasnelio
  await switchPersona(page, 'Dr. Gasnelio');
  await expect(page.locator('[data-testid="persona-current-selection"]'))
    .toContainText('Dr. Gasnelio');

  // Send message
  await sendMessage(page, 'Qual a dose de rifampicina?');

  // Verify response from Dr. Gasnelio
  const response = page.locator('[data-testid*="message"]').last();
  await expect(response).toContainText('600mg');

  // Switch to Gá
  await switchPersona(page, 'Gá');

  // Verify previous message still shows Dr. Gasnelio attribution
  await expect(response).toHaveAttribute('data-persona', 'dr_gasnelio');

  // New message uses Gá
  await sendMessage(page, 'Explique de forma simples');
  const newResponse = page.locator('[data-testid*="message"]').last();
  await expect(newResponse).toHaveAttribute('data-persona', 'ga');
});
```

### Accessibility Tests
```typescript
// a11y.test.tsx
describe('PersonaSwitcher Accessibility', () => {
  it('has proper ARIA roles', () => {});
  it('announces current persona to screen readers', () => {});
  it('announces persona changes', () => {});
  it('supports keyboard navigation', () => {});
  it('has visible focus indicators', () => {});
  it('meets color contrast requirements', () => {});
});
```

---

## Technical Debt Considerations

### Current Architecture
**PersonaContext Structure**: Already supports dynamic persona changes via `setPersona(personaId, source)`. No refactoring needed.

**ModernChatContainer Location**: Currently at `src/components/chat/modern/ModernChatContainer.tsx`. Selector component can be integrated without structural changes.

**Conversation History**: Uses `useConversationHistory` hook which stores messages with persona metadata. Already supports multi-persona conversations.

**Intelligent Routing System**: Existing `useIntelligentRouting` hook can suggest persona switches based on question analysis. Integration point ready.

### Minimal Technical Debt Added
- One new component: `PersonaSwitcher.tsx` (~200 lines)
- Minor updates to `chat/page.tsx` (add switcher, ~20 lines)
- Message rendering update to show persona badges (~30 lines)
- Playwright test helper update (~10 lines)
- Total LOC added: ~260 lines

### Future Enhancement Opportunities
- **Smart Suggestions**: Auto-suggest persona switch based on question complexity
- **Switch Analytics**: Track switch patterns to improve persona design
- **Conversation Branching**: Create alternate conversation branches with different personas
- **Comparison View**: Side-by-side view of both persona responses to same question

---

## Labels

- `feature`
- `enhancement`
- `ux`
- `accessibility`
- `testing`
- `playwright`
- `medical-compliance`
- `lgpd`
- `priority-high`

---

## Success Metrics

**Test Coverage**:
- 8/8 Playwright medical validation tests passing
- 100% accessibility compliance (WCAG 2.1 AA)
- < 500ms switch completion time

**User Adoption**:
- % of users who switch personas mid-conversation (target: > 20%)
- Average switches per conversation (baseline metric)
- Undo rate (target: < 5% - indicates good UX)

**Medical Quality**:
- PCDT compliance maintained: 100%
- Medical accuracy preserved in both personas: 100%
- User satisfaction with dual perspectives (survey metric)

---

## Dependencies

**Required Before Implementation**:
- None (all dependencies already in place)

**Blocked By**:
- None

**Blocks**:
- Advanced persona recommendation features
- Multi-persona conversation analytics
- Conversation branching features

---

## Estimated Effort

**Development**: 2-3 days
- Component creation: 4 hours
- Integration: 4 hours
- Testing: 8 hours
- Documentation: 2 hours

**QA/Testing**: 1 day
- Playwright test updates: 2 hours
- Accessibility validation: 2 hours
- Manual testing (mobile/desktop): 4 hours

**Total**: 3-4 days

---

## Priority Justification

**HIGH PRIORITY** because:

1. **Test Failures**: 7/8 Playwright tests currently failing - blocks CI/CD pipeline
2. **User Experience**: Major workflow interruption requiring navigation away from chat
3. **Educational Value**: Platform's core value is dual-perspective learning
4. **Medical Compliance**: Users need both technical accuracy and empathetic support
5. **Low Complexity**: Clear requirements, minimal technical debt, existing infrastructure ready

---

## Related Issues

- None currently

---

## References

- Playwright Test Suite: `apps/frontend-nextjs/tests/playwright/staging-medical-validation.spec.ts`
- Chat Page: `apps/frontend-nextjs/src/app/chat/page.tsx`
- PersonaContext: `apps/frontend-nextjs/src/contexts/PersonaContext.tsx`
- Home Persona Selector: `apps/frontend-nextjs/src/components/home/PersonaSelector.tsx`
- PCDT Hanseníase 2022 Guidelines: `data/knowledge_base/`

---

## Questions for Discussion

1. **Switch Confirmation**: Should we show confirmation dialog for all switches or only mid-complex conversations?
2. **Visual Design**: Prefer toggle switch (binary choice) or dropdown (extensible for future personas)?
3. **Mobile Placement**: Header (always visible) or bottom navigation (thumb-friendly)?
4. **Undo Duration**: 5 seconds sufficient for undo window?
5. **Smart Suggestions**: Auto-suggest switches or wait for user initiative?

---

**Created**: 2025-10-05
**Status**: Proposed
**Assignee**: TBD
**Milestone**: TBD
