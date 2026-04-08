# EdSchool – Bugs and Feature Enhancements

Running list of bugs and requested improvements. Add new items under the right section and update **Status** as you go.

---

## Bugs

| ID | Description | Status | Priority | Notes |
|----|-------------|--------|----------|--------|
| 1 | Parent Portal "Holidays" tile links to `/app/parent/holidays` but no route exists; parents get 404 or wrong page | Done | High | Fixed: link now points to `/app/holidays` |
| 2 | Transport page: `Select` component used with `options` prop but FormField Select expects children (option elements) | Done | High | Fixed: Transport now renders options as children |
| 3 | Transport page: `ConfirmDialog` used with `open` and `onCancel` but component expects `isOpen` and `onClose` | Done | High | Fixed: Transport now uses isOpen and onClose |
| 4 | Teachers unable to text students or a complete class: New message dropdown showed only teachers as recipients | Done | High | Fixed: recipients API now includes parents; added "Send to entire class" option |

## Feature Enhancements

| ID | Description | Status | Priority | Notes |
|----|-------------|--------|----------|--------|
| 1 | *(add enhancement description)* | Open | - | |

---

## How to use

- Add new bugs or enhancements as rows in the table above. Use **Status**: `Open` → `In progress` → `Done`. Optionally set **Priority** (e.g. High / Medium / Low) and **Notes** (links, assignee, date).
   