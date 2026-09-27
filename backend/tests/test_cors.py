"""
Confirms the CORS contract Phase 2 exists to satisfy: the deployed Vite dev
server origin (http://localhost:5173) can actually call the API from a
browser, not just from curl/pytest (which don't enforce CORS themselves).
"""
FRONTEND_ORIGIN = "http://localhost:5173"


def test_preflight_allows_frontend_origin(client):
    response = client.options(
        "/health",
        headers={
            "Origin": FRONTEND_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_actual_request_echoes_allow_origin_header(client):
    response = client.get("/health", headers={"Origin": FRONTEND_ORIGIN})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == FRONTEND_ORIGIN


def test_disallowed_origin_is_not_echoed(client):
    response = client.get("/health", headers={"Origin": "http://evil.example.com"})
    assert response.status_code == 200  # request still succeeds server-side...
    assert "access-control-allow-origin" not in response.headers  # ...but browser will block it
