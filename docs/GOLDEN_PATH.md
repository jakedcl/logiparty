# GOLDEN_PATH.md — Pilot acceptance test

End-to-end flow the first paying 3PL must complete. QA and agents use this to verify MVP.

**Prerequisites:** Milestones M0–M4 complete (M5 availability optional).

---

## Characters

| Actor | Role |
|-------|------|
| Ed | OrgAdmin |
| Mike Oso | Manager |
| Don | Manager |
| Tom / Rob | Staff, `warehouse` tag |
| Paul / Jerome | Staff, `driver` tag |
| Michaela & Dom | Client users, same `client_company` (Red Bull); Michaela = POC |

---

## Steps

### Setup (M1)

1. **[ ]** Ed logs in at `nydac.logiparty.com` (no "Logiparty" in header).
2. **[ ]** Ed sets white-label: org name "New York Design and Construction", logo, primary color.
3. **[ ]** Ed invites Mike Oso as Manager (Don also seeded as Manager).
4. **[ ]** Mike invites Tom/Rob (`warehouse`) and Paul/Jerome (`driver`).
5. **[ ]** Mike creates client company **Red Bull** and invites two client users with titles (Michaela POC, Dom Rep).
6. **[ ]** Both client users complete invite and log into portal (org branding only).

### Catalogs (M2)

7. **[ ]** Mike adds client inventory: SKU `RB-BAR-01`, "Branded Bar", qty 10 (Red Bull).
8. **[ ]** Mike adds our inventory: "Dolly", qty 20.
9. **[ ]** Mike adds fleet: "Box Truck 12".
10. **[ ]** Michaela sees only Red Bull inventory in portal (not dollies or truck).

### Job request (M4)

11. **[ ]** Michaela submits **draft** job request: "Summer Festival Activation".
12. **[ ]** Mike sees draft in internal app and accepts → status **upcoming**.

### Job operations (M3)

13. **[ ]** Mike adds job locations (max 5): e.g. label "Warehouse" + label "Venue".
14. **[ ]** Mike assigns inventory: default shows Red Bull items; adds 5× `RB-BAR-01` and 2× Dolly.
15. **[ ]** Tom marks all lines **loaded** (qty loaded = assigned) at warehouse.
16. **[ ]** Mike assigns Box Truck 12 to job.
17. **[ ]** Mike assigns Tom (Laborer) load-in, Paul (Driver) load-out, sets **job lead** to Tom.
18. **[ ]** Job auto-transitions to **ready** (or Mike sets ready manually per DECISIONS).

### Staff & client (M3 + M4)

19. **[ ]** Paul opens **My Jobs** on phone — sees only this job, can see loaded status.
20. **[ ]** Dom uploads a PDF permit to the job from mobile.
21. **[ ]** Mike sees document on internal job detail.

### Close (M3)

22. **[ ]** Mike marks job **completed** after load-out window.
23. **[ ]** Inventory units are available for a new job (locks released).
24. **[ ]** Mike opens activity log — sees key actions (accept draft, assign crew, loaded, ready, upload).

---

## Failure cases to verify

| # | Case | Expected |
|---|------|----------|
| F1 | Paul tries URL of unassigned job | 403 or not listed |
| F2 | Red Bull user tries another client's job | 403 |
| F3 | Other org context guesses `test` job UUID | 403 / empty (RLS) |
| F4 | Assign same 10 bars to two overlapping upcoming jobs | Blocked or partial qty only |

---

## MVP mapping

| User requirement | Steps |
|------------------|-------|
| Create jobs | 11–12, 13 |
| Staff see assigned jobs | 19 |
| Client secure branded login | 6, 10, 20 |
| Mobile-friendly | 19, 20 |
