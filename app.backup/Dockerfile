FROM python:3.11-slim

WORKDIR /app

# System deps (optional, keep slim)
RUN python -m pip install --upgrade pip

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8501

# Streamlit defaults to listen on 8501
ENV STREAMLIT_SERVER_HEADLESS=true
ENV STREAMLIT_SERVER_PORT=8501
ENV STREAMLIT_SERVER_ADDRESS=0.0.0.0

CMD ["streamlit", "run", "dashboard.py"]
