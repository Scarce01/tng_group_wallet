@echo off
REM ============================================================
REM TNG Group Wallet — ML training pipeline (Windows)
REM Runs: setup venv -> install deps -> train classifier ->
REM       export ONNX -> generate synthetic -> train anomaly ->
REM       export anomaly ONNX -> evaluate
REM ============================================================
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo === [1/8] Checking Python ===
where python >nul 2>nul
if errorlevel 1 (
  echo ERROR: Python not on PATH. Install Python 3.11 from python.org and re-run.
  exit /b 1
)
python --version

echo.
echo === [2/8] Creating virtual environment ===
if not exist ".venv" (
  python -m venv .venv
  if errorlevel 1 (echo venv creation failed & exit /b 1)
)
call .venv\Scripts\activate.bat

echo.
echo === [3/8] Installing dependencies (~2GB, first run takes 5-10 min) ===
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 (echo pip install failed & exit /b 1)

echo.
echo === [4/8] Training transaction classifier (10-30 min CPU) ===
cd transaction_classifier
python train.py
if errorlevel 1 (echo classifier training failed & cd .. & exit /b 1)

echo.
echo === [5/8] Exporting classifier to ONNX ===
python export_onnx.py
if errorlevel 1 (echo classifier export failed & cd .. & exit /b 1)

echo.
echo === [6/8] Sanity-checking classifier predictions ===
python evaluate.py
cd ..

echo.
echo === [7/8] Generating synthetic data + training anomaly detector ===
cd anomaly_detector
python generate_synthetic.py
if errorlevel 1 (echo synthetic generation failed & cd .. & exit /b 1)
python train.py
if errorlevel 1 (echo anomaly training failed & cd .. & exit /b 1)

echo.
echo === [8/8] Exporting anomaly detector to ONNX ===
python export_onnx.py
if errorlevel 1 (echo anomaly export failed & cd .. & exit /b 1)
cd ..

echo.
echo ============================================================
echo   DONE. Artifacts:
echo     ml\transaction_classifier\models\tx_classifier.onnx
echo     ml\transaction_classifier\models\distilbert-tx-classifier\label_mapping.json
echo     ml\transaction_classifier\models\tokenizer\
echo     ml\anomaly_detector\models\anomaly_detector.onnx
echo     ml\anomaly_detector\models\anomaly_config.json
echo.
echo   Next: copy these into src\ml\models\ (see ml\README.md)
echo ============================================================
endlocal
