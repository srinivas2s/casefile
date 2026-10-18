import ast

from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app.main import app
from app.database import SessionLocal
from app.models import Execution

client = TestClient(app)


def test_health_check():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json()['status'] == 'ok'


def test_cors_rejects_untrusted_origins():
    response = client.options(
        '/api/health',
        headers={
            'Origin': 'https://untrusted.example',
            'Access-Control-Request-Method': 'GET',
        },
    )
    assert 'access-control-allow-origin' not in response.headers


def test_cors_allows_local_frontend():
    response = client.options(
        '/api/health',
        headers={
            'Origin': 'http://localhost:5173',
            'Access-Control-Request-Method': 'GET',
        },
    )
    assert response.headers['access-control-allow-origin'] == 'http://localhost:5173'


def test_investigation_lifecycle():
    payload = {
        'title': 'CSV processor retains blank rows',
        'bug_description': '<script>alert(1)</script> Blank CSV rows are returned as empty records.',
        'language': 'Python',
        'source_code': 'import csv\ndef process_csv(text):\n    return list(csv.reader(text.splitlines()))\n',
        'expected_behavior': 'Blank rows should be omitted from parsed records.',
        'actual_behavior': 'Blank rows are returned as empty records.',
        'steps_to_reproduce': 'Pass CSV text containing a blank line to process_csv.',
        'reproduction_input': 'name,age\nAda,37\n\nGrace,85\n',
    }

    create_response = client.post('/api/investigations', json=payload)
    assert create_response.status_code == 201
    created = create_response.json()
    assert created['title'] == payload['title']
    assert created['status'] == 'Draft'

    generation = client.post(f"/api/investigations/{created['id']}/generate-test")
    assert generation.status_code == 200
    assert 'Narrative preview only' in generation.json()['output']
    ast.parse(generation.json()['output'])
    repeated_generation = client.post(f"/api/investigations/{created['id']}/generate-test")
    assert repeated_generation.json()['output'] == generation.json()['output']
    assert client.get(f"/api/investigations/{created['id']}").json()['status'] == 'Draft'

    execution = client.post(f"/api/investigations/{created['id']}/run-test")
    assert execution.status_code == 200
    assert execution.json()['success'] is False
    assert execution.json()['result'] == 'error'
    assert 'No submitted source or test file was executed.' in execution.json()['output']

    listed = client.get(f"/api/investigations?search={created['id']}")
    assert listed.status_code == 200
    ids = [item['id'] for item in listed.json()]
    assert created['id'] in ids

    json_report = client.get(f"/api/investigations/{created['id']}/evidence.json")
    html_report = client.get(f"/api/investigations/{created['id']}/evidence.html")
    assert json_report.status_code == 200
    assert json_report.headers['content-disposition'].endswith('.json"')
    assert json_report.json()['investigation']['id'] == created['id']
    assert json_report.json()['executions'][0]['result'] == 'error'
    assert html_report.status_code == 200
    assert html_report.headers['content-disposition'].endswith('.html"')
    assert 'Execution history' in html_report.text
    assert '<script>alert(1)</script>' not in html_report.text
    assert '&lt;script&gt;alert(1)&lt;/script&gt;' in html_report.text

    dashboard = client.get('/api/dashboard')
    assert dashboard.status_code == 200
    assert dashboard.json()['total_investigations'] >= 1

    settings = client.get('/api/settings')
    assert settings.status_code == 200
    assert settings.json()['app_version'] == '0.1.0'
    assert 'Execution disabled' in settings.json()['testing_environment_status']

    verification = client.post(f"/api/investigations/{created['id']}/verify-fix")
    regression = client.post(f"/api/investigations/{created['id']}/run-regression")
    assert verification.json()['result'] == 'error'
    assert regression.json()['result'] == 'error'
    assert client.get(f"/api/investigations/{created['id']}").json()['status'] == 'Draft'


def test_sqlite_rejects_execution_for_missing_investigation():
    db = SessionLocal()
    try:
        db.add(Execution(
            investigation_id=-1,
            test_type='reproduction',
            result='error',
        ))
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
        else:
            raise AssertionError('SQLite accepted an execution without an investigation')
    finally:
        db.close()


def test_user_supplied_test_file_is_not_executed(tmp_path):
    sentinel = tmp_path / 'host-execution-marker.txt'
    untrusted_test = tmp_path / 'test_untrusted.py'
    untrusted_test.write_text(
        f"from pathlib import Path\nPath({str(sentinel)!r}).write_text('executed')\n",
        encoding='utf-8',
    )

    payload = {
        'title': 'Untrusted test file',
        'bug_description': 'A test file must never run directly on the host.',
        'language': 'Python',
        'source_code': 'def process(value):\n    return value\n',
        'expected_behavior': 'Return the value unchanged.',
        'actual_behavior': 'The behavior is unknown.',
        'steps_to_reproduce': 'Run the supplied test.',
        'existing_pytest_test_file': str(untrusted_test),
    }
    created = client.post('/api/investigations', json=payload).json()

    response = client.post(f"/api/investigations/{created['id']}/run-test")

    assert response.status_code == 200
    assert response.json()['result'] == 'error'
    assert sentinel.exists() is False
