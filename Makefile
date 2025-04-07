install:
	python3 -m venv venv && ./venv/bin/pip install -r requirements.txt

run:
	./venv/bin/python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

freeze:
	pip freeze > requirements.txt
