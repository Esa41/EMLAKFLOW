FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ENV EMLAKFLOW_HOME=/app/data
RUN mkdir -p /app/data/samples /app/data/reports
CMD ["python", "-m", "emlakflow.pipeline", "--source", "synthetic", "--count", "400"]
