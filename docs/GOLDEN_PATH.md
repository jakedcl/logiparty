# GOLDEN_PATH.md — Pilot acceptance test

End-to-end flow the first paying 3PL must complete. QA and agents use this to verify MVP.

**Prerequisites:** Milestones M0–M4 complete (M5 availability optional).

---

## Characters

| Actor | Role |
|-------|------|
| Alex | OrgAdmin |
| Morgan | Manager |
| Sam | Staff, `warehouse` tag |
| Dana | Staff, `driver` tag |
| Red Bull Rep 1 & 2 | Client users, same `client_company` |

---

## Steps

### Setup (M1)

1. **[ ]** Alex logs in at `acme.logiparty.com` (no "Logiparty" in header).
2. **[ ]** Alex sets white-label: org name "Acme Logistics", logo, primary color.
3. **[ ]** Alex invites Morgan as Manager.
4. **[ ]** Morgan invites Sam (`warehouse`) and Dana (`driver`).
5. **[ ]** Morgan creates client company **Red Bull** and invites two client users with titles.
6. **[ ]** Both client users complete invite and log into portal (org branding only).

### Catalogs (M2)

7. **[ ]** Morgan adds client inventory: SKU `RB-BAR-01`, "Branded Bar", qty 10 (Red Bull).
8. **[ ]** Morgan adds our inventory: "Dolly", qty 20.
9. **[ ]** Morgan adds fleet: "Box Truck 12".
10. **[ ]** Red Bull Rep 1 sees only Red Bull inventory in portal (not dollies or truck).

### Job request (M4)

11. **[ ]** Red Bull Rep 1 submits **draft** job request: "Summer Festival Activation".
12. **[ ]** Morgan sees draft in internal app and accepts → status **upcoming**.

### Job operations (M3)

13. **[ ]** Morgan adds job locations (max 5): e.g. label "Warehouse" + label "Venue".
14. **[ ]** Morgan assigns inventory: default shows Red Bull items; adds 5× `RB-BAR-01` and 2× Dolly.
15. **[ ]** Sam marks all lines **loaded** (qty loaded = assigned) at warehouse.
16. **[ ]** Morgan assigns Box Truck 12 to job.
17. **[ ]** Morgan assigns Sam (Laborer) load-in, Dana (Driver) load-out, sets **job lead** to Sam.
18. **[ ]** Job auto-transitions to **ready** (or Morgan sets ready manually per DECISIONS).

### Staff & client (M3 + M4)

19. **[ ]** Dana opens **My Jobs** on phone — sees only this job, can see loaded status.
20. **[ ]** Red Bull Rep 2 uploads a PDF permit to the job from mobile.
21. **[ ]** Morgan sees document on internal job detail.

### Close (M3)

22. **[ ]** Morgan marks job **completed** after load-out window.
23. **[ ]** Inventory units are available for a new job (locks released).
24. **[ ]** Morgan opens activity log — sees key actions (accept draft, assign crew, loaded, ready, upload).

---

## Failure cases to verify

| # | Case | Expected |
|---|------|----------|
| F1 | Dana tries URL of unassigned job | 403 or not listed |
| F2 | Red Bull user tries another client's job | 403 |
| F3 | User from `demo` org guesses `acme` job UUID | 403 / empty (RLS) |
| F4 | Assign same 10 bars to two overlapping upcoming jobs | Blocked or partial qty only |

---

## MVP mapping

| User requirement | Steps |
|------------------|-------|
| Create jobs | 11–12, 13 |
| Staff see assigned jobs | 19 |
| Client secure branded login | 6, 10, 20 |
| Mobile-friendly | 19, 20 |
