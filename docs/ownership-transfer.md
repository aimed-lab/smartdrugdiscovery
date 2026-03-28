# Ownership Transfer

Transferring platform ownership is a high-stakes, irreversible operation once confirmed. SmartDrugDiscovery enforces a **mandatory 24-hour cooling-off period** between initiating a transfer and completing it. This gives the current Owner time to reconsider, correct a mistake, or resist social pressure.

---

## Why the 24-Hour Delay?

- **Prevents accidents.** Mistyping an email or clicking the wrong button cannot instantly hand over the organisation.
- **Allows reversal.** If the transfer was initiated under duress or in error, the Owner has a full day to cancel it.
- **Creates an audit trail.** The initiation timestamp, recipient, and cancellation (if any) are all recorded in the audit log.

---

## Step-by-Step Process

### 1. Navigate to Settings

Go to **Settings** (bottom-left of the sidebar) and open the **Profile** tab.

### 2. Locate the Transfer Ownership Section

Scroll to the **Transfer Ownership** section near the bottom of the Profile tab. This section is only visible to the current Owner.

### 3. Enter the Recipient's Email

Type the email address of the intended new Owner. This must be a valid email address. The recipient does not need to already have an account — if they are not in the system, they will receive an invitation email.

### 4. Click "Initiate Transfer"

A confirmation dialog appears summarising:

- The recipient's email address
- A plain-language explanation that the transfer will become permanent after 24 hours
- A reminder that you (the current Owner) will become an Admin

Confirm by clicking **"Yes, initiate transfer"** in the dialog.

### 5. The 24-Hour Countdown Begins

After confirmation:

- The platform records the initiation timestamp.
- The recipient receives an email notifying them that a transfer has been initiated on their behalf.
- A banner appears in Settings showing the countdown and a **Cancel Transfer** button.
- The current Owner retains full Owner permissions throughout the cooling-off period.

---

## During the Cooling-Off Period

| What is true | What is not yet true |
|---|---|
| Current Owner retains all permissions | Recipient has not gained any new permissions |
| Transfer can be cancelled at any time | Transfer is not final |
| Recipient receives email notification | Recipient does not need to accept — it is automatic |
| Audit log records the pending transfer | No role changes have occurred |

To cancel: return to **Settings → Profile → Transfer Ownership** and click **Cancel Transfer**. The transfer is immediately voided, no role changes occur, and the audit log records the cancellation.

---

## Completion (After 24 Hours)

Once the 24-hour window elapses:

1. The recipient is automatically promoted to **Owner**.
2. The initiating Owner is automatically demoted to **Admin**.
3. Both parties receive an email confirming the completed transfer.
4. The audit log records the completion timestamp and both role changes.

No further action is required from either party for completion to occur.

---

## Edge Cases

### Recipient email not yet in the system

If the recipient does not have a SmartDrugDiscovery account, they receive an invitation email with a sign-up link. The transfer will complete 24 hours after initiation regardless — if the recipient has not signed up by then, their account is created automatically using the invite code with the Owner role applied immediately.

### Recipient declines

There is no explicit "accept/decline" flow — the transfer is automatic. If the intended recipient does not want the role, they must contact the current Owner to cancel before the 24 hours elapse, or they can manually transfer ownership back to the original Owner after completion.

### Current Owner cancels

The current Owner can cancel at any time during the 24-hour window using the **Cancel Transfer** button in Settings. After cancellation, no role changes occur.

### What if the Owner loses access to their account during the window?

Contact the UAB Systems Pharmacology AI Research Center support team. Platform administrators with server access can void a pending transfer by resetting the transfer record directly.

---

## After Completion: No Automatic Rollback

Once the transfer is complete, there is no built-in rollback mechanism. The new Owner would need to manually initiate a fresh ownership transfer back to the original Owner, which again requires a 24-hour cooling-off period.

If an erroneous transfer has completed, act quickly: have the new Owner immediately initiate a reverse transfer.

---

## Related

- [Roles and Permissions](roles-and-permissions.md) — full RBAC documentation including Owner role protection rules
