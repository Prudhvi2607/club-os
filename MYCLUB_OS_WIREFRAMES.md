# myclub-os — Wireframes

## Navigation Structure

**Member sidebar:** Dashboard, My Team, My Fees, Documents, Profile
**Board sidebar:** Dashboard, Members, Seasons, Teams, Fees, Payments, Announcements, Tournaments, Documents
**Top bar:** app name left, user avatar + logout right

---

## Screen 1 — Login

```
┌─────────────────────────────────┐
│           myclub-os             │
│    The OS for Amateur Clubs     │
│                                 │
│   [ Sign in with Google ]       │
│                                 │
│   Email: [________________]     │
│   [ Send Magic Link ]           │
└─────────────────────────────────┘
```
- Google = primary login
- Magic link = passwordless email fallback (type email → get link → click → logged in)

---

## Screen 2 — Member Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Hey Prudhvi — Cincinnati Cricket Club      │
│  My Team       │                                             │
│  My Fees       │  [BANNER: 2025 Season is open — are you in?]│
│  Documents     │                      [Register Now]         │
│  Profile       │                                             │
│                │  ┌──────────────┐  ┌──────────────┐        │
│                │  │ Season       │  │ My Team      │        │
│                │  │ 2025 Active  │  │ CC1          │        │
│                │  └──────────────┘  └──────────────┘        │
│                │                                             │
│                │  Fees Due                                   │
│                │  ┌──────────────────────────────────────┐  │
│                │  │ Membership Fee    $150  [View Details]│  │
│                │  └──────────────────────────────────────┘  │
│                │                                             │
│                │  Latest Announcements                       │
│                │  ┌──────────────────────────────────────┐  │
│                │  │ Practice this Saturday — Apr 12       │  │
│                │  │ Jersey orders due by Apr 20           │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- Registration banner shows only when season is open and member hasn't registered yet
- Banner also triggered via email invite from board

---

## Screen 3 — My Team

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  My Team — Cincinnati CC1  (2025 Season)   │
│  My Team       │                                             │
│  My Fees       │  Captain: Rahul S.   Vice Captain: Anil K. │
│  Documents     │                                             │
│  Profile       │  ┌──────────────────────────────────────┐  │
│                │  │ #   Name           Playing Role       │  │
│                │  │ 1   Prudhvi V.     Allrounder         │  │
│                │  │ 2   Rahul S.       Batter             │  │
│                │  │ 3   Anil K.        Bowler             │  │
│                │  │ 4   Kiran M.       Wicket Keeper      │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- Read-only for members
- Playing role = batter / bowler / allrounder / wicket keeper (set on profile)

---

## Screen 4 — My Fees

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  My Fees — 2025 Season                     │
│  My Team       │                                             │
│  My Fees       │  ┌──────────────────────────────────────┐  │
│  Documents     │  │ Fee              Amount   Status      │  │
│  Profile       │  │ Membership Fee   $150     Partial     │  │
│                │  │ Jersey Fee       $50      Pending     │  │
│                │  │ Election Reg Fee $10      Paid        │  │
│                │  └──────────────────────────────────────┘  │
│                │                                             │
│                │  Payment History                            │
│                │  ┌──────────────────────────────────────┐  │
│                │  │ Date      Fee              Amount     │  │
│                │  │ Mar 10    Membership Fee   $50  Venmo │  │
│                │  │ Feb 28    Election Reg Fee $10  Zelle │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- Read-only — treasurer records payments on board side

---

## Screen 5 — Season Registration

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Season Registration — 2025 Season         │
│  My Team       │                                             │
│  My Fees       │  ┌───────────┐     ┌───────────┐           │
│  Documents     │  │  I'm In   │     │  I'm Out  │           │
│  Profile       │  └───────────┘     └───────────┘           │
│                │                                             │
│                │  Known Unavailability (optional)            │
│                │  ┌──────────────────────────────────────┐  │
│                │  │ e.g. traveling June 10–25, no night  │  │
│                │  │ games in July...                     │  │
│                │  └──────────────────────────────────────┘  │
│                │                                             │
│                │  Member Type                                │
│                │  ● Regular   ○ Student   ○ Alumni           │
│                │                                             │
│                │  [ Submit ]                                 │
└────────────────┴─────────────────────────────────────────────┘
```
- Reached via email invite OR dashboard banner
- Member type selection drives fee amount (student gets discounted membership fee)

---

## Screen 6 — Documents (member)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Club Documents                            │
│  My Team       │                                             │
│  My Fees       │  Bylaws                                    │
│  Documents     │  Cincinnati CC Bylaws 2024        [View]   │
│  Profile       │                                             │
│                │  Code of Conduct                            │
│                │  Member Code of Conduct           [View]   │
│                │                                             │
│                │  Other                                      │
│                │  Jersey Sizing Guide               [View]  │
└────────────────┴─────────────────────────────────────────────┘
```
- Read-only, grouped by category
- View opens file in new tab (PDF/doc stored in Supabase Storage)

---

## Screen 7 — Profile

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  My Profile                                │
│  My Team       │                                             │
│  My Fees       │  [Avatar]  Prudhvi V. — Cincinnati CC      │
│  Documents     │                                             │
│  Profile       │  Full Name      Prudhvi V.        [Edit]   │
│                │  Phone          +1 513-xxx-xxxx   [Edit]   │
│                │  Email          prudhvi@...   (from Google) │
│                │  Playing Role   Allrounder        [Edit]   │
│                │                                             │
│                │  Student Details  (students only)           │
│                │  Student ID     UC123456          [Edit]   │
│                │  Student Email  prudhvi@uc.edu    [Edit]   │
│                │  Program        MS Comp Sci, UC   [Edit]   │
│                │                                             │
│                │  Emergency Contact                         │
│                │  Name           Jane V.           [Edit]   │
│                │  Phone          +1 513-xxx-xxxx   [Edit]   │
│                │  Relationship   Spouse            [Edit]   │
│                │                                             │
│                │  [ Save ]                                   │
└────────────────┴─────────────────────────────────────────────┘
```
- Email read-only (from Google)
- Student Details section only visible if member type = student
- Avatar from Google, not editable in MVP

---

## Screen 8 — Member Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Member Management          [+ Add Member] │
│  Members       │                                             │
│  Seasons       │  Search: [____________]  Filter: [All ▾]   │
│  Teams         │                                             │
│  Fees          │  ┌──────────────────────────────────────┐  │
│  Payments      │  │ Name        Role     Status  Actions  │  │
│  Announcements │  │ Prudhvi V.  Board    Active  [View]   │  │
│  Tournaments   │  │ Rahul S.    Captain  Active  [View]   │  │
│  Documents     │  │ Anil K.     Member   Active  [View]   │  │
│                │  │ Kiran M.    Member   Inactive[View]   │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- [+ Add Member] → board enters name + email → system sends Supabase Auth invite link
- Works for mid-season additions too
- [View] opens member detail: edit role/status, view their fees

---

## Screen 9 — Season Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Season Management        [+ New Season]   │
│  Members       │                                             │
│  Seasons       │  2025 Season   Active    [View]            │
│  Teams         │  2024 Season   Completed [View]            │
│  Fees          │                                             │
│  Payments      │  2025 Season Detail                        │
│  Announcements │  ┌──────────────────────────────────────┐  │
│  Tournaments   │  │ Name       Type     Status   Notes   │  │
│  Documents     │  │ Prudhvi V. Regular  Active   –       │  │
│                │  │ Rahul S.   Regular  Active   Jun away│  │
│                │  │ Anil K.    Student  Pending  –       │  │
│                │  └──────────────────────────────────────┘  │
│                │                                             │
│                │  [Open Registration]  [Close Registration]  │
└────────────────┴─────────────────────────────────────────────┘
```
- Opening registration triggers email to all active members
- Board sees each member's availability notes

---

## Screen 10 — Team Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Team Management              [+ New Team] │
│  Members       │                                             │
│  Seasons       │  Season: [2025 ▾]                          │
│  Teams         │                                             │
│  Fees          │  ┌─────────────────┐ ┌─────────────────┐   │
│  Payments      │  │ Cincinnati CC1  │ │ Cincinnati CC2  │   │
│  Announcements │  │ Rahul S. (C)    │ │ Anil K. (C)    │   │
│  Tournaments   │  │ Anil K. (VC)    │ │ Suresh P. (VC) │   │
│  Documents     │  │ Prudhvi V.      │ │ Kiran M.       │   │
│                │  │ ...             │ │ ...            │   │
│                │  │ [+ Add Player]  │ │ [+ Add Player] │   │
│                │  └─────────────────┘ └─────────────────┘   │
│                │                                             │
│                │  Unassigned Players (3)                     │
│                │  Suresh P.  Vikram R.  Deepak M.           │
└────────────────┴─────────────────────────────────────────────┘
```
- Season dropdown — team assignments are per season
- Unassigned = registered for season but not on a team yet
- Mid-season moves tracked with history (removed_at timestamp)

---

## Screen 11 — Fee Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Fee Management            [+ New Fee Type]│
│  Members       │                                             │
│  Seasons       │  Season: [2025 ▾]                          │
│  Teams         │                                             │
│  Fees          │  ┌──────────────────────────────────────┐  │
│  Payments      │  │ Fee Type        Amount  Student Install│  │
│  Announcements │  │ Membership Fee  $200    $150    Yes  │  │
│  Tournaments   │  │  [Assign to All]   [Assign to Members]│  │
│  Documents     │  │ Jersey Fee      $50     $50     No   │  │
│                │  │  [Assign to All]   [Assign to Members]│  │
│                │  │ Election Reg    $10     $10     No   │  │
│                │  │  [Assign to All]   [Assign to Members]│  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- Assign to All = one click for mandatory fees (membership)
- Assign to Members = checklist for opt-in fees (jersey)
- Student amount auto-applies to members registered as students

---

## Screen 12 — Payment Tracker (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Payment Tracker                           │
│  Members       │                                             │
│  Seasons       │  Season: [2025 ▾]   Fee: [All ▾]           │
│  Teams         │                                             │
│  Fees          │  ┌──────────────────────────────────────┐  │
│  Payments      │  │ Name       Fee        Owed   Status   │  │
│  Announcements │  │ Prudhvi V. Membership $150   Partial  │  │
│  Tournaments   │  │            [Record Payment]           │  │
│  Documents     │  │ Rahul S.   Membership $200   Pending  │  │
│                │  │            [Record Payment]           │  │
│                │  │ Anil K.    Membership $200   Paid     │  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```

Record Payment modal:
```
  ┌────────────────────────────────┐
  │ Record Payment — Rahul S.      │
  │ Membership Fee — $200 due      │
  │                                │
  │ Method:                        │
  │ [Venmo]  [Zelle]  [Cash]       │
  │                                │
  │ Amount: [$200    ]             │
  │ (editable for installments)    │
  │                                │
  │ [Confirm]        [Cancel]      │
  └────────────────────────────────┘
```
- No free text for method — buttons only
- Amount editable for installment payments
- Status auto-computes: partial if amount_paid < amount_due, paid if equal

---

## Screen 13 — Announcements (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Announcements        [+ New Announcement] │
│  Members       │                                             │
│  Seasons       │  ┌──────────────────────────────────────┐  │
│  Teams         │  │ Date    Subject              Audience │  │
│  Fees          │  │ Apr 12  Practice Saturday    Club     │  │
│  Payments      │  │ Apr 8   Jersey orders due    Club     │  │
│  Announcements │  │ Mar 30  Board meeting notes  Board    │  │
│  Tournaments   │  │ Mar 15  CC1 squad update     Team     │  │
│  Documents     │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```

New Announcement modal:
```
  ┌────────────────────────────────┐
  │ New Announcement               │
  │ Subject: [___________________] │
  │ Message: [                   ] │
  │                                │
  │ Send to:                       │
  │ ● Whole Club                   │
  │ ○ Specific Team  [CC1 ▾]       │
  │ ○ Board Only                   │
  │                                │
  │ [Send]           [Cancel]      │
  └────────────────────────────────┘
```
- Sent via Resend email, logged in DB
- No in-app feed in MVP

---

## Screen 14 — Tournament Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Tournaments              [+ New Tournament]│
│  Members       │                                             │
│  Seasons       │  Season: [2025 ▾]                          │
│  Teams         │                                             │
│  Fees          │  ┌──────────────────────────────────────┐  │
│  Payments      │  │ Name              Dates       Status  │  │
│  Announcements │  │ Spring League     Apr–Jun     Active  │  │
│  Tournaments   │  │ Summer Cup        Jul–Aug     Upcoming│  │
│  Documents     │  │ Fall Invitational Sep–Oct     Upcoming│  │
│                │  └──────────────────────────────────────┘  │
└────────────────┴─────────────────────────────────────────────┘
```
- Tournaments are club-wide (all teams), not team-specific
- Multiple tournaments per season supported

---

## Screen 15 — Document Management (board)

```
┌──────────────────────────────────────────────────────────────┐
│  myclub-os                              Prudhvi  ▾  Logout   │
├────────────────┬─────────────────────────────────────────────┤
│  Dashboard     │  Documents                  [+ Upload Doc] │
│  Members       │                                             │
│  Seasons       │  ┌──────────────────────────────────────┐  │
│  Teams         │  │ Title                  Category Actions│  │
│  Fees          │  │ CC Bylaws 2024         Bylaws  [Delete]│  │
│  Payments      │  │ Member Code of Conduct CoC    [Delete] │  │
│  Announcements │  │ Jersey Sizing Guide    Other  [Delete] │  │
│  Tournaments   │  └──────────────────────────────────────┘  │
│  Documents     │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

Upload modal:
```
  ┌────────────────────────────────┐
  │ Upload Document                │
  │ Title:    [_________________]  │
  │ Category: [Bylaws ▾]           │
  │ File:     [Choose File]        │
  │                                │
  │ [Upload]         [Cancel]      │
  └────────────────────────────────┘
```
