# Migrations

This is Alembic scaffolding (`env.py`, `script.py.mako`, `alembic.ini` at
`backend/alembic.ini`) wired to `app.config.settings.DATABASE_URL` and the
existing SQLAlchemy models.

**There is no baseline revision committed yet.** Generating one requires
introspecting a real, running database, which needs both Python and a live
Postgres instance -- neither was available in the sandbox these fixes were
written in, so it was not safe to hand-author a baseline file blind (a wrong
column type or constraint would be worse than no migration at all: it would
look authoritative while being incorrect).

To create the baseline against your real database:

```bash
cd backend
alembic revision --autogenerate -m "baseline"
alembic upgrade head
```

Review the generated file before committing it -- autogenerate does not
always get server defaults, check constraints, or index names exactly right.

The ad-hoc `ALTER TABLE ... IF NOT EXISTS` block in `app/main.py` is left in
place for now so existing deployments upgrade cleanly without needing to run
Alembic first. Once the baseline revision above is committed and every
environment has been migrated onto it, that block can be deleted and all
future schema changes should go through `alembic revision --autogenerate`
instead.
