-- Medical and Family / Childcare leave have no brought-forward or in-lieu
-- concept — drop those columns so the schema matches the UI.

alter table member_leave_balances
  drop column if exists carry_forward_medical,
  drop column if exists carry_forward_childcare,
  drop column if exists in_lieu_medical,
  drop column if exists in_lieu_childcare;
