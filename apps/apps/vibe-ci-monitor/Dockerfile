FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1

# Locked resolved versions (verified on PyPI) + binary-only install.
RUN pip install --no-cache-dir --only-binary=:all: \
    mistralai-workflows==3.17.0 \
    pydantic==2.12.5

COPY ci_monitor.py worker.py ./

# Non-root runtime user (sonarcloud S6471: default root user is a vulnerability).
RUN useradd --create-home --shell /usr/sbin/nologin appuser
USER appuser

CMD ["python", "worker.py"]
