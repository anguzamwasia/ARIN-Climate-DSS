"""
Regression tests for the auth/authorization fixes:
- signup whitelist is actually enforced (was previously dead code)
- admin/write routes require a real bearer token with role="admin"
  (previously every route except /auth/me had no auth check at all)
- notifications are scoped to the authenticated caller
  (previously any caller-supplied ?email= was trusted)
"""


def test_signup_rejects_email_not_on_whitelist(client):
    res = client.post("/api/v1/auth/signup", json={
        "name": "Nobody",
        "email": "not-on-the-list@example.com",
        "password": "irrelevant-123",
    })
    assert res.status_code == 403


def test_signup_promotes_configured_admin_email(client):
    res = client.post("/api/v1/auth/signup", json={
        "name": "Admin",
        "email": "admin@arin-africa.org",
        "password": "test-password-123",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"


def test_signup_defaults_other_whitelisted_emails_to_user_role(client):
    res = client.post("/api/v1/auth/signup", json={
        "name": "Contributor",
        "email": "contributor@example.com",
        "password": "test-password-123",
    })
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "user"


def test_admin_stats_requires_auth(client):
    res = client.get("/api/v1/admin/users/stats")
    assert res.status_code == 401


def test_admin_stats_rejects_non_admin_user(client, user_token):
    res = client.get(
        "/api/v1/admin/users/stats",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 403


def test_admin_stats_allows_admin(client, admin_token):
    res = client.get(
        "/api/v1/admin/users/stats",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert "total_users" in res.json()


def test_notifications_requires_auth(client):
    res = client.get("/notifications")
    assert res.status_code == 401


def test_notifications_scoped_to_caller_not_query_param(client, user_token):
    # Previously this endpoint took `email` as a plain query parameter with no
    # check that it matched the caller -- anyone could read anyone else's
    # notifications. It no longer accepts an email override at all.
    res = client.get(
        "/notifications",
        params={"email": "someone-else@example.com"},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert res.status_code == 200
    assert res.json() == []


def test_analytics_overview_shape(client):
    res = client.get("/analytics/overview")
    assert res.status_code == 200
    body = res.json()
    for key in ("total_documents", "total_media", "total_blogs", "countries_covered"):
        assert key in body
