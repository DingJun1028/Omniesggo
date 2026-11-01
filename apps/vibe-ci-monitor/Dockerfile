FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

COPY ci_monitor.py worker.py ./

# Non-root runtime user (sonarcloud S6471: default root user is a vulnerability).
RUN useradd --create-home --shell /usr/sbin/nologin appuser
USER appuser

CMD ["python", "worker.py"]
